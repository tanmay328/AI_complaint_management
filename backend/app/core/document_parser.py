import io
import email
from email import policy
from pypdf import PdfReader
from docx import Document


def extract_text_from_file(filename: str, content: bytes) -> str:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext == "pdf":
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if ext == "docx":
        doc = Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs)

    if ext == "eml":
        msg = email.message_from_bytes(content, policy=policy.default)
        parts = []
        subject = msg.get("subject", "")
        sender = msg.get("from", "")
        parts.append(f"Subject: {subject}\nFrom: {sender}")
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    parts.append(part.get_content())
        else:
            parts.append(msg.get_content())
        return "\n".join(parts)

    if ext == "txt":
        return content.decode("utf-8", errors="ignore")

    # fallback: try plain decode
    return content.decode("utf-8", errors="ignore")
