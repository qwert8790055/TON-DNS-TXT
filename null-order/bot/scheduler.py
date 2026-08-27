"""Content calendar helpers and scheduled reminders."""

from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from config_loader import load_calendar


def calendar_tz() -> ZoneInfo:
    tz_name = load_calendar().get("timezone", "Asia/Shanghai")
    return ZoneInfo(tz_name)


def today_tasks() -> list[str]:
    cal = load_calendar()
    tz = calendar_tz()
    now = datetime.now(tz)
    weekday = now.strftime("%A").lower()
    lines: list[str] = []

    for slot in cal.get("daily", {}).values():
        for task in slot.get("tasks", []):
            lines.append(f"• [{slot.get('time', '??:??')}] {task.get('label', task.get('type', ''))}")

    weekly = cal.get("weekly", {}).get(weekday)
    if weekly:
        lines.append(
            f"• [{weekly.get('time', '??:??')}] {weekly.get('series', '')}: {weekly.get('label', '')}"
        )

    return lines


def reminder_message(job_data: str) -> str | None:
    """Build reminder from job data like 'daily_morning' or 'weekly_monday'."""
    cal = load_calendar()

    if job_data.startswith("daily_"):
        slot_name = job_data.removeprefix("daily_")
        slot = cal.get("daily", {}).get(slot_name)
        if not slot:
            return None
        tasks = slot.get("tasks", [])
        body = "\n".join(f"• {t.get('label', t.get('type', ''))}" for t in tasks)
        return (
            f"⏰ NØ//SCHEDULE — {slot_name.upper()} ({slot.get('time', '')})\n\n"
            f"{body}\n\n"
            "Admins: /post <type> to draft bulletin content."
        )

    if job_data.startswith("weekly_"):
        weekday = job_data.removeprefix("weekly_")
        weekly = cal.get("weekly", {}).get(weekday)
        if not weekly:
            return None
        return (
            f"⏰ NØ//SCHEDULE — {weekly.get('series', 'WEEKLY')}\n\n"
            f"{weekly.get('label', '')}\n"
            f"Template: templates/{weekly.get('template', '')}\n\n"
            "Use /post or edit template, then /publish to NØ//BULLETIN."
        )

    return None
