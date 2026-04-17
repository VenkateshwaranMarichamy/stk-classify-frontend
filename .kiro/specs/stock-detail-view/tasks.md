# Implementation Plan: Stock Detail View

## Overview

Add a read-only "Stock Detail" tab to the StoxAtlas React frontend. The tab lets the user pick a stock from a searchable dropdown and then displays its classification, profile, and fundamentals data in three independent sections that load in parallel. Implementation proceeds in five incremental steps: service layer → test infrastructure → core component with stock selector → three data sections → tab registration.

## Tasks

- [x] 1. Extend the service layer with two new fetch functions
  - Open `src/services/classificationService.js`
  - Add the constant `STOCK_DETAILS_URL = "http://localhost:8000/api/stocks"`
  - Add the constant `FUNDAMENTALS_URL = "http://localhost:8000/api/fundamentals/stock"`
  - Export `async function fetchStockDetails(stockId, signal)` — calls `GET ${STOCK_DETAILS_URL}/${stockId}` via axios with `{ signal }` and returns `response.data`
  - Export `async function fetchStockFundamentals(stockId, signal)` — calls `GET ${FUNDAMENTALS_URL}/${stockId}` via axios with `{ signal }` and returns `response.data`
  - Do NOT modify or duplicate any existing function
  - _Requirements: 7.1, 7.2, 7.4_

- [ ] 2. Set up the test infrastructure
  - Install `vitest`, `@vitest/ui`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, and `fast-check` as dev dependencies (exact/pinned versions)
  - Add a `vitest.config.js` (or extend `vite.config.js`) with `environment: "jsdom"` and `setupFiles` pointing to a test setup file
  - Create `src/test/setup.js` that imports `@testing-library/jest-dom`
  - Add a `"test": "vitest --run"` script to `package.json`
  - _Requirements: (infrastructure for all test sub-tasks)_

- [x] 3. Build `StockDetailTab` with stock selector and parallel fetch orchestration
  - Create `src/components/StockDetailTab.jsx`
  - On mount, call `fetchAllStocks` with an `AbortController` signal; store results in `stocks`, `stocksLoading`, `stocksError` state
  - Render a `Select` (Ant Design, `showSearch`, `allowClear`) populated with stock options sorted alphabetically by name; label each option as `{name} ({symbol})` when symbol is non-empty, otherwise `{name}`; disable and show loading indicator while `stocksLoading` is true
  - When `stocksError` is set, render an `Alert` (type `error`) and a "Retry" `Button` above the selector; retry calls `fetchAllStocks` again
  - Hold `selectedStockId`, `abortControllerRef`, and per-section state (`classificationData/Loading/Error`, `profileData/Loading/Error`, `fundamentalsData/Loading/Error`)
  - When a stock is selected: abort the previous `AbortController`, create a new one, then fire `fetchStockDetails`, `fetchStockProfile`, and `fetchStockFundamentals` concurrently (not sequentially) using the new signal; update each section's loading/error/data state independently; ignore `CanceledError` silently
  - When the selector is cleared, reset all data state so no section is visible
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 6.1, 6.2, 7.3_

  - [ ]* 3.1 Write property test — selector sort order (Property 1)
    - File: `src/components/StockDetailTab.test.jsx`
    - Use `fc.array(fc.record({ id: fc.integer(), name: fc.string(), symbol: fc.string() }))` to generate stock arrays
    - Assert that the options produced for the selector are sorted in ascending alphabetical order by `name`
    - **Property 1: Stock selector options are sorted alphabetically**
    - **Validates: Requirements 2.3**
    - Tag: `// Feature: stock-detail-view, Property 1: Stock selector options are sorted alphabetically`

  - [ ]* 3.2 Write property test — selector label format (Property 2)
    - File: `src/components/StockDetailTab.test.jsx`
    - Use `fc.record({ name: fc.string(), symbol: fc.option(fc.string()) })` to generate stock objects
    - Assert label is `{name} ({symbol})` when symbol is a non-empty string, and `{name}` otherwise
    - **Property 2: Stock selector label format**
    - **Validates: Requirements 2.3**
    - Tag: `// Feature: stock-detail-view, Property 2: Stock selector label format`

  - [ ]* 3.3 Write unit tests for stock selector loading, error, and empty states
    - Mock `fetchAllStocks` to test: disabled + loading indicator while pending; error alert + retry button on rejection; options populated on success; empty state when selector cleared
    - _Requirements: 2.2, 2.4, 2.6_

