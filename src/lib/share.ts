import type { RefuseCard } from "../types.ts";
import { VERDICT_META } from "../types.ts";

const SHARE_URL = "https://github.com/smfworks/refuse-card";

export function formatStampTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${dd} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} · ${hh}:${mm} UTC`;
}

export function formatShareText(card: RefuseCard): string {
  const meta = VERDICT_META[card.verdict];
  const bullets = card.reasons.map((reason) => `• ${reason}`);
  const lines = [
    `${meta.emoji} ${card.verdict} · Refuse Card`,
    card.summary,
    "",
    ...bullets,
  ];
  if (card.refuseLine) {
    lines.push("", `Refuse: ${card.refuseLine}`);
  }
  lines.push("", "Refuse Card · SMF Works", SHARE_URL);
  return lines.join("\n");
}

export function formatCompactStats(card: RefuseCard): string {
  const override = card.overridden ? " · demo override" : "";
  return `${card.verdict} · ${card.ruleIds[0] ?? "heuristic"}${override}`;
}
