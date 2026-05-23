# StoxAtlas — Architecture Reference (Steering)

> Full developer guide is in `README.md`. This file is the quick-reference for Kiro.

## Service Layer — All API Functions

| Function | Method | Endpoint |
|---|---|---|
| `fetchClassificationData` | GET | `/api/classification/dropdown-data` |
| `fetchStocksByBasicCode` | GET | `/api/classification/stocks?basic_ind_code=` |
| `fetchBasicIndustries` | GET | `/api/classification/basic-industries?limit=200` |
| `updateStockClassification` | PUT | `/api/classification/stocks/{id}` |
| `fetchPeerYears` | GET | `/api/fundamentals/peer-years?basic_ind_code=` — returns `{ years: [{financial_year, period_type}], default_year, default_period_type }` |
| `fetchPeerFundamentals` | GET | `/api/fundamentals/peers` — requires `financial_year` + `period_type` params |
| `fetchStockProfile` | GET | `/api/profiles/{id}` |
| `patchStockProfile` | PATCH | `/api/profiles/{id}` |
| `fetchAllStocks` | GET | `/api/stocks/active` |
| `fetchStockDetails` | GET | `/api/stocks/{id}` |
| `fetchStockFundamentals` | GET | `/api/fundamentals/stock/{id}` |
| `fetchUnclassifiedStocks` | GET | `/api/stocks/unclassified` |
| `classifyStock` | POST | `/api/stocks/{id}/classify` |
| `fetchTechnicalIndicators` | GET | `http://localhost:8004/screener/indicators/{id}` |
| `fetchIndustryTechnicalIndicators` | GET | `http://localhost:8004/screener/industry/{code}/indicators` |
| `fetchPeerValuation` | GET | `/api/fundamentals/valuation/peers` |
| `fetchValuationYears` | GET | `/api/fundamentals/valuation/years?basic_ind_code=` |

## Tab Summary

### Classification tab (dropdown: Classified / Unclassified)
- **Classified** (`ClassificationFilters.jsx`): cascading dropdowns → search → `StocksTable` with client-side filters → `EditStockModal` (PUT)
- **Unclassified** (`UnclassifiedStocksTab.jsx`): queue of unclassified stocks → classify modal (POST)

### Peers tab (`PeerFundamentals.jsx`) — 3 views via Segmented toggle
- **Fundamentals**: period selector (year + period_type) + server-side paginated table. Period options: `"2026 — TTM"`, `"2026"`, `"2025"` etc. — composite key `"year|period_type"` used internally. Also fetches valuation default year data once → merges Price/Trailing PE/Div Yield/Mkt Cap columns by `Number(stock_id)`. Valuation data stays fixed when period changes.
  - API: `GET /api/fundamentals/peers?...&financial_year=2026&period_type=ttm&...`
- **Valuation**: year selector + server-side paginated table. 26 columns with column picker.
- **Technical**: `screener/industry/{code}/indicators` — server-side paginated. Column picker grouped by category.
- All 3 views share a classification filter bar (Market Cap/Revenue Size/Tech Risk/Fund Risk) built from `classMap` keyed by `COMPANY_NAME_UPPERCASE`.

### Profiles tab (`ProfilesWorkspaceTab` + `StockProfileEditorTab`)
- Stock picker from `/api/stocks/active`
- Profile editor with dirty tracking per field — PATCH sends only changed fields
- `business_risk_level` (not `risk_level`) — options: HIGH/MEDIUM/LOW
- `parent_companies` / `subsidiaries` stored as `number[]` (stock IDs), displayed as names

### Stock Detail tab (`StockDetailTab.jsx`)
- Stock picker from `/api/stocks/active`
- 4 parallel fetches on selection: `/api/stocks/{id}` + `/api/profiles/{id}` + `/api/fundamentals/stock/{id}` + `screener/indicators/{id}`
- Each section independent: loading skeleton / error / retry
- Shared AbortController — cancelled on re-selection

## Key Enums

| Field | Values |
|---|---|
| `market_cap_category` | MEGA_CAP, LARGE_CAP, MID_CAP, SMALL_CAP, MICRO_CAP |
| `tech_risk` / `fund_risk` / `business_risk_level` | HIGH, MEDIUM, LOW |
| `revenue_size` | LARGE, MEDIUM, SMALL, MICRO |
| `ownership_type` | GOVT_CONTROLLED, JOINT_VENTURE, PRIVATE, PSU |
| `golden_cross_state` | above, below |

## Critical Implementation Notes

1. **Valuation join in Fundamentals view**: `valMap.get(Number(row.stock_id))` — both sides coerced to Number to avoid string/number mismatch
2. **Valuation fetch**: no `page`/`page_size` params — backend returns all stocks for the industry
3. **Fundamentals period selector**: `selectedPeriod: { financial_year, period_type }` — composite key `"year|period_type"` used as Select value. Options: `"2026 — TTM"`, `"2026"`, `"2025"` etc. Both `financial_year` and `period_type` sent to `/api/fundamentals/peers`.
4. **Stock directory normalization**: handles both plain array `[...]` and wrapped `{ data: [...] }` response shapes; maps `symbol` or `trading_symbol`
5. **Profile field name**: `business_risk_level` (renamed from `risk_level` in backend)
6. **Profile response**: uses `stock_id` (not `id`) as the identifier field
7. **classMap key**: uppercase trimmed company name — fundamentals uses `stock_name`, technical uses `name`, valuation uses `stock`
