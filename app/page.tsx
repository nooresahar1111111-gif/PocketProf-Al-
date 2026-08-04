"use client";

import React, { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  subject?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "Welcome to PocketProf AI! Type any subject in the world below to add it, ask questions, or download full 100MB+ offline study packages.",
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("English");
  const [subjects, setSubjects] = useState(["English"]);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = input;
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: currentQuery,
          subject: selectedSubject,
        }),
      });

      const data = await res.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: data.response || "No response received.",
        subject: selectedSubject,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "⚠️ Connection error. Please check your internet connection.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubjectInput.trim() && !subjects.includes(newSubjectInput.trim())) {
      const added = newSubjectInput.trim();
      setSubjects([...subjects, added]);
      setSelectedSubject(added);
      setNewSubjectInput("");
    }
  };

  const removeSubject = (subj: string) => {
    if (subjects.length <= 1) return;
    const filtered = subjects.filter((s) => s !== subj);
    setSubjects(filtered);
    if (selectedSubject === subj) {
      setSelectedSubject(filtered[0]);
    }
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Unable to initiate payment.");
      }
    } catch (err) {
      alert("Payment redirect error. Check server logs.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070b14] text-slate-100 font-sans antialiased">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#0b101d]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <span className="text-lg">🎓</span>
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white leading-tight">
                PocketProf AI
              </h1>
              <p className="text-[10px] text-slate-400">24/7 Academic Companion</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition duration-200 shadow-md shadow-indigo-500/20 active:scale-95 flex items-center gap-1.5"
            >
              <span>⚡</span>
              <span>Upgrade ($2 / 500 PKR)</span>
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700/60 font-medium">
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 flex flex-col gap-4">
        {/* Subject Creator & Selector Bar */}
        <div className="flex flex-col gap-2.5">
          <form onSubmit={handleAddSubject} className="flex gap-2">
            <input
              type="text"
              placeholder="Type ANY subject in the world (e.g. Organic Chemistry)..."
              value={newSubjectInput}
              onChange={(e) => setNewSubjectInput(e.target.value)}
              className="flex-1 bg-[#111827] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            <button
              type="submit"
              className="bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl border border-indigo-500/30 transition shrink-0"
            >
              + Add Subject
            </button>
          </form>

          {/* Active Subject Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {subjects.map((subj) => (
              <div
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`cursor-pointer text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition ${
                  selectedSubject === subj
                    ? "bg-indigo-600 text-white border border-indigo-400/30 shadow-sm"
                    : "bg-[#111827] text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                <span>{subj}</span>
                {subjects.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSubject(subj);
                    }}
                    className="hover:text-red-400 ml-1 text-slate-400"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            <button className="ml-auto bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1">
              <span>📥</span> Download All Data (1)
            </button>
          </div>

          {/* Action Tools */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button className="bg-[#111827] hover:bg-[#182238] border border-slate-800 text-slate-300 text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition">
              <span>🖼️</span> Upload / Snap Question Paper
            </button>
            <button className="bg-[#111827] hover:bg-[#182238] border border-slate-800 text-slate-300 text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition">
              <span>❓</span> Generate 50+ MCQs
            </button>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 bg-[#0b101d] border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-4 overflow-y-auto min-h-[380px] max-h-[58vh]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 max-w-[88%] ${
                msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 border border-slate-700 text-indigo-400"
                }`}
              >
                {msg.sender === "user" ? "U" : "🎓"}
              </div>

              {/* Message Content (Strict Overflow Protection) */}
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-full break-words overflow-hidden ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-[#111827] border border-slate-800 text-slate-200 rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="flex items-start gap-2.5 mr-auto">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center text-xs shrink-0">
                🎓
              </div>
              <div className="bg-[#111827] border border-slate-800 p-3.5 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="relative mt-auto">
          <input
            type="text"
            placeholder={`Ask any question about ${selectedSubject}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-[#0b101d] border border-slate-800 rounded-2xl pl-10 pr-12 py-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-lg"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            📎
          </span>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition"
          >
            ➔
          </button>
        </form>
      </main>
    </div>
  );
}
