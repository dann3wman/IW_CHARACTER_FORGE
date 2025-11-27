import React, { useState } from 'react';
import { CategoryDefinition } from '../types';
import { ChevronDown, ChevronUp, Check, Plus, Search, PenBox, Lock } from 'lucide-react';

interface CategorySelectorProps {
  category: CategoryDefinition;
  selectedTags: string[];
  projectTags?: string[];
  onToggleTag: (tag: string) => void;
  onAddCustomTag: (tag: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  category, 
  selectedTags, 
  projectTags = [],
  onToggleTag,
  onAddCustomTag
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTagInput.trim()) {
      onAddCustomTag(customTagInput.trim());
      setCustomTagInput('');
      setSearchTerm(''); // Clear search to show the new tag
    }
  };

  // Merge suggested tags with any custom tags selected and project tags
  const allTags = Array.from(new Set([...category.suggestedTags, ...selectedTags, ...projectTags]));
  
  const filteredTags = allTags.filter(tag => 
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = selectedTags.length + projectTags.length; // Rough count, overlaps don't matter much for badge

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
          {activeCount > 0 && (
             <span className="bg-mythic-900 text-mythic-200 text-xs px-2 py-1 rounded-full border border-mythic-700 flex items-center gap-1">
               {activeCount} active
             </span>
          )}
          {isOpen ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-gray-700 bg-gray-900/50">
           
           {/* Search Bar */}
           <div className="relative mb-3">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
             <input 
                type="text" 
                placeholder={`Filter ${allTags.length} tags...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded-md pl-9 pr-3 py-1.5 text-sm text-gray-300 focus:border-mythic-500 outline-none placeholder:text-gray-600"
             />
           </div>

           <div className="flex flex-wrap gap-2 mb-4 max-h-60 overflow-y-auto custom-scrollbar pr-1">
             {filteredTags.map(tag => {
               const isSessionSelected = selectedTags.includes(tag);
               const isProjectDefault = projectTags.includes(tag);
               const isCustom = !category.suggestedTags.includes(tag);
               
               // Style Logic
               let baseStyle = "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white";
               if (isProjectDefault) {
                   baseStyle = "bg-amber-900/40 text-amber-200 border-amber-700/50 shadow-sm cursor-default";
               } else if (isSessionSelected) {
                   baseStyle = "bg-mythic-600 text-white border-mythic-500 shadow-lg shadow-mythic-500/20";
               }

               return (
                 <button
                    key={tag}
                    onClick={() => !isProjectDefault && onToggleTag(tag)}
                    className={`
                      px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1.5 border
                      ${baseStyle}
                    `}
                    title={isProjectDefault ? "Project Default (Always Active)" : isCustom ? "Custom Tag" : undefined}
                 >
                   {isProjectDefault && <Lock size={10} className="text-amber-400" />}
                   {!isProjectDefault && isSessionSelected && <Check size={12} strokeWidth={3} />}
                   {!isProjectDefault && isCustom && <PenBox size={12} className={isSessionSelected ? "text-white/70" : "text-mythic-400"} />}
                   {tag}
                 </button>
               );
             })}
             {filteredTags.length === 0 && (
                 <p className="text-xs text-gray-500 italic py-2">No tags match "{searchTerm}"</p>
             )}
           </div>
           
           <form onSubmit={handleCustomSubmit} className="flex gap-2">
             <input 
                type="text" 
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                placeholder="Add new custom tag..."
                className="flex-1 bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-mythic-500"
             />
             <button 
                type="submit"
                disabled={!customTagInput.trim()}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 p-2 rounded border border-gray-700 disabled:opacity-50 transition-colors"
                title="Add Tag"
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