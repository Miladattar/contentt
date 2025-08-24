"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Brief page collects the minimal inputs to generate a strategy snapshot.
 * Once the form is submitted, it posts to /api/strategy/snapshot and
 * persists the result in localStorage under the key "strategySnapshot".
 */
export default function BriefPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    goal: "sales",
    industry: "کلینیک زیبایی",
    audience: "بانوهای جوان و میانسال در تهران", // default example
    tone: "خودمونی-حرفه‌ای",
    capacity: 3,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/strategy/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? "Unknown error");
      }
      const data = await res.json();
      if (typeof window !== "undefined") {
        localStorage.setItem("strategySnapshot", JSON.stringify(data));
      }
      router.push("/backlog");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Brief</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm mb-1">هدف کمپین</label>
          <select
            className="w-full p-2 border rounded"
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
          >
            <option value="sales">افزایش فروش</option>
            <option value="growth">رشد فالور</option>
            <option value="authority">ایجاد اعتبار</option>
            <option value="engagement">تعامل بیشتر</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">حوزه/صنعت</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">مخاطب هدف</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={form.audience}
            onChange={(e) => setForm({ ...form, audience: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">لحن</label>
          <select
            className="w-full p-2 border rounded"
            value={form.tone}
            onChange={(e) => setForm({ ...form, tone: e.target.value })}
          >
            <option value="خودمونی-حرفه‌ای">خودمونی-حرفه‌ای</option>
            <option value="رسمی">رسمی</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">ظرفیت تولید هفتگی (تعداد ریلز)</label>
          <input
            type="number"
            min="1"
            className="w-full p-2 border rounded"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
          />
        </div>
        {error && <p className="text-red-600">{error}</p>}
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "در حال ساخت استراتژی..." : "ساخت استراتژی"}
        </button>
      </form>
    </main>
  );
}