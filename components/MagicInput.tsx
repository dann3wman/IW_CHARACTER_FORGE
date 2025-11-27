import React, { useState } from 'react';
import { Wand2, Sparkles, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';

interface MagicInputProps {
  onSuggest: (description: string) => Promise<void>;
  isAnalyzing: boolean;
}

const MagicInput: React.FC<MagicInputProps> = ({ onSuggest, isAnalyzing }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await onSuggest(text);
    setText('');
    setIsOpen(false);
  };

  return (
    <div className="mb-4 border-b border-gray-800 pb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-xs font-bold text-gray-400 hover:text-mythic-400 transition-colors mb-2 uppercase tracking-wider"
      >
        <span className="flex items-center gap-2">
          <Wand2 size={14} /> AI World Analyzer
        </span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {isOpen && (
        <div className="animate-fadeIn">
          <textarea
            className="w-full h-24 bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-300 focus:border-mythic-500 focus:ring-1 focus:ring-mythic-500/50 outline-none resize-none mb-2 placeholder:text-gray-600"
            placeholder="Paste a description of your world, setting, or adventure here. The AI will automatically select the best tags for you."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            disabled={isAnalyzing || !text.trim()}
            className="w-full bg-mythic-900/30 hover:bg-mythic-900/50 border border-mythic-700/50 text-mythic-300 text-xs py-2 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={12} className="animate-spin" /> Analyzing Context...
              </>
            ) : (
              <>
                <Sparkles size={12} /> Apply Suggested Tags
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default MagicInput;