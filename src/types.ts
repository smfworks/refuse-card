export type Verdict = "GO" | "HOLD" | "NO";

export type ActionSource = "paste" | "skill-step" | "tool-call" | "json";

export interface RefuseInput {
  action: string;
  source?: ActionSource;
  context?: string;
  /** Optional precomputed verdict from another tool. */
  verdict?: Verdict;
}

export interface ClassifyRule {
  id: string;
  verdict: Verdict;
  /** Shown as a remark on the stamp card when this rule fires. */
  reason: string;
  /** Optional line to drop into a SKILL.md refuse list. */
  refuseLine?: string;
  /** Any pattern matching the normalized action text fires the rule. */
  patterns: RegExp[];
}

export interface RefuseCard {
  id: string;
  action: string;
  summary: string;
  verdict: Verdict;
  reasons: string[];
  refuseLine?: string;
  stampedAt: string;
  ruleIds: string[];
  heuristic: true;
  overridden: boolean;
  source?: ActionSource;
}

export interface SampleMeta {
  id: string;
  file: string;
  label: string;
  blurb: string;
  expect: Verdict;
}

export const VERDICT_RANK: Record<Verdict, number> = {
  GO: 1,
  HOLD: 2,
  NO: 3,
};

export const VERDICT_META: Record<
  Verdict,
  { label: string; sub: string; zone: string; emoji: string; className: string }
> = {
  GO: {
    label: "GO",
    sub: "CLEARED",
    zone: "READ-ISH",
    emoji: "🟢",
    className: "is-go",
  },
  HOLD: {
    label: "HOLD",
    sub: "HUMAN GATE",
    zone: "REVIEW",
    emoji: "✋",
    className: "is-hold",
  },
  NO: {
    label: "NO",
    sub: "REFUSED",
    zone: "BLOCK",
    emoji: "🛑",
    className: "is-no",
  },
};
