# StoxAtlas — Architecture & Business Flow Documentation

## Overview

StoxAtlas is a React 18 + Vite single-page application for stock research, classification, and peer analysis. It communicates with three backend services:

| Service | Base URL | Purpose |
|---|---|---|
| Classification & Fundamentals API | `http://localhost:8000` | Stock classification, profiles, fundamentals, peer data |
| Screener API | `http://localhost:8004` | Technical indicators per stock and per industry |

All API calls are centralised in `src/services/classificationService.js`. The app uses `axios` with `AbortController` signals for request cancellation on component unmount or re-selection.

---

## Application Structure

```
App.jsx
├── Classification tab (dropdown)
│   ├── Classified  → ClassificationFilters.jsx
│   └── Unclassified → UnclassifiedStocksTab.jsx
├── Peers tab → PeerFundamentals.jsx
├── Profiles tab → ProfilesWorkspaceTab.jsx
│   └── StockProfileEditorTab.jsx
└── Stock Detail tab → StockDetailTab.jsx
```

---

## Service Layer — `classificationService.js`

All functions accept an optional `signal` (AbortController) for cancellation.

| Function | Method | Endpoint | Used By |
|---|---|---|---|
| `fetchClassificationData` | GET | `/api/classification/dropdown-data` | Classification tab — cascading dropdowns |
| `fetchStocksByBasicCode` | GET | `/api/classification/stocks?basic_ind_code=` | Classification tab — search results; Peers filter |
| `fetchBasicIndustries` | GET | `/api/classification/basic-industries?limit=200` | Classification edit modal; Peers selector; Unclassified modal |
| `updateStockClassification` | PUT | `/api/classification/stocks/{id}` | Classification tab — Edit modal save |
| `fetchPeerYears` | GET | `/api/fundamentals/peer-years?basic_ind_code=` | Peers tab — financial year selector |
| `fetchPeerFundamentals` | GET | `/api/fundamentals/peers` | Peers tab — Fundamentals view table |
| `fetchStockProfile` | GET | `/api/profiles/{id}` | Profiles tab editor; Stock Detail tab |
| `patchStockProfile` | PATCH | `/api/profiles/{id}` | Profiles tab — save changes |
| `fetchAllStocks` | GET | `/api/stocks/active` | Profiles tab picker; Stock Detail picker; Profile editor ID resolution |
| `fetchStockDetails` | GET | `/api/stocks/{id}` | Stock Detail tab — Classification section |
| `fetchStockFundamentals` | GET | `/api/fundamentals/stock/{id}` | Stock Detail tab — Fundamentals section |
| `fetchUnclassifiedStocks` | GET | `/api/stocks/unclassified` | Unclassified tab — stock queue |
| `classifyStock` | POST | `/api/stocks/{id}/classify` | Unclassified tab — classify modal submit |
| `fetchTechnicalIndicators` | GET | `http://localhost:8004/screener/indicators/{id}` | Stock Detail tab — Technical section |
| `fetchIndustryTechnicalIndicators` | GET | `http://localhost:8004/screener/industry/{code}/indicators` | Peers tab — Technical view |

---

## Business Flows

### 1. Classification Tab — Classified View

**Component:** `ClassificationFilters.jsx`

**Purpose:** Browse and edit stocks by navigating the classification hierarchy (Macro Sector → Sector → Industry → Basic Industry), then search for stocks in that category and edit their classification metadata.

**Flow:**

```
Mount
  └─ GET /api/classification/dropdown-data
       → Builds in-memory index (macroMap) for cascading dropdowns

User selects Macro → Sector → Industry → Basic Industry → clicks Search
  └─ GET /api/classification/stocks?basic_ind_code={code}
       → Renders StocksTable with results
       → Table shows: Company, Market Cap, Revenue Size, Tech Risk, Fund Risk, Comments
       → Client-side filters: Market Cap / Revenue Size / Tech Risk / Fund Risk (+ "Not set" option)

User clicks Edit on a row
  └─ (lazy) GET /api/classification/basic-industries?limit=200
       → Populates Basic Industry dropdown in EditStockModal
  └─ EditStockModal pre-fills: company name, market cap, basic industry,
       tech_risk, fund_risk, revenue_size, comments from the row data

User clicks Update
  └─ PUT /api/classification/stocks/{company_id}
       Body: { company_name, basic_ind_code, market_cap_category,
               tech_risk, fund_risk, revenue_size, comments }
       → Optimistic update of the table row
       → Background refresh: GET /api/classification/stocks?basic_ind_code={code}
```

**Key fields (market_cap_category):** `MEGA_CAP | LARGE_CAP | MID_CAP | SMALL_CAP | MICRO_CAP`
**Key fields (tech_risk, fund_risk):** `HIGH | MEDIUM | LOW`
**Key fields (revenue_size):** `LARGE | MEDIUM | SMALL | MICRO`

