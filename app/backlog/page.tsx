"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TopicItem {
  title: string;
  format: string;
  score: number;
}

/**
 * Backlog page retrieves the prioritized list of topics based on the
 * strategy snapshot stored in localStorage. Users can pick topics for
 * their campaign from this list.
 */
export default function BacklogPage() {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchTopics() {
      const snapshotStr = typeof window !== "undefined" ? localStorage.getItem("strategySnapshot") : null;
      if (!snapshotStr) {
        setError("استراتژی پیدا نشد. لطفاً به مرحله قبل بازگردید.");
        return;
      }
      const snapshot = JSON.parse(snapshotStr);
      setLoading(true);
      try {
        const res = await fetch("/api/backlog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ strategy: snapshot }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data?.error ?? "خطا هنگام دریافت فهرست موضوعات");
        }
        const data = await res.json();
        setTopics(data.items);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTopics();
  }, []);

  function handleSelect(item: TopicItem) {
    if (typeof window !== "undefined") {
      const selected = JSON.parse(localStorage.getItem("selectedTopics") || "[]");
      // avoid duplicates
      const exists = selected.some((it: TopicItem) => it.title === item.title);
      if (!exists) {
        selected.push(item);
        localStorage.setItem("selectedTopics", JSON.stringify(selected));
      }
    }
    router.push("/studio/1");
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">اولویت‌های ماه</h1>
      {loading && <p>در حال بارگذاری...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <ul className="space-y-2">
        {topics.map((item) => (
          <li key={item.title} className="border p-3 rounded flex justify-between items-center">
            <span>{item.title} <span className="text-xs text-gray-500">[{item.format}]</span></span>
            <button
              onClick={() => handleSelect(item)}
              className="text-blue-600"
            >
              انتخاب برای کمپین
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}