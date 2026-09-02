import React from 'react';
import { User, AlertCircle } from 'lucide-react';
import { BotLogo } from './BotLogo';

export const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <div className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      
      {/* Distinct Avatar */}
      <div
        className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0 text-xs shadow-sm ${
          isUser
            ? 'bg-slate-800 text-slate-200 ring-1 ring-slate-700'
            : isError
            ? 'bg-red-950/80 text-red-400 ring-1 ring-red-800/50'
            : 'shadow-[#6FB724]/20 ring-1 ring-white/20'
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5" />
        ) : isError ? (
          <AlertCircle className="w-3.5 h-3.5" />
        ) : (
          <BotLogo className="w-full h-full" withCircle={true} />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`max-w-[85%] text-xs leading-relaxed ${
          isUser
            ? 'bg-slate-800 text-white rounded-2xl rounded-tr-xs px-3.5 py-2.5 shadow-md border border-slate-700'
            : isError
            ? 'bg-red-950/50 text-red-200 border border-red-800/50 rounded-2xl rounded-tl-xs px-3.5 py-2.5'
            : 'bg-slate-900/95 text-slate-100 border border-slate-800/90 rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-md ring-1 ring-white/5'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        
        {message.timestamp && (
          <div
            className={`text-[9px] mt-1.5 text-right font-mono ${
              isUser ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {message.timestamp}
          </div>
        )}
      </div>

    </div>
  );
};



