import React, { useState } from 'react';
import { X, Dna, RefreshCw, Sparkles, Dice5, FileType, Palette, Plus, Trash2, BrainCircuit, Target, Tags, Wand2 } from 'lucide-react';
import { ProjectSettings, ImageGenerationRule } from '../types';
import { MarkovNameGenerator } from '../services/nameGenerator';
import { CATEGORY_DEFINITIONS } from '../constants';
import CategorySelector from './CategorySelector';

interface GenerationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProjectSettings;
  onUpdateSettings: (settings: Partial<ProjectSettings>) => void;
  onFetchSeeds: () => void;
  isFetchingSeeds: boolean;
  onAnalyzeStyle: () => void;
  isAnalyzingStyle: boolean;
  onSuggestTags: (description: string) => void;
}

const GenerationSettingsModal: React.FC<GenerationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onFetchSeeds,
  isFetchingSeeds,
  onAnalyzeStyle,
  isAnalyzingStyle,
  onSuggestTags
}) => {
  const [activeTab, setActiveTab] = useState<'narrative' | 'visual' | 'tags'>('narrative');
  const [namePreview, setNamePreview] = useState<string[]>([]);
  const [worldDescription, setWorldDescription] = useState('');
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  
  // Image Rule State
  const [newRuleTarget, setNewRuleTarget] = useState<string>('all');
  const [newRuleInstruction, setNewRuleInstruction] = useState('');

  if (!isOpen) return null;

  // Name Gen Helpers
  const handleGenerateBatchPreview = () => {
      const seeds = settings.markovSeeds || [];
      if (seeds.length === 0) return;
      const generator = new MarkovNameGenerator(seeds, settings.markovOrder || 2);
      const names = [];
      const min = settings.markovMinLength || 4;
      const max = settings.markovMaxLength || 12;
      for (let i = 0; i < 12; i++) {
          names.push(generator.generate(min, max));
      }
      setNamePreview(names);
  };

  // Rule Helpers
  const handleAddRule = () => {
      if (!newRuleInstruction.trim()) return;
      const newRule: ImageGenerationRule = {
          target: newRuleTarget,
          instruction: newRuleInstruction.trim()
      };
      const currentRules = settings.imageGenerationRules || [];
      onUpdateSettings({
          imageGenerationRules: [...currentRules, newRule]
      });
      setNewRuleInstruction('');
  };

  const handleDeleteRule = (index: number) => {
      const currentRules = settings.imageGenerationRules || [];
      const updatedRules = [...currentRules];
      updatedRules.splice(index, 1);
      onUpdateSettings({ imageGenerationRules: updatedRules });
  };

  // Tag Helpers
  const handleToggleDefaultTag = (categoryId: string, tag: string) => {
      const currentDefaults = settings.defaultTags || {};
      const categoryTags = currentDefaults[categoryId] || [];
      let newCategoryTags;
      
      if (categoryTags.includes(tag)) {
          newCategoryTags = categoryTags.filter(t => t !== tag);
      } else {
          newCategoryTags = [...categoryTags, tag];
      }
      
      onUpdateSettings({
          defaultTags: {
              ...currentDefaults,
              [categoryId]: newCategoryTags
          }
      });
  };

  const handleRunSuggestion = async () => {
      if(!worldDescription.trim()) return;
      setIsSuggestingTags(true);
      try {
          await onSuggestTags(worldDescription);
          setWorldDescription(''); // Clear after success
      } finally {
          setIsSuggestingTags(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                <h3 className="font-display text-lg font-bold text-gray-200 flex items-center gap-2">
                    <Sparkles size={18} className="text-mythic-400" />
                    Generation Settings
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('narrative')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'narrative' ? 'bg-gray-800/50 text-mythic-400 border-b-2 border-mythic-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Narrative & Naming
                </button>
                <button 
                    onClick={() => setActiveTab('visual')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'visual' ? 'bg-gray-800/50 text-mythic-400 border-b-2 border-mythic-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Visual Style & Rules
                </button>
                <button 
                    onClick={() => setActiveTab('tags')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'tags' ? 'bg-gray-800/50 text-mythic-400 border-b-2 border-mythic-500' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Project Tags
                </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                
                {/* --- NARRATIVE TAB --- */}
                {activeTab === 'narrative' && (
                    <div className="space-y-6">
                         {/* Naming Style / Convention Input */}
                        <div>
                            <label className="text-xs text-gray-400 font-semibold block mb-2 flex items-center gap-1">
                                <FileType size={12} /> Naming Convention / Style
                            </label>
                            <input 
                                type="text" 
                                placeholder="e.g. 'Ancient Elven', 'Cyberpunk Street Slang', 'Genshin Impact Liyue'" 
                                value={settings.namingConvention || ''}
                                onChange={(e) => onUpdateSettings({ namingConvention: e.target.value })}
                                className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-gray-200 focus:border-mythic-500 outline-none"
                            />
                            <p className="text-[10px] text-gray-500 mt-1">
                                Guides both AI name generation and the Markov seed trainer.
                            </p>
                        </div>

                        <div className="border-t border-gray-800 pt-4">
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                    <Dna size={16} className="text-mythic-500"/> Markov Name Generator
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Enable</span>
                                    <input 
                                        type="checkbox" 
                                        checked={settings.useMarkovNameGen || false} 
                                        onChange={(e) => onUpdateSettings({ useMarkovNameGen: e.target.checked })}
                                        className="w-4 h-4 accent-mythic-600"
                                    />
                                </div>
                            </div>

                            {settings.useMarkovNameGen && (
                                <div className="space-y-4 animate-fadeIn bg-gray-950/50 p-4 rounded-lg border border-gray-800">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs text-gray-500">Seed Names (Training Data)</label>
                                            <button 
                                                onClick={onFetchSeeds} 
                                                disabled={isFetchingSeeds}
                                                className="text-[10px] text-mythic-400 hover:text-mythic-300 flex items-center gap-1 px-2 py-0.5 rounded border border-mythic-900/50 hover:bg-mythic-900/20 transition-colors"
                                            >
                                                {isFetchingSeeds ? <RefreshCw size={10} className="animate-spin"/> : <Sparkles size={10} />}
                                                Train from Tags
                                            </button>
                                        </div>
                                        <textarea 
                                            className="w-full h-24 bg-gray-900 border border-gray-700 rounded p-2 text-xs text-gray-300 font-mono focus:border-mythic-500 outline-none"
                                            value={(settings.markovSeeds || []).join('\n')}
                                            onChange={(e) => onUpdateSettings({ markovSeeds: e.target.value.split('\n') })}
                                            placeholder="Enter list of names here..."
                                        />
                                        <span className="text-[10px] text-gray-600">{(settings.markovSeeds || []).filter(s => s.trim()).length} seeds loaded</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Coherence (Order: {settings.markovOrder || 2})</label>
                                            <input 
                                                type="range" min="1" max="4" step="1"
                                                value={settings.markovOrder || 2}
                                                onChange={(e) => onUpdateSettings({ markovOrder: parseInt(e.target.value) })}
                                                className="w-full accent-mythic-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Length: {settings.markovMinLength || 4} - {settings.markovMaxLength || 12}</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="number" className="w-full bg-gray-900 border border-gray-700 rounded text-center text-xs py-1"
                                                    value={settings.markovMinLength || 4}
                                                    onChange={(e) => onUpdateSettings({ markovMinLength: parseInt(e.target.value) })}
                                                />
                                                <input 
                                                    type="number" className="w-full bg-gray-900 border border-gray-700 rounded text-center text-xs py-1"
                                                    value={settings.markovMaxLength || 12}
                                                    onChange={(e) => onUpdateSettings({ markovMaxLength: parseInt(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-gray-800">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-gray-500">Preview:</span>
                                            <button 
                                                onClick={handleGenerateBatchPreview} 
                                                disabled={(settings.markovSeeds || []).length === 0}
                                                className="text-xs bg-gray-800 hover:text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                            >
                                                <Dice5 size={12}/> Generate Batch
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 min-h-[30px]">
                                            {namePreview.map((name, i) => (
                                                <span key={i} className="text-xs bg-mythic-900/30 text-mythic-200 px-2 py-1 rounded border border-mythic-900/50">{name}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- VISUAL TAB --- */}
                {activeTab === 'visual' && (
                    <div className="space-y-6">
                        
                        {/* Style Lock */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                    <Palette size={16} className="text-mythic-500"/> Project Art Style
                                </label>
                                <button 
                                    onClick={onAnalyzeStyle}
                                    disabled={isAnalyzingStyle}
                                    className="text-xs text-mythic-400 hover:text-mythic-300 flex items-center gap-1 bg-mythic-900/20 px-2 py-1 rounded border border-mythic-900/50 transition-colors"
                                >
                                    {isAnalyzingStyle ? <RefreshCw size={12} className="animate-spin" /> : <BrainCircuit size={12} />}
                                    Auto-Detect from Project
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-950/50 p-4 rounded-lg border border-gray-800">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Style Pre-Prompt (Medium/Vibe)</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Anime style, Oil Painting"
                                        value={settings.lockedStylePre}
                                        onChange={(e) => onUpdateSettings({ lockedStylePre: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 focus:border-mythic-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Style Post-Prompt (Details/Light)</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Cinematic lighting, 8k resolution"
                                        value={settings.lockedStylePost}
                                        onChange={(e) => onUpdateSettings({ lockedStylePost: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 focus:border-mythic-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Image Gen Rules */}
                        <div className="border-t border-gray-800 pt-4">
                            <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                                <Target size={16} className="text-mythic-500"/> Custom Generation Rules
                            </h4>
                            <p className="text-xs text-gray-500 mb-4">
                                Define instructions that influence how the AI describes specific parts of the image prompt.
                            </p>

                            <div className="space-y-2 mb-4">
                                {(settings.imageGenerationRules || []).map((rule, idx) => (
                                    <div key={idx} className="bg-gray-800 p-3 rounded border border-gray-700 flex items-start justify-between group">
                                        <div className="flex flex-col gap-1 w-full pr-2">
                                            <span className="text-[10px] text-mythic-400 uppercase font-mono border border-mythic-900 bg-mythic-900/20 w-fit px-1.5 rounded-sm">{rule.target}</span>
                                            <p className="text-sm text-gray-200">{rule.instruction}</p>
                                        </div>
                                        <button onClick={() => handleDeleteRule(idx)} className="text-gray-500 hover:text-red-400 p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {(!settings.imageGenerationRules || settings.imageGenerationRules.length === 0) && (
                                    <div className="text-center py-4 border border-dashed border-gray-800 rounded text-gray-600 text-xs">
                                        No custom rules added.
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-950 p-3 rounded border border-gray-800 flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <select 
                                        value={newRuleTarget}
                                        onChange={(e) => setNewRuleTarget(e.target.value)}
                                        className="bg-gray-900 text-xs text-gray-300 border border-gray-700 rounded px-2 py-1.5 outline-none w-1/3 focus:border-mythic-500"
                                    >
                                        <option value="all">All Sections</option>
                                        <option value="illustrAppearance">Appearance</option>
                                        <option value="illustrClothes">Clothes</option>
                                        <option value="illustrExpressionPosition">Pose/Expr</option>
                                        <option value="illustrSetting">Setting</option>
                                    </select>
                                    <input 
                                        type="text"
                                        placeholder="Instruction (e.g. 'Use evocative language', 'Mention glowing elements')"
                                        value={newRuleInstruction}
                                        onChange={(e) => setNewRuleInstruction(e.target.value)}
                                        className="bg-gray-900 text-xs text-gray-300 border border-gray-700 rounded px-2 py-1.5 outline-none flex-1 focus:border-mythic-500"
                                    />
                                </div>
                                <button 
                                    onClick={handleAddRule}
                                    disabled={!newRuleInstruction.trim()}
                                    className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-xs text-gray-300 py-1.5 rounded transition-colors flex items-center justify-center gap-1 font-medium"
                                >
                                    <Plus size={14} /> Add Rule
                                </button>
                            </div>
                        </div>

                    </div>
                )}

                {/* --- PROJECT TAGS TAB --- */}
                {activeTab === 'tags' && (
                    <div className="space-y-6">
                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                <Tags size={16} className="text-mythic-500"/> Project Default Tags
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Tags selected here will be automatically applied to ALL characters generated in this project, merged with any one-off tags you select in the Forge.
                            </p>
                        </div>

                        {/* Auto-Suggest Section */}
                        <div className="bg-gray-950/50 p-4 rounded-lg border border-gray-800 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-semibold text-gray-400 flex items-center gap-2">
                                    <Wand2 size={12} className="text-mythic-400" /> Auto-Suggest from Description
                                </label>
                            </div>
                            <textarea 
                                className="w-full h-20 bg-gray-900 border border-gray-700 rounded p-2 text-xs text-gray-300 focus:border-mythic-500 outline-none resize-none"
                                placeholder="Paste your world description, adventure summary, or lore here..."
                                value={worldDescription}
                                onChange={(e) => setWorldDescription(e.target.value)}
                            />
                            <div className="flex justify-end mt-2">
                                <button 
                                    onClick={handleRunSuggestion}
                                    disabled={isSuggestingTags || !worldDescription.trim()}
                                    className="text-xs bg-mythic-600 hover:bg-mythic-500 disabled:bg-gray-700 disabled:opacity-50 text-white px-3 py-1.5 rounded flex items-center gap-2 transition-all"
                                >
                                    {isSuggestingTags ? <RefreshCw size={12} className="animate-spin"/> : <Sparkles size={12} />}
                                    Analyze & Apply Tags
                                </button>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            {CATEGORY_DEFINITIONS.map(cat => (
                                <CategorySelector
                                    key={cat.id}
                                    category={cat}
                                    selectedTags={(settings.defaultTags || {})[cat.id] || []}
                                    onToggleTag={(tag) => handleToggleDefaultTag(cat.id, tag)}
                                    onAddCustomTag={(tag) => handleToggleDefaultTag(cat.id, tag)}
                                />
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    </div>
  );
};

export default GenerationSettingsModal;