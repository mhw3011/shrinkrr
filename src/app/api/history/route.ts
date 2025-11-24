import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Url from "@/lib/models/Url";

export async function GET(req: Request) {
  await connectDB();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1"); // default page 1
    const limit = 8;

    const now = new Date();

    // Fetch non-expired URLs, newest first
    const urls = await Url.find({ expiresAt: { $gt: now } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const history = urls.map((u) => {
      return {
        original: u.originalUrl,
        short: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/${u.shortCode}`,
        clickCount: u.clickCount,
        clicksToday: u.clicksToday,
      };
    });

    return NextResponse.json(history);
  } catch (err: unknown) {
    if (err instanceof Error)
      return NextResponse.json({ error: err.message }, { status: 500 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
