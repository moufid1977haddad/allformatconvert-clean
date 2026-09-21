// Shared wrapper for the API routes that accept a document through the staged (chunked, direct-to-service)
// path as well as the legacy multipart body. The route's own conversion code is called UNCHANGED with a
// File read from the service, so quota, spend guard, provider selection, checks and error mapping are
// identical on both paths; only the transport of the input and of the result differs.
import { NextRequest, NextResponse } from "next/server";
import { openStaged, readSource, depositOutput, discard } from "./staged";

export function isStagedRequest(req: NextRequest): boolean {
  return (req.headers.get("content-type") || "").toLowerCase().startsWith("application/json");
}

/**
 * The converted file as the route's answer. Direct requests get the file itself; staged requests get an
 * empty 200 that only CARRIES the bytes (`rawBody`) to respondStaged, so a result of hundreds of MB is not
 * copied again into a Response body (the function's memory is the ceiling of the staged path).
 */
export function fileResponse(bytes: Uint8Array | ArrayBuffer, headers: Record<string, string>, staged: boolean): NextResponse {
  if (!staged) return new NextResponse(bytes as BodyInit, { status: 200, headers });
  const r = new NextResponse(null, { status: 200, headers });
  (r as any).rawBody = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return r;
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
    res = await produce(new File([src.blob], h.filename || "document"));
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

  const bytes: Uint8Array = (res as any).rawBody ?? new Uint8Array(await res.arrayBuffer());
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

/**
 * Staged INPUT, inline JSON answer (e.g. a transcript): the route reads the staged file server-to-server,
 * runs its own unchanged handler and returns that handler's response as is; the staged file is destroyed
 * as soon as the handler is done, whatever the outcome.
 */
export async function respondStagedInline(
  req: NextRequest,
  produce: (file: File, body: any) => Promise<NextResponse>,
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
  try {
    return await produce(new File([src.blob], h.filename || "audio"), body);
  } finally {
    await discard(h);
  }
}

/**
 * Staged INPUT for the tools whose service answers JSON with the result as base64 in `file` (PDF repair,
 * PDF/A). The base64 (+33 %) would hit the ~4.5 MB Vercel RESPONSE ceiling, so the route decodes it,
 * deposits the PDF on the media service and answers the same JSON WITHOUT `file`, plus `staged` and
 * `outputBytes`; the browser downloads the PDF from the service.
 */
export async function respondStagedPdfJson(
  req: NextRequest,
  produce: (file: File, body: any) => Promise<NextResponse>,
): Promise<NextResponse> {
  const errorShape = (message: string) => ({ ok: false, error: message });
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
    res = await produce(new File([src.blob], h.filename || "document.pdf"), body);
  } catch (err) {
    await discard(h);
    throw err;
  }
  let data: any = null;
  try {
    data = JSON.parse(await res.text());
  } catch {
    data = null;
  }
  if (!data || !data.ok || typeof data.file !== "string") {
    // A refusal or a report without a file (e.g. "could not be repaired"): returned as the legacy path would.
    await discard(h);
    return NextResponse.json(data ?? errorShape("The service returned an unexpected response."), { status: res.status });
  }
  const bytes = new Uint8Array(Buffer.from(data.file, "base64"));
  delete data.file;
  const dep: any = await depositOutput(h, bytes, "pdf");
  if (!dep.ok) {
    await discard(h);
    return NextResponse.json(errorShape(dep.error), { status: dep.status });
  }
  return NextResponse.json({ ...data, staged: true, jid: h.jid, outputBytes: dep.outputBytes }, { headers: { "Cache-Control": "no-store" } });
}
