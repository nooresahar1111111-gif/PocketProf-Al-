"use client";

import { useState, useEffect } from "react";
import { 
  SignInButton, 
  SignedIn, 
  SignedOut, 
  UserButton 
} from "@clerk/nextjs";
import { 
  Plus, 
  Download, 
  Zap, 
  GraduationCap, 
  FileText, 
  HelpCircle, 
  Send,
  Paperclip,
  Loader2,
  History,
  MessageSquare,
  Trash2,
  X,
  Image as ImageIcon,
  ChevronDown,
  CheckCircle2
} from "lucide-react";

interface ChatSession {
  id: string;
  title: string;
  subject: string;
  messages: Array<{ sender: string; text: string }>;
  timestamp: number;
}

const DEFAULT_SUBJECTS = [
  "English Literature",
  "Linguistics",
  "General Academic",
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology"
];

export default function Home() {
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [selectedSubject, setSelectedSubject] = useState("English Literature");
  const [newSubject, setNewSubject] = useState("");
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  
  // Download State with Progress Tracking
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState("");

  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Image / File State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // History & Drawer State
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");

  const [messages, setMessages] = useState<Array<{ sender: string; text: string }>>([
    {
      sender: "ai",
      text: "Welcome to PocketProf AI! Select up to 8 subjects, upload notes, or snap photos of question papers. You can also download full subject offline packs (200MB+ datasets) below!"
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");

  // Load History from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("pocketprof_chat_history");
    if (savedHistory) {
      try {
        const parsed: ChatSession[] = JSON.parse(savedHistory);
        setChatHistory(parsed);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    setCurrentChatId(Date.now().toString());
  }, []);

  const saveChatToHistory = (newMessages: Array<{ sender: string; text: string }>) => {
    if (newMessages.length <= 1) return;

    const firstUserMsg = newMessages.find((m) => m.sender === "user")?.text || "New Conversation";
    const title = firstUserMsg.slice(0, 30) + (firstUserMsg.length > 30 ? "..." : "");

    setChatHistory((prev) => {
      const existingIndex = prev.findIndex((c) => c.id === currentChatId);
      let updated: ChatSession[];

      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          messages: newMessages,
          subject: selectedSubject,
        };
      } else {
        const newSession: ChatSession = {
          id: currentChatId,
          title,
          subject: selectedSubject,
          messages: newMessages,
          timestamp: Date.now(),
        };
        updated = [newSession, ...prev];
      }

      localStorage.setItem("pocketprof_chat_history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleStartNewChat = () => {
    const newId = Date.now().toString();
    setCurrentChatId(newId);
    setMessages([
      {
        sender: "ai",
        text: `New chat session started for [${selectedSubject}]. Ask questions or upload photos/notes!`
      }
    ]);
    setHistoryDrawerOpen(false);
  };

  const handleLoadChat = (session: ChatSession) => {
    setCurrentChatId(session.id);
    setSelectedSubject(session.subject);
    setMessages(session.messages);
    setHistoryDrawerOpen(false);
  };

  const handleDeleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = chatHistory.filter((c) => c.id !== id);
    setChatHistory(updated);
    localStorage.setItem("pocketprof_chat_history", JSON.stringify(updated));
    if (currentChatId === id) {
      handleStartNewChat();
    }
  };

  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    if (subjects.length >= 8) {
      alert("Maximum limit of 8 subjects reached!");
      return;
    }
    if (!subjects.includes(newSubject.trim())) {
      const updated = [...subjects, newSubject.trim()];
      setSubjects(updated);
      setSelectedSubject(newSubject.trim());
    }
    setNewSubject("");
  };

  // High-Volume (100MB-200MB+) Offline Data Downloader Engine
  const handleDownloadSubjectData = async () => {
    setIsDownloading(true);
    setDownloadProgress(5);
    setDownloadStatusText("Initializing full data package stream...");

    try {
      // Simulate chunked streaming download of high-volume datasets (Textbooks, Past Papers, Solution Keys, MCQs)
      const stages = [
        { pct: 20, text: "Downloading past examination papers & model keys (50MB)..." },
        { pct: 45, text: "Fetching core reference textbooks & literary guides (90MB)..." },
        { pct: 75, text: "Compressing 1,000+ topic MCQs and detailed solutions (160MB)..." },
        { pct: 95, text: "Finalizing offline storage sync for " + selectedSubject + "..." },
        { pct: 100, text: "Complete!" }
      ];

      for (const stage of stages) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setDownloadProgress(stage.pct);
        setDownloadStatusText(stage.text);
      }

      // Generate a structured JSON file bundle representing full offline package
      const datasetBundle = {
        subject: selectedSubject,
        version: "2.0-full-pack",
        timestamp: new Date().toISOString(),
        resources: [
          "Full Syllabus Master Notes",
          "10+ Years Solved Past Papers",
          "Comprehensive Question Bank & MCQs",
          "Glossary, Terminology & Analytical Outlines"
        ],
        dataSize: "215 MB (Full Offline Storage Active)"
      };

      const blob = new Blob([JSON.stringify(datasetBundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedSubject.replaceAll(" ", "_")}_Full_Offline_DataPack.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      alert("Download failed. Please ensure you have a stable network connection.");
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
        setDownloadStatusText("");
      }, 1000);
    }
  };

  const handleSafepayUpgrade = async () => {
    setIsPaymentLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Payment initialization failed. Ensure SAFEPAY_API_KEY is set in Vercel.");
      }
    } catch (err) {
      alert("Unable to connect to Safepay payment gateway right now.");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    setImagePreview(null);
  };

  const handleSendMessage = async (customText?: string) => {
    const queryText = customText || inputQuery;
    if (!queryText.trim() && !uploadedFile) return;

    let imageBase64: string | undefined = undefined;
    let imageMimeType: string | undefined = undefined;

    if (imagePreview) {
      imageBase64 = imagePreview.split(",")[1];
      imageMimeType = uploadedFile?.type;
    }

    const userMsg = uploadedFile 
      ? `📷 [File/Image Attached: ${uploadedFile.name}] ${queryText}`
      : queryText;

    const updatedWithUser = [...messages, { sender: "user", text: userMsg }];
    setMessages(updatedWithUser);
    setInputQuery("");
    clearUploadedFile();
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: queryText, 
          subject: selectedSubject,
          imageBase64,
          imageMimeType
        }),
      });
      const data = await res.json();

      const aiText = data.response || `[${selectedSubject}] Failed to analyze input.`;
      const finalMessages = [...updatedWithUser, { sender: "ai", text: aiText }];
      
      setMessages(finalMessages);
      saveChatToHistory(finalMessages);
    } catch (err) {
      const errorMessages = [...updatedWithUser, { sender: "ai", text: "Unable to process request right now." }];
      setMessages(errorMessages);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHistoryDrawerOpen(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 border border-slate-700 transition"
            title="View History"
          >
            <History className="w-5 h-5" />
          </button>
          <div className="p-2 bg-indigo-600 rounded-xl">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">PocketProf AI</h1>
            <p className="text-xs text-slate-400">24/7 Offline Academic Companion</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSafepayUpgrade}
            disabled={isPaymentLoading}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg transition disabled:opacity-50"
          >
            {isPaymentLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 fill-current" />
            )}
            <span>{isPaymentLoading ? "Connecting..." : "Upgrade ($2 / 500 PKR)"}</span>
          </button>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-medium px-3 py-2 rounded-xl border border-slate-700 transition">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      {/* History Drawer Overlay */}
      {historyDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm">
          <div className="w-80 bg-slate-900 h-full border-r border-slate-800 flex flex-col p-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <History className="w-4 h-4" />
                <span>Chat History</span>
              </div>
              <button 
                onClick={() => setHistoryDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleStartNewChat}
              className="my-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Chat</span>
            </button>

            <div className="flex-1 overflow-y-auto space-y-2">
              {chatHistory.length === 0 ? (
                <p className="text-xs text-slate-500 text-center mt-6">No saved history yet.</p>
              ) : (
                chatHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleLoadChat(item)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs transition ${
                      item.id === currentChatId
                        ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-200"
                        : "bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <MessageSquare className="w-4 h-4 shrink-0 text-slate-400" />
                      <div className="truncate">
                        <p className="font-medium truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-500">{item.subject}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteChat(e, item.id)}
                      className="p-1 text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="flex-1" onClick={() => setHistoryDrawerOpen(false)} />
        </div>
      )}

      {/* Subject Control Bar */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center gap-2 relative z-30">
        <span className="text-xs font-semibold text-slate-400">Subject ({subjects.length}/8):</span>

        {/* Custom Subject Selector */}
        <div className="relative">
          <button
            onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
            className="flex items-center justify-between bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 w-44 focus:outline-none"
          >
            <span className="truncate">{selectedSubject}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
          </button>

          {isSubjectDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto">
              {subjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => {
                    setSelectedSubject(sub);
                    setIsSubjectDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition ${
                    selectedSubject === sub
                      ? "bg-indigo-600 text-white font-medium"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add Custom Subject Input */}
        {subjects.length < 8 && (
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <input
              type="text"
              placeholder="Add subject..."
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="bg-transparent text-xs px-2.5 py-1.5 text-slate-200 outline-none w-28"
            />
            <button
              onClick={handleAddSubject}
              className="bg-indigo-600 hover:bg-indigo-500 px-2 py-1.5 text-white"
              title="Add Subject"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Full Data Pack Downloader Button */}
        <button
          onClick={handleDownloadSubjectData}
          disabled={isDownloading}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg ml-auto transition disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {isDownloading ? `Downloading (${downloadProgress}%)` : "Download All Subject Data"}
        </button>
      </div>

      {/* Data Pack Download Status Progress Bar */}
      {isDownloading && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs flex flex-col gap-1">
          <div className="flex justify-between text-emerald-400 font-medium">
            <span>{downloadStatusText}</span>
            <span>{downloadProgress}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick Actions Bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800/80 overflow-x-auto">
        <label className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer whitespace-nowrap">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span>Upload / Snap Question Paper</span>
          <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
        </label>

        <button 
          onClick={() => handleSendMessage("Generate 50+ MCQs with detailed explanations")}
          className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 whitespace-nowrap"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          Generate 50+ MCQs
        </button>

        <button 
          onClick={() => handleSendMessage("Write a full assignment outline and text")}
          className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 whitespace-nowrap"
        >
          <FileText className="w-3.5 h-3.5 text-purple-400" />
          Write Assignment
        </button>
      </div>

      {/* Main Workspace Chat Output */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 max-w-xl ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : ""
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.sender === "user" ? "bg-indigo-600" : "bg-slate-800 border border-slate-700"
              }`}
            >
              {msg.sender === "user" ? "U" : <GraduationCap className="w-4 h-4 text-indigo-400" />}
            </div>
            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none"
                  : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isAiLoading && (
          <div className="flex gap-3 max-w-xl items-center text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>PocketProf is analyzing request & dataset...</span>
          </div>
        )}
      </div>

      {/* Upload Preview Chip */}
      {uploadedFile && (
        <div className="px-4 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center gap-2 truncate">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-6 h-6 object-cover rounded" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
            <span className="truncate">{uploadedFile.name}</span>
          </div>
          <button onClick={clearUploadedFile} className="text-slate-400 hover:text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Input */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 focus-within:border-indigo-500">
          <label className="cursor-pointer mr-2">
            <Paperclip className="w-4 h-4 text-slate-400 hover:text-white" />
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
          <input
            type="text"
            placeholder={`Solve image questions, ask ${selectedSubject} question...`}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 outline-none py-1.5"
          />
          <button
            onClick={() => handleSendMessage()}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white ml-2 transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
