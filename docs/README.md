# 📚 Mindful Meals Documentation Index

Welcome to the **Mindful Meals** documentation home. This directory contains engineering standards, architectural outlines, and workflow guides for developing and maintaining the codebase.

The standards defined here are designed to ensure safety, performance, type safety, and clean architecture, particularly when working with AI APIs (like Google Gemini) and React/Express applications.

---

## 📂 Documentation Directory Map

Click any file below to jump directly to that section:

### 🛠️ Code Standards
*   **[Frontend Standards](standards/frontend.md)**
    *   TypeScript practices (strict typing, avoiding `any`).
    *   State management, timeout/interval ref pattern, and local storage safety.
    *   React performance, rendering optimization, and Error Boundaries.
*   **[Backend Standards](standards/backend.md)**
    *   Express routing conventions.
    *   Strict input/body validation and parameter bounding/clamping.
    *   Security limits (JSON body limits, rate limits).
    *   Log sanitization and error message masking.
*   **[AI Integration Standards](standards/ai-integration.md)**
    *   Gemini SDK usage and schema alignment with TypeScript models.
    *   Prompt injection mitigation (delimiting and sanitizing user inputs).
    *   Handling resource IDs (client-side UUIDs vs. AI-generated keys).

### 🏛️ System & Architecture
*   **[System Architecture](architecture.md)**
    *   Client-Server data flow and routing details.
    *   Offline capabilities (Service Worker & WebSockets).
    *   Data synchronization strategy (Pantry, Shopping List, Cookbook).

### 🔄 Workflows & Contributions
*   **[Workflows & Guides](workflows.md)**
    *   Local setup & environment configurations.
    *   Docker, Cloud Run, and CI/CD deployment.
    *   Branch naming strategies and Agent vs. Human contribution workflows.

---

## 📌 Quick Access Root Guides

*   **[README.md](../README.md):** General project overview, user features, and dev quickstart.
*   **[CLAUDE.md](../CLAUDE.md):** Fast reference command guide (build, run, test) and code style cheat sheet.
*   **[CONTRIBUTING.md](../CONTRIBUTING.md):** Git branching conventions, pull request structures, and general contribution guides.
*   **[AGENTS.md](../AGENTS.md):** Specialized context and warnings for AI agents working in this repository.
