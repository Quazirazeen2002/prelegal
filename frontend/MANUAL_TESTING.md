# Manual test plan: Mutual NDA Creator

Automated tests (`npm test`) cover the form/preview/PDF wiring and the generated PDF's
text content. They can't verify visual layout, real browser download behavior, or
subjective legal-document readability — this checklist is for a human to exercise
those by hand before a release.

Setup: `npm install && npm run dev`, then open `http://localhost:3000`.

## Golden path

1. Leave every field at its default and confirm the preview shows a coherent
   Mutual NDA (Cover Page followed by Standard Terms) with no `undefined`,
   `NaN`, or broken layout.
2. Fill in every field: purpose, effective date, both MNDA-term options (try each
   radio), both confidentiality-term options, governing law, jurisdiction,
   modifications, and both parties' company/print name/title/notice address.
3. Confirm the preview updates immediately after each edit, with no stale values.
4. Click **Download PDF**. Confirm a file named `mutual-nda.pdf` downloads and:
   - Opens cleanly in your OS's PDF viewer (not just a PDF-capable browser tab).
   - Matches the on-screen preview's content and field values.
   - Paginates sensibly — no clipped text, no content overlapping a page break.
   - Has a readable font size and margins when printed on US Letter or A4 paper.

## Edge cases

- **Very long input**: paste a multi-paragraph purpose statement and a long
  modifications note. Confirm the PDF paginates instead of clipping or
  overflowing a page.
- **Special characters**: use an ampersand, quotes, an em dash, and a non-Latin
  name (e.g. "Zoë Müller") in the party fields. Confirm both the preview and the
  PDF render them correctly (no mangled encoding).
- **Blank required-looking fields**: leave governing law, jurisdiction, and
  modifications blank and confirm the document shows the bracketed placeholder
  text (e.g. `[Fill in state]`) rather than blank space or a crash.
- **MNDA term = 0 or negative**: try typing `0` or a negative number into the
  term-years fields. Confirm the app clamps to a minimum of 1 rather than
  showing `0`, a negative number, or `NaN`.
- **Switching term types back and forth**: toggle each radio pair (expires ↔
  perpetual) several times and confirm the disabled/enabled state of the years
  input and the preview's checked box track the current selection every time.
- **Effective date near year/month boundaries**: set the date to Jan 1 and Dec
  31 of some year. Confirm the formatted date in the preview and PDF matches
  the date you picked (no off-by-one-day shift).

## Cross-browser / responsive

- Repeat the golden path in at least two browsers (e.g. Chrome and Safari or
  Firefox), since PDF download behavior differs by browser.
- Resize the window to a mobile width (~375px). Confirm the form and preview
  stack usably and nothing is clipped or unreachable.
- Tab through the entire form using only the keyboard. Confirm every field is
  reachable in a sensible order and the currently focused field is visibly
  indicated.

## Regression watch-list

Re-check these specifically after any change to `lib/nda-content.ts` or the PDF
renderer, since they're easy to silently break:

- The Standard Terms clause numbers are 1–11, in order, with no gaps or repeats.
- Each `coverpage_link` cross-reference (Purpose, Effective Date, MNDA Term,
  Term of Confidentiality, Governing Law, Jurisdiction) still appears exactly
  where the source templates (`templates/mutual-nda.md`,
  `templates/mutual-nda-coverpage.md`) place it.
- The PDF and the on-screen preview never disagree on content for the same
  form state.
