import { z } from "zod";
import { questions, extraQuestions } from "./questions";

export const answersSchema = z
  .object(
    Object.fromEntries(
      questions.map((q) => [
        q.id,
        (q.scale
          ? z.number().int().min(1).max(5)
          : z.enum(q.options as [string, ...string[]])
        )
          .nullable()
          .optional(),
      ]),
    ),
  )
  .strict()
  .superRefine((value, ctx) => {
    for (const q of questions.filter((q) => q.required)) {
      if (value[q.id] == null)
        ctx.addIssue({
          code: "custom",
          path: [q.id],
          message: "请完成这道必要题目",
        });
    }
  });
export const extraSchema = z
  .object(
    Object.fromEntries(
      extraQuestions.map((q) => [
        q.id,
        z.enum(q.options as [string, ...string[]]).optional(),
      ]),
    ),
  )
  .strict();
export const requestSchema = z
  .object({
    adult_confirmed: z.literal(true),
    answers: answersSchema,
    extras: extraSchema.optional(),
  })
  .strict();
const dimension = z.object({
  key: z.string(),
  label: z.string(),
  weight: z.number(),
  score: z.number().min(0).max(100),
  explanation: z.string(),
});
export const characterSchema = z.object({
  id: z.string().uuid(),
  schema_version: z.literal("1.0"),
  fictional_disclaimer: z.string(),
  name: z.string(),
  pronouns: z.string(),
  gender_presentation: z.enum(["男性", "女性", "中性"]),
  age: z.number().int().min(18).max(80),
  birth_month: z.number().int().min(1).max(12),
  zodiac_entertainment: z.string(),
  city: z.string(),
  height_cm: z.number().int().min(145).max(205),
  tagline: z.string(),
  archetype: z.string(),
  tags: z.array(z.string()).length(3),
  appearance: z.object({
    hair: z.string(),
    face: z.string(),
    style: z.string(),
    expressions: z.string(),
    temperament: z.string(),
  }),
  education: z.object({ level: z.string(), field: z.string() }),
  career: z.object({
    industry: z.string(),
    role: z.string(),
    tenure: z.number().int().min(0),
    income_band_illustrative: z.string(),
  }),
  family_story: z.string(),
  personality: z.object({
    traits: z.array(z.string()),
    strengths: z.array(z.string()),
    flaws: z.array(z.string()),
    decision_style: z.string(),
    stress_support: z.string(),
  }),
  lifestyle: z.object({
    routine: z.string(),
    hobbies: z.array(z.string()),
    food: z.string(),
    music: z.string(),
    travel: z.string(),
    weekend: z.string(),
    pet: z.string(),
    exercise: z.string(),
    planning: z.string(),
    living_environment: z.string(),
  }),
  relationship: z.object({
    love_language: z.string(),
    conflict_style: z.string(),
    boundaries: z.string(),
    goals: z.string(),
    contact_frequency: z.string(),
    bottom_line: z.string(),
  }),
  compatibility: z.object({
    total: z.number().min(0).max(100),
    score_by_dimension: z.array(dimension).length(5),
    reasons: z.array(
      z.object({
        question: z.string(),
        answer: z.string(),
        detail: z.string(),
      }),
    ),
    tensions: z.array(z.string()),
    advice: z.array(z.string()),
    coverage: z.number().int().min(2).max(25),
  }),
  meet_cute: z.string(),
  date_story: z.string(),
  portrait_id: z.string(),
  portrait_source: z.literal("pre-generated-ai-library"),
  image_url: z.string().regex(/^\/library\/[a-z0-9-]+\.webp$/),
  generated_at: z.string().datetime(),
  expiry_at: z.string().datetime(),
  mode: z.literal("library"),
  modeling: z.object({
    user_traits: z.record(z.string(), z.union([z.string(), z.number()])),
    partner_preferences: z.record(
      z.string(),
      z.union([z.string(), z.number()]),
    ),
    character_constraints: z.object({
      adult: z.literal(true),
      age_min: z.number(),
      age_max: z.number(),
      gender: z.string(),
    }),
  }),
});
export type Character = z.infer<typeof characterSchema>;
export type GenerationInput = z.infer<typeof requestSchema>;
export function publicCharacter(p: Character) {
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    city: p.city,
    tagline: p.tagline,
    tags: p.tags,
    archetype: p.archetype,
    gender_presentation: p.gender_presentation,
    image_url: p.image_url,
    career: { role: p.career.role },
    fictional_disclaimer: p.fictional_disclaimer,
    expiry_at: p.expiry_at,
    mode: p.mode,
  };
}
export type PublicCharacter = ReturnType<typeof publicCharacter>;
