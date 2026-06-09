# 🎨 Frontend Client

This directory contains the React and TypeScript frontend Single Page Application (SPA) for **Mindful Meals**. The client manages user preferences, interactive pantry checklists, dynamic weekly meal plans, local storage persistence, and component rendering, styling itself via a lightweight runtime Tailwind CSS CDN integration.

---

## 📂 Directory Map

*   **`App.tsx`**: Main component. Sets up global state variables (preferences, pantry, meal plan, shopping list, cookbook), manages routing views, and implements local storage synchronization.
*   **`constants.ts`**: Holds static configuration mappings, the default inventory for the pantry (`INITIAL_PANTRY`), dietary choices, and store lists.
*   **`types.ts`**: The single source of truth for all shared TypeScript interface models, custom types, and enums (e.g. `EnergyLevel`, `MealPlan`).
*   **`components/`**: Layout panels and user interfaces.
    *   **`Dashboard.tsx`**: Quick daily status check, energy-logging buttons, and meal cards.
    *   **`MealPlan.tsx`**: Weekly calendar grid with options to replace/regenerate specific meals.
    *   **`Pantry.tsx`**: Checklist-based inventory tracker and the receipt upload flow.
    *   **`Preferences.tsx`**: Dietary constraints setup and customized grocery store selection.
    *   **`ShoppingList.tsx`**: Display and management interface for the consolidated list.
    *   **`FridgeRescue.tsx`**: Encouraging low-effort recipes brainstormed from fridge photos.
    *   **`Cookbook.tsx`**: Searchable repository of favored/saved recipes.
    *   **`common/`**: Shared, reusable presentational widgets:
        *   `Button.tsx`: Theme-aware interactive button.
        *   `Icon.tsx`: Inline SVG utility for icons.
        *   `Modal.tsx`: Accessible overlay dialog.
        *   `SelectionOptionGroup.tsx`: Segmented choice group.
*   **`services/`**: API boundary logic.
    *   **`geminiService.ts`**: Encapsulates fetch communications to backend `/api` endpoints for AI recipe and parsing requests.

---

## 💅 Engineering Guidelines & Standards

When writing client-side React and TypeScript code, strictly adhere to the following standards:

*   **TypeScript Strictness:** Never use the `any` type. Share data structures across the client by importing models from [src/types.ts](file:///Volumes/Vish%20X9%20Pro/02_Developer/01_Personal/mindful-meals/src/types.ts). Read the guidelines in [Frontend Standards](file:///Volumes/Vish%20X9%20Pro/02_Developer/01_Personal/mindful-meals/docs/standards/frontend.md#1-type-safety--typescript).
*   **Safe Storage Operations:** Always wrap `localStorage.getItem` and `JSON.parse` calls in a `try/catch` block to handle empty keys, corrupted data, or outdated schemas safely without throwing rendering crashes. Read the guidelines in [Frontend Standards](file:///Volumes/Vish%20X9%20Pro/02_Developer/01_Personal/mindful-meals/docs/standards/frontend.md#3-safe-web-api-integration-local-storage).
*   **Timer & Ref Usage:** Never store timeout or interval handles in state, as mutating state triggers unnecessary re-renders. Use `useRef` to hold active timeout instances (e.g., for debounce actions). Read the guidelines in [Frontend Standards](file:///Volumes/Vish%20X9%20Pro/02_Developer/01_Personal/mindful-meals/docs/standards/frontend.md#2-state-management--timers-timeout-refs).
*   **Tailwind CDN Constraints:** Do not dynamically construct Tailwind classes (such as `bg-energy-${level}`). Map options to a static lookup object, and define customized variables within the root `index.html` file styles. Read the guidelines in [Frontend Standards](file:///Volumes/Vish%20X9%20Pro/02_Developer/01_Personal/mindful-meals/docs/standards/frontend.md#7-styling--design-system-tailwind-cdn).

---

## 🔗 Quick Navigation

*   **[Repository Root](../README.md)**
*   **[Documentation Index](../docs/README.md)**
