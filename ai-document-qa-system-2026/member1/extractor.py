"""
member1/extractor.py
====================
Fast PDF extraction using PyMuPDF (fitz) only.
• NO docling  • NO OCR  • NO easyocr  • NO onnxruntime
• Single get_text() call per page  →  fastest possible extraction
"""
import os
import re
import json
import hashlib
import logging
from pathlib import Path
from datetime import datetime
from typing import List

# ── PyMuPDF ───────────────────────────────────────────────────────────────────
import fitz  # pip install pymupdf

# ── LangChain splitters ───────────────────────────────────────────────────────
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

# ── Language detection (optional) ────────────────────────────────────────────
try:
    from langdetect import detect as _detect_lang
    _LANGDETECT_OK = True
except ImportError:
    _LANGDETECT_OK = False

# ── Shared config ─────────────────────────────────────────────────────────────
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config import (
    SUPPORTED_EXTENSIONS, DOC_TYPE_MAP, CHUNK_CONFIG, CHUNKS_JSON_PATH
)

log = logging.getLogger(__name__)

# Minimum characters on a page to consider it has native text
_NATIVE_TEXT_THRESHOLD = 30

# ── Text noise patterns ───────────────────────────────────────────────────────
_NOISE_RE = [
    (re.compile(r"Page\s+\d+\s+of\s+\d+", re.I), ""),
    (re.compile(r"©\s*\d{4}[^\n]*",        re.I), ""),
    (re.compile(r"Confidential[^\n]*",      re.I), ""),
    (re.compile(r"Proprietary[^\n]*",       re.I), ""),
    (re.compile(r"\ufb01"),                        "fi"),
    (re.compile(r"\ufb02"),                        "fl"),
    (re.compile(r"[\u2018\u2019]"),                "'"),
    (re.compile(r"[\u201c\u201d]"),                '"'),
    (re.compile(r"[\u2013\u2014]"),                "-"),
    (re.compile(r"\u00a0"),                        " "),
    (re.compile(r"\x00"),                          ""),
    (re.compile(r"\n{3,}"),                        "\n\n"),
    (re.compile(r"[ \t]{2,}"),                     " "),
]


# ══════════════════════════════════════════════════════════════════════════════
#  UTILITIES
# ══════════════════════════════════════════════════════════════════════════════

def detect_doc_type(filename: str) -> str:
    name = filename.lower()
    for dtype, keywords in DOC_TYPE_MAP.items():
        if any(k in name for k in keywords):
            return dtype
    return "unknown"


def detect_language(text: str) -> str:
    if not _LANGDETECT_OK or len(text.strip()) < 40:
        return "unknown"
    try:
        return _detect_lang(text)
    except Exception:
        return "unknown"


def chunk_id(text: str, source: str, idx: int) -> str:
    return hashlib.md5(f"{source}::{idx}::{text[:100]}".encode()).hexdigest()[:14]


def clean_text(text: str) -> str:
    for pattern, replacement in _NOISE_RE:
        text = pattern.sub(replacement, text)
    return text.strip()


# ══════════════════════════════════════════════════════════════════════════════
#  PAGE-LEVEL HELPERS  — single get_text() call per page
# ══════════════════════════════════════════════════════════════════════════════

# PyMuPDF text extraction flags for maximum speed
_TEXT_FLAGS = (
    fitz.TEXT_PRESERVE_LIGATURES  # keep fi/fl ligatures (cleaned after)
    | fitz.TEXT_PRESERVE_WHITESPACE
)


def _extract_page_text(page: fitz.Page) -> str:
    """
    One-shot fast text extraction via PyMuPDF 'blocks' mode.
    Returns empty string for image-only / empty pages.
    Single get_text() call — no redundant reads.
    """
    blocks = page.get_text("blocks", sort=True, flags=_TEXT_FLAGS)
    lines: List[str] = []
    for b in blocks:
        # block tuple: (x0, y0, x1, y1, text, block_no, block_type)
        # block_type 0 = text,  1 = image  — skip images
        if b[6] == 0:
            t = b[4].strip()
            if t:
                lines.append(t)
    return "\n\n".join(lines)


