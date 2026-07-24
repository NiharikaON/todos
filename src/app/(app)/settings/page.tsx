"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { authRepository } from "@/repositories";
import { 
  User, 
  Shield, 
  Palette, 
  Save, 
  Camera, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Sparkles,
  CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";

type SettingsTab = "profile" | "security" | "theme";

function SettingsContent() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active Tab state (Profile, Security, Theme)
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  useEffect(() => {
    const tabParam = searchParams.get("tab") as SettingsTab;
    if (tabParam && ["profile", "security", "theme"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // ----------------------------------------------------
  // 1. Profile State & Validation
  // ----------------------------------------------------
  const [profileData, setProfileData] = useState({
    name: user?.name || "Niharika Nalla",
    email: user?.email || "niharikanalla512@gmail.com",
    phone: "9876543210",
    bio: "",
    avatarUrl: user?.avatarUrl || "",
  });
  const [phoneError, setPhoneError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        avatarUrl: user.avatarUrl || prev.avatarUrl,
      }));
    }
  }, [user]);

  // Profile Picture File Upload Validation (JPEG, JPG, PNG up to 5MB)
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isValidExt = ["jpeg", "jpg", "png"].includes(fileExt || "");

    if (!validTypes.includes(file.type) && !isValidExt) {
      toast.error("Invalid image format! Only JPEG, JPG, and PNG are allowed.");
      return;
    }

    // Validate file size (5MB max)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      toast.error("File size exceeds 5MB limit! Please upload a smaller image.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      toast.success("Profile picture selected successfully!");
    };
    reader.readAsDataURL(file);
  };

  // Phone Number Input Handler: Strictly allows ONLY digits and max 10 characters
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Remove all non-digit characters (symbols, letters, spaces)
    const digitsOnly = rawVal.replace(/\D/g, "");

    // Cap at 10 digits
    const formattedPhone = digitsOnly.slice(0, 10);

    setProfileData(prev => ({ ...prev, phone: formattedPhone }));

    if (formattedPhone.length > 0 && formattedPhone.length < 10) {
      setPhoneError("Phone number must be exactly 10 digits.");
    } else {
      setPhoneError("");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number: optional or exactly 10 digits
    if (profileData.phone && profileData.phone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits.");
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    setIsSavingProfile(true);
    try {
      await authRepository.updateProfile(profileData.name);
      if (profileData.avatarUrl) {
        await authRepository.updateAvatar(profileData.avatarUrl);
      }
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ----------------------------------------------------
  // 2. Security State & Password Update
  // ----------------------------------------------------
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwords.currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }
    if (!passwords.newPassword) {
      toast.error("Please enter a new password.");
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await authRepository.updatePassword(passwords.currentPassword, passwords.newPassword);
      toast.success("Password updated successfully!");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Sidebar Menu Tabs
  const sidebarItems: { id: SettingsTab; label: string; icon: any; desc: string }[] = [
    { id: "profile", label: "Profile", icon: User, desc: "Personal info & avatar" },
    { id: "security", label: "Security", icon: Shield, desc: "Password protection" },
    { id: "theme", label: "Theme", icon: Palette, desc: "Dark, Light & System" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Sticky Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
            <Sparkles className="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" />
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your profile details, account security credentials, and theme preferences.
          </p>
        </div>
        <div className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
          Production Ready
        </div>
      </div>

      {/* Main Grid: Left Navigation Sidebar + Right Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar Navigation */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    router.push(`/settings?tab=${item.id}`, { scroll: false });
                  }}
                  className={`w-full flex items-center text-left px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3.5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{item.label}</p>
                    <p className={`text-xs truncate font-normal ${isActive ? "text-indigo-100" : "text-slate-400 dark:text-slate-500"}`}>
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
            
            {/* ======================================================== */}
            {/* 1. PROFILE SECTION                                       */}
            {/* ======================================================== */}
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                    <User className="w-5 h-5 mr-2 text-indigo-600" />
                    Profile Information
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Update your avatar image, name, phone number, and personal bio.
                  </p>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Profile Picture Uploader */}
                <div className="flex items-center space-x-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-2xl shadow-inner">
                      {profileData.avatarUrl ? (
                        <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{profileData.name ? profileData.name.charAt(0).toUpperCase() : "U"}</span>
                      )}
                    </div>
                    <label 
                      title="Upload profile picture"
                      className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full cursor-pointer shadow-md transition-transform hover:scale-110"
                    >
                      <Camera className="w-4 h-4" />
                      <input 
                        type="file" 
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png" 
                        className="hidden" 
                        onChange={handleAvatarChange} 
                      />
                    </label>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Profile Picture</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Supports <span className="font-semibold text-slate-700 dark:text-slate-300">JPEG, JPG, PNG</span> format (Up to <span className="font-semibold text-slate-700 dark:text-slate-300">5MB</span>).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      required
                    />
                  </div>

                  {/* Email Address (Auto-filled from login/Cognito & Read-only) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Email Address
                      </label>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                        Auto-Filled / Read-Only
                      </span>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={profileData.email}
                      readOnly
                      title="Email is automatically filled from your login account and cannot be modified."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed font-medium select-none"
                    />
                  </div>
                </div>

                {/* Phone Number (Strictly 10 digits, no symbols or letters) */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Phone Number (10 Digits)
                  </label>
                  <input
                    id="phone"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    value={profileData.phone}
                    onChange={handlePhoneChange}
                    placeholder="Enter 10-digit phone number (e.g. 9876543210)"
                    className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 ${
                      phoneError ? "border-red-500 focus:ring-red-500/50" : "border-slate-200 dark:border-slate-700 focus:ring-indigo-500/50"
                    }`}
                  />
                  {phoneError ? (
                    <p className="text-xs text-red-500 font-semibold">{phoneError}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400">Must be exactly 10 digits without letters, symbols, or country codes.</p>
                  )}
                </div>

                {/* Bio (Completely Optional) */}
                <div className="space-y-2">
                  <label htmlFor="bio" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Bio / About Me <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="bio"
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Write a brief personal bio or about yourself..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile || !!phoneError}
                    className="inline-flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* ======================================================== */}
            {/* 2. SECURITY SECTION                                      */}
            {/* ======================================================== */}
            {activeTab === "security" && (
              <form onSubmit={handleSavePassword} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-indigo-600" />
                    Security Settings
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Protect your account credentials by updating your password.
                  </p>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                <div className="space-y-4 max-w-lg">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label htmlFor="currentPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter current password"
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        title={showCurrentPassword ? "Hide password" : "Show password"}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password (min. 8 chars)"
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        title={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Re-enter new password"
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <a href="/forgot-password" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center">
                      <KeyRound className="w-3.5 h-3.5 mr-1" />
                      Forgot Password?
                    </a>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="inline-flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.01] disabled:opacity-50"
                    >
                      {isUpdatingPassword ? (
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Update Password
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ======================================================== */}
            {/* 3. THEME SECTION                                         */}
            {/* ======================================================== */}
            {activeTab === "theme" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                    <Palette className="w-5 h-5 mr-2 text-indigo-600" />
                    Theme Preferences
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Customize the application appearance for light, dark, or system default mode.
                  </p>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Theme Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Light Mode */}
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`border-2 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-200 text-left ${
                      theme === "light"
                        ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-900/20 shadow-md ring-2 ring-indigo-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="w-full h-24 bg-slate-100 rounded-xl border border-slate-200 flex flex-col justify-between p-3 shadow-inner">
                      <div className="w-full h-3 bg-white rounded-md shadow-xs" />
                      <div className="space-y-1.5">
                        <div className="w-3/4 h-2.5 bg-slate-300 rounded" />
                        <div className="w-1/2 h-2.5 bg-indigo-400 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Light Mode</span>
                      {theme === "light" && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                    </div>
                  </button>

                  {/* Dark Mode */}
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`border-2 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-200 text-left ${
                      theme === "dark"
                        ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-900/20 shadow-md ring-2 ring-indigo-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="w-full h-24 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between p-3 shadow-inner">
                      <div className="w-full h-3 bg-slate-800 rounded-md" />
                      <div className="space-y-1.5">
                        <div className="w-3/4 h-2.5 bg-slate-700 rounded" />
                        <div className="w-1/2 h-2.5 bg-indigo-500 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Dark Mode</span>
                      {theme === "dark" && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                    </div>
                  </button>

                  {/* System Default */}
                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={`border-2 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-200 text-left ${
                      theme === "system"
                        ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-900/20 shadow-md ring-2 ring-indigo-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="w-full h-24 bg-gradient-to-r from-slate-100 to-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-inner">
                      <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                        System Default
                      </span>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">System Default</span>
                      {theme === "system" && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                    </div>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-medium text-slate-500">Loading Settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
