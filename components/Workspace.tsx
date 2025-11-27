import React from 'react';
import { PossibleCharacter } from '../types';
import CharacterDisplay from './CharacterDisplay';
import { Terminal, Loader2 } from 'lucide-react';

interface WorkspaceProps {
  character: PossibleCharacter | null;
  isGenerating: boolean;
  projectName: string;
  
  // Display Props
  isImageGenerating: boolean;
  imageSize: '1K' | '2K' | '4K';
  imageFraming: 'portrait' | 'full_body';
  aspectRatio: string;
  
  // Actions
  onSave: () => void;
  onExport: () => void;
  onQuickGenImage: () => void;
  onOpenPromptModal: () => void;
  onSetImageSize: (val: '1K' | '2K' | '4K') => void;
  onSetImageFraming: (val: 'portrait' | 'full_body') => void;
  onSetAspectRatio: (val: string) => void;
  onRegeneratePrompts: () => void;
}

const Workspace: React.FC<WorkspaceProps> = ({
  character,
  isGenerating,
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
  
  if (isGenerating && !character) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center bg-gray-950 relative overflow-hidden">
        {/* Background Pulse */}
        <div className="absolute inset-0 bg-mythic-900/10 animate-pulse" />
        
        <div className="relative z-10 text-center space-y-6">
          <div className="w-24 h-24 mx-auto relative">
             <div className="absolute inset-0 border-4 border-mythic-500/30 rounded-full animate-ping" />
             <div className="absolute inset-0 border-4 border-t-mythic-500 rounded-full animate-spin" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-white tracking-wider animate-pulse">FORGING SOUL</h2>
            <p className="text-gray-400 mt-2 text-sm">Weaving destiny from the ether...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center bg-gray-950 p-8 text-center">
        <div className="max-w-md space-y-6 opacity-50">
          <Terminal size={80} className="mx-auto text-gray-600" />
          <h1 className="text-4xl font-display font-bold text-gray-700">THE ANVIL IS COLD</h1>
          <p className="text-gray-500 leading-relaxed">
            Select a project, configure your tags in the sidebar, and strike the hammer to forge a new legend.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-gray-950 custom-scrollbar relative">
       <CharacterDisplay 
          character={character}
          projectName={projectName}
          isImageGenerating={isImageGenerating}
          imageSize={imageSize}
          imageFraming={imageFraming}
          aspectRatio={aspectRatio}
          onSave={onSave}
          onExport={onExport}
          onQuickGenImage={onQuickGenImage}
          onOpenPromptModal={onOpenPromptModal}
          onSetImageSize={onSetImageSize}
          onSetImageFraming={onSetImageFraming}
          onSetAspectRatio={onSetAspectRatio}
          onRegeneratePrompts={onRegeneratePrompts}
       />
    </div>
  );
};

export default Workspace;