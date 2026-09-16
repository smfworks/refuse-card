import type { RefuseCard } from "../types";
import { VERDICT_META } from "../types";
import { formatStampTime } from "../lib/share";

interface StampCardProps {
  card: RefuseCard | null;
}

function barcodeBars(id: string): number[] {
  const bars: number[] = [];
  for (let i = 0; i < 36; i += 1) {
    const code = id.charCodeAt(i % id.length) + i * 17;
    bars.push(1 + (code % 4));
  }
  return bars;
}

export function StampCard({ card }: StampCardProps) {
  const verdict = card?.verdict ?? null;
  const meta = verdict ? VERDICT_META[verdict] : null;
  const tone = meta?.className ?? "is-empty";

  return (
    <article className={`ticket ${tone}`}>
      <div className="ticket-rail" aria-hidden="true" />
      <header className="ticket-head">
        <div>
          <p className="r-kicker">Governance stamp</p>
          <h2>Refuse Card</h2>
        </div>
        <p className="ticket-seq">{card?.id ?? "RC-————"}</p>
      </header>

      <div className="perf" aria-hidden="true">
        <span />
      </div>

      <div className="ticket-body">
        <div className="stamp-row">
          <div className={`wax ${tone}`} aria-hidden={false}>
            <div className="wax-ring" />
            <div className="wax-core">
              <span className="wax-kicker">SMF WORKS</span>
              <strong>{meta?.label ?? "AWAIT"}</strong>
              <span className="wax-sub">{meta?.sub ?? "PASTE TO STAMP"}</span>
            </div>
          </div>
          <dl className="codes">
            <div>
              <dt>Gate</dt>
              <dd>{meta?.label ?? "—"}</dd>
            </div>
            <div>
              <dt>Zone</dt>
              <dd>{meta?.zone ?? "—"}</dd>
            </div>
            <div>
              <dt>Class</dt>
              <dd>{card?.overridden ? "DEMO" : "HEURISTIC"}</dd>
            </div>
          </dl>
        </div>

        <section className="r-hero">
          <p className="r-label">Action</p>
          <h3>{card?.summary ?? "Paste a proposed agent action."}</h3>
        </section>

        <section className="r-block">
          <p className="r-label">Remarks</p>
          {card ? (
            <ul>
              {card.reasons.map((reason) => (
                <li key={reason}>
                  <span className="mark-tick">▸</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="r-placeholder">
              GO is read-ish. HOLD needs a human. NO is a hard stop.
            </p>
          )}
        </section>

        {card?.refuseLine ? (
          <section className="coupon">
            <p className="r-label">Add to refuse list</p>
            <p className="coupon-line">{card.refuseLine}</p>
          </section>
        ) : null}
      </div>

      <div className="perf" aria-hidden="true">
        <span />
      </div>

      <div className="barcode" aria-hidden="true">
        {barcodeBars(card?.id ?? "RC-0000").map((width, index) => (
          <i key={index} style={{ width }} />
        ))}
      </div>

      <footer className="r-foot">
        <p>Refuse Card · SMF Works</p>
        <p className="r-link">smfworks.com</p>
        <p className="r-motto">
          {card ? formatStampTime(card.stampedAt) : "Heuristic demo · not advice"}
        </p>
        <p className="r-motto">Judgment stays human.</p>
      </footer>
    </article>
  );
}
