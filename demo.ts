import { generateCharacter } from "./engine";
import { defaults } from "./questions";
export const demo = {
  ...generateCharacter({
    adult_confirmed: true,
    answers: { ...defaults, q03: "女性", q04: "文艺温柔" },
  }),
  id: "00000000-0000-4000-8000-000000000001",
  city: "杭州",
  name: "林知夏",
};
