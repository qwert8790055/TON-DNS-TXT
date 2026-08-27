"""NULL//ORDER Telegram bot — onboarding, roles, bulletin drafts, calendar."""

from __future__ import annotations

import logging
import os
from datetime import datetime

from dotenv import load_dotenv
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update, WebAppInfo
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from config_loader import load_dns_schema, load_roles, load_template, render_template
from members import add_task, get_member, init_db, register_member, set_role, task_count
from scheduler import calendar_tz, reminder_message, today_tasks

load_dotenv()

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
ADMIN_IDS = {int(x.strip()) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip()}
BULLETIN_CHANNEL_ID = os.getenv("BULLETIN_CHANNEL_ID", "")
CORE_GROUP_ID = os.getenv("CORE_GROUP_ID", "")
BOT_USERNAME = os.getenv("BOT_USERNAME", "NullOrderBot")
DNS_TEXT_APP_URL = os.getenv("DNS_TEXT_APP_URL", "https://dns.resistance.dog")

POST_TYPES = {
    "ton": ("bulletin", "ton.md"),
    "news": ("bulletin", "news.md"),
    "cve": ("bulletin", "cve.md"),
    "research": ("bulletin", "research.md"),
    "lab": ("bulletin", "lab.md"),
    "ctf": ("bulletin", "ctf.md"),
    "build": ("bulletin", "build.md"),
    "recruit": ("bulletin", "recruit.md"),
}

VALID_ROLES = set(load_roles().get("roles", {}).keys())


def tools_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[
        InlineKeyboardButton(
            text="TON DNS TXT · Write dns_text",
            web_app=WebAppInfo(url=DNS_TEXT_APP_URL),
        ),
    ]])


def is_admin(user_id: int | None) -> bool:
    return user_id is not None and user_id in ADMIN_IDS


def can_post_bulletin(user_id: int | None) -> bool:
    if is_admin(user_id):
        return True
    if user_id is None:
        return False
    member = get_member(user_id)
    if not member:
        return False
    role_cfg = load_roles()["roles"].get(member["role"], {})
    return bool(role_cfg.get("can_post_bulletin"))


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not user or not update.message:
        return

    role = register_member(user.id, user.username, user.full_name)
    welcome = load_template("onboarding", "welcome_initiate.md")
    rules = load_template("onboarding", "rule_01.md")

    await update.message.reply_text(
        f"{welcome}\n\n{'—' * 20}\n\n{rules}",
        disable_web_page_preview=True,
        reply_markup=tools_keyboard(),
    )
    if role != "INITIATE":
        await update.message.reply_text(f"Your role: {role}")


async def rules_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    await update.message.reply_text(load_template("onboarding", "rule_01.md"))


async def tools_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    await update.message.reply_text(
        "NØ//TOOLS · TON Ecosystem\n\n"
        "Write dns_text records to your .ton domain.\n"
        "Use keys: nullorder.role, nullorder.telegram, nullorder.bio\n\n"
        "See /schema for full key list.",
        reply_markup=tools_keyboard(),
    )


async def schema_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    schema = load_dns_schema()
    lines = ["NØ//SCHEMA · dns_text profile keys\n"]
    for key, meta in schema.get("keys", {}).items():
        req = " *" if meta.get("required_for_verification") else ""
        lines.append(f"• `{key}`{req} — {meta.get('description', '')}")
    lines.append("\nInterop keys:")
    for key, meta in schema.get("interop_keys", {}).items():
        lines.append(f"• `{key}` — {meta.get('description', '')}")
    lines.append("\n* required for dns_text verification")
    lines.append("\nWrite via /tools → TON DNS TXT Mini App")
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown")


async def recruit_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    roles_cfg = load_roles()
    min_tasks = roles_cfg.get("initiate_requirements", {}).get("min_tasks", 2)
    text = render_template(
        "bulletin", "recruit.md",
        requirements="TON testnet work or verified dns_text profile. No resume-only applications.",
        min_tasks=str(min_tasks),
        apply_link=f"https://t.me/{BOT_USERNAME}",
        bot_username=BOT_USERNAME,
    )
    await update.message.reply_text(text)


