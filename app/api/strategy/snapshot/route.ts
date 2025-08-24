// app/api/strategy/snapshot/route.ts
import { NextRequest, NextResponse } from "next/server";
import { StrategySchema } from "../../../../lib/schemas";
import { openai } from "../../../../lib/openai";

// Helper: خروجی مدل را تمیز می‌کند و JSON را استخراج می‌کند (بدون return داخل بلاک‌های تو در تو)
const extractJson = (text: string) => {
  let payload = (text || "").trim();

  // اگر کدبلاک... بود، فقط محتوا را بردار
  if (payload.startsWith("```")) {
    const start = payload.indexOf("\n");       // بعد از    const end = payload.lastIndexOf("```");    // قبل از     if (start !== -1 && end !== -1 && end > start) {
      payload = payload.slice(start + 1, end).trim();
    }
  }

  // 1) تلاش مستقیم
  try {
    return JSON.parse(payload);
  } catch {}

  // 2) تلاش: اولین آبجکت { ... }
  let candidate: string | null = null;
  let first = payload.indexOf("{");
  let last = payload.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    candidate = payload.slice(first, last + 1);
  }
  if (candidate) {
    try { return JSON.parse(candidate); } catch {}
  }

  // 3) تلاش: اولین آرایه [ ... ]
  candidate = null;
  first = payload.indexOf("[");
  last = payload.lastIndexOf("]");
  if (first !== -1 && last !== -1 && last > first) {
    candidate = payload.slice(first, last + 1);
  }
  if (candidate) {
    try { return JSON.parse(candidate); } catch {}
  }

  throw new Error("Model did not return valid JSON");
};

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
      // هیچ پارامتر response_format یا text.format ارسال نکن
      input: [
        {
          role: "system",
          content:
            'تو "استراتژیست محتوا" هستی. فقط و فقط JSON معتبر بده. هیچ متن اضافی یا کدبلاک مارک‌داون (```json) ننویس.',
        },
        {
          role: "user",
          content:
            "ورودی کاربر (goal, industry, audience, tone, capacity):\n" +
            JSON.stringify(input),
        },
        {
          role: "user",
          content:
            "کلیدهای خروجی: goal, pillars(array), funnel{awareness,consideration,action}, mix_weekly{reels,stories,posts}, tone, guardrails(array). فقط JSON بده.",
        },
      ],
    });

    const outText =
      (resp as any).output_text ??
      (resp as any)?.output?.[0]?.content?.[0]?.text ??
      "";

    const json = extractJson(outText);

    const parsed = StrategySchema.safeParse(json);
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