- [x] 4. Implement `ClassificationSection`
  - Implement as an inline sub-component or a named function within `StockDetailTab.jsx`
  - Props: `data`, `loading`, `error`, `onRetry`
  - While `loading` is true, render an Ant Design `Skeleton`
  - On `error`, render an `Alert` (type `error`) with the error message and a "Retry" `Button` scoped to this section
  - On success, render an Ant Design `Descriptions` component with items: Company Name (`company_name`), Macro Sector (`macro_sector`), Sector (`sector`), Basic Industry Name (`basic_industry_name`), Basic Industry Code (`basic_industry_code`), Market Cap Category (`market_cap_category`)
  - Use optional chaining and `?? "—"` for every field so null/undefined renders as `—` and never as `null`, `undefined`, or empty string
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.1 Write property test — classification null fields render as placeholder (Property 3)
    - File: `src/components/StockDetailTab.test.jsx`
    - Use `fc.record({ company_name: ..., macro_sector: ..., sector: ..., basic_industry_name: ..., basic_industry_code: ..., market_cap_category: ... }, { requiredKeys: [] })` with random null fields
    - Assert that for every null/undefined field the rendered output contains `—` and does NOT contain `null`, `undefined`, or an empty string in its place
    - **Property 3: Classification null fields render as placeholder**
    - **Validates: Requirements 3.5**
    - Tag: `// Feature: stock-detail-view, Property 3: Classification null fields render as placeholder`

  - [ ]* 4.2 Write property test — classification section displays all required fields (Property 4)
    - File: `src/components/StockDetailTab.test.jsx`
    - Use `fc.record({ basic_industry_name: fc.string(), sector: fc.string(), macro_sector: fc.string() })` with all fields present
    - Assert that the rendered output contains the `basic_industry_name`, `sector`, and `macro_sector` values from the generated object
    - **Property 4: Classification section displays all required fields**
    - **Validates: Requirements 3.2**
    - Tag: `// Feature: stock-detail-view, Property 4: Classification section displays all required fields`

- [x] 5. Implement `ProfileSection`
  - Implement as an inline sub-component or a named function within `StockDetailTab.jsx`
  - Props: `data`, `loading`, `error`, `onRetry`, `stockDirectory`
  - While `loading` is true, render a `Skeleton`
  - On `error`, render an `Alert` (type `error`) with a "Retry" `Button` scoped to this section
  - On success, render:
    - Text fields (`ownership_type`, `risk_level`, `business_group`, `information`) as `Descriptions` items; null/absent → `"—"`
    - Array fields (`associated_brands`, `location`, `clients`, `products`, `keynotes`) as lists of Ant Design `Tag` components; empty array or null → `"—"`
    - ID arrays (`parent_companies`, `subsidiaries`): resolve each numeric ID to a stock name by looking it up in `stockDirectory`; render resolved names as `Tag` components; empty array or null → `"—"`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 5.1 Write property test — profile section displays all required fields (Property 5)
    - File: `src/components/StockDetailTab.test.jsx`
    - Use `fc.record({ ownership_type: fc.string(), risk_level: fc.string(), business_group: fc.string(), information: fc.string(), associated_brands: fc.array(fc.string()), location: fc.array(fc.string()), clients: fc.array(fc.string()), products: fc.array(fc.string()), keynotes: fc.array(fc.string()), parent_companies: fc.array(fc.integer({ min: 1 })), subsidiaries: fc.array(fc.integer({ min: 1 })) })`
    - Assert that the rendered output contains representations of all 11 fields
    - **Property 5: Profile section displays all required fields**
    - **Validates: Requirements 4.2**
    - Tag: `// Feature: stock-detail-view, Property 5: Profile section displays all required fields`

  - [ ]* 5.2 Write property test — profile null and empty-array fields render as placeholder (Property 6)
    - File: `src/components/StockDetailTab.test.jsx`
    - Generate profile records where random subsets of fields are set to `null` or `[]`
    - Assert that each such field renders as `—` in the output
    - **Property 6: Profile null and empty-array fields render as placeholder**
    - **Validates: Requirements 4.5**
    - Tag: `// Feature: stock-detail-view, Property 6: Profile null and empty-array fields render as placeholder`

  - [ ]* 5.3 Write property test — parent company and subsidiary IDs resolve to names (Property 7)
    - File: `src/components/StockDetailTab.test.jsx`
    - Use `fc.array(fc.record({ id: fc.integer({ min: 1 }), name: fc.string() }))` for the stock directory; pick random subsets of those IDs for `parent_companies` and `subsidiaries`
    - Assert that the rendered output shows the corresponding stock names, not the raw numeric IDs
    - **Property 7: Parent company and subsidiary IDs resolve to names**
    - **Validates: Requirements 4.6**
    - Tag: `// Feature: stock-detail-view, Property 7: Parent company and subsidiary IDs resolve to names`

