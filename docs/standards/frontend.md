# 🎨 Frontend Engineering Standards

This document establishes the frontend engineering standards for the **Mindful Meals** React application. Adhering to these standards ensures code safety, robust runtime behavior, type safety, and efficient rendering performance.

---

## 📋 Table of Contents
1. [Type Safety & TypeScript](#1-type-safety--typescript)
2. [State Management & Timers (Timeout Refs)](#2-state-management--timers-timeout-refs)
3. [Safe Web API Integration (Local Storage)](#3-safe-web-api-integration-local-storage)
4. [Component Design & Prop Hygiene](#4-component-design--prop-hygiene)
5. [React Performance & API Conservation](#5-react-performance--api-conservation)
6. [Resilience & Error Boundaries](#6-resilience--error-boundaries)
7. [Styling & Design System (Tailwind CDN)](#7-styling--design-system-tailwind-cdn)

---

## 1. Type Safety & TypeScript

### Avoid the `any` Type
The use of `any` is strictly prohibited. It bypasses type checking and leads to silent runtime errors.
*   Instead of `any`, use explicit interfaces, type unions, generics, or `unknown` (with type assertion guards).

*Example - Typing event/change handlers dynamically:*
```typescript
// BAD: Bypasses type checking
const handleItemChange = (index: number, field: string, value: any) => {
  newItems[index][field] = value;
};

// GOOD: Fully typed with generic constraint
const handleItemChange = <K extends keyof ScannedItem>(
  index: number,
  field: K,
  value: ScannedItem[K]
) => {
  newItems[index] = { ...newItems[index], [field]: value };
};
```

### Shared Types & Models
*   All shared types, interfaces, and enums must reside in [src/types.ts](../../src/types.ts).
*   Do not duplicate definitions. If a type like `MealType` or `EnergyLevel` is needed in multiple files, it must be declared once in `src/types.ts` and imported (directly addressing review Item 15).

---

## 2. State Management & Timers (Timeout Refs)

### Avoid Timers in State
Storing timeout IDs or timer references in React `useState` is an anti-pattern. Setting state triggers a component re-render, which can lead to unstable timers and redundant renders.
*   **Standard:** Use `useRef` to store timeout/interval IDs and references. Mutations to `ref.current` do not trigger a re-render.

*Example - Debouncing with `useRef`:*
```typescript
// BAD: Triggers re-renders and potential timing loops
const [debounceTimeout, setDebounceTimeout] = useState<number | null>(null);

// GOOD: Mutates a ref without triggering renders
const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  if (debounceTimeout.current) {
    clearTimeout(debounceTimeout.current);
  }
  
  debounceTimeout.current = setTimeout(() => {
    // Perform debounced operation
  }, 1000);
  
  return () => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
  };
}, [dependencies]);
```

---

## 3. Safe Web API Integration (Local Storage)

### Safe JSON Parsing
Reading and parsing values from storage (e.g. `localStorage.getItem`) can crash the application if the stored string is empty, malformed, or has an outdated schema.
*   **Standard:** Always wrap `localStorage` access and JSON parsing in a `try/catch` block. Provide a safe default fallback value in the `catch` block and optionally clean up the corrupted key.

*Example - Safe state initialization:*
```typescript
const [preferences, setPreferences] = useState<DietaryPreferences>(() => {
  const fallback = INITIAL_PREFERENCES;
  try {
    const data = localStorage.getItem('preferences');
    return data ? JSON.parse(data) : fallback;
  } catch (error) {
    console.error('Failed to parse preferences from localStorage, resetting:', error);
    localStorage.removeItem('preferences'); // Clean up corrupt state
    return fallback;
  }
});
```

---

## 4. Component Design & Prop Hygiene

### Component Sizing and File Splitting
Keep files under 300 lines of code. If a component grows large (like `App.tsx`), separate concerns by extracting business logic, API calls, and handlers into dedicated hooks or sub-components.
*   **State Hooks:** Extract persistence and initialization into custom hooks (e.g., `useAppState`).
*   **Action Hooks:** Extract mutation and event handlers (e.g., `useMealPlanActions`) to separate the interface from user interaction logic.

### Clean Props Contracts (No Dead Stubs)
Do not export or pass unimplemented prop callbacks (stub functions) in components.
*   **Standard:** If a callback is passed to a component (like `onToggleTask`), it must be fully implemented. If the feature is not ready, remove the prop, update the component interface, and hide/disable the UI trigger. This prevents misleading interfaces and dead code paths (review Item 14).

---

## 5. React Performance & API Conservation

### API Conservation & Side Effects
Side-effect hooks (`useEffect`) that make network calls must be constrained. In a personal app with dozens of items, invoking an LLM call automatically on every checkbox change creates excessive load and billing costs.
*   **Manual Trigger Policy:** For complex or expensive computations (such as generating grocery lists based on stock changes), favor manual refresh triggers (like a "Refresh Shopping List" button) over automatic side effects.
*   **Alignment of API Schemas:** Maintain absolute alignment between frontend TypeScript models and backend JSON schemas to avoid redundant transformation steps and downstream type guards (review Item 8).

### Client-Side ID Assignment
When adding items to checklists, plans, or list records, do not ask the AI model to generate database-like primary keys or IDs. The AI might produce collisions, and generating IDs server-side is wasteful.
*   **Standard:** Assign IDs on the client side immediately upon receiving or creating data using browser APIs (e.g., `crypto.randomUUID()`).

---

## 6. Resilience & Error Boundaries

### React Error Boundaries
React applications crash completely if an error occurs during rendering, leaving the user with a blank screen.
*   **Standard:** Wrap top-level layout wrappers or major routing components in a custom React Error Boundary.
*   **Requirements:**
    *   Show an ADHD-friendly, encouraging fallback error screen.
    *   Provide a "Reset Application Data" or "Refresh Page" action.
    *   Log the error to console or error service.

---

## 7. Styling & Design System (Tailwind CDN)

### Runtime Tailwind Integration
The application loads Tailwind CSS via the CDN script tag in the HTML head.
*   **CSS Variable Sourcing:** Global themes (colors, dark mode variables) must be declared inside the `<style>` block in `index.html` as CSS variables.
*   **Tailwind Class Safety:** Do not dynamically construct class strings that Tailwind's parser cannot detect (e.g. ``bg-energy-${level}``). Use a lookup object to fetch the complete class name:
    ```typescript
    const energyColors: Record<EnergyLevel, string> = {
      [EnergyLevel.FullPower]: 'bg-emerald-500 text-white',
      [EnergyLevel.Cruising]: 'bg-blue-500 text-white',
      [EnergyLevel.LowBattery]: 'bg-amber-500 text-white',
      [EnergyLevel.SOS]: 'bg-rose-500 text-white',
    };
    ```
