
import { v4 as uuidv4 } from 'uuid';
import { Project, ProjectSettings, PossibleCharacter } from '../types';

const DB_NAME = 'rpg_forge_db';
const STORE_NAME = 'state';
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

const inMemoryStore = new Map<string, unknown>();

const isIndexedDbAvailable = () => typeof indexedDB !== 'undefined';

const openDb = (): Promise<IDBDatabase | null> => {
  if (!isIndexedDbAvailable()) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getItem = async <T>(key: string): Promise<T | undefined> => {
  const db = await openDb();

  if (!db) {
    return inMemoryStore.get(key) as T | undefined;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result as T | undefined);
    };

    request.onerror = () => reject(request.error);
  });
};

const setItem = async <T>(key: string, value: T): Promise<void> => {
  const db = await openDb();

  if (!db) {
    inMemoryStore.set(key, structuredClone(value));
    return;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value as unknown, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const removeItem = async (key: string): Promise<void> => {
  const db = await openDb();

  if (!db) {
    inMemoryStore.delete(key);
    return;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const clearStore = async () => {
  const db = await openDb();

  if (!db) {
    inMemoryStore.clear();
    return;
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve(null);
    request.onerror = () => reject(request.error);
  });
};

export const loadTagsFromStorage = async (): Promise<Record<string, string[]>> => {
  try {
    const saved = await getItem<Record<string, string[]>>('rpg_forge_tags');
    return saved || {};
  } catch (e) {
    console.error('Failed to load persisted tags', e);
    return {};
  }
};

export const saveTagsToStorage = async (tags: Record<string, string[]>) => {
  await setItem('rpg_forge_tags', tags);
};

export const loadActiveCharacterFromStorage = async (): Promise<PossibleCharacter | null> => {
  try {
    const saved = await getItem<PossibleCharacter>('rpg_forge_active_char');
    return saved || null;
  } catch (e) {
    console.error('Failed to load persisted character', e);
    return null;
  }
};

export const saveActiveCharacterToStorage = async (character: PossibleCharacter | null) => {
  if (character) {
    await setItem('rpg_forge_active_char', character);
  } else {
    await removeItem('rpg_forge_active_char');
  }
};

export const loadProjectsFromStorage = async (): Promise<Project[]> => {
  try {
    const saved = await getItem<Project[]>('rpg_forge_projects');
    if (saved) {
      return saved.map((p: any) => ({
        ...p,
        folders: p.folders || [],
        characters: p.characters || [],
        settings: {
          ...DEFAULT_PROJECT_SETTINGS,
          ...(p.settings || {}),
          markovSeeds: p.settings?.markovSeeds || [],
          imageGenerationRules: p.settings?.imageGenerationRules || [],
          namingConvention: p.settings?.namingConvention || '',
          defaultTags: p.settings?.defaultTags || {}
        }
      }));
    }
  } catch (e) {
    console.error('Failed to load projects', e);
  }

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

export const saveProjectsToStorage = async (projects: Project[]) => {
  if (projects.length === 0) {
    await removeItem('rpg_forge_projects');
    return;
  }

  await setItem('rpg_forge_projects', projects);
};

export const loadActiveProjectId = async (): Promise<string | null> => {
  try {
    const saved = await getItem<string>('rpg_forge_active_project_id');
    return saved || null;
  } catch (e) {
    console.error('Failed to load active project id', e);
    return null;
  }
};

export const saveActiveProjectId = async (id: string | null) => {
  if (id) {
    await setItem('rpg_forge_active_project_id', id);
  } else {
    await removeItem('rpg_forge_active_project_id');
  }
};

type UiState = {
  activeTab: 'forge' | 'projects';
  imageSize: '1K' | '2K' | '4K';
  imageFraming: 'portrait' | 'full_body';
  aspectRatio: string;
};

export const loadUiState = async (): Promise<UiState> => {
  try {
    const saved = await getItem<UiState>('rpg_forge_ui_state');
    if (saved) return saved;
  } catch (e) {
    console.error('Failed to load UI state', e);
  }

  return {
    activeTab: 'forge',
    imageSize: '1K',
    imageFraming: 'portrait',
    aspectRatio: '3:4'
  };
};

export const saveUiState = async (uiState: UiState) => {
  await setItem('rpg_forge_ui_state', uiState);
};

export const clearPersistentState = async () => {
  await clearStore();
};
