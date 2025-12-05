import { Type, Schema } from "@google/genai";
import { TopLevelSchema, PortraitPromptDetails, SavedCharacter, ImageGenerationRule, PossibleCharacter } from '../types';
import { DEFAULT_SKILL_KEYS, CATEGORY_DEFINITIONS } from '../constants';
import { getGeminiClient } from './genaiClient';

// NOTE: We do NOT instantiate the client globally here to avoid reading process.env.GEMINI_API_KEY
// before the user has selected it in the UI.

interface GenerateOptions {
  tags: Record<string, string[]>;
  fixedName?: string;
  fixedStylePre?: string;
  fixedStylePost?: string;
  imageGenerationRules?: ImageGenerationRule[];
  namingConvention?: string;
  regeneratePromptsOnly?: boolean;
  existingCharacter?: PossibleCharacter;
}

/**
 * Helper to strip markdown code blocks if present and parse JSON.
 */
type ParseResult<T> = {
  data: T;
  errorMessage?: string;
};

const cleanAndParseJSON = <T>(text: string, fallback: T, context: string): ParseResult<T> => {
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

  try {
    return { data: JSON.parse(clean.trim()) } as ParseResult<T>;
  } catch (error) {
    console.error(`Failed to parse ${context}`, { error, text: clean.substring(0, 500) });
    return { data: fallback, errorMessage: `The model returned invalid ${context} data.` };
  }
};

const ensureStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
};

const validateStylePayload = (value: unknown): { pre: string; post: string } => {
  const fallback = { pre: "", post: "" };
  if (!value || typeof value !== 'object') return fallback;
  const maybe = value as Record<string, unknown>;
  const pre = typeof maybe.pre === 'string' ? maybe.pre : '';
  const post = typeof maybe.post === 'string' ? maybe.post : '';
  return { pre, post };
};

const validateFolderMap = (value: unknown): Record<string, string[]> => {
  if (!value || typeof value !== 'object') return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string[]>>((acc, [folder, ids]) => {
    const cleanIds = ensureStringArray(ids);
    if (folder && cleanIds.length > 0) {
      acc[folder] = cleanIds;
    }
    return acc;
  }, {});
};

const validateTagSuggestion = (value: unknown): Record<string, string[]> => {
  if (!value || typeof value !== 'object') return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string[]>>((acc, [category, tags]) => {
    const cleanTags = ensureStringArray(tags);
    if (category && cleanTags.length > 0) {
      acc[category] = cleanTags;
    }
    return acc;
  }, {});
};

