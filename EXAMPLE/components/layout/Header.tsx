"use client";

import Image from "next/image"
import { MdSearch, MdQuiz, MdReport } from "react-icons/md";
import { BiBookOpen, BiSolidShapes } from "react-icons/bi";
import { GiTeacher } from "react-icons/gi";
import { SiGoogleclassroom } from "react-icons/si";
import { useSidebar } from "@/context/SidebarContext";
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { RiMenu5Line } from "react-icons/ri";
import { userApi } from "@/lib/api/users";
import { examApi } from "@/lib/api/exams";
import { questionApi } from "@/lib/api/questions";
import { subjectApi } from "@/lib/api/subjects";
import { classApi } from "@/lib/api/classes";
import { resultApi } from "@/lib/api/results";
import { User } from "@/types";
import { dashboardNavItems } from "./Sidebar";
import { navItems as workspaceNavItems, TeacherNavItems } from "./WorkspaceSideBar";

// ─── Types ────────────────────────────────────────────────────────────────────
type SearchGroup = { type: string; items: any[] };

// ─── Cache (module-level, survives re-renders) ────────────────────────────────
const queryCache = new Map<string, SearchGroup[]>();

// ─── Icon map ─────────────────────────────────────────────────────────────────
const GROUP_ICONS: Record<string, React.ElementType> = {
  Navigation: BiBookOpen,
  Exams: BiBookOpen,
  Questions: MdQuiz,
  Results: MdReport,
  Teachers: GiTeacher,
  Classes: SiGoogleclassroom,
  Subjects: BiSolidShapes,
};

