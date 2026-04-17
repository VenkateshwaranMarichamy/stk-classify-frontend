# Requirements Document

## Introduction

The Stock Detail View is a new "Stock Detail" tab in the StoxAtlas React frontend. It consolidates all available information about a single selected stock into one unified view: classification details (sector, macro sector, basic industry), profile data (ownership, brands, subsidiaries, business group, etc.), and fundamentals (income and financial metrics over time). The tab is read-only — it is a viewer, not an editor. It is added as the 4th tab in App.jsx alongside Classify, Peers, and Profiles.

---

## Glossary

- **StockDetailTab**: The new React component rendered as the 4th tab in the application.
- **StockSelector**: The searchable dropdown control used to pick a stock from the directory.
- **StockDirectory**: The list of all stocks returned by `GET http://127.0.0.1:8001/stocks/all`.
- **ClassificationSection**: The portion of the detail view that displays sector, macro sector, and basic industry data from `GET http://localhost:8000/api/stocks/{id}`.
- **ProfileSection**: The portion of the detail view that displays ownership, brands, subsidiaries, and other profile fields from `GET http://localhost:8000/api/profiles/{id}`.
- **FundamentalsSection**: The portion of the detail view that displays income and financial metrics over years from `GET http://localhost:8000/api/fundamentals/stock/{id}`.
- **Stock**: An entity with a numeric `id`, a `name`, and an optional `symbol`.
- **classificationService**: The existing `src/services/classificationService.js` module that manages all API calls.

---

## Requirements

### Requirement 1: Tab Registration

**User Story:** As a user, I want a "Stock Detail" tab in the main navigation, so that I can access consolidated stock information without leaving the application.

#### Acceptance Criteria

1. THE StoxAtlas application SHALL render a tab labelled "Stock Detail" as the 4th tab in the main `Tabs` component in `App.jsx`.
2. WHEN the user clicks the "Stock Detail" tab, THE StoxAtlas application SHALL display the StockDetailTab component.
3. THE StockDetailTab SHALL be independent of the Classify, Peers, and Profiles tabs — selecting a stock in StockDetailTab SHALL NOT affect the state of other tabs.

---

### Requirement 2: Stock Selection

**User Story:** As a user, I want to search for and select a stock from a dropdown, so that I can view its details.

#### Acceptance Criteria

1. THE StockDetailTab SHALL display a StockSelector that loads the full stock list from the StockDirectory on mount.
2. WHEN the StockDirectory request is in progress, THE StockSelector SHALL display a loading indicator and be disabled.
3. WHEN the StockDirectory request succeeds, THE StockSelector SHALL populate with all stocks sorted alphabetically by name, each labelled as `{name} ({symbol})` when a symbol is present, or `{name}` when no symbol is present.
4. IF the StockDirectory request fails, THEN THE StockDetailTab SHALL display an error message and a retry button that re-fetches the stock list.
5. WHEN the user selects a stock, THE StockDetailTab SHALL begin loading that stock's classification, profile, and fundamentals data in parallel.
6. WHEN the user clears the StockSelector, THE StockDetailTab SHALL return to an empty state with no data sections visible.

---

### Requirement 3: Classification Section

**User Story:** As a user, I want to see a stock's sector, macro sector, and basic industry classification, so that I can understand where it sits in the market hierarchy.

#### Acceptance Criteria

1. WHEN a stock is selected, THE ClassificationSection SHALL fetch data from `GET http://localhost:8000/api/stocks/{id}` using the selected stock's numeric id.
2. WHEN the ClassificationSection data loads successfully, THE ClassificationSection SHALL display the stock's basic industry name, sector name, and macro sector name.
3. WHILE the ClassificationSection data is loading, THE ClassificationSection SHALL display a loading skeleton or spinner.
4. IF the ClassificationSection request fails, THEN THE ClassificationSection SHALL display an inline error message with a retry button scoped to that section.
5. WHERE a classification field value is absent or null, THE ClassificationSection SHALL display a "—" placeholder for that field.

---

### Requirement 4: Profile Section

**User Story:** As a user, I want to see a stock's profile data in one place, so that I can review ownership, brands, subsidiaries, and other business details without opening the Profiles editor.

#### Acceptance Criteria

1. WHEN a stock is selected, THE ProfileSection SHALL fetch data from `GET http://localhost:8000/api/profiles/{id}` using the selected stock's numeric id.
2. WHEN the ProfileSection data loads successfully, THE ProfileSection SHALL display: ownership type, risk level, business group, information, associated brands, locations, clients, products, keynotes, parent companies, and subsidiaries.
3. WHILE the ProfileSection data is loading, THE ProfileSection SHALL display a loading skeleton or spinner.
4. IF the ProfileSection request fails, THEN THE ProfileSection SHALL display an inline error message with a retry button scoped to that section.
5. WHERE a profile field value is an empty array or null, THE ProfileSection SHALL display a "—" placeholder for that field.
6. WHERE parent companies or subsidiaries are stored as numeric IDs, THE ProfileSection SHALL resolve and display the corresponding stock names using the StockDirectory data already loaded in Requirement 2.

---

### Requirement 5: Fundamentals Section

**User Story:** As a user, I want to see a stock's income and financial metrics over time, so that I can assess its financial performance at a glance.

#### Acceptance Criteria

1. WHEN a stock is selected, THE FundamentalsSection SHALL fetch data from `GET http://localhost:8000/api/fundamentals/stock/{id}` using the selected stock's numeric id.
2. WHEN the FundamentalsSection data loads successfully, THE FundamentalsSection SHALL display the financial metrics in a table with years as columns and metric names as rows.
3. WHILE the FundamentalsSection data is loading, THE FundamentalsSection SHALL display a loading skeleton or spinner.
4. IF the FundamentalsSection request fails, THEN THE FundamentalsSection SHALL display an inline error message with a retry button scoped to that section.
5. WHERE a fundamentals metric value is absent or null, THE FundamentalsSection SHALL display a "—" placeholder for that cell.
6. IF the FundamentalsSection returns an empty dataset for a selected stock, THEN THE FundamentalsSection SHALL display an empty-state message indicating no fundamentals data is available.

---

### Requirement 6: Parallel Data Loading

**User Story:** As a user, I want all three data sections to load simultaneously after I select a stock, so that I do not wait for one section to finish before another begins.

#### Acceptance Criteria

1. WHEN a stock is selected, THE StockDetailTab SHALL initiate the ClassificationSection, ProfileSection, and FundamentalsSection API requests concurrently, not sequentially.
2. WHEN a new stock is selected while a previous stock's requests are still in flight, THE StockDetailTab SHALL cancel the in-flight requests for the previous stock before initiating new requests.

---

### Requirement 7: Service Layer Extension

**User Story:** As a developer, I want all new API calls to go through `classificationService.js`, so that the data-fetching layer remains consistent with the rest of the application.

#### Acceptance Criteria

1. THE classificationService SHALL expose a `fetchStockDetails(stockId, signal)` function that calls `GET http://localhost:8000/api/stocks/{id}`.
2. THE classificationService SHALL expose a `fetchStockFundamentals(stockId, signal)` function that calls `GET http://localhost:8000/api/fundamentals/stock/{id}`.
3. THE StockDetailTab SHALL use `fetchStockProfile` (already present), `fetchStockDetails`, and `fetchStockFundamentals` from classificationService for all data fetching.
4. THE classificationService SHALL NOT duplicate the existing `fetchAllStocks` or `fetchStockProfile` functions — the StockDetailTab SHALL reuse them.
