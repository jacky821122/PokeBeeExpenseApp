import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "pokebee 支出記錄",
  description: "內部支出快速記錄工具",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="min-h-dvh overflow-x-hidden bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
