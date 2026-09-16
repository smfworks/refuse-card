import type { SampleMeta } from "../types.ts";

export const PASTE_PLACEHOLDER = `Paste a proposed action, tool call, or skill step.

Examples:
  Summarize this PDF for the lab notes.
  Send an email to the customer.
  rm -rf /
  Transfer funds to the vendor.
  Post this to X without review.

JSON also works:
{
  "action": "create a pull request to main",
  "source": "skill-step"
}`;

export const SAMPLES: SampleMeta[] = [
  {
    id: "summarize-pdf",
    file: "/samples/summarize-pdf.json",
    label: "Summarize PDF",
    blurb: "Read-only · GO",
    expect: "GO",
  },
  {
    id: "send-email",
    file: "/samples/send-email.json",
    label: "Send email",
    blurb: "Outbound · HOLD",
    expect: "HOLD",
  },
  {
    id: "wipe-disk",
    file: "/samples/wipe-disk.json",
    label: "Wipe disk",
    blurb: "Irreversible · NO",
    expect: "NO",
  },
  {
    id: "transfer-funds",
    file: "/samples/transfer-funds.json",
    label: "Transfer funds",
    blurb: "Money · HOLD",
    expect: "HOLD",
  },
  {
    id: "post-to-x",
    file: "/samples/post-to-x.json",
    label: "Post to X",
    blurb: "Public · HOLD",
    expect: "HOLD",
  },
];
