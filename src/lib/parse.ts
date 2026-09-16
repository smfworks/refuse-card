import type { ActionSource, RefuseCard, Verdict } from "../types.ts";
import { classifyAction } from "./classify.ts";

const VERDICTS = new Set<Verdict>(["GO", "HOLD", "NO"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

function flattenUnknown(value: unknown, depth = 0): string[] {
  if (depth > 4 || value == null) return [];
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (typeof value === "number" || typeof value === "boolean") return [String(value)];
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenUnknown(item, depth + 1)).slice(0, 12);
  }
  if (isRecord(value)) {
    const preferred = [
      "action",
      "command",
      "input",
      "prompt",
      "text",
      "content",
      "query",
      "code",
    ];
    for (const key of preferred) {
      const hit = asString(value[key]);
      if (hit) return [hit];
    }
    if (isRecord(value.function)) {
      const nested = flattenUnknown(value.function, depth + 1);
      if (nested.length) return nested;
    }
    if (isRecord(value.arguments) || isRecord(value.args)) {
      const args = flattenUnknown(value.arguments ?? value.args, depth + 1);
      const name = asString(value.name) ?? asString(value.tool);
      return name ? [`${name}: ${args.join(" ")}`, ...args] : args;
    }
    const name = asString(value.name) ?? asString(value.tool) ?? asString(value.function);
    const rest = Object.entries(value)
      .filter(([key]) => !["name", "tool", "id", "type"].includes(key))
      .flatMap(([, item]) => flattenUnknown(item, depth + 1));
    if (name && rest.length) return [`${name}: ${rest[0]}`, ...rest];
    if (rest.length) return rest;
    if (name) return [name];
  }
  return [];
}

export function extractAction(raw: string): { action: string; source?: ActionSource; preset?: Partial<RefuseCard> } {
  const trimmed = raw.trim();
  if (!trimmed) return { action: "" };

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      const parts = flattenUnknown(parsed);
      const action = parts[0] ?? trimmed;
      const source = isRecord(parsed) && asString(parsed.source);
      const preset = isRecord(parsed) && VERDICTS.has(parsed.verdict as Verdict)
        ? {
            verdict: parsed.verdict as Verdict,
            reasons: Array.isArray(parsed.reasons)
              ? parsed.reasons.filter((item): item is string => typeof item === "string")
              : undefined,
            refuseLine: asString(parsed.refuseLine),
            summary: asString(parsed.summary),
          }
        : undefined;
      const typedSource =
        source === "paste" || source === "skill-step" || source === "tool-call" || source === "json"
          ? source
          : "json";
      return { action, source: typedSource, preset };
    } catch {
      // Fall through to freeform.
    }
  }

  return { action: trimmed, source: "paste" };
}

export function cardFromPaste(
  raw: string,
  options?: { override?: Verdict | null; stampedAt?: string },
): RefuseCard | null {
  const extracted = extractAction(raw);
  if (!extracted.action) return null;

  const classified = classifyAction(extracted.action, {
    override: options?.override,
    stampedAt: options?.stampedAt,
    source: extracted.source,
  });
  if (!classified) return null;

  const preset = extracted.preset;
  if (preset?.verdict && !options?.override) {
    return {
      ...classified,
      verdict: preset.verdict,
      reasons:
        preset.reasons && preset.reasons.length > 0
          ? preset.reasons.slice(0, 3)
          : classified.reasons,
      refuseLine: preset.refuseLine ?? classified.refuseLine,
      summary: preset.summary ?? classified.summary,
      overridden: false,
      ruleIds: ["emitted-verdict", ...classified.ruleIds],
    };
  }

  return classified;
}
