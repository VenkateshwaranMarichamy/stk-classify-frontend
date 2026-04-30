# StoxAtlas — Frontend Developer Guide

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| UI Library | Ant Design 5 |
| HTTP | axios with AbortController |
| Language | JavaScript (JSX) |

---

## Project Structure

```
src/
├── App.jsx                          # Root — tab layout, Classification dropdown menu
├── App.module.css                   # Header, layout styles
├── services/
│   └── classificationService.js    # ALL API calls (single source of truth)
└── components/
    ├── ClassificationFilters.jsx    # Classification tab — Classified view
    ├── ClassificationDropdowns.jsx  # Cascading dropdowns (Macro→Sector→Industry→Basic)
    ├── EditStockModal.jsx           # Edit modal for classified stocks
    ├── StocksTable.jsx              # Results table with client-side filters
    ├── classificationUtils.js       # buildIndex() — in-memory hierarchy from API data
    ├── UnclassifiedStocksTab.jsx    # Classification tab — Unclassified view
    ├── PeerFundamentals.jsx         # Peers tab (Fundamentals / Valuation / Technical)
    ├── ProfilesWorkspaceTab.jsx     # Profiles tab — stock picker
    ├── StockProfileEditorTab.jsx    # Profile editor form with dirty tracking
    ├── ProfileEditorErrorBoundary.jsx
    └── StockDetailTab.jsx           # Stock Detail tab — read-only consolidated view
```

---

## Backend Services

| Service | Base URL | Purpose |
|---|---|---|
| Main API | `http://localhost:8000` | Classification, profiles, fundamentals, valuation |
| Screener API | `http://localhost:8004` | Technical indicators |

---

## Service Layer (`classificationService.js`)

All API calls go through this file. Every function accepts an optional `signal` (AbortController) for cancellation.

| Function | Method | Endpoint | Used By |
|---|---|---|---|
| `fetchClassificationData` | GET | `/api/classification/dropdown-data` | Classification tab — builds cascading dropdowns |
| `fetchStocksByBasicCode` | GET | `/api/classification/stocks?basic_ind_code=` | Classification search results; Peers classMap |
| `fetchBasicIndustries` | GET | `/api/classification/basic-industries?limit=200` | Edit modal; Peers selector; Unclassified modal |
| `updateStockClassification` | PUT | `/api/classification/stocks/{id}` | Edit modal save |
| `fetchPeerYears` | GET | `/api/fundamentals/peer-years?basic_ind_code=` | Peers Fundamentals — year selector |
| `fetchPeerFundamentals` | GET | `/api/fundamentals/peers` | Peers Fundamentals — table data |
| `fetchStockProfile` | GET | `/api/profiles/{id}` | Profiles editor; Stock Detail tab |
| `patchStockProfile` | PATCH | `/api/profiles/{id}` | Profiles editor — save |
| `fetchAllStocks` | GET | `/api/stocks/active` | Profiles picker; Stock Detail picker; ID→name resolution |
| `fetchStockDetails` | GET | `/api/stocks/{id}` | Stock Detail — Classification section |
| `fetchStockFundamentals` | GET | `/api/fundamentals/stock/{id}` | Stock Detail — Fundamentals section |
| `fetchUnclassifiedStocks` | GET | `/api/stocks/unclassified` | Unclassified tab — queue |
| `classifyStock` | POST | `/api/stocks/{id}/classify` | Unclassified tab — classify modal |
| `fetchTechnicalIndicators` | GET | `http://localhost:8004/screener/indicators/{id}` | Stock Detail — Technical section |
| `fetchIndustryTechnicalIndicators` | GET | `http://localhost:8004/screener/industry/{code}/indicators` | Peers Technical view |
| `fetchPeerValuation` | GET | `/api/fundamentals/valuation/peers` | Peers Valuation view; Fundamentals valuation columns |
| `fetchValuationYears` | GET | `/api/fundamentals/valuation/years?basic_ind_code=` | Peers Valuation year selector; Fundamentals valuation fetch |

---

## Tab 1 — Classification

**Entry point:** `App.jsx` — dropdown menu with two items: **Classified** and **Unclassified**

### Classified View (`ClassificationFilters.jsx`)

**On mount:**
- `GET /api/classification/dropdown-data` → builds in-memory hierarchy via `buildIndex()` in `classificationUtils.js`
- The index is a nested Map: `macroName → sectorName → industryName → basicName → basicCode`

