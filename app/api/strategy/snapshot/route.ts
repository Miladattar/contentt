// app/api/strategy/snapshot/route.ts
import { NextRequest, NextResponse } from "next/server";
import { StrategySchema } from "@/lib/schemas";
import { openai } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const input = await req.json();

  // بدون کلید → خروجی دمو
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
      text: { format: "json" }, // ✅ جایگزین response_format
      input: [
        {
          role: "system",
          content:
            'تو "استراتژیست محتوا" هستی. فقط JSON خالص بده که دقیقاً با اسکیمای خواسته‌شده همخوان باشد.',
        },
        {
          role: "user",
          content:
            "این ورودی کاربر (goal, industry, audience, tone, capacity):\n" +
            JSON.stringify(input),
        },
        {
          role: "user",
          content:
            "کلیدهای لازم در خروجی: goal, pillars(array), funnel{awareness,consideration,action}, mix_weekly{reels,stories,posts}, tone, guardrails(array). فقط JSON بده.",
        },
      ],
    });

    const outText =
      (resp as any).output_text ??
      (resp as any)?.output?.[0]?.content?.[0]?.text ??
      "";
    const json = JSON.parse(outText || "{}");

    const parsed = StrategySchema.safeParse(json);
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
