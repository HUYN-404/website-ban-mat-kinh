import json
import os
from pathlib import Path

import requests


ROOT = Path(__file__).resolve().parents[1]
MATRIX_FILE = ROOT / "contracts" / "endpoint-matrix.json"

V1_BASE = os.getenv("SHADOW_V1_BASE", "http://localhost:3000/api")
V2_BASE = os.getenv("SHADOW_V2_BASE", "http://localhost:8000/api/v2")
TOKEN = os.getenv("SHADOW_BEARER_TOKEN", "")


def normalize_path(path: str) -> str:
    return (
        path.replace(":roleId", "1")
        .replace(":userId", "1")
        .replace(":categoryId", "1")
        .replace(":brandId", "1")
        .replace(":supplierId", "1")
        .replace(":productId", "1")
        .replace(":imageId", "1")
        .replace(":transactionId", "1")
        .replace(":orderId", "1")
        .replace(":orderItemId", "1")
        .replace(":paymentId", "1")
        .replace(":cartId", "1")
        .replace(":cartItemId", "1")
    )


def compare_get_endpoint(path: str, require_auth: bool):
    headers = {}
    if require_auth and TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"

    v1_res = requests.get(f"{V1_BASE}{path}", headers=headers, timeout=10)
    v2_res = requests.get(f"{V2_BASE}{path}", headers=headers, timeout=10)

    v1_ok = 200 <= v1_res.status_code < 500
    v2_ok = 200 <= v2_res.status_code < 500
    return {
        "path": path,
        "v1_status": v1_res.status_code,
        "v2_status": v2_res.status_code,
        "ok": v1_ok and v2_ok,
    }


def main():
    matrix = json.loads(MATRIX_FILE.read_text(encoding="utf-8"))
    get_endpoints = [item for item in matrix["endpoints"] if item["method"] == "GET"]
    results = []
    for item in get_endpoints:
        path = normalize_path(item["path"])
        results.append(compare_get_endpoint(path, item.get("auth", False)))

    failed = [item for item in results if not item["ok"]]
    print(json.dumps({"total": len(results), "failed": len(failed), "results": results}, indent=2))
    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
