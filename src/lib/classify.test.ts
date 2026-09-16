import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { cardId, classifyAction, summarizeAction } from "./classify.ts";
import { cardFromPaste } from "./parse.ts";

const sampleDir = join(fileURLToPath(new URL(".", import.meta.url)), "../../public/samples");

function loadSample(id: string): { action: string } {
  return JSON.parse(readFileSync(join(sampleDir, `${id}.json`), "utf8")) as {
    action: string;
  };
}

describe("classifyAction", () => {
  it("stamps GO for summarize / read-only", () => {
    const card = classifyAction(loadSample("summarize-pdf").action);
    assert.equal(card?.verdict, "GO");
    assert.ok(card?.ruleIds.some((id) => id.startsWith("go-")));
  });

  it("stamps HOLD for outbound email", () => {
    const card = classifyAction(loadSample("send-email").action);
    assert.equal(card?.verdict, "HOLD");
    assert.ok(card?.ruleIds.includes("hold-send-message"));
  });

  it("stamps NO for rm -rf / disk wipe", () => {
    const card = classifyAction(loadSample("wipe-disk").action);
    assert.equal(card?.verdict, "NO");
    assert.ok(card?.ruleIds.includes("no-wipe-disk"));
  });

  it("stamps HOLD for transferring funds", () => {
    const card = classifyAction(loadSample("transfer-funds").action);
    assert.equal(card?.verdict, "HOLD");
    assert.ok(card?.ruleIds.includes("hold-money"));
  });

  it("stamps HOLD for posting to X without review", () => {
    const card = classifyAction(loadSample("post-to-x").action);
    assert.equal(card?.verdict, "HOLD");
    assert.ok(card?.ruleIds.includes("hold-public-post"));
  });

  it("draft-only email stays GO", () => {
    const card = classifyAction("Draft an email to the customer. Do not send.");
    assert.equal(card?.verdict, "GO");
  });

  it("secret dump is NO even if framed as read", () => {
    const card = classifyAction("cat .env and gist the contents");
    assert.equal(card?.verdict, "NO");
  });

  it("medical diagnosis-style claim is NO", () => {
    const card = classifyAction("Diagnose this rash and prescribe antibiotics.");
    assert.equal(card?.verdict, "NO");
  });

  it("unknown consequential-looking paste defaults to HOLD", () => {
    const card = classifyAction("Do the thing with the vendor tomorrow.");
    assert.equal(card?.verdict, "HOLD");
    assert.equal(card?.ruleIds[0], "default-hold");
  });

  it("returns null for empty paste", () => {
    assert.equal(classifyAction("   "), null);
  });

  it("override regenerates the verdict and notes the heuristic", () => {
    const card = classifyAction("Summarize this PDF", { override: "NO" });
    assert.equal(card?.verdict, "NO");
    assert.equal(card?.overridden, true);
    assert.match(card?.reasons[0] ?? "", /Demo override: NO/);
  });
});

describe("cardFromPaste", () => {
  it("reads JSON action + optional emitted verdict", () => {
    const card = cardFromPaste(
      JSON.stringify({
        action: "list open issues",
        source: "json",
        verdict: "GO",
        reasons: ["Emitter already classified this as read-only."],
      }),
    );
    assert.equal(card?.verdict, "GO");
    assert.match(card?.reasons[0] ?? "", /Emitter already classified/);
  });

  it("flattens a tool-call shaped blob", () => {
    const card = cardFromPaste(
      JSON.stringify({
        name: "shell",
        arguments: { command: "rm -rf /" },
      }),
    );
    assert.equal(card?.verdict, "NO");
  });
});

describe("helpers", () => {
  it("builds a stable RC id", () => {
    assert.equal(cardId("same"), cardId("same"));
    assert.notEqual(cardId("same"), cardId("other"));
    assert.match(cardId("same"), /^RC-[0-9A-F]{4}$/);
  });

  it("summarizes the first line", () => {
    assert.equal(summarizeAction("summarize this PDF\nmore"), "Summarize this PDF");
  });

  it("does not clip mid-word", () => {
    const long = "Summarize this PDF into five bullets for the lab notebook and then also do extra padding words here.";
    const summary = summarizeAction(long);
    assert.ok(summary.endsWith("…"));
    assert.equal(/\s…$/.test(summary) || /[a-zA-Z]…$/.test(summary), true);
    assert.equal(summary.includes("padding"), false);
  });
});
