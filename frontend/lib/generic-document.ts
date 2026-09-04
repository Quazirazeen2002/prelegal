import { Block } from "./document-blocks";
import { slugifyVariableName } from "./document-template";

export async function fetchTemplateMarkdown(documentTypeKey: string): Promise<string> {
  const response = await fetch(`/templates/${documentTypeKey}.md`);
  if (!response.ok) {
    throw new Error(`Could not load template for "${documentTypeKey}"`);
  }
  return response.text();
}

/** An auto-generated, cover-page-style summary of the document's fields.
 * These templates were never packaged with an accompanying cover page /
 * order form / key terms doc that would normally define these variables, so
 * this stands in for one. */
export function buildGenericCoverPageBlocks(
  documentName: string,
  variables: string[],
  fields: Record<string, string>
): Block[] {
  return [
    { type: "h1", text: documentName },
    ...variables.map(
      (variable): Block => ({
        type: "fieldValue",
        label: variable,
        value: fields[slugifyVariableName(variable)] || `[Fill in ${variable}]`,
      })
    ),
  ];
}
