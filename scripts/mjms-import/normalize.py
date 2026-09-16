"""Normalization helpers — never overwrites raw values."""

import re

MAKING_CORRECTIONS = {
    "CONVYER": "CONVEYOR",
}

SEASON_CORRECTIONS = {
    "WINTER / SUMMER": "WINTER / SUMMER",
}

TYPE_WHITESPACE = re.compile(r"\s+")


def _collapse_whitespace(value: str) -> str:
    return TYPE_WHITESPACE.sub(" ", value.strip())


def normalize_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    text = str(value)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return text


def normalize_project(value) -> str:
    text = normalize_text(value)
    if not text:
        return ""
    return _collapse_whitespace(text).upper()


def normalize_season(value) -> str:
    text = _collapse_whitespace(normalize_text(value)).upper()
    return SEASON_CORRECTIONS.get(text, text)


def normalize_making(value) -> str:
    text = _collapse_whitespace(normalize_text(value)).upper()
    return MAKING_CORRECTIONS.get(text, text)


def normalize_type(value) -> str:
    text = _collapse_whitespace(normalize_text(value)).upper()
    return text


def slugify_sheet(name: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9]+", "_", name.strip())
    slug = re.sub(r"_+", "_", slug).strip("_")
    return slug.upper() or "SHEET"
