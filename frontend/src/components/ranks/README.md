# Ranks & Honor (Frontend)

Place your frontend components here that display honor ranks, ranking criteria, and bonuses by rank.

Suggested files to upload:

- `RanksList.jsx` or `RanksList.tsx` — component that lists ranks and their display order.
- `RankCard.jsx` — single rank component showing name, range, criteria, and bonuses.
- `RankDetailsModal.jsx` — modal showing detailed criteria and example calculations.
- `useRanks.js` — optional hook to fetch ranks from the backend (or from a local JSON file for demos).
- `ranks.css` or `ranks.module.css` — styles.
- `__tests__/` — unit tests for components.

API integration:
- If components call your backend, include an example API helper file `frontend/src/api/ranks.js` that shows the endpoints used (GET /api/ranks, GET /api/ranks/{id}).

Notes:
- Indicate any external libraries required (charting libs, formatting, etc.).
- Prefer small example data files (e.g., `example_ranks.json`) if you want to demo without a backend.

Upload your component files here and tell me when they're ready; I can integrate them into the frontend and add tests.
