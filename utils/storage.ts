
import { v4 as uuidv4 } from 'uuid';
import { Project, ProjectSettings, PossibleCharacter } from '../types';

const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  lockedStylePre: '',
  lockedStylePost: '',
  useMarkovNameGen: false,
  markovSeeds: [],
  markovOrder: 2,
  markovMinLength: 4,
  markovMaxLength: 12,
  namingConvention: '',
  imageGenerationRules: [],
  defaultTags: {}
};

export const loadTagsFromStorage = (): Record<string, string[]> => {
    try {
        const saved = localStorage.getItem('rpg_forge_tags');
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error("Failed to load persisted tags", e);
        return {};
    }
};

export const loadActiveCharacterFromStorage = (): PossibleCharacter | null => {
    try {
        const saved = localStorage.getItem('rpg_forge_active_char');
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.error("Failed to load persisted character", e);
        return null;
    }
};

export const loadProjectsFromStorage = (): Project[] => {
    try {
        const saved = localStorage.getItem('rpg_forge_projects');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Schema Migration: Ensure all projects have valid settings structure
            // even if loaded from an older version of the app.
            return parsed.map((p: any) => ({
                ...p,
                folders: p.folders || [],
                characters: p.characters || [],
                settings: { 
                    ...DEFAULT_PROJECT_SETTINGS, 
                    ...(p.settings || {}),
                    // Ensure nested arrays/fields in settings are initialized if missing in old data
                    markovSeeds: p.settings?.markovSeeds || [],
                    imageGenerationRules: p.settings?.imageGenerationRules || [],
                    namingConvention: p.settings?.namingConvention || '',
                    defaultTags: p.settings?.defaultTags || {}
                }
            }));
        }
    } catch (e) {
        console.error("Failed to load projects", e);
    }
    
    // Default Initial Project if storage is empty
    return [{
        id: uuidv4(),
        name: 'Default Project',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        folders: [],
        characters: [],
        settings: { ...DEFAULT_PROJECT_SETTINGS }
    }];
};

export const loadActiveProjectId = (): string | null => {
    try {
        return localStorage.getItem('rpg_forge_active_project_id');
    } catch (e) {
        return null;
    }
};

export const loadUiState = () => {
    try {
        const saved = localStorage.getItem('rpg_forge_ui_state');
        if (saved) return JSON.parse(saved);
    } catch(e) {}
    
    return {
        activeTab: 'forge',
        imageSize: '1K',
        imageFraming: 'portrait',
        aspectRatio: '3:4'
    };
};
