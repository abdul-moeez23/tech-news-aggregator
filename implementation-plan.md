# Implementation Plan

## Overview
This document outlines the step-by-step technical execution plan for the Tech News Aggregator. It follows a standard software development methodology where work is broken down into **Phases** (major milestones), **Steps** (specific deliverables), and **Tasks** (actionable developer items).

---

## Phase 1: Core System & Preferences Setup
*Goal: Establish the foundation of the React frontend and Django backend, and allow users to configure their preferences.*

### Step 1.1: Backend Initialization (Django)
- [x] Initialize Git repository.
- [x] Setup Python virtual environment and install Django, Django REST Framework, and PostgreSQL driver.
- [x] Create Django project and core apps (`users`, `preferences`, `feed`).
- [x] Configure database settings and run initial migrations.

### Step 1.2: Frontend Initialization (React)
- [x] Initialize React application using Vite or Create React App.
- [x] Setup routing (React Router) and state management (Redux or Context API).
- [x] Setup Tailwind CSS or Material-UI for styling.
- [x] Configure Axios/Fetch to communicate with the Django backend.

### Step 1.3: User Preferences API & Models
- [x] **Django:** Create `UserProfile`, `Category`, and `Source` database models.
- [x] **Django:** Build REST endpoints (GET, POST, PUT) for managing user categories, custom freshness settings, and enabled sources.
- [x] **React:** Build the "Settings/Preferences" UI panel allowing users to select topics (AI, ML, etc.) and save them to the backend.

---

## Phase 2: Content Discovery & Ingestion
*Goal: Build the engine that automatically fetches and categorizes news from external sources.*

### Step 2.1: Source Manager Configuration
- [x] Seed the database with default trusted sources (e.g., TechCrunch RSS, Dev.to API).
- [x] **React:** Build the UI for users to add, edit, or disable custom RSS feeds and APIs.

### Step 2.2: Data Fetching Workers
- [x] Setup Celery and Redis (or Django Q) for background task processing.
- [x] Write a fetcher script that parses RSS XML feeds and JSON APIs.
- [x] Create a scheduled cron job to run the fetcher every X hours for enabled sources.

### Step 2.3: Relevance & Filtering Logic
- [x] **Source-Level:** Implement logic to append query parameters to API requests if the source supports category filtering.
- [x] **App-Level:** Write a text-parsing utility to check if fetched article titles/summaries match the user's selected technology categories.

---

## Phase 3: Storage Optimization & Feed Delivery
*Goal: Store minimal data and deliver the personalized feed to the user's dashboard.*

### Step 3.1: Metadata Storage
- [x] **Django:** Create the `ArticleMetadata` model (Title, URL, Source, Publication Date, Category, Hash, Summary).
- [x] Ensure the fetcher worker saves valid, filtered items into this database table.

