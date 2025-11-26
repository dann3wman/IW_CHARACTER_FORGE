
export interface CategoryDefinition {
  id: string;
  description: string;
  suggestedTags: string[];
}

export interface PortraitPromptDetails {
  illustrClothes: string;
  illustrSetting: string;
  illustrAppearance: string;
  illustrExpressionPosition: string;
  illustrStylePre?: string;
  illustrStylePost?: string;
}

export interface CharacterSkills {
  Acrobatics: number;
  "Animal Handling": number;
  Arcana: number;
  Athletics: number;
  Deception: number;
  History: number;
  Insight: number;
  Intimidation: number;
  Investigation: number;
  Medicine: number;
  Nature: number;
  Perception: number;
  Performance: number;
  Persuasion: number;
  Religion: number;
  "Sleight of Hand": number;
  Stealth: number;
  Survival: number;
  [key: string]: number; // Allow flexible indexing
}

export interface PossibleCharacter {
  name: string;
  description: string;
  portrait?: string; // Generated URL or placeholder
  portraitPromptDetails: PortraitPromptDetails;
  fullSizePortrait?: string;
  portraitOptions: (string | null)[];
  fullSizePortraitOptions: (string | null)[];
  currentPortraitIndex: number;
  characterId: string;
  skills: CharacterSkills;
  initialTrackedItemValues: any[];
}

export interface SavedCharacter extends PossibleCharacter {
  id: string; // uuid
  folderId?: string;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
}

export interface ProjectSettings {
  lockedStylePre: string;
  lockedStylePost: string;
  useMarkovNameGen: boolean;
  markovSeeds: string[];
  markovOrder: number;
  markovMinLength: number;
  markovMaxLength: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  folders: Folder[];
  characters: SavedCharacter[];
  settings: ProjectSettings;
}

export interface TopLevelSchema {
  skills: string[];
  possibleCharacters: PossibleCharacter[];
}