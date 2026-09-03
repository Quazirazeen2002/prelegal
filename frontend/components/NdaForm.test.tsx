import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NdaForm from "./NdaForm";
import { createDefaultNdaFormData, NdaFormData } from "@/lib/nda";

/** Renders a controlled NdaForm, re-rendering on every onChange like the real parent does. */
function renderControlled(initial: NdaFormData = createDefaultNdaFormData()) {
  const onChange = vi.fn();
  let data = initial;

  const view = render(<NdaForm data={data} onChange={onChange} />);

  const rerenderWithLatestChange = () => {
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    data = lastCall[0];
    view.rerender(<NdaForm data={data} onChange={onChange} />);
    return data;
  };

  return { onChange, getData: () => data, rerenderWithLatestChange };
}

describe("NdaForm", () => {
  it("renders every top-level field with a programmatically associated label", () => {
    render(<NdaForm data={createDefaultNdaFormData()} onChange={() => {}} />);

    expect(screen.getByLabelText("Purpose")).toBeInTheDocument();
    expect(screen.getByLabelText("Effective date")).toBeInTheDocument();
    expect(screen.getByLabelText("Governing law (state)")).toBeInTheDocument();
    expect(screen.getByLabelText("Jurisdiction (city or county and state)")).toBeInTheDocument();
    expect(screen.getByLabelText("MNDA term, in years")).toBeInTheDocument();
    expect(screen.getByLabelText("Term of confidentiality, in years")).toBeInTheDocument();
  });

  it("renders separately labeled fields for Party 1 and Party 2", () => {
    render(<NdaForm data={createDefaultNdaFormData()} onChange={() => {}} />);

    expect(screen.getAllByLabelText("Company")).toHaveLength(2);
    expect(screen.getAllByLabelText("Print name")).toHaveLength(2);
    expect(screen.getAllByLabelText("Title")).toHaveLength(2);
    expect(screen.getAllByLabelText("Notice address (email or postal)")).toHaveLength(2);
  });

  it("calls onChange with the updated purpose when the user edits it", () => {
    const onChange = vi.fn();
    render(
      <NdaForm
        data={{ ...createDefaultNdaFormData(), purpose: "" }}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText("Purpose"), {
      target: { value: "Evaluating a supply agreement." },
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: "Evaluating a supply agreement." })
    );
  });

  it("selecting 'perpetual' MNDA term switches the type and disables the years input", async () => {
    const user = userEvent.setup();
    const { onChange, rerenderWithLatestChange } = renderControlled();

    await user.click(screen.getByLabelText("Continues until terminated in accordance with the terms of the MNDA"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ mndaTermType: "perpetual" })
    );
    rerenderWithLatestChange();
    expect(screen.getByLabelText("MNDA term, in years")).toBeDisabled();
  });

  it("selecting 'in perpetuity' confidentiality term disables the years input", async () => {
    const user = userEvent.setup();
    const { onChange, rerenderWithLatestChange } = renderControlled();

    await user.click(screen.getByLabelText("In perpetuity"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ confidentialityTermType: "perpetual" })
    );
    rerenderWithLatestChange();
    expect(screen.getByLabelText("Term of confidentiality, in years")).toBeDisabled();
  });

  it("clamps the MNDA term years input to a minimum of 1", () => {
    const onChange = vi.fn();
    render(<NdaForm data={createDefaultNdaFormData()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("MNDA term, in years"), {
      target: { value: "-5" },
    });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mndaTermYears: 1 }));
  });

  it("passes a valid MNDA term years value through unclamped", () => {
    const onChange = vi.fn();
    render(<NdaForm data={createDefaultNdaFormData()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("MNDA term, in years"), {
      target: { value: "3" },
    });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mndaTermYears: 3 }));
  });

  it("updates Party 1 fields independently of Party 2", () => {
    const onChange = vi.fn();
    render(<NdaForm data={createDefaultNdaFormData()} onChange={onChange} />);

    const [party1Company] = screen.getAllByLabelText("Company");
    fireEvent.change(party1Company, { target: { value: "Acme, Inc." } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        party1: expect.objectContaining({ company: "Acme, Inc." }),
        party2: expect.objectContaining({ company: "" }),
      })
    );
  });

  it("updates governing law and jurisdiction as separate fields", () => {
    const onChange = vi.fn();
    render(<NdaForm data={createDefaultNdaFormData()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Governing law (state)"), {
      target: { value: "Delaware" },
    });
    fireEvent.change(screen.getByLabelText("Jurisdiction (city or county and state)"), {
      target: { value: "New Castle, DE" },
    });

    expect(onChange).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ governingLaw: "Delaware", jurisdiction: "" })
    );
    expect(onChange).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ governingLaw: "", jurisdiction: "New Castle, DE" })
    );
  });
});
