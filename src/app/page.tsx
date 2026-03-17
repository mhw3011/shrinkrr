"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clipboard, Check, Link as LinkIcon } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import Image from "next/image";
import logo from "@/assets/logo.png";

type UrlItem = {
  original: string;
  short: string;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<UrlItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("urlHistory");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveHistory = (newHistory: UrlItem[]) => {
    setHistory(newHistory);
    localStorage.setItem("urlHistory", JSON.stringify(newHistory));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCopied(false);
    setError("");

    if (!url.trim()) return setError("URL cannot be empty.");

    setLoading(true);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl: url, customCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const full = `${window.location.origin}/${data.shortCode}`;
      setShortUrl(full);

      const newHistory = [{ original: url, short: full }, ...history].slice(
        0,
        8,
      );
      saveHistory(newHistory);

      setUrl("");
      setCustomCode("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    }

    setLoading(false);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* ===== NAVBAR (NO GLASS EFFECT) ===== */}
      <header className="w-full border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center">
          <div className="flex items-center gap-3">
            <Image src={logo} alt="Logo" width={36} height={36} />
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-300 bg-clip-text text-transparent">
              shrinkrr://
            </span>
          </div>
        </div>
      </header>

      {/* ===== HERO TOOL SECTION ===== */}
      {/* pb-28 prevents fixed footer overlap */}
      <main className="flex-1 flex flex-col items-center justify-start px-6 py-14 pb-28">
        <h1 className="text-4xl font-extrabold mb-3 text-center">
          Shorten links. Share smarter.
        </h1>

        <p className="text-gray-600 mb-10 text-center max-w-xl">
          Create clean, trackable short URLs instantly with optional custom
          codes and QR sharing.
        </p>

        {/* ===== MAIN TOOL CARD ===== */}
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl p-8 border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Paste your long URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-12 text-base"
            />

            <Input
              placeholder="Custom short code (optional)"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              className="h-11"
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button
              type="submit"
              className="w-full h-12 text-base bg-orange-500 hover:bg-orange-600 text-white"
              disabled={loading}
            >
              {loading ? "Generating..." : "Create Short Link"}
            </Button>
          </form>

          {/* ===== RESULT PANEL ===== */}
          {shortUrl && (
            <div className="mt-8 grid md:grid-cols-2 gap-6 items-center bg-gray-50 border rounded-2xl p-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Your shortened link
                </p>

                <a
                  href={shortUrl}
                  target="_blank"
                  className="text-orange-500 font-semibold break-all flex items-center gap-2 mb-4"
                >
                  <LinkIcon size={16} />
                  {shortUrl}
                </a>

                <Button
                  onClick={() => copyToClipboard(shortUrl)}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {copied ? <Check size={16} /> : <Clipboard size={16} />}
                  <span className="ml-2">{copied ? "Copied!" : "Copy"}</span>
                </Button>
              </div>

              <div className="flex justify-center">
                <QRCodeCanvas
                  value={shortUrl}
                  size={170}
                  fgColor="#f97316"
                  bgColor="#ffffff"
                />
              </div>
            </div>
          )}
        </div>

        {/* ===== HISTORY ===== */}
        {history.length > 0 && (
          <div className="w-full max-w-3xl mt-14">
            <h2 className="text-xl font-semibold mb-5">Recent Links</h2>

            <div className="bg-white rounded-2xl border divide-y">
              {history.map((item, i) => (
                <div
                  key={i}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 truncate">
                      {item.original}
                    </p>

                    <a
                      href={item.short}
                      target="_blank"
                      className="text-orange-500 font-medium truncate block mt-1"
                    >
                      {item.short}
                    </a>
                  </div>

                  <div className="hidden sm:block bg-white border rounded-lg p-2">
                    <QRCodeCanvas
                      value={item.short}
                      size={56}
                      fgColor="#f97316"
                      bgColor="#ffffff"
                    />
                  </div>

                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(item.short)}
                    className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
                  >
                    Copy
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ===== FIXED FOOTER ===== */}
      <footer className="fixed bottom-0 left-0 w-full border-t bg-white shadow-sm z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            shrinkrr:// • Built by{" "}
            <span className="font-medium">Munauvar Warsi</span>
          </p>

          <a
            href="https://www.linkedin.com/in/munauvar-warsi-71439b28a/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition font-medium text-sm"
          >
            Contact Me
          </a>
        </div>
      </footer>
    </div>
  );
}