// ─── Highlight helper (memoised outside component) ───────────────────────────
function Highlight({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === term.toLowerCase()
          ? <mark key={i} className="bg-yellow-200 text-black rounded-sm not-italic">{p}</mark>
          : p
      )}
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
const Header = () => {
  const { toggleLeftSidebar } = useSidebar();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchPopoverRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<SearchGroup[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPopover, setShowPopover] = useState(false);

  // Fetch current user once
  useEffect(() => {
    userApi.me().then((res) => {
      if (res.success && res.data) setUser(res.data);
    });
  }, []);

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setIsProfileOpen(false);
      if (
        searchPopoverRef.current &&
        !searchPopoverRef.current.contains(e.target as Node) &&
        !searchInputRef.current?.contains(e.target as Node)
      ) {
        setShowPopover(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Nav items (role-aware, memoised)
  const allNavItems = useMemo(() => {
    const roleItems = user?.role === "TEACHER" ? TeacherNavItems : workspaceNavItems;
    return [
      ...dashboardNavItems.map((i) => ({ ...i, type: "Navigation" })),
      ...roleItems.map((i) => ({ ...i, type: "Navigation" })),
    ];
  }, [user]);

  // ─── Core search (runs at most once per unique query) ─────────────────────
  const runSearch = useCallback(
    async (raw: string) => {
      const cacheKey = `${user?.workspaceId}::${raw}`;
      if (queryCache.has(cacheKey)) {
        setResults(queryCache.get(cacheKey)!);
        setShowPopover(true);
        setIsSearching(false);
        return;
      }

      // Cancel any previous in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsSearching(true);
      setShowPopover(true);

      const commandMatch = raw.match(/^@(\w+)\s*(.*)/);
      const cmd = commandMatch ? commandMatch[1].toLowerCase() : null;
      const term = commandMatch ? commandMatch[2] : raw;
      const wid = user?.workspaceId;
      const groups: SearchGroup[] = [];

      // 1. Local nav — instant, synchronous
      const navHits = allNavItems.filter((i) =>
        i.label.toLowerCase().includes(term.toLowerCase())
      );
      if (navHits.length && (!cmd || cmd === "sidebar"))
        groups.push({ type: "Navigation", items: navHits.slice(0, 3) });

      // 2. All API calls fire in parallel
      const fetchers: Promise<void>[] = [];

      const add = (type: string, promise: Promise<any>, transform?: (d: any) => any[]) =>
        fetchers.push(
          promise
            .then((res) => {
              if (!res.success || !res.data) return;
              const items = transform ? transform(res.data) : res.data;
              if (items.length) groups.push({ type, items: items.slice(0, 3) });
            })
            .catch(() => {/* silently swallow per-fetcher errors */ })
        );

      if (!cmd || cmd === "exam")
        add("Exams", examApi.list({ workspaceId: wid, searchTerm: term }));

      if (!cmd || cmd === "question")
        add("Questions", questionApi.list({ workspaceId: wid, searchTerm: term, limit: 3 }));

      if (!cmd || cmd === "subject")
        add(
          "Subjects",
          subjectApi.list(wid),
          (d) => d.filter((s: any) =>
            s.name.toLowerCase().includes(term.toLowerCase()) ||
            s.code?.toLowerCase().includes(term.toLowerCase())
          )
        );

      if (!cmd || cmd === "class")
        add(
          "Classes",
          classApi.list(wid),
          (d) => d.filter((c: any) => c.name.toLowerCase().includes(term.toLowerCase()))
        );

      if (!cmd || cmd === "result")
        add("Results", resultApi.list({ workspaceId: wid, searchTerm: term, limit: 3 }));

      if (!cmd || cmd === "teacher")
        add("Teachers", userApi.list({ role: "TEACHER", workspaceId: wid, searchTerm: term, limit: 3 }));

      await Promise.allSettled(fetchers);

      queryCache.set(cacheKey, groups);
      if (queryCache.size > 50) {
        const firstKey = queryCache.keys().next().value;
        if (firstKey) queryCache.delete(firstKey);
      }

      setResults(groups);
      setIsSearching(false);
    },
    [user, allNavItems]
  );

  // ─── Debounced query watcher ───────────────────────────────────────────────
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setShowPopover(false);
      setIsSearching(false);
      return;
    }

    // Instant cache hit — no delay
    const cacheKey = `${user?.workspaceId}::${trimmed}`;
    if (queryCache.has(cacheKey)) {
      setResults(queryCache.get(cacheKey)!);
      setShowPopover(true);
      return;
    }

    setIsSearching(true);
    const t = setTimeout(() => runSearch(trimmed), 200);
    return () => clearTimeout(t);
  }, [query, runSearch, user?.workspaceId]);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    try {
      if (typeof window !== "undefined" && (window as any).api?.clearAuthToken)
        await (window as any).api.clearAuthToken();
    } catch { }
    await authApi.logout();
  };

  const clearSearch = () => {
    setQuery("");
    setShowPopover(false);
    setResults([]);
    searchInputRef.current?.focus();
  };

  const handleResultClick = (item: any, group: SearchGroup) => {
    navigate.push(item.href || `/workspace/${group.type.toLowerCase()}/${item.id || ""}`);
    setShowPopover(false);
    setQuery("");
  };

  // Derive the plain search term for highlighting
  const highlightTerm = query.startsWith("@")
    ? (query.match(/^@\w+\s+(.*)/) || [])[1] || ""
    : query;

  const profileName = user?.user_name || "Guest";
  const profileEmail = user?.user_email || "No email";
  const userRole = user?.role || "User";

  return (
    <div className="flex justify-between w-full bg-[#f9f9f9] border-b border-[#ededed] text-[#6b6b6b] py-2">
      {/* ── Left: logo + toggle ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-2">
        <button
          onClick={toggleLeftSidebar}
          className="text-xl cursor-pointer hover:text-[#0e0f10] transition-colors"
        >
          <RiMenu5Line />
        </button>
        <Image
          src="https://avatars.githubusercontent.com/u/225484805?s=200&v=4"
          alt="LearningDeck"
          width={20}
          height={20}
          className="rounded"
        />
        <span className="font-medium truncate">
          <span className="text-black">LearningDeck |</span> Web Dashboard
        </span>
      </div>

      {/* ── Centre: search ───────────────────────────────────────────────────── */}
      <div className="px-3 hidden md:block flex-1 max-w-xl">
        <div className="relative">
          {/* Search icon */}
          <MdSearch
            className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none transition-colors ${isFocused ? "text-[#0e0f10]" : "text-[#6b6b6b]"
              }`}
          />

          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (results.length) setShowPopover(true);
            }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => e.key === "Escape" && clearSearch()}
            placeholder="Search LearningDeck  ·  @exam @class @teacher…"
            className="w-full bg-[#ededed]/50 border border-[#ededed] rounded-md py-1.5 pl-10 pr-8 text-xs text-[#0e0f10] placeholder:text-[#9b9b9b] outline-none focus:bg-white focus:border-zinc-300 transition-all  focus:shadow-md"
          />

          {/* Clear / spinner */}
          {query && (
            <button
              onMouseDown={(e) => { e.preventDefault(); clearSearch(); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9b9b9b] hover:text-[#0e0f10] transition-colors"
            >
              {isSearching ? (
                <span className="inline-block w-3 h-3 border border-zinc-300 border-t-zinc-500 rounded-full animate-spin" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </button>
          )}

          {/* ── Search popover ──────────────────────────────────────────────── */}
          {showPopover && (
            <div
              ref={searchPopoverRef}
              className="absolute left-0 top-[calc(100%+6px)] w-full max-h-[420px] bg-white border border-[#ededed]  rounded-lg z-[300] overflow-y-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {isSearching && results.length === 0 ? (
                <div className="flex items-center gap-2.5 px-4 py-5 text-[#6b6b6b]">
                  <span className="inline-block w-3.5 h-3.5 border border-zinc-300 border-t-zinc-500 rounded-full animate-spin shrink-0" />
                  <span className="text-[11px]">Searching…</span>
                </div>
              ) : results.length > 0 ? (
                <div className="py-1.5">
                  {results.map((group) => {
                    const Icon = GROUP_ICONS[group.type] ?? BiBookOpen;
                    return (
                      <div key={group.type} className="mb-1 last:mb-0">
                        {/* Group label */}
                        <div className="px-4 py-1 text-[9px] font-bold text-[#9b9b9b] uppercase tracking-widest bg-[#f9f9f9] sticky top-0">
                          {group.type}
                        </div>
                        {group.items.map((item, idx) => {
                          const ItemIcon = group.type === "Navigation" ? (item.icon ?? Icon) : Icon;
                          const label = item.label || item.exam_name || item.question || item.name || item.user_name || "";
                          const sub = item.user_email || item.code || (item.minutes ? `${item.minutes} min` : null);
                          return (
                            <button
                              key={idx}
                              onMouseDown={(e) => { e.preventDefault(); handleResultClick(item, group); }}
                              className="flex items-center gap-3 w-full px-3.5 py-2 hover:bg-[#f4f4f4] transition-colors text-left group/item"
                            >
                              <span className="shrink-0 p-1.5 rounded bg-[#f0f0f0] text-[#6b6b6b] group-hover/item:bg-[#e8e8e8] group-hover/item:text-[#0e0f10] transition-colors">
                                <ItemIcon className="text-[13px]" />
                              </span>
                              <span className="flex flex-col min-w-0">
                                <span className="text-[11px] font-medium text-[#0e0f10] truncate leading-tight">
                                  <Highlight text={label} term={highlightTerm} />
                                </span>
                                {sub && (
                                  <span className="text-[9px] text-[#9b9b9b] truncate mt-0.5">{sub}</span>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                  {/* Hint bar */}
                  <div className="px-4 py-2 border-t border-[#f0f0f0] flex items-center gap-1.5 text-[9px] text-[#b0b0b0]">
                    <kbd className="px-1 py-0.5 rounded bg-[#f0f0f0] font-mono text-[8px]">Esc</kbd>
                    <span>to clear</span>
                    <span className="ml-2 opacity-60">Try @exam · @class · @teacher · @subject</span>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-5 text-[#6b6b6b]">
                  <p className="text-[11px]">No results for "<span className="text-[#0e0f10]">{query}</span>"</p>
                  <p className="text-[9px] mt-1 text-[#b0b0b0]">Try scoping: @exam, @question, @teacher…</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: avatar + profile popover ─────────────────────────────────── */}
      <div className="relative flex items-center gap-2 px-2">
        <button
          type="button"
          onClick={() => setIsProfileOpen((p) => !p)}
          className="rounded-full overflow-hidden border border-[#e5e7eb] hover:border-[#cbd5e1] transition-colors"
        >
          <Image
            src="data:image/png;base64,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"
            alt="Profile"
            width={34}
            height={34}
            className="rounded-full"
          />
        </button>

        {isProfileOpen && (
          <div
            ref={profileRef}
            className="absolute right-2 top-[calc(100%+10px)] w-64 bg-white border border-[#ededed] shadow rounded z-[200] overflow-hidden"
          >
            <div className="p-3.5 bg-zinc-50 border-b border-zinc-200">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[12px] text-zinc-900 font-medium truncate">{profileName}</span>
                {userRole && (
                  <span className="text-[9px] font-semibold uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0">
                    {userRole}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 truncate block">{profileEmail}</span>
            </div>
            <div className="flex flex-col gap-0.5 p-1.5">
              {[
                { label: "View Profile", action: () => alert("View Profile coming soon") },
                { label: "Settings", action: () => alert("Settings coming soon") },
                { label: "Switch Accounts", action: () => alert("Switch accounts coming soon") },
                { label: "Add Account", action: () => alert("Add account coming soon") },
              ].map(({ label, action }) => (
                <button
                  key={label}
                  onClick={() => { setIsProfileOpen(false); action(); }}
                  className="text-left text-[11px] px-3 py-1.5 rounded hover:bg-zinc-100 transition-colors"
                >
                  {label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="text-left text-[11px] px-3 py-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;