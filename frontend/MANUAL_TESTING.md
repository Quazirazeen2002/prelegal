# Manual test plan: Mutual NDA Creator

Automated tests (`npm test`) cover the chat/preview/PDF wiring (with the backend chat
call mocked) and the generated PDF's text content. They can't verify visual layout,
real browser download behavior, actual AI conversation quality, or subjective
legal-document readability — this checklist is for a human to exercise those by hand
before a release.

Setup: `cp .env.local.example .env.local` (point it at your running backend), then
`npm install && npm run dev`, and separately run the backend (`uv run uvicorn
app.main:app --reload` from `backend/`, with `OPENROUTER_API_KEY` set in the repo-root
`.env`). Open `http://localhost:3000`.

## Golden path

1. On load, confirm the assistant greets you and the preview shows a coherent Mutual
   NDA (Cover Page followed by Standard Terms) with today's date and sensible
   defaults, no `undefined` or `NaN`.
2. Have a natural conversation covering every field: purpose, effective date, both
   MNDA-term options (try asking for each), both confidentiality-term options,
   governing law, jurisdiction, modifications, and both parties' company/print
   name/title/notice address.
3. Confirm the preview updates after each assistant reply, with no stale values, and
   that the assistant doesn't re-ask for information you've already given.
4. Confirm the "Download PDF" button stays disabled (showing "Finish the chat to
   enable download") until the assistant confirms it has everything, and becomes
   enabled at that point.
5. Click **Download PDF**. Confirm a file named `mutual-nda.pdf` downloads and:
   - Opens cleanly in your OS's PDF viewer (not just a PDF-capable browser tab).
   - Matches the on-screen preview's content and field values.
   - Paginates sensibly — no clipped text, no content overlapping a page break.
   - Has a readable font size and margins when printed on US Letter or A4 paper.

## Edge cases

- **Correcting a mistake**: deliberately give the assistant a wrong detail, then
  correct it in a later message (e.g. "actually the company is Acme, Inc., not Acme
  Corp"). Confirm the preview reflects the correction, not the original mistake.
- **Very long input**: paste a multi-paragraph purpose statement or modifications
  note into a chat message. Confirm the PDF paginates instead of clipping or
  overflowing a page.
- **Special characters**: use an ampersand, quotes, an em dash, and a non-Latin name
  (e.g. "Zoë Müller") in a message. Confirm both the preview and the PDF render them
  correctly (no mangled encoding).
- **Skipping optional fields**: tell the assistant you don't have a preference for
  governing law/jurisdiction/modifications. Confirm the document shows the bracketed
  placeholder text (e.g. `[Fill in state]`) rather than blank space or a crash, and
  that the assistant can still reach completion.
- **Backend unavailable**: stop the backend mid-conversation and send a message.
  Confirm the chat shows an error message rather than silently failing, and that your
  message and the existing conversation remain visible so you can retry once the
  backend is back.

## Cross-browser / responsive

- Repeat the golden path in at least two browsers (e.g. Chrome and Safari or
  Firefox), since PDF download behavior differs by browser.
- Resize the window to a mobile width (~375px). Confirm the chat and preview stack
  usably and nothing is clipped or unreachable.
- Tab through the chat input and send button using only the keyboard, and confirm
  pressing Enter in the message field submits it.

## Regression watch-list

Re-check these specifically after any change to `lib/nda-content.ts`, `app/chat.py`,
or the PDF renderer, since they're easy to silently break:

- The Standard Terms clause numbers are 1–11, in order, with no gaps or repeats.
- Each `coverpage_link` cross-reference (Purpose, Effective Date, MNDA Term,
  Term of Confidentiality, Governing Law, Jurisdiction) still appears exactly
  where the source templates (`templates/mutual-nda.md`,
  `templates/mutual-nda-coverpage.md`) place it.
- The PDF and the on-screen preview never disagree on content for the same
  chat-derived state.
- A field the assistant already established in an earlier message is never wiped out
  by a later turn that doesn't mention it.
