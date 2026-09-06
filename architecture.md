# System Architecture

## 1. High-Level Architecture
The Tech News Aggregator is composed of a Django-based backend for data fetching, API services, and processing, a database for metadata storage, and a React frontend client for user interaction.

### 1.1 Components

#### 1. Frontend (React)
- **User Settings Panel:** UI for selecting technology categories, custom freshness periods, and managing custom sources.
- **Feed Dashboard:** Displays the filtered list of tech news/articles with titles, short summaries, and links to the original sources.

#### 2. Backend API (Django / Django REST Framework)
- **User Preferences Service:** Manages CRUD operations for user categories, source lists, and freshness settings.
- **Feed API:** Retrieves processed items from the database based on user's selected filters and serves them to the frontend.

#### 3. Data Ingestion Service (Background Workers)
- **Source Poller / Fetcher:** Periodically pulls data from enabled sources (RSS feeds, APIs).
- **Source-Level Filter:** Applies category filters at the API/RSS level if supported by the external source to save bandwidth.

#### 4. Processing Pipeline
- **App-Level Relevance Filter:** Processes raw content fetched by the Ingestion Service to ensure it matches user categories (if source-level filtering wasn't possible).
- **Freshness Filter:** Discards items outside the user-configured retention period.
- **Optional Deduplication Engine (Phase 4):** Checks for duplicate or similar content using URL, title, or content hash. Consolidates duplicated entries.

#### 5. Database & Storage
- **Metadata Store:** Stores essential item metadata (title, URL, source, publication date, category, short summary).
- **Cleanup Job:** A recurring background task that purges records older than the maximum system retention period to optimize database storage.
