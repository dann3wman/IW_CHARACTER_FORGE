import React from 'react';
import { Sparkles, Settings2 } from 'lucide-react';

interface ApiKeyScreenProps {
  onConnect: () => void;
}

const ApiKeyScreen: React.FC<ApiKeyScreenProps> = ({ onConnect }) => {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-xl p-8 text-center shadow-2xl animate-fadeIn">
          <div className="w-16 h-16 bg-mythic-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-mythic-700/50">
             <Sparkles className="text-mythic-500 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-3">RPG Character Forge</h1>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            To generate high-quality characters and portraits with Gemini 3 Pro, you need to connect a paid API key.
          </p>
          <button onClick={onConnect} className="w-full bg-mythic-600 hover:bg-mythic-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-mythic-900/50 transition-all flex items-center justify-center gap-2 group">
            <Settings2 className="w-5 h-5" /> Connect API Key
          </button>
           <p className="mt-6 text-xs text-gray-500">
            See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-mythic-400 hover:underline">Billing Documentation</a> for more info.
          </p>
        </div>
      </div>
  );
};

export default ApiKeyScreen;
