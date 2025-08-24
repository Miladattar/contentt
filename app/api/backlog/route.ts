import { NextRequest, NextResponse } from "next/server";
import { TopicSchema } from "../../../lib/schemas";
import { openai } from "../../../lib/openai";

/**
 * API route for generating a prioritized backlog of topics. If the
 * environment does not have an OpenAI API key, return a handful of
 * example topics with scores. Otherwise attempt to call the Responses
 * API with a JSON schema based on TopicSchema.
 */
export async function POST(req: NextRequest) {
  const { strategy } = await req.json();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      items: [
        { title: "بوتاکس برای چی خوبه/نیست؟", format: "ریلز", score: 90 },
        { title: "۳ اشتباه قبل ژل لب", format: "ریلز", score: 88 },
        { title: "مراقبت بعد بوتاکس", format: "استوری", score: 85 },
        { title: "فیلر یا مزوژل؟", format: "پست", score: 84 },
        { title: "کِی فیلر زیر چشم مجاز نیست؟", format: "ریلز", score: 80 },
        { title: "برند و اصالت مواد", format: "استوری", score: 78 },
        { title: "نتیجه طبیعی با دوز کم", format: "ریلز", score: 75 },
        { title: "برنامه نگهداری ۶ ماهه", format: "استوری", score: 73 },
        { title: "سؤالات پرتکرار ورم/کبودی", format: "پست", score: 72 },
        { title: "پشت‌صحنه استریل", format: "استوری", score: 70 },
      ],
    });
  }

  try {
    const jsonSchema: any = TopicSchema.toJSON ? TopicSchema.toJSON() : {};
    const resp = await openai.responses.create({
      model: "gpt-5",
      response_format: {
        type: "json_schema",
        json_schema: { name: "topics", schema: jsonSchema, strict: true },
      },
      instructions:
        "از روی strategy زیر، 120 دغدغه و 120 تیتر بساز و سپس 20 موضوع اولویت‌دار را با امتیاز 0..100 خروجی بده. خروجی باید فقط مطابق اسکیمای JSON باشد.",
      input: [{ role: "user", content: JSON.stringify(strategy) }],
    });
    const data = JSON.parse(resp.output_text || "{}");
    return NextResponse.json(data);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? "خطا در فراخوانی OpenAI" }, { status: 500 });
  }
}