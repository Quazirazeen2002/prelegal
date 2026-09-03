import { Block, Inline } from "@/lib/nda-content";

function renderInline(text: Inline[]) {
  return text.map((segment, i) =>
    typeof segment === "string" ? (
      <span key={i}>{segment}</span>
    ) : (
      <span key={i} className="underline decoration-dotted underline-offset-2">
        {segment.term}
      </span>
    )
  );
}

export default function NdaPreview({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-zinc-800">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h1":
            return (
              <h1 key={i} className="pt-4 text-xl font-bold text-zinc-900">
                {block.text}
              </h1>
            );
          case "h2":
            return (
              <h2 key={i} className="pt-2 text-base font-semibold text-zinc-900">
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="pt-3 text-sm font-semibold text-zinc-900">
                {block.text}
              </h3>
            );
          case "label":
            return (
              <p key={i} className="text-xs italic text-zinc-500">
                {block.text}
              </p>
            );
          case "p":
            return <p key={i}>{renderInline(block.text)}</p>;
          case "olItem":
            return (
              <p key={i}>
                <span className="font-semibold">{block.number}. </span>
                {renderInline(block.text)}
              </p>
            );
          case "fieldValue":
            return (
              <p key={i} className="rounded-md bg-zinc-50 px-3 py-2">
                {block.label && (
                  <span className="font-semibold">{block.label}: </span>
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
                    <th className="border border-zinc-300 bg-zinc-50 p-2 text-left"></th>
                    <th className="border border-zinc-300 bg-zinc-50 p-2 text-left">
                      Party 1
                    </th>
                    <th className="border border-zinc-300 bg-zinc-50 p-2 text-left">
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
                      <td className="border border-zinc-300 p-2 font-medium">
                        {row.label}
                      </td>
                      <td className="border border-zinc-300 p-2">
                        {block.party1[row.key] || "—"}
                      </td>
                      <td className="border border-zinc-300 p-2">
                        {block.party2[row.key] || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          case "divider":
            return <hr key={i} className="my-6 border-zinc-300" />;
          case "footnote":
            return (
              <p key={i} className="pt-2 text-xs text-zinc-400">
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
