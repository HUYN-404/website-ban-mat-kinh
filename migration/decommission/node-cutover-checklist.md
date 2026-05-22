# Node v1 Decommission Checklist

## Pre-cutover (must pass)

- [ ] `/api/v2` covers all endpoints listed in `migration/contracts/endpoint-matrix.json`
- [ ] `contract_smoke.py` passes against v2 in staging
- [ ] `shadow_compare.py` passes for key GET routes in staging
- [ ] Frontend feature flags switched to v2:
  - [ ] `VITE_USE_API_V2_CATALOG=1`
  - [ ] `VITE_USE_API_V2_CORE=1`
- [ ] Upload and image serving work through Python stack
- [ ] Try-on flow works with real product assets

## Freeze window

- [ ] Announce maintenance window
- [ ] Enable read-only mode in Node for write endpoints (orders/payments/inventory/users)
- [ ] Final database backup before switch

## Cutover steps

1. Route `/api/*` from gateway to DRF service.
2. Keep Node process alive but isolated (no incoming traffic).
3. Monitor:
   - 4xx/5xx rate
   - p95 latency
   - order/payment success rate
4. Keep rollback switch ready in gateway config.

## Post-cutover validation

- [ ] Create test user and login
- [ ] Browse products and product images
- [ ] Add to cart / update cart
- [ ] Checkout and payment URL creation
- [ ] Admin dashboard CRUD checks
- [ ] Reports endpoint sanity check

## Rollback criteria

- [ ] Any critical checkout failure > 1% for 10 minutes
- [ ] Any data corruption bug confirmed
- [ ] Any auth outage above 5 minutes

## Final shutdown

- [ ] Disable Node deployments in CI/CD
- [ ] Archive `Server` service runbooks
- [ ] Remove Node-only env vars and secrets
- [ ] Remove v1 routes from gateway
