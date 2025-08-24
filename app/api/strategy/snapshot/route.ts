// app/api/strategy/snapshot/route.ts
import { NextRequest, NextResponse } from "next/server";
import { StrategySchema } from "../../../../lib/schemas";
import { openai } from "../../../../lib/openai";

// --- Helper: متن رو تمیز می‌کند و JSON را استخراج می‌کند ---
function extractJson(text: string) {
  const t = (text || "").trim();

  // حالت کد بلاک  if (t.startsWith("```")) {
    // حذفjson یا  و انتهای `
    const cleaned = t
      .replace(/^```[a-zA-Z]*\n?/, "")
      .replace(/```$/, "")
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch {}
  }

  // تلاش: اولین آبجکت { ... } را پیدا کن
  let first = t.indexOf("{");
  let last = t.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const candidate = t.slice(first, last + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  // تلاش: اولین آرایه [ ... ] را پیدا کن
  first = t.indexOf("[");
  last = t.lastIndexOf("]");
  if (first !== -1 && last !== -1 && last > first) {
    const candidate = t.slice(first, last + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  throw new Error("Model did not return valid JSON");
}

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
      // عمداً هیچ text.format یا response_format نمی‌فرستیم
      input: [
        {
          role: "system",
          content:
            'تو "استراتژیست محتوا" هستی. فقط و فقط JSON معتبر برگردان. هیچ متن اضافی، توضیح، یا کد بلاک مارک‌داون (```json) نیاور.',
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
            "کلیدهای لازم در خروجی: goal, pillars(array), funnel{awareness,consideration,action}, mix_weekly{reels,stories,posts}, tone, guardrails(array). فقط JSON بده.",
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
