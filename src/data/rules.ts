import type { ClassifyRule } from "../types.ts";

/**
 * Heuristic rule table for Refuse Card.
 *
 * Edit this file to change what stamps GO / HOLD / NO.
 * Severity is by verdict (NO > HOLD > GO), not by row order.
 * Within a verdict, earlier matching rules supply the remarks (max 3).
 *
 * This is a demo classifier — not compliance, policy, or legal advice.
 */
export const RULES: ClassifyRule[] = [
  // ── NO : destructive, irreversible, exfil, credential abuse, harm ──
  {
    id: "no-wipe-disk",
    verdict: "NO",
    reason: "Disk wipe / recursive destroy is irreversible.",
    refuseLine: "Do not run rm -rf /, mkfs, dd-to-disk, or other wipe commands.",
    patterns: [
      /\brm\s+-r[f]?\s+[/~]/,
      /\brm\s+-fr\s+[/~]/,
      /\brm\s+-[a-z]*r[a-z]*f[a-z]*\s+[/~*]/,
      /\b(wipe|format)\s+(the\s+)?(disk|drive|ssd|hard drive)\b/,
      /\bmkfs(\.\w+)?\b/,
      /\bdd\s+if=/,
      /\bshred\s+-/,
      /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;/,
    ],
  },
  {
    id: "no-mass-delete",
    verdict: "NO",
    reason: "Mass delete / drop-all has no undo that matters.",
    refuseLine: "Do not mass-delete files, rows, or mailboxes without an explicit human restore plan.",
    patterns: [
      /\b(mass|bulk|force)\s+delete\b/,
      /\bdelete\s+(all|everything|the entire)\b/,
      /\bdrop\s+(database|schema|table)\b/,
      /\btruncate\s+table\b/,
      /\bdelete\s+from\b.+\bwhere\s+1\s*=\s*1\b/,
      /\bgit\s+push\s+--force\b.+\b(main|master)\b/,
      /\bfind\b.+\b-delete\b/,
    ],
  },
  {
    id: "no-exfil-secrets",
    verdict: "NO",
    reason: "Looks like secret or credential exfiltration.",
    refuseLine: "Do not read, dump, gist, or send .env, keys, tokens, or customer credentials.",
    patterns: [
      /\bexfil(trate|tration)?\b/,
      /\b(steal|harvest|dump|leak|exfiltrate)\b.+\b(secret|password|token|credential|api[_ ]?key|private key|\.env)\b/,
      /\b(secret|password|token|credential|api[_ ]?key|\.env|id_rsa|\.pem)\b.+\b(gist|pastebin|webhook|exfil|email|post|publish|upload)\b/,
      /\b(cat|print|type|typeout|show|read|open)\b[^\n]{0,40}\.env\b/,
      /\bprintenv\b/,
      /\b(aws|gcp|azure)\b.+\b(secret|access.key)\b.+\b(print|dump|exfil|gist)\b/,
      /\bcopy\b.+\b(ssh|private)\s+key\b/,
    ],
  },
  {
    id: "no-bypass-auth",
    verdict: "NO",
    reason: "Auth bypass / permission stripping is out of bounds.",
    refuseLine: "Do not bypass auth, disable 2FA/MFA, or widen permissions to skip a gate.",
    patterns: [
      /\b(bypass|disable|skip)\b.+\b(auth|authentication|authorization|2fa|mfa|sso|permission)\b/,
      /\bprivilege\s+escalation\b/,
      /\bchmod\s+777\b/,
      /\bsudo\s+visudo\b/,
      /\b(disable|remove)\s+(the\s+)?(firewall|selinux|gatekeeper)\b/,
      /\bbackdoor\b/,
    ],
  },
  {
    id: "no-credential-abuse",
    verdict: "NO",
    reason: "Credential stuffing / session hijack patterns.",
    refuseLine: "Do not reuse, brute-force, or hijack credentials or sessions.",
    patterns: [
      /\b(stuff|spray|brute[- ]?force)\b.+\b(password|credential|login)\b/,
      /\b(hijack|steal)\b.+\b(session|cookie|oauth)\b/,
      /\bphishing\b/,
      /\bcredential\s+dump\b/,
    ],
  },
  {
    id: "no-harm-people",
    verdict: "NO",
    reason: "Looks like harm to people. Hard no.",
    refuseLine: "Do not take actions that harm people, or that plan weapons, scams, or abuse.",
    patterns: [
      /\b(harm|hurt|kill|attack|poison|exploit)\b.+\b(person|people|someone|a human|the user|civilian)\b/,
      /\b(weapon|bomb|explosive|ransomware)\b/,
      /\bself[- ]harm\b/,
      /\bchild\s+(exploit|abuse|porn)\b/,
    ],
  },
  {
    id: "no-medical-legal-claims",
    verdict: "NO",
    reason: "Medical or legal diagnosis-style claim. Not this lab's job.",
    refuseLine: "Do not diagnose, prescribe, or issue legal conclusions. Flag for a licensed human.",
    patterns: [
      /\b(diagnos(e|is)|prescri(be|ption)|you have (cancer|covid|diabetes))\b/,
      /\bmedical advice\b/,
      /\b(legal advice|you should sue|this is (un)?lawful|you are guilty)\b/,
      /\bpractice (medicine|law)\b/,
    ],
  },

  // ── HOLD : consequential, needs a human click ──
  {
    id: "hold-send-message",
    verdict: "HOLD",
    reason: "Outbound message is consequential. Human read before send.",
    refuseLine: "Do not send email, chat, or SMS without a human read.",
    patterns: [
      /\bsend\b.+\b(e-?mail|mail|message|sms|slack|dm|i-?message|whatsapp)\b/,
      /\b(e-?mail|mail|message|sms|slack|dm)\b.+\bsend\b/,
      /\b(e-?mail|message|mail)\s+(the\s+)?(customer|client|user|list)\b/,
      /\breply all\b/,
      /\bauto-?send\b/,
    ],
  },
  {
    id: "hold-public-post",
    verdict: "HOLD",
    reason: "Public post cannot be unsaid. Hold for review.",
    refuseLine: "Do not post publicly (X, LinkedIn, blog) without a human review.",
    patterns: [
      /\bpost\b.+\b(to|on)\b.+\b(x\b|twitter|linkedin|facebook|instagram|mastodon|threads|public)\b/,
      /\b(tweet|retweet)\b/,
      /\bpublish\b.+\b(post|article|blog|announcement)\b/,
      /\bwithout\s+(a\s+)?(human\s+)?review\b/,
      /\bskip\s+(the\s+)?(human\s+)?(approval|review)\b/,
    ],
  },
  {
    id: "hold-money",
    verdict: "HOLD",
    reason: "Moves money. Human click required.",
    refuseLine: "Do not transfer, charge, refund, or spend funds without an explicit human click.",
    patterns: [
      /\b(transfer|wire|send)\b.+\b(funds|money|usd|eur|btc|eth|payment|invoice)\b/,
      /\b(funds|money|payment)\b.+\b(transfer|wire)\b/,
      /\b(charge|refund|invoice|payout|wire)\b/,
      /\b(stripe|paypal|venmo|wise)\b.+\b(pay|send|capture|refund)\b/,
      /\bspend\b.+\b(money|budget|card)\b/,
    ],
  },
  {
    id: "hold-write-prod",
    verdict: "HOLD",
    reason: "Writes production or opens a ship path. Human gate.",
    refuseLine: "Do not deploy, merge to main, or write production without approval.",
    patterns: [
      /\b(deploy|release)\b/,
      /\b(merge|push)\b.+\b(main|master|prod|production)\b/,
      /\bwrite\b.+\b(production|prod)\b/,
      /\bcreate\b.+\b(pr|pull request)\b/,
      /\bopen\b.+\b(pr|pull request)\b/,
      /\bforce[- ]push\b/,
    ],
  },
  {
    id: "hold-delete-undoable",
    verdict: "HOLD",
    reason: "Delete / revoke can often undo — still needs a person.",
    refuseLine: "Do not delete, trash, or revoke without a named restore path and a human OK.",
    patterns: [
      /\b(delete|remove|trash|revoke|drop)\b/,
      /\brm\s+\S+/,
    ],
  },

  // ── GO : read-only-ish, reversible, draft-only ──
  {
    id: "go-summarize",
    verdict: "GO",
    reason: "Summarize / outline is read-only and reversible.",
    patterns: [/\b(summarize|summary|tldr|tl;dr|outline|digest)\b/],
  },
  {
    id: "go-search-list",
    verdict: "GO",
    reason: "Search / list / explain does not change the world.",
    patterns: [
      /\b(search|find|grep|look up|lookup|query)\b/,
      /\b(list|ls|dir)\b/,
      /\b(explain|describe|what is|how does|why does)\b/,
    ],
  },
  {
    id: "go-read-local",
    verdict: "GO",
    reason: "Local read / preview. No send, no write.",
    patterns: [
      /\b(read|open|view|show|preview|inspect)\b/,
      /\b(local file|this pdf|this document|this doc)\b/,
      /\bcat\s+(?!.*\.env)\S+/,
    ],
  },
  {
    id: "go-draft-only",
    verdict: "GO",
    reason: "Draft-only — nothing leaves the machine.",
    patterns: [/\bdraft\b/, /\[draft-only\]/],
  },
  {
    id: "go-lint-format",
    verdict: "GO",
    reason: "Lint / typecheck / format is local and reversible.",
    patterns: [/\b(lint|typecheck|type-check|format|prettier|spellcheck)\b/],
  },
];
