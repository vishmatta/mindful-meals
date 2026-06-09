# ⚙️ Backend Server

This directory contains the Node.js and Express backend application for **Mindful Meals**. The server acts as a secure intermediary between the React client and the Google Gemini API, handling image/text parsing, static file delivery, request validation, and API rate limiting.

---

## 📂 Directory Map

*   **`server.js`**: Server entry point. Sets up the Express application, configures security middlewares (rate limiting, 10MB body size parsing limits), routes API requests, and serves the static production build of the React client.
*   **`routes/`**: Contains route-specific controllers.
    *   **`ai.js`**: Handles all AI interactions (recipes generation, receipt scanning, fridge rescue, and shopping list mapping) using the Google Gemini API and details the JSON schema requirements.
*   **`public/`**: Reserved directory for static server-side assets (currently empty).
*   **`package.json`**: Manages server-specific dependencies (e.g. `@google/genai`, `express`, `express-rate-limit`, `dotenv`).
*   **`.env`**: Contains sensitive API keys and configurations (e.g., `GEMINI_API_KEY`, `PORT`). *This file is git-ignored and must never be committed.*

---

## 🔒 Engineering Guidelines & Standards

When making changes to the backend codebase, ensure compliance with the following standards:

*   **Input & Request Validation:** Never trust client-side data. Verify parameter types, array existence, and clamp/bound any numerical inputs (e.g. recipe counts) before constructing Gemini prompts. Read the complete guidelines in [Backend Standards](file:///Volumes/Vish%20X9%20Pro/02_Developer/01_Personal/mindful-meals/docs/standards/backend.md#1-input--request-body-validation).
*   **Error Masking:** Never return raw stack traces or Gemini SDK error messages to the frontend. Log the details on the server using `console.error` and return a generic user-friendly message. Read the complete guidelines in [Backend Standards](file:///Volumes/Vish%20X9%20Pro/02_Developer/01_Personal/mindful-meals/docs/standards/backend.md#3-error-handling--error-masking).
*   **Prompt Injection Protection:** Construct Gemini prompts by isolating user-controlled instructions inside XML-like tags (e.g., `<user_preferences>`) and instruct the model not to allow those parameters to override system constraints. Read the complete guidelines in [AI Integration Standards](file:///Volumes/Vish%20X9%20Pro/02_Developer/01_Personal/mindful-meals/docs/standards/ai-integration.md#1-prompt-injection-prevention--security).
*   **MIME Type Validation:** Verify that uploaded multimodal files (fridge and receipt photos) match allowed MIME types (`image/jpeg`, `image/jpg`, `image/png`, `image/webp`) before sending payloads to Gemini. Read the complete guidelines in [AI Integration Standards](file:///Volumes/Vish%20X9%20Pro/02_Developer/01_Personal/mindful-meals/docs/standards/ai-integration.md#2-input-sanitization--mime-type-safety).

---

## 🔗 Quick Navigation

*   **[Repository Root](../README.md)**
*   **[Documentation Index](../docs/README.md)**
