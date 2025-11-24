"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clipboard, Check, Link as LinkIcon } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import Image from "next/image";
import logo from "@/assets/logo.png"; // Ensure path is correct

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

    if (!url.trim()) {
      setError("URL cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl: url, customCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to shorten URL");

      const fullShortUrl = `${window.location.origin}/${data.shortCode}`;
      setShortUrl(fullShortUrl);

      const newHistory = [
        { original: url, short: fullShortUrl },
        ...history,
      ].slice(0, 8);
      saveHistory(newHistory);

      setUrl("");
      setCustomCode("");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Unexpected error occurred.");
    }
    setLoading(false);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 px-6 py-10">
      {/* Logo + Site Name */}
      <header className="flex items-center justify-center mb-10 space-x-4">
        <Image src={logo} alt="Logo" width={48} height={48} />
        <h1
          className="text-4xl font-extrabold bg-clip-text text-transparent 
                       bg-gradient-to-r from-orange-600 to-orange-300"
        >
          shrinkrr://
        </h1>
      </header>

      <main className="flex-1">
        {/* Shorten URL Section */}
        <Card className="max-w-3xl mx-auto bg-white border-gray-300 rounded-2xl shadow mb-10">
          <CardHeader>
            <CardTitle>Shorten Your URL</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Paste your URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-gray-100 text-gray-900 border-gray-300 placeholder-gray-400"
              />
              <Input
                placeholder="Custom short code (optional)"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                className="bg-gray-100 text-gray-900 border-gray-300 placeholder-gray-400"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                disabled={loading}
              >
                {loading ? "⏳ Generating..." : "Create Short Link"}
              </Button>
            </form>

            {shortUrl && (
              <div className="mt-6 bg-gray-100 border border-gray-300 rounded-xl p-6 text-center">
                <p className="text-gray-700 text-sm mb-2">
                  Your shortened link:
                </p>
                <div className="flex flex-col items-center gap-4">
                  <a
                    href={shortUrl}
                    target="_blank"
                    className="text-orange-500 underline font-medium break-all flex items-center"
                  >
                    <LinkIcon size={16} className="mr-2" />
                    {shortUrl}
                  </a>
                  <Button
                    variant="default"
                    onClick={() => copyToClipboard(shortUrl)}
                    className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                  >
                    {copied ? <Check size={16} /> : <Clipboard size={16} />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </Button>
                </div>
                <div className="flex justify-center mt-6">
                  <QRCodeCanvas
                    value={shortUrl}
                    size={180}
                    fgColor="#f97316"
                    bgColor="#f3f4f6"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History */}
        <div className="w-full space-y-4 px-4">
          <h2 className="text-xl font-semibold mb-2 text-gray-900">
            History (Last 8)
          </h2>
          <div className="space-y-3">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="w-full bg-white border border-gray-300 rounded-md shadow-sm flex justify-between items-center px-6 py-4"
                style={{ minHeight: "100px" }}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <span
                    className="text-gray-900 text-sm truncate"
                    title={item.original}
                  >
                    Original URL: {item.original}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <a
                      href={item.short}
                      target="_blank"
                      className="text-orange-500 font-medium truncate"
                      title={item.short}
                    >
                      Short URL: {item.short}
                    </a>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => copyToClipboard(item.short)}
                      className="flex items-center space-x-1 bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                    >
                      <Clipboard size={14} />
                      <span>Copy</span>
                    </Button>
                  </div>
                </div>
                <div className="shrink-0 ml-6">
                  <QRCodeCanvas
                    value={item.short}
                    size={96}
                    fgColor="#f97316"
                    bgColor="#f3f4f6"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-10 border-t border-gray-300 py-3 flex justify-between items-center text-gray-600 text-sm px-6">
        <div className="flex items-center space-x-2">
          <Image src={logo} alt="Logo" width={20} height={20} />
          <span>shrinkrr:// | A project by Munauvar Warsi</span>
        </div>
        <a
          href="https://www.linkedin.com/in/munauvar-warsi-71439b28a/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-orange-500 transition-colors"
        >
          Contact
        </a>
      </footer>
    </div>
  );
}
