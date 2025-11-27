import React from 'react';
import { Settings2, X, Database, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeKey: () => void;
  onResetData: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onChangeKey, onResetData }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h3 className="font-display text-lg font-bold text-gray-200 flex items-center gap-2">
                    <Settings2 size={18} className="text-mythic-400" />
                    Application Settings
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>
            <div className="p-6 space-y-6">
                <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Google Gemini API</h4>
                    <p className="text-xs text-gray-500 mb-3">Manage your connection to Google's Generative AI models.</p>
                    <button 
                        onClick={onChangeKey}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 px-4 rounded border border-gray-700 flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                        <Settings2 size={14} /> Change API Key
                    </button>
                </div>
                
                <div className="pt-4 border-t border-gray-800">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <Database size={14} className="text-mythic-400" />
                        Data Management
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">Clear all local storage data, including projects and characters.</p>
                        <button 
                        onClick={onResetData}
                        className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 py-2 px-4 rounded border border-red-900/50 flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                        <Trash2 size={14} /> Factory Reset App
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SettingsModal;
