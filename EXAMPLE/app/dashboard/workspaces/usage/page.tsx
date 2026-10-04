"use client";
import { ScaleLoader } from "react-spinners";
import { useWorkspaceUsage } from "@/hooks/useWorkspaceUsage";

const UsageWorkspacePage = () => {
  const { data, isLoading, error } = useWorkspaceUsage();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ScaleLoader barCount={3} color="#a7a7a7" height={20} width={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 border border-red-100 rounded">
        {(error as Error).message || "An error occurred"}
      </div>
    );
  }

  const { usage, limits } = data!;
  const usageItems = [
    { label: "Students enrolled", used: usage.students, total: limits.students === Infinity ? 999999 : limits.students },
    { label: "Active teachers", used: usage.teachers, total: limits.teachers === Infinity ? 999999 : limits.teachers },
    { label: "Total exams", used: usage.exams, total: limits.exams === Infinity ? 999999 : limits.exams },
    { label: "AI credits used", used: usage.aiCredits, total: limits.aiCredits === Infinity ? 999999 : limits.aiCredits },
  ];

  return (
    <div className="  p-2 text-xs ">
      <div className="space-y-3">
        <div className="bg-white border border-[#ededed] rounded overflow-hidden">
          {usageItems.map((item, i) => {
            const isInfinite = item.total >= 999999;
            const pct = isInfinite ? 0 : Math.round((item.used / item.total) * 100);
            const isHigh = !isInfinite && pct >= 80;
            return (
              <div
                key={i}
                className={`p-4 flex items-center gap-6 ${i < usageItems.length - 1 ? "border-b border-[#ededed]" : ""
                  }`}
              >
                <div className="flex-1">
                  <div className="flex justify-between mb-2 ">
                    <span className="text-[#1a1a1a]">{item.label}</span>
                    <span
                      className="text-xs font-mono"
                      style={{ color: isHigh ? "#ef4444" : "#6b6b6b" }}
                    >
                      {item.used} / {isInfinite ? "∞" : item.total}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#f0f0f0] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: isInfinite ? "10%" : `${pct}%`,
                        background: isHigh
                          ? "linear-gradient(90deg, #ef4444, #f87171)"
                          : "linear-gradient(90deg, #60a5fa, #93c5fd)",
                      }}
                    />
                  </div>
                </div>
                {!isInfinite && (
                  <span
                    className="text-xs min-w-[32px] text-right"
                    style={{ color: isHigh ? "#ef4444" : "#6b6b6b" }}
                  >
                    {pct}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UsageWorkspacePage;
