import { NextRequest, NextResponse } from "next/server";

// Give the Gotenberg round-trip (up to GOTENBERG_TIMEOUT_MS below) enough
// headroom inside the function's own execution budget.
export const maxDuration = 60;

const GOTENBERG_TIMEOUT_MS = 30_000;

// Vercel Functions accept request bodies up to 100 MB, so this app-level
// limit is a deliberately stricter policy, not a workaround for a platform
// ceiling.
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set(["docx", "doc", "xlsx", "xls", "csv", "pptx", "ppt"]);

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx + 1).toLowerCase();
}

export async function POST(req: NextRequest) {
  const gotenbergUrl = process.env.GOTENBERG_URL;
  const gotenbergUsername = process.env.GOTENBERG_USERNAME;
  const gotenbergPassword = process.env.GOTENBERG_PASSWORD;

  if (!gotenbergUrl || !gotenbergUsername || !gotenbergPassword) {
    // Deliberately do not include the values above in this message.
    return NextResponse.json({ error: "Conversion service is not configured." }, { status: 500 });
  }

  let file: File;
  try {
    const formData = await req.formData();
    const uploaded = formData.get("file");
    if (!uploaded || !(uploaded instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    file = uploaded;
  } catch {
    return NextResponse.json({ error: "Invalid multipart/form-data request." }, { status: 400 });
  }

  const extension = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: .docx, .doc, .xlsx, .xls, .csv, .pptx, .ppt" },
      { status: 400 }
    );
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File is too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.` },
      { status: 413 }
    );
  }

  const gotenbergForm = new FormData();
  gotenbergForm.append("files", file, file.name);

  const authHeader = "Basic " + Buffer.from(`${gotenbergUsername}:${gotenbergPassword}`).toString("base64");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GOTENBERG_TIMEOUT_MS);

  let gotenbergResponse: Response;
  try {
    gotenbergResponse = await fetch(`${gotenbergUrl.replace(/\/+$/, "")}/forms/libreoffice/convert`, {
      method: "POST",
      headers: { Authorization: authHeader },
      body: gotenbergForm,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return NextResponse.json({ error: "Conversion timed out. Try a smaller file." }, { status: 504 });
    }
    // Log only the failure kind, never credentials or the auth header.
    console.error("Gotenberg request failed:", err?.message || "unknown error");
    return NextResponse.json({ error: "Could not reach the conversion service." }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!gotenbergResponse.ok) {
    if (gotenbergResponse.status === 401 || gotenbergResponse.status === 403) {
      console.error("Gotenberg rejected the request: authentication failed (status " + gotenbergResponse.status + ")");
      return NextResponse.json({ error: "Conversion service authentication failed." }, { status: 502 });
    }
    const bodyText = await gotenbergResponse.text().catch(() => "");
    console.error("Gotenberg conversion error:", gotenbergResponse.status, bodyText.slice(0, 500));
    return NextResponse.json(
      { error: "Conversion failed. The document may be corrupted or in an unsupported format." },
      { status: 502 }
    );
  }

  const pdfBuffer = await gotenbergResponse.arrayBuffer();
  const bytes = new Uint8Array(pdfBuffer);
  const isPdf = bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  if (!isPdf) {
    console.error("Gotenberg returned a non-PDF response despite a 2xx status.");
    return NextResponse.json({ error: "Conversion service returned an unexpected response." }, { status: 502 });
  }

  const outName = file.name.replace(/\.[^.]+$/, "") + ".pdf";
  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${outName.replace(/"/g, "")}"`,
    },
  });
}
