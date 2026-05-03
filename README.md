# MenuLens 🍽️

AI-powered menu scanner — scan any menu and get clear, contextual dish insights.

---

## Architecture

```
React Native (Expo)  →  Node.js/Express  →  Gemini Vision (OCR)
                                         →  Google Translate
                                         →  Claude (enrichment)
```

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env     # Fill in your API keys
npm run dev              # Starts on http://localhost:3001
```

**Required API keys (all free tiers available):**
| Key | Where to get it |
|-----|----------------|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| `GOOGLE_AI_KEY` | https://aistudio.google.com/app/apikey |
| `GOOGLE_TRANSLATE_KEY` | https://console.cloud.google.com → Cloud Translation API |

### 2. Frontend

```bash
cd frontend
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android).

---

## Key Files

```
frontend/
  App.js                         # Navigation setup
  src/screens/
    HomeScreen.js                # Landing + recent scans
    CameraScreen.js              # Camera capture
    ResultsScreen.js             # Dish cards + tags

backend/
  server.js                      # Express API + 3-stage pipeline
  .env.example                   # API key template
```

---

## API

### `POST /analyze-menu`

```json
Request:
{
  "imageBase64": "<base64 jpeg string>",
  "targetLanguage": "en"
}

Response:
{
  "success": true,
  "sourceLang": "hi",
  "dishes": [
    {
      "name": "Bisi Bele Bath",
      "translated": "Spicy lentil rice",
      "description": "A traditional Karnataka dish with rice, lentils, tamarind and spices.",
      "type": "Veg",
      "spiceLevel": "Medium",
      "isPopular": true,
      "isVegan": false,
      "hasGluten": false,
      "ingredients": ["rice", "lentils", "tamarind", "ghee"],
      "price": "₹180"
    }
  ],
  "restaurant": {
    "cuisineType": "South Indian",
    "topPick": "Bisi Bele Bath — a must-try regional specialty"
  }
}
```

### `GET /health`

Health check.

---

## Extending the App

| Feature | Where to add |
|---------|-------------|
| Dietary filters (Veg only, Vegan) | `ResultsScreen.js` — filter `dishes` array |
| Voice pronunciation | Add `expo-speech` in `ResultsScreen.js` |
| Offline dish cache | Use `AsyncStorage` in `HomeScreen.js` |
| User language preference | Pass `targetLanguage` from settings screen |
| Save scan history | Store results in `AsyncStorage` or SQLite |
