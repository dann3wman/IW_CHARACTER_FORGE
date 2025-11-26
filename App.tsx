
import React, { useState, useEffect } from 'react';
import { CATEGORY_DEFINITIONS } from './constants';
import CategorySelector from './components/CategorySelector';
import SkillChart from './components/SkillChart';
import ProjectManager from './components/ProjectManager';
import { generateCharacterData, generateCharacterImage, constructImagePrompt, generateSeedNames, analyzeProjectStyle, suggestFolders } from './services/geminiService';
import { MarkovNameGenerator } from './services/nameGenerator';
import { PossibleCharacter, TopLevelSchema, Project, SavedCharacter, Folder } from './types';
import { Sparkles, RefreshCw, Wand2, Terminal, AlertCircle, Image as ImageIcon, Download, Settings2, Edit3, X, Save, Menu, ChevronLeft, Dna, Dice5 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  // --- STATE ---
  
  // Tag Selection
  const [selectedTags, setSelectedTags] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('rpg_forge_tags');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to load persisted tags", e);
      return {};
    }
  });
  
  // App Logic
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [character, setCharacter] = useState<PossibleCharacter | null>(() => {
    try {
      const saved = localStorage.getItem('rpg_forge_active_char');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to load persisted character", e);
      return null;
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [activeTab, setActiveTab] = useState<'forge' | 'projects'>('forge');

  // Persistence (Projects)
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Prompt Modal
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');

  // Name Generator Settings
  const [showNameGenSettings, setShowNameGenSettings] = useState(false);
  const [markovSeeds, setMarkovSeeds] = useState<string[]>([]);
  const [markovOrder, setMarkovOrder] = useState(2);
  const [useMarkov, setUseMarkov] = useState(false);
  const [markovMinLength, setMarkovMinLength] = useState(4);
  const [markovMaxLength, setMarkovMaxLength] = useState(12);
  const [isFetchingSeeds, setIsFetchingSeeds] = useState(false);
  const [namePreview, setNamePreview] = useState<string[]>([]);

  // API Key
  const [hasApiKey, setHasApiKey] = useState(false);

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

  // --- EFFECT: Load/Save Projects ---
  useEffect(() => {
    const saved = localStorage.getItem('rpg_forge_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProjects(parsed);
        if (parsed.length > 0 && !activeProjectId) {
           // Restore last active project or first
           setActiveProjectId(parsed[0].id);
        }
      } catch(e) { console.error("Failed to load projects", e); }
    } else {
        // Create default project
        const defaultProj: Project = {
            id: uuidv4(),
            name: 'Default Project',
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
                markovMaxLength: 12
            }
        };
        setProjects([defaultProj]);
        setActiveProjectId(defaultProj.id);
    }
  }, []); // Run once on mount

  useEffect(() => {
    if (projects.length > 0) {
        localStorage.setItem('rpg_forge_projects', JSON.stringify(projects));
    }
  }, [projects]);

  // --- EFFECT: Sync Local Name Settings with Active Project ---
  useEffect(() => {
      const activeProject = projects.find(p => p.id === activeProjectId);
      if (activeProject) {
          setMarkovSeeds(activeProject.settings.markovSeeds || []);
          setMarkovOrder(activeProject.settings.markovOrder || 2);
          setUseMarkov(activeProject.settings.useMarkovNameGen || false);
          setMarkovMinLength(activeProject.settings.markovMinLength || 4);
          setMarkovMaxLength(activeProject.settings.markovMaxLength || 12);
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

  // --- HANDLERS: API Key ---
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

  // --- HANDLERS: Project Management ---
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
              markovMaxLength: 12
          }
      };
      setProjects(prev => [...prev, newProj]);
      setActiveProjectId(newProj.id);
  };

  const handleDeleteProject = (id: string) => {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProjectId === id) setActiveProjectId(null);
  };

  const handleUpdateProjectSettings = (id: string, settings: Partial<Project['settings']>) => {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, settings: { ...p.settings, ...settings } } : p));
  };

  const updateActiveProjectSetting = (settings: Partial<Project['settings']>) => {
      if (activeProjectId) {
          handleUpdateProjectSettings(activeProjectId, settings);
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

      // Create a clean copy of the project and character array to modify
      const updatedProject = { 
          ...activeProject,
          updatedAt: Date.now(),
          characters: [...activeProject.characters]
      };

      const existingIdx = updatedProject.characters.findIndex(c => c.id === savedChar.id);
      
      if (existingIdx >= 0) {
          // Preserve existing folder assignment
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
      setActiveTab('forge');
  };

  // --- HANDLERS: AI Project Tools ---
  const handleAnalyzeStyleAI = async (projectId: string) => {
      const proj = projects.find(p => p.id === projectId);
      if (!proj || proj.characters.length === 0) return;
      setIsGenerating(true);
      try {
        const { pre, post } = await analyzeProjectStyle(proj.characters);
        handleUpdateProjectSettings(projectId, { lockedStylePre: pre, lockedStylePost: post });
        alert("Style extracted and applied to project settings!");
      } catch (e) {
        console.error(e);
        setError("Style analysis failed.");
      } finally {
        setIsGenerating(false);
      }
  };

  const handleOrganizeAI = async (projectId: string) => {
      const proj = projects.find(p => p.id === projectId);
      if (!proj || proj.characters.length === 0) return;
      setIsGenerating(true);
      try {
          const mapping = await suggestFolders(proj.characters);
          
          const newFolders: Folder[] = [];
          // Create a deep-ish copy of characters to modify their folderIds without mutating state directly yet
          const updatedChars = proj.characters.map(c => ({...c}));
          
          Object.entries(mapping).forEach(([folderName, charIds]) => {
              const folderId = uuidv4();
              newFolders.push({ id: folderId, name: folderName });
              
              charIds.forEach(id => {
                  const charIndex = updatedChars.findIndex(c => c.id === id);
                  if (charIndex > -1) {
                      updatedChars[charIndex].folderId = folderId;
                  }
              });
          });

          setProjects(prev => prev.map(p => {
              if (p.id !== projectId) return p;
              return { 
                  ...p, 
                  folders: [...p.folders, ...newFolders], 
                  characters: updatedChars 
              };
          }));
          alert("Project organized!");
      } catch (e) {
          console.error(e);
          setError("Organization failed.");
      } finally {
          setIsGenerating(false);
      }
  };


  // --- HANDLERS: Core Forge ---
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

  const handleFetchSeeds = async () => {
      setIsFetchingSeeds(true);
      try {
          const seeds = await generateSeedNames(selectedTags);
          setMarkovSeeds(seeds);
          updateActiveProjectSetting({ markovSeeds: seeds });
      } catch (e) { console.error(e); }
      finally { setIsFetchingSeeds(false); }
  };

  const handleGenerateBatchPreview = () => {
      if (markovSeeds.length === 0) return;
      const generator = new MarkovNameGenerator(markovSeeds, markovOrder);
      const names = [];
      for (let i = 0; i < 12; i++) {
          names.push(generator.generate(markovMinLength, markovMaxLength));
      }
      setNamePreview(names);
  };

  const handleGenerate = async () => {
    const totalTags = Object.values(selectedTags).reduce((acc: number, curr: string[]) => acc + curr.length, 0);
    if (totalTags < 3) {
        setError("Please select at least 3 tags to guide the generation.");
        return;
    }

    setIsGenerating(true);
    setError(null);
    setCharacter(null);

    try {
      // 1. Determine Name
      let fixedName: string | undefined = undefined;
      if (useMarkov && markovSeeds.length > 0) {
          const generator = new MarkovNameGenerator(markovSeeds, markovOrder);
          fixedName = generator.generate(markovMinLength, markovMaxLength);
      }

      // 2. Determine Style
      const activeProject = projects.find(p => p.id === activeProjectId);
      const fixedStylePre = activeProject?.settings.lockedStylePre;
      const fixedStylePost = activeProject?.settings.lockedStylePost;

      const data = await generateCharacterData({
          tags: selectedTags,
          fixedName,
          fixedStylePre,
          fixedStylePost
      });

      if (data.possibleCharacters.length > 0) {
        const char = data.possibleCharacters[0];
        // Ensure prompt details reflect locked styles if they weren't forced by prompt (redundancy check)
        if (fixedStylePre) char.portraitPromptDetails.illustrStylePre = fixedStylePre;
        if (fixedStylePost) char.portraitPromptDetails.illustrStylePost = fixedStylePost;

        // Ensure ID is set
        if (!char.characterId) char.characterId = uuidv4();

        char.portrait = `https://picsum.photos/seed/${char.characterId}/512/768`;
        setCharacter(char);
      } else {
        setError("AI returned no character data. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate character.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Image Gen Handlers
  const executeImageGeneration = async (prompt: string) => {
      setIsImageGenerating(true);
      try {
        const base64Image = await generateCharacterImage(prompt, imageSize);
        setCharacter(prev => prev ? { ...prev, portrait: base64Image } : null);
      } catch (err) {
        console.error("Image gen failed", err);
      } finally {
        setIsImageGenerating(false);
      }
  };

  const handleQuickGenerateImage = async () => {
    if (!character || !character.portraitPromptDetails) return;
    const prompt = constructImagePrompt(character.portraitPromptDetails);
    await executeImageGeneration(prompt);
  };

  const handleOpenPromptModal = () => {
    if (!character || !character.portraitPromptDetails) return;
    const prompt = constructImagePrompt(character.portraitPromptDetails);
    setCurrentPrompt(prompt);
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


  // --- RENDER ---
  if (!hasApiKey) {
    return ( /* Existing API Key Screen */
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-xl p-8 text-center shadow-2xl animate-fadeIn">
          <div className="w-16 h-16 bg-mythic-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-mythic-700/50">
             <Sparkles className="text-mythic-500 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-3">RPG Character Forge</h1>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            To generate high-quality characters and portraits with Gemini 3 Pro, you need to connect a paid API key.
          </p>
          <button onClick={handleConnectKey} className="w-full bg-mythic-600 hover:bg-mythic-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-mythic-900/50 transition-all flex items-center justify-center gap-2 group">
            <Settings2 className="w-5 h-5" /> Connect API Key
          </button>
           <p className="mt-6 text-xs text-gray-500">
            See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-mythic-400 hover:underline">Billing Documentation</a> for more info.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col md:flex-row">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-full md:w-[450px] bg-gray-900 border-r border-gray-800 flex flex-col h-screen relative z-20">
        
        {/* Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-mythic-500" />
            <h1 className="text-2xl font-bold font-display tracking-wider text-white">RPG FORGE</h1>
          </div>
          <div className="flex gap-4 mt-4 border-b border-gray-800">
              <button 
                onClick={() => setActiveTab('forge')}
                className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'forge' ? 'text-mythic-400 border-b-2 border-mythic-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  Forge
              </button>
              <button 
                onClick={() => setActiveTab('projects')}
                className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'projects' ? 'text-mythic-400 border-b-2 border-mythic-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                  Projects & Files
              </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden relative">
            {activeTab === 'forge' ? (
                <div className="h-full overflow-y-auto custom-scrollbar p-6 pb-24">
                     <div className="flex items-center justify-between mb-4">
                         <p className="text-gray-400 text-sm">Define your character tags.</p>
                         <button onClick={() => setShowNameGenSettings(true)} className="text-xs flex items-center gap-1 text-mythic-400 hover:text-mythic-300">
                             <Dna size={14} /> Name Settings
                         </button>
                     </div>
                     <div className="space-y-4">
                        {CATEGORY_DEFINITIONS.map(cat => (
                            <CategorySelector
                            key={cat.id}
                            category={cat}
                            selectedTags={selectedTags[cat.id] || []}
                            onToggleTag={(tag) => handleToggleTag(cat.id, tag)}
                            onAddCustomTag={(tag) => handleToggleTag(cat.id, tag)}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <ProjectManager 
                    projects={projects}
                    activeProjectId={activeProjectId}
                    onSelectProject={setActiveProjectId}
                    onCreateProject={handleCreateProject}
                    onDeleteProject={handleDeleteProject}
                    onUpdateProjectSettings={handleUpdateProjectSettings}
                    onOrganizeAI={handleOrganizeAI}
                    onAnalyzeStyleAI={handleAnalyzeStyleAI}
                    onLoadCharacter={handleLoadCharacter}
                    onDeleteCharacter={handleDeleteCharacter}
                    onCreateFolder={handleCreateFolder}
                />
            )}
        </div>

        {/* Forge Action Bar (Only visible on Forge tab) */}
        {activeTab === 'forge' && (
            <div className="absolute bottom-0 left-0 w-full bg-gray-900/95 backdrop-blur-md p-4 border-t border-gray-800 z-30">
                {error && (
                    <div className="text-red-400 text-xs flex items-center gap-2 bg-red-900/20 p-2 rounded border border-red-900/50 mb-2">
                    <AlertCircle size={14} /> {error}
                    </div>
                )}
                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-mythic-600 hover:bg-mythic-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-mythic-900/50 transition-all flex items-center justify-center gap-2 group"
                >
                    {isGenerating ? (
                    <RefreshCw className="animate-spin" />
                    ) : (
                    <Wand2 className="group-hover:scale-110 transition-transform" />
                    )}
                    {isGenerating ? "Forging..." : "Generate Character"}
                </button>
            </div>
        )}
      </div>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 bg-gray-950 overflow-y-auto h-screen relative">
        {!character && !isGenerating && (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 p-8 text-center">
            <Terminal size={64} className="mb-4 opacity-20" />
            <h2 className="text-2xl font-display font-semibold mb-2">Awaiting Input</h2>
            <p className="max-w-md">Select your tags on the left and invoke the forge.</p>
          </div>
        )}

        {isGenerating && !character && (
            <div className="h-full flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 border-4 border-mythic-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-display text-mythic-200 animate-pulse">Forging Character...</h2>
            </div>
        )}

        {character && (
          <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fadeIn pb-24">
            {/* Display Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                    <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800">
                        Project: {projects.find(p => p.id === activeProjectId)?.name || 'None'}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSaveCharacter} className="flex items-center gap-2 bg-green-900/30 hover:bg-green-900/50 text-green-400 border border-green-800 px-3 py-1.5 rounded transition-colors text-sm font-medium">
                        <Save size={16} /> Save to Project
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 mb-8">
               {/* Portrait Column */}
               <div className="md:w-1/3 flex flex-col gap-4">
                  <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden border-2 border-gray-800 shadow-2xl bg-gray-900 group">
                    <img 
                      src={character.portrait} 
                      alt={character.name} 
                      className={`w-full h-full object-cover transition-opacity duration-500 ${isImageGenerating ? 'opacity-50 blur-sm' : 'opacity-100'}`}
                    />
                    {isImageGenerating && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <RefreshCw className="animate-spin text-mythic-400 w-10 h-10" />
                        </div>
                    )}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                         <div className="bg-black/70 backdrop-blur-md rounded-lg p-1 border border-gray-600 flex items-center">
                            <select 
                                value={imageSize}
                                onChange={(e) => setImageSize(e.target.value as '1K' | '2K' | '4K')}
                                className="bg-transparent text-xs text-white border-none focus:ring-0 cursor-pointer px-1 outline-none"
                            >
                                <option value="1K">1K</option>
                                <option value="2K">2K</option>
                                <option value="4K">4K</option>
                            </select>
                         </div>
                         <button onClick={handleOpenPromptModal} className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg backdrop-blur-sm border border-gray-600">
                            <Edit3 size={20} />
                         </button>
                         <button onClick={handleQuickGenerateImage} disabled={isImageGenerating} className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg backdrop-blur-sm border border-gray-600">
                            <ImageIcon size={20} />
                         </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Settings2 size={12} /> Visual Prompts
                      </h3>
                      <div className="text-xs text-gray-400 space-y-2 font-mono">
                          <p><span className="text-mythic-400">Style:</span> {character.portraitPromptDetails.illustrStylePre || 'N/A'}</p>
                          <p><span className="text-mythic-400">Appearance:</span> {character.portraitPromptDetails.illustrAppearance}</p>
                          <p><span className="text-mythic-400">Clothing:</span> {character.portraitPromptDetails.illustrClothes}</p>
                      </div>
                  </div>
                  
                  <button onClick={handleExportJson} className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-4 rounded-lg border border-gray-700 flex items-center justify-center gap-2 transition-colors">
                     <Download size={16} /> Export JSON
                  </button>
               </div>

               {/* Stats & Info Column */}
               <div className="md:w-2/3 space-y-6">
                  <div>
                    <h1 className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-mythic-200 to-mythic-600 mb-2">
                        {character.name}
                    </h1>
                    <div className="flex flex-wrap gap-2 text-sm text-mythic-300">
                        <span className="bg-mythic-900/50 px-3 py-1 rounded border border-mythic-800">ID: {character.characterId}</span>
                    </div>
                  </div>

                  <div className="prose prose-invert prose-p:text-gray-300 max-w-none bg-gray-900/50 p-6 rounded-xl border border-gray-800">
                      <p className="leading-relaxed whitespace-pre-line">{character.description}</p>
                  </div>

                  {/* Skills Radar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col items-center justify-center">
                          <h3 className="w-full text-left text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Attribute Radar</h3>
                          <SkillChart skills={character.skills} />
                      </div>

                      <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                           <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Skill Breakdown (Max 5)</h3>
                           <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                               {Object.entries(character.skills).map(([skill, val]) => (
                                   <div key={skill} className="flex flex-col">
                                       <div className="flex justify-between text-xs text-gray-400 mb-1">
                                           <span>{skill}</span>
                                           <span className="text-mythic-400 font-mono">{val as number}/5</span>
                                       </div>
                                       <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                           <div className="bg-mythic-600 h-full rounded-full" style={{ width: `${((val as number) / 5) * 100}%` }}></div>
                                       </div>
                                   </div>
                               ))}
                           </div>
                      </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Name Generator Modal */}
      {showNameGenSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
             <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-6 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                    <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                        <Dna size={20} className="text-mythic-500"/> Name Generator Settings
                    </h3>
                    <button onClick={() => setShowNameGenSettings(false)}><X size={20} className="text-gray-500 hover:text-white" /></button>
                </div>
                
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <span className="text-sm text-gray-300">Enable Markov Generator</span>
                        <input 
                            type="checkbox" 
                            checked={useMarkov} 
                            onChange={(e) => {
                                setUseMarkov(e.target.checked);
                                updateActiveProjectSetting({ useMarkovNameGen: e.target.checked });
                            }}
                            className="w-5 h-5 accent-mythic-600"
                        />
                    </div>

                    {useMarkov && (
                        <div className="space-y-4 animate-fadeIn">
                             <div>
                                 <label className="text-xs text-gray-500 block mb-1">Seed Names (Training Data - One per line)</label>
                                 <textarea 
                                    className="w-full h-32 bg-gray-950 border border-gray-700 rounded p-2 text-xs text-gray-300 font-mono focus:border-mythic-500 outline-none"
                                    value={markovSeeds.join('\n')}
                                    onChange={(e) => {
                                        const seeds = e.target.value.split('\n');
                                        setMarkovSeeds(seeds);
                                        updateActiveProjectSetting({ markovSeeds: seeds });
                                    }}
                                    placeholder="Enter list of names here..."
                                 />
                                 <div className="flex justify-between mt-1 items-center">
                                     <button 
                                        onClick={handleFetchSeeds} 
                                        disabled={isFetchingSeeds}
                                        className="text-xs text-mythic-400 hover:text-mythic-300 flex items-center gap-1 bg-mythic-900/30 px-2 py-1 rounded border border-mythic-800"
                                    >
                                        {isFetchingSeeds ? <RefreshCw size={10} className="animate-spin"/> : <Sparkles size={10} />}
                                        Train from Tags
                                     </button>
                                     <span className="text-xs text-gray-600">{markovSeeds.filter(s => s.trim()).length} seeds</span>
                                 </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Chaos (Order)</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="range" 
                                            min="1" 
                                            max="4" 
                                            step="1"
                                            value={markovOrder}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setMarkovOrder(val);
                                                updateActiveProjectSetting({ markovOrder: val });
                                            }}
                                            className="w-full accent-mythic-600"
                                        />
                                        <span className="text-xs font-mono w-4 text-center">{markovOrder}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500">Lower = More random</span>
                                </div>
                                
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Length Range</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="number" 
                                            className="w-full bg-gray-950 border border-gray-700 rounded text-center text-xs py-1"
                                            value={markovMinLength}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setMarkovMinLength(val);
                                                updateActiveProjectSetting({ markovMinLength: val });
                                            }}
                                        />
                                        <span className="text-gray-500">-</span>
                                        <input 
                                            type="number" 
                                            className="w-full bg-gray-950 border border-gray-700 rounded text-center text-xs py-1"
                                            value={markovMaxLength}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setMarkovMaxLength(val);
                                                updateActiveProjectSetting({ markovMaxLength: val });
                                            }}
                                        />
                                    </div>
                                </div>
                             </div>

                             <div className="p-3 bg-gray-950 rounded border border-gray-800 mt-2">
                                 <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-500 block">Preview Output:</span>
                                    <button 
                                        onClick={handleGenerateBatchPreview} 
                                        disabled={markovSeeds.length === 0}
                                        className="text-xs bg-gray-800 hover:text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                    >
                                        <Dice5 size={12}/> Batch Test
                                    </button>
                                 </div>
                                 <div className="flex flex-wrap gap-2 min-h-[40px] max-h-[100px] overflow-y-auto">
                                     {namePreview.length > 0 ? (
                                         namePreview.map((name, i) => (
                                             <span key={i} className="text-xs bg-mythic-900/40 text-mythic-200 px-2 py-1 rounded border border-mythic-900/60">
                                                 {name}
                                             </span>
                                         ))
                                     ) : (
                                         <span className="text-xs text-gray-600 italic">Add seeds and click Batch Test</span>
                                     )}
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
             </div>
          </div>
      )}

      {/* Prompt Edit Modal */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
               <h3 className="font-display text-lg font-bold text-gray-200 flex items-center gap-2">
                 <Edit3 size={18} className="text-mythic-400" />
                 Edit Image Prompt
               </h3>
               <button onClick={() => setIsPromptModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                 <X size={20} />
               </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
               <textarea 
                  value={currentPrompt}
                  onChange={(e) => setCurrentPrompt(e.target.value)}
                  className="w-full h-48 bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:border-mythic-500 outline-none resize-none font-mono"
               />
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-800/30 flex justify-end gap-3">
               <button onClick={() => setIsPromptModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800">
                 Cancel
               </button>
               <button onClick={handleModalGenerate} className="px-4 py-2 rounded-lg text-sm font-medium bg-mythic-600 hover:bg-mythic-500 text-white shadow-lg shadow-mythic-900/50 flex items-center gap-2">
                 <Wand2 size={16} /> Generate New Image
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
