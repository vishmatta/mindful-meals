<div align="center">
# 🍲 Mindful Meals

### *ADHD-Friendly Meal Planning & Kitchen Assistant*
</div>

---

**Mindful Meals** is a highly interactive, stress-free web application designed to minimize decision fatigue and cooking overwhelm for individuals with ADHD. By utilizing the Google Gemini API, Mindful Meals adapts dynamically to your daily energy levels, simplifies grocery shopping, rescues ingredients in your fridge, and helps you batch prep meals to reduce cognitive load.

---

## ✨ Key Features

### ⚡ Dynamic Energy-Level Tailoring
How much energy you have directly dictates what you eat. Log your energy status on the dashboard:
*   **Full Power:** Generates engaging, complex recipes for when you have the bandwidth.
*   **Cruising:** Recommends standard, satisfying meals.
*   **Low Battery:** Recommends quick, simple meals with minimal prep and cleanup.
*   **SOS (Emergency Mode):** Pre-configures the interface for 5-minute emergency meals (like scrambled eggs on toast or instant noodles) requiring almost zero effort and cleanup.

### 📅 ADHD-Friendly Meal Planning
*   **Batch Prepping vs. Variety Mode:** Configure planning preferences per meal type (Breakfast, Lunch, Snack, Dinner). Re-use 1–4 recipes across the week in batch mode (minimizing active kitchen time) or toggle variety mode for daily unique meals.
*   **Targeted AI Replacements:** Don't like a generated recipe? Customize a single meal or regenerate it using specific parameters (time available, kitchen equipment, and custom prompts) or replace it directly from your Cookbook.
*   **Weekly Mood/Preferences:** Optionally specify a weekly craving or theme (e.g., *"more vegetarian meals"*, *"use my saved garlic noodles recipe"*) to guide AI recommendations.
*   **Show/Hide Days:** Toggle which days of the week you want to plan for to avoid cluttering your screen and mind.

### 🍅 Digital Pantry & Smart Receipt Scanner
*   **Checklist Inventory:** Keep track of what you actually have in stock across 20+ pantry categories.
*   **Receipt Scanning:** Powered by **Gemini 2.5 Flash**, upload a photo of your grocery receipt to automatically extract, categorize, and batch-upload purchased items directly into your pantry.

### 🛒 Intelligent Shopping List
*   **Pantry-Aware Generation:** Automatically compares required ingredients against what is currently in stock in your pantry using smart matching.
*   **Consolidation & Aggregation:** Combines identical or similar ingredients, sums their quantities (converting matching units), and sorts them by your customized shopping store options (e.g. Costco, HEB, Target).
*   **Optional Markings:** Clearly tags optional recipe elements so you don't overspend or buy unnecessary items.

### 📸 Fridge Rescue
*   **Visual Rescue:** Feel frozen looking at your fridge? Snap a photo of your ingredients, and Gemini will instantly brainstorm 3 extremely simple, encouraging, low-effort meal options.

### 📖 Personal Cookbook
*   **Saved Favorites:** Favorite any generated recipe to store it in your cookbook. Filter, search by name, ingredients, or cuisine, and easily import them directly into future meal plans.

---

## 🛠️ Technology Stack

*   **Frontend:** React (Single Page Application), TypeScript, Tailwind CSS (via customizable CDN config).
*   **Backend:** Node.js, Express.
*   **AI Integration:** Google Gemini API (`gemini-2.5-flash`) via the official `@google/genai` SDK.
*   **API Security:**
    *   All Gemini API calls are made server-side through dedicated Express routes (`/api/recipes/generate`, `/api/fridge/rescue`, `/api/receipts/scan`, `/api/shopping-list/generate`). The `GEMINI_API_KEY` is only ever read from server environment variables — it is never bundled into the client.
    *   A rate limiter is applied to all `/api` routes to prevent abuse.
*   **Deployment:** Docker multi-stage build, Google Cloud Build (`cloudbuild.yaml`), Google Cloud Run.

---

## 🚀 Running Locally

### Prerequisites
*   Node.js (v18 or higher recommended)
*   A Gemini API Key (obtain from [Google AI Studio](https://aistudio.google.com/))

### 1. Set Up Environment Variables
Create a `.env` file inside the `server/` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

> **Security note:** The API key must only be set on the server. Do **not** add it to any root-level `.env` or Vite config — it should never be bundled into the client.

### 2. Install Dependencies
```bash
# Install root (frontend) dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 3. Run the App

#### Option A: Build and Serve (Production/Offline Simulation)
Build the frontend and run the Express server, which serves the static build and handles all AI requests.
```bash
# 1. Build the frontend
npm run build

# 2. Start the server
cd server
npm start
```
Open the URL printed in the server log (e.g., `http://localhost:3001` if `PORT=3001` is set in `server/.env`, or `http://localhost:3000` by default) in your browser.

#### Option B: Vite Dev Server with Express Backend (Full Dev Mode with Hot Reloading)
This setup allows you to edit frontend React files with hot reloading while maintaining backend AI integrations.
1. Start the backend dev server (runs nodemon on port 3001):
   ```bash
   cd server
   npm run dev
   ```
2. In a separate terminal tab, start the Vite dev server in the project root (runs on port 3000):
   ```bash
   npm start
   ```
Open [http://localhost:3000](http://localhost:3000) in your browser. Vite is preconfigured via `vite.config.ts` to proxy all `/api` calls to the Express server running on port 3001.

---

## 🐳 Docker & Cloud Run Deployment

You can build and deploy the containerized application:

```bash
# Build the Docker image locally
docker build -t mindful-meals .

# Run the Docker container
docker run -p 3000:3000 -e GEMINI_API_KEY="your_api_key" mindful-meals
```

The repository also includes `cloudbuild.yaml` for setting up automated deployments to Google Cloud Run via Google Cloud Build.

---

## 📚 Developer Documentation

For detailed guides on frontend/backend coding standards, system architecture diagrams, AI prompt safety guidelines, and developer workflows, see the dedicated [Documentation Index (docs/)](docs/README.md) directory.