export const generateCharacterData = async (options: GenerateOptions): Promise<TopLevelSchema> => {
  const { tags, fixedName, fixedStylePre, fixedStylePost, imageGenerationRules, namingConvention, regeneratePromptsOnly, existingCharacter } = options;

  // Initialize inside function to ensure we get the latest key
  const ai = getGeminiClient();
  const model = "gemini-2.5-flash";

  // Determine skills to use: either from tags or default
  const userSelectedSkills = tags['skills'] || [];
  const activeSkills = userSelectedSkills.length > 0 ? userSelectedSkills : DEFAULT_SKILL_KEYS;

  // Extract special tags
  const descriptionStructureTags = tags['description_elements'] || [];
  const authorStyleTags = tags['author_style'] || [];

  // Construct a prompt from tags, EXCLUDING author_style to prevent it from influencing visual prompts
  let tagString = "";
  Object.entries(tags).forEach(([category, tagList]) => {
    if (category === 'author_style') return; 
    if (tagList.length > 0) {
      tagString += `${category}: ${tagList.join(", ")}\n`;
    }
  });

  // Author Style Instruction
  let styleInstruction = "";
  if (authorStyleTags.length > 0) {
      styleInstruction = `\nWRITING STYLE: The textual descriptions (excluding image prompts) must be written in the following style/tone: ${authorStyleTags.join(", ")}.`;
  }

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
    4. "text block {x}w" -> Output the emoji + name of the element as a header, followed by a newline and the text block of approximately {x} words.
    
    Combine all these parts into the single 'description' string.
    ${styleInstruction}
    `;
  } else {
    descriptionInstruction = `
    The 'description' field should be a detailed, immersive summary of the character including their appearance, personality, and background.
    
    FORMATTING RULES:
    1. Organize the text into distinct sections (e.g., Appearance, Personality, Background, Role).
    2. Use a relevant emoji as a header for each section (e.g. 👁️ Appearance, 🧠 Personality, 📖 Background).
    3. Separate each section with double newlines (\\n\\n) to ensure maximum readability and whitespace.
    4. Write as a coherent narrative within those sections.
    ${styleInstruction}
    `;
  }

  // Name Instruction Logic
  let nameInstruction = "";
  if (fixedName) {
      nameInstruction = `Use the name "${fixedName}" for the character. Design the character details to fit this name.`;
  } else {
      const namingStyleInfo = namingConvention ? `Follow this naming convention/style: "${namingConvention}".` : "";
      nameInstruction = `
      Generate a unique, creative name fitting the Genre and Source tags. ${namingStyleInfo}
      Ensure the name is distinct and non-repetitive. Avoid cliche RPG names (e.g., avoid "Luna", "Shadow", "Raven", "Nova") unless fitting for the specific Source.
      `;
  }

  const stylePreInstruction = fixedStylePre
    ? `Set 'illustrStylePre' to EXACTLY: "${fixedStylePre}".`
    : "Generate 'illustrStylePre' with high priority style keywords (e.g., 'Anime style', 'Oil painting').";
    
  const stylePostInstruction = fixedStylePost
    ? `Set 'illustrStylePost' to EXACTLY: "${fixedStylePost}".`
    : "Generate 'illustrStylePost' with lighting/detail keywords (e.g., 'cinematic lighting, 8k').";

  // Build custom image prompt rules instructions
  let imageRulesInstruction = "";
  if (imageGenerationRules && imageGenerationRules.length > 0) {
      imageRulesInstruction = `
      CRITICAL: You must follow these specific instructions when generating the 'portraitPromptDetails' fields:
      `;
      imageGenerationRules.forEach(rule => {
          if (rule.target === 'all') {
              imageRulesInstruction += `- For ALL portrait fields: ${rule.instruction}\n`;
          } else {
              imageRulesInstruction += `- For '${rule.target}': ${rule.instruction}\n`;
          }
      });
  }

  let systemInstruction = "";
  let contentPrompt = "";

  if (regeneratePromptsOnly && existingCharacter) {
      // REGENERATION MODE
      systemInstruction = `
        You are an expert visual prompt engineer.
        The user wants to regenerate the visual art prompts ('portraitPromptDetails') for an existing character.
        Retain the character's identity, name, and core concept, but describe them visually in a new way or with more detail based on the rules.
        
        Existing Character Name: ${existingCharacter.name}
        Existing Description Summary: ${existingCharacter.description.substring(0, 200)}...
        
        The 'portraitPromptDetails' must provide vivid visual descriptions suitable for an AI image generator.
        - ${stylePreInstruction}
        - ${stylePostInstruction}
        - 'illustrAppearance': The character's physical features.
        - 'illustrClothes': What they are wearing.
        - 'illustrExpressionPosition': Pose and facial expression.
        - 'illustrSetting': The immediate background/environment.
        
        ${imageRulesInstruction}
        
        IMPORTANT:
        - Keep 'name', 'description', 'characterId', 'skills', 'initialTrackedItemValues' EXACTLY as provided in the input JSON.
        - ONLY modify the 'portraitPromptDetails' object.
      `;
      
      contentPrompt = `Regenerate the visual prompts for this character based on these tags:\n${tagString}\n\nExisting Character JSON:\n${JSON.stringify(existingCharacter)}`;

  } else {
      // CREATION MODE
      systemInstruction = `
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
        
        ${imageRulesInstruction}

        ${descriptionInstruction}
      `;
      contentPrompt = `Generate a character based on these tags:\n${tagString}`;
  }

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
      contents: contentPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 1.0, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from API");

    const { data, errorMessage } = cleanAndParseJSON<TopLevelSchema>(text, { skills: [], possibleCharacters: [] }, "character definition");
    if (errorMessage) {
      throw new Error(errorMessage);
    }

    return data;

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

export const generateCharacterImage = async (prompt: string, size: '1K' | '2K' | '4K', aspectRatio: string = "3:4"): Promise<string> => {
    const ai = getGeminiClient();
    const model = 'gemini-3-pro-image-preview';

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
           aspectRatio: aspectRatio,
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
  };

// --- New AI Helper Functions for Project Management ---

export const generateSeedNames = async (tags: Record<string, string[]>, namingConvention?: string): Promise<string[]> => {
    const ai = getGeminiClient();
    const model = "gemini-2.5-flash";

    const source = tags['source']?.join(", ");
    const identity = tags['identity']?.join(", ");
    const genre = tags['genre']?.join(", ");

    let prompt = `Generate a JSON array of 60 unique, distinct names`;
    
    if (namingConvention) {
        prompt += ` that strictly follow this naming convention: "${namingConvention}".`;
    } else if (source && source !== "Original Character") {
        prompt += ` based on the lore, linguistics, and naming conventions of "${source}". 
        Include names of minor characters, locations, or deities from this setting that serve as good linguistic roots for a Markov chain generator.`;
    } else if (identity) {
        prompt += ` suitable for a ${identity} character in a ${genre || 'generic'} setting. Make them linguistically consistent.`;
    } else {
        prompt += ` suitable for a generic RPG character.`;
    }

    prompt += `
    CRITICAL: 
    - Ensure names vary in length and starting letter to provide good training data.
    - Avoid overused names like "Luna", "Shadow", "Nova", "Raven" unless they strictly fit the requested source/convention.
    - Return ONLY the JSON array of strings.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    const { data, errorMessage } = cleanAndParseJSON<string[]>(response.text || "[]", [], "seed names");
    const names = ensureStringArray(data);

    if (errorMessage) {
      throw new Error(errorMessage);
    }

    return names;
};

