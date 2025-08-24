// app/api/backlog/route.ts
import { NextRequest, NextResponse } from "next/server";
import { TopicSchema } from "../../../lib/schemas";
import { openai } from "../../../lib/openai";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { strategy } = body || {};

  // بدون کلید → دمو
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      items: Array.from({ length: 10 }).map((_, i) => ({
        // 👇👇 دقیقاً این‌جا باید داخل «بکتیک» باشه
        title: ایده شماره ${i + 1},
        format: ["رِیل", "پست", "توییت", "نوشته"][i % 4],
        score: 70 + (i % 20),
      })),
    });
  }

  try {
    const resp = await openai.responses.create({
      model: "gpt-4.1-mini",
      text: { format: "json" },
      input: [
        {
          role: "system",
          content:
            "تو ایده‌پرداز محتوا هستی. فقط JSON مطابق اسکیمای TopicSchema بده.",
        },
        {
          role: "user",
          content:
            "استراتژی این است:\n" + JSON.stringify(strategy ?? {}, null, 2),
        },
        {
          role: "user",
          content:
            "۱۰ ایده بده با کلیدهای: items[{title, format (یکی از: «رِیل», «پست», «توییت», «نوشته»), score(0..100)}]",
        },
      ],
    });

    const outText =
      (resp as any).output_text ??
      (resp as any)?.output?.[0]?.content?.[0]?.text ??
      "";
    const json = JSON.parse(outText || "{}");

    const parsed = TopicSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Schema mismatch", issues: parsed.error.issues },
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
