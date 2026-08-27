"""Load NULL//ORDER content (research papers, CTF challenges)."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from config_loader import get_root, load_yaml


@lru_cache
def load_ctf_bank() -> dict:
    return load_yaml("ctf_challenges.yaml")


def list_challenges() -> list[tuple[str, dict]]:
    bank = load_ctf_bank()
    return [(cid, meta) for cid, meta in bank.get("challenges", {}).items()]


def get_challenge(challenge_id: str) -> tuple[str, dict] | None:
    cid = challenge_id.upper()
    bank = load_ctf_bank()
    challenges = bank.get("challenges", {})
    if cid in challenges:
        return cid, challenges[cid]
    matches = [k for k in challenges if k.endswith(cid) or k.replace("-", "") == cid]
    if len(matches) == 1:
        return matches[0], challenges[matches[0]]
    return None


def load_challenge_body(challenge_id: str) -> str | None:
    entry = get_challenge(challenge_id)
    if not entry:
        return None
    _, meta = entry
    rel = meta.get("file")
    if not rel:
        return None
    path = get_root() / "content" / rel
    if not path.is_file():
        return None
    return path.read_text(encoding="utf-8")


def load_research(number: str = "001") -> str | None:
    path = get_root() / "content" / "research" / f"RESEARCH-{number.zfill(3)}.md"
    if not path.is_file():
        return None
    return path.read_text(encoding="utf-8")


def research_summary(number: str = "001") -> str:
    text = load_research(number)
    num = number.zfill(3)
    if not text:
        return f"RESEARCH-{num} not found."

    title = f"RESEARCH-{num}"
    subtitle = ""
    for line in text.splitlines():
        if line.startswith("# NØ//RESEARCH"):
            title = line.lstrip("# ").strip()
        elif line.startswith("## ") and not subtitle:
            subtitle = line.lstrip("# ").strip()
            break

    return (
        f"{title}\n{subtitle}\n\n"
        f"Read: /research {number} full\n"
        f"File: null-order/content/research/RESEARCH-{num}.md\n\n"
        f"Publish to bulletin: /post research"
    )
