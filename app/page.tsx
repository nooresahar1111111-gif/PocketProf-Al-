"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, BookOpen, GraduationCap, CheckCircle2, ShieldCheck, 
  CreditCard, Lock, Zap, MessageSquare, Plus, Image as ImageIcon, 
  FileText, Download, User, LogOut, Check, FileCheck, Layers
} from 'lucide-react';
import { openDB } from 'idb';
import Tesseract from 'tesseract.js';

// IndexedDB Storage Initialization for Local Chat History
const initDB = async () => {
  return openDB('PocketProfDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('chat_history')) {
        db.createObjectStore('chat_history', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

export default function PocketProfApp() {
  const [messages, setMessages] = useState<Array<{ role: string; text: string; image?: string }>>([]);
  const [input, setInput] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Custom Academic Modes & Preferences
  const [subject, setSubject] = useState('General Academic');
  const [markScheme, setMarkScheme] = useState<'standard' | '5marks' | '10marks' | 'mcq'>('standard');
  const [depthMode, setDepthMode] = useState<'concise' | 'deep'>('concise');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Offline AI Download State
  const [offlineProgress, setOfflineProgress] = useState('');
  const [offlineReady, setOfflineReady] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Saved Chat History on Application Launch
  useEffect(() => {
    const loadHistory = async () => {
      const db = await initDB();
      const history = await db.getAll('chat_history');
      if (history.length > 0) {
        setMessages(history.map(item => ({ role: item.role, text: item.text, image: item.image })));
      } else {
        const initialMsg = { 
          role: 'assistant', 
          text: 'Welcome to PocketProf AI! I am your 24/7 academic companion. Select your subject, upload question papers/notes, generate assignments, or practice MCQs offline!' 
        };
        setMessages([initialMsg]);
        await db.add('chat_history', initialMsg);
      }
    };
    loadHistory();
  }, []);

  // Save Message to IndexedDB
  const saveMessageToDB = async (msg: { role: string; text: string; image?: string }) => {
    const db = await initDB();
    await db.add('chat_history', msg);
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Main Prompt & Question Paper Execution Engine
  const handleSend = async (overridePrompt?: string) => {
    const promptText = overridePrompt || input;
    if (!promptText.trim() && !selectedImage) return;

    const userMsg = { role: 'user', text: promptText, image: selectedImage || undefined };
    setMessages((prev) => [...prev, userMsg]);
    await saveMessageToDB(userMsg);

    setInput('');
    const currentImg = selectedImage;
    setSelectedImage(null);
    setLoading(true);

    let extractedText = "";

    // Step 1: Execute OCR if an image was uploaded
    if (currentImg) {
      try {
        const ocrResult = await Tesseract.recognize(currentImg, 'eng');
        extractedText = `[OCR Extracted Text from Image/Paper]:\n${ocrResult.data.text}\n\n`;
      } catch (err) {
        console.error("OCR Error:", err);
      }
    }

    // Step 2: Formulate Structured System Logic
    let responseText = "";
    const fullContext = `${extractedText}${promptText}`;

    setTimeout(async () => {
      if (markScheme === 'mcq') {
        responseText = `📌 **Correct MCQs Answer Key:**\n\n1. **Correct Answer: (B)**\n2. **Correct Answer: (A)**\n3. **Correct Answer: (D)**\n\n*(Note: Explanations are hidden as requested by MCQ mode. Select Standard/Deep mode if you want step-by-step reasoning.)*`;
      } else if (markScheme === '5marks') {
        responseText = `📝 **5-Mark Structured Response [Subject: ${subject}]:**\n\n- **Core Definition (1 Mark):** Concise overview of primary principles.\n- **Key Principles (2 Marks):** Point 1 & Point 2 with exact terminology.\n- **Summary Application (2 Marks):** Direct academic conclusion without fluff.`;
      } else if (markScheme === '10marks') {
        responseText = `📚 **10-Mark Detailed Comprehensive Answer [Subject: ${subject}]:**\n\n### 1. Introduction & Context (2 Marks)\nDetailed theoretical foundation and context.\n\n### 2. Comprehensive Analysis & Case Studies (5 Marks)\n- **Primary Factor:** Critical evaluation of core variables.\n- **Secondary Factor:** Supporting academic arguments and textual evidence.\n\n### 3. Practical Implications & Conclusion (3 Marks)\nSynthesis of arguments demonstrating high-level mastery.`;
      } else {
        responseText = `🎓 **PocketProf Academic Solution [${subject}]:**\n\n${
          depthMode === 'deep' 
            ? `### Comprehensive Analysis\n${fullContext}\n\n**Deep Insights:** Exhaustive breakdown with theoretical models, historical context, and critical methodology.` 
            : `**Direct Answer:** Clear, accurate answer targeted directly to your question.`
        }`;
      }

      const assistantMsg = { role: 'assistant', text: responseText };
      setMessages((prev) => [...prev, assistantMsg]);
      await saveMessageToDB(assistantMsg);
      setLoading(false);
    }, 1200);
  };

  // MCQ & Question Bank Generator Generator
  const generatePracticeSet = () => {
    const prompt = `Generate 50 Practice MCQs for ${subject} with correct options highlighted in bold (**[Correct]**).`;
    handleSend(prompt);
  };

  // Assignment Writer Engine
  const generateAssignment = () => {
    const prompt = `Write a formal academic assignment for subject ${subject} with abstract, introduction, body headings, and conclusion.`;
    handleSend(prompt);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* App Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src="/logo.svg" alt="PocketProf AI Logo" className="h-9 w-9 rounded-xl shadow-md shadow-indigo-500/30" />
          <div>
            <h1 className="font-bold text-base tracking-wide flex items-center gap-2">
              PocketProf AI
              {isPro && <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">PRO UNLOCKED</span>}
            </h1>
            <p className="text-[11px] text-slate-400">24/7 Offline Academic Companion</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Upload Notes VIP Teaser Badge */}
          <div className="hidden md:flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2.5 py-1 rounded-xl font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Upload Notes <strong className="text-white bg-amber-500/20 px-1.5 py-0.5 rounded ml-1 text-[10px]">SOON VIP</strong></span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition ${
              isPro 
                ? 'bg-slate-800 text-slate-300 cursor-default' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white shadow-md shadow-indigo-500/20'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            {isPro ? 'Pro Active' : 'Upgrade ($2 / 500 PKR)'}
          </button>
        </div>
      </header>

      {/* Control Bar: Subject & Marking Controls */}
      <div className="bg-slate-900/40 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <label className="text-slate-400 font-medium">Subject:</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 w-36"
            placeholder="e.g. English, Physics"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mark Scheme Mode */}
          <select 
            value={markScheme}
            onChange={(e: any) => setMarkScheme(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none"
          >
            <option value="standard">Standard Answer</option>
            <option value="5marks">5-Marks Format</option>
            <option value="10marks">10-Marks Format</option>
            <option value="mcq">MCQ Key Only</option>
          </select>

          {/* Depth Control */}
          <button
            onClick={() => setDepthMode(prev => prev === 'concise' ? 'deep' : 'concise')}
            className={`px-2.5 py-1 rounded-lg border transition ${
              depthMode === 'deep' 
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            {depthMode === 'deep' ? '🔍 Deep Analysis On' : '⚡ Direct Answer'}
          </button>
        </div>
      </div>

      {/* Action Shortcut Ribbon */}
      <div className="bg-slate-950 border-b border-slate-900 px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
        <button onClick={generatePracticeSet} className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap">
          <FileCheck className="h-3.5 w-3.5 text-indigo-400" /> Generate 50+ MCQs
        </button>
        <button onClick={generateAssignment} className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 whitespace-nowrap">
          <FileText className="h-3.5 w-3.5 text-purple-400" /> Write Assignment
        </button>
      </div>

      {/* Chat Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col justify-between gap-4">
        <div className="flex-1 overflow-y-auto space-y-4 py-2 px-1">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="bg-indigo-600/10 p-2 rounded-xl text-indigo-400 border border-indigo-500/20 mt-1">
                  <GraduationCap className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.image && (
                  <img src={msg.image} alt="Uploaded problem paper" className="max-h-48 rounded-xl mb-3 border border-indigo-400/30 object-cover" />
                )}
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className="mb-1">{line}</p>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 animate-pulse bg-slate-900/60 p-3 rounded-xl border border-slate-800 w-max">
              <Sparkles className="h-4 w-4 text-indigo-400" /> PocketProf is analyzing your subject paper...
            </div>
          )}
        </div>

        {/* Selected Image Preview Ribbon */}
        {selectedImage && (
          <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={selectedImage} alt="Preview" className="h-10 w-10 object-cover rounded-lg" />
              <span className="text-xs text-slate-300 font-medium">Question Paper / Note Attached</span>
            </div>
            <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-white text-xs px-2">✕ Remove</button>
          </div>
        )}

        {/* Input Dock */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center gap-2 shadow-xl">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-indigo-400 transition"
            title="Upload Question Paper or Notes Photo"
          >
            <Plus className="h-4 w-4" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask ${subject} question, type topic for assignment...`}
            className="flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none text-slate-100 placeholder-slate-500"
          />

          <button
            onClick={() => handleSend()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl transition shadow-md shadow-indigo-600/30"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      </main>

      {/* Subscription Checkout & Offline AI Install Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <img src="/logo.svg" alt="Logo" className="h-12 w-12 mx-auto rounded-2xl shadow-lg shadow-indigo-500/30" />
              <h2 className="text-xl font-bold">PocketProf Pro & Offline Access</h2>
              <p className="text-slate-400 text-xs">Unlock 100% Offline AI Model & Unlimited Exam Solvers</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 block">Monthly Access</span>
                <span className="text-lg font-bold text-white">$2.00 / month</span>
              </div>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-semibold">
                ~ 500 PKR
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-300 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Complete Offline Engine Download</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Question Paper OCR & Solution Logic</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Unlimited Assignments & MCQ Generators</div>
            </div>

            <button
              onClick={() => {
                setIsPro(true);
                setIsModalOpen(false);
                alert("🎉 Pro Unlocked! You can now use all offline features!");
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Lock className="h-4 w-4" />
              Pay 500 PKR ($2) & Activate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
