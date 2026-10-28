import manifest from "./library-manifest.json";
export type LibraryPortrait = (typeof manifest)[number];
export const portraitLibrary: LibraryPortrait[] = manifest;
export function selectPortrait({
  gender,
  age,
  temperament,
  style,
  seed,
}: {
  gender: string;
  age: number;
  temperament: string;
  style: string;
  seed: number;
}) {
  const eligible = portraitLibrary.filter(
    (p) => p.gender === gender && p.age_min <= age && p.age_max >= age,
  );
  if (!eligible.length)
    throw new Error("No adult portrait matches the requested constraints");
  return [...eligible].sort((a, b) => {
    const score = (p: LibraryPortrait) =>
      (p.temperament === temperament ? 60 : 0) +
      (p.style === style ? 35 : 0) +
      ((seed + portraitLibrary.indexOf(p) * 13) % 17);
    return score(b) - score(a);
  })[0];
}
