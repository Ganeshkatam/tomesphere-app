import { Pool, QueryResultRow } from "pg";

/**
 * WorkerDatabaseClient
 * 
 * Infrastructure client for trusted server-side background workers and cron jobs.
 * Connects directly to PostgreSQL via TOMESPHERE_WORKER_DATABASE_URL using the 
 * narrowly-privileged 'tomesphere_worker' role.
 * 
 * Design & Security Principles:
 * - Does NOT use SUPABASE_SERVICE_ROLE_KEY or PostgREST Data API.
 * - Invokes unexposed capability functions in the 'internal' database schema.
 * - Enforces lease fencing on outbox completion to prevent split-brain / state corruption.
 * - Configured with connection pooling suitable for Supavisor transaction poolers.
 */

declare global {
  // Prevent multiple pool instances during Next.js hot reloading in dev
  var __tomesphereWorkerPool: Pool | undefined;
}

function getWorkerPool(): Pool {
  const connectionString = process.env.TOMESPHERE_WORKER_DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "[WorkerDatabaseClient] Missing TOMESPHERE_WORKER_DATABASE_URL environment variable."
    );
  }

  if (!globalThis.__tomesphereWorkerPool) {
    const isProduction = process.env.NODE_ENV === "production";
    
    globalThis.__tomesphereWorkerPool = new Pool({
      connectionString,
      max: 3, // Bounded pool size for serverless execution
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: isProduction || process.env.DATABASE_SSL === "true" 
        ? { rejectUnauthorized: false } 
        : undefined,
    });
  }

  return globalThis.__tomesphereWorkerPool;
}

export interface ClaimedOutboxEvent {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  event_version: number;
  payload: Record<string, unknown>;
  occurred_at: string;
  status: string;
  retry_count: number;
  last_error: string | null;
  created_at: string;
  processed_at: string | null;
  claimed_at: string | null;
  lease_id: string;
  lease_expires_at: string | null;
  claimed_by: string | null;
}

export interface OutboxStatusMetrics {
  pending: number;
  processing: number;
  processed: number;
  failed: number;
  deadLetter: number;
}

export class WorkerDatabaseClient {
  private static get pool(): Pool {
    return getWorkerPool();
  }

  /**
   * Atomically claims pending or failed outbox events with a fenced lease using internal.claim_outbox_events
   */
  static async claimOutboxEvents(
    limitCount: number = 50,
    workerIdentity: string = "tomesphere-relay",
    leaseDurationSeconds: number = 300,
  ): Promise<ClaimedOutboxEvent[]> {
    const query = `
      SELECT id, aggregate_type, aggregate_id, event_type, event_version, 
             payload, occurred_at, status, retry_count, last_error, 
             created_at, processed_at, claimed_at, lease_id, lease_expires_at, claimed_by
      FROM internal.claim_outbox_events($1, $2, $3);
    `;
    const res = await this.pool.query<ClaimedOutboxEvent>(query, [
      limitCount,
      workerIdentity,
      leaseDurationSeconds,
    ]);
    return res.rows;
  }

  /**
   * Completes an outbox event with a fenced lease check via internal.complete_outbox_event
   */
  static async completeOutboxEvent(
    eventId: string,
    leaseId: string,
    status: "processed" | "failed" | "dead_letter",
    error: string | null = null,
  ): Promise<ClaimedOutboxEvent> {
    const query = `
      SELECT id, status, retry_count, processed_at, last_error
      FROM internal.complete_outbox_event($1, $2, $3, $4);
    `;
    const res = await this.pool.query<ClaimedOutboxEvent>(query, [
      eventId,
      leaseId,
      status,
      error,
    ]);
    return res.rows[0];
  }

  /**
   * Fetches aggregate metrics from internal.get_outbox_metrics
   */
  static async getOutboxMetrics(): Promise<OutboxStatusMetrics> {
    const query = `SELECT status, event_count FROM internal.get_outbox_metrics();`;
    const res = await this.pool.query<{ status: string; event_count: string }>(query);

    const counts: Record<string, number> = {};
    for (const row of res.rows) {
      counts[row.status] = parseInt(row.event_count, 10);
    }

    return {
      pending: counts["pending"] || 0,
      processing: counts["processing"] || 0,
      processed: counts["processed"] || 0,
      failed: counts["failed"] || 0,
      deadLetter: counts["dead_letter"] || 0,
    };
  }

  /**
   * Executes a parameterized query against internal capability functions
   */
  static async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ) {
    return this.pool.query<T>(text, params);
  }
}
