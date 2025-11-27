import React, { useRef } from 'react';
import { Edit3, X, Expand, Monitor, Ratio, Wand2 } from 'lucide-react';
import { LIGHTING_OPTIONS, CAMERA_OPTIONS, STYLE_OPTIONS, ASPECT_RATIOS } from '../constants';

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: string;
  onPromptChange: (val: string) => void;
  onGenerate: () => void;
  
  framing: 'portrait' | 'full_body';
  onFramingChange: (val: 'portrait' | 'full_body') => void;
  
  size: '1K' | '2K' | '4K';
  onSizeChange: (val: '1K' | '2K' | '4K') => void;
  
  aspectRatio: string;
  onAspectRatioChange: (val: string) => void;
}

const PromptEditorModal: React.FC<PromptEditorModalProps> = ({
  isOpen,
  onClose,
  prompt,
  onPromptChange,
  onGenerate,
  framing,
  onFramingChange,
  size,
  onSizeChange,
  aspectRatio,
  onAspectRatioChange
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const handleFramingChange = (newFraming: 'portrait' | 'full_body') => {
    onFramingChange(newFraming);
    
    // Attempt to swap prefix in text to be helpful
    let text = prompt;
    const portraitPrefix = "Close-up portrait bust shot, detailed face, ";
    const bodyPrefix = "Full body shot, wide angle showing entire figure from head to toe, ";
    
    // Remove existing known prefix if it exists at the start
    if (text.startsWith(portraitPrefix)) {
        text = text.substring(portraitPrefix.length);
    } else if (text.startsWith(bodyPrefix)) {
        text = text.substring(bodyPrefix.length);
    }
    
    // Add new prefix
    const newPrefix = newFraming === 'full_body' ? bodyPrefix : portraitPrefix;
    onPromptChange(newPrefix + text);
  };

  const handleInsertText = (textToInsert: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Insert text at cursor position or append if no focus/selection
    const newText = prompt.substring(0, start) + textToInsert + " " + prompt.substring(end);
    onPromptChange(newText);
    
    // Restore focus and cursor
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + textToInsert.length + 1, start + textToInsert.length + 1);
    }, 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
            <h3 className="font-display text-lg font-bold text-gray-200 flex items-center gap-2">
                <Edit3 size={18} className="text-mythic-400" />
                Studio & Prompt Editor
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
            
            {/* Controls Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-950/50 p-4 rounded-lg border border-gray-800">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 font-semibold flex items-center gap-1"><Expand size={12}/> Framing</label>
                    <select 
                    value={framing}
                    onChange={(e) => handleFramingChange(e.target.value as 'portrait' | 'full_body')}
                    className="w-full bg-gray-800 text-xs text-white border border-gray-700 rounded focus:ring-1 focus:ring-mythic-500 outline-none p-2"
                    >
                    <option value="portrait">Portrait</option>
                    <option value="full_body">Full Body</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 font-semibold flex items-center gap-1"><Monitor size={12}/> Resolution</label>
                    <select 
                    value={size}
                    onChange={(e) => onSizeChange(e.target.value as '1K' | '2K' | '4K')}
                    className="w-full bg-gray-800 text-xs text-white border border-gray-700 rounded focus:ring-1 focus:ring-mythic-500 outline-none p-2"
                    >
                    <option value="1K">1K</option>
                    <option value="2K">2K</option>
                    <option value="4K">4K</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400 font-semibold flex items-center gap-1"><Ratio size={12}/> Aspect Ratio</label>
                    <select 
                    value={aspectRatio}
                    onChange={(e) => onAspectRatioChange(e.target.value)}
                    className="w-full bg-gray-800 text-xs text-white border border-gray-700 rounded focus:ring-1 focus:ring-mythic-500 outline-none p-2"
                    >
                    {ASPECT_RATIOS.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                    </select>
                </div>
            </div>
            
            {/* Composition Injectors */}
            <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Quick Insert</h4>
                <div className="flex gap-2 flex-wrap">
                    <select 
                        onChange={(e) => {if(e.target.value) handleInsertText(e.target.value); e.target.value = '';}}
                        className="bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 border border-gray-700 rounded px-3 py-2 outline-none cursor-pointer transition-colors"
                    >
                        <option value="">+ Add Lighting</option>
                        {LIGHTING_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>

                    <select 
                        onChange={(e) => {if(e.target.value) handleInsertText(e.target.value); e.target.value = '';}}
                        className="bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 border border-gray-700 rounded px-3 py-2 outline-none cursor-pointer transition-colors"
                    >
                        <option value="">+ Add Angle/View</option>
                        {CAMERA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>

                    <select 
                        onChange={(e) => {if(e.target.value) handleInsertText(e.target.value); e.target.value = '';}}
                        className="bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 border border-gray-700 rounded px-3 py-2 outline-none cursor-pointer transition-colors"
                    >
                        <option value="">+ Add Style</option>
                        {STYLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            </div>

            {/* Text Area */}
            <div className="flex-1">
                <label className="text-xs text-gray-400 font-semibold block mb-2">Prompt Text</label>
                <textarea 
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    className="w-full h-48 bg-gray-950 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 focus:border-mythic-500 outline-none resize-none font-mono leading-relaxed"
                />
            </div>
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-800/30 flex justify-between items-center">
            <span className="text-xs text-gray-500 italic">
                Tip: Use the dropdowns to insert keywords at your cursor position.
            </span>
            <div className="flex gap-3">
                <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                    Cancel
                </button>
                <button onClick={onGenerate} className="px-6 py-2 rounded-lg text-sm font-medium bg-mythic-600 hover:bg-mythic-500 text-white shadow-lg shadow-mythic-900/50 flex items-center gap-2 transition-all">
                    <Wand2 size={16} /> Generate Image
                </button>
            </div>
        </div>
        </div>
    </div>
  );
};

export default PromptEditorModal;
