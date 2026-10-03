import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";

export const maxDuration = 30;

// P30 (04/10): one test alert on both channels (ntfy push to the owner's phone + email), run on demand with
// `vercel crons run /api/cron/alert-test` (Vercel calls it with the CRON_SECRET bearer, which nobody has to handle) and
// once a year by its schedule (vercel.json) as a check that the channel still works. The function log line gives what
// each channel answered -- never the topic or an address.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await sendAlert("test", "manual_trigger");
  console.log(`[alert-test] ntfy=${result.ntfy} email=${result.email}`);
  return NextResponse.json({ sent: result });
}
