import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Url from "@/lib/models/Url";
import { redis } from "@/lib/redis";

interface Params {
  shortCode: string;
}

export async function GET(
  req: Request,
  context: { params: Params | Promise<Params> }
) {
  const params = await context.params;
  const { shortCode } = params;

  const cached = await redis.get(shortCode);

  if (cached) {
    await connectDB();

    const urlEntry = await Url.findOne({ shortCode });

    if (urlEntry) {
      const today = new Date().toISOString().slice(0, 10);

      urlEntry.clickCount += 1;
      if (urlEntry.lastClickDate === today) {
        urlEntry.clicksToday += 1;
      } else {
        urlEntry.clicksToday = 1;
        urlEntry.lastClickDate = today;
      }

      await urlEntry.save();
    }

    return NextResponse.redirect(cached as string);
  }

  await connectDB();
  const url = await Url.findOne({ shortCode });

  if (!url) {
    return NextResponse.json({ error: "Short URL not found" }, { status: 404 });
  }

  // Expiry check
  if (new Date() > url.expiresAt) {
    return NextResponse.json({ error: "Short URL expired" }, { status: 410 });
  }

  await redis.set(shortCode, url.originalUrl, { ex: 2592000 });

  const today = new Date().toISOString().slice(0, 10);
  url.clickCount += 1;

  if (url.lastClickDate === today) {
    url.clicksToday += 1;
  } else {
    url.clicksToday = 1;
    url.lastClickDate = today;
  }

  await url.save();

  // Redirect user
  return NextResponse.redirect(url.originalUrl);
}
