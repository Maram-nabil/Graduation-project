# Backend Refactor Plan

## Current Project Structure (Relevant Parts)

```
backend_V1/
├── index.js                    # Legacy entry (uses analysis/wsServer)
├── src/
│   ├── server.js               # Main entry: config, DB, createApp, startWsServer(analysis/wsServer)
│   ├── app.js                  # Express app, bootstrap routes
│   ├── wsServer.js             # Standalone WS server (not used by server.js)
│   ├── config/
│   │   ├── index.js            # config.analysisUrl, config.aiUrl → Python
│   │   └── database.js
│   ├── DB/models/
│   │   ├── user.model.js
│   │   ├── category.model.js
│   │   ├── transactions.model.js
│   │   └── item.model.js
│   ├── module/
│   │   ├── bootStrap.js        # Mounts auth, category, transactions, items, ai, analytics, export
│   │   ├── analysis/
│   │   │   └── wsServer.js     # WebSocket server + broadcastAnalysis()
│   │   ├── auth/
│   │   ├── categorty/
│   │   ├── transactions/      # Calls Python ANALYSIS_URL on create, then broadcastAnalysis
│   │   ├── items/
│   │   ├── AI/                 # Groq-based text/voice (keep)
│   │   ├── analytics/          # Pure Node aggregation (keep, extend)
│   │   └── export/
│   └── middleware/
└── Analysis/                   # Python – TO REMOVE
    ├── main.py                 # FastAPI /analyze → charts, category_analysis, etc.
    ├── voice_main.py
    ├── requirements.txt
    └── README.md
```

## What Should Be Removed

1. **Entire `Analysis/` folder**
   - `main.py` – FastAPI analytics (total_amount, analysis_over_time, category_analysis, base64 charts).
   - `voice_main.py` – Local Whisper voice service (Node AI module uses Groq, not this).
   - `requirements.txt`, `README.md` for that service.

2. **Python integration in Node**
   - In `transactions.controller.js`: remove all `axios.post(ANALYSIS_URL, ...)` and the async IIFE that calls Python after create (createWithText, createWithVoice, createWithOCR). Replace with Node-based home analytics and `broadcastAnalysis(payload)`.
   - In `src/config/index.js`: remove `analysisUrl` and `aiUrl` (both pointed to Python).

3. **Optional**
   - `axios` dependency can be removed from `package.json` if no other file uses it (only transactions used it for analysis).

## Refactor Plan (Step by Step)

### 1. Analytics in Node.js only
- **Add** `src/module/analytics/analytics.service.js`:
  - `getHomeAnalytics(userId)` – MongoDB aggregation: total_amount, analysis_over_time (daily), category_analysis (by category). Match the payload shape previously sent to WebSocket (no base64 charts; frontend can build charts from data).
  - `getTopSpendingCategory(userId)` – aggregation on transactions with `type: 'expense'`, `isDeleted: { $ne: true }`, group by category, sort by total, limit 1. Used by OfferService.
- **Keep** existing analytics controller/routes; optionally have controller call the new service for consistency.

### 2. WebSocket real-time home updates
- **Keep** `src/module/analysis/wsServer.js` and `broadcastAnalysis(payload)`.
- After each transaction create (createWithText, createWithVoice, createWithOCR): call `analyticsService.getHomeAnalytics(req.user._id)` and then `broadcastAnalysis(payload)` with that result. No Python, no axios.

### 3. Offer model and service
- **Create** `src/DB/models/offer.model.js`: platformName, category (ref Category), title, discountPercentage, imageUrl, redirectUrl, validUntil, isActive, timestamps.
- **Create** `src/module/offers/offer.service.js`:
  - `getTopSpendingCategory(userId)` – delegate to analytics service or duplicate aggregation (expense only).
  - `getActiveOffersByCategory(categoryId)` – find offers where category, isActive true, validUntil > now.
  - `getPersonalizedOffers(userId)` – get top spending category, then get active offers for that category.

### 4. Offers API
- **Create** `src/module/offers/offer.controller.js`: getPersonalizedOffers (GET /offers/personalized/:userId), admin: create, update, delete, list.
- **Create** `src/module/offers/offer.routes.js`:
  - GET `/offers/personalized/:userId` (protected, optionally ensure userId === req.user._id).
  - Mount admin routes: GET/POST/PUT/DELETE under `/admin/offers` with `allowedTo('admin')`.

### 5. Project structure and bootstrap
- **Models**: `src/DB/models/offer.model.js`.
- **Services**: `src/module/analytics/analytics.service.js`, `src/module/offers/offer.service.js`.
- **Controllers**: existing + `src/module/offers/offer.controller.js`.
- **Routes**: `src/module/offers/offer.routes.js`; in bootStrap mount `/offers` and `/admin/offers` (admin uses same controller, different middleware).

### 6. Single Node server
- **Keep** `src/server.js` as the single entry: HTTP + WebSocket (analysis/wsServer). No Python process, no multi-runtime.
- **Keep** transaction CRUD and all existing endpoints unchanged; only the “post-create” behavior changes (Node analytics + broadcast instead of Python).

### 7. Cleanup
- Delete `Analysis/` folder.
- Remove `analysisUrl` and `aiUrl` from config.
- Remove axios usage from transactions (and uninstall axios if unused elsewhere).
