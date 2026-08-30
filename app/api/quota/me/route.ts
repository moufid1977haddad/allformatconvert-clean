import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserQuotaRemaining } from "@/lib/quota/userQuota";

const VALID_BUCKETS = ["pdf_conversions", "images"];

export async function GET(req: NextRequest) {
  const bucket = new URL(req.url).searchParams.get("bucket");
  if (!bucket || !VALID_BUCKETS.includes(bucket)) {
    return NextResponse.json({ error: "Invalid or missing bucket parameter." }, { status: 400 });
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  // Verifies the JWT against Supabase Auth itself -- a client-supplied user
  // id is never trusted; the anon key is sufficient to validate a token,
  // it just can't be used to read another user's data (which this route
  // never does -- it always reads the token's own subject).
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: userData, error: userError } = await anonClient.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const result = await getUserQuotaRemaining(userData.user.id, bucket);
  return NextResponse.json(result);
}