export const analyzeProjectStyle = async (characters: SavedCharacter[]): Promise<{ pre: string, post: string }> => {
    if (characters.length === 0) return { pre: "", post: "" };

    const ai = getGeminiClient();
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

    const { data, errorMessage } = cleanAndParseJSON(response.text || '{"pre":"", "post":""}', { pre: "", post: "" }, "style analysis");
    const validated = validateStylePayload(data);

    if (errorMessage) {
      throw new Error(errorMessage);
    }

    return validated;
};

export const suggestFolders = async (characters: SavedCharacter[]): Promise<Record<string, string[]>> => {
    const ai = getGeminiClient();
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

    const { data, errorMessage } = cleanAndParseJSON(response.text || "{}", {}, "folder suggestions");
    const validated = validateFolderMap(data);

    if (errorMessage) {
      throw new Error(errorMessage);
    }

    return validated;
};

export const suggestTagsFromDescription = async (description: string): Promise<Record<string, string[]>> => {
    const ai = getGeminiClient();
    const model = "gemini-2.5-flash";

    const categoriesContext = CATEGORY_DEFINITIONS.map(c => `${c.id}: ${c.description}`).join('\n');

    const prompt = `Analyze the following world or adventure description and extract relevant tags for character generation.
    
    Description: "${description}"
    
    Map the extracted concepts to the following categories:
    ${categoriesContext}
    
    SPECIAL RULE FOR 'description_elements':
    Do NOT extract specific values (e.g., do NOT write 'Eyes: Blue', 'Age: 25').
    Instead, suggest *structure definitions* for what information should be generated in the character sheet.
    Allowed formats:
    1. 'Key: single value' (for short stats, names, physical traits)
    2. 'Key: text block {N}s' (for N sentences)
    3. 'Key: text block {N}p' (for N paragraphs)
    4. 'Key: text block {N}w' (for N words)

    Example for description_elements:
    Input: "A high fantasy world where lineage determines magic power."
    Output Tags: ["Magic Aptitude: single value", "Ancestral Lineage: text block 1p", "Mana Capacity: single value"]
    
    Return a JSON object where keys are the category IDs and values are arrays of string tags.
    Only return categories where you found relevant tags.
    Example: { "genre": ["Sci-Fi", "Cyberpunk"], "tone": ["Dark", "Gritty"], "description_elements": ["Cybernetics: text block 2s"] }
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    const { data, errorMessage } = cleanAndParseJSON(response.text || "{}", {}, "tag suggestions");
    const validated = validateTagSuggestion(data);

    if (errorMessage) {
      throw new Error(errorMessage);
    }

    return validated;
};