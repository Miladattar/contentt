// app/api/backlog/route.ts
import { NextRequest, NextResponse } from "next/server";
import { TopicSchema } from "../../../lib/schemas";
import { openai } from "../../../lib/openai";

function extractJson(text: string) {
  const t = (text || "").trim();
  if (t.startsWith("```")) {
    const cleaned = t.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
    try { return JSON.parse(cleaned); } catch {}
  }
  let first = t.indexOf("{"), last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const candidate = t.slice(first, last + 1);
    try { return JSON.parse(candidate); } catch {}
  }
  first = t.indexOf("["), last = t.lastIndexOf("]");
  if (first !== -1 && last !== -1 && last > first) {
    const candidate = t.slice(first, last + 1);
    try { return JSON.parse(candidate); } catch {}
  }
  throw new Error("Model did not return valid JSON");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { strategy } = body || {};

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      items: Array.from({ length: 10 }).map((_, i) => ({
        title: "ایده شماره " + (i + 1),
        format: ["رِیل", "پست", "توییت", "نوشته"][i % 4],
        score: 70 + (i % 20),
      })),
    });
  }

  try {
    const resp = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "تو ایده‌پرداز محتوا هستی. فقط JSON معتبر مطابق اسکیمای TopicSchema بده. هیچ متن اضافی یا کد بلاک مارک‌داون نیاور.",
        },
        {
          role: "user",
          content:
            "استراتژی این است:\n" + JSON.stringify(strategy ?? {}, null, 2),
        },
        {
          role: "user",
          content:
            "۱۰ ایده بده با کلیدهای: items[{title, format (یکی از: «رِیل», «پست», «توییت», «نوشته»), score(0..100)}]. فقط JSON بده.",
        },
      ],
    });

    const outText =
      (resp as any).output_text ??
      (resp as any)?.output?.[0]?.content?.[0]?.text ??
      "";

    const json = extractJson(outText);

    const parsed = TopicSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Schema mismatch", issues: parsed.error.issues, raw: json },
        { status: 422 }
      );
    }
    return NextResponse.json(parsed.data);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? "خطا در فراخوانی OpenAI" },
      { status: 500 }
    );
  }
}