**User flow:**
1. Select Macro Sector → Sector → Industry → Basic Industry (cascading, each depends on previous)
2. Click Search → `GET /api/classification/stocks?basic_ind_code={code}`
3. Results render in `StocksTable` with client-side filter bar (Market Cap / Revenue Size / Tech Risk / Fund Risk / "Not set")
4. Click Edit → lazy-loads `GET /api/classification/basic-industries?limit=200` → opens `EditStockModal`
5. Save → `PUT /api/classification/stocks/{company_id}` with body:
   ```json
   { "company_name", "basic_ind_code", "market_cap_category", "tech_risk", "fund_risk", "revenue_size", "comments" }
   ```
6. Optimistic table update + background refresh

**Enum values:**
- `market_cap_category`: `MEGA_CAP | LARGE_CAP | MID_CAP | SMALL_CAP | MICRO_CAP`
- `tech_risk` / `fund_risk`: `HIGH | MEDIUM | LOW`
- `revenue_size`: `LARGE | MEDIUM | SMALL | MICRO`

### Unclassified View (`UnclassifiedStocksTab.jsx`)

**On mount:** `GET /api/stocks/unclassified` → `{ total, data: [{ id, name, trading_symbol }] }`

**User flow:**
1. Sortable table (by name), searchable by name/symbol
2. Click Classify → lazy-loads basic industries → opens modal pre-filled with stock name
3. Submit → `POST /api/stocks/{id}/classify` with body:
   ```json
   { "company_name", "basic_ind_code", "market_cap_category", "tech_risk", "fund_risk", "revenue_size", "comments" }
   ```
4. On success: stock removed from list, total decremented

---

## Tab 2 — Peers (`PeerFundamentals.jsx`)

**On mount:** `GET /api/classification/basic-industries?limit=200` → populates industry selector

**On industry selection (fires in parallel):**
1. `GET /api/classification/stocks?basic_ind_code={code}` → builds `classMap: COMPANY_NAME_UPPERCASE → { market_cap_category, tech_risk, fund_risk, revenue_size }` for the shared filter bar

Three views toggled by a Segmented control:

### Fundamentals View

**On industry selection:**
- `GET /api/fundamentals/peer-years?basic_ind_code={code}` → year selector, auto-selects default year
- `GET /api/fundamentals/valuation/years?basic_ind_code={code}` → gets valuation default year
- `GET /api/fundamentals/valuation/peers?basic_ind_code={code}&financial_year={defaultValYear}&sort_by=market_cap&sort_dir=desc` → loads ALL valuation rows (no pagination), builds `valMap: Number(stock_id) → valuation row`

**On year change (fundamentals only):**
- `GET /api/fundamentals/peers?basic_ind_code={code}&financial_year={year}&page=...&sort_by=...` → server-side pagination + sorting
- Valuation data does NOT re-fetch — it stays fixed at the default valuation year

**Merged columns in table:**
- Valuation columns (static, from default year): Price, Trailing PE, Div Yield %, Mkt Cap (Cr) — joined by `Number(stock_id)`
- Fundamentals columns (change with year): Revenue, Net Income, EBITDA, etc.

**Column picker:** 35+ metrics + 4 valuation columns, custom selection

### Valuation View

**On industry selection:**
- `GET /api/fundamentals/valuation/years?basic_ind_code={code}` → year selector
- `GET /api/fundamentals/valuation/peers?...&financial_year={year}&page=...&sort_by=...` → server-side pagination + sorting

**Columns (26 total, column picker with Reset/All):**
Stock, Price, Market Cap, EV, Trailing PE, Forward PE, PEG, P/S, P/B, EV/Rev, EV/EBITDA, Trailing EPS, Forward EPS, Book Value, Cash/Share, Current Ratio, Quick Ratio, D/E, ROA, ROE, Div Yield, Payout, Shares, Float, Insiders %, Institutions %

**Default visible:** Stock, Price, Market Cap, Trailing PE, Forward PE, P/B, Book Value, Div Yield, ROE, D/E

### Technical View

**On industry selection:**
- `GET http://localhost:8004/screener/industry/{code}/indicators?page=...&page_size=...` → server-side pagination

