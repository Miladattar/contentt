import { NextRequest, NextResponse } from "next/server";
import { ScriptSchema } from "../../../lib/schemas";
import { openai } from "../../../lib/openai";

/**
 * API route to generate a structured script for a selected topic. If
 * an OpenAI API key is not present, return a simple mock script. When
 * available, call the Responses API with ScriptSchema to enforce
 * structure.
 */
export async function POST(req: NextRequest) {
  const { topic, technique, format, brand } = await req.json();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      id: "mock-script-1",
      title: topic?.title || "موضوع نامشخص",
      technique,
      format,
      blocks: {
        hook: "قلاب کوتاه نمونه",
        beats: ["نقطه اول", "نقطه دوم", "نقطه سوم"],
        narration: ["متن اول", "متن دوم"],
        cta: "اگر مفید بود، ذخیره و اشتراک بذارید."
      }
    });
  }
  try {
    const jsonSchema: any = ScriptSchema.toJSON ? ScriptSchema.toJSON() : {};
    const resp = await openai.responses.create({
      model: "gpt-5",
      response_format: {
        type: "json_schema",
        json_schema: { name: "script", schema: jsonSchema, strict: true },
      },
      instructions:
        `تو \"سناریونویس\" هستی. قواعد: ضبط‌پسند، CTA نرم، بدون وعده قطعی پزشکی. برای ${format} با تکنیک ${technique} سناریو بده. خروجی فقط مطابق اسکیمای JSON باشد.`,
      input: [
        { role: "user", content: JSON.stringify({ topic, brand }) },
      ],
    });
    const data = JSON.parse(resp.output_text || "{}");
    return NextResponse.json(data);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? "خطا در فراخوانی OpenAI" }, { status: 500 });
  }
}