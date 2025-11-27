import { CategoryDefinition } from './types';

export const DEFAULT_SKILL_KEYS = [
  "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", 
  "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", 
  "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"
];

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
    {
        id: 'source',
        description: "Indicates the source material the character comes from. 'Original Character' means you must create them from scratch based on other tags.",
        suggestedTags: ["Original Character", "Genshin Impact", "Star Wars", "Cyberpunk 2077", "Elden Ring", "Marvel Universe", "D&D 5e", "Pathfinder", "Warhammer 40k"]
    },
    {
        id: 'identity',
        description: "Describes the character's fundamental, unchangeable nature: their species, gender, race, or species-subtype.",
        suggestedTags: ["Female", "Male", "Human", "Elf", "Demon", "Android", "Vampire", "Neko", "Dragonborn", "Dwarf", "Orc", "Wizard", "Warrior"]
    },
    {
        id: 'appearance',
        description: "Specific details about the character's physical look.",
        suggestedTags: ["Curvy", "Petite", "Tall", "Muscular", "Goth", "Office Lady", "Cybernetic", "Tattoos", "Glasses", "Long Hair", "Short Hair", "Scarred", "Elegant"]
    },
    {
        id: 'personality',
        description: "Defines the character's inner world, temperament, and how they behave and react.",
        suggestedTags: ["Shy", "Yandere", "Tsundere", "Kind", "Cold", "Motherly", "Bratty", "Stoic", "Energetic", "Confident", "Anxious", "Manipulative"]
    },
    {
        id: 'role',
        description: "CRITICAL: This defines the character's relationship TO THE USER ({{user}}).",
        suggestedTags: ["Step-Sister", "Teacher", "Bully", "Rival", "Childhood Friend", "Boss", "Servant", "Enemy Commander", "Spouse", "Stranger"]
    },
    {
        id: 'genre',
        description: "Establishes the setting and the 'rules' of the character's world.",
        suggestedTags: ["Fantasy", "Sci-Fi", "Modern Day", "Post-Apocalyptic", "Steampunk", "Cyberpunk", "Historical", "Horror", "Slice of Life"]
    },
    {
        id: 'tone',
        description: "Defines the emotional atmosphere and writing style of the roleplay.",
        suggestedTags: ["Romance", "Horror", "Wholesome", "Dark", "Comedic", "Dramatic", "Slow Burn", "Adventure", "Angst"]
    },
    {
        id: 'dynamic',
        description: "Describes a plot progression or a change in the relationship between the character and the user.",
        suggestedTags: ["Enemies to Lovers", "Transformation", "Corruption", "Redemption", "Secret Relationship", "Forced Proximity", "Arranged Marriage"]
    },
    {
        id: 'skills',
        description: "Select specific skills for the character. If left empty, the standard D&D 5e skill list will be used.",
        suggestedTags: ["Swordsmanship", "Hacking", "Cooking", "Magic", "Stealth", "Diplomacy", "Medicine", "Marksmanship", "Engineering", "Performance"]
    },
    {
        id: 'description_elements',
        description: "Controls details generated inside the 'description' field. DOCUMENTATION: Use format 'Name: type'. Types are 'single value', 'text block {N}p' (paragraphs), 'text block {N}s' (sentences), 'text block {N}w' (words). Example: 'Backstory: text block 3p'.",
        suggestedTags: [
            "Age: single value",
            "Height: single value", 
            "Measurements: single value",
            "Personality Summary: text block 3s",
            "Appearance Detail: text block 1p",
            "Backstory: text block 3p",
            "Secret: text block 1s",
            "Clothing Style: text block 2s",
            "Equipment: text block 1p",
            "Goals: text block 2s"
        ]
    },
    {
        id: 'author_style',
        description: "Influences the writing style and tone of the text descriptions. Does NOT affect visual prompts.",
        suggestedTags: ["Flowery", "Clinical", "Gritty", "Poetic", "Casual", "Journal Entry", "Sarcastic", "Formal", "Mysterious", "Humorous"]
    },
    {
        id: 'kink-fetish',
        description: "For NSFW cards, specific themes, kinks, and fetishes.",
        suggestedTags: ["Dominant", "Submissive", "Possessive", "Praise", "Degradation", "Size Difference", "Bondage", "Exhibitionism"]
    },
    {
        id: 'meta',
        description: "Technical tags describing the card itself or the conditions of the roleplay.",
        suggestedTags: ["SFW", "NSFW", "Roleplay", "MalePOV", "FemalePOV", "AnyPOV", "Dead Dove"]
    }
];

export const LIGHTING_OPTIONS = [
    "Cinematic Lighting", "Natural Light", "Golden Hour", "Studio Softbox", 
    "Dramatic Shadows", "Bioluminescent Glow", "Neon Noir", "Rembrandt Lighting", "Volumetric Fog", "Firelight", "Moonlight"
];

export const CAMERA_OPTIONS = [
    "Eye-Level", "Low Angle", "High Angle", "Dutch Angle", 
    "Wide Angle", "Telephoto Lens", "Macro Shot", "Over-the-Shoulder", "Drone View", "Fish-eye lens"
];

export const STYLE_OPTIONS = [
    "Photorealistic", "Anime", "Digital Painting", "Oil Painting", 
    "Concept Art", "Watercolor", "Cyberpunk", "Dark Fantasy", "Sketch", "Pixel Art", "3D Render", "Noir"
];

export const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];