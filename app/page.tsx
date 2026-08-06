"use client";

import React, { useState, useRef, useEffect } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

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
      text: "Welcome to PocketProf AI! Type any subject to get started, ask questions, upload question papers, or download complete study guides.",
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("English");
  const [subjects, setSubjects] = useState(["English"]);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (customPrompt?: string, imageBase64?: string, mimeType?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() && !imageBase64) return;
    if (isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: imageBase64 ? `[Attached File] ${promptToSend}` : promptToSend,
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
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: data.response || "No response generated.",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "⚠️ Network connection error.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      handleSendMessage(`Analyze this uploaded paper/notes for ${selectedSubject}:`, base64Data, file.type);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDownloadStudyGuide = async () => {
    setIsGeneratingGuide(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Create a detailed, comprehensive study guide for ${selectedSubject}. Include key definitions, core concepts, main topics, and review questions.`,
          subject: selectedSubject,
        }),
      });
      const data = await res.json();
      const guideText = data.response || "No study guide available.";

      const blob = new Blob([guideText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `PocketProf_${selectedSubject}_StudyGuide.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to generate study guide.");
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070b14] text-slate-100 font-sans">
      <input type="file" ref={fileInputRef} accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0b101d]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">🎓</div>
            <h1 className="font-bold text-sm">PocketProf AI</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                alert(
                  "🎉 PocketProf Pro ($2 / 500 PKR):\n\n• Unlimited AI questions & answers\n• Instant Study Guide downloads\n• Exam & paper analyzer\n\nComing soon!"
                )
              }
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
            >
              ⚡ Upgrade ($2 / 500 PKR)
            </button>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg border border-slate-700">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 flex flex-col gap-4">
        {/* Subject Manager */}
        <div className="flex flex-col gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newSubjectInput.trim() && !subjects.includes(newSubjectInput.trim())) {
                setSubjects([...subjects, newSubjectInput.trim()]);
                setSelectedSubject(newSubjectInput.trim());
                setNewSubjectInput("");
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Add subject (e.g. Linguistics)..."
              value={newSubjectInput}
              onChange={(e) => setNewSubjectInput(e.target.value)}
              className="flex-1 bg-[#111827] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
            />
            <button type="submit" className="bg-indigo-600 text-xs px-3 py-1.5 rounded-lg font-medium">
              + Add
            </button>
          </form>

          <div className="flex items-center gap-2 flex-wrap">
            {subjects.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`text-xs px-3 py-1 rounded-lg border ${
                  selectedSubject === subj
                    ? "bg-indigo-600 border-indigo-400 text-white"
                    : "bg-[#111827] border-slate-800 text-slate-400"
                }`}
              >
                {subj}
              </button>
            ))}

            <button
              onClick={handleDownloadStudyGuide}
              disabled={isGeneratingGuide}
              className="ml-auto bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 rounded-lg"
            >
              📥 {isGeneratingGuide ? "Generating..." : "Download Study Guide"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#111827] border border-slate-800 text-xs py-2 rounded-lg text-slate-300"
            >
              🖼️ Upload / Snap Question Paper
            </button>
            <button
              onClick={() => handleSendMessage(`Generate 10 practice MCQs with answer explanations for ${selectedSubject}.`)}
              className="bg-[#111827] border border-slate-800 text-xs py-2 rounded-lg text-slate-300"
            >
              ❓ Generate 50+ MCQs
            </button>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 bg-[#0b101d] border border-slate-800 rounded-xl p-4 flex flex-col gap-3 overflow-y-auto min-h-[350px] max-h-[55vh]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3.5 rounded-xl text-xs max-w-[90%] whitespace-pre-wrap leading-relaxed ${
                m.sender === "user" ? "bg-indigo-600 text-white ml-auto" : "bg-[#111827] border border-slate-800 text-slate-200"
              }`}
            >
              {m.text}
            </div>
          ))}
          {isLoading && <div className="text-xs text-slate-500">PocketProf is thinking...</div>}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative"
        >
          <input
            type="text"
            placeholder={`Ask about ${selectedSubject}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-[#0b101d] border border-slate-800 rounded-xl pl-8 pr-10 py-3 text-xs text-white"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
          >
            📎
          </button>
          <button type="submit" disabled={!input.trim()} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo-400 font-bold">
            ➔
          </button>
        </form>
      </main>
    </div>
  );
}
