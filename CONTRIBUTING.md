# Contributing Guide

This document outlines how to contribute to this repository — whether you're a developer or an AI agent. Follow these conventions to keep the codebase clean and history readable.

For detailed engineering standards and coding rules, please review the [Documentation Index (docs/)](docs/README.md) before submitting changes.

---

## Table of Contents

- [Repository Structure](#repository-structure)
- [Local Development Setup](#local-development-setup)
- [Branch Strategy](#branch-strategy)
- [Creating a Branch](#creating-a-branch)
- [Making Changes](#making-changes)
- [Opening a Pull Request](#opening-a-pull-request)
- [PR Review Process](#pr-review-process)
- [Merging](#merging)
- [Guidelines for AI Agents](#guidelines-for-ai-agents)

---

## Repository Structure

This repository is split into two main components:

1. **Frontend (Root):** A React application built with TypeScript, managed via `react-scripts`.
2. **Backend (`server/`):** An Express server handling API endpoints and WebSocket communication.

---

## Local Development Setup

### Frontend Setup

The frontend runs from the root of the repository.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables by copying `.env.example` to `.env` (or `.env.local`):
   ```bash
   cp .env.example .env
   ```
   Add your `GEMINI_API_KEY` to the `.env` file.
3. Start the development server:
   ```bash
   npm start
   ```
4. Run tests:
   ```bash
   npm test
   ```

### Backend Setup

The backend runs from the `server/` directory.

1. Navigate to the server folder and install dependencies:
   ```bash
   cd server
   npm install
   ```
2. Configure environment variables in `server/.env`. Make sure to set a custom port (e.g. `PORT=3001`) to avoid conflict with Vite:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3001
   ```
3. Start the backend in development mode (runs with `nodemon` for auto-reloading):
   ```bash
   npm run dev
   ```
   *Note: The frontend dev server (Vite on port 3000) is preconfigured to proxy `/api` requests to the backend on `http://localhost:3001`.*

---

## Branch Strategy

This repo uses a **trunk-based branching model** with `main` as the protected default branch.

| Branch Type | Naming Pattern | Purpose |
|---|---|---|
| Feature | `feature/<short-description>` | New features or enhancements |
| Bug Fix | `fix/<short-description>` | Bug fixes |
| Chore | `chore/<short-description>` | Dependency updates, config changes, refactors |
| Hotfix | `hotfix/<short-description>` | Urgent production fixes |
| Agent | `agent/<task-id-or-description>` | Changes made by an AI agent |

**Examples:**

```
feature/add-user-auth
fix/null-pointer-on-login
chore/upgrade-dependencies
agent/refactor-payment-module
```

---

## Creating a Branch

Always branch off `main` unless instructed otherwise.

```bash
# Pull the latest main
git checkout main
git pull origin main

# Create and switch to your new branch
git checkout -b feature/your-feature-name
```

**Rules:**
- Never commit directly to `main`.
- Keep branch names lowercase with hyphens (no spaces or underscores).
- Keep branches short-lived — open a PR as soon as the work is ready for review.

---

## Making Changes

1. **Make focused commits.** Each commit should represent one logical change.
2. **Write clear commit messages** following the [Conventional Commits](https://www.conventionalcommits.org/) specification:

   ```
   <type>[optional scope]: <description>

   [optional body]

   [optional footer(s)]
   ```

   Common types:
   - `feat`: A new feature
   - `fix`: A bug fix
   - `docs`: Documentation only changes
   - `refactor`: A code change that neither fixes a bug nor adds a feature
   - `test`: Adding missing tests or correcting existing tests
   - `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation

   **Examples:**
   ```
   feat(auth): add email validation on sign-up form
   fix(queue): resolve race condition in job queue
   docs: update README with setup instructions
   ```

3. **Keep the branch up to date.** Rebase onto `main` regularly to avoid large merge conflicts:

   ```bash
   git fetch origin
   git rebase origin/main
   ```

4. **Do not force-push** shared branches. Force-pushing is only acceptable on your own unreviewed branch.

---

## Opening a Pull Request

1. Push your branch to the remote:

   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a PR on GitHub against `main`.

3. Fill out the PR description with:
   - **What** was changed and **why**
   - Steps to test or verify the change
   - Any relevant screenshots, logs, or context
   - Reference any related issues: `Closes #123`

4. Assign at least one reviewer.

5. Ensure all CI checks pass before requesting review.

**PR Title Format:**

```
<type>: <short description of change>
```

Example: `feat: add rate limiting to API endpoints`

---

## PR Review Process

- Reviewers should respond within **1 business day**.
- Address all review comments before merging.
- Use **"Request Changes"** for required fixes, **"Comment"** for suggestions.
- Once approved with all checks green, the author merges (unless the team uses auto-merge).

---

## Merging

- Use **Squash and Merge** for feature and fix branches to keep `main` history clean.
- Use **Merge Commit** only for long-running integration branches where individual commits matter.
- Delete the branch after merging.

---

## Guidelines for AI Agents

If you are an AI agent making changes to this repository, follow these additional rules:

### Branch Naming

Always use the `agent/` prefix:

```
agent/<task-id-or-short-description>
```

Example: `agent/update-api-error-handling`

### Commit Messages

Start every commit message with `[agent]` so changes are clearly identifiable:

```
[agent] fix: resolve null reference in user service
[agent] feat: add retry logic to outbound requests
```

### Pull Requests

- Set the PR title to start with `[Agent]`.
- In the PR description, clearly state:
  - What task or prompt triggered this change
  - What files were modified and why
  - Any assumptions made
  - Any areas of uncertainty that a human should review

**Example PR description:**

```
## Summary
[Agent] Refactored the payment module to separate validation logic.

## Changes
- Extracted `validateCard()` into its own utility function
- Added unit tests for edge cases
- Updated imports across affected files

## Triggered by
Task: "Separate payment validation from the core processing flow"

## Notes for Reviewer
- The existing tests still pass, but manual QA on the checkout flow is recommended.
- I did not modify the database schema — that may need a follow-up.
```

### Do Not

- Do not merge your own PR. Always leave merging to a human reviewer unless auto-merge is explicitly configured and approved.
- Do not push directly to `main` or `develop`.
- Do not modify CI/CD configuration files, secrets, or deployment scripts without explicit instruction.
- Do not delete branches other than the one you created.

---

## Questions?

Open a GitHub Discussion or reach out to the maintainers directly.