---

### 2. Classification Tab — Unclassified View

**Component:** `UnclassifiedStocksTab.jsx`

**Purpose:** Show stocks that exist in the system but have not yet been assigned to a basic industry. Allow the user to classify them.

**Flow:**

```
Mount
  └─ GET /api/stocks/unclassified
       → { total, data: [{ id, name, trading_symbol }] }
       → Renders sortable table (by name) with search filter

User clicks Classify on a row
  └─ (lazy) GET /api/classification/basic-industries?limit=200
       → Populates Basic Industry dropdown in modal
  └─ Modal pre-fills company name from the row

User fills form and clicks Classify
  └─ POST /api/stocks/{id}/classify
       Body: { company_name, basic_ind_code, market_cap_category,
               tech_risk, fund_risk, revenue_size, comments }
       → On success: removes stock from the list, decrements total count
```

---

### 3. Peers Tab

**Component:** `PeerFundamentals.jsx`

**Purpose:** Compare stocks within a basic industry using either financial fundamentals or technical indicators. Supports filtering by classification metadata (market cap, risk, revenue size).

**Flow:**

```
Mount
  └─ GET /api/classification/basic-industries?limit=200
       → Populates Basic Industry selector

User selects Basic Industry
  └─ GET /api/classification/stocks?basic_ind_code={code}
       → Builds classMap: { COMPANY_NAME_UPPERCASE → { market_cap_category, tech_risk, fund_risk, revenue_size } }
       → Used for client-side filter bar (Market Cap / Revenue Size / Tech Risk / Fund Risk)

── Fundamentals view ──
User selects Fundamentals (default)
  └─ GET /api/fundamentals/peer-years?basic_ind_code={code}
       → Populates financial year selector, auto-selects default year
  └─ GET /api/fundamentals/peers?basic_ind_code={code}&financial_year={year}
         &page={n}&page_size={n}&sort_by={field}&sort_dir={asc|desc}
       → Server-side pagination + sorting
       → Column picker: 35+ metrics, custom selection, Reset/All buttons
       → Filter bar: joins rows against classMap by stock_name (uppercase match)

── Technical view ──
User selects Technical
  └─ GET http://localhost:8004/screener/industry/{code}/indicators?page={n}&page_size={n}
       → { basic_ind_code, page, page_size, total, stocks: [...] }
       → Server-side pagination
       → Column picker grouped by: Price / Moving Averages / Momentum / Trend / Volatility / Volume / Pivot
       → Filter bar: joins rows against classMap by stock name (field: "name")
       → golden_cross_state renders as green/red tag; boolean events as Yes/No tags
```

**Filter matching note:** Classification data has more stocks than fundamentals/technical (some stocks have no financial data). Matching is by name (uppercase, trimmed). Unmatched stocks pass through without filtering.

---

### 4. Profiles Tab

**Component:** `ProfilesWorkspaceTab.jsx` + `StockProfileEditorTab.jsx`

**Purpose:** View and edit rich profile data for any stock — ownership, brands, subsidiaries, products, keynotes, parent companies, etc.

**Flow:**

```
Mount
  └─ GET /api/stocks/active
       → { id, name, symbol }[] (or wrapped { data: [...] })
       → Populates searchable stock selector (sorted alphabetically)

User selects a stock
  └─ GET /api/profiles/{stock_id}
       → Loads profile into editor form
       → Fields: ownership_type, business_risk_level, business_group, information,
                 associated_brands[], location[], clients[], products[],
                 index_stock[], cutting_edge_products[], keynotes[],
                 parent_companies[] (numeric IDs), subsidiaries[] (numeric IDs)
       → parent_companies / subsidiaries IDs resolved to names using the stock directory

User edits fields
  → Dirty tracking per field (shows "Modified" tag)
  → Unsaved changes warning (beforeunload + Alert)
  → parent_companies / subsidiaries: searchable multi-select showing stock names, stores IDs

User clicks Save
  └─ PATCH /api/profiles/{stock_id}
       Body: only changed fields (diff against original)
       → On success: updates form state, clears dirty flags
       → On error: rolls back to previous state

User clicks Reset
  → Reverts all fields to last saved state

User clicks Close with unsaved changes
  → Confirmation modal: Discard / Keep Editing
```

**Field types:**
- String fields: `business_group`, `information`, `ownership_type`, `business_risk_level`
- String array (tags): `associated_brands`, `location`, `clients`, `products`, `index_stock`, `cutting_edge_products`, `keynotes`
- Integer array (stock IDs): `parent_companies`, `subsidiaries`
- `business_risk_level` options: `HIGH | MEDIUM | LOW`
- `ownership_type` options: `GOVT_CONTROLLED | JOINT_VENTURE | PRIVATE | PSU`

---

### 5. Stock Detail Tab

**Component:** `StockDetailTab.jsx`

