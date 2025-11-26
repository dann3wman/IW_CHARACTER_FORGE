import { CategoryDefinition } from './types';

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
    {
        id: 'source',
        description: "Indicates the source material the character comes from.",
        suggestedTags: ["Original Character", "Genshin Impact", "Star Wars", "Cyberpunk 2077", "Elden Ring", "Marvel Universe"]
    },
    {
        id: 'identity',
        description: "Describes the character's fundamental, unchangeable nature.",
        suggestedTags: ["Female", "Male", "Human", "Elf", "Demon", "Android", "Vampire", "Neko", "Dragonborn"]
    },
    {
        id: 'appearance',
        description: "Specific details about the character's physical look.",
        suggestedTags: ["Curvy", "Petite", "Tall", "Muscular", "Goth", "Office Lady", "Cybernetic", "Tattoos", "Glasses", "Long Hair", "Short Hair"]
    },
    {
        id: 'personality',
        description: "Defines the character's inner world, temperament, and how they behave.",
        suggestedTags: ["Shy", "Yandere", "Tsundere", "Kind", "Cold", "Motherly", "Bratty", "Stoic", "Energetic"]
    },
    {
        id: 'role',
        description: "CRITICAL: This defines the character's relationship TO THE USER.",
        suggestedTags: ["Step-Sister", "Teacher", "Bully", "Rival", "Childhood Friend", "Boss", "Servant", "Enemy Commander"]
    },
    {
        id: 'genre',
        description: "Establishes the setting and the 'rules' of the character's world.",
        suggestedTags: ["Fantasy", "Sci-Fi", "Modern Day", "Post-Apocalyptic", "Steampunk", "Cyberpunk", "Historical"]
    },
    {
        id: 'tone',
        description: "Defines the emotional atmosphere and writing style of the roleplay.",
        suggestedTags: ["Romance", "Horror", "Wholesome", "Dark", "Comedic", "Dramatic", "Slow Burn"]
    },
    {
        id: 'dynamic',
        description: "Describes a plot progression or a change in the relationship.",
        suggestedTags: ["Enemies to Lovers", "Transformation", "Corruption", "Redemption", "Secret Relationship", "Forced Proximity"]
    },
    {
        id: 'skills',
        description: "Select specific skills for the character. If left empty, the standard D&D 5e skill list will be used.",
        suggestedTags: ["Swordsmanship", "Hacking", "Cooking", "Magic", "Stealth", "Diplomacy", "Medicine", "Marksmanship", "Engineering", "Performance"]
    },
    {
        id: 'description_elements',
        description: "Controls details generated inside the 'description' field. Use format 'Name: type' (e.g., 'Age: single value', 'History: text block 2p').",
        suggestedTags: [
            "Age: single value",
            "Height: single value", 
            "Measurements: single value",
            "Personality Summary: text block 3s",
            "Appearance Detail: text block 1p",
            "Backstory: text block 3p",
            "Secret: text block 1s",
            "Clothing Style: text block 2s"
        ]
    },
    {
        id: 'kink-fetish',
        description: "Themes for character behavior (Optional/NSFW context).",
        suggestedTags: ["Dominant", "Submissive", "Possessive", "Praise", "Degradation", "Size Difference"]
    },
    {
        id: 'meta',
        description: "Technical tags describing the card itself or conditions.",
        suggestedTags: ["SFW", "NSFW", "Roleplay", "MalePOV", "FemalePOV", "AnyPOV"]
    }
];

export const DEFAULT_SKILL_KEYS = [
    "Acrobatics",
    "Animal Handling",
    "Arcana",
    "Athletics",
    "Deception",
    "History",
    "Insight",
    "Intimidation",
    "Investigation",
    "Medicine",
    "Nature",
    "Perception",
    "Performance",
    "Persuasion",
    "Religion",
    "Sleight of Hand",
    "Stealth",
    "Survival"
];