### Step 3.2: Feed API & UI
- [x] **Django:** Create a `/api/feed/` endpoint that retrieves articles.
- [x] **Django:** Implement Freshness Filtering logic (e.g., exclude articles older than the user's "3 days" setting) in the database query.
- [x] **React:** Build the main Dashboard UI to fetch and display the feed as a list of cards with links to the original articles.

### Step 3.3: Automated Cleanup
- [x] Write a background job to delete `ArticleMetadata` rows that exceed the maximum system retention period (e.g., older than 30 days).
- [x] Schedule this cleanup task to run nightly.

---

## Phase 4 (Optional / Lowest Priority): Data Deduplication
*Goal: Prevent the same news story from appearing multiple times from different sources.*

### Step 4.1: Duplicate Detection Engine
- [x] Write logic to generate a unique hash for articles based on URL normalization.
- [x] Implement string similarity algorithms (like Levenshtein distance) to compare new article titles against recently saved articles.

### Step 4.2: Data Consolidation
- [x] Update the `ArticleMetadata` model to support multiple source links for a single story.
- [x] Modify the fetcher worker to append the source to an existing database row if a duplicate is detected, rather than creating a new row.

### Step 4.3: UI Updates
- [x] **React:** Update the feed item card to display "Also reported by: Source B, Source C" when multiple sources are consolidated.

## Phase 5: Advanced Synchronization & Fetching Enhancements
*Goal: Implement user-specific synchronization schedules, manual sync, and robust missed-content recovery.*

### Step 5.1: Advanced User Preferences Models
- [x] **Django:** Update `UserProfile` model to include `auto_fetch` (boolean, default True), `fetch_frequency` (integer choices for 15m, 30m, 1h, 6h, 12h, 24h).
- [x] **Django:** Add a `UserSourceSync` model (or update `UserProfile`) to track `last_successful_sync` timestamp per user (or per user-source combination).
- [x] **Django:** Update the Preferences REST API to expose these new fields.
- [x] **React:** Update the Settings UI to allow users to toggle "Auto Fetch" and select their preferred "Fetch Frequency".

### Step 5.2: User-Centric Background Fetching
- [x] **Django/Celery:** Refactor the fetcher worker (`fetch_latest_news`) from a global polling mechanism to a user-centric schedule. The job should evaluate each user's `auto_fetch` setting and `fetch_frequency` to determine if a sync is due.
- [x] **Django:** Ensure the system updates the `last_successful_sync` timestamp for the user only after a successful fetch operation completes.

### Step 5.3: Manual "Sync Now" & Missed Synchronization Recovery
- [x] **Django:** Create a new API endpoint `/api/feed/sync-now/` to allow users to manually trigger a fetch process immediately.
- [x] **Django:** Implement incremental sync logic. When running (automatically or manually), the fetcher should retrieve content published *after* the `last_successful_sync` timestamp to recover any missed articles during extended offline periods.
- [x] **React:** Add a "Sync Now" button to the UI that triggers this API and provides visual feedback (loading state, success notification).

### Step 5.4: Display Freshness vs. Fetch Separation
- [x] **Django:** Update `ArticleMetadata` to include `first_detected_timestamp` and `last_updated_timestamp` for better auditing.
- [x] **Django/React:** Ensure that the "Freshness Period" preference (e.g., "Last 3 days") is strictly applied as a UI/Feed API filter for displaying content, not as a boundary for fetching missed sync data. This guarantees that recently fetched (but missed) data is stored, while the feed only shows content conforming to the freshness rule.

---

## Phase 6: Onboarding Flow Integration
*Goal: Ensure user selections during signup onboarding are persisted to the database and automatically reflect on the Settings page.*

### Step 6.1: Database Synchronization
- [x] **Django:** Update `seed_sources.py` to include the full list of 14 topics (Programming, Web3, etc.) and all 8 sources (Hacker News, MIT Tech Review, etc.) shown on the onboarding pages.
- [x] **Django:** Run the seed script to populate the backend database so the Settings page can display them.

### Step 6.2: Persist User Selections
- [x] **React:** Update `OnboardingTopics.jsx` to make an API call (`PATCH /api/preferences/`) to save the user's selected topics before navigating to the next page.
- [x] **React:** Update `OnboardingSources.jsx` to make an API call (`PATCH /api/preferences/`) to save the user's selected sources before navigating to the dashboard.
## Phase 7: Bug Fixes & Enhancements
*Goal: Fix categorization logic and feed filtering.*

### Step 7.1: Improve Article Categorization
- [x] **Django:** Update ackend/feed/utils/filtering.py to use comprehensive keyword mapping for better categorization of articles.

### Step 7.2: Strict Feed Filtering
- [x] **Django:** Update ackend/feed/views.py to remove the isnull check, ensuring the feed only returns articles that match the user's selected Topics of Interest.

## Phase 8: Performance Optimization for Large Datasets
*Goal: Prevent UI freezing and long load times when fetching large amounts of feed data by implementing pagination and skeleton loaders.*

### Step 8.1: Backend Pagination
- [x] **Django:** Configure Django REST Framework to use PageNumberPagination globally or specifically for the /api/feed/ endpoint (e.g., PAGE_SIZE = 20).
- [x] **Django:** Ensure the API response correctly returns paginated data, including 
ext and previous page URLs.

### Step 8.2: Frontend Infinite Scrolling & State Management
- [x] **React:** Update Redux eedSlice.js to handle paginated API responses. It should append new articles to the existing state array rather than completely overwriting it.
- [x] **React:** Implement an Intersection Observer or scroll event listener in Dashboard.jsx to trigger fetching the next page of results when the user scrolls near the bottom of the feed.

### Step 8.3: UI Skeleton Loaders
- [x] **React:** Create a new SkeletonCard UI component that visually mimics the shape of the news cards.
- [x] **React:** Replace the simple text-based loader (Loading your feed...) with a grid of these skeleton loaders to drastically improve the perceived loading speed and user experience.

## Phase 9: Advanced Personalization & Relevance Scoring
*Goal: Expand user interest taxonomy, implement user-specific feed personalization, and transition from strict category matching to dynamic relevance scoring.*

### Step 9.1: Expand Interest Taxonomy (Main & Sub-Interests)
- [x] **Django:** Update the `Category` architecture to support a hierarchical structure (Main Interests and Sub-Interests).
- [x] **Django:** Update the seed data to establish the master list of main interests (e.g., AI, Cloud Computing, Software Engineering) and their sub-interests (e.g., Generative AI, AWS, Frontend).
- [x] **React:** Refactor the Settings and Onboarding UI so users can select multiple main interests and their specific sub-interests.

### Step 9.2: User-Specific Feed Personalization
- [x] **Django:** Ensure the feed generation completely relies on the currently logged-in user's profile preferences rather than any global or hardcoded lists.
- [x] **Django:** Update the feed API to prepare the user's expanded preference profile for scoring.

### Step 9.3: Relevance Scoring Logic (Replacing Strict Filtering)
- [x] **Django:** Transition the feed logic from strict `AND`/intersection matching to a relevance scoring system.
- [x] **Django:** Implement an algorithm to score articles based on user interests. (e.g., An article matching both a main interest and a sub-interest gets ranked higher, rather than filtering out an article that only matches some).
- [x] **Django:** Sort the returned feed primarily by this calculated relevance score (balanced with publication date/freshness).

### Step 9.4: Muted Topics Feature
- [x] **Django:** Add a `muted_topics` field to the `UserProfile` or Preferences model.
- [x] **Django:** Update the scoring algorithm so that articles containing muted topics receive a strong negative penalty or are completely excluded.
- [x] **React:** Add a "Muted Topics" input section in the user Preferences/Settings UI.

## Phase 10: Authentication Email Flows (Resend Integration)
*Goal: Integrate Resend to send verification emails during user signup and handle password reset flows for both local and production environments.*

### Step 10.1: Resend Configuration & Setup
- [ ] **Backend:** Add `resend` python package to `requirements.txt`.
- [ ] **Backend:** Configure `RESEND_API_KEY` and `FROM_EMAIL` in Django settings. Ensure support for both local development (e.g. `onboarding@resend.dev`) and production domains.
- [ ] **Backend:** Create a reusable email utility function in a new or existing module to send emails via the Resend API.

### Step 10.2: Email Verification (Signup)
- [ ] **Backend:** Update the User/Profile model to track if the email is verified (e.g., `is_email_verified = models.BooleanField(default=False)`).
- [ ] **Backend:** Modify `RegisterView` to generate a secure email verification token upon signup.
- [ ] **Backend:** Trigger the Resend email utility to send a "Verify Your Email" link pointing to the React frontend (using `FRONTEND_URL` from `.env`).
- [ ] **Backend:** Create a new API endpoint `/api/users/verify-email/` that accepts the token, validates it, and updates `is_email_verified` to `True`.
- [ ] **React:** Build a `/verify-email` route/component that extracts the token from the URL, calls the backend verification endpoint, and displays a success or error message.

### Step 10.3: Forgot & Reset Password
- [ ] **Backend:** Create an API endpoint `/api/users/forgot-password/` that accepts an email, generates a secure password reset token, and sends a "Reset Password" link via Resend.
- [ ] **Backend:** Create an API endpoint `/api/users/reset-password/` that accepts the reset token and a new password, and securely updates the user's password.
- [ ] **React:** Build a `/forgot-password` page with a form to request a password reset link.
- [ ] **React:** Build a `/reset-password` page that extracts the token from the URL, allows the user to input a new password, and submits it to the backend.
