import { randomUUID, createHash } from "node:crypto";
import { defaults, type Answers } from "./questions";
import {
  characterSchema,
  requestSchema,
  type Character,
  type GenerationInput,
} from "./schema";
import { selectPortrait } from "./library";

export const WEIGHTS = [30, 25, 20, 15, 10];
export function ageConstraints(answers: Answers) {
  const base =
    {
      "18–22 岁": 20,
      "23–27 岁": 25,
      "28–34 岁": 31,
      "35–44 岁": 39,
      "45 岁及以上": 50,
    }[String(answers.q01)] ?? 25;
  const delta =
    answers.q02 === "比我略小" ? -3 : answers.q02 === "比我略大" ? 3 : 0;
  const age = Math.max(18, base + delta);
  return { age, min: Math.max(18, age - 1), max: age + 1 };
}
export function inputFingerprint(input: GenerationInput) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        a: Object.keys(input.answers)
          .sort()
          .map((k) => [k, input.answers[k]]),
        e: Object.keys(input.extras ?? {})
          .sort()
          .map((k) => [k, input.extras?.[k]]),
      }),
    )
    .digest("hex");
}
const archetypes = [
  {
    name: "温柔的同频者",
    tag: "把普通的日子，过成让你安心的样子。",
    traits: ["温柔有回应", "稳稳的陪伴", "慢生活同盟"],
    flaw: "偶尔想得太周全，反而迟迟拿不定主意。",
    social: 2,
    space: 2,
    conflict: "冷静后再谈",
  },
  {
    name: "明亮的探索家",
    tag: "喜欢新的风景，也喜欢回头时你在身旁。",
    traits: ["好奇心常驻", "乐观行动派", "认真地浪漫"],
    flaw: "遇到新鲜事容易兴奋，偶尔低估了休息的重要。",
    social: 5,
    space: 2,
    conflict: "马上说清楚",
  },
  {
    name: "清醒的同行者",
    tag: "各自闪耀，也愿意为彼此留一盏灯。",
    traits: ["尊重边界", "内心很笃定", "细节行动派"],
    flaw: "不太擅长立刻说出感受，有时需要一点整理的时间。",
    social: 3,
    space: 3,
    conflict: "冷静后再谈",
  },
];
export function generateCharacter(
  raw: GenerationInput,
  now = new Date(),
): Character {
  const input = requestSchema.parse(raw);
  const a = {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(input.answers).filter(([, v]) => v != null),
    ),
  } as Answers;
  const e = input.extras ?? {};
  const hash = inputFingerprint(input);
  const seed = parseInt(hash.slice(0, 8), 16);
  const age = ageConstraints(a);
  const gender =
    a.q03 === "男性"
      ? "男性"
      : a.q03 === "女性"
        ? "女性"
        : a.q03 === "自定义 · 中性气质"
          ? "中性"
          : (["男性", "女性", "中性"] as const)[seed % 3];
  const pronouns = gender === "男性" ? "他" : gender === "女性" ? "她" : "TA";
  const type =
    String(a.q15).startsWith("多") || a.q14 === "独立"
      ? 2
      : Number(a.q07) >= 4 || a.q17 === "去运动出汗" || a.q18 === "旅行与远方"
        ? 1
        : 0;
  const template = archetypes[type];
  const names =
    gender === "男性"
      ? [
          "林予安",
          "周知远",
          "陈叙白",
          "许南舟",
          "沈知言",
          "陆予川",
          "宋亦衡",
          "江清和",
          "程以深",
          "顾云舒",
          "苏向晨",
          "叶景行",
        ]
      : gender === "女性"
        ? [
            "林知夏",
            "沈书宁",
            "许清禾",
            "宋知微",
            "叶星宁",
            "陆予桐",
            "夏沐言",
            "唐雨禾",
            "顾清宁",
            "林予棠",
            "陈予晴",
            "周亦舒",
          ]
        : [
            "江予宁",
            "林知序",
            "陆以安",
            "沈望舒",
            "周以南",
            "叶知遥",
            "许星禾",
            "宋明澈",
            "苏向晚",
            "程予墨",
            "顾清越",
            "陈云和",
          ];
  const birthMonth = (seed % 12) + 1;
  const zodiac = [
    "摩羯座",
    "水瓶座",
    "双鱼座",
    "白羊座",
    "金牛座",
    "双子座",
    "巨蟹座",
    "狮子座",
    "处女座",
    "天秤座",
    "天蝎座",
    "射手座",
  ][birthMonth - 1];
  const city =
    a.q24 === "一线城市"
      ? "上海"
      : a.q24 === "海外"
        ? "惠灵顿"
        : a.q24 === "还没有确定"
          ? "杭州（可迁居）"
          : ["杭州", "成都", "苏州"][seed % 3];
  const young = age.age <= 22;
  const role = young
    ? "设计专业学生"
    : type === 1
      ? "户外品牌策划"
      : type === 2
        ? "数字产品设计师"
        : "生活方式编辑";
  const field =
    young || type === 2
      ? "视觉与交互设计"
      : type === 1
        ? "传播与品牌策划"
        : "中文与传播";
  const tenure = young ? 0 : Math.max(0, age.age - 23);
  const requestedStyle = String(a.q05);
  const requestedTemperament = String(a.q04);
  const portrait = selectPortrait({
    gender,
    age: age.age,
    temperament: requestedTemperament,
    style: requestedStyle,
    seed,
  });
  const style = portrait.style,
    temperament = portrait.temperament,
    image = portrait.path;
  const support = String(a.q13);
  const boundary = String(a.q15).startsWith("多")
    ? "各自保留稳定的独处时间，出门提前说明，不把即时回复当作爱的证明。"
    : String(a.q15).startsWith("少")
      ? "愿意多相处，也会坦诚说明需要休息的时刻。"
      : "亲密与独处都可以被提出，重要行程提前沟通，不查手机。";
  const routine =
    a.q19 === "夜猫子"
      ? "习惯稍晚入睡，睡前读几页书；会和你约定一个不打扰休息的联系时间。"
      : a.q19 === "不太规律"
        ? "日程有弹性，但会固定留出一起吃饭的时间，也正在练习规律休息。"
        : "早晨散步，白天专注做事，晚上把手机放远一点，给生活留白。";
  const hobbies = [
    String(a.q18),
    type === 1 ? "徒步与摄影" : type === 2 ? "独立书店与设计展" : "做饭与植物",
  ];
  const weekend =
    a.q17 === "宅家慢慢过"
      ? "周六睡到自然醒，去买新鲜食材，再一起做顿不赶时间的晚饭。"
      : a.q17 === "去运动出汗"
        ? "上午沿河慢跑，下午留给休息；偶尔计划一条难度适中的徒步路线。"
        : a.q17 === "约朋友聚会"
          ? "约几位熟悉的朋友吃饭，也会留半天给两个人安静相处。"
          : "去没逛过的小街散步，钻进一家书店，再选一间小馆子吃饭。";
  const relationshipScore = Math.round(
    90 -
      (String(a.q15).startsWith("多") && template.space < 3 ? 8 : 0) -
      (a.q25 === "保留个人自由" && type === 0 ? 5 : 0),
  );
  const communicationScore = Math.round(
    92 -
      (a.q11 !== template.conflict ? 9 : 0) -
      (a.q10 === "很少说出口" ? 5 : 0),
  );
  const lifestyleScore = Math.max(
    70,
    93 -
      Math.abs(Number(a.q07) - template.social) * 3 -
      (a.q19 === "不太规律" ? 6 : 0),
  );
  const realityScore =
    a.q24 === "还没有确定" ? 78 : a.q21 === "正在转型" ? 82 : 89;
  const aestheticScore =
    75 +
    (a.q04 === "不限" ? 8 : temperament === requestedTemperament ? 12 : 0) +
    (a.q05 === "无所谓" ? 6 : style === requestedStyle ? 7 : 0);
  const appearanceImportance = Number(a.q06);
  const aestheticWeight = 6 + appearanceImportance * (4 / 3); // q06=3 -> 10; q06=1..5 -> 7.33..12.67
  const otherScale = (100 - aestheticWeight) / 90;
  const weights = [
    30 * otherScale,
    25 * otherScale,
    20 * otherScale,
    15 * otherScale,
    aestheticWeight,
  ];
  const dimScores = [
    relationshipScore,
    communicationScore,
    lifestyleScore,
    realityScore,
    aestheticScore,
  ];
  const explanations = [
    `根据相处频率、品质、个人空间、关系目标与未来选择，设定为${template.name}。`,
    `参考情绪支持和冲突习惯；${pronouns}愿意沟通，也保留需要协调的差异。`,
    "参考社交、兴趣、作息与旅行倾向，共同兴趣之外保留各自爱好。",
    "用宽泛城市类型与工作阶段约束生活设定，不按收入或学历判断价值。",
    "先限定图库中的成年年龄段与性别呈现，再优先匹配气质、兼顾穿搭；分数不评价颜值。",
  ];
  const reasons = [
    {
      id: "q13",
      detail: `因此，${pronouns}会${support === "留一点空间" ? "先问你是否想独处，再约定稍后联系" : support === "给出实际建议" ? "先确认问题，再和你一起拆解可执行的小步骤" : support === "温柔地鼓励" ? "肯定你的努力，陪你从一件小事重新开始" : "把话听完，再问你需要拥抱还是一起想办法"}。`,
    },
    { id: "q15", detail: `因此，${pronouns}的边界设定是：${boundary}` },
    { id: "q17", detail: `这让你们的周末有了具体画面：${weekend}` },
    {
      id: "q23",
      detail: `消费设定采用「${a.q23}」的共同预算习惯；大额花费提前商量。`,
    },
    {
      id: "q25",
      detail: `面临重要选择时，${pronouns}会认真听取彼此意见，再讨论实际可行的安排。`,
    },
  ]
    .filter((r) => input.answers[r.id] != null)
    .map((r) => ({
      question: r.id.toUpperCase(),
      answer: String(input.answers[r.id]),
      detail: r.detail,
    }));
  const tensions = [
    a.q11 === "先回避一下" || a.q11 === "等对方先开口"
      ? "当你暂时不想开口时，TA 可能误以为问题已经过去。沉默需要一个明确的结束时间。"
      : template.flaw,
    a.q22 === "目前工作优先"
      ? "忙碌时可支配的时间可能不同，临时取消约定会让对方失落。"
      : "一个人想出门，一个人想休息的日子仍会出现；共同爱好并不能消除所有节奏差异。",
  ];
  const p: Character = {
    id: randomUUID(),
    schema_version: "1.0",
    fictional_disclaimer:
      "虚构人物 · 规则生成档案 · 预制 AI 合成肖像，非真人照片；不预测现实伴侣。",
    name: names[seed % names.length],
    pronouns,
    gender_presentation: gender,
    age: age.age,
    birth_month: birthMonth,
    zodiac_entertainment: `${zodiac}（仅娱乐，按虚构 ${birthMonth} 月 8 日设定）`,
    city,
    height_cm:
      (gender === "男性" ? 174 : gender === "女性" ? 160 : 167) + (seed % 9),
    tagline: template.tag,
    archetype: template.name,
    tags: template.traits,
    appearance: {
      hair: portrait.hair,
      face: "自然的面部轮廓",
      style,
      expressions: "放松、温和的神情",
      temperament,
    },
    education: { level: young ? "本科在读" : "本科", field },
    career: {
      industry: young
        ? "学习阶段"
        : type === 1
          ? "户外生活"
          : type === 2
            ? "数字创意"
            : "文化内容",
      role,
      tenure,
      income_band_illustrative: young
        ? "暂无固定收入（虚构）"
        : tenure > 12 || a.q24 === "海外"
          ? "月收入约 1.5–2.5 万元（虚构示意）"
          : "月收入约 0.8–1.5 万元（虚构示意）",
    },
    family_story: `${pronouns}在一个普通的城市家庭长大，习惯用做一顿饭、记住小偏好来表达关心。${young ? "正在学习把想法变成作品，也在慢慢寻找自己的节奏。" : `从${field}的学习走进${type === 1 ? "品牌策划" : type === 2 ? "产品设计" : "内容编辑"}工作后，逐渐明白：好生活不一定热闹，但需要认真经营。`}这些经历让${pronouns}愿意理解不同的生活选择。`,
    personality: {
      traits: template.traits,
      strengths: [`愿意认真回应你看重的「${a.q14}」`, "能欣赏彼此的不同"],
      flaws: [template.flaw],
      decision_style: `尊重「${a.q08}」的决策习惯，遇到大事先交换信息，再给彼此整理想法的时间。`,
      stress_support: `压力大时参考「${a.q09}」的倾向，先确认是否需要陪伴，不把自己的安慰方式强加给你。`,
    },
    lifestyle: {
      routine,
      hobbies,
      food: e.e05 ?? "热乎的家常菜，也愿意陪你找新口味",
      music: e.e03 ?? "通勤时的独立民谣，周末的轻爵士",
      travel:
        a.q20 === "高，总想看看更大的世界"
          ? "愿意认真攒假期，看山海，也探索小城。"
          : a.q20 === "低，更喜欢熟悉的地方"
            ? "更珍惜熟悉的日常，偶尔安排附近短途散步。"
            : "每年安排几次短途旅行，慢慢走，不赶景点。",
      weekend,
      pet: e.e02 ?? "喜欢小动物，但会先商量养宠的时间与责任",
      exercise: e.e01 ?? "晚饭后散步，偶尔一起运动",
      planning: e.e06 ?? "提前商量重要安排，小事留些即兴",
      living_environment: e.e07 ?? "安静又有生活气息的社区",
    },
    relationship: {
      love_language:
        e.e08 ??
        (support === "给出实际建议"
          ? "用实际行动分担小事"
          : "认真倾听，并留出不被手机打断的时间"),
      conflict_style:
        template.conflict === "马上说清楚"
          ? "倾向及时说清楚，也会尊重你提出的暂停。"
          : "先冷静，再主动约一个具体时间，把感受和需要说清楚。",
      boundaries:
        boundary + (e.e09 ? `独处时间参考：${e.e09}，具体安排共同商量。` : ""),
      goals: String(a.q16),
      contact_frequency: String(a.q12),
      bottom_line: e.e10 ?? "平等、诚实，尊重彼此边界",
    },
    compatibility: {
      total: Math.round(
        dimScores.reduce((sum, score, i) => sum + score * weights[i], 0) / 100,
      ),
      score_by_dimension: [
        "关系价值观",
        "沟通与冲突",
        "生活方式",
        "现实条件",
        "审美偏好",
      ].map((label, i) => ({
        key: ["values", "communication", "lifestyle", "reality", "appearance"][
          i
        ],
        label,
        weight: weights[i],
        score: dimScores[i],
        explanation: explanations[i],
      })),
      reasons,
      tensions,
      advice: [
        "遇到分歧时，用「我感到……我需要……」代替替对方下结论。",
        "提前商量联系频率与独处时间，每周用十分钟重新对齐期待。",
      ],
      coverage: Object.values(input.answers).filter((v) => v != null).length,
    },
    meet_cute: `一个不赶时间的周日下午，你在${type === 1 ? "河边的咖啡小摊" : type === 2 ? "安静的设计书店" : "巷子里的独立书店"}停下脚步。${pronouns}也恰好在那里。你们从${String(a.q18).split("与")[0]}聊起，聊到天色渐暗。没有预设的命中注定，只是一句：「下次，要不要一起再来？」`,
    date_story: e.e04
      ? `你们约好${e.e04}。偶尔冷场，也不急着填满。对方记得先问一句：「今天的你，想热闹一点还是安静一点？」`
      : "你们一起去买菜，认真争论番茄炒蛋要不要加糖。回家的路上顺手买了一束花，晚饭有一点做咸了，却依然是个值得记住的晚上。",
    portrait_id: portrait.id,
    portrait_source: "pre-generated-ai-library",
    image_url: image,
    generated_at: now.toISOString(),
    expiry_at: new Date(now.getTime() + 30 * 86400000).toISOString(),
    mode: "library",
    modeling: {
      user_traits: {
        social_energy: Number(a.q07),
        decision: String(a.q08),
        stress: String(a.q09),
        emotion: String(a.q10),
        conflict: String(a.q11),
        routine: String(a.q19),
        work_life: String(a.q22),
        spending: String(a.q23),
        future: String(a.q25),
      },
      partner_preferences: {
        gender: String(a.q03),
        age_gap: String(a.q02),
        temperament,
        style,
        appearance_importance: appearanceImportance,
        contact: String(a.q12),
        support: String(a.q13),
        priority: String(a.q14),
        space: String(a.q15),
        goal: String(a.q16),
        city: String(a.q24),
        boundary: e.e10 ?? "尊重与平等",
      },
      character_constraints: {
        adult: true,
        age_min: age.min,
        age_max: age.max,
        gender,
      },
    },
  };
  return characterSchema.parse(p);
}
