"""Load NULL//ORDER YAML config and markdown templates."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = ROOT / "config"
TEMPLATES_DIR = ROOT / "templates"


def get_root() -> Path:
    override = os.getenv("NULL_ORDER_ROOT")
    return Path(override) if override else ROOT


@lru_cache
def load_yaml(name: str) -> dict:
    path = get_root() / "config" / name
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_roles() -> dict:
    return load_yaml("roles.yaml")


def load_channels() -> dict:
    return load_yaml("channels.yaml")


def load_calendar() -> dict:
    return load_yaml("content_calendar.yaml")


def load_dns_schema() -> dict:
    return load_yaml("dns_text_schema.yaml")


def load_ton_stack() -> dict:
    return load_yaml("ton_stack.yaml")


def load_template(*parts: str) -> str:
    path = get_root() / "templates" / Path(*parts)
    return path.read_text(encoding="utf-8")


def render_template(*parts: str, **fields: str) -> str:
    text = load_template(*parts)
    for key, value in fields.items():
        text = text.replace("{{" + key + "}}", value or "—")
    return text
