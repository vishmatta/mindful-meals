# ⚙️ Backend Engineering Standards

This document establishes the backend engineering standards for the **Mindful Meals** Express server. Adhering to these standards ensures security, application stability, request hygiene, and information disclosure prevention.

---

## 📋 Table of Contents
1. [Input & Request Body Validation](#1-input--request-body-validation)
2. [Security Boundaries & Payload Size Limits](#2-security-boundaries--payload-size-limits)
3. [Error Handling & Error Masking](#3-error-handling--error-masking)
4. [Endpoint Organization & Dead Code](#4-endpoint-organization-of-dead-code)

---

## 1. Input & Request Body Validation

### Type and Existence Verification
Never trust inputs from the request body (`req.body`) or query parameters (`req.query`) verbatim. Using unvalidated structures can lead to server crashes or type errors.
*   **Standard:** All properties extracted from `req.body` must be validated for existence and expected type before being passed to business logic.
*   **Pre-execution checks:** If an operation relies on array methods (e.g. `.join()`, `.map()`), explicitly check if the input is an array using `Array.isArray()`.

*Example - Input validation in route handlers:*
```javascript
// BAD: Directly joins without verifying types, will crash server if field is missing or not an array
const { equipment, globalRestrictions } = req.body.preferences;
const prompt = `Equipment: ${equipment.join(', ')}`;

// GOOD: Safe fallback and validation check
const preferences = req.body.preferences || {};
const equipment = Array.isArray(preferences.equipment) ? preferences.equipment : [];
const globalRestrictions = Array.isArray(preferences.globalRestrictions) ? preferences.globalRestrictions : [];

const prompt = `Equipment: ${equipment.join(', ') || 'None'}`;
```

### Parameter Bounding and Clamping
Numeric parameters that dictate generation limits (e.g., recipe `count` or list sizes) must be strictly bounded. Unbounded counts can lead to slow, expensive AI model calls, high token consumption, and timeout errors.
*   **Standard:** Apply server-side bounds checking. Parse and clamp parameters to a predefined range before using them in prompt strings or query loops.

*Example - Bounding parameter ranges:*
```javascript
// BAD: Raw interpolation allows count = 1000
const { count } = req.body;
const prompt = `Generate ${count} recipes...`;

// GOOD: Strict integer parser and clamp constraint
const rawCount = parseInt(req.body.count, 10);
const safeCount = Math.max(1, Math.min(isNaN(rawCount) ? 1 : rawCount, 10)); // Min: 1, Max: 10, Default: 1
```

---

## 2. Security Boundaries & Payload Size Limits

### Express Body Parser Configuration
Receipt scanning and fridge rescue features upload images as base64 encoded strings in the JSON body. Large payloads consume substantial server memory during parsing.
*   **Standard:** Restrict the maximum allowed request body size parsing limit to a maximum of **10MB**. This is sufficient for high-resolution mobile photos (even after ~33% base64 inflation) while protecting the server from memory exhaustion attacks (directly addressing review Item 12).

*Example - Configuring body limits in server entry point:*
```javascript
// In server.js
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

### Route Rate Limiting
*   Apply rate limits to all `/api/*` routes to prevent denial of service and API abuse (e.g., using `express-rate-limit`).

---

## 3. Error Handling & Error Masking

### Masking Sensitive Details
Error messages returned from external APIs (such as the Google Gemini SDK) can contain sensitive configurations, API key snippets, quota exhaustion information, or internal file paths.
*   **Standard:** **Never** return the raw `error.message` or the full stack trace to the client in the HTTP response.
*   **Actionable pattern:**
    1.  Log the full error stack server-side using `console.error` for developer visibility.
    2.  Send a generic, safe error response structure to the client with a 500 status code.

*Example - Safe error handling in routes:*
```javascript
// BAD: Leaks internal SDK / API details to frontend
try {
  const response = await callGeminiAPI(payload);
} catch (error) {
  res.status(500).json({ error: error.message });
}

// GOOD: Logs server-side, masks client response
try {
  const response = await callGeminiAPI(payload);
} catch (error) {
  console.error('[ROUTE ERROR] /api/recipes/generate failed:', error);
  res.status(500).json({ 
    error: 'Failed to process request. Please try again later.' 
  });
}
```

---

## 4. Endpoint Organization & Dead Code

### Routing Structure
*   All AI interactions are handled in `server/routes/ai.js`.
*   All server-wide static assets, middleware, rate-limiters, and route registrations must be registered in the main `server/server.js` file.

### Syncing Service Workers & Interceptors
*   Do not inject interceptors or service workers in `server.js` that reference dead or deprecated endpoints (e.g., old client-side direct proxies). Ensure any script inject logic matches the active application architecture (review Item 3).
