import io

import docx
from pypdf import PdfReader

MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB, matching the UI's stated limit

SUPPORTED_EXTENSIONS = {"pdf", "docx", "txt"}


class UnsupportedFileTypeError(ValueError):
    pass


class FileTooLargeError(ValueError):
    pass


class EmptyDocumentError(ValueError):
    pass


def file_extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def extract_text(filename: str, content: bytes) -> str:
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise FileTooLargeError(f"File exceeds the {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB limit")

    extension = file_extension(filename)
    if extension == "pdf":
        text = _extract_pdf_text(content)
    elif extension == "docx":
        text = _extract_docx_text(content)
    elif extension == "txt":
        text = content.decode("utf-8", errors="replace")
    else:
        raise UnsupportedFileTypeError(f"Unsupported file type: .{extension or 'unknown'}")

    if not text.strip():
        raise EmptyDocumentError("No readable text was found in this document")

    return text


def _extract_pdf_text(content: bytes) -> str:
    reader = PdfReader(io.BytesIO(content))
    return "\n\n".join(page.extract_text() or "" for page in reader.pages)


def _extract_docx_text(content: bytes) -> str:
    document = docx.Document(io.BytesIO(content))
    return "\n\n".join(paragraph.text for paragraph in document.paragraphs)
