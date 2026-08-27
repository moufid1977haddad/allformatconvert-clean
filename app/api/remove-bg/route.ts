import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const formData = new FormData();
    formData.append("image_file_b64", image);
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.REMOVEBG_API_KEY || "",
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 402 || response.status === 429) {
        await sendAlert("remove.bg", String(response.status));
        return NextResponse.json(
          { error: "This tool is temporarily at capacity. Please try again later." },
          { status: 503 }
        );
      }
      const err = await response.json();
      return NextResponse.json({ error: err.errors?.[0]?.title || "remove.bg error" }, { status: 500 });
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return NextResponse.json({ image: base64 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}