
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TopLevelSchema, PortraitPromptDetails, SavedCharacter } from '../types';
import { DEFAULT_SKILL_KEYS } from '../constants';

// NOTE: We do NOT instantiate the client globally here to avoid reading process.env.API_KEY 
// before the user has selected it in the UI.

interface GenerateOptions {
  tags: Record<string, string[]>;
  fixedName?: string;
  fixedStylePre?: string;
  fixedStylePost?: string;
}

/**
 * Helper to strip markdown code blocks if present and parse JSON.
 */
const cleanAndParseJSON = (text: string) => {
  let clean = text.trim();
  // Remove markdown code block syntax if present
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```/, '');
  }
  
  if (clean.endsWith('```')) {
    clean = clean.replace(/```$/, '');
  }
  
  return JSON.parse(clean.trim());
};

export const generateCharacterData = async (options: GenerateOptions): Promise<TopLevelSchema> => {
  const { tags, fixedName, fixedStylePre, fixedStylePost } = options;
  
  // Initialize inside function to ensure we get the latest key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash";

  // Determine skills to use: either from tags or default
  const userSelectedSkills = tags['skills'] || [];
  const activeSkills = userSelectedSkills.length > 0 ? userSelectedSkills : DEFAULT_SKILL_KEYS;

  // Extract description formatting tags
  const descriptionStructureTags = tags['description_elements'] || [];

  // Construct a prompt from tags
  let tagString = "";
  Object.entries(tags).forEach(([category, tagList]) => {
    if (tagList.length > 0) {
      tagString += `${category}: ${tagList.join(", ")}\n`;
    }
  });

  // Build specialized instructions for the description field
  let descriptionInstruction = "";
  if (descriptionStructureTags.length > 0) {
    descriptionInstruction = `
    CRITICAL: The 'description' field in the JSON output MUST be a single formatted string constructed by combining the following elements.
    
    FORMATTING RULES (Must be followed strictly):
    1. Use a relevant emoji at the start of each element's label (e.g., 👤 Age, 📏 Height, 📜 Backstory).
    2. Ensure there are TWO newlines (\\n\\n) between each distinct element to create clear visual separation / whitespace.
    3. Do NOT use Markdown headers (#). Use the emoji and the label as the header.
    
    ELEMENTS TO INCLUDE (Adhere strictly to type constraints):
    ${descriptionStructureTags.map(tag => `- ${tag}`).join('\n')}

    Rules for parsing these Description Elements:
    1. "single value" -> Output the emoji + name of the element followed by the value (e.g., "🎂 Age: 25").
    2. "text block {x}s" -> Output the emoji + name of the element as a header, followed by a newline and the text block of exactly {x} sentences.
    3. "text block {x}p" -> Output the emoji + name of the element as a header, followed by a newline and the text block of exactly {x} paragraphs.
    
    Combine all these parts into the single 'description' string.
    `;
  } else {
    descriptionInstruction = `
    The 'description' field should be a detailed, immersive summary of the character including their appearance, personality, and background.
    
    FORMATTING RULES:
    1. Organize the text into distinct sections (e.g., Appearance, Personality, Background, Role).
    2. Use a relevant emoji as a header for each section (e.g. 👁️ Appearance, 🧠 Personality, 📖 Background).
    3. Separate each section with double newlines (\\n\\n) to ensure maximum readability and whitespace.
    4. Write as a coherent narrative within those sections.
    `;
  }

  const nameInstruction = fixedName 
    ? `Use the name "${fixedName}" for the character. Design the character details to fit this name.` 
    : "Generate a unique, creative name fitting the Genre and Source tags. Ensure the name is distinct and non-repetitive.";

  const stylePreInstruction = fixedStylePre
    ? `Set 'illustrStylePre' to EXACTLY: "${fixedStylePre}".`
    : "Generate 'illustrStylePre' with high priority style keywords (e.g., 'Anime style', 'Oil painting').";
    
  const stylePostInstruction = fixedStylePost
    ? `Set 'illustrStylePost' to EXACTLY: "${fixedStylePost}".`
    : "Generate 'illustrStylePost' with lighting/detail keywords (e.g., 'cinematic lighting, 8k').";

  const systemInstruction = `
    You are an expert RPG character designer. Create a unique, detailed character based on the user's provided tags.
    Adhere strictly to the requested relationships, personality, and appearance.
    
    ${nameInstruction}
    
    The 'skills' object in the character definition must use exactly these keys: ${activeSkills.join(", ")}.
    Values for skills MUST be integers between 1 and 5. 1 is novice, 5 is master/legendary.
    
    The 'portraitPromptDetails' must provide vivid visual descriptions suitable for an AI image generator.
    - ${stylePreInstruction}
    - ${stylePostInstruction}
    - 'illustrAppearance': The character's physical features.
    - 'illustrClothes': What they are wearing.
    - 'illustrExpressionPosition': Pose and facial expression.
    - 'illustrSetting': The immediate background/environment.

    ${descriptionInstruction}
  `;

  // Dynamically build skill properties for schema
  const skillProperties: Record<string, any> = {};
  activeSkills.forEach(skill => {
    skillProperties[skill] = { type: Type.INTEGER };
  });

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      skills: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      possibleCharacters: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            portrait: { type: Type.STRING },
            portraitPromptDetails: {
              type: Type.OBJECT,
              properties: {
                illustrClothes: { type: Type.STRING },
                illustrSetting: { type: Type.STRING },
                illustrAppearance: { type: Type.STRING },
                illustrExpressionPosition: { type: Type.STRING },
                illustrStylePre: { type: Type.STRING },
                illustrStylePost: { type: Type.STRING },
              },
              required: ["illustrAppearance", "illustrClothes", "illustrExpressionPosition", "illustrSetting"]
            },
            fullSizePortrait: { type: Type.STRING },
            portraitOptions: {
              type: Type.ARRAY,
              items: { type: Type.STRING, nullable: true }
            },
            fullSizePortraitOptions: {
              type: Type.ARRAY,
              items: { type: Type.STRING, nullable: true }
            },
            currentPortraitIndex: { type: Type.INTEGER },
            characterId: { type: Type.STRING },
            skills: {
              type: Type.OBJECT,
              properties: skillProperties,
              required: activeSkills
            },
            initialTrackedItemValues: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "description", "portraitPromptDetails", "skills", "characterId"]
        }
      }
    },
    required: ["possibleCharacters", "skills"]
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Generate a character based on these tags:\n${tagString}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 1.0, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from API");
    return cleanAndParseJSON(text) as TopLevelSchema;

  } catch (error) {
    console.error("Error generating character JSON:", error);
    throw error;
  }
};

/**
 * Helper to construct the full prompt string from details.
 */
export const constructImagePrompt = (details: PortraitPromptDetails): string => {
  const promptParts = [
    details.illustrStylePre,
    details.illustrAppearance,
    details.illustrClothes,
    details.illustrExpressionPosition,
    details.illustrSetting,
    details.illustrStylePost
  ];

  // Filter out undefined/null/empty strings and join
  let prompt = promptParts.filter(part => part && part.trim().length > 0).join(" ");

  // Enforce character limit (2000 characters)
  if (prompt.length > 2000) {
    prompt = prompt.substring(0, 2000);
  }
  
  return prompt;
};

export const generateCharacterImage = async (prompt: string, size: '1K' | '2K' | '4K'): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-pro-image-preview';
    
    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
             aspectRatio: "3:4",
             imageSize: size
          }
        }
      });
  
      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts) throw new Error("No content parts in image response");

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      
      throw new Error("No image data found in response");
  
    } catch (error) {
      console.error("Error generating image:", error);
      return `https://picsum.photos/512/768?random=${Date.now()}`;
    }
  };

// --- New AI Helper Functions for Project Management ---

export const generateSeedNames = async (tags: Record<string, string[]>): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-2.5-flash";

    const source = tags['source']?.join(", ");
    const identity = tags['identity']?.join(", ");
    const genre = tags['genre']?.join(", ");

    let prompt = `Generate a JSON array of 60 unique, distinct names`;
    
    if (source && source !== "Original Character") {
        prompt += ` based on the lore, linguistics, and naming conventions of "${source}". 
        Include names of minor characters, locations, or deities from this setting that serve as good linguistic roots for a Markov chain generator.`;
    } else if (identity) {
        prompt += ` suitable for a ${identity} character in a ${genre || 'generic'} setting. Make them linguistically consistent.`;
    } else {
        prompt += ` suitable for a generic RPG character.`;
    }
    
    prompt += ` Return ONLY the JSON array of strings.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    try {
        return cleanAndParseJSON(response.text || "[]");
    } catch (e) {
        console.error("Failed to parse names", e);
        return [];
    }
};

export const analyzeProjectStyle = async (characters: SavedCharacter[]): Promise<{ pre: string, post: string }> => {
    if (characters.length === 0) return { pre: "", post: "" };

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-2.5-flash";

    const examples = characters.slice(0, 10).map(c => 
        `Character: ${c.name}\nStyle Pre: ${c.portraitPromptDetails.illustrStylePre}\nStyle Post: ${c.portraitPromptDetails.illustrStylePost}`
    ).join("\n---\n");

    const prompt = `Analyze the art styles of these characters:
    ${examples}
    
    Identify the common visual themes, art mediums, and lighting styles. 
    Synthesize a single 'Unified Style Pre' (medium, art style) and 'Unified Style Post' (rendering details, lighting).
    Return JSON: { "pre": "...", "post": "..." }`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    try {
        return cleanAndParseJSON(response.text || '{"pre":"", "post":""}');
    } catch (e) {
        console.error("Failed to parse style analysis", e);
        return { pre: "", post: "" };
    }
};

export const suggestFolders = async (characters: SavedCharacter[]): Promise<Record<string, string[]>> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-2.5-flash";

    const inputList = characters.map(c => ({
        id: c.id,
        name: c.name,
        desc: c.description.substring(0, 100) // First 100 chars as context
    }));

    const prompt = `Organize these characters into logical folders based on their likely faction, location, or team.
    Characters: ${JSON.stringify(inputList)}
    
    Return a JSON object where keys are Folder Names and values are arrays of character IDs. 
    Example: { "Empire": ["id1", "id2"], "Rebels": ["id3"] }
    Create 3-5 groups max.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    try {
        return cleanAndParseJSON(response.text || "{}");
    } catch (e) {
        console.error("Failed to parse folder suggestions", e);
        return {};
    }
};
