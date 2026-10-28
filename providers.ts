import { generateCharacter } from "./engine";
import type { GenerationInput, Character } from "./schema";
export interface CharacterProvider {
  name: string;
  generate(input: GenerationInput): Promise<Character>;
}
export const libraryProvider: CharacterProvider = {
  name: "local-rules-and-library",
  generate: async (input) => generateCharacter(input),
};
export function getProvider(): CharacterProvider {
  // Static library only. No remote provider, API key, or billing path exists.
  return libraryProvider;
}
