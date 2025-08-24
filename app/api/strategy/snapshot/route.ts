import { NextRequest, NextResponse } from "next/server";
import { StrategySchema } from "../../../../lib/schemas";
import { openai } from "../../../../lib/openai";

export async function POST(req: NextRequest) {
  const input = await req.json();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      goal: input.goal ?? "sales",
      pillars: ["education_safety", "treatment_selection", "results_maintenance"],
      funnel: { awareness: 0.4, consideration: 0.35, action: 0.25 },
      mix_weekly: { reels: 3, stories: 3, posts: 1 },
      tone: input.tone ?? "خودمونی-حرفه‌ای",
      guardrails: [
        "no-false-claims",
        "consent_for_before_after",
        "soft_cta",
        "local_medical_ad_rules",
      ],
    });
  }

  try {
    const resp = await openai.responses.create({
      model: "gpt-4.1-mini",
      // ❌ هیچ text.format یا response_format نفرست
      input: [
        { role: "system", content: 'فقط JSON معتبر بده. هیچ متن اضافی ننویس.' },
        { role: "user", content: "ورودی کاربر:\n" + JSON.stringify(input) },
        { role: "user", content: "کلیدها: goal, pillars[], funnel{awareness,consideration,action}, mix_weekly{reels,stories,posts}, tone, guardrails[]." }
      ],
    });

    const outText = (resp as any).output_text ?? (resp as any)?.output?.[0]?.content?.[0]?.text ?? "";
    const json = JSON.parse(outText || "{}");

    const parsed = StrategySchema.safeParse(json);
    if (!parsed.success) return NextResponse.json({ error: "Schema mismatch", issues: parsed.error.issues, raw: json }, { status: 422 });
    return NextResponse.json(parsed.data);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? "خطا در فراخوانی OpenAI" }, { status: 500 });
  }
}
