# Architecture Overview

Flash-n-Frame follows a modern client-server architecture optimized for the Replit environment.

## Core Components
1. **Frontend (React 19):** Handles UI, D3 visualizations, and user interaction.
2. **Auth Server (Node/Express):** Manages user accounts, sessions, and PostgreSQL interactions.
3. **AI Layer (Gemini):** Powers the visual intelligence engine.
4. **Persistence (PostgreSQL + IndexedDB):** Hybrid storage for server-side accounts and client-side project state.

## Data Flow
- Users input repository URLs.
- Frontend fetches metadata via GitHub API.
- Content is sent to Gemini for infographic generation.
- Results are saved to IndexedDB for offline access.
