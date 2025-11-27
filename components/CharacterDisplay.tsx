
import React from 'react';
import { PossibleCharacter, Project } from '../types';
import SkillChart from './SkillChart';
import { Save, Download, RefreshCw, ImageIcon, Expand, Monitor, Ratio, Edit3, Settings2 } from 'lucide-react';
import { ASPECT_RATIOS } from '../constants';

interface CharacterDisplayProps {
  character: PossibleCharacter;
  projectName: string;
  isImageGenerating: boolean;
  imageSize: '1K' | '2K' | '4K';
  imageFraming: 'portrait' | 'full_body';
  aspectRatio: string;
  
  onSave: () => void;
  onExport: () => void;
  onQuickGenImage: () => void;
  onOpenPromptModal: () => void;
  onSetImageSize: (val: '1K' | '2K' | '4K') => void;
  onSetImageFraming: (val: 'portrait' | 'full_body') => void;
  onSetAspectRatio: (val: string) => void;
  onRegeneratePrompts: () => void;
}

const CharacterDisplay: React.FC<CharacterDisplayProps> = ({
  character,
  projectName,
  isImageGenerating,
  imageSize,
  imageFraming,
  aspectRatio,
  onSave,
  onExport,
  onQuickGenImage,
  onOpenPromptModal,
  onSetImageSize,
  onSetImageFraming,
  onSetAspectRatio,
  onRegeneratePrompts
}) => {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fadeIn pb-24 space-y-4">
    {/* Display Header */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800" aria-label={`Active project ${projectName}`}>
                Project: {projectName}
            </span>
            <span className="text-[11px] text-gray-400 bg-gray-900 px-2 py-1 rounded border border-gray-800" aria-live="polite">
              {isImageGenerating ? 'Generating portrait' : 'Portrait ready'}
            </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button
              onClick={onSave}
              className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-green-900/30 hover:bg-green-900/50 text-green-300 border border-green-800 px-3 py-2 rounded-lg transition-colors text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
            >
                <Save size={16} /> Save to Project
            </button>
            <button
              onClick={onExport}
              className="flex-1 md:flex-none justify-center flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-3 py-2 rounded-lg transition-colors text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mythic-500"
            >
              <Download size={16} /> Export JSON
            </button>
        </div>
    </div>

    <div className="flex flex-col md:flex-row gap-8 mb-8">
       {/* Portrait Column */}
       <div className="md:w-1/3 flex flex-col gap-4">
          <div
            className={`relative w-full rounded-xl overflow-hidden border-2 border-gray-800 shadow-2xl bg-gray-900 group ${aspectRatio === "9:16" ? "aspect-[9/16]" : aspectRatio === "16:9" ? "aspect-[16/9]" : aspectRatio === "1:1" ? "aspect-square" : "aspect-[3/4]"}`}
            aria-busy={isImageGenerating}
          >
            {character.portrait ? (
                <img
                    src={character.portrait}
                    alt={character.name} 
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isImageGenerating ? 'opacity-50 blur-sm' : 'opacity-100'}`}
                />
            ) : (
                <button 
                    onClick={onQuickGenImage}
                    className="absolute inset-0 w-full h-full bg-gray-800/50 hover:bg-gray-800/80 transition-colors flex flex-col items-center justify-center gap-3 group/placeholder text-gray-400 hover:text-mythic-400 border-2 border-dashed border-gray-700 hover:border-mythic-500/50 rounded-xl"
                >
                     <ImageIcon size={48} className="text-gray-600 group-hover/placeholder:text-mythic-500 transition-colors" />
                     <div className="text-center">
                         <span className="block font-display font-bold text-gray-300 group-hover/placeholder:text-white">Generate Portrait</span>
                         <span className="text-xs text-gray-500">Click to visualize</span>
                     </div>
                </button>
            )}

            {isImageGenerating && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <RefreshCw className="animate-spin text-mythic-400 w-10 h-10" />
                </div>
            )}
            
            {/* Image Controls Overlay */}
            <div className="absolute bottom-4 right-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col items-end gap-2">
                 <div className="flex gap-2">
                    {/* Aspect Ratio */}
                    <div className="bg-black/70 backdrop-blur-md rounded-lg p-1 border border-gray-600 flex items-center" title="Aspect Ratio">
                        <span className="p-1 text-gray-400"><Ratio size={14} /></span>
                        <select
                            value={aspectRatio}
                            onChange={(e) => onSetAspectRatio(e.target.value)}
                            aria-label="Aspect ratio"
                            className="bg-transparent text-xs text-white border-none focus:ring-0 cursor-pointer px-1 outline-none appearance-none"
                        >
                            {ASPECT_RATIOS.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                        </select>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    {/* Framing Dropdown */}
                    <div className="bg-black/70 backdrop-blur-md rounded-lg p-1 border border-gray-600 flex items-center" title="Framing">
                        <span className="p-1 text-gray-400"><Expand size={14} /></span>
                        <select
                            value={imageFraming}
                            onChange={(e) => onSetImageFraming(e.target.value as 'portrait' | 'full_body')}
                            aria-label="Framing"
                            className="bg-transparent text-xs text-white border-none focus:ring-0 cursor-pointer px-1 outline-none appearance-none"
                        >
                            <option value="portrait">Portrait</option>
                            <option value="full_body">Full Body</option>
                        </select>
                    </div>

                    {/* Size Dropdown */}
                    <div className="bg-black/70 backdrop-blur-md rounded-lg p-1 border border-gray-600 flex items-center" title="Resolution">
                        <span className="p-1 text-gray-400"><Monitor size={14} /></span>
                        <select
                            value={imageSize}
                            onChange={(e) => onSetImageSize(e.target.value as '1K' | '2K' | '4K')}
                            aria-label="Image size"
                            className="bg-transparent text-xs text-white border-none focus:ring-0 cursor-pointer px-1 outline-none appearance-none"
                        >
                            <option value="1K">1K</option>
                            <option value="2K">2K</option>
                            <option value="4K">4K</option>
                        </select>
                    </div>
                 </div>
                 
                 <div className="flex gap-2">
                    <button onClick={onOpenPromptModal} className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg backdrop-blur-sm border border-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-mythic-500" title="Edit Prompt">
                        <Edit3 size={20} />
                    </button>
                    <button onClick={onQuickGenImage} disabled={isImageGenerating} className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg backdrop-blur-sm border border-gray-600 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-mythic-500" title="Regenerate">
                        <ImageIcon size={20} />
                    </button>
                </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 relative group/prompts">
              <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Settings2 size={12} /> Visual Prompts
                  </h3>
                  <button 
                    onClick={onRegeneratePrompts}
                    className="text-[10px] bg-gray-800 hover:bg-mythic-900/50 text-gray-400 hover:text-mythic-300 px-2 py-1 rounded border border-gray-700 transition-colors flex items-center gap-1"
                    title="Regenerate prompt details based on tags and rules"
                  >
                      <RefreshCw size={10} /> Re-Roll Prompts
                  </button>
              </div>
              <div className="text-xs text-gray-400 space-y-2 font-mono">
                  <p><span className="text-mythic-400">Style:</span> {character.portraitPromptDetails.illustrStylePre || 'N/A'}</p>
                  <p><span className="text-mythic-400">Appearance:</span> {character.portraitPromptDetails.illustrAppearance}</p>
                  <p><span className="text-mythic-400">Clothing:</span> {character.portraitPromptDetails.illustrClothes}</p>
              </div>
          </div>
          
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
  );
};

export default CharacterDisplay;
