# Implementation Plan

## Overview
This document outlines the step-by-step technical execution plan for the Tech News Aggregator. It follows a standard software development methodology where work is broken down into **Phases** (major milestones), **Steps** (specific deliverables), and **Tasks** (actionable developer items).

---

## Phase 1: Core System & Preferences Setup
*Goal: Establish the foundation of the React frontend and Django backend, and allow users to configure their preferences.*

### Step 1.1: Backend Initialization (Django)
- [ ] Initialize Git repository.
- [ ] Setup Python virtual environment and install Django, Django REST Framework, and PostgreSQL driver.
- [ ] Create Django project and core apps (`users`, `preferences`, `feed`).
- [ ] Configure database settings and run initial migrations.

### Step 1.2: Frontend Initialization (React)
- [ ] Initialize React application using Vite or Create React App.
- [ ] Setup routing (React Router) and state management (Redux or Context API).
- [ ] Setup Tailwind CSS or Material-UI for styling.
- [ ] Configure Axios/Fetch to communicate with the Django backend.

### Step 1.3: User Preferences API & Models
- [ ] **Django:** Create `UserProfile`, `Category`, and `Source` database models.
- [ ] **Django:** Build REST endpoints (GET, POST, PUT) for managing user categories, custom freshness settings, and enabled sources.
- [ ] **React:** Build the "Settings/Preferences" UI panel allowing users to select topics (AI, ML, etc.) and save them to the backend.

---

## Phase 2: Content Discovery & Ingestion
*Goal: Build the engine that automatically fetches and categorizes news from external sources.*

### Step 2.1: Source Manager Configuration
- [ ] Seed the database with default trusted sources (e.g., TechCrunch RSS, Dev.to API).
- [ ] **React:** Build the UI for users to add, edit, or disable custom RSS feeds and APIs.

### Step 2.2: Data Fetching Workers
- [ ] Setup Celery and Redis (or Django Q) for background task processing.
- [ ] Write a fetcher script that parses RSS XML feeds and JSON APIs.
- [ ] Create a scheduled cron job to run the fetcher every X hours for enabled sources.

### Step 2.3: Relevance & Filtering Logic
- [ ] **Source-Level:** Implement logic to append query parameters to API requests if the source supports category filtering.
- [ ] **App-Level:** Write a text-parsing utility to check if fetched article titles/summaries match the user's selected technology categories.

---

## Phase 3: Storage Optimization & Feed Delivery
*Goal: Store minimal data and deliver the personalized feed to the user's dashboard.*

### Step 3.1: Metadata Storage
- [ ] **Django:** Create the `ArticleMetadata` model (Title, URL, Source, Publication Date, Category, Hash, Summary).
- [ ] Ensure the fetcher worker saves valid, filtered items into this database table.

### Step 3.2: Feed API & UI
- [ ] **Django:** Create a `/api/feed/` endpoint that retrieves articles.
- [ ] **Django:** Implement Freshness Filtering logic (e.g., exclude articles older than the user's "3 days" setting) in the database query.
- [ ] **React:** Build the main Dashboard UI to fetch and display the feed as a list of cards with links to the original articles.

### Step 3.3: Automated Cleanup
- [ ] Write a background job to delete `ArticleMetadata` rows that exceed the maximum system retention period (e.g., older than 30 days).
- [ ] Schedule this cleanup task to run nightly.

---

## Phase 4 (Optional / Lowest Priority): Data Deduplication
*Goal: Prevent the same news story from appearing multiple times from different sources.*

### Step 4.1: Duplicate Detection Engine
- [ ] Write logic to generate a unique hash for articles based on URL normalization.
- [ ] Implement string similarity algorithms (like Levenshtein distance) to compare new article titles against recently saved articles.

### Step 4.2: Data Consolidation
- [ ] Update the `ArticleMetadata` model to support multiple source links for a single story.
- [ ] Modify the fetcher worker to append the source to an existing database row if a duplicate is detected, rather than creating a new row.

### Step 4.3: UI Updates
- [ ] **React:** Update the feed item card to display "Also reported by: Source B, Source C" when multiple sources are consolidated.