async def calendar_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message:
        return
    tz = calendar_tz()
    now = datetime.now(tz)
    tasks = today_tasks()
    header = f"NØ//CALENDAR — {now.strftime('%Y-%m-%d %A')} ({tz.key})"
    body = "\n".join(tasks) if tasks else "No scheduled items."
    await update.message.reply_text(f"{header}\n\n{body}")


async def post_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    if not can_post_bulletin(update.effective_user.id):
        await update.message.reply_text("Permission denied.")
        return

    if not context.args or context.args[0].lower() not in POST_TYPES:
        types_list = ", ".join(POST_TYPES)
        await update.message.reply_text(
            f"Usage: /post <type>\n\nTypes: {types_list}\n\n"
            "Reply to this draft with field lines:\n"
            "key: value\n"
            "Then send /publish as reply to your edited draft."
        )
        return

    post_type = context.args[0].lower()
    folder, filename = POST_TYPES[post_type]
    template = load_template(folder, filename)

    defaults = {
        "number": "001",
        "network": "testnet",
        "bot_username": BOT_USERNAME,
        "min_tasks": "2",
        "apply_link": f"https://t.me/{BOT_USERNAME}",
    }
    draft = render_template(folder, filename, **defaults)

    context.user_data["pending_post"] = {
        "type": post_type,
        "template": template,
        "fields": defaults,
    }

    await update.message.reply_text(
        f"Draft ({post_type}):\n\n{draft}\n\n"
        "Edit fields by replying:\n"
        "title: Your Title\n"
        "summary: Your summary\n\n"
        "Or /publish to send to bulletin channel."
    )


async def publish_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    if not can_post_bulletin(update.effective_user.id):
        await update.message.reply_text("Permission denied.")
        return

    pending = context.user_data.get("pending_post")
    if not pending:
        await update.message.reply_text("No pending draft. Use /post <type> first.")
        return

    folder, filename = POST_TYPES[pending["type"]]
    text = render_template(folder, filename, **pending.get("fields", {}))

    if BULLETIN_CHANNEL_ID:
        await context.bot.send_message(chat_id=BULLETIN_CHANNEL_ID, text=text)
        await update.message.reply_text("Published to NØ//BULLETIN.")
    else:
        await update.message.reply_text(f"BULLETIN_CHANNEL_ID not set. Preview:\n\n{text}")

    context.user_data.pop("pending_post", None)


