import { NextRequest, NextResponse } from "next/server";
import { ScriptSchema } from "../../../lib/schemas";
import { openai } from "../../../lib/openai";

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
      text: { format: "json" },
      input: [
        { role: "system", content: "تو کپی‌رایتر و استراتژیست ویدیو هستی. فقط JSON مطابق اسکیمای ScriptSchema بده." },
        { role: "user", content: "استراتژی:\n" + JSON.stringify(strategy ?? {}, null, 2) },
        { role: "user", content: "ایده انتخاب‌شده:\n" + JSON.stringify(idea ?? {}, null, 2) },
        { role: "user", content: "خروجی با کلیدهای: id, title, technique, format, blocks{}, hooks, beats[], planSilent[], narration[], cta" },
      ],
    });

    const outText =
      (resp as any).output_text ??
      (resp as any)?.output?.[0]?.content?.[0]?.text ?? "";
    const json = JSON.parse(outText || "{}");

    const parsed = ScriptSchema.safeParse(json);
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
