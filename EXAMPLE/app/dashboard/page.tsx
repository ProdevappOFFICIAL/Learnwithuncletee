"use client"
import React, { useState, useEffect } from 'react';
import {
  Lock,
  Layers,
  Zap,
  PartyPopper
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Workspace } from '@/types';
import { workspaceApi } from '@/lib/api/workspaces';
import { BiLoader } from 'react-icons/bi';

const LearningdeckDashboard = () => {
  const [prompt, setPrompt] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  const router = useRouter();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await workspaceApi.list();
        if (res.data) setWorkspaces(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  // Typewriter phrases
  const phrases = [
    "Create a science exam for JS1...",
    "Draft 5 questions on English...",
    "Generate a mathematics quiz...",
    "Create lesson notes for Biology..."
  ];

  // Typewriter Logic
  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting && charIndex < currentPhrase.length) {
        // Typing
        setPlaceholder(currentPhrase.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
      } else if (isDeleting && charIndex > 0) {
        // Deleting
        setPlaceholder(currentPhrase.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
      } else if (!isDeleting && charIndex === currentPhrase.length) {
        // Pause at end of phrase
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && charIndex === 0) {
        // Switch to next phrase
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, phraseIndex]);

  const handleStart = () => {
    if (!prompt.trim()) return;
    router.push(`/dashboard/agentic-mode?q=${encodeURIComponent(prompt)}`);
  };

  const WorkspaceName = workspaces[0]?.name;

  return (
    <div className="h-full text-[#6b6b6b] font-sans p-2 md:p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Section: Welcome & Input */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-[#1a1a1a]">
            How would you like to use Learningdeck today?
          </h2>

          <div className="bg-white border border-[#ededed] rounded p-6 min-h-[350px] flex flex-col justify-between">
            <div className="flex gap-4">
              <div className="mt-1">
                <div className="w-8 h-8 rounded flex items-center justify-center shrink-0">
                  <Image src="https://avatars.githubusercontent.com/u/225484805?s=200&v=4" alt="AI" width={28} height={28} className="rounded-full" />
                </div>
              </div>
              <div className="bg-[#f0f0f0] p-4 rounded-2xl rounded-tl-none max-w-[80%]">
                <p className="leading-relaxed">
                  Hi there! 👋 Tell me what you're working on and I'll help you get started with Learningdeck.
                  I can help create exams, questions, generate tests, and more.
                </p>
              </div>
            </div>

            <div className="relative mt-8">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                placeholder={placeholder}
                className="w-full border border-[#ededed] rounded py-4 px-6 pr-24 outline-none focus:border-blue-400 transition-colors"
              />
              <button
                onClick={handleStart}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-400/10 text-blue-600 py-2 px-5 rounded hover:bg-blue-700/20 transition-colors"
              >
                Let's Go
              </button>
            </div>
          </div>

          {/* Bottom Section: Recent Activity */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[#1a1a1a]">Pick up where you left off</h3>
              <div className="flex bg-[#f0f0f0] rounded p-1 p-0.5">
                <button className="flex items-center gap-1 px-3 py-1 bg-white rounded">
                  Recents
                </button>

              </div>
            </div>

            <div className="bg-white border border-[#ededed] rounded overflow-hidden">
              <div className="flex items-center gap-4 p-4 border-b border-[#ededed] hover:bg-[#fcfcfc] cursor-pointer group">
                <Lock size={16} />
                <span className="text-[#1a1a1a] group-hover:text-[#ff6b3d]">{WorkspaceName || <BiLoader className='animate-spin' />}</span>
              </div>
              <div className="flex items-center gap-4 p-4 border-b border-[#ededed] hover:bg-[#fcfcfc] cursor-pointer group">
                <Layers size={16} />
                <div className="flex items-center gap-2">
                  <span className="text-[#1a1a1a] group-hover:text-[#ff6b3d]">Environment</span>
                  <span className="mx-2 opacity-50">•</span>
                  <span>{WorkspaceName || <BiLoader className='animate-spin' />}</span>
                </div>
              </div>
              <div className="hidden flex items-center gap-4 p-4 hover:bg-[#fcfcfc] cursor-pointer group">
                <Zap size={16} />
                <div className="">
                  <span className="text-[#1a1a1a] group-hover:text-[#ff6b3d]">Identify the IP of an Incoming Request</span>
                  <span className="mx-2 opacity-50">•</span>
                  <span>{WorkspaceName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Attention */}
        <div className="space-y-6">
          <h2 className="text-[#1a1a1a]">Needs your attention</h2>
          <div className="bg-white border border-[#ededed] rounded p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="mb-4">
              <PartyPopper size={32} className="text-blue-400" />
            </div>
            <h4 className="text-[#1a1a1a] mb-2">All caught up!</h4>
            <p className="text-balance">
              Start managing your first workspace to manage your exams, questions, and students. LearningDeck is here to help you streamline your educational management process and make learning more engaging for everyone involved.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LearningdeckDashboard;