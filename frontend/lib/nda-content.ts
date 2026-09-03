import { NdaFormData, PartyInfo, formatEffectiveDate, orPlaceholder } from "./nda";

/**
 * Structured, renderer-agnostic representation of the NDA document so the
 * on-screen HTML preview and the downloadable PDF render identical legal
 * text from a single source instead of duplicating it per-renderer.
 */

export type Inline = string | { term: string };

export type Block =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: Inline[] }
  | { type: "label"; text: string }
  | { type: "olItem"; number: number; text: Inline[] }
  | { type: "checklist"; items: { checked: boolean; text: string }[] }
  | { type: "fieldValue"; label: string; value: string }
  | { type: "signatureTable"; party1: PartyInfo; party2: PartyInfo }
  | { type: "divider" }
  | { type: "footnote"; text: string };

export function buildCoverPageBlocks(data: NdaFormData): Block[] {
  const effectiveDate = formatEffectiveDate(data.effectiveDate);

  return [
    { type: "h1", text: "Mutual Non-Disclosure Agreement" },
    { type: "h2", text: "Using this Mutual Non-Disclosure Agreement" },
    {
      type: "p",
      text: [
        'This Mutual Non-Disclosure Agreement (the "MNDA") consists of: (1) this Cover Page and (2) the Common Paper Mutual NDA Standard Terms Version 1.0, set out below. Any modifications of the Standard Terms are made on this Cover Page, which controls over conflicts with the Standard Terms.',
      ],
    },
    { type: "h3", text: "Purpose" },
    { type: "label", text: "How Confidential Information may be used" },
    { type: "fieldValue", label: "", value: data.purpose.trim() || "[Purpose not specified]" },

    { type: "h3", text: "Effective Date" },
    { type: "fieldValue", label: "", value: effectiveDate },

    { type: "h3", text: "MNDA Term" },
    { type: "label", text: "The length of this MNDA" },
    {
      type: "checklist",
      items: [
        {
          checked: data.mndaTermType === "expires",
          text: `Expires ${data.mndaTermYears} year(s) from Effective Date.`,
        },
        {
          checked: data.mndaTermType === "perpetual",
          text: "Continues until terminated in accordance with the terms of the MNDA.",
        },
      ],
    },

    { type: "h3", text: "Term of Confidentiality" },
    { type: "label", text: "How long Confidential Information is protected" },
    {
      type: "checklist",
      items: [
        {
          checked: data.confidentialityTermType === "term",
          text: `${data.confidentialityTermYears} year(s) from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.`,
        },
        {
          checked: data.confidentialityTermType === "perpetual",
          text: "In perpetuity.",
        },
      ],
    },

    { type: "h3", text: "Governing Law & Jurisdiction" },
    {
      type: "fieldValue",
      label: "Governing Law",
      value: orPlaceholder(data.governingLaw, "[Fill in state]"),
    },
    {
      type: "fieldValue",
      label: "Jurisdiction",
      value: orPlaceholder(
        data.jurisdiction,
        '[Fill in city or county and state, i.e. "New Castle, DE"]'
      ),
    },

    { type: "h3", text: "MNDA Modifications" },
    { type: "label", text: "List any modifications to the MNDA" },
    { type: "fieldValue", label: "", value: data.modifications.trim() || "None." },

    {
      type: "p",
      text: [
        "By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.",
      ],
    },
    { type: "signatureTable", party1: data.party1, party2: data.party2 },
    {
      type: "footnote",
      text: "Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under CC BY 4.0.",
    },
  ];
}

export function buildStandardTermsBlocks(): Block[] {
  return [
    { type: "h1", text: "Standard Terms" },
    {
      type: "olItem",
      number: 1,
      text: [
        'Introduction. This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page (defined below)) ("MNDA") allows each party ("Disclosing Party") to disclose or make available information in connection with the ',
        { term: "Purpose" },
        ' which (1) the Disclosing Party identifies to the receiving party ("Receiving Party") as "confidential", "proprietary", or the like or (2) should be reasonably understood as confidential or proprietary due to its nature and the circumstances of its disclosure ("Confidential Information"). Each party’s Confidential Information also includes the existence and status of the parties’ discussions and information on the Cover Page. Confidential Information includes technical or business information, product designs or roadmaps, requirements, pricing, security and compliance documentation, technology, inventions and know-how. To use this MNDA, the parties must complete and sign a cover page incorporating these Standard Terms ("Cover Page"). Each party is identified on the Cover Page and capitalized terms have the meanings given herein or on the Cover Page.',
      ],
    },
    {
      type: "olItem",
      number: 2,
      text: [
        "Use and Protection of Confidential Information. The Receiving Party shall: (a) use Confidential Information solely for the ",
        { term: "Purpose" },
        "; (b) not disclose Confidential Information to third parties without the Disclosing Party’s prior written approval, except that the Receiving Party may disclose Confidential Information to its employees, agents, advisors, contractors and other representatives having a reasonable need to know for the ",
        { term: "Purpose" },
        ", provided these representatives are bound by confidentiality obligations no less protective of the Disclosing Party than the applicable terms in this MNDA and the Receiving Party remains responsible for their compliance with this MNDA; and (c) protect Confidential Information using at least the same protections the Receiving Party uses for its own similar information but no less than a reasonable standard of care.",
      ],
    },
    {
      type: "olItem",
      number: 3,
      text: [
        'Exceptions. The Receiving Party’s obligations in this MNDA do not apply to information that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it independently developed without using or referencing the Confidential Information.',
      ],
    },
    {
      type: "olItem",
      number: 4,
      text: [
        "Disclosures Required by Law. The Receiving Party may disclose Confidential Information to the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to the extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required disclosure and reasonably cooperates, at the Disclosing Party’s expense, with the Disclosing Party’s efforts to obtain confidential treatment for the Confidential Information.",
      ],
    },
    {
      type: "olItem",
      number: 5,
      text: [
        "Term and Termination. This MNDA commences on the ",
        { term: "Effective Date" },
        " and expires at the end of the ",
        { term: "MNDA Term" },
        ". Either party may terminate this MNDA for any or no reason upon written notice to the other party. The Receiving Party’s obligations relating to Confidential Information will survive for the ",
        { term: "Term of Confidentiality" },
        ", despite any expiration or termination of this MNDA.",
      ],
    },
    {
      type: "olItem",
      number: 6,
      text: [
        "Return or Destruction of Confidential Information. Upon expiration or termination of this MNDA or upon the Disclosing Party’s earlier request, the Receiving Party will: (a) cease using Confidential Information; (b) promptly after the Disclosing Party’s written request, destroy all Confidential Information in the Receiving Party’s possession or control or return it to the Disclosing Party; and (c) if requested by the Disclosing Party, confirm its compliance with these obligations in writing. As an exception to subsection (b), the Receiving Party may retain Confidential Information in accordance with its standard backup or record retention policies or as required by law, but the terms of this MNDA will continue to apply to the retained Confidential Information.",
      ],
    },
    {
      type: "olItem",
      number: 7,
      text: [
        "Proprietary Rights. The Disclosing Party retains all of its intellectual property and other rights in its Confidential Information and its disclosure to the Receiving Party grants no license under such rights.",
      ],
    },
    {
      type: "olItem",
      number: 8,
      text: [
        'Disclaimer. ALL CONFIDENTIAL INFORMATION IS PROVIDED "AS IS", WITH ALL FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.',
      ],
    },
    {
      type: "olItem",
      number: 9,
      text: [
        "Governing Law and Jurisdiction. This MNDA and all matters relating hereto are governed by, and construed in accordance with, the laws of the State of ",
        { term: "Governing Law" },
        ", without regard to the conflict of laws provisions of such ",
        { term: "Governing Law" },
        ". Any legal suit, action, or proceeding relating to this MNDA must be instituted in the federal or state courts located in ",
        { term: "Jurisdiction" },
        ". Each party irrevocably submits to the exclusive jurisdiction of such ",
        { term: "Jurisdiction" },
        " in any such suit, action, or proceeding.",
      ],
    },
    {
      type: "olItem",
      number: 10,
      text: [
        "Equitable Relief. A breach of this MNDA may cause irreparable harm for which monetary damages are an insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to seek appropriate equitable relief, including an injunction, in addition to its other remedies.",
      ],
    },
    {
      type: "olItem",
      number: 11,
      text: [
        "General. Neither party has an obligation under this MNDA to disclose Confidential Information to the other or proceed with any proposed transaction. Neither party may assign this MNDA without the prior written consent of the other party, except that either party may assign this MNDA in connection with a merger, reorganization, acquisition or other transfer of all or substantially all its assets or voting securities. Any assignment in violation of this Section is null and void. This MNDA will bind and inure to the benefit of each party’s permitted successors and assigns. Waivers must be signed by the waiving party’s authorized representative and cannot be implied from conduct. If any provision of this MNDA is held unenforceable, it will be limited to the minimum extent necessary so the rest of this MNDA remains in effect. This MNDA (including the Cover Page) constitutes the entire agreement of the parties with respect to its subject matter, and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, whether written or oral, regarding such subject matter. This MNDA may only be amended, modified, waived, or supplemented by an agreement in writing signed by both parties. Notices, requests and approvals under this MNDA must be sent in writing to the email or postal addresses on the Cover Page and are deemed delivered on receipt. This MNDA may be executed in counterparts, including electronic copies, each of which is deemed an original and which together form the same agreement.",
      ],
    },
    {
      type: "footnote",
      text: "Common Paper Mutual Non-Disclosure Agreement Version 1.0, free to use under CC BY 4.0.",
    },
  ];
}

export function buildNdaDocumentBlocks(data: NdaFormData): Block[] {
  return [
    ...buildCoverPageBlocks(data),
    { type: "divider" },
    ...buildStandardTermsBlocks(),
  ];
}
