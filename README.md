<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

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
*   **Proxy Security & Interception:**
    *   An Express rate-limited proxy (`/api-proxy`) handles all outgoing HTTP requests and WebSocket upgrades, ensuring Gemini API keys remain secure on the server side.
    *   A custom Service Worker (`service-worker.js`) and WebSocket Interceptor (`websocket-interceptor.js`) intercept frontend requests and route them automatically through the server proxy.
*   **Deployment:** Docker multi-stage build, Google Cloud Build (`cloudbuild.yaml`), Google Cloud Run.

---

## 🚀 Running Locally

### Prerequisites
*   Node.js (v18 or higher recommended)
*   A Gemini API Key (obtain from [Google AI Studio](https://aistudio.google.com/))

### 1. Set Up Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Install Dependencies
Run `npm install` in both the root directory (for frontend development) and the server directory (for proxy operations):
```bash
# Install root (frontend) dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 3. Run the App

#### Option A: Full Local Proxy Setup (Recommended)
This runs the Express server as a proxy, serves the static build, and allows full functionality including the receipt scanner and fridge rescue.
```bash
# 1. Build the frontend
npm run build

# 2. Start the proxy server
cd server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Option B: Frontend Dev Server (Vite / Webpack)
If you are only editing the React UI and styles, you can run the dev server directly.
To run via Webpack (using `react-scripts`):
```bash
npm start
```
To run via Vite:
```bash
npx vite
```
*Note: Make sure your `GEMINI_API_KEY` is defined in your terminal or a `.env.local` file for direct client-side requests.*

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