**Column picker grouped by:** Price · Moving Averages · Momentum · Trend · Volatility · Volume · Pivot

**Filter bar (shared across all 3 views):** Market Cap / Revenue Size / Tech Risk / Fund Risk — client-side join against `classMap` by stock name (uppercase). Stocks not in classMap pass through unfiltered.

---

## Tab 3 — Profiles

**Components:** `ProfilesWorkspaceTab.jsx` + `StockProfileEditorTab.jsx`

**On mount:** `GET /api/stocks/active` → stock picker (sorted alphabetically)

**On stock selection:** `GET /api/profiles/{stock_id}` → loads all profile fields into form

**Profile fields:**

| Field | Type | Notes |
|---|---|---|
| `ownership_type` | string | `GOVT_CONTROLLED \| JOINT_VENTURE \| PRIVATE \| PSU` |
| `business_risk_level` | string | `HIGH \| MEDIUM \| LOW` |
| `business_group` | string | |
| `information` | string | Long text |
| `associated_brands` | string[] | Tag input |
| `location` | string[] | Tag input |
| `clients` | string[] | Tag input |
| `products` | string[] | Tag input |
| `index_stock` | string[] | e.g. `["NIFTY"]` |
| `cutting_edge_products` | string[] | Tag input |
| `keynotes` | string[] | List editor |
| `parent_companies` | number[] | Stock IDs → resolved to names via stock directory |
| `subsidiaries` | number[] | Stock IDs → resolved to names via stock directory |

**Dirty tracking:** Each field compared against original. Changed fields show "Modified" tag. Only changed fields sent in PATCH.

**Save:** `PATCH /api/profiles/{stock_id}` — body contains only changed fields

**Error handling:** On save failure, rolls back to previous state. Unsaved changes trigger `beforeunload` warning and confirmation modal on close.

---

## Tab 4 — Stock Detail (`StockDetailTab.jsx`)

**On mount:** `GET /api/stocks/active` → stock picker

**On stock selection — fires 4 parallel fetches (shared AbortController, cancelled on re-selection):**

```
GET /api/stocks/{id}
  → ClassificationSection
    - Company Name, Basic Industry
    - MetricBadges: Market Cap, Revenue Size, Tech Risk, Fund Risk (colored tags)

GET /api/profiles/{id}
  → ProfileSection
    - Text: Ownership Type, Business Risk Level, Business Group, Information
    - Tags: Associated Brands, Locations, Clients, Products, Keynotes
    - Tags: Index, Cutting Edge Products
    - Resolved names: Parent Companies, Subsidiaries (IDs → names via stock directory)

GET /api/fundamentals/stock/{id}
  → FundamentalsSection (transposed table)
    - Rows = 35 metrics in 8 groups (Income/Growth/Margins/Returns/Efficiency/Leverage/Liquidity/Cash Flow)
    - Columns = financial years, newest → oldest
    - Null values → "—"

GET http://localhost:8004/screener/indicators/{id}
  → TechnicalSection (grouped Descriptions)
    - Groups: Price / Moving Averages / Momentum / Trend / Volatility / Volume / Pivot
    - golden_cross_state → green/red tag
    - Boolean events → Yes/No tags
```

Each section has independent: loading skeleton · error alert · retry button

---

## Key Frontend Patterns

### 1. Request Cancellation
Every fetch uses `AbortController`. On unmount or re-selection, `controller.abort()` is called. `CanceledError` is silently ignored.

```js
useEffect(() => {
  const controller = new AbortController();
  fetchSomething(controller.signal).then(...).catch(...);
  return () => controller.abort();
}, [dependency]);
```

### 2. Parallel Loading (Stock Detail)
Four fetches fire independently — not awaited sequentially. Each section manages its own `loading/error/data` state.

```js
fetchA(id, signal).then(setA).catch(...).finally(() => setLoadingA(false));
fetchB(id, signal).then(setB).catch(...).finally(() => setLoadingB(false));
fetchC(id, signal).then(setC).catch(...).finally(() => setLoadingC(false));
fetchD(id, signal).then(setD).catch(...).finally(() => setLoadingD(false));
```

### 3. Valuation + Fundamentals Join (Peers tab)
Valuation data is fetched once at the default year and stored in a `Map<Number(stock_id) → row>`. When fundamentals rows are rendered, each row is enriched:

