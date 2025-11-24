import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Url from "@/lib/models/Url";
import crypto from "crypto";
import { redis } from "@/lib/redis";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  await connectDB();

  try {
    const ip =
      req.headers.get("x-forwarded-for") || req.headers.get("host") || "anon";

    const { allowed, reset } = await rateLimit(`rl:${ip}`, 10, 60);
    if (!allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${reset}s` },
        { status: 429 }
      );
    }

    const { originalUrl, customCode } = await req.json();

    if (!originalUrl) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    let shortCode = customCode?.trim();

    if (shortCode) {
      const exists = await Url.findOne({ shortCode });
      if (exists) {
        return NextResponse.json(
          { error: "Custom code already taken" },
          { status: 400 }
        );
      }
    } else {
      shortCode = crypto.randomBytes(3).toString("hex");
    }

    const newEntry = await Url.create({ originalUrl, shortCode });

    await redis.set(shortCode, originalUrl, { ex: 60 * 60 * 24 * 30 });

    return NextResponse.json({
      shortCode: newEntry.shortCode,
      originalUrl: newEntry.originalUrl,
      expiresAt: newEntry.expiresAt,
    });
  } catch (err: unknown) {
    if (err instanceof Error)
      return NextResponse.json({ error: err.message }, { status: 500 });
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
