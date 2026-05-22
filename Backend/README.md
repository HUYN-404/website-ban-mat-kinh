# Glasses Admin Dashboard (UI only)

React + Vite + TypeScript admin dashboard. No API yet; uses mock data.

## Run (Windows)
1) Install deps
```
cd dashboard
npm install
```

2) Start dev server
```
npm run dev
```

Open the URL shown (default `http://localhost:5173`).

## Structure
- `src/ui/DashboardLayout.tsx`: layout with sidebar/topbar
- `src/router.tsx`: routes
- `src/views/*`: pages for modules
- `src/styles.css`: basic styling

Next steps: connect pages to your API when ready.