**Purpose:** Read-only consolidated view of all available data for a single stock — classification metadata, profile, historical fundamentals, and live technical indicators — all loaded in parallel.

**Flow:**

```
Mount
  └─ GET /api/stocks/active
       → Populates searchable stock selector

User selects a stock (id = N)
  → Aborts any previous in-flight requests (shared AbortController)
  → Fires 4 parallel fetches:

  ├─ GET /api/stocks/{N}
  │    → ClassificationSection: company name, basic industry
  │    → MetricBadges: market_cap_category, revenue_size, tech_risk, fund_risk
  │
  ├─ GET /api/profiles/{N}
  │    → ProfileSection:
  │       - Text: ownership_type, business_risk_level, business_group, information
  │       - Tags: associated_brands, location, clients, products, keynotes
  │       - Tags: index_stock, cutting_edge_products
  │       - Resolved names: parent_companies, subsidiaries (IDs → names via stock directory)
  │
  ├─ GET /api/fundamentals/stock/{N}
  │    → FundamentalsSection: transposed table
  │       - Rows = metrics (35 metrics in 8 groups)
  │       - Columns = financial years (newest → oldest)
  │       - Groups: Income / Growth / Margins / Returns / Efficiency / Leverage / Liquidity / Cash Flow
  │       - Null values → "—"
  │
  └─ GET http://localhost:8004/screener/indicators/{N}
       → TechnicalSection: grouped Descriptions
          - Groups: Price / Moving Averages / Momentum / Trend / Volatility / Volume / Pivot
          - golden_cross_state → green/red tag
          - Boolean events → Yes/No tags
          - Shows: trade_date, computed_date, ohlcv date range

Each section has independent loading skeleton + error alert + retry button.
Selecting a new stock cancels all previous requests before firing new ones.
```

---

## Data Model Summary

### Stock (from `/api/stocks/active`)
```json
{ "id": 10, "name": "COMPANY NAME", "symbol": "SYM" }
```

### Classification Stock (from `/api/classification/stocks`)
```json
{
  "company_id": 2228,
  "company_name": "COMPANY NAME",
  "comments": "...",
  "market_cap_category": "MICRO_CAP",
  "tech_risk": "MEDIUM",
  "fund_risk": "LOW",
  "revenue_size": "SMALL"
}
```

### Stock Details (from `/api/stocks/{id}`)
```json
{
  "id": 10,
  "company_name": "...",
  "basic_industry_name": "...",
  "basic_ind_code": "...",
  "market_cap_category": "SMALL_CAP",
  "tech_risk": "MEDIUM",
  "fund_risk": "LOW",
  "revenue_size": "SMALL"
}
```

### Profile (from `/api/profiles/{id}`)
```json
{
  "stock_id": 10,
  "stock_name": "...",
  "ownership_type": "PRIVATE",
  "business_risk_level": "LOW",
  "business_group": "...",
  "information": "...",
  "associated_brands": [],
  "location": [],
  "clients": [],
  "products": [],
  "index_stock": [],
  "cutting_edge_products": [],
  "keynotes": [],
  "parent_companies": [5, 12],
  "subsidiaries": [33]
}
```

### Fundamentals (from `/api/fundamentals/stock/{id}`)
```json
{
  "stock_id": 1,
  "stock_name": "...",
  "count": 5,
  "rows": [
    {
      "financial_year": 2025,
      "financial_date": "2025-03-31",
      "total_revenue": 1054.5,
      "net_income": 176.3,
      "...": "35 metrics total"
    }
  ]
}
```

### Technical Indicators (from `screener/indicators/{id}`)
```json
{
  "ticker_id": 10,
  "trade_date": "2026-04-17",
  "computed_date": "2026-04-25",
  "last_close": "462.70",
  "high_52w": "501.55",
  "low_52w": "286.60",
  "rsi_14": "73.72",
  "macd_line": "33.35",
  "golden_cross_state": "below",
  "...": "40+ indicators total"
}
```

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

## Frontend Patterns

### Request Cancellation
Every data fetch uses `AbortController`. On component unmount or re-selection, `controller.abort()` is called. `CanceledError` is silently ignored in catch blocks.

### Parallel Loading
Stock Detail tab fires 4 fetches concurrently using independent `.then/.catch/.finally` chains (not `await` in sequence). Each section manages its own `loading / error / data` state independently.

### Optimistic Updates
Classification edit (`PUT /api/classification/stocks/{id}`) updates the table row immediately before the API responds, then does a background refresh to sync.

### Dirty Tracking (Profiles)
Each profile field is compared against the original loaded value. Changed fields show a "Modified" tag. Only changed fields are sent in the PATCH payload.

### Client-side Filtering (Classification table, Peers)
Filters operate on the already-loaded page of data. The classification `classMap` (name → metadata) is built once per industry selection and reused across both Fundamentals and Technical views in the Peers tab.
