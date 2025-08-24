import { NextRequest, NextResponse } from "next/server";
import { StrategySchema } from "../../../../lib/schemas";
import { openai } from "../../../../lib/openai";

/**
 * API route for generating a strategy snapshot. If an OpenAI API key is
 * not configured, a dummy strategy will be returned for demonstration
 * purposes. When an API key is present, this endpoint attempts to call
 * the Responses API with a JSON schema based on StrategySchema.
 */
export async function POST(req: NextRequest) {
  const input = await req.json();

  // If no API key is available, return a hard-coded snapshot. This allows
  // local development without an external network call.
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

  // When API key is present, attempt to call OpenAI Responses API
  try {
    // Convert zod schema to JSON Schema. If using Zod >= 3.22, toJSON is available.
    const jsonSchema: any = StrategySchema.toJSON ? StrategySchema.toJSON() : {};
    const resp = await openai.responses.create({
      model: "gpt-5",
      response_format: {
        type: "json_schema",
        json_schema: { name: "strategy", schema: jsonSchema, strict: true },
      },
      instructions:
        "تو \"استراتژیست محتوا\" هستی. بر اساس ورودی کاربر (goal, industry, audience, tone, capacity) یک snapshot استراتژی بساز. خروجی فقط باید مطابق اسکیمای JSON باشد.",
      input: [{ role: "user", content: JSON.stringify(input) }],
    });
    const data = JSON.parse(resp.output_text || "{}");
    return NextResponse.json(data);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message ?? "خطا در فراخوانی OpenAI" },
      { status: 500 },
    );
  }
}