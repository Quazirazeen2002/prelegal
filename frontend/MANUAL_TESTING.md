# Manual test plan: Legal Document Assistant

Automated tests (`npm test`) cover the chat/preview/PDF wiring, the document-type
detection and generic-extraction routing, the template parser (against all 10 real
generic templates), and the auth/documents UI (with the backend mocked). They can't
verify visual layout, real browser download behavior, actual AI conversation quality,
or subjective legal-document readability — this checklist is for a human to exercise
those by hand before a release.

Setup: `cp .env.local.example .env.local` (point it at your running backend), then
`npm install && npm run dev`, and separately run the backend (`uv run uvicorn
app.main:app --reload` from `backend/`, with `OPENROUTER_API_KEY` set in the repo-root
`.env`). Open `http://localhost:3000`.

## Golden path: Mutual NDA

1. On load, confirm the assistant greets you and asks what document you need.
2. Say something that clearly implies a Mutual NDA (e.g. "I need an NDA with a
   vendor"). Confirm the assistant correctly identifies it and the preview area
   appears (still showing "Finish the chat to enable download").
3. Have a natural conversation covering every field: purpose, effective date, both
   MNDA-term options, both confidentiality-term options, governing law, jurisdiction,
   modifications, and both parties' company/print name/title/notice address.
4. Confirm the preview updates after each assistant reply, with no stale values, and
   that the assistant doesn't re-ask for information you've already given.
5. Confirm "Download PDF" stays disabled until the assistant confirms completion, then
   becomes enabled. Click it and confirm the PDF matches the preview, paginates
   sensibly, and has readable margins on US Letter/A4.

## Golden path: a generic document type (e.g. Cloud Service Agreement)

1. Start a new conversation (see "New Document" below) and say something that implies
   a different document type (e.g. "we're onboarding a cloud vendor").
2. Confirm the assistant identifies it as a Cloud Service Agreement (or asks a
   clarifying question first, which is also acceptable) and the preview shows an
   auto-generated summary section listing every field the document needs, each with a
   `[Fill in ...]` placeholder.
3. Have a conversation filling in the fields. Confirm the summary section updates live
   and the full standard-terms text below it renders with proper nested numbering
   (e.g. "1.1", "4.2(a)") and no stray HTML or `**` markup.
4. Confirm "Download PDF" enables once the assistant marks it complete, and the
   downloaded file is named after the document type (e.g. `cloud-service-agreement.pdf`).

## Document-type detection edge cases

- **Ambiguous request**: say something vague ("I need a document"). Confirm the
  assistant asks a clarifying question rather than guessing.
- **Unsupported document**: ask for something not in the 11 supported types (e.g. "a
  trademark license agreement"). Confirm the assistant explains it can't generate that
  exact type and offers the closest supported alternative, and that agreeing to the
  alternative correctly starts that document's flow.
- **Every other document type at least once**: over time, exercise SLA, DPA, Design
  Partner Agreement, PSA, Partnership Agreement, BAA, Software License Agreement,
  Pilot Agreement, and AI Addendum at least once each, confirming each renders sensibly
  end to end.

## Accounts and My Documents

1. Click "Sign in", switch to "Sign up", and create an account. Confirm you're signed
   in immediately (email shown in the header) with no separate sign-in step needed.
2. Complete a document (either NDA or generic) and confirm a "Save to My Documents"
   button appears only once both signed in AND the document is complete.
3. Click it, confirm a "Saved!" confirmation appears, then open "My Documents" and
   confirm the saved document is listed with a sensible title.
4. Click "New Document", start and complete a different document type, save it too,
   and confirm both appear in "My Documents".
5. Click "Load" on a saved document and confirm the chat resets with an
   acknowledgment message, the preview immediately shows the saved fields, and
   "Download PDF" is enabled right away (no need to re-confirm with the assistant).
6. Delete a document from "My Documents" and confirm it disappears from the list.
7. Sign out and confirm the "Save to My Documents" button and "My Documents" link
   disappear, while chatting and downloading a fresh document still works anonymously.
8. Sign in as a second account (a different email) and confirm "My Documents" shows
   an empty list, not the first account's documents.

## Edge cases

- **Correcting a mistake**: deliberately give the assistant a wrong detail, then
  correct it in a later message. Confirm the preview reflects the correction.
- **Very long input**: paste a multi-paragraph answer into a chat message. Confirm the
  PDF paginates instead of clipping or overflowing a page.
- **Special characters**: use an ampersand, quotes, an em dash, and a non-Latin name
  (e.g. "Zoë Müller") in a message. Confirm both the preview and the PDF render them
  correctly (no mangled encoding).
- **Backend unavailable**: stop the backend mid-conversation and send a message.
  Confirm the chat shows an error message rather than silently failing, and that your
  message and the existing conversation remain visible so you can retry once the
  backend is back.

## Cross-browser / responsive

- Repeat the golden paths in at least two browsers (e.g. Chrome and Safari or
  Firefox), since PDF download behavior differs by browser.
- Resize the window to a mobile width (~375px). Confirm the header, chat, and preview
  stack usably and nothing is clipped or unreachable.
- Tab through the chat input, send button, and header controls using only the
  keyboard, and confirm pressing Enter in the message field submits it.

## Regression watch-list

Re-check these specifically after any change to `lib/nda-content.ts`,
`lib/document-template.ts`, `app/chat.py`, `app/document_chat.py`, or the PDF
renderer, since they're easy to silently break:

- The Mutual NDA's Standard Terms clause numbers are 1–11, in order, with no gaps.
- Generic documents' nested clause numbering (e.g. "2.4", "2.4(a)") matches the source
  template's own structure, with no gaps or duplicate labels.
- The PDF and the on-screen preview never disagree on content for the same state.
- A field already established in an earlier message is never wiped out by a later
  turn that doesn't mention it (true for both the Mutual NDA's typed fields and a
  generic document's slugified variable fields).
- Two different users never see each other's saved documents.
