import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";
import { guardPaidRoute } from "@/lib/quota/guard";
import { MAX_AUDIO_UPLOAD_BYTES } from "@/lib/quota/limits";
import { actualAiTranscribeCostMicros } from "@/lib/quota/config";
import { alertServerError } from "@/lib/quota/errorAlerts";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const tool = formData.get("tool") as string | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (file.size > MAX_AUDIO_UPLOAD_BYTES) {
      const maxMb = (MAX_AUDIO_UPLOAD_BYTES / (1024 * 1024)).toFixed(0);
      return NextResponse.json({ error: `Audio files are limited to ${maxMb} MB.` }, { status: 400 });
    }

    const guard = await guardPaidRoute(req, { route: "ai-transcribe", tool: tool || undefined });
    if (!guard.ok) return guard.response;

    try {
      const openaiForm = new FormData();
      openaiForm.append("file", file);
      openaiForm.append("model", "whisper-1");
      // verbose_json adds a real `duration` (seconds) to the response, used
      // below to reconcile the worst-case reservation down to the actual
      // cost -- `text` is still present, so the client-facing shape (only
      // `data.text` is ever returned to the browser) is unchanged.
      openaiForm.append("response_format", "verbose_json");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: openaiForm,
      });

      // Release/commit boundary: release() only when OpenAI never actually
      // responded (nothing could have been billed). Once a response
      // exists, any failure to read it (including here, where the body
      // fails to parse) must never release -- a 2xx response means the
      // call was very likely already billed, so an unreadable body is
      // treated as a real, unknown cost via commit(null), never as zero.
      let data: any;
      try {
        data = await response.json();
      } catch (parseErr: any) {
        if (response.ok) {
          await guard.commit(null);
          await alertServerError("ai-transcribe", "response.ok but body failed to parse: " + (parseErr?.message || parseErr));
        } else {
          await guard.release();
          await alertServerError("ai-transcribe", "error response body failed to parse: " + (parseErr?.message || parseErr));
        }
        return NextResponse.json({ error: "API error" }, { status: 500 });
      }

      if (!response.ok) {
        await guard.release();
        if (response.status === 429) {
          await sendAlert("openai", data?.error?.code || "429");
          return NextResponse.json(
            { error: "This tool is temporarily at capacity. Please try again later." },
            { status: 503 }
          );
        }
        return NextResponse.json({ error: data?.error?.message || "API error" }, { status: 500 });
      }
      // `data?.` everywhere below: response.json() can resolve without
      // throwing to a non-object value (e.g. a literal `null` body) --
      // that's not a parse failure, so it skips the catch above, but
      // `data.duration` would still throw before guard.commit() ever runs,
      // landing in the outer catch's release() and undercounting a
      // response.ok call that was almost certainly already billed. `?.`
      // makes actualAiTranscribeCostMicros() see `undefined` and return
      // null, which guard.commit(null) already treats as a real, unknown
      // cost -- never released.
      await guard.commit(actualAiTranscribeCostMicros(data?.duration));
      return NextResponse.json({ text: data?.text || "" });
    } catch (err: any) {
      // Reaches here only when fetch() itself throws (network failure,
      // DNS, timeout) before OpenAI ever responds -- no response ever
      // existed, so nothing could have been billed. Any failure *after* a
      // response exists (including an unparseable body) is handled above,
      // specifically to keep that release() here always true to "nothing
      // was billed" -- see the boundary comment above the inner try/catch.
      // (If commit() above already settled the reservation before this
      // catch is somehow still reached, guard.release() below is a safe
      // no-op -- see guard.js's `settled` flag.)
      await guard.release();
      console.error("Unhandled error in /api/ai-transcribe (post-guard):", err?.message || err);
      await alertServerError("ai-transcribe", err?.message || String(err));
      return NextResponse.json({ error: err?.message || "API error" }, { status: 500 });
    }
  } catch (e: any) {
    console.error("Unhandled error in /api/ai-transcribe:", e?.message || e);
    await alertServerError("ai-transcribe", e?.message || String(e));
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
