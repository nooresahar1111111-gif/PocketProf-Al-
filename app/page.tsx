"use client";

import React, { useState, useRef, useEffect } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
}

interface ChatSession {
  id: string;
  title: string;
  subject: string;
  messages: Message[];
  date: string;
}

export default function Home() {
  const { user } = useUser();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "Welcome to PocketProf AI! Type any subject or general question to get started, upload question papers, or download complete study guides.",
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("English");
  const [subjects, setSubjects] = useState(["English"]);
  const [newSubjectInput, setNewSubjectInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem("pocketprof_chat_history");
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save history updates
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("pocketprof_chat_history", JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const createNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: `${selectedSubject} Session`,
      subject: selectedSubject,
      messages: [
        {
          id: "1",
          sender: "ai",
          text: `Started a new ${selectedSubject} session! Ask me anything.`,
        },
      ],
      date: new Date().toLocaleDateString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setMessages(newSession.messages);
    setShowHistory(false);
  };

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setSelectedSubject(session.subject);
    setMessages(session.messages);
    setShowHistory(false);
  };

  const handleSendMessage = async (customPrompt?: string, imageBase64?: string, mimeType?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() && !imageBase64) return;
    if (isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: imageBase64 ? `[Uploaded Question Paper/Image] ${promptToSend}` : promptToSend,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
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
        text: data.response || "No response generated.",
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      if (currentSessionId) {
        setSessions((prev) =>
          prev.map((s) => (s.id === currentSessionId ? { ...s, messages: finalMessages } : s))
        );
      } else {
        const newId = Date.now().toString();
        const newSession: ChatSession = {
          id: newId,
          title: promptToSend.slice(0, 25) + "...",
          subject: selectedSubject,
          messages: finalMessages,
          date: new Date().toLocaleDateString(),
        };
        setSessions((prev) => [newSession, ...prev]);
        setCurrentSessionId(newId);
      }
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
      handleSendMessage(`Analyze this uploaded question paper/notes for ${selectedSubject}:`, base64Data, file.type);
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

      {/* 1. SIGNED OUT VIEW */}
      <SignedOut>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl font-bold mb-4 shadow-lg shadow-indigo-500/20">
            🎓
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to PocketProf AI</h1>
          <p className="text-slate-400 text-xs mb-8 leading-relaxed">
            Your smart study companion. Solve question papers, ask general knowledge queries, generate practice MCQs, and create study guides instantly.
          </p>

          <SignInButton mode="modal">
            <button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-medium text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-md">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      {/* 2. SIGNED IN VIEW */}
      <SignedIn>
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#0b101d]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">🎓</div>
              <h1 className="font-bold text-sm">PocketProf AI</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="bg-[#111827] hover:bg-slate-800 border border-slate-800 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                📜 History
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* History Modal Drawer */}
        {showHistory && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-xs bg-[#0b101d] border-l border-slate-800 p-4 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm">Chat History</h2>
                <button onClick={() => setShowHistory(false)} className="text-slate-400 text-xs">
                  ✕ Close
                </button>
              </div>

              <button
                onClick={createNewChat}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-xs py-2 rounded-lg font-medium mb-4"
              >
                + New Chat Session
              </button>

              <div className="flex-1 overflow-y-auto space-y-2">
                {sessions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No previous chats found.</p>
                ) : (
                  sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => loadSession(s)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs flex flex-col gap-1 transition-all ${
                        currentSessionId === s.id
                          ? "bg-indigo-600/20 border-indigo-500/50 text-white"
                          : "bg-[#111827] border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <span className="font-medium truncate">{s.title}</span>
                      <span className="text-[10px] text-slate-500">{s.date} • {s.subject}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

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
                placeholder="Add subject (e.g. Linguistics, Science)..."
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
                className={`p-3.5 rounded-xl text-xs max-w-[90%] leading-relaxed ${
                  m.sender === "user"
                    ? "bg-indigo-600 text-white ml-auto"
                    : "bg-[#111827] border border-slate-800 text-slate-200"
                }`}
              >
                {m.sender === "user" ? (
                  m.text
                ) : (
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => <h1 className="font-bold text-base my-2 text-indigo-300" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="font-bold text-sm my-1.5 text-indigo-300" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="font-bold text-xs my-1 text-indigo-300" {...props} />,
                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-1 space-y-1" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-1 space-y-1" {...props} />,
                      li: ({ node, ...props }) => <li className="my-0.5" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                    }}
                  >
                    {m.text}
                  </ReactMarkdown>
                )}
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
              placeholder={`Ask about ${selectedSubject} or general questions...`}
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
      </SignedIn>
    </div>
  );
}
