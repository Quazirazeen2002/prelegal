import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Block, Inline } from "@/lib/document-blocks";

function clauseDepth(label: string): number {
  return (label.match(/\./g)?.length ?? 0) + (label.match(/\(/g)?.length ?? 0);
}

const styles = StyleSheet.create({
  page: {
    paddingVertical: 48,
    paddingHorizontal: 56,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#18181b",
  },
  h1: { fontSize: 16, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 6 },
  h2: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 4 },
  h3: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 2 },
  label: { fontSize: 8, fontStyle: "italic", color: "#71717a", marginBottom: 2 },
  p: { marginBottom: 6, lineHeight: 1.4 },
  fieldValue: { marginBottom: 6, backgroundColor: "#fafafa", padding: 6 },
  fieldLabel: { fontFamily: "Helvetica-Bold" },
  term: { textDecoration: "underline" },
  checklistItem: { flexDirection: "row", marginBottom: 2 },
  checklistBox: { width: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#d4d4d8", marginVertical: 16 },
  footnote: { fontSize: 8, color: "#a1a1aa", marginTop: 6 },
  table: { marginTop: 8, marginBottom: 6 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#d4d4d8" },
  tableHeaderCell: {
    flex: 1,
    padding: 4,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#fafafa",
  },
  tableLabelCell: { width: 100, padding: 4, fontFamily: "Helvetica-Bold" },
  tableCell: { flex: 1, padding: 4 },
});

function InlineText({ text }: { text: Inline[] }) {
  return (
    <Text>
      {text.map((segment, i) =>
        typeof segment === "string" ? (
          segment
        ) : (
          <Text key={i} style={styles.term}>
            {segment.term}
          </Text>
        )
      )}
    </Text>
  );
}

type Props = {
  blocks: Block[];
  title?: string;
};

export default function NdaPdfDocument({ blocks, title = "Mutual Non-Disclosure Agreement" }: Props) {
  return (
    <Document title={title}>
      <Page size="A4" style={styles.page} wrap>
        {blocks.map((block, i) => {
          switch (block.type) {
            case "h1":
              return (
                <Text key={i} style={styles.h1}>
                  {block.text}
                </Text>
              );
            case "h2":
              return (
                <Text key={i} style={styles.h2}>
                  {block.text}
                </Text>
              );
            case "h3":
              return (
                <Text key={i} style={styles.h3}>
                  {block.text}
                </Text>
              );
            case "label":
              return (
                <Text key={i} style={styles.label}>
                  {block.text}
                </Text>
              );
            case "p":
              return (
                <View key={i} style={styles.p}>
                  <InlineText text={block.text} />
                </View>
              );
            case "olItem":
              return (
                <View key={i} style={styles.p}>
                  <InlineText
                    text={[`${block.number}. `, ...block.text]}
                  />
                </View>
              );
            case "clause":
              return (
                <View key={i} style={[styles.p, { marginLeft: clauseDepth(block.label) * 14 }]}>
                  <InlineText
                    text={[`${block.label}${block.label.endsWith(")") ? "" : "."} `, ...block.text]}
                  />
                </View>
              );
            case "fieldValue":
              return (
                <View key={i} style={styles.fieldValue}>
                  <Text>
                    {block.label && (
                      <Text style={styles.fieldLabel}>{block.label}: </Text>
                    )}
                    {block.value}
                  </Text>
                </View>
              );
            case "checklist":
              return (
                <View key={i}>
                  {block.items.map((item, j) => (
                    <View key={j} style={styles.checklistItem}>
                      <Text style={styles.checklistBox}>
                        {item.checked ? "[x]" : "[ ]"}
                      </Text>
                      <Text>{item.text}</Text>
                    </View>
                  ))}
                </View>
              );
            case "signatureTable": {
              const rows: { label: string; key: keyof typeof block.party1 }[] = [
                { label: "Print Name", key: "printName" },
                { label: "Title", key: "title" },
                { label: "Company", key: "company" },
                { label: "Notice Address", key: "noticeAddress" },
              ];
              return (
                <View key={i} style={styles.table}>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabelCell}></Text>
                    <Text style={styles.tableHeaderCell}>Party 1</Text>
                    <Text style={styles.tableHeaderCell}>Party 2</Text>
                  </View>
                  {rows.map((row) => (
                    <View key={row.key} style={styles.tableRow}>
                      <Text style={styles.tableLabelCell}>{row.label}</Text>
                      <Text style={styles.tableCell}>
                        {block.party1[row.key] || "—"}
                      </Text>
                      <Text style={styles.tableCell}>
                        {block.party2[row.key] || "—"}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            }
            case "divider":
              return <View key={i} style={styles.divider} />;
            case "footnote":
              return (
                <Text key={i} style={styles.footnote}>
                  {block.text}
                </Text>
              );
            default:
              return null;
          }
        })}
      </Page>
    </Document>
  );
}
