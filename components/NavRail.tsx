import React from 'react';
import { Flame, FolderOpen, Settings2 } from 'lucide-react';

interface NavRailProps {
  activeTab: 'forge' | 'projects';
  onTabChange: (tab: 'forge' | 'projects') => void;
  onOpenSettings: () => void;
}

const NavRail: React.FC<NavRailProps> = ({ activeTab, onTabChange, onOpenSettings }) => {
  return (
    <div className="hidden md:flex w-16 bg-gray-950 border-r border-gray-800 flex-col items-center py-6 z-30" aria-label="Desktop navigation">
      <div className="mb-8">
        <div className="w-10 h-10 bg-mythic-600 rounded-xl flex items-center justify-center shadow-lg shadow-mythic-500/20">
          <Flame className="text-white" size={24} fill="currentColor" />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 w-full px-2">
        <button
          onClick={() => onTabChange('forge')}
          aria-pressed={activeTab === 'forge'}
          className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-mythic-500 ${
            activeTab === 'forge'
              ? 'bg-gray-800 text-mythic-400 shadow-inner'
              : 'text-gray-500 hover:bg-gray-900 hover:text-gray-300'
          }`}
          title="Character Forge"
        >
          <Flame size={20} />
          <span className="text-[9px] font-medium">Forge</span>
        </button>

        <button
          onClick={() => onTabChange('projects')}
          aria-pressed={activeTab === 'projects'}
          className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-mythic-500 ${
            activeTab === 'projects'
              ? 'bg-gray-800 text-mythic-400 shadow-inner'
              : 'text-gray-500 hover:bg-gray-900 hover:text-gray-300'
          }`}
          title="Project Library"
        >
          <FolderOpen size={20} />
          <span className="text-[9px] font-medium">Library</span>
        </button>
      </div>

      <div className="mt-auto px-2 w-full">
        <button
          onClick={onOpenSettings}
          className="w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-gray-500 hover:bg-gray-900 hover:text-gray-300 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-mythic-500"
          title="Global Settings"
        >
          <Settings2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default NavRail;