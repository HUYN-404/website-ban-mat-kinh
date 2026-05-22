# Validation Scripts

## Contract Smoke (v2)

```bash
pip install requests
set CONTRACT_BASE_URL=http://localhost:8000/api/v2
set CONTRACT_BEARER_TOKEN=<token-if-needed>
python migration/validation/contract_smoke.py
```

Checks:
- API responds without `5xx` for frozen GET endpoints
- Successful responses preserve `{ data: ... }` envelope

## Shadow Compare (v1 vs v2)

```bash
pip install requests
set SHADOW_V1_BASE=http://localhost:3000/api
set SHADOW_V2_BASE=http://localhost:8000/api/v2
set SHADOW_BEARER_TOKEN=<token-if-needed>
python migration/validation/shadow_compare.py
```

Checks:
- GET endpoint availability parity between v1 and v2
