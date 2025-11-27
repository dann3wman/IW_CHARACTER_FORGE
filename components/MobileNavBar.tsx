import React from 'react';
import { Flame, FolderOpen, Settings2, Wand2 } from 'lucide-react';

interface MobileNavBarProps {
  activeTab: 'forge' | 'projects';
  isGenerating: boolean;
  onTabChange: (tab: 'forge' | 'projects') => void;
  onForge: () => void;
  onOpenSettings: () => void;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({
  activeTab,
  isGenerating,
  onTabChange,
  onForge,
  onOpenSettings
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-gray-950/95 backdrop-blur-xl border-t border-gray-800 z-40 shadow-2xl">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3" aria-label="Primary">
        <div className="flex flex-1 gap-2" role="tablist" aria-label="App sections">
          <button
            onClick={() => onTabChange('forge')}
            role="tab"
            aria-pressed={activeTab === 'forge'}
            className={`flex-1 rounded-lg px-3 py-2 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-mythic-500 ${
              activeTab === 'forge'
                ? 'bg-gray-800 text-mythic-300 border border-gray-700'
                : 'text-gray-400 bg-gray-900/60 border border-gray-800 hover:text-gray-200'
            }`}
          >
            <Flame size={18} />
            <span>Forge</span>
          </button>

          <button
            onClick={() => onTabChange('projects')}
            role="tab"
            aria-pressed={activeTab === 'projects'}
            className={`flex-1 rounded-lg px-3 py-2 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-mythic-500 ${
              activeTab === 'projects'
                ? 'bg-gray-800 text-mythic-300 border border-gray-700'
                : 'text-gray-400 bg-gray-900/60 border border-gray-800 hover:text-gray-200'
            }`}
          >
            <FolderOpen size={18} />
            <span>Library</span>
          </button>

          <button
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="rounded-lg px-3 py-2 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all text-gray-400 bg-gray-900/60 border border-gray-800 hover:text-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-mythic-500"
          >
            <Settings2 size={18} />
            <span>Settings</span>
          </button>
        </div>

        <button
          onClick={onForge}
          disabled={isGenerating}
          className="flex-1 min-w-[140px] rounded-xl bg-gradient-to-r from-mythic-600 to-mythic-500 text-white font-semibold px-4 py-3 shadow-lg shadow-mythic-900/40 border border-mythic-600 hover:from-mythic-500 hover:to-mythic-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mythic-300"
        >
          <div className="flex items-center justify-center gap-2 text-sm" aria-live="polite">
            <Wand2 className={isGenerating ? 'animate-pulse' : ''} size={18} />
            <span>{isGenerating ? 'Forging…' : 'Forge'}</span>
          </div>
        </button>
      </div>
    </nav>
  );
};

export default MobileNavBar;
