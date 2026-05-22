# Strangler Rollout Strategy

## Routing Contract

- Keep legacy Node API on `/api/*`.
- Expose DRF API on `/api/v2/*`.
- During migration, frontends can use both paths by module.

## Migration Sequence

1. Catalog + product-images
2. Auth + users + carts
3. Orders + payments + inventory + reports
4. Disable writes on v1, then decommission

## Traffic and Safety Controls

- Add request id headers in gateway for correlation.
- For each migrated module, run shadow reads:
  - Main request serves from v2
  - Background compare with v1 for response parity
- If parity drops below threshold, rollback frontend module to v1 only.

## Rollback Rules

- If `5xx` on v2 for a module > 2% in 5 minutes:
  - flip module feature flag back to v1
  - keep v2 traffic at 0% for that module until fixed
- Never disable `/api/*` until all module checks pass for 7 consecutive days.

## Frontend Flags

- `VITE_API_BASE_URL` for legacy v1
- `VITE_API_V2_BASE_URL` for migrated modules
- `VITE_USE_API_V2_CATALOG` etc per module
