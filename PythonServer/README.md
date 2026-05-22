# PythonServer (Django REST v2)

DRF backend for strangler migration from Node `/api` to Python `/api/v2`.

## Setup

```bash
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## Endpoints

- Health: `/health`
- API docs: `/api/docs/`
- OpenAPI schema: `/api/schema/`
- REST v2 base: `/api/v2/`

## Notes

- Catalog/auth/commerce endpoints are implemented with compatibility envelope `{ data: ... }`.
- Existing MySQL tables are mapped as unmanaged Django models for phased migration.
- Try-on sessions are stored in `tryon_sessions` table (managed migration included).
