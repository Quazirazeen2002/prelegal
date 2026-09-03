import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NdaCreator from "./NdaCreator";

// NdaDownloadButton pulls in @react-pdf/renderer's PDFDownloadLink, which relies on
// browser-only APIs (URL.createObjectURL, web workers) that jsdom doesn't implement.
// It's covered on its own merits by NdaPdfDocument.test.tsx (actual PDF bytes) and by
// the manual test plan (real click-through in a browser); here we only need to confirm
// the rest of NdaCreator wires form state to the preview correctly. vi.mock calls are
// hoisted above imports by Vitest, so this applies even though NdaCreator is imported
// (and lazily loads NdaDownloadButton) above.
vi.mock("./NdaDownloadButton", () => ({
  default: () => <button>Download PDF (mock)</button>,
}));

describe("NdaCreator", () => {
  it("reflects typed purpose text in the live preview", async () => {
    const user = userEvent.setup();
    render(<NdaCreator />);

    const purposeInput = screen.getByLabelText("Purpose");
    await user.clear(purposeInput);
    await user.type(purposeInput, "Evaluating a joint venture.");

    // Scoped to the preview's <p>, since the form's own <textarea> also exposes
    // its current value as text content and would otherwise match too.
    expect(
      await screen.findByText("Evaluating a joint venture.", { selector: "p" })
    ).toBeInTheDocument();
  });

  it("reflects a chosen effective date in the live preview", async () => {
    const user = userEvent.setup();
    render(<NdaCreator />);

    const dateInput = screen.getByLabelText("Effective date");
    await user.clear(dateInput);
    await user.type(dateInput, "2027-01-15");

    expect(await screen.findByText("January 15, 2027")).toBeInTheDocument();
  });

  it("reflects Party 1 details entered in the form in the preview's signature table", async () => {
    const user = userEvent.setup();
    render(<NdaCreator />);

    const [party1Company] = screen.getAllByLabelText("Company");
    await user.type(party1Company, "Acme, Inc.");

    expect(await screen.findByText("Acme, Inc.")).toBeInTheDocument();
  });
});
