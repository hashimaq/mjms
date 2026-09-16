#!/usr/bin/env python3
"""Validate MJMS Supabase migration files (syntax checks, design rules)."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MIGRATIONS = ROOT / "supabase" / "migrations"

REQUIRED_TABLES = ("profiles", "articles", "article_images")
FORBIDDEN_PATTERNS = [
    (re.compile(r"project_normalized\s+.*UNIQUE", re.I), "UNIQUE on project_normalized"),
    (re.compile(r"project_raw\s+.*UNIQUE", re.I), "UNIQUE on project_raw"),
    (re.compile(r"sha256\s+text\s+UNIQUE\b", re.I), "UNIQUE on sha256 column"),
    (re.compile(r"UNIQUE\s*\(\s*sha256\s*\)", re.I), "UNIQUE constraint on sha256"),
    (re.compile(r"USING\s*\(\s*true\s*\)", re.I), "Overly permissive RLS USING (true)"),
    (re.compile(r"eyJ[a-zA-Z0-9_-]{20,}"), "Possible JWT/secret in migration"),
    (re.compile(r"service_role", re.I), "service_role reference in migration"),
]
REQUIRED_PATTERNS = [
    (re.compile(r"REFERENCES\s+public\.articles\s*\(\s*id\s*\)", re.I), "article_images → articles FK"),
    (re.compile(r"REFERENCES\s+auth\.users\s*\(\s*id\s*\)", re.I), "profiles → auth.users FK"),
    (re.compile(r"ENABLE ROW LEVEL SECURITY", re.I), "RLS enabled"),
    (re.compile(r"product-images", re.I), "product-images bucket"),
    (re.compile(r"source_key.*UNIQUE", re.I), "source_key unique constraint"),
]


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    if not MIGRATIONS.is_dir():
        errors.append(f"Missing migrations directory: {MIGRATIONS}")
        report(errors, warnings)
        return 1

    sql_files = sorted(MIGRATIONS.glob("*.sql"))
    if not sql_files:
        errors.append("No migration SQL files found.")
        report(errors, warnings)
        return 1

    combined = ""
    for path in sql_files:
        text = path.read_text(encoding="utf-8")
        combined += f"\n-- {path.name}\n{text}"

        if text.count("(") != text.count(")"):
            warnings.append(f"{path.name}: unbalanced parentheses — review manually")

        for pattern, label in FORBIDDEN_PATTERNS:
            if pattern.search(text):
                errors.append(f"{path.name}: forbidden pattern — {label}")

    for table in REQUIRED_TABLES:
        if not re.search(rf"CREATE TABLE public\.{table}\b", combined, re.I):
            errors.append(f"Missing CREATE TABLE public.{table}")

    for pattern, label in REQUIRED_PATTERNS:
        if not pattern.search(combined):
            errors.append(f"Missing required pattern: {label}")

    if re.search(r"CREATE TABLE public\.passwords\b", combined, re.I):
        errors.append("Custom password table detected — use auth.users only")

    report(errors, warnings)
    return 1 if errors else 0


def report(errors: list[str], warnings: list[str]) -> None:
    print("MJMS Schema Validation")
    print("=" * 40)
    if errors:
        print(f"\nERRORS ({len(errors)}):")
        for e in errors:
            print(f"  [FAIL] {e}")
    else:
        print("\n[OK] No blocking errors.")

    if warnings:
        print(f"\nWARNINGS ({len(warnings)}):")
        for w in warnings:
            print(f"  ! {w}")

    if not errors:
        print("\nDesign checks passed:")
        print("  - Project is NOT globally unique")
        print("  - source_key IS unique (sheet::row)")
        print("  - article_images references articles(id)")
        print("  - profiles references auth.users(id)")
        print("  - RLS enabled; no USING (true) write policies")
        print("  - product-images private bucket defined")


if __name__ == "__main__":
    sys.exit(main())
