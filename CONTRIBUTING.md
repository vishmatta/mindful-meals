# Contributing to Mindful Meals

Thank you for your interest in contributing to **Mindful Meals**! This document outlines the contribution process, including branch naming conventions, pull request structures, and code review expectations.

---

## 🔄 CODEOWNERS & Review Routing

This repository uses a **CODEOWNERS** file (`.github/CODEOWNERS`) to enforce path-based code review routing. When you create a pull request that modifies files in specific directories, GitHub automatically requests reviews from the designated owners.

### Current Ownership Map

| Path | Owner |
|------|-------|
| `src/` | @vishmatta |
| `server/` | @vishmatta |
| `.github/`, `Dockerfile`, `cloudbuild.yaml` | @vishmatta |
| `docs/`, `*.md` files | @vishmatta |
| `public/`, `test/` | @vishmatta |
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

### 1. Create Your Branch

```bash
git checkout -b feature/my-feature
```

### 2. Make Your Changes

- Follow the code style guidelines in [CLAUDE.md](./CLAUDE.md).
- Refer to the [Documentation Index](./docs/README.md) for architecture and standards.
- Keep commits atomic and meaningful.

### 3. Push and Open a PR

```bash
git push origin feature/my-feature
```

Then open a pull request on GitHub with:

- **Title**: Follow Conventional Commits format (e.g., `feat: add energy-level filtering`)
- **Description**: Clearly explain what the PR does, why it's needed, and any testing you've done.
- **Link to Issue**: Reference any related issues using `Closes #123` or `Relates to #456`.

### 4. Review & Merge

- GitHub will automatically request reviews from **CODEOWNERS** based on files modified.
- Address feedback, update your branch, and re-request review.
- Once approved, a maintainer will merge using "Squash and merge" (to keep history clean).

---

## 🧪 Testing Before Submission

### Frontend

```bash
npm test
```

### Backend

```bash
cd server && npm test
```

### Manual Testing

- Run the dev servers locally (see [README.md](./README.md)).
- Test your changes across different energy levels and scenarios.
- Verify no console errors or warnings are introduced.

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
