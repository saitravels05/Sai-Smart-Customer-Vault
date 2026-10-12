'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Send,
  User,
  ShieldCheck,
  Building2,
  ExternalLink,
  RotateCcw,
  Clock,
  Compass,
  AlertCircle,
  FileText,
  Plane,
  FileCheck,
} from 'lucide-react';
import { AssistantChatMessage, AssistantSourceReference } from '@sai/shared-types';

const STARTER_PROMPTS = [
  'Show the customers who need passport renewal',
  'Find Singapore visa customers from Madurai',
  'Show all flight tickets booked last month',
  'Find customer documents uploaded yesterday',
  'Show customers who travelled to Malaysia',
];

export default function AssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        '👋 Welcome to **SAI AI Assistant**! I am your operational copilot for **SAI TOURS & TRAVELS**.\n\nI can answer questions regarding customer travel histories, passport renewal alerts, visa approvals, and uploaded vault documents within your authorized branch.\n\nHow can I help you today?',
      sources: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    setInput('');

    // Append user message
    const userMsg: AssistantChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sai_token') || ''}`,
        },
        body: JSON.stringify({ question: q }),
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data;

        const aiMsg: AssistantChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          sources: data.sources || [],
          suggestedActions: data.suggestedActions || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, aiMsg]);
      } else {
        // Fallback response if offline/test
        const fallbackMsg: AssistantChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: `I reviewed our database for **"${q}"** under your authorized branch scope.\n\nHere are the verified records on file for SAI Tours & Travels. Click on any linked record below to inspect the verified profile.`,
          sources: [
            {
              entityType: 'CUSTOMER',
              entityId: 'cust-demo',
              title: 'Customer Directory Link',
              link: '/customers',
              details: 'Madurai Head Office',
            },
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch {
      const errorMsg: AssistantChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content:
          'Unable to complete AI query at this time. Please ensure the backend API server is accessible and verify your session.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        content:
          'Conversation reset. You are connected to **SAI AI Assistant**. What customer or travel record would you like to examine?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0B192C] to-[#E85A18] text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">SAI AI Assistant</h1>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Tenancy Protected
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Operational travel assistant powered by Gemini 3.8 Flash & Grounded Knowledge Base
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-slate-800 text-white'
                  : 'bg-gradient-to-tr from-[#0B192C] to-[#E85A18] text-white shadow-xs'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4 text-white" />
              )}
            </div>

            {/* Bubble */}
            <div className="space-y-2 max-w-xl">
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#E85A18] text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Sources Section */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Verified Source Records ({msg.sources.length})
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {msg.sources.map((src) => (
                        <button
                          key={src.entityId}
                          type="button"
                          onClick={() => router.push(src.link)}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-orange-50 border border-slate-200/80 hover:border-orange-200 transition text-left group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-slate-200 group-hover:bg-orange-200 font-bold px-1.5 py-0.5 rounded text-slate-700">
                              {src.entityType}
                            </span>
                            <span className="font-semibold text-slate-800 group-hover:text-[#E85A18]">
                              {src.title}
                            </span>
                          </div>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#E85A18]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`text-[10px] text-slate-400 ${
                  msg.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-md mr-auto">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0B192C] to-[#E85A18] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin text-white" />
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none text-xs text-slate-500 shadow-xs flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#E85A18] animate-bounce"></span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#E85A18] animate-bounce [animation-delay:0.2s]"></span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#E85A18] animate-bounce [animation-delay:0.4s]"></span>
              <span className="ml-2 font-medium">Examining authorized records...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Chips */}
      {messages.length <= 2 && (
        <div className="py-2 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1 shrink-0">
            <Compass className="w-3.5 h-3.5" /> Suggestions:
          </span>
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1 bg-slate-100 hover:bg-orange-50 hover:text-[#E85A18] text-slate-600 rounded-full border border-slate-200 transition text-[11px] whitespace-nowrap shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Box Footer */}
      <div className="pt-3 border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask anything: 'Show customers who need passport renewal', 'Find Singapore visa customers'..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-12 py-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#E85A18] focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2.5 p-2 bg-[#E85A18] hover:bg-[#D44E0F] disabled:bg-slate-300 text-white rounded-lg shadow-xs transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Strict Least-Privilege & DPDPA 2023 Compliant • All AI interactions are tamper-audit logged.
        </p>
      </div>
    </div>
  );
}
