import React, { useState, useEffect } from 'react';
import { generateCharacterData, generateCharacterImage, constructImagePrompt, generateSeedNames, analyzeProjectStyle, suggestFolders, suggestTagsFromDescription } from './services/geminiService';
import { PossibleCharacter, TopLevelSchema, Project, SavedCharacter, Folder, ProjectSettings } from './types';
import { v4 as uuidv4 } from 'uuid';

import {
  clearPersistentState,
  loadActiveCharacterFromStorage,
  loadActiveProjectId,
  loadProjectsFromStorage,
  loadTagsFromStorage,
  loadUiState,
  saveActiveCharacterToStorage,
  saveActiveProjectId,
  saveProjectsToStorage,
  saveTagsToStorage,
  saveUiState
} from './utils/storage';

// Components
import ApiKeyScreen from './components/ApiKeyScreen';
import SettingsModal from './components/SettingsModal';
import GenerationSettingsModal from './components/GenerationSettingsModal';
import PromptEditorModal from './components/PromptEditorModal';
import NavRail from './components/NavRail';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import ConfirmModal from './components/ConfirmModal';
import Toast, { ToastMessage, ToastType } from './components/Toast';
import { setGeminiApiKey } from './services/genaiClient';

const App: React.FC = () => {
  // --- STATE ---
  const DEFAULT_UI_STATE = {
    activeTab: 'forge' as const,
    imageSize: '1K' as const,
    imageFraming: 'portrait' as const,
    aspectRatio: '3:4'
  };
  const [isHydrated, setIsHydrated] = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<'forge' | 'projects'>(DEFAULT_UI_STATE.activeTab);

  // Tag Selection
  const [selectedTags, setSelectedTags] = useState<Record<string, string[]>>({});
  
  // App Logic
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [character, setCharacter] = useState<PossibleCharacter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  
  // Image Settings
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>(DEFAULT_UI_STATE.imageSize);
  const [imageFraming, setImageFraming] = useState<'portrait' | 'full_body'>(DEFAULT_UI_STATE.imageFraming);
  const [aspectRatio, setAspectRatio] = useState<string>(DEFAULT_UI_STATE.aspectRatio);
  
  // Persistence (Projects)
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Modals
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [showGenSettings, setShowGenSettings] = useState(false);
  const [isFetchingSeeds, setIsFetchingSeeds] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // API Key
  const [hasApiKey, setHasApiKey] = useState(false);

  const pushToast = (message: string, type: ToastType) => {
    setToasts(prev => [...prev, { id: uuidv4(), message, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- EFFECT: Persist UI State ---
  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const [storedUiState, storedTags, storedCharacter, storedProjects, storedActiveProjectId] = await Promise.all([
        loadUiState(),
        loadTagsFromStorage(),
        loadActiveCharacterFromStorage(),
        loadProjectsFromStorage(),
        loadActiveProjectId()
      ]);

      if (!isMounted) return;

      setActiveTab(storedUiState.activeTab);
      setImageSize(storedUiState.imageSize);
      setImageFraming(storedUiState.imageFraming);
      setAspectRatio(storedUiState.aspectRatio);
      setSelectedTags(storedTags);
      setCharacter(storedCharacter);
      setProjects(storedProjects);
      setActiveProjectId(storedActiveProjectId ?? (storedProjects[0]?.id ?? null));
      setIsHydrated(true);
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    void saveUiState({
      activeTab,
      imageSize,
      imageFraming,
      aspectRatio
    });
  }, [activeTab, imageSize, imageFraming, aspectRatio, isHydrated]);

  // --- EFFECT: Persist Tags & Character ---
  useEffect(() => {
    if (!isHydrated) return;

    void saveTagsToStorage(selectedTags);
  }, [selectedTags, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;

    void saveActiveCharacterToStorage(character);
  }, [character, isHydrated]);

  // --- EFFECT: Persist Projects ---
  useEffect(() => {
    if (!isHydrated) return;

    void saveProjectsToStorage(projects);
  }, [projects, isHydrated]);

  // --- EFFECT: Persist Active Project ID & Fallback ---
  useEffect(() => {
    if (!isHydrated) return;

    void saveActiveProjectId(activeProjectId);

    if (projects.length > 0) {
      const isValid = projects.some(p => p.id === activeProjectId);
      if (!isValid || !activeProjectId) {
        setActiveProjectId(projects[0].id);
      }
    }
  }, [activeProjectId, projects, isHydrated]);

  // --- EFFECT: API Key Check ---
  useEffect(() => {
    const checkKey = async () => {
      let resolvedKey: string | null = null;

      try {
        const studio = (window as any).aistudio;
        if (studio && typeof studio.hasSelectedApiKey === 'function') {
          const has = await studio.hasSelectedApiKey();
          if (has && typeof studio.getSelectedApiKey === 'function') {
            resolvedKey = await studio.getSelectedApiKey();
          }
        }
      } catch (e) {
        console.error('Failed to verify AI Studio key', e);
      }

      if (!resolvedKey && process.env.GEMINI_API_KEY) {
        resolvedKey = process.env.GEMINI_API_KEY;
      }

      setGeminiApiKey(resolvedKey);
      setHasApiKey(Boolean(resolvedKey));
    };
    checkKey();
  }, []);

  const activeProject = projects.find(p => p.id === activeProjectId);

  // --- HANDLERS ---

  const handleConnectKey = async () => {
    const studio = (window as any).aistudio;

    if (studio && typeof studio.openSelectKey === 'function') {
      try {
        await studio.openSelectKey();
        let selectedKey: string | null = null;

        if (typeof studio.getSelectedApiKey === 'function') {
          selectedKey = await studio.getSelectedApiKey();
        }

        setHasApiKey(Boolean(selectedKey));
        setGeminiApiKey(selectedKey);

        if (selectedKey) {
          pushToast('API key connected', 'success');
        } else {
          setError("Please select an API key to continue.");
          pushToast('Please select an API key to continue.', 'error');
        }
      } catch (e) {
        console.error("Failed to select key", e);
        setError("Failed to select API key.");
        pushToast('Failed to select API key.', 'error');
      }
    } else if (process.env.GEMINI_API_KEY) {
      setGeminiApiKey(process.env.GEMINI_API_KEY);
      setHasApiKey(true);
      pushToast('Using GEMINI_API_KEY from environment.', 'info');
    } else {
      setHasApiKey(false);
      setError("No API key provider is available.");
      pushToast('No API key provider is available.', 'error');
    }
  };

  const handleChangeKey = async () => {
      await handleConnectKey();
      setIsSettingsModalOpen(false);
  };

  const handleResetData = () => {
      setIsResetConfirmOpen(true);
  };

  const confirmResetData = async () => {
      setIsResetConfirmOpen(false);
      await clearPersistentState();
      pushToast('All data cleared. Reloading...', 'info');
      window.location.reload();
  };

  const cancelResetData = () => setIsResetConfirmOpen(false);

  // Project Management Handlers
  const handleCreateProject = (name: string) => {
      const newProj: Project = {
          id: uuidv4(),
          name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          folders: [],
          characters: [],
          settings: { 
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
          }
      };
      setProjects(prev => [...prev, newProj]);
      setActiveProjectId(newProj.id);
  };

  const handleDeleteProject = (id: string) => {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProjectId === id) setActiveProjectId(null);
  };

  const updateActiveProjectSetting = (settings: Partial<Project['settings']>) => {
      if (activeProjectId) {
          setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, settings: { ...p.settings, ...settings } } : p));
      }
  };

  const handleCreateFolder = (projectId: string, name: string) => {
      const newFolder: Folder = { id: uuidv4(), name };
      setProjects(prev => prev.map(p => {
          if (p.id !== projectId) return p;
          return { ...p, folders: [...p.folders, newFolder] };
      }));
  };

  const handleSaveCharacter = () => {
      if (!character || !activeProjectId) return;
      const activeProject = projects.find(p => p.id === activeProjectId);
      if (!activeProject) return;

      const savedChar: SavedCharacter = {
          ...character,
          id: character.characterId && character.characterId.length > 5 ? character.characterId : uuidv4(),
          createdAt: Date.now()
      };

      const updatedProject = { 
          ...activeProject,
          updatedAt: Date.now(),
          characters: [...activeProject.characters]
      };

      const existingIdx = updatedProject.characters.findIndex(c => c.id === savedChar.id);
      if (existingIdx >= 0) {
          savedChar.folderId = updatedProject.characters[existingIdx].folderId;
          updatedProject.characters[existingIdx] = savedChar;
      } else {
          updatedProject.characters.push(savedChar);
      }

      setProjects(prev => prev.map(p => p.id === activeProjectId ? updatedProject : p));
      pushToast('Character saved to project.', 'success');
  };

  const handleDeleteCharacter = (projectId: string, charId: string) => {
      setProjects(prev => prev.map(p => {
          if (p.id !== projectId) return p;
          return { ...p, characters: p.characters.filter(c => c.id !== charId) };
      }));
  };

  const handleLoadCharacter = (char: SavedCharacter) => {
      setCharacter(char);
      // Don't switch tab automatically, users might want to manage files
  };

  // AI Handlers
  const handleAnalyzeStyleAI = async (projectId: string) => {
      if (!hasApiKey) {
          setError("Connect an API key to analyze project style.");
          pushToast('Connect an API key to analyze project style.', 'error');
          return;
      }
      const proj = projects.find(p => p.id === projectId);
      if (!proj || proj.characters.length === 0) return;
      setIsGenerating(true);
      try {
        const { pre, post } = await analyzeProjectStyle(proj.characters);
        updateActiveProjectSetting({ lockedStylePre: pre, lockedStylePost: post });
        pushToast('Style extracted and applied to project settings.', 'success');
        setError(null);
      } catch (e) {
        console.error(e);
        setError("Failed to analyze style. Please retry.");
        pushToast('Failed to analyze style. Please retry.', 'error');
      } finally {
        setIsGenerating(false);
      }
  };

  const handleSuggestTags = async (description: string) => {
      if (!hasApiKey) {
          setError("Connect an API key to suggest tags.");
          pushToast('Connect an API key to suggest tags.', 'error');
          return;
      }
      setIsSuggestingTags(true);
      try {
          const suggestions = await suggestTagsFromDescription(description);
          // Merge into selectedTags for immediate feedback, don't save to defaults automatically unless desired
          // Decision: Add to current session tags so user can see/tweak them
          setSelectedTags(prev => {
              const newTags = { ...prev };
              Object.entries(suggestions).forEach(([catId, tags]) => {
                  const existing = newTags[catId] || [];
                  newTags[catId] = Array.from(new Set([...existing, ...tags]));
              });
              return newTags;
          });
          setError(null);
      } catch (e) {
          console.error(e);
          setError("Failed to analyze tags.");
          pushToast('Failed to analyze tags from description.', 'error');
      } finally {
          setIsSuggestingTags(false);
      }
  };

  const handleOrganizeAI = async (projectId: string) => {
      if (!hasApiKey) {
          setError("Connect an API key to organize projects.");
          pushToast('Connect an API key to organize projects.', 'error');
          return;
      }
      const proj = projects.find(p => p.id === projectId);
      if (!proj || proj.characters.length === 0) return;
      setIsGenerating(true);
      try {
          const mapping = await suggestFolders(proj.characters);
          const newFolders: Folder[] = [];
          const updatedChars = proj.characters.map(c => ({...c}));
          Object.entries(mapping).forEach(([folderName, charIds]) => {
              const folderId = uuidv4();
              newFolders.push({ id: folderId, name: folderName });
              charIds.forEach(id => {
                  const charIndex = updatedChars.findIndex(c => c.id === id);
                  if (charIndex > -1) updatedChars[charIndex].folderId = folderId;
              });
          });
          setProjects(prev => prev.map(p => {
              if (p.id !== projectId) return p;
              return { ...p, folders: [...p.folders, ...newFolders], characters: updatedChars };
          }));
          pushToast('Project organized!', 'success');
          setError(null);
      } catch (e) {
          console.error(e);
          setError("Failed to organize project.");
          pushToast('Failed to organize project.', 'error');
      } finally {
          setIsGenerating(false);
      }
  };

  const handleToggleTag = (categoryId: string, tag: string) => {
    setSelectedTags(prev => {
      const currentTags = prev[categoryId] || [];
      if (currentTags.includes(tag)) {
        return { ...prev, [categoryId]: currentTags.filter(t => t !== tag) };
      } else {
        return { ...prev, [categoryId]: [...currentTags, tag] };
      }
    });
  };

  const handleClearTags = () => {
      setSelectedTags({});
  };

  const handleFetchSeeds = async () => {
      if (!hasApiKey) {
          setError("Connect an API key to fetch seed names.");
          pushToast('Connect an API key to fetch seed names.', 'error');
          return;
      }
      setIsFetchingSeeds(true);
      try {
          const convention = activeProject?.settings.namingConvention;
          const seeds = await generateSeedNames(selectedTags, convention);
          updateActiveProjectSetting({ markovSeeds: seeds });
          pushToast('Seed names refreshed from Gemini.', 'success');
          setError(null);
      } catch (e) { 
          console.error(e); 
          setError("Failed to fetch seed names.");
          pushToast('Failed to fetch seed names.', 'error');
      }
      finally { setIsFetchingSeeds(false); }
  };

  const handleGenerate = async () => {
    if (!hasApiKey) {
        setError("Connect an API key to generate characters.");
        pushToast('Connect an API key to generate characters.', 'error');
        return;
    }
    const totalTags = (Object.values(selectedTags) as string[][]).reduce((acc, curr) => acc + curr.length, 0);
    if (totalTags < 3) {
        setError("Please select at least 3 tags.");
        return;
    }

    setIsGenerating(true);
    setError(null);
    setCharacter(null);

    try {
      let fixedName: string | undefined = undefined;
      if (activeProject && activeProject.settings.useMarkovNameGen && activeProject.settings.markovSeeds.length > 0) {
           const { MarkovNameGenerator } = await import('./services/nameGenerator');
           const { markovSeeds, markovOrder, markovMinLength, markovMaxLength } = activeProject.settings;
           const generator = new MarkovNameGenerator(markovSeeds, markovOrder);
           fixedName = generator.generate(markovMinLength, markovMaxLength);
      }

      const fixedStylePre = activeProject?.settings.lockedStylePre;
      const fixedStylePost = activeProject?.settings.lockedStylePost;
      const imageGenerationRules = activeProject?.settings.imageGenerationRules || [];
      const namingConvention = activeProject?.settings.namingConvention;
      const defaultTags: Record<string, string[]> = activeProject?.settings.defaultTags || {};

      const mergedTags: Record<string, string[]> = { ...selectedTags };
      Object.entries(defaultTags).forEach(([catId, tags]) => {
          const existing = mergedTags[catId] || [];
          mergedTags[catId] = Array.from(new Set([...existing, ...tags]));
      });

      const data = await generateCharacterData({
          tags: mergedTags,
          fixedName,
          fixedStylePre,
          fixedStylePost,
          imageGenerationRules,
          namingConvention
      });

      if (data.possibleCharacters.length > 0) {
        const char = data.possibleCharacters[0];
        if (fixedStylePre) char.portraitPromptDetails.illustrStylePre = fixedStylePre;
        if (fixedStylePost) char.portraitPromptDetails.illustrStylePost = fixedStylePost;
        if (!char.characterId) char.characterId = uuidv4();
        setCharacter(char);
        setError(null);
      }
    } catch (err: any) {
      const message = err?.message || "Failed to generate character.";
      setError(message);
      pushToast(message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegeneratePrompts = async () => {
      if (!hasApiKey) {
          setError("Connect an API key to regenerate prompts.");
          pushToast('Connect an API key to regenerate prompts.', 'error');
          return;
      }
      if (!character) return;
      setIsGenerating(true);
      try {
          const fixedStylePre = activeProject?.settings.lockedStylePre;
          const fixedStylePost = activeProject?.settings.lockedStylePost;
          const imageGenerationRules = activeProject?.settings.imageGenerationRules || [];
          const defaultTags: Record<string, string[]> = activeProject?.settings.defaultTags || {};
          const mergedTags: Record<string, string[]> = { ...selectedTags };
          Object.entries(defaultTags).forEach(([catId, tags]) => {
              const existing = mergedTags[catId] || [];
              mergedTags[catId] = Array.from(new Set([...existing, ...tags]));
          });

          const data = await generateCharacterData({
              tags: mergedTags, 
              fixedStylePre,
              fixedStylePost,
              imageGenerationRules,
              regeneratePromptsOnly: true,
              existingCharacter: character
          });

          if (data.possibleCharacters.length > 0) {
              const newChar = data.possibleCharacters[0];
              setCharacter(prev => prev ? { ...prev, portraitPromptDetails: newChar.portraitPromptDetails } : null);
              setError(null);
          }
      } catch (e) {
          console.error(e);
          setError("Failed to regenerate prompts.");
          pushToast('Failed to regenerate prompts.', 'error');
      } finally {
          setIsGenerating(false);
      }
  };

  const getPromptPrefix = () => {
      return imageFraming === 'full_body' 
        ? "Full body shot, wide angle showing entire figure from head to toe, " 
        : "Close-up portrait bust shot, detailed face, ";
  };

  const executeImageGeneration = async (prompt: string) => {
      if (!hasApiKey) {
        setError("Connect an API key to generate images.");
        pushToast('Connect an API key to generate images.', 'error');
        return;
      }
      setIsImageGenerating(true);
      try {
        const base64Image = await generateCharacterImage(prompt, imageSize, aspectRatio);
        setCharacter(prev => prev ? { ...prev, portrait: base64Image } : null);
        setError(null);
      } catch (err) {
        console.error("Image gen failed", err);
        const baseMessage = err instanceof Error ? err.message : 'Image generation failed.';
        const message = `${baseMessage} Please retry or adjust your prompt after confirming your API key.`;
        setError(message);
        pushToast(message, 'error');
      } finally {
        setIsImageGenerating(false);
      }
  };

  const handleQuickGenerateImage = async () => {
    if (!character || !character.portraitPromptDetails) return;
    const basePrompt = constructImagePrompt(character.portraitPromptDetails);
    await executeImageGeneration(getPromptPrefix() + basePrompt);
  };

  const handleOpenPromptModal = () => {
    if (!character || !character.portraitPromptDetails) return;
    const basePrompt = constructImagePrompt(character.portraitPromptDetails);
    setCurrentPrompt(getPromptPrefix() + basePrompt);
    setIsPromptModalOpen(true);
  };

  const handleModalGenerate = async () => {
    setIsPromptModalOpen(false);
    await executeImageGeneration(currentPrompt);
  };

  const handleExportJson = () => {
    if (!character) return;
    const exportData: TopLevelSchema = {
      skills: Object.keys(character.skills),
      possibleCharacters: [character]
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${character.name.replace(/\s+/g, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (!hasApiKey) {
      return (
        <>
          <Toast toasts={toasts} onDismiss={dismissToast} />
          <ApiKeyScreen onConnect={handleConnectKey} />
        </>
      );
  }

  return (
    <>
      <Toast toasts={toasts} onDismiss={dismissToast} />
      <div className="min-h-screen bg-black text-gray-100 flex flex-col md:flex-row overflow-hidden font-sans">

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-900/40 border border-red-700 text-red-100 px-4 py-2 rounded-lg z-40 shadow-xl">
          {error}
        </div>
      )}

      {/* 1. Navigation Rail */}
      <NavRail
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* 2. Context Sidebar (Tags or Projects) */}
      <Sidebar 
        activeTab={activeTab}
        projects={projects}
        activeProjectId={activeProjectId}
        selectedTags={selectedTags}
        isGenerating={isGenerating}
        onSelectProject={setActiveProjectId}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onToggleTag={handleToggleTag}
        onSuggestTags={handleSuggestTags}
        onClearTags={handleClearTags}
        isAnalyzingTags={isSuggestingTags}
        onGenerate={handleGenerate}
        onOpenGenSettings={() => setShowGenSettings(true)}
        onOrganizeAI={(pid) => handleOrganizeAI(pid)}
        onLoadCharacter={handleLoadCharacter}
        onDeleteCharacter={handleDeleteCharacter}
        onCreateFolder={handleCreateFolder}
      />

      {/* 3. Main Workspace */}
      <Workspace 
        character={character}
        isGenerating={isGenerating}
        projectName={activeProject?.name || 'None'}
        isImageGenerating={isImageGenerating}
        imageSize={imageSize}
        imageFraming={imageFraming}
        aspectRatio={aspectRatio}
        onSave={handleSaveCharacter}
        onExport={handleExportJson}
        onQuickGenImage={handleQuickGenerateImage}
        onOpenPromptModal={handleOpenPromptModal}
        onSetImageSize={setImageSize}
        onSetImageFraming={setImageFraming}
        onSetAspectRatio={setAspectRatio}
        onRegeneratePrompts={handleRegeneratePrompts}
      />

      {/* Modals */}
      {activeProject && (
        <GenerationSettingsModal 
            isOpen={showGenSettings}
            onClose={() => setShowGenSettings(false)}
            settings={activeProject.settings}
            onUpdateSettings={updateActiveProjectSetting}
            onFetchSeeds={handleFetchSeeds}
            isFetchingSeeds={isFetchingSeeds}
            onAnalyzeStyle={() => activeProjectId && handleAnalyzeStyleAI(activeProjectId)}
            isAnalyzingStyle={isGenerating} 
            onSuggestTags={(desc) => {
                // This handler is for the modal's "Project Tags" tab suggestion feature
                // which saves to defaults, distinct from the Sidebar one
                handleSuggestTags(desc).then(() => {
                    // Logic to move suggested tags to defaults if that was the intent
                    // For now, reusing the logic or letting user pick from the selectors in the modal
                });
            }}
        />
      )}

      <PromptEditorModal 
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        prompt={currentPrompt}
        onPromptChange={setCurrentPrompt}
        onGenerate={handleModalGenerate}
        framing={imageFraming}
        onFramingChange={setImageFraming}
        size={imageSize}
        onSizeChange={setImageSize}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onChangeKey={handleChangeKey}
        onResetData={handleResetData}
      />

      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onCancel={cancelResetData}
        onConfirm={confirmResetData}
        title="Reset all data?"
        description="This will clear all local projects, characters, and settings. This action cannot be undone."
        confirmLabel="Yes, clear everything"
      />

    </div>
    </>
  );
};

export default App;