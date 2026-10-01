"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  Database,
  Flame,
  HelpCircle,
  Loader2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  sources?: Array<{ document: string; metadata: any; score?: number }>;
  timestamp: Date;
}

const PRESET_PROMPTS = [
  "What is the current wildfire risk?",
  "Which sensor has the highest temperature?",
  "Why is NODE-003 at critical risk?",
  "What happened to NODE-001 during the last hour?",
  "Which sensor has the lowest humidity?",
  "Has smoke increased recently?",
  "What caused the latest alert?",
  "Show previous fire incidents.",
  "Explain why low humidity increases wildfire risk.",
  "Are any sensors offline?",
  "Give me a summary of the current forest conditions.",
];

export const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello Ranger. I am your Wildfire RAG Intelligence Assistant. I monitor real-time ESP32 LoRa sensor nodes across the forest reserve and utilize ChromaDB vector memory for hardware knowledge and incident histories. Ask me any questions regarding current sensor readings, anomaly causes, or environmental risk analysis.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: textToSend }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        sender: "assistant",
        text: data.answer || "I don't have enough sensor data to answer that.",
        sources: data.sources || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "assistant",
          text: "I don't have enough sensor data to answer that.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              Wildfire RAG Intelligence AI
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Gemini + ChromaDB
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Grounded on MongoDB live telemetry and Chroma knowledge vectors
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800 flex gap-2 overflow-x-auto text-xs py-2 scrollbar-none">
        {PRESET_PROMPTS.slice(0, 5).map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1 rounded-full bg-slate-800/80 hover:bg-orange-600/30 border border-slate-700/80 text-slate-300 hover:text-white whitespace-nowrap transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-orange-400" />
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "assistant" && (
              <div className="p-2 rounded-xl bg-slate-800 text-orange-400 border border-slate-700 shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[82%] rounded-2xl p-4 shadow-md text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-orange-600 text-white rounded-tr-none font-medium"
                  : "bg-slate-950/80 border border-slate-800/90 text-slate-200 rounded-tl-none"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Retrieved Sources / RAG Citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-400 uppercase tracking-wider">
                    <Database className="w-3.5 h-3.5" />
                    <span>Retrieved Knowledge & Vectors ({msg.sources.length})</span>
                  </div>
                  <div className="space-y-1">
                    {msg.sources.map((src, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-slate-900/90 p-2 rounded border border-slate-800 text-xs text-slate-300 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-200">
                            {src.metadata?.title || src.metadata?.deviceId || `Document #${sIdx + 1}`}
                          </span>
                          {src.score !== undefined && (
                            <span className="font-mono text-emerald-400">
                              Sim: {(src.score * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-[11px] line-clamp-2">{src.document}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                className={`text-[10px] mt-2 flex justify-end ${
                  msg.sender === "user" ? "text-orange-200" : "text-slate-500"
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {msg.sender === "user" && (
              <div className="p-2 rounded-xl bg-orange-700 text-white shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-orange-400 border border-slate-700 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl rounded-tl-none p-4 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
              <span>Retrieving telemetry from MongoDB and querying ChromaDB vector space...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Drawer */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80">
        <details className="text-xs text-slate-400 cursor-pointer">
          <summary className="hover:text-slate-200 flex items-center gap-1 font-medium select-none">
            <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
            <span>More prompt ideas & sample inquiries</span>
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-800/60">
            {PRESET_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="text-left text-xs p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-orange-300 truncate"
              >
                • {p}
              </button>
            ))}
          </div>
        </details>
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything (e.g. 'Why is NODE-003 at critical risk?')..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 text-white rounded-xl transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
