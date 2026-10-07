import { NextResponse } from "next/server";
import { processOutbox } from "@/shared/core/jobs/outbox-relay";
import { eventBus } from "@/shared/core/events/EventBus";
import { AnalyticsModule } from "@/modules/analytics/AnalyticsModule";
import { NotificationsModule } from "@/modules/notifications/NotificationsModule";
import { SupabaseNotificationRepository } from "@/modules/notifications/infrastructure/SupabaseNotificationRepository";
import { createSupabaseServerClient } from "@/shared/core/database/server";
import crypto from "crypto";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  // Fail-closed in production if CRON_SECRET is not configured
  if (process.env.NODE_ENV === "production" && !cronSecret) {
    console.error("[Cron process-outbox] Fatal misconfiguration: CRON_SECRET is not configured in production.");
    return NextResponse.json(
      { error: "Server misconfiguration: CRON_SECRET missing" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.substring(7).trim();
  if (!cronSecret || !timingSafeEqualStr(token, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Register handlers before processing
  await AnalyticsModule.registerEventHandlers(eventBus);

  const supabase = await createSupabaseServerClient();
  const notificationRepository = new SupabaseNotificationRepository(supabase);
  await NotificationsModule.registerEventHandlers(eventBus, notificationRepository);

  const result = await processOutbox(eventBus);

  return NextResponse.json(result);
}
