import React, { useState } from 'react';
import { Project, SavedCharacter } from '../types';
import CategorySelector from './CategorySelector';
import ProjectManager from './ProjectManager';
import MagicInput from './MagicInput';
import { CATEGORY_DEFINITIONS } from '../constants';
import { SlidersHorizontal, Wand2, RefreshCw, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface SidebarProps {
  activeTab: 'forge' | 'projects';
  projects: Project[];
  activeProjectId: string | null;
  selectedTags: Record<string, string[]>;
  isGenerating: boolean;
  
  // Project Actions
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
  
  // Tag Actions
  onToggleTag: (catId: string, tag: string) => void;
  onSuggestTags: (desc: string) => Promise<void>;
  onClearTags: () => void;
  isAnalyzingTags: boolean;
  
  // Generation Actions
  onGenerate: () => void;
  onOpenGenSettings: () => void;
  
  // File Actions
  onOrganizeAI: (projectId: string) => void;
  onLoadCharacter: (char: SavedCharacter) => void;
  onDeleteCharacter: (projectId: string, charId: string) => void;
  onCreateFolder: (projectId: string, name: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  projects,
  activeProjectId,
  selectedTags,
  isGenerating,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onToggleTag,
  onSuggestTags,
  onClearTags,
  isAnalyzingTags,
  onGenerate,
  onOpenGenSettings,
  onOrganizeAI,
  onLoadCharacter,
  onDeleteCharacter,
  onCreateFolder
}) => {
  
  const activeProject = projects.find(p => p.id === activeProjectId);
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(true);

  return (
    <div className={`w-full md:w-[380px] bg-gray-900 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col md:h-screen relative z-20 shadow-2xl order-1 md:order-2 transition-all duration-300 ${isMobileCollapsed ? 'h-auto max-h-[120px] md:max-h-full' : 'h-[80vh]'}`}>
      
      {/* Mobile Collapse Toggle */}
      <button 
        onClick={() => setIsMobileCollapsed(!isMobileCollapsed)}
        className="md:hidden w-full flex items-center justify-center p-1 bg-gray-900 border-t border-gray-800 text-gray-500 absolute bottom-0 left-0 z-50"
      >
        {isMobileCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {/* Project Context Header (Always Visible) */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm z-10 shrink-0">
        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Active Project</label>
        <div className="relative">
          <select 
            value={activeProjectId || ''} 
            onChange={(e) => {
               if(e.target.value === 'new') {
                   const name = prompt("New Project Name:");
                   if(name) onCreateProject(name);
               } else {
                   onSelectProject(e.target.value);
               }
            }}
            className="w-full appearance-none bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-200 text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-mythic-900 transition-all"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            <option value="new">+ Create New Project...</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 ${isMobileCollapsed ? 'hidden md:block' : 'block'}`}>
        
        {activeTab === 'forge' && (
          <div className="space-y-6 pb-20">
            
            {/* AI Analyzer */}
            <MagicInput onSuggest={onSuggestTags} isAnalyzing={isAnalyzingTags} />

            {/* Tag List */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Character Tags</h3>
                  <div className="flex gap-2">
                    <button 
                        onClick={onClearTags}
                        className="text-[10px] flex items-center gap-1 text-gray-500 hover:text-red-400 bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded border border-gray-700 transition-all"
                        title="Clear all selected tags"
                    >
                        <Trash2 size={10} /> Clear
                    </button>
                    <button 
                        onClick={onOpenGenSettings}
                        className="text-[10px] flex items-center gap-1 text-mythic-400 hover:text-mythic-300 bg-mythic-900/20 hover:bg-mythic-900/40 px-2 py-1 rounded border border-mythic-900/50 transition-all"
                    >
                        <SlidersHorizontal size={10} /> Config
                    </button>
                  </div>
               </div>
               
               {CATEGORY_DEFINITIONS.map(cat => (
                  <CategorySelector
                    key={cat.id}
                    category={cat}
                    selectedTags={selectedTags[cat.id] || []}
                    projectTags={activeProject?.settings.defaultTags?.[cat.id] || []}
                    onToggleTag={(tag) => onToggleTag(cat.id, tag)}
                    onAddCustomTag={(tag) => onToggleTag(cat.id, tag)}
                  />
               ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <ProjectManager 
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={onSelectProject}
            onCreateProject={onCreateProject}
            onDeleteProject={onDeleteProject}
            onOrganizeAI={onOrganizeAI}
            onLoadCharacter={onLoadCharacter}
            onDeleteCharacter={onDeleteCharacter}
            onCreateFolder={onCreateFolder}
          />
        )}
      </div>

      {/* Forge Action Button (Floating at bottom of Sidebar) */}
      {activeTab === 'forge' && (
        <div className={`absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent pointer-events-none ${isMobileCollapsed ? 'hidden md:block' : 'block'}`}>
          <button 
            onClick={() => {
                onGenerate();
                setIsMobileCollapsed(true); // Auto collapse on generate for mobile
            }}
            disabled={isGenerating}
            className="pointer-events-auto w-full bg-mythic-600 hover:bg-mythic-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl shadow-xl shadow-mythic-900/30 hover:shadow-mythic-600/40 transition-all flex items-center justify-center gap-2 group border border-mythic-500/50"
          >
            {isGenerating ? (
              <RefreshCw className="animate-spin" />
            ) : (
              <Wand2 className="group-hover:scale-110 transition-transform" />
            )}
            <span className="font-display tracking-widest">{isGenerating ? "FORGING..." : "FORGE CHARACTER"}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;