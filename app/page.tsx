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
      text: "Welcome to PocketProf AI! Type any subject in the world below to add it, ask questions, upload question papers, or download study guides.",
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("English");
  const [subjects, setSubjects] = useState(["English"]);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  // Hidden File Input Ref for Uploading Question Papers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (customPrompt?: string, imageBase64?: string, mimeType?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() && !imageBase64) return;
    if (isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: imageBase64 ? `[Attached Question Paper] ${promptToSend}` : promptToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend,
          subject: selectedSubject,
          imageBase64: imageBase64 || null,
          imageMimeType: mimeType || null,
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

  // Upload Question Paper Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      const mimeType = file.type;

      handleSendMessage(
        `Please analyze this uploaded paper/notes for ${selectedSubject} and provide standard solutions or key takeaways.`,
        base64Data,
        mimeType
      );
    };
    reader.readAsDataURL(file);
    // Reset file input value
    e.target.value = "";
  };

  // MCQ Generator Trigger
  const handleGenerateMCQs = () => {
    handleSendMessage(
      `Generate a practice quiz with 10 multiple-choice questions (MCQs) for ${selectedSubject}, including answer keys and brief explanations.`
    );
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

  const handleDownloadData = () => {
    const studyContent = `
==================================================
POCKETPROF AI STUDY GUIDE: ${selectedSubject.toUpperCase()}
Generated: ${new Date().toLocaleDateString()}
==================================================

CHAT LOGS & GENERATED NOTES
--------------------------------------------------
${messages
  .map((m) => `[${m.sender.toUpperCase()}]: ${m.text}`)
  .join("\n\n")}

==================================================
`.trim();

    const blob = new Blob([studyContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PocketProf_${selectedSubject}_Notes.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const contentType = res.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        alert("Checkout endpoint error: Server returned HTML response instead of JSON.");
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Unable to initiate Safepay session.");
      }
    } catch (err) {
      alert("Payment redirect failed. Please check server logs.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070b14] text-slate-100 font-sans antialiased">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,.pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Sign In Modal */}
      {isSignInOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button
              onClick={() => setIsSignInOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold text-white mb-1">Sign In to PocketProf</h2>
            <p className="text-xs text-slate-400 mb-4">
              Sync your subject notes and study history across devices.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); setIsSignInOpen(false); alert("Signed in successfully!"); }} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email address"
                required
                className="bg-[#111827] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="password"
                placeholder="Password"
                required
                className="bg-[#111827] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl transition mt-1"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      )}

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
            <button
              onClick={() => setIsSignInOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700/60 font-medium active:scale-95 transition"
            >
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

            <button
              onClick={handleDownloadData}
              className="ml-auto bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 active:scale-95"
            >
              <span>📥</span> Download Study Guide
            </button>
          </div>

          {/* Action Tools */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#111827] hover:bg-[#182238] border border-slate-800 text-slate-300 text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition active:scale-95"
            >
              <span>🖼️</span> Upload / Snap Question Paper
            </button>
            <button
              onClick={handleGenerateMCQs}
              className="bg-[#111827] hover:bg-[#182238] border border-slate-800 text-slate-300 text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition active:scale-95"
            >
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

              {/* Message Content Container */}
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

          {/* Loading Indicator */}
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
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative mt-auto">
          <input
            type="text"
            placeholder={`Ask any question about ${selectedSubject}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-[#0b101d] border border-slate-800 rounded-2xl pl-10 pr-12 py-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-lg"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm transition"
          >
            📎
          </button>
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
