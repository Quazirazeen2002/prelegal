import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UploadView from "./UploadView";
import * as uploadsLib from "@/lib/uploads";
import * as authContext from "./AuthContext";

vi.mock("@/lib/uploads");
vi.mock("./AuthContext");

const SAMPLE_USER = { id: 1, email: "alice@example.com", created_at: "" };

function mockSignedIn() {
  vi.mocked(authContext.useAuth).mockReturnValue({
    user: SAMPLE_USER,
    isLoading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("UploadView", () => {
  it("prompts to sign in when signed out", () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    });

    render(<UploadView selectedUpload={null} onSelectUpload={vi.fn()} />);

    expect(screen.getByText(/Sign in.*to upload and analyze/)).toBeInTheDocument();
  });

  it("lists recent uploads once signed in", async () => {
    mockSignedIn();
    vi.mocked(uploadsLib.listUploads).mockResolvedValue([
      {
        id: 1,
        filename: "agreement.pdf",
        fileType: "pdf",
        fileSizeBytes: 2_400_000,
        status: "processed",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ]);

    render(<UploadView selectedUpload={null} onSelectUpload={vi.fn()} />);

    expect(await screen.findByText("agreement.pdf")).toBeInTheDocument();
    expect(screen.getByText("processed")).toBeInTheDocument();
  });

  it("uploads a file via the file input and selects it", async () => {
    const user = userEvent.setup();
    mockSignedIn();
    vi.mocked(uploadsLib.listUploads).mockResolvedValue([]);
    const detail = {
      id: 5,
      filename: "contract.txt",
      fileType: "txt",
      fileSizeBytes: 10,
      status: "processed" as const,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      errorMessage: null,
      matchedCatalogKey: null,
      matchedCatalogName: null,
      summary: "A summary.",
      risks: [],
      clauses: [],
      comparison: null,
    };
    vi.mocked(uploadsLib.uploadDocument).mockResolvedValue(detail);
    const onSelectUpload = vi.fn();

    render(<UploadView selectedUpload={null} onSelectUpload={onSelectUpload} />);
    await screen.findByText(/No documents uploaded yet/);

    const file = new File(["hello world"], "contract.txt", { type: "text/plain" });
    const input = screen.getByLabelText("Browse files", { selector: "input" });
    await user.upload(input, file);

    await waitFor(() => expect(onSelectUpload).toHaveBeenCalledWith(detail));
    expect(await screen.findByText("contract.txt")).toBeInTheDocument();
  });

  it("shows an error message when upload fails", async () => {
    const user = userEvent.setup();
    mockSignedIn();
    vi.mocked(uploadsLib.listUploads).mockResolvedValue([]);
    vi.mocked(uploadsLib.uploadDocument).mockRejectedValue(new Error("Unsupported file type: .png"));

    render(<UploadView selectedUpload={null} onSelectUpload={vi.fn()} />);
    await screen.findByText(/No documents uploaded yet/);

    const file = new File(["not a document"], "notes.txt", { type: "text/plain" });
    const input = screen.getByLabelText("Browse files", { selector: "input" });
    await user.upload(input, file);

    expect(await screen.findByRole("alert")).toHaveTextContent("Unsupported file type: .png");
  });

  it("deletes an upload from the list", async () => {
    const user = userEvent.setup();
    mockSignedIn();
    vi.mocked(uploadsLib.listUploads).mockResolvedValue([
      {
        id: 1,
        filename: "agreement.pdf",
        fileType: "pdf",
        fileSizeBytes: 1024,
        status: "processed",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ]);
    vi.mocked(uploadsLib.deleteUpload).mockResolvedValue(undefined);

    render(<UploadView selectedUpload={null} onSelectUpload={vi.fn()} />);
    await screen.findByText("agreement.pdf");

    await user.click(screen.getByRole("button", { name: "Delete agreement.pdf" }));

    await waitFor(() => expect(screen.queryByText("agreement.pdf")).not.toBeInTheDocument());
    expect(uploadsLib.deleteUpload).toHaveBeenCalledWith(1);
  });
});
