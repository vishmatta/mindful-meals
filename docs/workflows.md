# 🔄 Development Workflows & Guidelines

This document details the development setup, build workflows, git practices, and guidelines for both human developers and AI agents working on the **Mindful Meals** repository.

---

## 📋 Table of Contents
1. [Local Development Setup](#1-local-development-setup)
2. [Build & Test Commands](#2-build--test-commands)
3. [Git Branching Strategy](#3-git-branching-strategy)
4. [Commit & Pull Request Standards](#4-commit--pull-request-standards)
5. [AI Agent Guardrails](#5-ai-agent-guardrails)

---

## 1. Local Development Setup

### Prerequisites
*   Node.js (v18 or higher recommended)
*   A Gemini API Key (obtained from [Google AI Studio](https://aistudio.google.com/))

### Setup Steps
1.  **Clone the Repository** and navigate to the project root.
2.  **Configure Backend Secrets:** Create a `.env` file in the `server/` directory (not the project root) to prevent accidental API key leaks:
    ```bash
    cd server
    touch .env
    ```
    Add your configurations:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    PORT=3001
    ```
3.  **Install Dependencies:**
    ```bash
    # From project root: Install frontend dependencies
    npm install

    # From server directory: Install backend dependencies
    cd server
    npm install
    ```

---

## 2. Build & Test Commands

Use the following commands from their designated directories:

| Task | Command | Directory | Description |
|---|---|---|---|
| **Start Backend Dev Server** | `npm run dev` | `./server` | Runs Express with `nodemon` on port 3001. |
| **Start Frontend Dev Server** | `npm start` | Root (`.`) | Runs Vite on port 3000. Proxies `/api` to port 3001. |
| **Build Frontend** | `npm run build` | Root (`.`) | Builds frontend assets to `./dist` and copies them to `./server/dist/`. |
| **Run Production Server** | `npm start` | `./server` | Serves the Express server and the compiled static assets. |
| **Run Tests** | `npm test` | Root (`.`) | Runs test suites via `react-scripts test`. |

> [!IMPORTANT]
> Because the Express server in production serves static assets from `./server/dist`, you **must** run `npm run build` from the repository root before launching the server in production mode.

---

## 3. Git Branching Strategy

We practice **trunk-based development** branching off the default `main` branch. 

### Branch Naming Conventions
Keep branch names lowercase, use hyphens (no spaces or underscores), and prefix the name based on the task type:

| Branch Type | Prefix | Example Branch Name |
|---|---|---|
| **Feature** | `feature/` | `feature/add-recipe-timer` |
| **Bug Fix** | `fix/` | `fix/local-storage-crash` |
| **Chore** | `chore/` | `chore/upgrade-tailwind-cdn` |
| **Hotfix** | `hotfix/` | `hotfix/api-quota-leak` |
| **AI Agent** | `agent/` | `agent/p0-input-validation` |

---

## 4. Commit & Pull Request Standards

### Commit Messages
Commits should be focused on one logical change. Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```
Allowed types include: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`.

*Example:*
```bash
git commit -m "fix(storage): resolve local storage parsing crash on corrupt json"
```

### Pull Requests (PR)
All changes targeting `main` must go through a Pull Request.
*   **PR Template Requirements:**
    *   **Summary:** What was changed and why.
    *   **Testing Steps:** Clear steps to verify.
    *   **Trigger:** The issue, task ID, or prompt that triggered the change.
    *   **Impact:** Any potential breaking changes or API updates.
*   **Review Process:** Require at least one approving review before merging. Self-merging is discouraged.

---

## 5. AI Agent Guardrails

If you are an AI assistant working on this repository, you must adhere strictly to these rules:

### Never Edit Built Assets or Lockfiles Directly
*   **Do not** edit files inside `dist/` or `server/dist/` directly. They are overwritten by the build process.
*   **Do not** edit `package-lock.json` or `server/package-lock.json` manually. Always run `npm install` to update packages.

### Commit and PR Formatting
*   Prefix all agent commit messages with `[agent]` (e.g. `[agent] fix: validate fridge image mimeType`).
*   Prefix all agent PR titles with `[Agent]`.
*   Call out any assumptions or areas of uncertainty in the PR description so the reviewer knows where to focus.