- [x] 6. Implement `FundamentalsSection`
  - Implement as an inline sub-component or a named function within `StockDetailTab.jsx`
  - Props: `data`, `loading`, `error`, `onRetry`
  - While `loading` is true, render a `Skeleton`
  - On `error`, render an `Alert` (type `error`) with a "Retry" `Button` scoped to this section
  - When `data` is present but `data.count === 0` or `data.rows` is empty, render an Ant Design `Empty` component with a descriptive message
  - On success with rows, build a transposed Ant Design `Table`:
    - Derive year columns from `data.rows` sorted newest → oldest (left → right); add a fixed "Metric" column as the first column
    - Define the 35 metric rows grouped into 8 labelled sub-groups (Income, Growth, Margins, Returns, Efficiency, Leverage, Liquidity, Cash Flow) as specified in the design's Metric Groups table
    - Each cell renders the metric value for that year; null/undefined → `"—"`
    - Use `rowKey` on the metric key to avoid React key warnings
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 6.1 Write property test — fundamentals table structure (Property 8)
    - File: `src/components/StockDetailTab.test.jsx`
    - Use `fc.array(fc.record({ financial_year: fc.integer({ min: 2000, max: 2030 }) }), { minLength: 1, maxLength: 10 })` to generate rows with N distinct years
    - Assert that the table has exactly N year-columns plus the fixed metric column, each metric appears as exactly one row, and year columns are ordered newest → oldest
    - **Property 8: Fundamentals table structure — years as columns, metrics as rows**
    - **Validates: Requirements 5.2**
    - Tag: `// Feature: stock-detail-view, Property 8: Fundamentals table structure — years as columns, metrics as rows`

  - [ ]* 6.2 Write property test — fundamentals null metric values render as placeholder (Property 9)
    - File: `src/components/StockDetailTab.test.jsx`
    - Generate fundamentals rows where random metric fields are `null` or `undefined`
    - Assert that each such cell renders `—` and does NOT render `null`, `undefined`, or an empty string
    - **Property 9: Fundamentals null metric values render as placeholder**
    - **Validates: Requirements 5.5**
    - Tag: `// Feature: stock-detail-view, Property 9: Fundamentals null metric values render as placeholder`

  - [ ]* 6.3 Write unit tests for fundamentals loading, error, and empty states
    - Test: skeleton shown while loading; error alert + retry button on failure; `Empty` component shown when `count === 0`
    - _Requirements: 5.3, 5.4, 5.6_

- [ ] 7. Checkpoint — wire sections into `StockDetailTab` and verify integration
  - Ensure `ClassificationSection`, `ProfileSection`, and `FundamentalsSection` are rendered inside `StockDetailTab` and receive the correct props from the parent state
  - Pass `stocks` (the loaded stock directory) as `stockDirectory` to `ProfileSection` so ID resolution works
  - Confirm that selecting a stock triggers all three fetches concurrently and each section independently shows its loading/error/data state
  - Confirm that selecting a new stock while requests are in flight calls `abort()` on the previous controller
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 6.1, 6.2_

- [x] 8. Register `StockDetailTab` as the 4th tab in `App.jsx`
  - Import `StockDetailTab` from `./components/StockDetailTab`
  - Add a fourth entry to the `tabItems` array: `{ key: "stock-detail", label: "Stock Detail", children: <StockDetailTab /> }`
  - The new tab must be the 4th item (after Classify, Peers, Profiles)
  - `StockDetailTab` holds its own state; it does not share state with the other three tabs
  - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 8.1 Write unit test — tab registration
    - Assert that `App` renders a tab labelled "Stock Detail" at index 3
    - _Requirements: 1.1_

- [ ] 9. Final checkpoint — ensure all tests pass
  - Run `npm test` (vitest --run) and confirm all tests pass with no failures
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with a minimum of 100 iterations per property
- Unit tests use Vitest + React Testing Library
- The service layer (task 1) must be complete before any component work begins
- Test infrastructure (task 2) must be in place before any `*` sub-tasks are attempted
- All three data sections are independent — a failure in one must not affect the others
