from __future__ import annotations

import hashlib
import sys
import zipfile
from pathlib import Path


def main(path: Path, version: str) -> int:
    raw = path.read_bytes()
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
        html = archive.read("assets/www/index.html").decode("utf-8")
        js_name = next(
            name
            for name in names
            if name.startswith("assets/www/assets/index-") and name.endswith(".js")
        )
        js = archive.read(js_name).decode("utf-8")

    checks = {
        "entries": len(names),
        "apk_bytes": len(raw),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "has_index": "assets/www/index.html" in names,
        "js": js_name,
        "relative_assets": "./assets/" in html,
        "has_version": version in js,
        "has_replace_state": "replaceState" in js,
        "has_back_bridge": "__dongfenCloseTopModal" in js,
        "no_old_hash_navigation": "window.location.hash=" not in js,
        "no_service_worker": "registerSW.js" not in html,
        "has_v2_signature_block": b"APK Sig Block 42" in raw,
    }
    for key, value in checks.items():
        print(f"{key}: {value}")
    required = [
        checks["has_index"],
        checks["relative_assets"],
        checks["has_version"],
        checks["has_replace_state"],
        checks["has_back_bridge"],
        checks["no_old_hash_navigation"],
        checks["no_service_worker"],
    ]
    return 0 if all(required) else 1


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("usage: verify_apk.py <apk> <version>")
    sys.exit(main(Path(sys.argv[1]), sys.argv[2]))