def _extract_tables_from_page(page: fitz.Page, page_num: int) -> list:
    """
    Extract tables using PyMuPDF's built-in find_tables().
    Only called for pages that have native text (fast path).
    """
    tables = []
    try:
        finder = page.find_tables()
        for i, tbl in enumerate(finder.tables):
            try:
                df = tbl.to_pandas()
                text = df.to_string(index=False)
            except Exception:
                # fallback: join cell text manually
                rows = tbl.extract()
                text = "\n".join(
                    " | ".join(str(c) if c else "" for c in row)
                    for row in rows if any(c for c in row)
                )
            if len(text.strip()) >= 10:
                tables.append({
                    "table_index": i,
                    "page":        page_num,
                    "text":        clean_text(f"[TABLE — page {page_num + 1}]\n{text}"),
                })
    except Exception as e:
        log.debug(f"Table extraction skipped on page {page_num}: {e}")
    return tables


# ══════════════════════════════════════════════════════════════════════════════
#  STEP 1 — EXTRACTION  (PyMuPDF, no OCR, no docling)
# ══════════════════════════════════════════════════════════════════════════════

def extract_file(filepath: str) -> dict:
    """
    Extract a single PDF → plain text + tables using PyMuPDF only.

    Performance notes:
    - One fitz.open() call, one get_text('blocks') per page
    - No OCR, no onnxruntime, no docling, no network calls
    - Typical speed: ~5–50 ms/page on modern hardware
    """
    p        = Path(filepath)
    filename = p.name
    doc_type = detect_doc_type(filename)

    log.info(f"Extracting [{doc_type.upper()}] {filename}")

    doc = fitz.open(str(p))
    total_pages   = len(doc)
    page_texts: List[str] = []
    all_tables: List[dict] = []
    empty_pages   = 0

    for page_num, page in enumerate(doc):
        # Single extraction call — blocks mode preserves reading order
        raw_text = _extract_page_text(page)

        if len(raw_text) < _NATIVE_TEXT_THRESHOLD:
            # Image-only / empty page — skip table extraction, record count
            empty_pages += 1
        else:
            all_tables.extend(_extract_tables_from_page(page, page_num))

        page_texts.append(clean_text(raw_text))

    doc.close()  # close AFTER all page operations, BEFORE len(doc) is needed

    full_text = "\n\n".join(t for t in page_texts if t)
    word_count = len(full_text.split())

    if not full_text.strip():
        log.warning(
            f"  ⚠ {filename}: No text extracted ({total_pages} pages). "
            "The PDF may be image-only or password-protected."
        )
    elif empty_pages:
        log.info(
            f"  {filename}: {total_pages} pages "
            f"({empty_pages} image/empty), {word_count} words, {len(all_tables)} tables"
        )
    else:
        log.info(
            f"  ✓ {filename}: {total_pages} pages, "
            f"{word_count} words, {len(all_tables)} tables"
        )

    headings = _infer_headings(full_text)

    return {
        "markdown": full_text,   # key kept for backward compatibility
        "tables":   all_tables,
        "metadata": {
            "source":        filename,
            "filepath":      str(p.resolve()),
            "doc_type":      doc_type,
            "headings":      headings[:10],
            "table_count":   len(all_tables),
            "page_count":    total_pages,
            "empty_pages":   empty_pages,
            "word_count":    word_count,
            "extracted_at":  datetime.now().isoformat(),
        },
    }


def _infer_headings(text: str) -> List[str]:
    """
    Heuristic heading detection: short lines (≤ 80 chars) that don't end in
    sentence-ending punctuation, preceded or followed by a blank line.
    """
    headings = []
    lines    = text.splitlines()
    for i, line in enumerate(lines):
        line = line.strip()
        if not line or len(line) > 80 or line[-1] in ".,:;?!)":
            continue
        prev_blank = (i == 0) or (not lines[i - 1].strip())
        next_blank = (i == len(lines) - 1) or (not lines[i + 1].strip())
        if prev_blank or next_blank:
            headings.append(line)
    return headings


def extract_all(input_path: str) -> List[dict]:
    """Extract all supported documents from a file or directory."""
    p = Path(input_path)
    files = (
        [p] if p.is_file()
        else [f for f in p.rglob("*") if f.suffix.lower() in SUPPORTED_EXTENSIONS]
    )
    if not files:
        log.warning(f"No supported files found in: {input_path}")
        return []

    log.info(f"Found {len(files)} document(s)")
    results = []
    for f in files:
        try:
            results.append(extract_file(str(f)))
        except Exception as e:
            log.error(f"  ✗ Failed: {f.name} — {e}")
    return results


