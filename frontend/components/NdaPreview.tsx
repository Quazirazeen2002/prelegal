import { Block, Inline } from "@/lib/nda-content";

function renderInline(text: Inline[]) {
  return text.map((segment, i) =>
    typeof segment === "string" ? (
      <span key={i}>{segment}</span>
    ) : (
      <span key={i} className="underline decoration-brand-blue/60 decoration-dotted underline-offset-2">
        {segment.term}
      </span>
    )
  );
}

export default function NdaPreview({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-paper-ink">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h1":
            return (
              <h1 key={i} className="pt-4 text-xl font-bold tracking-tight text-brand-navy">
                {block.text}
              </h1>
            );
          case "h2":
            return (
              <h2 key={i} className="pt-2 text-base font-semibold text-brand-navy">
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="pt-3 text-sm font-semibold text-brand-navy">
                {block.text}
              </h3>
            );
          case "label":
            return (
              <p key={i} className="text-xs italic text-paper-ink-muted">
                {block.text}
              </p>
            );
          case "p":
            return <p key={i}>{renderInline(block.text)}</p>;
          case "olItem":
            return (
              <p key={i}>
                <span className="font-semibold text-brand-navy">{block.number}. </span>
                {renderInline(block.text)}
              </p>
            );
          case "clause": {
            const depth =
              (block.label.match(/\./g)?.length ?? 0) + (block.label.match(/\(/g)?.length ?? 0);
            return (
              <p key={i} style={{ marginLeft: `${depth * 1.25}rem` }}>
                <span className="font-semibold text-brand-navy">
                  {block.label}
                  {block.label.endsWith(")") ? "" : "."}{" "}
                </span>
                {renderInline(block.text)}
              </p>
            );
          }
          case "fieldValue":
            return (
              <p key={i} className="rounded-lg bg-brand-blue/5 px-3.5 py-2.5">
                {block.label && (
                  <span className="font-semibold text-brand-navy">{block.label}: </span>
                )}
                {block.value}
              </p>
            );
          case "checklist":
            return (
              <ul key={i} className="space-y-1">
                {block.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span>{item.checked ? "☒" : "☐"}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            );
          case "signatureTable":
            return (
              <table key={i} className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-paper-border bg-paper-overlay-faint p-2 text-left"></th>
                    <th className="border border-paper-border bg-paper-overlay-faint p-2 text-left text-brand-navy">
                      Party 1
                    </th>
                    <th className="border border-paper-border bg-paper-overlay-faint p-2 text-left text-brand-navy">
                      Party 2
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Print Name", key: "printName" as const },
                    { label: "Title", key: "title" as const },
                    { label: "Company", key: "company" as const },
                    { label: "Notice Address", key: "noticeAddress" as const },
                  ].map((row) => (
                    <tr key={row.key}>
                      <td className="border border-paper-border p-2 font-medium">
                        {row.label}
                      </td>
                      <td className="border border-paper-border p-2">
                        {block.party1[row.key] || "—"}
                      </td>
                      <td className="border border-paper-border p-2">
                        {block.party2[row.key] || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          case "divider":
            return <hr key={i} className="my-6 border-paper-border" />;
          case "footnote":
            return (
              <p key={i} className="pt-2 text-xs text-paper-ink-muted">
                {block.text}
              </p>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
