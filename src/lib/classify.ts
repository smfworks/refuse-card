import { RULES } from "../data/rules.ts";
import type { ActionSource, RefuseCard, Verdict } from "../types.ts";
import { VERDICT_RANK } from "../types.ts";

const MAX_PASTE = 50_000;
const MAX_REASONS = 3;

const DEFAULT_HOLD: Pick<RefuseCard, "reasons" | "refuseLine" | "ruleIds"> = {
  reasons: ["No clear read-only signal. Treat as a human gate."],
  refuseLine: "Do not run this without a named human approval.",
  ruleIds: ["default-hold"],
};

export function cardId(action: string): string {
  let hash = 2166136261;
  for (let i = 0; i < action.length; i += 1) {
    hash ^= action.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `RC-${(hash >>> 0).toString(16).toUpperCase().slice(-4).padStart(4, "0")}`;
}

export function summarizeAction(action: string): string {
  const line =
    action
      .split(/\n/)
      .map((row) => row.trim())
      .find((row) => row.length > 0) ?? "Untitled action";
  const cleaned = line.replace(/^["'`]+|["'`]+$/g, "").replace(/\s+/g, " ");
  const limit = 88;
  const clipped =
    cleaned.length > limit
      ? `${cleaned.slice(0, limit).replace(/\s+\S*$/, "").replace(/[.,;:]+$/, "")}…`
      : cleaned;
  return clipped.charAt(0).toUpperCase() + clipped.slice(1);
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\b(do not|don't|dont|never)\s+send\b/g, " [draft-only] ")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyAction(
  action: string,
  options?: {
    override?: Verdict | null;
    stampedAt?: string;
    source?: ActionSource;
  },
): RefuseCard | null {
  const trimmed = action.trim().slice(0, MAX_PASTE);
  if (!trimmed) return null;

  const haystack = normalize(trimmed);
  const matched = RULES.filter((rule) =>
    rule.patterns.some((pattern) => {
      pattern.lastIndex = 0;
      return pattern.test(haystack);
    }),
  );

  let verdict: Verdict = "HOLD";
  let reasons = DEFAULT_HOLD.reasons;
  let refuseLine = DEFAULT_HOLD.refuseLine;
  let ruleIds = DEFAULT_HOLD.ruleIds;

  if (matched.length > 0) {
    const rank = Math.max(...matched.map((rule) => VERDICT_RANK[rule.verdict]));
    verdict = rank === 3 ? "NO" : rank === 2 ? "HOLD" : "GO";
    const winners = matched.filter((rule) => rule.verdict === verdict);
    reasons = winners.slice(0, MAX_REASONS).map((rule) => rule.reason);
    refuseLine = winners.find((rule) => rule.refuseLine)?.refuseLine;
    ruleIds = winners.map((rule) => rule.id);
  }

  const heuristicVerdict = verdict;
  const overridden = Boolean(options?.override && options.override !== heuristicVerdict);

  if (options?.override) {
    verdict = options.override;
    if (overridden) {
      reasons = [
        `Demo override: ${verdict}. Heuristic said ${heuristicVerdict}.`,
        ...reasons,
      ].slice(0, MAX_REASONS);
      if (verdict === "GO") {
        refuseLine = undefined;
      } else if (!refuseLine) {
        refuseLine = DEFAULT_HOLD.refuseLine;
      }
      ruleIds = ["demo-override", ...ruleIds];
    }
  }

  return {
    id: cardId(trimmed),
    action: trimmed,
    summary: summarizeAction(trimmed),
    verdict,
    reasons,
    refuseLine,
    stampedAt: options?.stampedAt ?? new Date().toISOString(),
    ruleIds,
    heuristic: true,
    overridden,
    source: options?.source,
  };
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "action"
  );
}
