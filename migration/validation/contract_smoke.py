import json
import os
from pathlib import Path

import requests


ROOT = Path(__file__).resolve().parents[1]
MATRIX_FILE = ROOT / "contracts" / "endpoint-matrix.json"
BASE_URL = os.getenv("CONTRACT_BASE_URL", "http://localhost:8000/api/v2")
TOKEN = os.getenv("CONTRACT_BEARER_TOKEN", "")


def normalize(path: str) -> str:
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


def main():
    matrix = json.loads(MATRIX_FILE.read_text(encoding="utf-8"))
    checks = [item for item in matrix["endpoints"] if item["method"] == "GET"]
    failures = []
    for item in checks:
        headers = {}
        if item.get("auth") and TOKEN:
            headers["Authorization"] = f"Bearer {TOKEN}"
        url = f"{BASE_URL}{normalize(item['path'])}"
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code >= 500:
            failures.append({"path": item["path"], "status": response.status_code})
            continue
        try:
            payload = response.json()
        except ValueError:
            failures.append({"path": item["path"], "status": response.status_code, "error": "non-json response"})
            continue
        if response.status_code < 400 and "data" not in payload:
            failures.append({"path": item["path"], "status": response.status_code, "error": "missing data envelope"})

    print(json.dumps({"checked": len(checks), "failures": failures}, indent=2))
    raise SystemExit(1 if failures else 0)


if __name__ == "__main__":
    main()
