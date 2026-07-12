"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Moon,
  Zap,
  Sparkles,
  Clock,
  TrendingUp,
  MessageSquare,
  Home,
  Settings,
  LogOut,
  Heart,
  Calendar,
  Languages,
  X,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useLanguage, type AppLanguage } from "@/context/LanguageContext";

export default function NavigationDashboard({
  tab,
  setTab,
  onLogout,
}: {
  tab: string;
  setTab: (t: string) => void;
  onLogout?: () => void;
}) {
  const { language, setLanguage, isHindi } = useLanguage();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Password reset/change states
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdError(isHindi ? "कृपया सभी फ़ील्ड भरें।" : "Please fill in all fields.");
      return;
    }

    if (newPwd.length < 6) {
      setPwdError(isHindi ? "नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।" : "New password must be at least 6 characters.");
      return;
    }

    if (newPwd !== confirmPwd) {
      setPwdError(isHindi ? "पासवर्ड मेल नहीं खाते।" : "Passwords do not match.");
      return;
    }

    const email = localStorage.getItem("divya:userEmail");
    if (!email) {
      setPwdError(isHindi ? "सत्र त्रुटि। कृपया पुनः लॉग इन करें।" : "Session error. Please log in again.");
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPwdError(data.error || (isHindi ? "पासवर्ड बदलने में विफल।" : "Failed to change password."));
      } else {
        setPwdSuccess(isHindi ? "पासवर्ड सफलतापूर्वक बदला गया!" : "Password changed successfully!");
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
        setTimeout(() => {
          setChangePwdOpen(false);
          setPwdSuccess("");
        }, 2000);
      }
    } catch (err) {
      setPwdError(isHindi ? "कुछ गलत हो गया। पुनः प्रयास करें।" : "Something went wrong. Please try again.");
    } finally {
      setPwdLoading(false);
    }
  };

  const tabs = [
    { id: "daily",       label: isHindi ? "दैनिक"         : "Daily",          labelHi: "दैनिक",         icon: Compass },
    { id: "home",        label: isHindi ? "होम"            : "Home",           labelHi: "होम",            icon: Home },
    { id: "kundali",     label: isHindi ? "कुण्डली"        : "Kundali",        labelHi: "कुण्डली",        icon: Moon },
    { id: "planets",     label: isHindi ? "ग्रह"           : "Planets",        labelHi: "ग्रह",           icon: TrendingUp },
    { id: "transit",     label: isHindi ? "गोचर"           : "Transit",        labelHi: "गोचर",           icon: Zap },
    { id: "dasha",       label: isHindi ? "दशा"            : "Dasha",          labelHi: "दशा",            icon: Clock },
    { id: "predictions", label: isHindi ? "भविष्यवाणी"    : "Predictions",    labelHi: "भविष्यवाणी",    icon: Sparkles },
    { id: "life-insights", label: isHindi ? "जीवन अंतर्दृष्टि" : "Life Insights", labelHi: "जीवन अंतर्दृष्टि", icon: Sparkles },
    { id: "remedies",    label: isHindi ? "उपाय"           : "Remedies",       labelHi: "उपाय",           icon: Heart },
    { id: "weekly",      label: isHindi ? "साप्ताहिक लय"   : "Weekly Rhythm",  labelHi: "साप्ताहिक लय",   icon: Calendar },
    { id: "chat",        label: isHindi ? "पंडित चैट"      : "Chat",           labelHi: "पंडित चैट",      icon: MessageSquare },
  ];

  const LANGS: { code: AppLanguage; label: string; sub: string }[] = [
    { code: "en", label: "English",  sub: "Symbolic English" },
    { code: "hi", label: "हिन्दी",   sub: "Sanskrit / Vedic" },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-[#F8F5EF]/95 backdrop-blur-xl border-b border-[#F1E7D0]">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-800 to-amber-600 bg-clip-text text-transparent font-serif">
            DivyaDrishti
          </h1>

          <div className="flex items-center gap-2">
            {/* Language Preference button */}
            <button
              id="language-settings-btn"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/80 border border-[#F1E7D0] text-[#3F2D1D]/70 rounded-lg text-xs font-semibold hover:bg-[#EADFC7]/50 transition-all shadow-sm"
              title="Language Preference"
            >
              <Languages className="w-4 h-4" />
              <span className="hidden sm:inline uppercase tracking-wider">
                {language === "hi" ? "हिन्दी" : "EN"}
              </span>
            </button>

            {/* Logout */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white/80 border border-[#F1E7D0] text-[#3F2D1D] rounded-lg text-xs uppercase tracking-[0.15em] hover:bg-[#EADFC7]/50 transition-all shadow-sm font-semibold"
              >
                <LogOut className="w-4 h-4 text-[#3F2D1D]/70" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isSelected = tab === t.id;
            return (
              <motion.button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all border ${
                  isSelected
                    ? "bg-[#3F2D1D] text-[#F8F5EF] border-[#3F2D1D] shadow-sm font-semibold"
                    : "bg-white/80 border-[#F1E7D0] text-[#3F2D1D]/70 hover:bg-[#EADFC7]/50 hover:text-[#3F2D1D]"
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon className={`w-4 h-4 ${isSelected ? "text-[#F8F5EF]" : "text-[#3F2D1D]/60"}`} />
                <span className="text-sm font-medium">{t.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Language Settings Overlay ────────────────────────────── */}
      <AnimatePresence>
        {settingsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
              className="fixed inset-0 bg-[#3F2D1D]/20 backdrop-blur-sm z-50"
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-4 right-4 z-50 w-72 sm:w-96 max-h-[85vh] overflow-y-auto bg-[#FFFDF8] border border-[#EAD9BE] rounded-2xl shadow-2xl p-6 space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-amber-700/60 mb-0.5">
                    Atmospheric Setting
                  </p>
                  <h3 className="text-sm font-serif font-bold text-[#3F2D1D]">
                    {isHindi ? "खाता और भाषा सेटिंग्स" : "Account & Language"}
                  </h3>
                </div>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#F1E7D0] flex items-center justify-center text-[#3F2D1D]/60 hover:bg-[#EADFC7] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-px bg-[#F1E7D0]" />

              {/* Language options */}
              <div className="space-y-2">
                {LANGS.map((l) => {
                  const isActive = language === l.code;
                  return (
                    <button
                      key={l.code}
                      id={`lang-option-${l.code}`}
                      onClick={() => {
                        setLanguage(l.code);
                        setSettingsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                        isActive
                          ? "bg-[#3F2D1D] border-[#3F2D1D] text-[#F8F5EF] shadow-sm"
                          : "bg-white border-[#F1E7D0] text-[#3F2D1D] hover:bg-[#FAF4E5] hover:border-[#EADFC7]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-serif font-bold ${isActive ? "text-[#F8F5EF]" : "text-[#3F2D1D]"}`}>
                            {l.label}
                          </p>
                          <p className={`text-[10px] mt-0.5 ${isActive ? "text-[#F8F5EF]/60" : "text-amber-700/50"}`}>
                            {l.sub}
                          </p>
                        </div>
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="h-px bg-[#F1E7D0]" />

              {/* Password change option */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setChangePwdOpen(p => !p);
                    setPwdError("");
                    setPwdSuccess("");
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 bg-amber-50/50 border border-amber-100 hover:bg-amber-100/50 rounded-xl text-xs font-semibold text-amber-900 transition-all animate-in fade-in"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>{isHindi ? "पासवर्ड बदलें" : "Change Password"}</span>
                  </div>
                  <span className="text-amber-600 font-mono text-[10px]">
                    {changePwdOpen ? "▲" : "▼"}
                  </span>
                </button>

                <AnimatePresence>
                  {changePwdOpen && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handlePasswordChange}
                      className="space-y-3 overflow-hidden pt-1"
                    >
                      {/* Current Password */}
                      <div>
                        <label className="block text-[10px] font-bold text-amber-800/60 uppercase tracking-wider mb-1">
                          {isHindi ? "वर्तमान पासवर्ड" : "Current Password"}
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPwd ? "text" : "password"}
                            value={currentPwd}
                            onChange={(e) => setCurrentPwd(e.target.value)}
                            placeholder="••••••"
                            className="w-full rounded-lg border border-[#F1E7D0] bg-white px-3 py-2 pr-9 text-xs text-amber-900 outline-none focus:border-amber-400 transition-all font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPwd(p => !p)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600 animate-in fade-in"
                          >
                            {showCurrentPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div>
                        <label className="block text-[10px] font-bold text-amber-800/60 uppercase tracking-wider mb-1">
                          {isHindi ? "नया पासवर्ड" : "New Password"}
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPwd ? "text" : "password"}
                            value={newPwd}
                            onChange={(e) => setNewPwd(e.target.value)}
                            placeholder="Min 6 characters"
                            className="w-full rounded-lg border border-[#F1E7D0] bg-white px-3 py-2 pr-9 text-xs text-amber-900 outline-none focus:border-amber-400 transition-all font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPwd(p => !p)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600 animate-in fade-in"
                          >
                            {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm New Password */}
                      <div>
                        <label className="block text-[10px] font-bold text-amber-800/60 uppercase tracking-wider mb-1">
                          {isHindi ? "नये पासवर्ड की पुष्टि करें" : "Confirm New Password"}
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPwd ? "text" : "password"}
                            value={confirmPwd}
                            onChange={(e) => setConfirmPwd(e.target.value)}
                            placeholder="••••••"
                            className="w-full rounded-lg border border-[#F1E7D0] bg-white px-3 py-2 pr-9 text-xs text-amber-900 outline-none focus:border-amber-400 transition-all font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPwd(p => !p)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600 animate-in fade-in"
                          >
                            {showConfirmPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {pwdError && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-[11px] rounded-lg px-2.5 py-1.5 leading-normal">
                          {pwdError}
                        </div>
                      )}

                      {pwdSuccess && (
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] rounded-lg px-2.5 py-1.5 leading-normal">
                          {pwdSuccess}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={pwdLoading}
                        className="w-full py-2.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        {pwdLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{pwdLoading ? (isHindi ? "अपडेट किया जा रहा है..." : "Updating...") : (isHindi ? "पासवर्ड अपडेट करें" : "Update Password")}</span>
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-px bg-[#F1E7D0]" />

              {/* Log Out */}
              {onLogout && (
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-rose-50 border border-rose-200 hover:bg-rose-100 active:bg-rose-200 rounded-xl text-sm font-bold text-rose-700 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isHindi ? "लॉग आउट करें" : "Log Out"}</span>
                </button>
              )}

              <p className="text-[9px] text-amber-700/40 font-serif italic text-center leading-relaxed">
                The entire experience adapts —{" "}
                <br />
                Daily Ritual, Panchang, Predictions, Remedies, Chat
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
