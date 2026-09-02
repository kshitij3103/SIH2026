import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import { BotLogo } from './BotLogo';

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Window Panel */}
      {isOpen && (
        <div className="mb-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <ChatWindow onClose={() => setIsOpen(false)} />
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center justify-center p-1 rounded-full shadow-2xl transition-all duration-300 active:scale-95 ${
          isOpen
            ? 'bg-slate-900 text-slate-200 hover:bg-slate-800 ring-2 ring-[#6FB724]/60 shadow-lg'
            : 'hover:scale-110 shadow-[#6FB724]/40 hover:shadow-[#6FB724]/60'
        }`}
        title={isOpen ? 'Close AI Risk Copilot' : 'Open AI Risk Copilot'}
        aria-label="Toggle AI Risk Copilot"
      >
        {/* Pulse alert indicator when closed */}
        {!isOpen && (
          <span className="absolute 0 top-0 right-0 flex h-4 w-4 z-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6FB724] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#6FB724] border-2 border-white shadow-xs"></span>
          </span>
        )}

        {isOpen ? (
          <div className="w-13 h-13 rounded-full bg-slate-900 flex items-center justify-center text-white border-2 border-[#6FB724]/50">
            <X className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90 text-[#6FB724]" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center shadow-lg transition-transform duration-200">
            <BotLogo className="w-full h-full" withCircle={true} />
          </div>
        )}
      </button>
    </div>
  );
};