async def field_reply(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Parse 'key: value' replies to update pending post fields."""
    if not update.message or not update.message.text:
        return
    pending = context.user_data.get("pending_post")
    if not pending:
        return
    if ":" not in update.message.text:
        return

    key, _, value = update.message.text.partition(":")
    key = key.strip().lower().replace(" ", "_")
    value = value.strip()
    pending.setdefault("fields", {})[key] = value

    folder, filename = POST_TYPES[pending["type"]]
    draft = render_template(folder, filename, **pending["fields"])
    await update.message.reply_text(f"Updated `{key}`. Draft:\n\n{draft}", parse_mode="Markdown")


async def promote_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    if not is_admin(update.effective_user.id):
        await update.message.reply_text("Permission denied.")
        return

    if len(context.args) < 2:
        await update.message.reply_text("Usage: /promote <user_id> <ROLE>")
        return

    try:
        target_id = int(context.args[0])
    except ValueError:
        await update.message.reply_text("Invalid user_id.")
        return

    role = context.args[1].upper()
    if role not in VALID_ROLES:
        await update.message.reply_text(f"Invalid role. Valid: {', '.join(sorted(VALID_ROLES))}")
        return

    register_member(target_id, None, None)
    set_role(target_id, role)
    await update.message.reply_text(f"Promoted {target_id} → {role}")


async def task_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return
    if not is_admin(update.effective_user.id):
        await update.message.reply_text("Permission denied.")
        return

    if len(context.args) < 3:
        await update.message.reply_text("Usage: /task <user_id> <type> <title>")
        return

    try:
        target_id = int(context.args[0])
    except ValueError:
        await update.message.reply_text("Invalid user_id.")
        return

    task_type = context.args[1]
    title = " ".join(context.args[2:])
    register_member(target_id, None, None)
    add_task(target_id, task_type, title)
    count = task_count(target_id)
    min_tasks = load_roles().get("initiate_requirements", {}).get("min_tasks", 2)
    await update.message.reply_text(
        f"Task recorded for {target_id}: [{task_type}] {title}\n"
        f"Progress: {count}/{min_tasks} tasks"
    )


async def status_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.effective_user:
        return

    if context.args and is_admin(update.effective_user.id):
        try:
            user_id = int(context.args[0])
        except ValueError:
            await update.message.reply_text("Invalid user_id.")
            return
    else:
        user_id = update.effective_user.id

    member = get_member(user_id)
    if not member:
        await update.message.reply_text("Not registered. Send /start first.")
        return

    count = task_count(user_id)
    min_tasks = load_roles().get("initiate_requirements", {}).get("min_tasks", 2)
    await update.message.reply_text(
        f"User: {member['display_name'] or member['username'] or user_id}\n"
        f"Role: {member['role']}\n"
        f"Tasks: {count}/{min_tasks}\n"
        f"Joined: {member['joined_at'][:10]}"
    )


async def send_admin_reminder(context: ContextTypes.DEFAULT_TYPE) -> None:
    slot = context.job.data if context.job else ""
    msg = reminder_message(slot)
    if not msg or not ADMIN_IDS:
        return
    for admin_id in ADMIN_IDS:
        try:
            await context.bot.send_message(chat_id=admin_id, text=msg)
        except Exception:
            logger.exception("Failed to send reminder to %s", admin_id)


def setup_jobs(application: Application) -> None:
    jq = application.job_queue
    if jq is None:
        logger.warning("JobQueue unavailable — install python-telegram-bot[job-queue]")
        return

    cal = load_calendar()
    tz = calendar_tz()

    for name, slot in cal.get("daily", {}).items():
        raw = slot.get("time", "09:00")
        hour, minute = (int(x) for x in raw.split(":"))
        jq.run_daily(
            send_admin_reminder,
            time=datetime.now(tz).replace(hour=hour, minute=minute, second=0).timetz(),
            days=(0, 1, 2, 3, 4, 5, 6),
            data=f"daily_{name}",
            name=f"reminder_daily_{name}",
        )

    weekday_map = {
        "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
        "friday": 4, "saturday": 5, "sunday": 6,
    }
    for weekday, slot in cal.get("weekly", {}).items():
        raw = slot.get("time", "10:00")
        hour, minute = (int(x) for x in raw.split(":"))
        day = weekday_map.get(weekday, 0)
        jq.run_daily(
            send_admin_reminder,
            time=datetime.now(tz).replace(hour=hour, minute=minute, second=0).timetz(),
            days=(day,),
            data=f"weekly_{weekday}",
            name=f"reminder_weekly_{weekday}",
        )


def main() -> None:
    if not BOT_TOKEN:
        raise RuntimeError("BOT_TOKEN is not set")

    init_db()

    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("tools", tools_cmd))
    application.add_handler(CommandHandler("schema", schema_cmd))
    application.add_handler(CommandHandler("rules", rules_cmd))
    application.add_handler(CommandHandler("recruit", recruit_cmd))
    application.add_handler(CommandHandler("calendar", calendar_cmd))
    application.add_handler(CommandHandler("post", post_cmd))
    application.add_handler(CommandHandler("publish", publish_cmd))
    application.add_handler(CommandHandler("promote", promote_cmd))
    application.add_handler(CommandHandler("task", task_cmd))
    application.add_handler(CommandHandler("status", status_cmd))
    application.add_handler(MessageHandler(filters.REPLY & filters.TEXT & ~filters.COMMAND, field_reply))

    setup_jobs(application)

    logger.info("NULL//ORDER bot starting (admins=%s)", ADMIN_IDS)
    application.run_polling()


if __name__ == "__main__":
    main()
