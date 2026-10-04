import React from 'react';
import { Download, Monitor, Globe, Box, Code, Zap } from 'lucide-react'; // Icons for visual flair
import Link from 'next/link';
const Downloads = () => {
  return (
    <div className="h-full px-6 py-16 pt-24 bg-white font-sans text-[#212121]">
      {/* --- Header Section --- */}
      <header className="py-16 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl  mb-6 tracking-tight">
          Download LearningDeck
        </h1>
        <p className="text-lg md:text-xl text-[#6b6b6b] leading-relaxed">
          Download the app to get started with the LearningDeck API Platform.
        </p>
      </header>

      {/* --- Main Hero Section --- */}
      <main className="flex flex-col pb-20">
        <div className=" gap-16 items-start">

          {/* Left Column: Download Controls */}
          <div className="lg:col-span-5 space-y-12">

            {/* The LearningDeck App */}
            <section className="flex flex-col w-full items-center justify-center">

              <Link href="https://github.com/LearningDeck-HQ/LearningDeck-CBT-Exam-Manager/releases/download/v1.0.2/learningdeck-desktop-agent-1.0.0-setup.exe" className="bg-[#ff6c37] hover:bg-[#e05a2b] text-white  py-2 px-6 rounded flex items-center transition-colors">
                <Monitor className="w-5 h-5 mr-2" />
                Windows x64
              </Link>
              <a href="#" className="block mt-4 text-[#006aff] hover:underline text-sm ">
                Download for Windows ARM64 →
              </a>
              <p className="text-[12px] text-[#6b6b6b] mt-6 leading-snug">
                By downloading and using LearningDeck, I agree to the <a href="#" className="underline">Privacy Policy</a> and <a href="#" className="underline">Terms</a>.
              </p>
              <a href="#" className="inline-block mt-4 text-xs text-[#6b6b6b] hover:text-[#212121] transition-colors">
                Release Notes →
              </a>
            </section>

            <hr className="border-[#e6e6e6]" />





          </div>

          {/* Right Column: Desktop UI Placeholder (Empty as requested) */}
          <div className="lg:col-span-7  bg-[#fcfcfc] border border-[#e6e6e6] rounded  flex items-center justify-center">
            <img src="/dashboard.JPG" alt="LearningDeck Desktop App UI Placeholder" className="object-cover h-full w-full" />
          </div>
        </div>
      </main>


    </div>
  );
};

/* --- Component: ToolCard --- */
interface ToolCardProps {
  title: string;
  description: string;
  linkText: string;
  icon: React.ReactNode;
}

const ToolCard = ({ title, description, linkText, icon }: ToolCardProps) => (
  <div className="group">
    <div className="w-12 h-12 mb-6 bg-gray-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl  mb-3">{title}</h3>
    <p className="text-[#6b6b6b] text-sm leading-relaxed mb-4 min-h-[80px]">
      {description}
    </p>
    <a href="#" className="text-[#006aff] hover:underline text-sm ">
      {linkText}
    </a>
  </div>
);

export default Downloads;