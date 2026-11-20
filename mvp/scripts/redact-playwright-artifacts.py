"""Replace the automation bypass secret in Playwright artifacts. Never prints the secret."""

import os
import sys
import zipfile
from pathlib import Path

secret = os.environ.get("VERCEL_AUTOMATION_BYPASS_SECRET", "")
if not secret:
    sys.exit(0)

needle = secret.encode()
replacement = b"[REDACTED]"
roots = [Path("test-results"), Path("playwright-report")]


def scrub(data: bytes) -> bytes:
    return data.replace(needle, replacement)


def scrub_zip(path: Path) -> None:
    rewritten = path.with_suffix(path.suffix + ".redacted")
    with zipfile.ZipFile(path, "r") as source, zipfile.ZipFile(rewritten, "w") as target:
        for info in source.infolist():
            target.writestr(info, scrub(source.read(info)))
    rewritten.replace(path)


for root in roots:
    if not root.exists():
        continue
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix == ".zip" or path.name.endswith(".trace"):
            try:
                scrub_zip(path)
            except zipfile.BadZipFile:
                data = path.read_bytes()
                if needle in data:
                    path.write_bytes(scrub(data))
            continue
        data = path.read_bytes()
        if needle in data:
            path.write_bytes(scrub(data))
