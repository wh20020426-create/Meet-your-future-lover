import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import {
  generateCharacter,
  inputFingerprint,
  ageConstraints,
} from "../lib/engine";
import { requestSchema, characterSchema, publicCharacter } from "../lib/schema";
import { questions, defaults, extraQuestions } from "../lib/questions";
import { portraitLibrary, selectPortrait } from "../lib/library";
import { markSyntheticPng } from "../lib/poster";

test("25 道核心题与 10 道增强题完整且编号唯一", () => {
  assert.equal(questions.length, 25);
  assert.equal(new Set(questions.map((q) => q.id)).size, 25);
  assert.equal(extraQuestions.length, 10);
  assert.deepEqual(
    questions.filter((q) => q.required).map((q) => q.id),
    ["q01", "q03"],
  );
});
test("未确认成年、未成年人和未知输入均被拒绝", () => {
  assert.equal(
    requestSchema.safeParse({ adult_confirmed: false, answers: defaults })
      .success,
    false,
  );
  assert.equal(
    requestSchema.safeParse({
      adult_confirmed: true,
      answers: { ...defaults, q01: "17 岁" },
    }).success,
    false,
  );
  assert.equal(
    requestSchema.safeParse({
      adult_confirmed: true,
      answers: { ...defaults, phone: "13900000000" },
    }).success,
    false,
  );
  assert.equal(
    requestSchema.safeParse({
      adult_confirmed: true,
      answers: { ...defaults, q06: 6 },
    }).success,
    false,
  );
  assert.equal(
    requestSchema.safeParse({
      adult_confirmed: true,
      answers: { ...defaults, q03: "<script>alert(1)</script>" },
    }).success,
    false,
  );
});
test("只填写两道必要题也能生成，且不捏造答题解释", () => {
  const p = generateCharacter({
    adult_confirmed: true,
    answers: { q01: "18–22 岁", q03: "不限" },
  });
  assert.equal(p.compatibility.coverage, 2);
  assert.equal(p.compatibility.reasons.length, 0);
  assert.ok(p.age >= 18);
  assert.equal(p.career.tenure, 0);
});
test("80 组年龄、年龄差与性别组合的逻辑校验", async () => {
  for (const age of questions[0].options!)
    for (const gap of questions[1].options!)
      for (const gender of questions[2].options!) {
        const answers = { ...defaults, q01: age, q02: gap, q03: gender };
        const p = generateCharacter({ adult_confirmed: true, answers });
        assert.equal(characterSchema.safeParse(p).success, true);
        const constraint = ageConstraints(answers);
        assert.ok(
          p.age >= 18 && p.age >= constraint.min && p.age <= constraint.max,
        );
        if (gender === "男性" || gender === "女性")
          assert.equal(p.gender_presentation, gender);
        if (gender.startsWith("自定义"))
          assert.equal(p.gender_presentation, "中性");
        assert.ok(p.career.tenure <= Math.max(0, p.age - 22));
        const portrait = portraitLibrary.find((x) => x.id === p.portrait_id)!;
        assert.ok(p.age >= portrait.age_min && p.age <= portrait.age_max);
        assert.equal(p.gender_presentation, portrait.gender);
        assert.equal(p.appearance.style, portrait.style);
        assert.equal(p.appearance.hair, portrait.hair);
        await access(path.join(process.cwd(), "public", p.image_url));
      }
});
test("评分权重合计 100，总分与公式一致；Q06 调整审美权重", () => {
  for (const q06 of [1, 2, 3, 4, 5]) {
    const p = generateCharacter({
      adult_confirmed: true,
      answers: { ...defaults, q06 },
    });
    const dims = p.compatibility.score_by_dimension;
    assert.ok(Math.abs(dims.reduce((s, d) => s + d.weight, 0) - 100) < 0.00001);
    assert.equal(
      p.compatibility.total,
      Math.round(dims.reduce((s, d) => s + d.score * d.weight, 0) / 100),
    );
    assert.ok(dims[4].weight >= 7 && dims[4].weight <= 13);
  }
});
test("相同问卷产生确定的人设与评分，只变更结果标识和时间", () => {
  const raw = { adult_confirmed: true as const, answers: defaults };
  const p = generateCharacter(raw, new Date("2026-10-28T00:00:00Z"));
  const q = generateCharacter(raw, new Date("2026-10-28T00:00:00Z"));
  assert.notEqual(p.id, q.id);
  assert.deepEqual({ ...p, id: "" }, { ...q, id: "" });
  assert.equal(
    inputFingerprint(raw),
    inputFingerprint({
      adult_confirmed: true,
      answers: Object.fromEntries(Object.entries(defaults).reverse()),
    }),
  );
  assert.equal(
    new Date(p.expiry_at).getTime() - new Date(p.generated_at).getTime(),
    30 * 86400000,
  );
});
test("偏好改变会影响人设、生活、边界和图像", () => {
  const p = generateCharacter({ adult_confirmed: true, answers: defaults });
  const q = generateCharacter({
    adult_confirmed: true,
    answers: {
      ...defaults,
      q07: 5,
      q15: "多一些，独立对我很重要",
      q17: "宅家慢慢过",
      q19: "夜猫子",
      q03: "女性",
    },
  });
  assert.notEqual(p.archetype, q.archetype);
  assert.notEqual(p.lifestyle.weekend, q.lifestyle.weekend);
  assert.notEqual(p.lifestyle.routine, q.lifestyle.routine);
  assert.notEqual(p.relationship.boundaries, q.relationship.boundaries);
  assert.match(q.image_url, /female/);
});
test("增强选项进入人物生活字段，未知增强字段被拒绝", () => {
  const p = generateCharacter({
    adult_confirmed: true,
    answers: defaults,
    extras: { e03: "古典与爵士", e05: "喜欢辣味", e08: "准备小惊喜" },
  });
  assert.equal(p.lifestyle.music, "古典与爵士");
  assert.equal(p.lifestyle.food, "喜欢辣味");
  assert.equal(p.relationship.love_language, "准备小惊喜");
  assert.equal(
    requestSchema.safeParse({
      adult_confirmed: true,
      answers: defaults,
      extras: { private: "abc" },
    }).success,
    false,
  );
});
test("公开人物投影不含原始答案、评分解释、建模偏好或私密故事", () => {
  const p = generateCharacter({ adult_confirmed: true, answers: defaults });
  const result = publicCharacter(p);
  assert.deepEqual(
    Object.keys(result).sort(),
    [
      "id",
      "name",
      "age",
      "city",
      "tagline",
      "tags",
      "archetype",
      "gender_presentation",
      "image_url",
      "career",
      "fictional_disclaimer",
      "expiry_at",
      "mode",
    ].sort(),
  );
  for (const key of [
    "answers",
    "modeling",
    "compatibility",
    "family_story",
    "owner",
    "request_key",
  ])
    assert.equal(key in result, false);
});
test("所有非必填题都可显式跳过", () => {
  const answers = Object.fromEntries(
    questions.map((q) => [q.id, q.required ? q.default : null]),
  );
  const p = generateCharacter({ adult_confirmed: true, answers });
  assert.equal(p.compatibility.coverage, 2);
  assert.equal(p.compatibility.reasons.length, 0);
});
test("60 张图库覆盖所有性别、年龄、气质组合且文件唯一", async () => {
  assert.equal(portraitLibrary.length, 60);
  assert.equal(new Set(portraitLibrary.map((p) => p.path)).size, 60);
  for (const gender of ["男性", "女性", "中性"])
    for (const age of [20, 25, 31, 39, 50]) {
      const photos = portraitLibrary.filter(
        (p) => p.gender === gender && p.age_min <= age && p.age_max >= age,
      );
      assert.equal(photos.length, 4);
      for (const p of photos) {
        assert.ok(p.age_min >= 18);
        await access(path.join(process.cwd(), "public", p.path));
      }
    }
  assert.throws(() =>
    selectPortrait({
      gender: "男性",
      age: 17,
      temperament: "清爽自然",
      style: "舒适休闲",
      seed: 1,
    }),
  );
});
test("图库选择确定、优先遵守成年年龄与性别硬约束", () => {
  const query = {
    gender: "女性",
    age: 26,
    temperament: "文艺温柔",
    style: "干净简约",
    seed: 100,
  };
  assert.equal(selectPortrait(query).id, "female-23-27-soft");
  assert.deepEqual(selectPortrait(query), selectPortrait(query));
  assert.equal(
    selectPortrait({ ...query, temperament: "不限", style: "利落商务" }).id,
    "female-23-27-smart",
  );
});
test("导出 PNG 含合成内容说明元数据", async () => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
    "base64",
  );
  const result = await markSyntheticPng(new Blob([png], { type: "image/png" }));
  const bytes = Buffer.from(await result.arrayBuffer());
  assert.equal(bytes.subarray(1, 4).toString(), "PNG");
  assert.ok(bytes.includes(Buffer.from("pre-generated AI synthetic portrait")));
  assert.ok(bytes.includes(Buffer.from("tEXt")));
});
