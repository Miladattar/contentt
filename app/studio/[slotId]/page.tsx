"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface TopicItem {
  title: string;
  format: string;
  score: number;
}

export default function StudioPage() {
  const router = useRouter();
  const params = useParams();
  const [topic, setTopic] = useState<TopicItem | null>(null);
  const [technique, setTechnique] = useState("limit");
  const [format, setFormat] = useState("ریلز");
  const [script, setScript] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const selectedStr = localStorage.getItem("selectedTopics");
      if (selectedStr) {
        const selected = JSON.parse(selectedStr) as TopicItem[];
        // simple: take first selected topic
        if (selected.length > 0) {
          setTopic(selected[0]);
        }
      }
    }
  }, []);

  async function handleGenerate() {
    if (!topic) return;
    setLoading(true);
    setError(null);
    try {
      const brand = typeof window !== "undefined" ? localStorage.getItem("strategySnapshot") : null;
      const res = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, technique, format, brand }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? "خطا در تولید سناریو");
      }
      const data = await res.json();
      setScript(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Studio</h1>
      {topic ? (
        <>
          <p className="text-lg">موضوع انتخاب‌شده: <strong>{topic.title}</strong></p>
          <div className="flex gap-4 items-center">
            <label>
              تکنیک:
              <select
                className="border p-2 ml-2"
                value={technique}
                onChange={(e) => setTechnique(e.target.value)}
              >
                <option value="limit">لیمیت</option>
                <option value="suspense">تعلیق</option>
                <option value="novicePro">مبتدی/حرفه‌ای</option>
                <option value="warning">هشدار</option>
                <option value="silentVisual">بی‌کلام</option>
              </select>
            </label>
            <label>
              فرمت:
              <select
                className="border p-2 ml-2"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="ریلز">ریلز</option>
                <option value="پست">پست</option>
                <option value="استوری">استوری</option>
              </select>
            </label>
            <button
              className="bg-black text-white px-4 py-2 rounded"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "در حال تولید..." : "تولید سناریو"}
            </button>
          </div>
          {error && <p className="text-red-600">{error}</p>}
          {script && (
            <pre className="mt-4 bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(script, null, 2)}
            </pre>
          )}
        </>
      ) : (
        <p>موضوعی انتخاب نشده است. به صفحه قبل برگردید.</p>
      )}
    </main>
  );
}