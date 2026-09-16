import { PASTE_PLACEHOLDER, SAMPLES } from "../data/samples";
import type { Verdict } from "../types";

interface ComposerProps {
  raw: string;
  sampleId: string | null;
  override: Verdict | "";
  onRawChange: (value: string) => void;
  onSample: (id: string) => void;
  onOverride: (value: Verdict | "") => void;
}

export function Composer({
  raw,
  sampleId,
  override,
  onRawChange,
  onSample,
  onOverride,
}: ComposerProps) {
  return (
    <section className="composer">
      <div className="composer-head">
        <h2>Proposed action</h2>
        <p>Pick a sample or paste a tool call, skill step, or messy line.</p>
      </div>
      <div className="sample-row" role="list">
        {SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            role="listitem"
            className={sampleId === sample.id ? "chip is-on" : "chip"}
            onClick={() => onSample(sample.id)}
          >
            <span className="chip-top">
              <i className={`dot is-${sample.expect.toLowerCase()}`} aria-hidden="true" />
              {sample.label}
            </span>
            <small>{sample.blurb}</small>
          </button>
        ))}
      </div>
      <label className="editor-label" htmlFor="action-input">
        Action, tool call, or JSON
      </label>
      <textarea
        id="action-input"
        value={raw}
        onChange={(event) => onRawChange(event.target.value)}
        placeholder={PASTE_PLACEHOLDER}
        spellCheck={false}
        autoComplete="off"
      />
      <div className="composer-foot">
        <label className="override">
          <span>Demo override</span>
          <select
            value={override}
            onChange={(event) => onOverride(event.target.value as Verdict | "")}
          >
            <option value="">Heuristic</option>
            <option value="GO">Force GO</option>
            <option value="HOLD">Force HOLD</option>
            <option value="NO">Force NO</option>
          </select>
        </label>
        <span>
          {raw.trim() ? `${raw.length.toLocaleString()} chars` : "Client-side only · no API"}
        </span>
      </div>
      <p className="disclaimer">
        Heuristic demo. Not compliance, not legal advice, not a policy engine.
        Judgment stays human.
      </p>
    </section>
  );
}
