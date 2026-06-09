# CLAUDE.md - Developer Guide

This document outlines common commands, code style guidelines, and architecture conventions for the **Mindful Meals** project. For comprehensive engineering standards, design decisions, and system architecture guides, refer to the main [Documentation Index (docs/)](docs/README.md).

## Development & Build Commands

### Environment Setup
- Ensure a `.env` file is configured in the `server/` directory:
  ```env
  GEMINI_API_KEY=your_gemini_api_key_here
  PORT=3001
  ```
- Install dependencies:
  ```bash
  # Root dependencies (frontend)
  npm install

  # Server dependencies (backend)
  cd server && npm install
  ```

### Development Servers
- **Start Backend Dev Server** (port 3001):
  ```bash
  cd server && npm run dev
  ```
- **Start Frontend Dev Server** (Vite, port 3000):
  ```bash
  npm start
  ```
  *Note: Vite proxies all `/api` calls to port 3001.*

### Production Build & Run
- **Build Frontend**:
  ```bash
  npm run build
  ```
  *Note: This builds frontend assets to `/dist` and copies them to `/server/dist`.*
- **Run Production Server**:
  ```bash
  cd server && npm start
  ```

### Testing
- **Run Tests**:
  ```bash
  npm test
  ```

---

## Code Style & Guidelines

### TypeScript
- All code must be fully typed. Avoid the `any` type.
- Update `src/types.ts` for any shared model/type changes.

### Component Design
- React components must be modular. Place presentational/reusable widgets in `src/components/common/`.
- **Naming Conventions**:
  - React Components: PascalCase (e.g., `FridgeRescue.tsx`).
  - Constants & Services: camelCase (e.g., `geminiService.ts`, `constants.ts`).
  - Enums: PascalCase keys, UPPERCASE values (e.g., `EnergyLevel.FullPower = 'FULL_POWER'`).

### Styling & CSS
- Load Tailwind CSS via the CDN script tag in `index.html`.
- Custom themes and styles are declared in the `<style>` block in `index.html`.
- **Do not** install standard npm Tailwind build pipelines. Use inline styling or CSS variables defined in `index.html`.

### State Management
- Persistent application states (e.g., pantry checklist, preferences, meal plans, shopping list, cookbook) are managed globally in `src/App.tsx` and persisted in `localStorage`.

### AI Integration & Endpoints
- All Gemini API operations are handled server-side in `server/routes/ai.js`.
- Define strict JSON schemas for API responses using schema configurations in `server/routes/ai.js`.
- Access routes via the client-side `src/services/geminiService.ts`. Do not store or use `GEMINI_API_KEY` on the client side.

### Git Conventions
- Start all agent commit messages with `[agent]` (e.g., `[agent] fix(cookbook): resolve null reference in cookbook filter`).
- Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification: `[agent] <type>[optional scope]: <description>`.
- Branch naming:
  - Features: `feature/<short-description>`
  - Fixes: `fix/<short-description>`
  - Agent tasks: `agent/<task-id-or-short-description>`
