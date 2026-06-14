# Contributing to Mindful Meals

Thank you for your interest in contributing to **Mindful Meals**! This document outlines the contribution process, including branch naming conventions, pull request structures, and code review expectations.

---

## 🔄 CODEOWNERS & Review Routing

This repository uses a **CODEOWNERS** file (`.github/CODEOWNERS`) to enforce path-based code review routing. When you create a pull request that modifies files in specific directories, GitHub automatically requests reviews from the designated owners.

### Current Ownership Map

| Path | Owner |
|------|-------|
| `src/`, `index.html`, `index.tsx` | @vishmatta |
| `server/` | @vishmatta |
| `.github/`, `Dockerfile`, `cloudbuild.yaml` | @vishmatta |
| `docs/`, `*.md` files | @vishmatta |
| `package.json`, build config | @vishmatta |


### Updating CODEOWNERS

To modify ownership rules (e.g., when adding team members):

1. Edit `.github/CODEOWNERS` following the [GitHub CODEOWNERS syntax](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).
2. Use GitHub usernames (`@username`) or team handles (`@org/team`).
3. Lines are processed top-to-bottom; more specific paths should appear later.
4. Example:
   ```
   # Frontend team
   /src/** @mindful-meals/frontend
   
   # Backend team
   /server/** @mindful-meals/backend
   ```

---

## 🌿 Branch Naming Conventions

When creating a branch, use one of these prefixes followed by a short, descriptive slug:

- **Features**: `feature/<short-description>` (e.g., `feature/add-energy-levels`)
- **Fixes**: `fix/<short-description>` (e.g., `fix/pantry-sync-bug`)
- **Agent Tasks**: `agent/<task-id-or-description>` (e.g., `agent/abc-123` or `agent/setup-codeowners`)
- **Documentation**: `docs/<short-description>` (e.g., `docs/update-api-guide`)
- **Refactoring**: `refactor/<short-description>` (e.g., `refactor/extract-state-logic`)

---

## 📝 Commit Message Conventions

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
[agent] <type>[optional scope]: <description>
```

### Commit Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, semicolons, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Changes that improve performance
- `test`: Adding or updating tests
- `chore`: Changes to build tools, dependencies, or CI/CD

### Examples

```bash
# Feature
git commit -m "[agent] feat(recipes): add energy-level based filtering"

# Bug fix
git commit -m "[agent] fix(pantry): resolve sync issue with localStorage"

# Documentation
git commit -m "[agent] docs: add CODEOWNERS explanation to CONTRIBUTING.md"

# Chore
git commit -m "[agent] chore(deps): update express to v4.18.0"
```

### Agent vs. Human Contributions

- **Agent commits** must start with `[agent]` tag.
- **Human commits** follow the same format but omit the `[agent]` prefix.

---

## 🔀 Pull Request Process

To ensure high-quality, structured changes, this repository enforces a **Plan-First** policy for AI agents and highly encourages structured descriptions for humans.

### 📋 Plan-First & Author Differentiation

When you create a Pull Request, the CI system runs a **Plan Gate** check. The workflow determines the contributor type as follows:

*   **AI Agents**: Identified if the branch name starts with `agent/` or `copilot/`, if the PR title is prefixed with `[agent]`, or if the PR Metadata field is set to `- **Author Type**: AI Agent` (or includes "AI Agent").
    *   *Requirement*: Must fully complete the **Agentic Plan & Rationale** and **Execution Evidence** sections of the PR template.
    *   *Enforcement*: The CI **Plan Gate** workflow parses the PR body and *will block the merge* if the structured plan header (`## 📋 Agentic Plan & Rationale`) is missing or incomplete.
*   **Human Developers**:
    *   *Requirement*: Must complete the **Description** section. The **Agentic Plan & Rationale** section is optional (and can be deleted or left blank).
    *   *Enforcement*: The CI **Plan Gate** workflow will bypass validation for human-authored PRs. If a human PR is accidentally flagged, a friendly warning will explain how to resolve it.

---

### 1. Create Your Branch

```bash
git checkout -b feature/my-feature # Human developer branch
# OR
git checkout -b agent/my-task      # AI agent branch
```

### 2. Make Your Changes

- Follow the code style guidelines in [CLAUDE.md](./CLAUDE.md).
- Refer to the [Documentation Index](./docs/README.md) for architecture and standards.
- Keep commits atomic and meaningful.

### 3. Push and Open a PR

```bash
git push origin feature/my-feature
```

Then open a pull request on GitHub. Fill out the PR template completely:
- **For Humans**: Set `Author Type` to `Human Developer`. Fill out the `Description` and `Pre-Merge Checklist`.
- **For AI Agents**: Set `Author Type` to `AI Agent`. Fill out `Agentic Plan & Rationale`, `Execution Evidence`, and the checklists.

- **Title**: Follow Conventional Commits format (e.g., `feat: add energy-level filtering` or `[agent] feat: add energy-level filtering`).
- **Link to Issue**: Reference any related issues using `Closes #123`.

### 4. Review & Merge

- GitHub will automatically request reviews from **CODEOWNERS** based on files modified.
- For AI agent PRs, the Code Owners will review both the *Plan & Rationale* and the code changes.
- Address feedback, update your branch, and re-request review.
- Once approved, a maintainer will merge using "Squash and merge" (to keep history clean).

---

## 🧪 Testing Before Submission

As there are currently no automated test files tracked in the repository, verification relies primarily on manual testing and adding test suites for new complex logic.

### Automated Testing (When Added)

- **Frontend**: Run `npm test` in the root directory (uses `react-scripts test`).
- **Backend**: Currently, no test runner is configured. Any backend test suites added in the future should be defined in `server/package.json` under a `test` script.

### Manual Verification

To manually verify your changes:
- Run the dev servers locally (see [README.md](./README.md)).
- Test user flows across different energy levels and scenarios.
- Inspect the browser console to ensure no errors or warnings are introduced.
- Verify that state persists correctly in `localStorage` upon reload.


---

## 📚 Code Standards & Guidelines

For detailed code style, TypeScript practices, and architecture guidelines, see:

- **[CLAUDE.md](./CLAUDE.md):** Quick command reference and code cheat sheet.
- **[docs/standards/](./docs/standards/):** Comprehensive frontend, backend, and AI integration standards.
- **[AGENTS.md](./AGENTS.md):** Special context and warnings for AI agents.

---

## ❓ Questions?

If you have questions about the contribution process, feel free to open a discussion or reach out to @vishmatta.

Thanks for contributing to Mindful Meals! 🍲✨
