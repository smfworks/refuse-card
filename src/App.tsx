import { SAMPLES } from "./data/samples";
import { cardFromPaste } from "./lib/parse";
import { slugify } from "./lib/classify";
import {
  copyImageBlob,
  copyText,
  downloadBlob,
  cardToPngBlob,
} from "./lib/exportImage";
import type { RefuseCard, Verdict } from "./types";
import { Actions } from "./components/Actions";
import { Composer } from "./components/Composer";
import { Header } from "./components/Header";
import { SisterStrip } from "./components/SisterStrip";
import { HandoffBanner } from "./components/HandoffBanner";
import { StampCard } from "./components/StampCard";
import { Toast } from "./components/Toast";
import { formatCompactStats, formatShareText } from "./lib/share";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function App() {
  const [raw, setRaw] = useState("");
  const [card, setCard] = useState<RefuseCard | null>(null);
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [override, setOverride] = useState<Verdict | "">("");
  const [allowOverride, setAllowOverride] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<"png" | "copy" | "share" | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setCard(cardFromPaste(raw, { override: override || null }));
    }, 80);
    return () => window.clearTimeout(handle);
  }, [raw, override]);

  const loadSample = useCallback(async (id: string) => {
    const sample = SAMPLES.find((item) => item.id === id);
    if (!sample) return;
    try {
      const response = await fetch(sample.file);
      if (!response.ok) throw new Error("missing sample");
      const data: unknown = await response.json();
      setRaw(JSON.stringify(data, null, 2));
      setSampleId(id);
      setOverride("");
    } catch {
      showToast("Could not load that sample.");
    }
  }, [showToast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sample = params.get("sample");
    if (sample) void loadSample(sample);
    const shot = params.get("shot");
    if (shot === "card" || shot === "og" || params.get("demo") === "1") {
      setAllowOverride(true);
    }
    if (shot === "card" || shot === "og") {
      document.body.classList.add(`shot-${shot}`);
    }
  }, [loadSample]);

  const reset = useCallback(() => {
    setRaw("");
    setCard(null);
    setSampleId(null);
    setOverride("");
    showToast("Cleared.");
  }, [showToast]);

  const withFrame = useCallback(async () => {
    const node = frameRef.current;
    if (!node || !card) throw new Error("Nothing to stamp yet.");
    node.classList.add("is-exporting");
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    try {
      return await cardToPngBlob(node);
    } finally {
      node.classList.remove("is-exporting");
    }
  }, [card]);

  const downloadPng = useCallback(async () => {
    if (!card) return;
    setBusy("png");
    try {
      const blob = await withFrame();
      downloadBlob(blob, `refuse-card-${slugify(card.summary)}.png`);
      showToast("PNG downloaded.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "PNG export failed.");
    } finally {
      setBusy(null);
    }
  }, [card, showToast, withFrame]);

  const copyImage = useCallback(async () => {
    if (!card) return;
    setBusy("copy");
    try {
      const blob = await withFrame();
      await copyImageBlob(blob);
      showToast("Image copied.");
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Copy image failed — try Download PNG.",
      );
    } finally {
      setBusy(null);
    }
  }, [card, showToast, withFrame]);

  const copyShare = useCallback(async () => {
    if (!card) return;
    setBusy("share");
    try {
      await copyText(formatShareText(card));
      showToast("Share text copied.");
    } catch {
      showToast("Could not copy share text.");
    } finally {
      setBusy(null);
    }
  }, [card, showToast]);

  const live = useMemo(
    () => (card ? `${card.verdict} · ${card.summary}` : "Waiting for an action"),
    [card],
  );

  return (
    <div className="page">
      <div className="ambient" aria-hidden="true" />
      <Header />
      <SisterStrip current="refuse-card" payload={raw} kind="plain" />
      <HandoffBanner accept={["plain"]} onPaste={(text) => { setRaw(text); setSampleId(null); }} />
      <main className="layout">
        <Composer
          raw={raw}
          sampleId={sampleId}
          override={override}
          allowOverride={allowOverride}
          onRawChange={(value) => {
            setSampleId(null);
            setRaw(value);
          }}
          onSample={(id) => void loadSample(id)}
          onOverride={setOverride}
        />
        <section className="stage" aria-label="Stamp preview">
          <p className="sr-only" aria-live="polite">
            {live}
          </p>
          <div className="stage-scroll">
            <div ref={frameRef} className="export-frame">
              <StampCard card={card} />
            </div>
          </div>
          {card ? <p className="stage-stats">{formatCompactStats(card)}</p> : null}
          <Actions
            disabled={!card}
            busy={busy}
            onDownload={() => void downloadPng()}
            onCopyImage={() => void copyImage()}
            onCopyShare={() => void copyShare()}
            onReset={reset}
          />
        </section>
      </main>
      <footer className="site-foot">
        <p>Refuse Card · SMF Works</p>
        <p>
          Sister apps:{" "}
          <a href="https://github.com/smfworks/paste-to-skill">Paste → Skill</a>
          {" — what to run · "}
          <a href="https://github.com/smfworks/agent-receipt">Agent Receipt</a>
          {" — what happened."}
        </p>
        <p>Intelligence is abundant. Judgment is the product.</p>
        <p>
          MIT · Built by{" "}
          <a href="https://smfworks.com" rel="noreferrer" target="_blank">
            SMF Works
          </a>
          {" · "}
          <a href="https://github.com/smfworks/refuse-card" rel="noreferrer" target="_blank">
            GitHub
          </a>
          {" · "}
          <a href="https://x.com/MichaelGannotti" rel="noreferrer" target="_blank">
            @MichaelGannotti
          </a>
        </p>
        <p className="fineprint">
          No secrets, no monetization, no medical or legal advice. A shareable
          stamp is not an audit, not compliance, and not a substitute for human
          review.
        </p>
      </footer>
      <Toast message={toast} />
    </div>
  );
}
