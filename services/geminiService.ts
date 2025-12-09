
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { WatchFaceData, Language, WatchShape } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for the structural data of the watch face
const watchFaceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "A creative name for the watch face in the requested language." },
    description: { type: Type.STRING, description: "A short marketing description of the design in the requested language." },
    style: { 
      type: Type.STRING, 
      description: "The primary category of the watch face (e.g. Minimalist, Sport, etc.) in the requested language."
    },
    colorPalette: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: "Hex color code" },
      description: "A list of 3-5 dominant hex colors used in the design."
    },
    complications: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of features visible (e.g., Heart Rate, Steps, Weather) in the requested language."
    },
    visualPrompt: {
      type: Type.STRING,
      description: "A highly detailed, photorealistic image generation prompt describing the watch face visually in English (REQUIRED in English for image generation). Mention lighting, textures (metal, glass, neon), and exact layout. Do not include the watch strap."
    }
  },
  required: ["name", "description", "style", "colorPalette", "complications", "visualPrompt"]
};

/**
 * Step 1: Analyze user request and generate the specifications.
 */
export const generateWatchFaceSpecs = async (
  userPrompt: string, 
  styleHint: string, 
  targetDevice: string,
  language: Language,
  shape: WatchShape,
  selectedComplications: string[]
): Promise<Omit<WatchFaceData, 'id' | 'createdAt' | 'imageUrl' | 'language' | 'originalPrompt'>> => {
  const model = "gemini-2.5-flash";
  
  // Map language code to full English name for the system prompt
  const langMap: Record<string, string> = {
    'en': 'English',
    'zh': 'Simplified Chinese (简体中文)',
    'ja': 'Japanese',
    'ko': 'Korean',
    'es': 'Spanish',
    'de': 'German',
    'fr': 'French'
  };

  const targetLangName = langMap[language] || 'English';

  // Construct context about requested features
  const featuresRequest = selectedComplications.length > 0 
    ? `MANDATORY FEATURES (Must be visible in design): ${selectedComplications.join(', ')}.` 
    : "Features: Select suitable complications based on the style.";

  const systemInstruction = `
    You are a world-class smart watch face designer and UI/UX engineer.
    Your goal is to design a cohesive and visually stunning watch face based on user input.
    
    You must output:
    1. Detailed technical specifications (JSON).
    2. A highly optimized ENGLISH visual prompt for the image generation model.
    
    CRITICAL INSTRUCTIONS:
    - The fields 'name', 'description', 'style' and 'complications' in the JSON MUST be written in ${targetLangName}.
    - The field 'visualPrompt' MUST be written in ENGLISH, regardless of the user's language.
    - The 'visualPrompt' should strictly focus on the watch face (top-down view, high resolution, photorealistic or vector style), do not include the watch strap.
    - ${featuresRequest}
    - The design MUST be adapted for a ${shape.toUpperCase()} watch screen structure. 
      - If 'square', ensure complications and layout fit a rectangular/squircle aspect ratio (like Apple Watch).
      - If 'circle', ensure a radial or centered layout.
    - Target Device context: ${targetDevice} (use this for design language cues, e.g. Apple tends to be cleaner, Garmin more tactical).
  `;

  const finalPrompt = `
    User Request: "${userPrompt}"
    Preferred Style: "${styleHint}"
    Target Device: "${targetDevice}"
    Device Shape: "${shape}"
    Output Language: "${targetLangName}"
    Required Complications: ${selectedComplications.length > 0 ? selectedComplications.join(', ') : 'None specified, decide based on style'}
    
    Generate the design specification.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: watchFaceSchema,
        temperature: 0.7
      }
    });

    if (!response.text) throw new Error("No text returned from specs generation");
    
    const parsedData = JSON.parse(response.text);
    return {
      ...parsedData,
      targetDevice // Pass this back through so specific components can use it
    };
  } catch (error) {
    console.error("Error generating specs:", error);
    throw error;
  }
};

/**
 * Step 2: Render the image based on the specs.
 */
export const generateWatchFaceImage = async (visualPrompt: string): Promise<string> => {
  const model = "gemini-2.5-flash-image";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: visualPrompt }]
      },
      config: {
        // We let the model decide defaults
      }
    });

    // Extract image
    let base64Image = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) {
      throw new Error("No image data returned from generation");
    }

    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};