```js
const val = valMap.get(Number(row.stock_id)) || {};
return { ...row, _current_price: val.current_price ?? null, ... };
```

The valuation data does NOT change when the user changes the fundamentals year selector.

### 4. Classification Filter (Peers tab)
`classMap` is built from `GET /api/classification/stocks` once per industry selection:
```js
Map<"COMPANY NAME UPPERCASE" → { market_cap_category, tech_risk, fund_risk, revenue_size }>
```
Shared across Fundamentals, Valuation, and Technical views. Filter is client-side on the loaded page.

### 5. Dirty Tracking (Profiles)
```js
// Only changed fields are sent in PATCH
function buildPatchPayload(original, current) {
  // compares field by field, returns only changed ones
}
```
Array fields use deep equality. ID arrays (parent_companies, subsidiaries) are stored as `number[]`.

### 6. Optimistic Updates (Classification edit)
Table row updated immediately on save, then background refresh syncs with server.

---

## Enum Reference

| Field | Values |
|---|---|
| `market_cap_category` | `MEGA_CAP`, `LARGE_CAP`, `MID_CAP`, `SMALL_CAP`, `MICRO_CAP` |
| `tech_risk` | `HIGH`, `MEDIUM`, `LOW` |
| `fund_risk` | `HIGH`, `MEDIUM`, `LOW` |
| `revenue_size` | `LARGE`, `MEDIUM`, `SMALL`, `MICRO` |
| `business_risk_level` | `HIGH`, `MEDIUM`, `LOW` |
| `ownership_type` | `GOVT_CONTROLLED`, `JOINT_VENTURE`, `PRIVATE`, `PSU` |
| `golden_cross_state` | `above`, `below` |

---

## Response Shape Quick Reference

### `/api/stocks/active`
```json
[{ "id": 10, "name": "COMPANY NAME", "symbol": "SYM" }]
```
Note: may also return `{ data: [...] }` — normalization handles both shapes.

### `/api/classification/stocks?basic_ind_code=`
```json
{
  "basic_ind_code": "IN...",
  "count": 179,
  "data": [{ "company_id": 2228, "company_name": "...", "market_cap_category": "MICRO_CAP", "tech_risk": "MEDIUM", "fund_risk": "LOW", "revenue_size": "SMALL", "comments": "..." }]
}
```

### `/api/stocks/{id}`
```json
{ "id": 10, "company_name": "...", "basic_industry_name": "...", "basic_ind_code": "...", "market_cap_category": "SMALL_CAP", "tech_risk": "MEDIUM", "fund_risk": "LOW", "revenue_size": "SMALL" }
```

### `/api/profiles/{id}`
```json
{ "stock_id": 10, "stock_name": "...", "ownership_type": "PRIVATE", "business_risk_level": "LOW", "business_group": "...", "information": "...", "associated_brands": [], "location": [], "clients": [], "products": [], "index_stock": ["NIFTY"], "cutting_edge_products": [], "keynotes": [], "parent_companies": [5], "subsidiaries": [33] }
```

### `/api/fundamentals/stock/{id}`
```json
{ "stock_id": 1, "stock_name": "...", "count": 5, "rows": [{ "financial_year": 2025, "financial_date": "2025-03-31", "total_revenue": 1054.5, "net_income": 176.3, "...": "35 metrics" }] }
```

### `/api/fundamentals/valuation/peers`
```json
{ "basic_ind_code": "...", "financial_year": 2026, "page": 1, "page_size": 25, "total": 23, "rows": [{ "stock_id": 5396, "stock": "HAVELLS", "current_price": 1235.1, "market_cap": 77472.49, "trailing_pe": 45.74, "dividend_yield": 0.81, "book_value": 150.647, "...": "26 fields" }] }
```

### `screener/indicators/{id}`
```json
{ "ticker_id": 10, "trade_date": "2026-04-17", "last_close": "462.70", "high_52w": "501.55", "rsi_14": "73.72", "macd_line": "33.35", "golden_cross_state": "below", "...": "40+ indicators" }
```

### `screener/industry/{code}/indicators`
```json
{ "basic_ind_code": "...", "page": 1, "page_size": 50, "total": 179, "stocks": [{ "ticker_id": 55, "name": "STOCK NAME", "last_close": "48.38", "...": "same fields as single indicator" }] }
```
