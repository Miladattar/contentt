import { z } from "zod";

/**
 * Schema definitions for validating the structured outputs from the OpenAI
 * Responses API. These schemas are also converted to JSON Schema when
 * specifying the expected output shape to the API. See lib/openai.ts for
 * usage examples.
 */

export const StrategySchema = z.object({
  goal: z.enum(["sales", "growth", "authority", "engagement"]),
  pillars: z.array(z.string()).min(3).max(5),
  funnel: z.object({
    awareness: z.number(),
    consideration: z.number(),
    action: z.number(),
  }),
  mix_weekly: z.object({
    reels: z.number(),
    stories: z.number(),
    posts: z.number(),
  }),
  tone: z.string(),
  guardrails: z.array(z.string()),
});

export const TopicSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string(),
        format: z.enum(["ریلز", "پست", "استوری"]),
        score: z.number().int().min(0).max(100),
      }),
    )
    .min(10),
});

export const ScriptSchema = z.object({
  id: z.string(),
  title: z.string(),
  technique: z.enum(["limit", "suspense", "novicePro", "warning", "silentVisual"]),
  format: z.enum(["ریلز", "پست", "استوری"]),
  blocks: z.object({
    hook: z.string(),
    beats: z.array(z.string()).optional(),
    planSilent: z.array(z.string()).optional(),
    narration: z.array(z.string()).optional(),
    cta: z.string(),
  }),
});