# ══════════════════════════════════════════════════════════════════════════════
#  STEP 2 — CHUNKING
# ══════════════════════════════════════════════════════════════════════════════

def chunk_extraction(extracted: dict) -> List[Document]:
    """
    Single-pass chunking with RecursiveCharacterTextSplitter.
    Deduplicates chunks by MD5 hash.
    """
    meta  = extracted["metadata"]
    cfg   = CHUNK_CONFIG.get(meta["doc_type"], CHUNK_CONFIG["unknown"])
    docs: List[Document] = []
    seen: set = set()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=cfg["chunk_size"],
        chunk_overlap=cfg["chunk_overlap"],
        separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""],
    )

    for text in splitter.split_text(extracted["markdown"]):
        text = text.strip()
        if len(text.split()) < 8:
            continue
        h = hashlib.md5(text.encode()).hexdigest()
        if h in seen:
            continue
        seen.add(h)

        idx = len(docs)
        docs.append(Document(
            page_content=text,
            metadata={
                "chunk_id":     chunk_id(text, meta["source"], idx),
                "source":       meta["source"],
                "filepath":     meta["filepath"],
                "doc_type":     meta["doc_type"],
                "section":      "",
                "language":     detect_language(text),
                "chunk_index":  idx,
                "word_count":   len(text.split()),
                "is_table":     False,
                "processed_at": meta["extracted_at"],
            }
        ))

    # Tables — one chunk each
    for tbl in extracted["tables"]:
        text = tbl["text"].strip()
        if not text or len(text.split()) < 4:
            continue
        h = hashlib.md5(text.encode()).hexdigest()
        if h in seen:
            continue
        seen.add(h)

        idx = len(docs)
        docs.append(Document(
            page_content=text,
            metadata={
                "chunk_id":     chunk_id(text, meta["source"], idx),
                "source":       meta["source"],
                "filepath":     meta["filepath"],
                "doc_type":     meta["doc_type"],
                "section":      f"Table — page {tbl.get('page', 0) + 1}",
                "language":     detect_language(text),
                "chunk_index":  idx,
                "word_count":   len(text.split()),
                "is_table":     True,
                "processed_at": meta["extracted_at"],
            }
        ))

    log.info(f"  Chunked {meta['source']} → {len(docs)} chunks")
    return docs


def chunk_all_extractions(extractions: List[dict]) -> List[Document]:
    all_docs: List[Document] = []
    for ex in extractions:
        all_docs.extend(chunk_extraction(ex))
    log.info(f"Total chunks: {len(all_docs)}")
    return all_docs


# ══════════════════════════════════════════════════════════════════════════════
#  SAVE  (handoff to Member 2)
# ══════════════════════════════════════════════════════════════════════════════

def save_chunks_json(documents: List[Document], path: str = CHUNKS_JSON_PATH) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    payload = [
        {
            "text":        d.page_content,
            "page":        d.metadata.get("chunk_index", 0),
            "source_file": d.metadata.get("source", ""),
        }
        for d in documents
    ]
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    log.info(f"Chunks saved → {path}  ({len(payload)} chunks)")


# ══════════════════════════════════════════════════════════════════════════════
#  PUBLIC API  (called by api.py and member3/app.py)
# ══════════════════════════════════════════════════════════════════════════════

def process_documents(file_paths: List[str]) -> List[Document]:
    """
    Full extraction + chunking pipeline for a list of PDF paths.
    Returns LangChain Documents ready for embedding.
    """
    extractions = []
    for fp in file_paths:
        try:
            extractions.append(extract_file(fp))
        except Exception as e:
            log.error(f"Failed to extract {fp}: {e}")

    if not extractions:
        log.warning("No documents were successfully extracted.")
        return []

    documents = chunk_all_extractions(extractions)
    save_chunks_json(documents)
    return documents


# ══════════════════════════════════════════════════════════════════════════════
#  CLI
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import argparse
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    parser = argparse.ArgumentParser(description="Member 1 — Extract & Chunk Documents (PyMuPDF)")
    parser.add_argument("--input", "-i", required=True, help="PDF file or directory of PDFs")
    args = parser.parse_args()

    docs = process_documents(
        [str(f) for f in Path(args.input).rglob("*") if f.suffix.lower() in SUPPORTED_EXTENSIONS]
        if Path(args.input).is_dir()
        else [args.input]
    )
    print(f"\n✅ Done — {len(docs)} chunks ready in {CHUNKS_JSON_PATH}")