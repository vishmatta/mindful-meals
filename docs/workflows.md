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
*   Docker Desktop (required for local PostgreSQL via Docker Compose)
*   A Gemini API Key (obtained from [Google AI Studio](https://aistudio.google.com/))

### Setup Steps
1.  **Clone the Repository** and navigate to the project root.
2.  **Configure Backend Secrets:** Create a `.env` file in the `server/` directory (not the project root):
    ```bash
    cd server
    touch .env
    ```
    Add your configurations:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    PORT=3001
    DATABASE_URL="postgresql://mindful:mindful@localhost:5432/mindful_meals"
    DIRECT_DATABASE_URL="postgresql://mindful:mindful@localhost:5432/mindful_meals"
    DEFAULT_USER_ID="your-fixed-uuid-here"
    HOUSEHOLD_API_KEY="your-household-key-here"
    ```
    For `HOUSEHOLD_API_KEY`, generate a key with: `openssl rand -hex 32`
3.  **Start the local database:**
    ```bash
    docker compose up -d db
    ```
4.  **Run migrations and seed initial data:**
    ```bash
    cd server
    npx prisma migrate dev --name init
    npx prisma db seed
    ```
    The seed command is idempotent — safe to run multiple times.
5.  **Install Dependencies:**
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
| **Start local database** | `docker compose up -d db` | Root (`.`) | Starts Postgres 16 container on port 5432. |
| **Run DB migrations** | `npx prisma migrate dev` | `./server` | Applies pending migrations and regenerates Prisma client. |
| **Seed initial data** | `npx prisma db seed` | `./server` | Upserts default user, preferences, and pantry items. Idempotent. |
| **Start Backend Dev Server** | `npm run dev` | `./server` | Runs Express with `nodemon` on port 3001. |
| **Start Frontend Dev Server** | `npm start` | Root (`.`) | Runs Vite on port 3000. Proxies `/api` to port 3001. |
| **Build Frontend** | `npm run build` | Root (`.`) | Builds frontend assets to `./dist` and copies them to `./server/dist/`. |
| **Run Production Server** | `npm start` | `./server` | Serves the Express server and the compiled static assets. |
| **Run Tests** | `npm test` | Root (`.`) | Runs all test suites. |

> [!IMPORTANT]
> Because the Express server in production serves static assets from `./server/dist`, you **must** run `npm run build` from the repository root before launching the server in production mode.

> [!NOTE]
> The local `DATABASE_URL` and `DIRECT_DATABASE_URL` point to the same Docker Compose instance. In production, `DATABASE_URL` uses the Supabase Supavisor pooler (port 6543) and `DIRECT_DATABASE_URL` uses the direct connection (port 5432) for migrations and seeding only.

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
    - **Summary:** What was changed and why.
    - **Testing Steps:** Clear steps to verify.
    - **Trigger:** The issue, task ID, or prompt that triggered the change.
    - **Impact:** Any potential breaking changes or API updates.
*   **Review Process:** Require at least one approving review from Code Owners before merging. Self-merging is blocked for agents and protected by branch rulesets.
*   **PR Evaluation Gate (Automated Validation)**:
    Every pull request triggers a multi-stage **PR Evaluation Gate** running on GitHub Actions:
    - **Plan Gate**: For agent-authored PRs, the evaluator verifies that the `## 📋 Agentic Plan & Rationale` template section is fully completed and contains no default placeholders.
    - **Boundary Scope Check**: Verifies that agent changes stay within their designated write boundary globs defined in `.github/agents/*.agent.md`. Administrative paths (such as `.github/**`) are restricted from agent modification.
    - **Secrets Scanning**: Scans changed diff lines for hardcoded credentials (such as Google API keys or explicit key assignments) and client-side safety violations. Intentional bypasses require `// pr-evaluator:allow` and are logged in a dedicated "Bypasses" section of the report.
    - **Build & Test**: Ensures that `npm run build` compiles and the test suite executes successfully (`CI=true npm test -- --passWithNoTests`).
    - **Rule of Two Security**: GHA builds and tests run in an isolated read-only job. A separate trusted workflow (`workflow_run`) downloads the evaluation report and posts/updates the PR comment.

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

### Safe Iteration Policy & Human Escalation
To mitigate infinite retry loops that consume API tokens, compute resources, and developer review cycles, AI agents must abide by the following policy:
*   **Retry Limits:** Do not exceed **2 consecutive test or build failures** during local verification or automated evaluation.
*   **Human Escalation:** If the limit is reached, halt execution immediately and generate a diagnostic report based on the escalation template (see [AGENTS.md](file:///Volumes/Vish%20X9%20Pro/02_Developer/01_Personal/mindful-meals/AGENTS.md) for details).
