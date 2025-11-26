import React, { useState } from 'react';
import { Project, SavedCharacter, Folder } from '../types';
import { Folder as FolderIcon, FolderPlus, Plus, FileText, Trash2, Wand2, BrainCircuit, Save } from 'lucide-react';

interface ProjectManagerProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
  onUpdateProjectSettings: (id: string, settings: Partial<Project['settings']>) => void;
  onOrganizeAI: (projectId: string) => void;
  onAnalyzeStyleAI: (projectId: string) => void;
  onLoadCharacter: (char: SavedCharacter) => void;
  onDeleteCharacter: (projectId: string, charId: string) => void;
  onCreateFolder: (projectId: string, name: string) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onUpdateProjectSettings,
  onOrganizeAI,
  onAnalyzeStyleAI,
  onLoadCharacter,
  onDeleteCharacter,
  onCreateFolder
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  const activeProject = projects.find(p => p.id === activeProjectId);

  // Group characters by folder
  const getGroupedCharacters = () => {
    if (!activeProject) return {};
    const groups: Record<string, SavedCharacter[]> = { 'root': [] };
    
    activeProject.folders.forEach(f => groups[f.id] = []);
    
    activeProject.characters.forEach(c => {
      if (c.folderId && groups[c.folderId]) {
        groups[c.folderId].push(c);
      } else {
        groups['root'].push(c);
      }
    });
    return groups;
  };

  const groupedChars = getGroupedCharacters();

  return (
    <div className="bg-gray-900 h-full p-4 flex flex-col overflow-hidden">
        {/* Project Selector */}
        <div className="mb-6">
            <h2 className="text-xl font-display font-bold text-white mb-3">Projects</h2>
            <div className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    placeholder="New Project Name" 
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="flex-1 bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300"
                />
                <button 
                    onClick={() => { if(newProjectName) { onCreateProject(newProjectName); setNewProjectName(''); }}}
                    className="bg-mythic-600 hover:bg-mythic-500 text-white p-2 rounded"
                >
                    <Plus size={18} />
                </button>
            </div>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                {projects.map(p => (
                    <div 
                        key={p.id} 
                        onClick={() => onSelectProject(p.id)}
                        className={`
                            flex items-center justify-between p-2 rounded cursor-pointer transition-colors
                            ${activeProjectId === p.id ? 'bg-mythic-900/50 border border-mythic-700' : 'hover:bg-gray-800 border border-transparent'}
                        `}
                    >
                        <span className="text-sm font-medium text-gray-200">{p.name}</span>
                        <div className="flex gap-2">
                             <span className="text-xs text-gray-500">{p.characters.length} chars</span>
                             {activeProjectId !== p.id && (
                                <button onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); }} className="text-gray-600 hover:text-red-400">
                                    <Trash2 size={14} />
                                </button>
                             )}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {activeProject && (
            <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-4 border-t border-gray-800 pt-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center justify-between">
                        Project Style Settings
                        <button 
                            onClick={() => onAnalyzeStyleAI(activeProject.id)}
                            className="text-xs text-mythic-400 hover:text-mythic-300 flex items-center gap-1"
                            title="Analyze existing characters to unify style"
                        >
                            <BrainCircuit size={12} /> Auto-Detect
                        </button>
                    </h3>
                    <div className="space-y-2">
                        <input 
                            type="text" 
                            placeholder="Locked Style Pre (e.g. Anime)"
                            value={activeProject.settings.lockedStylePre}
                            onChange={(e) => onUpdateProjectSettings(activeProject.id, { lockedStylePre: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300"
                        />
                         <input 
                            type="text" 
                            placeholder="Locked Style Post (e.g. Cinematic)"
                            value={activeProject.settings.lockedStylePost}
                            onChange={(e) => onUpdateProjectSettings(activeProject.id, { lockedStylePost: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                     <div className="flex items-center justify-between mb-3">
                         <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Files</h3>
                         <div className="flex gap-2">
                             <button 
                                onClick={() => onOrganizeAI(activeProject.id)}
                                className="text-xs bg-gray-800 hover:text-mythic-400 text-gray-400 px-2 py-1 rounded flex items-center gap-1"
                                title="AI Organize Folders"
                             >
                                <Wand2 size={12} /> Sort
                             </button>
                             <div className="flex items-center bg-gray-950 rounded border border-gray-700">
                                <input 
                                    type="text"
                                    placeholder="New Folder"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    className="w-20 bg-transparent text-xs px-2 py-1 focus:outline-none"
                                />
                                <button 
                                    onClick={() => { if(newFolderName) { onCreateFolder(activeProject.id, newFolderName); setNewFolderName(''); }}}
                                    className="px-2 py-1 hover:text-white text-gray-500"
                                >
                                    <FolderPlus size={14} />
                                </button>
                             </div>
                         </div>
                     </div>

                     {/* Folders */}
                     {activeProject.folders.map(folder => (
                         <div key={folder.id} className="mb-4">
                             <div className="flex items-center gap-2 text-mythic-300 mb-2 px-2">
                                 <FolderIcon size={14} />
                                 <span className="text-sm font-semibold">{folder.name}</span>
                             </div>
                             <div className="pl-4 border-l-2 border-gray-800 ml-2 space-y-1">
                                 {groupedChars[folder.id]?.map(char => (
                                     <CharacterRow 
                                        key={char.id} 
                                        char={char} 
                                        onLoad={() => onLoadCharacter(char)}
                                        onDelete={() => onDeleteCharacter(activeProject.id, char.id)}
                                     />
                                 ))}
                                 {(!groupedChars[folder.id] || groupedChars[folder.id].length === 0) && (
                                     <p className="text-xs text-gray-600 italic px-2">Empty</p>
                                 )}
                             </div>
                         </div>
                     ))}

                     {/* Root Files */}
                     <div className="space-y-1 mt-2">
                         {groupedChars['root']?.map(char => (
                             <CharacterRow 
                                key={char.id} 
                                char={char} 
                                onLoad={() => onLoadCharacter(char)}
                                onDelete={() => onDeleteCharacter(activeProject.id, char.id)}
                             />
                         ))}
                     </div>
                </div>
            </div>
        )}
    </div>
  );
};

const CharacterRow = ({ char, onLoad, onDelete }: { char: SavedCharacter, onLoad: () => void, onDelete: () => void }) => (
    <div className="group flex items-center justify-between p-2 rounded hover:bg-gray-800 transition-colors">
        <button onClick={onLoad} className="flex items-center gap-2 text-left flex-1">
            <FileText size={14} className="text-gray-500 group-hover:text-mythic-400" />
            <span className="text-xs text-gray-300 group-hover:text-white truncate max-w-[150px]">{char.name}</span>
        </button>
        <button onClick={onDelete} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 size={12} />
        </button>
    </div>
);

export default ProjectManager;