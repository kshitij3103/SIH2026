import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Zap,
} from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { sendChatMessage } from '../../api/client';
import { BotLogo } from './BotLogo';

export const ChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Greetings. I am your Quantitative Cyber Risk Analyst. I have real-time access to your FAIR Monte Carlo quantifications, asset portfolio loss bounds, and security controls ROSI data.\n\nSuggested inquiries:\n• What is our biggest financial cyber risk right now?\n• Which control delivers the highest Return on Security Investment (ROSI)?\n• How does the Knapsack ILP optimizer outperform naive budget allocation?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: userTimestamp,
    };

    const historyPayload = messages
      .filter((m) => m.id !== 'welcome' && !m.isError)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await sendChatMessage(text, historyPayload);
      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.reply || "I didn't receive a response.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      let errDetail = err.response?.data?.detail;
      if (err.response?.status === 502) {
        errDetail =
          errDetail ||
          'AI service configuration issue. Please verify backend environment and token.';
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        errDetail = 'Cannot reach backend server. Please verify FastAPI is running on http://localhost:8000.';
      } else {
        errDetail = errDetail || 'Sorry, I encountered an error processing your query. Please try again.';
      }

      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        isError: true,
        content: `⚠️ ${errDetail}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const starterQuestions = [
    "What is our biggest cyber risk?",
    "Which control has highest ROSI?",
    "Summarize baseline EAL vs VaR95.",
  ];

  return (
    <div className="w-[370px] sm:w-[420px] h-[540px] max-h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden text-slate-100 ring-1 ring-white/10 backdrop-blur-xl">

      {/* Distinct AI Copilot Header */}
      <div className="p-3.5 px-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-md shadow-[#6FB724]/20 ring-1 ring-white/20">
            <BotLogo className="w-full h-full" withCircle={true} />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#6FB724] border-2 border-slate-900"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide font-sans">
                AI Risk Copilot
              </h3>
              <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-[#6FB724]/20 text-[#6FB724] rounded border border-[#6FB724]/40">
                FAIR AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#6FB724] animate-pulse"></span>
              Live Quantitative Assistant
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/90 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex items-start space-x-2">
            <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
              <BotLogo className="w-full h-full" withCircle={true} />
            </div>
            <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-3.5 py-2 text-xs flex items-center space-x-2 shadow-sm font-sans">
              <span className="inline-flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-[#6FB724] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-[#6FB724] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-[#6FB724] rounded-full animate-bounce"></span>
              </span>
              <span className="text-[11px] text-slate-300">Analyzing FAIR portfolio metrics...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      {messages.length <= 2 && (
        <div className="px-3 py-2 bg-slate-900/80 border-t border-slate-800 overflow-x-auto flex items-center space-x-1.5">
          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Suggested:
          </span>
          {starterQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/90 text-indigo-200 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 hover:border-indigo-400 whitespace-nowrap transition-all duration-150 shadow-xs active:scale-95"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 bg-slate-900 border-t border-indigo-500/20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask about financial risk, EAL, VaR, or controls..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white disabled:opacity-40 transition-all shadow-md shadow-indigo-600/30 active:scale-95 flex items-center justify-center shrink-0"
            title="Send query"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
};



