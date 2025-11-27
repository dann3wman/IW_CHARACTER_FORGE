import React, { useState, useEffect } from 'react';
import { generateCharacterData, generateCharacterImage, constructImagePrompt, generateSeedNames, analyzeProjectStyle, suggestFolders, suggestTagsFromDescription } from './services/geminiService';
import { PossibleCharacter, TopLevelSchema, Project, SavedCharacter, Folder, ProjectSettings } from './types';
import { v4 as uuidv4 } from 'uuid';

import { loadProjectsFromStorage, loadActiveProjectId, loadTagsFromStorage, loadActiveCharacterFromStorage, loadUiState } from './utils/storage';

// Components
import ApiKeyScreen from './components/ApiKeyScreen';
import SettingsModal from './components/SettingsModal';
import GenerationSettingsModal from './components/GenerationSettingsModal';
import PromptEditorModal from './components/PromptEditorModal';
import NavRail from './components/NavRail';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';

const App: React.FC = () => {
  // --- STATE ---
  const uiState = loadUiState();
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'forge' | 'projects'>(uiState.activeTab);

  // Tag Selection
  const [selectedTags, setSelectedTags] = useState<Record<string, string[]>>(() => loadTagsFromStorage());
  
  // App Logic
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [character, setCharacter] = useState<PossibleCharacter | null>(() => loadActiveCharacterFromStorage());
  const [error, setError] = useState<string | null>(null);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  
  // Image Settings
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>(uiState.imageSize);
  const [imageFraming, setImageFraming] = useState<'portrait' | 'full_body'>(uiState.imageFraming);
  const [aspectRatio, setAspectRatio] = useState<string>(uiState.aspectRatio);
  
  // Persistence (Projects)
  const [projects, setProjects] = useState<Project[]>(() => loadProjectsFromStorage());
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => loadActiveProjectId());

  // Modals
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [showGenSettings, setShowGenSettings] = useState(false);
  const [isFetchingSeeds, setIsFetchingSeeds] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // API Key
  const [hasApiKey, setHasApiKey] = useState(false);

  // --- EFFECT: Persist UI State ---
  useEffect(() => {
      localStorage.setItem('rpg_forge_ui_state', JSON.stringify({
          activeTab,
          imageSize,
          imageFraming,
          aspectRatio
      }));
  }, [activeTab, imageSize, imageFraming, aspectRatio]);

  // --- EFFECT: Persist Tags & Character ---
  useEffect(() => {
    localStorage.setItem('rpg_forge_tags', JSON.stringify(selectedTags));
  }, [selectedTags]);

  useEffect(() => {
    if (character) {
      localStorage.setItem('rpg_forge_active_char', JSON.stringify(character));
    } else {
      localStorage.removeItem('rpg_forge_active_char');
    }
  }, [character]);

  // --- EFFECT: Persist Projects ---
  useEffect(() => {
    if (projects.length > 0) {
        localStorage.setItem('rpg_forge_projects', JSON.stringify(projects));
    }
  }, [projects]);

  // --- EFFECT: Persist Active Project ID & Fallback ---
  useEffect(() => {
      if (activeProjectId) {
          localStorage.setItem('rpg_forge_active_project_id', activeProjectId);
      }
      
      if (projects.length > 0) {
          const isValid = projects.some(p => p.id === activeProjectId);
          if (!isValid || !activeProjectId) {
              setActiveProjectId(projects[0].id);
          }
      }
  }, [activeProjectId, projects]);

  // --- EFFECT: API Key Check ---
  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio && typeof (window as any).aistudio.hasSelectedApiKey === 'function') {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const activeProject = projects.find(p => p.id === activeProjectId);

  // --- HANDLERS ---

  const handleConnectKey = async () => {
    if ((window as any).aistudio && typeof (window as any).aistudio.openSelectKey === 'function') {
      try {
        await (window as any).aistudio.openSelectKey();
        setHasApiKey(true);
      } catch (e) {
        console.error("Failed to select key", e);
        setError("Failed to select API key.");
      }
    }
  };

  const handleChangeKey = async () => {
      await handleConnectKey();
      setIsSettingsModalOpen(false);
  };

  const handleResetData = () => {
      if (window.confirm("Are you sure you want to clear all data? This includes all projects, characters, and settings. This cannot be undone.")) {
          localStorage.clear();
          window.location.reload();
      }
  };

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
      alert("Character Saved to Project!");
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
      const proj = projects.find(p => p.id === projectId);
      if (!proj || proj.characters.length === 0) return;
      setIsGenerating(true);
      try {
        const { pre, post } = await analyzeProjectStyle(proj.characters);
        updateActiveProjectSetting({ lockedStylePre: pre, lockedStylePost: post });
        alert("Style extracted and applied to project settings!");
      } catch (e) {
        console.error(e);
      } finally {
        setIsGenerating(false);
      }
  };

  const handleSuggestTags = async (description: string) => {
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
      } catch (e) {
          console.error(e);
          setError("Failed to analyze tags.");
      } finally {
          setIsSuggestingTags(false);
      }
  };

  const handleOrganizeAI = async (projectId: string) => {
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
          alert("Project organized!");
      } catch (e) {
          console.error(e);
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
      setIsFetchingSeeds(true);
      try {
          const convention = activeProject?.settings.namingConvention;
          const seeds = await generateSeedNames(selectedTags, convention);
          updateActiveProjectSetting({ markovSeeds: seeds });
      } catch (e) { console.error(e); }
      finally { setIsFetchingSeeds(false); }
  };

  const handleGenerate = async () => {
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
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate character.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegeneratePrompts = async () => {
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
          }
      } catch (e) {
          console.error(e);
          setError("Failed to regenerate prompts.");
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
      setIsImageGenerating(true);
      try {
        const base64Image = await generateCharacterImage(prompt, imageSize, aspectRatio);
        setCharacter(prev => prev ? { ...prev, portrait: base64Image } : null);
      } catch (err) {
        console.error("Image gen failed", err);
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
      return <ApiKeyScreen onConnect={handleConnectKey} />;
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col md:flex-row overflow-hidden font-sans">
      
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

    </div>
  );
};

export default App;