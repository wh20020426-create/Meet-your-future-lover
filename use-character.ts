"use client";
import { useEffect, useState, useCallback } from "react";
import type { Character } from "@/lib/schema";
import { api } from "@/lib/client";
export function useCharacter(id: string, example?: Character) {
  const [p, setP] = useState<Character | null>(example ?? null),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0);
  const retry = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    if (example) {
      setP(example);
      return;
    }
    let active = true;
    setError("");
    api<{ result: Character }>(`/api/results/${id}`)
      .then((d) => {
        if (active) setP(d.result);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, example, version]);
  return { p, error, retry };
}
