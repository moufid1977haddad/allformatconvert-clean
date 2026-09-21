// Shared wrapper for the API routes that accept a document through the staged (chunked, direct-to-service)
// path as well as the legacy multipart body. The route's own conversion code is called UNCHANGED with a
// File read from the service, so quota, spend guard, provider selection, checks and error mapping are
// identical on both paths; only the transport of the input and of the result differs.
import { NextRequest, NextResponse } from "next/server";
import { openStaged, readSource, depositOutput, discard } from "./staged";

export function isStagedRequest(req: NextRequest): boolean {
  return (req.headers.get("content-type") || "").toLowerCase().startsWith("application/json");
}

export async function respondStaged(
  req: NextRequest,
  outExt: "pdf" | "docx",
  produce: (file: File) => Promise<NextResponse>,
  errorShape: (message: string) => Record<string, unknown> = (message) => ({ error: message }),
): Promise<NextResponse> {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(errorShape("Invalid request."), { status: 400 });
  }
  const h: any = openStaged(body);
  if (!h.ok) return NextResponse.json(errorShape(h.error), { status: h.status });

  const src: any = await readSource(h);
  if (!src.ok) {
    await discard(h);
    return NextResponse.json(errorShape(src.error), { status: src.status });
  }

  let res: NextResponse;
  try {
    res = await produce(new File([src.buffer], h.filename || "document"));
  } catch (err) {
    await discard(h);
    throw err;
  }
  // Any refusal or failure of the conversion (quota, size, provider error...) is returned exactly as the
  // legacy path would, and the staged source is destroyed straight away.
  if (!res.ok) {
    await discard(h);
    return res;
  }

  const bytes = new Uint8Array(await res.arrayBuffer());
  const dep: any = await depositOutput(h, bytes, outExt);
  if (!dep.ok) {
    await discard(h);
    return NextResponse.json(errorShape(dep.error), { status: dep.status });
  }
  const fonts = res.headers.get("X-Detected-Symbol-Fonts");
  return NextResponse.json(
    { ok: true, jid: h.jid, outputBytes: dep.outputBytes, ext: outExt, detectedFonts: fonts ? fonts.split(",") : [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
