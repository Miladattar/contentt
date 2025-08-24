// app/api/script/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ScriptSchema } from "../../../lib/schemas";
import { openai } from "../../../lib/openai";

const extractJson = (text: string) => {
  const t = (text || "").trim();
  if (t.startsWith("```")) {
    const cleaned = t.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
    try { return JSON.parse(cleaned); } catch {}
  }
  {
    const first = t.indexOf("{"), last = t.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      const candidate = t.slice(first, last + 1);
      try { return JSON.parse(candidate); } catch {}
    }
  }
  {
    const first = t.indexOf("["), last = t.lastIndexOf("]");
    if (first !== -1 && last !== -1 && last > first) {
      const candidate = t.slice(first, last + 1);
      try { return JSON.parse(candidate); } catch {}
    }
  }
  throw new Error("Model did not return valid JSON");
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { idea, strategy } = body || {};

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      id: "demo-1",
      title: idea?.title ?? "نمونه اسکریپت",
      technique: "suspense",
      format: idea?.format ?? "رِیل",
      blocks: {},
      hooks: "یه راز کوچیک که کسی بهت نگفته…",
      beats: ["هوک", "بدنه", "نتیجه"],
      planSilent: ["کات به قبل/بعد", "نمای نزدیک"],
      narration: ["جمله ۱", "جمله ۲", "CTA"],
      cta: "برای دیدن نتایج بیشتر فالو کن",
    });
  }

  try {
    const resp = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "تو کپی‌رایتر و استراتژیست ویدیو هستی. فقط JSON معتبر مطابق ScriptSchema بده. هیچ متن اضافه یا کدبلاک مارک‌داون نیاور.",
        },
        { role: "user", content: "استراتژی:\n" + JSON.stringify(strategy ?? {}, null, 2) },
        { role: "user", content: "ایده انتخاب‌شده:\n" + JSON.stringify(idea ?? {}, null, 2) },
        {
          role: "user",
          content:
            "خروجی با کلیدهای: id, title, technique, format, blocks{}, hooks, beats[], planSilent[], narration[], cta. فقط JSON بده.",
        },
      ],
    });

    const outText =
      (resp as any).output_text ??
      (resp as any)?.output?.[0]?.content?.[0]?.text ??
      "";

    const json = extractJson(outText);

    const parsed = ScriptSchema.safeParse(json);
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
