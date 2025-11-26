import React, { useState } from 'react';
import { CategoryDefinition } from '../types';
import { ChevronDown, ChevronUp, Check, Plus } from 'lucide-react';

interface CategorySelectorProps {
  category: CategoryDefinition;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onAddCustomTag: (tag: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  category, 
  selectedTags, 
  onToggleTag,
  onAddCustomTag
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTagInput.trim()) {
      onAddCustomTag(customTagInput.trim());
      setCustomTagInput('');
    }
  };

  // Merge suggested tags with any custom tags selected that aren't in suggested
  const displayTags = Array.from(new Set([...category.suggestedTags, ...selectedTags]));

  return (
    <div className="border border-gray-700 rounded-lg bg-gray-800/50 overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800 transition-colors"
      >
        <div>
          <h3 className="text-lg font-semibold text-mythic-300 font-display">{category.id.toUpperCase()}</h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{category.description}</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedTags.length > 0 && (
             <span className="bg-mythic-900 text-mythic-200 text-xs px-2 py-1 rounded-full border border-mythic-700">
               {selectedTags.length} selected
             </span>
          )}
          {isOpen ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-gray-700 bg-gray-900/50">
           <div className="flex flex-wrap gap-2 mb-4">
             {displayTags.map(tag => {
               const isSelected = selectedTags.includes(tag);
               return (
                 <button
                    key={tag}
                    onClick={() => onToggleTag(tag)}
                    className={`
                      px-3 py-1.5 rounded-md text-sm transition-all duration-200 flex items-center gap-1.5
                      ${isSelected 
                        ? 'bg-mythic-600 text-white shadow-lg shadow-mythic-500/20' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}
                    `}
                 >
                   {isSelected && <Check size={14} />}
                   {tag}
                 </button>
               );
             })}
           </div>
           
           <form onSubmit={handleCustomSubmit} className="flex gap-2">
             <input 
                type="text" 
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                placeholder="Add custom tag..."
                className="flex-1 bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-mythic-500"
             />
             <button 
                type="submit"
                disabled={!customTagInput.trim()}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 p-2 rounded border border-gray-700 disabled:opacity-50"
             >
               <Plus size={18} />
             </button>
           </form>
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
