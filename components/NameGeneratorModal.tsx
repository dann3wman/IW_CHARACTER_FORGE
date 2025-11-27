
import React, { useState } from 'react';
import { X, Dna, RefreshCw, Sparkles, Dice5, FileType } from 'lucide-react';
import { ProjectSettings } from '../types';
import { MarkovNameGenerator } from '../services/nameGenerator';

interface NameGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProjectSettings; // Only needs the name gen parts, but passing full object for ease type-wise
  onUpdateSettings: (settings: Partial<ProjectSettings>) => void;
  onFetchSeeds: () => void;
  isFetchingSeeds: boolean;
}

const NameGeneratorModal: React.FC<NameGeneratorModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onFetchSeeds,
  isFetchingSeeds
}) => {
  const [namePreview, setNamePreview] = useState<string[]>([]);

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-6 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                <Dna size={20} className="text-mythic-500"/> Name Generator Settings
            </h3>
            <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white" /></button>
        </div>
        
        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            
            {/* Naming Style / Convention Input */}
            <div>
                <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
                    <FileType size={12} /> Naming Convention / Style (Optional)
                </label>
                <input 
                    type="text" 
                    placeholder="e.g. 'Ancient Elven', 'Cyberpunk Street Slang', 'Genshin Impact Liyue'" 
                    value={settings.namingConvention || ''}
                    onChange={(e) => onUpdateSettings({ namingConvention: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-gray-200 focus:border-mythic-500 outline-none"
                />
                <p className="text-[10px] text-gray-600 mt-1">
                    If set, this style guides both the "Train from Tags" seed generation and standard AI name generation.
                </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-800 rounded">
                <span className="text-sm text-gray-300">Enable Markov Generator</span>
                <input 
                    type="checkbox" 
                    checked={settings.useMarkovNameGen || false} 
                    onChange={(e) => {
                        onUpdateSettings({ useMarkovNameGen: e.target.checked });
                    }}
                    className="w-5 h-5 accent-mythic-600"
                />
            </div>

            {settings.useMarkovNameGen && (
                <div className="space-y-4 animate-fadeIn">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Seed Names (Training Data - One per line)</label>
                            <textarea 
                            className="w-full h-32 bg-gray-950 border border-gray-700 rounded p-2 text-xs text-gray-300 font-mono focus:border-mythic-500 outline-none"
                            value={(settings.markovSeeds || []).join('\n')}
                            onChange={(e) => {
                                const seeds = e.target.value.split('\n');
                                onUpdateSettings({ markovSeeds: seeds });
                            }}
                            placeholder="Enter list of names here..."
                            />
                            <div className="flex justify-between mt-1 items-center">
                                <button 
                                onClick={onFetchSeeds} 
                                disabled={isFetchingSeeds}
                                className="text-xs text-mythic-400 hover:text-mythic-300 flex items-center gap-1 bg-mythic-900/30 px-2 py-1 rounded border border-mythic-800"
                            >
                                {isFetchingSeeds ? <RefreshCw size={10} className="animate-spin"/> : <Sparkles size={10} />}
                                Train from Tags & Style
                            </button>
                            <span className="text-xs text-gray-600">{(settings.markovSeeds || []).filter(s => s.trim()).length} seeds</span>
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
                                    value={settings.markovOrder || 2}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        onUpdateSettings({ markovOrder: val });
                                    }}
                                    className="w-full accent-mythic-600"
                                />
                                <span className="text-xs font-mono w-4 text-center">{settings.markovOrder || 2}</span>
                            </div>
                            <span className="text-[10px] text-gray-500">Lower = More random</span>
                        </div>
                        
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Length Range</label>
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    className="w-full bg-gray-950 border border-gray-700 rounded text-center text-xs py-1"
                                    value={settings.markovMinLength || 4}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        onUpdateSettings({ markovMinLength: val });
                                    }}
                                />
                                <span className="text-gray-500">-</span>
                                <input 
                                    type="number" 
                                    className="w-full bg-gray-950 border border-gray-700 rounded text-center text-xs py-1"
                                    value={settings.markovMaxLength || 12}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        onUpdateSettings({ markovMaxLength: val });
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
                                disabled={(settings.markovSeeds || []).length === 0}
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
  );
};

export default NameGeneratorModal;
