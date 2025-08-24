
"use client";
import { useEffect } from "react";
declare global { interface Window { Telegram?: any; } }
export default function TelegramProvider({ children }: { children: React.ReactNode }) {
  useEffect(()=>{
    const s = document.createElement("script");
    s.src = "https://telegram.org/js/telegram-web-app.js";
    s.async = true;
    s.onload = () => { const tg=(window as any)?.Telegram?.WebApp; try{ tg?.ready(); tg?.expand(); tg?.MainButton?.hide(); }catch{} };
    document.head.appendChild(s);
  },[]);
  return <>{children}</>;
}
