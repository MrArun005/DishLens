import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Clients ────────────────────────────────────────────────────────────────

// Read keys from comma-separated list
const rawKeys = process.env.GOOGLE_AI_KEYS || process.env.GOOGLE_AI_KEY || '';
const geminiKeys = rawKeys.split(',').map(k => k.trim()).filter(k => k && !k.includes('your_'));

// ─── All-in-one Step: OCR, Translate, and Enrich via Gemini 2.5 Flash ─────────
async function analyzeMenuWithGemini(imageBase64, targetLanguage = 'en') {

  const prompt = `You are a culinary expert and precise OCR tool. 
Look at this restaurant menu image. 

STEP 1: THINKING
First, look at the menu row by row. Write out a list of EVERY single dish you see on the menu to ensure you don't miss anything.
Wrap this step in <thinking>...</thinking> tags.

STEP 2: JSON OUTPUT
After thinking, extract the culinary details for EVERY dish you listed.
Translate the dish names and descriptions to ${targetLanguage}.

Return a JSON object with this exact structure:
{
  "sourceLang": "detected language code e.g. hi, en, it",
  "dishes": [
    {
      "name": "original dish name",
      "translated": "translated dish name in ${targetLanguage} if different, else same",
      "description": "1-2 sentence description of the dish, its origin/style, and how it tastes",
      "type": "Veg" or "Non-Veg" or "Vegan",
      "spiceLevel": "Mild" or "Medium" or "Spicy" or null,
      "isPopular": true if this is a signature dish (use your judgment),
      "isVegan": true or false,
      "hasGluten": true if likely contains gluten,
      "ingredients": ["key ingredient 1", "key ingredient 2", "..."],
      "price": "price string if visible, else null"
    }
  ],
  "restaurant": {
    "cuisineType": "e.g. South Indian, Italian, Thai",
    "topPick": "name of the single dish you'd most recommend and why (1 sentence)"
  }
}

Rules for JSON:
- Include EVERY dish from your thinking step. Do not skip any.
- If unsure about veg/non-veg, default to "Non-Veg"
- Make the descriptions mouth-watering and highly descriptive.`;

  let lastError = null;

  for (let i = 0; i < geminiKeys.length; i++) {
    const key = geminiKeys[i];
    console.log(`[Attempt ${i + 1}/${geminiKeys.length}] Trying API Key ending in ...${key.slice(-4)}`);
    
    try {
      const gemini = new GoogleGenerativeAI(key);
      const model = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const result = await model.generateContent([
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
        prompt
      ]);

      const raw = result.response.text().trim();
      console.log('Gemini Raw Response:', raw);

      const firstBrace = raw.indexOf('{');
      const lastBrace = raw.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) {
        throw new SyntaxError('Could not find JSON object in Gemini response');
      }
      
      const clean = raw.substring(firstBrace, lastBrace + 1);
      return JSON.parse(clean);

    } catch (err) {
      lastError = err;
      const msg = err.message || '';
      
      if (msg.includes('429') || msg.includes('quota') || msg.includes('exhausted')) {
        console.warn(`Key ...${key.slice(-4)} hit rate limit. Switching keys...`);
        continue;
      }
      if (err.name === 'SyntaxError') {
         throw err;
      }
      
      console.warn(`Key ...${key.slice(-4)} failed: ${msg}. Trying next key...`);
    }
  }

  throw new Error(`All API keys failed or exhausted. Last error: ${lastError?.message}`);
}

// ─── Main endpoint ───────────────────────────────────────────────────────────
app.post('/analyze-menu', async (req, res) => {
  const { imageBase64, targetLanguage = 'en' } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  try {
    // If API keys are missing or still the placeholder, return a high-quality mock response
    if (geminiKeys.length === 0) {
      console.log('API keys missing or placeholder detected. Returning mock data.');
      return new Promise(resolve => setTimeout(() => {
        resolve(res.json({
          success: true,
          sourceLang: 'hi',
          dishes: [
            {
              name: "Bisi Bele Bath",
              translated: "Spicy lentil rice",
              description: "A traditional Karnataka dish made with rice, lentils, and spices",
              type: "Veg",
              spiceLevel: "Medium",
              isPopular: true,
              isVegan: false,
              hasGluten: false,
              ingredients: ["rice", "lentils", "tamarind", "spices", "ghee"],
              price: "₹150"
            },
            {
              name: "Chicken Chettinad",
              translated: "Chettinad Chicken Curry",
              description: "A fiery and aromatic chicken curry from the Chettinad region of Tamil Nadu.",
              type: "Non-Veg",
              spiceLevel: "Spicy",
              isPopular: true,
              isVegan: false,
              hasGluten: false,
              ingredients: ["chicken", "coconut", "black pepper", "curry leaves"],
              price: "₹280"
            },
            {
              name: "Masala Dosa",
              translated: "Crispy Crepe with Potato Filling",
              description: "A thin, crispy South Indian crepe made from fermented rice and lentil batter, filled with a spiced potato mixture.",
              type: "Veg",
              spiceLevel: "Mild",
              isPopular: true,
              isVegan: true,
              hasGluten: false,
              ingredients: ["rice batter", "urad dal", "potatoes", "mustard seeds"],
              price: "₹120"
            }
          ],
          restaurant: {
            cuisineType: "South Indian",
            topPick: "Bisi Bele Bath — a perfectly balanced and comforting regional specialty."
          }
        }));
      }, 1500)); // Simulate network latency
    }

    console.log('[1/1] Analyzing menu with Gemini...');
    const enriched = await analyzeMenuWithGemini(imageBase64, targetLanguage);

    return res.json({
      success: true,
      ...enriched,
    });

  } catch (err) {
    console.error('Analysis pipeline error:', err.message);

    if (err.name === 'SyntaxError') {
      return res.status(500).json({ error: 'AI returned unparseable response. Please retry.' });
    }

    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ─── Health check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`MenuLens backend running on port ${PORT}`));
