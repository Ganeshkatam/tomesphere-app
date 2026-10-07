import { IEventBus } from "../../core/events/types";
import { WorkerDatabaseClient } from "@/shared/infrastructure/database/WorkerDatabaseClient";

const MAX_RETRIES = parseInt(process.env.OUTBOX_MAX_RETRIES || "3", 10);

/**
 * Outbox Relay
 *
 * Polls `outbox_events` for pending events with fenced leases, dispatches them to the
 * in-memory EventBus, and marks them as completed via internal scoped capabilities.
 *
 * Design decisions:
 * - Uses `WorkerDatabaseClient` via direct PostgreSQL connection using `tomesphere_worker` role.
 * - Invokes `internal.claim_outbox_events` RPC for safe concurrent claiming with lease fencing (FOR UPDATE SKIP LOCKED).
 * - Invokes `internal.complete_outbox_event` RPC for state transitions with lease validation.
 * - Never mutates `public.outbox_events` directly.
 * - Does NOT use SUPABASE_SERVICE_ROLE_KEY or PostgREST Data API.
 */

export interface OutboxRelayResult {
  processed: number;
  failed: number;
  deadLetter: number;
}

export async function processOutbox(
  eventBus: IEventBus,
  workerIdentity: string = `worker-${process.pid || "node"}`,
): Promise<OutboxRelayResult> {
  // 1. Claim pending events atomically with fenced lease
  let events;
  try {
    events = await WorkerDatabaseClient.claimOutboxEvents(50, workerIdentity, 300);
  } catch (claimError: unknown) {
    const message = claimError instanceof Error ? claimError.message : String(claimError);
    console.error(
      "[Outbox Relay] Failed to claim events via WorkerDatabaseClient:",
      message,
    );
    return { processed: 0, failed: 0, deadLetter: 0 };
  }

  if (!events || events.length === 0) {
    return { processed: 0, failed: 0, deadLetter: 0 };
  }

  let processed = 0;
  let failed = 0;
  let deadLetter = 0;

  // 2. Process each claimed event
  for (const event of events) {
    try {
      const eventType = event.event_type as keyof import("../../core/events/types").EventPayloads;
      const payload = event.payload as import("../../core/events/types").EventPayloads[typeof eventType];

      eventBus.emit(eventType, payload);

      // 3. Mark as processed via fenced complete RPC
      await WorkerDatabaseClient.completeOutboxEvent(
        event.id,
        event.lease_id,
        "processed",
      );

      processed++;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      const newRetryCount = (event.retry_count || 0) + 1;
      // Invariant: When the resulting retry count reaches or exceeds MAX_RETRIES (3), the worker
      // must transition directly to 'dead_letter'; 'failed' is permitted only when retry_count remains strictly < 3.
      const isDeadLetter = newRetryCount >= MAX_RETRIES;

      try {
        await WorkerDatabaseClient.completeOutboxEvent(
          event.id,
          event.lease_id,
          isDeadLetter ? "dead_letter" : "failed",
          errorMsg,
        );
      } catch (completeErr: unknown) {
        const fenceMsg = completeErr instanceof Error ? completeErr.message : String(completeErr);
        console.error(
          `[Outbox Relay] Lease fencing violation or completion failure for event ${event.id}:`,
          fenceMsg,
        );
      }

      if (isDeadLetter) {
        console.error(
          `[Outbox Relay] Permanently failed event ${event.id} (transitioned to dead_letter): ${errorMsg}`,
        );
        deadLetter++;
      } else {
        console.warn(
          `[Outbox Relay] Retryable failure for event ${event.id} (attempt ${newRetryCount}/${MAX_RETRIES}): ${errorMsg}`,
        );
        failed++;
      }
    }
  }

  console.log(
    `[Outbox Relay] Batch complete: ${processed} processed, ${failed} failed, ${deadLetter} dead letter`,
  );

  return { processed, failed, deadLetter };
}

/**
 * Returns operational metrics for monitoring from internal.get_outbox_metrics.
 */
export async function getOutboxMetrics() {
  try {
    return await WorkerDatabaseClient.getOutboxMetrics();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Outbox Relay] Failed to fetch outbox metrics:", message);
    return null;
  }
}
