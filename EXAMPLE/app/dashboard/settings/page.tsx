"use client";

import React, { useState, ChangeEvent, MouseEvent, ReactNode } from "react";
import { TbHome, TbTemplate, TbVideoPlus } from "react-icons/tb";
import {
  MdWorkspaces, MdSettings, MdLogout,
} from "react-icons/md";
import { GrDeploy } from "react-icons/gr";
import { FiArrowUpRight, FiEye, FiEyeOff } from "react-icons/fi";
import { BiBrain, BiCreditCard } from "react-icons/bi";
import SessionsPage from "./sessions/page";
import { toast, Toaster } from "sonner";
import { userApi } from "@/lib/api/users";
import { User } from "@/types";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ScaleLoader } from "react-spinners";

// ── Types ─────────────────────────────────────────────────────────────────────
interface InputProps {
  label?: string;
  desc?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  showToggle?: boolean;
  show?: boolean;
  onToggle?: () => void;
}

interface BtnProps {
  children: ReactNode;
  disabled?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  variant?: "primary" | "ghost";
}

// ── Reusable input ────────────────────────────────────────────────────────────
const Input = ({
  label,
  desc,
  value,
  onChange,
  type = "text",
  showToggle,
  show,
  onToggle
}: InputProps) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-medium text-[#0e0f10]">{label}</label>}
    {desc && <p className="text-[11px] text-[#6b6b6b]">{desc}</p>}
    <div className="relative">
      <input
        type={showToggle ? (show ? "text" : "password") : type}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 text-xs border border-[#ededed] rounded-md bg-white text-[#0e0f10] focus:outline-none focus:border-[#c0c0c0] transition-colors pr-9"
      />
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] hover:text-[#0e0f10] transition-colors"
        >
          {show ? <FiEyeOff size={13} /> : <FiEye size={13} />}
        </button>
      )}
    </div>
  </div>
);

// ── Btn ───────────────────────────────────────────────────────────────────────
const Btn = ({ children, disabled, onClick, variant = "primary" }: BtnProps) => {
  const base = "px-4 py-1.5 rounded text-xs font-medium transition-colors";
  const styles = {
    primary: disabled
      ? `${base} bg-[#c0c0c0] text-white cursor-not-allowed`
      : `${base} bg-[#1e40af] hover:bg-[#1e3a8a] text-white cursor-pointer`,
    ghost: `${base} border border-[#ededed] text-[#0e0f10] hover:bg-[#f0f0f0] cursor-pointer`,
  };
  return (
    <button onClick={onClick} disabled={disabled} className={styles[variant]}>
      {children}
    </button>
  );
};

// ── Divider ───────────────────────────────────────────────────────────────────
const Divider = () => <div className="border-t border-[#ededed] my-6" />;

// ── Profile Section ───────────────────────────────────────────────────────────
const ProfileSection = ({ user, onUpdate }: { user: User; onUpdate: () => void }) => {
  const [name, setName] = useState(user.user_name);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const res = await userApi.update(user.id, { user_name: name });
      if (res.success) {
        toast.success("Profile updated successfully");
        onUpdate();
      } else {
        toast.error(res.message || "Failed to update profile");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[#0e0f10]">Profile details</h2>
      </div>

      <Input
        label="Name"
        desc="Your name as you'd like it to be displayed."
        value={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
      />

      <Input
        label="Username (Read-only)"
        desc="Your username identifier."
        value={user.user_email}
        onChange={() => { }}
      />

      <div>
        <Btn onClick={handleUpdate} disabled={isLoading || name === user.user_name}>
          {isLoading ? "Updating..." : "Update Profile"}
        </Btn>
      </div>
    </div>
  );
};

// ── Account Section ───────────────────────────────────────────────────────────
const AccountSection = ({ user, onUpdate }: { user: User; onUpdate: () => void }) => {
  const [email, setEmail] = useState(user.user_email);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingPw, setIsLoadingPw] = useState(false);

  const pwReady = currentPw && newPw && confirmPw && newPw === confirmPw;

  const handleUpdateEmail = async () => {
    setIsLoadingEmail(true);
    try {
      const res = await userApi.update(user.id, { user_email: email });
      if (res.success) {
        toast.success("Email updated successfully");
        onUpdate();
      } else {
        toast.error(res.message || "Failed to update email");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    setIsLoadingPw(true);
    try {
      const res = await userApi.changePassword({
        currentPassword: currentPw,
        newPassword: newPw,
        signOutOthers
      });
      if (res.success) {
        toast.success("Password updated successfully");
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      } else {
        toast.error(res.message || "Failed to update password");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsLoadingPw(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-[#0e0f10]">Account</h2>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <Input
          label="Email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          type="email"
        />
        <div>
          <Btn onClick={handleUpdateEmail} disabled={isLoadingEmail || email === user.user_email}>
            {isLoadingEmail ? "Updating..." : "Update Email Address"}
          </Btn>
        </div>
      </div>

      <Divider />

      {/* Password */}
      <Input
        label="Current password"
        value={currentPw}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentPw(e.target.value)}
        showToggle
        show={showCurrent}
        onToggle={() => setShowCurrent((v) => !v)}
      />
      <Input
        label="New password"
        value={newPw}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPw(e.target.value)}
        showToggle
        show={showNew}
        onToggle={() => setShowNew((v) => !v)}
      />
      <Input
        label="Confirm new password"
        value={confirmPw}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPw(e.target.value)}
        showToggle
        show={showConfirm}
        onToggle={() => setShowConfirm((v) => !v)}
      />

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={signOutOthers}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSignOutOthers(e.target.checked)}
          className="accent-[#1e40af]"
        />
        <span className="text-xs text-[#0e0f10]">Sign out from all other sessions</span>
      </label>

      <div>
        <Btn onClick={handleUpdatePassword} disabled={!pwReady || isLoadingPw}>
          {isLoadingPw ? "Updating..." : "Update Password"}
        </Btn>
      </div>
    </div>
  );
};

// ── Tab nav ───────────────────────────────────────────────────────────────────
const TABS = ["Profile", /*"Account",*/, "Sessions", "Integrations"] as const;
type TabType = (typeof TABS)[number];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [tab, setTab] = useState<TabType>("Profile");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await userApi.me();
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-white">
        <ScaleLoader barCount={3} color="#a7a7a7ff" height={18} width={4} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-white">
        <p className="text-sm text-[#6b6b6b]">Failed to load settings. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-white rounded font-sans overflow-hidden relative">
      <Toaster position="top-right" />
      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-[#ededed] px-6 pt-2 pb-0">
          <div className="flex gap-0">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${tab === t
                  ? "border-[#0e0f10] text-[#0e0f10]"
                  : "border-transparent text-[#6b6b6b] hover:text-[#0e0f10]"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-8 py-8 ">
          {tab === "Profile" && <ProfileSection user={user} onUpdate={fetchProfile} />}
          {/* {tab === "Account" && <AccountSection user={user} onUpdate={fetchProfile} />} */}
          {tab === "Sessions" && (
            <SessionsPage />
          )}
          {tab === "Integrations" && (
            <p className="text-xs text-[#6b6b6b]">Integration settings coming soon.</p>
          )}
        </div>
      </main>
    </div>
  );
}