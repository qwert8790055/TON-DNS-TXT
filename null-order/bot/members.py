"""SQLite-backed member roles and INITIATE task tracking."""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "data" / "members.db"
DEFAULT_ROLE = "INITIATE"


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def db():
    conn = _connect()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS members (
                user_id INTEGER PRIMARY KEY,
                username TEXT,
                display_name TEXT,
                role TEXT NOT NULL DEFAULT 'INITIATE',
                joined_at TEXT NOT NULL,
                promoted_at TEXT
            );

            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                task_type TEXT NOT NULL,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES members(user_id)
            );
            """
        )


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def register_member(user_id: int, username: str | None, display_name: str | None) -> str:
    with db() as conn:
        row = conn.execute("SELECT role FROM members WHERE user_id = ?", (user_id,)).fetchone()
        if row:
            conn.execute(
                "UPDATE members SET username = ?, display_name = ? WHERE user_id = ?",
                (username, display_name, user_id),
            )
            return row["role"]
        conn.execute(
            "INSERT INTO members (user_id, username, display_name, role, joined_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, username, display_name, DEFAULT_ROLE, _now()),
        )
        return DEFAULT_ROLE


def get_member(user_id: int) -> sqlite3.Row | None:
    with db() as conn:
        return conn.execute("SELECT * FROM members WHERE user_id = ?", (user_id,)).fetchone()


def set_role(user_id: int, role: str) -> None:
    with db() as conn:
        conn.execute(
            "UPDATE members SET role = ?, promoted_at = ? WHERE user_id = ?",
            (role, _now(), user_id),
        )


def add_task(user_id: int, task_type: str, title: str) -> None:
    with db() as conn:
        conn.execute(
            "INSERT INTO tasks (user_id, task_type, title, created_at) VALUES (?, ?, ?, ?)",
            (user_id, task_type, title, _now()),
        )


def task_count(user_id: int) -> int:
    with db() as conn:
        row = conn.execute("SELECT COUNT(*) AS c FROM tasks WHERE user_id = ?", (user_id,)).fetchone()
        return int(row["c"])
