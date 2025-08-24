
import "./globals.css";
import TelegramProvider from "./providers/TelegramProvider";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Content Agent MiniApp",
  description: "Telegram Mini App — test build",
  viewport: "width=device-width, initial-scale=1"
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body><TelegramProvider>{children}</TelegramProvider></body>
    </html>
  );
}
