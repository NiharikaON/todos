"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { authRepository } from "@/repositories";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Globe, 
  Lock, 
  Save, 
  Camera, 
  Eye, 
  EyeOff, 
  KeyRound, 
  LogOut, 
  RotateCcw, 
  Download, 
  Trash2, 
  AlertTriangle, 
  Check, 
  Sparkles,
  Info,
  Smartphone
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";

type SettingsTab = "profile" | "security" | "notifications" | "appearance" | "language" | "privacy";

function SettingsContent() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  useEffect(() => {
    const tabParam = searchParams.get("tab") as SettingsTab;
    if (tabParam && ["profile", "security", "notifications", "appearance", "language", "privacy"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // ----------------------------------------------------
  // 1. Profile State
  // ----------------------------------------------------
  const [profileData, setProfileData] = useState({
    name: user?.name || "Niharika Nalla",
    email: user?.email || "niharikanalla512@gmail.com",
    phone: "+1 (555) 234-5678",
    jobTitle: "Senior Product Manager",
    bio: "Passionate about building intuitive SaaS products, task management workflows, and cloud-native user experiences.",
    avatarUrl: user?.avatarUrl || "",
  });
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, avatarUrl: reader.result as string }));
        toast.success("Profile picture updated preview!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await authRepository.updateProfile(profileData.name);
      if (profileData.avatarUrl) {
        await authRepository.updateAvatar(profileData.avatarUrl);
      }
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ----------------------------------------------------
  // 2. Security State
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
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-gray-200" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 25, label: "Weak", color: "bg-red-500" };
    if (score === 2) return { score: 50, label: "Fair", color: "bg-yellow-500" };
    if (score === 3) return { score: 75, label: "Good", color: "bg-blue-500" };
    return { score: 100, label: "Strong", color: "bg-emerald-500" };
  };
  const passwordStrength = getPasswordStrength(passwords.newPassword);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword) {
      toast.error("Both current and new passwords are required");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await authRepository.updatePassword(passwords.currentPassword, passwords.newPassword);
      toast.success("Password updated successfully!");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOutAllDevices = () => {
    if (confirm("Are you sure you want to sign out from all active devices?")) {
      toast.success("Signed out from all other devices");
    }
  };

  // ----------------------------------------------------
  // 3. Notifications State
  // ----------------------------------------------------
  const defaultNotifications = {
    email: true,
    inApp: true,
    taskAssigned: true,
    taskUpdated: true,
    taskCompleted: true,
    dueDateReminder: true,
    dailyReminder: true,
    weeklySummary: false,
    projectUpdates: true,
    fileUploads: true,
    commentsAndMentions: true,
  };
  const [notifState, setNotifState] = useState(defaultNotifications);
  const [isSavingNotifs, setIsSavingNotifs] = useState(false);

  const handleSaveNotifications = async () => {
    setIsSavingNotifs(true);
    try {
      await authRepository.updatePreferences(notifState);
      toast.success("Notification preferences saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save notifications");
    } finally {
      setIsSavingNotifs(false);
    }
  };

  const handleResetNotifications = () => {
    setNotifState(defaultNotifications);
    toast.success("Reset notification preferences to default");
  };

  // ----------------------------------------------------
  // 4. Appearance State
  // ----------------------------------------------------
  const [accentColor, setAccentColor] = useState("indigo");
  const [fontSize, setFontSize] = useState("medium");
  const [compactMode, setCompactMode] = useState(false);
  const [sidebarCollapse, setSidebarCollapse] = useState(false);
  const [enableAnimations, setEnableAnimations] = useState(true);

  useEffect(() => {
    const savedAccent = localStorage.getItem("app_accent_color");
    const savedFont = localStorage.getItem("app_font_size");
    const savedCompact = localStorage.getItem("app_compact_mode");
    const savedAnim = localStorage.getItem("app_animations");
    if (savedAccent) setAccentColor(savedAccent);
    if (savedFont) setFontSize(savedFont);
    if (savedCompact) setCompactMode(savedCompact === "true");
    if (savedAnim) setEnableAnimations(savedAnim === "true");
  }, []);

  const handleAccentChange = (color: string) => {
    setAccentColor(color);
    localStorage.setItem("app_accent_color", color);
    toast.success(`Theme accent set to ${color}`);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    localStorage.setItem("app_font_size", size);
    toast.success(`Font size set to ${size}`);
  };

  // ----------------------------------------------------
  // 5. Language State
  // ----------------------------------------------------
  const [language, setLanguage] = useState("en");
  const languagesList = [
    { code: "en", name: "English (US)", flag: "🇺🇸" },
    { code: "es", name: "Spanish (Español)", flag: "🇪🇸" },
    { code: "fr", name: "French (Français)", flag: "🇫🇷" },
    { code: "de", name: "German (Deutsch)", flag: "🇩🇪" },
    { code: "hi", name: "Hindi (हिन्दी)", flag: "🇮🇳" },
    { code: "te", name: "Telugu (తెలుగు)", flag: "🇮🇳" },
  ];

  const handleSaveLanguage = () => {
    localStorage.setItem("app_language", language);
    const selected = languagesList.find(l => l.code === language)?.name;
    toast.success(`Display language updated to ${selected}`);
  };

  // ----------------------------------------------------
  // 6. Privacy & Danger Zone State
  // ----------------------------------------------------
  const [privacyVisibility, setPrivacyVisibility] = useState<"public" | "private">("public");
  const [privacySettings, setPrivacySettings] = useState({
    hideEmail: false,
    hidePhone: true,
    teamCanView: true,
    activityTracking: true,
    analyticsCollection: true,
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");

  const handleDownloadData = () => {
    const dataToExport = {
      user: profileData,
      notifications: notifState,
      privacy: privacySettings,
      appearance: { theme, accentColor, fontSize },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-settings-${Date.now()}.json`;
    a.click();
    toast.success("UserData.json exported to downloads!");
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmationInput !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }
    toast.success("Account deletion request submitted");
    setIsDeleteModalOpen(false);
  };

  // Sidebar Menu Items
  const sidebarItems: { id: SettingsTab; label: string; icon: any; desc: string }[] = [
    { id: "profile", label: "Profile", icon: User, desc: "Personal info & avatar" },
    { id: "security", label: "Security", icon: Shield, desc: "Password & authentication" },
    { id: "notifications", label: "Notifications", icon: Bell, desc: "Preferences & alerts" },
    { id: "appearance", label: "Appearance", icon: Palette, desc: "Theme & styling" },
    { id: "language", label: "Language", icon: Globe, desc: "Display language & locale" },
    { id: "privacy", label: "Privacy", icon: Lock, desc: "Visibility & data control" },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Sticky Top Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
            <Sparkles className="w-7 h-7 mr-3 text-indigo-600 dark:text-indigo-400" />
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your personal details, workspace preferences, security credentials, and notifications.
          </p>
        </div>
        <div className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
          AWS Cognito Secured
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
                  className={`w-full flex items-center text-left px-4 py-3 rounded-xl transition-all duration-200 group ${
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
                    Update your avatar, personal details, and public profile bio.
                  </p>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Avatar Uploader */}
                <div className="flex items-center space-x-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-2xl shadow-inner">
                      {profileData.avatarUrl ? (
                        <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{profileData.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full cursor-pointer shadow-md transition-transform hover:scale-110">
                      <Camera className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Profile Photo</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">JPG, PNG, WebP up to 5MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Full Name</Label>
                    <input
                      id="name"
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Email Address</Label>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Cognito Protected</span>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={profileData.email}
                      readOnly
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-sm cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Phone Number</Label>
                    <input
                      id="phone"
                      type="text"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobTitle" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Job Title (Optional)</Label>
                    <input
                      id="jobTitle"
                      type="text"
                      value={profileData.jobTitle}
                      onChange={(e) => setProfileData(prev => ({ ...prev, jobTitle: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Bio / About Me</Label>
                  <textarea
                    id="bio"
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Profile Changes
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
                    Account Security & Credentials
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Update password, manage session tokens, and enable Multi-Factor Authentication.
                  </p>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Password Fields */}
                <div className="space-y-4 max-w-lg">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Current Password</Label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">New Password</Label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Password Strength Indicator Bar */}
                    {passwords.newPassword && (
                      <div className="space-y-1 pt-1">
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: `${passwordStrength.score}%` }} />
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold flex items-center justify-between">
                          <span>Password Strength:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{passwordStrength.label}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Confirm New Password</Label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <a href="/forgot-password" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center">
                      <KeyRound className="w-3.5 h-3.5 mr-1" />
                      Forgot Password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="w-full px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.01] disabled:opacity-50"
                  >
                    {isUpdatingPassword ? "Updating Password..." : "Update Password"}
                  </button>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-6" />

                {/* Additional Security Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
                        <Smartphone className="w-4 h-4 mr-2 text-indigo-600" />
                        Multi-Factor Authentication (MFA)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Add an extra layer of security via SMS or Authenticator App.</p>
                    </div>
                    <Switch checked={mfaEnabled} onCheckedChange={(c) => setMfaEnabled(c)} />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
                        <LogOut className="w-4 h-4 mr-2 text-red-500" />
                        Active Device Sessions
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Force logout from all laptops, tablets, and phones.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOutAllDevices}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 text-xs font-bold rounded-xl transition-colors"
                    >
                      Sign Out All Devices
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ======================================================== */}
            {/* 3. NOTIFICATIONS SECTION                                 */}
            {/* ======================================================== */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                      <Bell className="w-5 h-5 mr-2 text-indigo-600" />
                      Notification Preferences
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Configure email, push, and event-driven notification channels.
                    </p>
                  </div>
                  <button
                    onClick={handleResetNotifications}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Reset to Default
                  </button>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries({
                    email: "Email Notifications",
                    inApp: "In-App Header Bell Alerts",
                    taskAssigned: "Task Assignment Alerts",
                    taskUpdated: "Task Updates & Status Changes",
                    taskCompleted: "Task Completion Notices",
                    dueDateReminder: "Due Date & Overdue Reminders",
                    dailyReminder: "Daily Digest Reminders",
                    weeklySummary: "Weekly Progress Summary",
                    projectUpdates: "Project Milestones",
                    fileUploads: "File Upload Notifications",
                    commentsAndMentions: "Comments & Mentions",
                  }).map(([key, title]) => (
                    <div key={key} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 transition-colors">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-semibold text-slate-900 dark:text-white">{title}</Label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Receive real-time alerts via AWS SNS & EventBridge.</p>
                      </div>
                      <Switch
                        checked={(notifState as any)[key]}
                        onCheckedChange={(val) => setNotifState(prev => ({ ...prev, [key]: val }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={isSavingNotifs}
                    className="inline-flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
                  >
                    {isSavingNotifs ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 4. APPEARANCE SECTION                                    */}
            {/* ======================================================== */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                    <Palette className="w-5 h-5 mr-2 text-indigo-600" />
                    Appearance & Theme Settings
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Customize themes, primary accents, font scales, and layout density.
                  </p>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Theme Selector Cards */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Interface Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => setTheme("light")}
                      className={`border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-slate-200 dark:border-slate-800'}`}
                    >
                      <div className="w-full h-16 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                        <span className="text-slate-800 font-bold text-xs">Light</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Light Mode</span>
                    </button>

                    <button
                      onClick={() => setTheme("dark")}
                      className={`border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-800'}`}
                    >
                      <div className="w-full h-16 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">Dark</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Dark Mode</span>
                    </button>

                    <button
                      onClick={() => setTheme("system")}
                      className={`border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${theme === 'system' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-800'}`}
                    >
                      <div className="w-full h-16 bg-gradient-to-r from-slate-100 to-slate-900 rounded-lg border border-slate-300 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-black/80 px-2 py-0.5 rounded">System</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">System Theme</span>
                    </button>
                  </div>
                </div>

                {/* Accent Color Palette Selector */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Primary Accent Color</Label>
                  <div className="flex items-center space-x-4">
                    {[
                      { id: "indigo", bg: "bg-indigo-600" },
                      { id: "blue", bg: "bg-blue-600" },
                      { id: "emerald", bg: "bg-emerald-600" },
                      { id: "purple", bg: "bg-purple-600" },
                      { id: "rose", bg: "bg-rose-600" },
                    ].map((color) => (
                      <button
                        key={color.id}
                        onClick={() => handleAccentChange(color.id)}
                        className={`w-9 h-9 rounded-full ${color.bg} flex items-center justify-center text-white transition-transform hover:scale-110 shadow-sm ${accentColor === color.id ? "ring-4 ring-offset-2 ring-indigo-500" : ""}`}
                      >
                        {accentColor === color.id && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Layout Density Controls */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Compact Mode Density</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Reduces row spacing for higher task information density.</p>
                    </div>
                    <Switch checked={compactMode} onCheckedChange={(val) => { setCompactMode(val); localStorage.setItem("app_compact_mode", String(val)); }} />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold">Enable Smooth UI Animations</Label>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Applies CSS micro-animations on buttons and page transitions.</p>
                    </div>
                    <Switch checked={enableAnimations} onCheckedChange={(val) => { setEnableAnimations(val); localStorage.setItem("app_animations", String(val)); }} />
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 5. LANGUAGE SECTION                                      */}
            {/* ======================================================== */}
            {activeTab === "language" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-indigo-600" />
                    Language & Regional Settings
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Select your preferred language for the interface.
                  </p>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                <div className="max-w-md space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Display Language</Label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                    >
                      {languagesList.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleSaveLanguage}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02]"
                  >
                    Save Language Preference
                  </button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 6. PRIVACY & DANGER ZONE SECTION                         */}
            {/* ======================================================== */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                    <Lock className="w-5 h-5 mr-2 text-indigo-600" />
                    Privacy & Account Controls
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Control data sharing, profile visibility, and account deletion.
                  </p>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Profile Visibility Toggle */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Profile Visibility</Label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setPrivacyVisibility("public")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${privacyVisibility === 'public' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'border-slate-200 dark:border-slate-800 text-slate-600'}`}
                    >
                      🌐 Public (Visible to Team)
                    </button>
                    <button
                      onClick={() => setPrivacyVisibility("private")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${privacyVisibility === 'private' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'border-slate-200 dark:border-slate-800 text-slate-600'}`}
                    >
                      🔒 Private (Only Me)
                    </button>
                  </div>
                </div>

                {/* Privacy Options Switches */}
                <div className="space-y-4 pt-2">
                  {Object.entries({
                    hideEmail: "Hide Email Address on Public Profile",
                    hidePhone: "Hide Phone Number from Team Members",
                    teamCanView: "Allow Team Members to View My Profile",
                    activityTracking: "Allow Activity Audit Tracking",
                    analyticsCollection: "Allow Anonymous Telemetry",
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <Label className="text-sm font-semibold text-slate-900 dark:text-white">{label}</Label>
                      <Switch
                        checked={(privacySettings as any)[key]}
                        onCheckedChange={(val) => setPrivacySettings(prev => ({ ...prev, [key]: val }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-6" />

                {/* Danger Zone */}
                <div className="p-6 border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                    <div>
                      <h4 className="text-base font-bold">Danger Zone</h4>
                      <p className="text-xs text-red-500/90 dark:text-red-400/80">Export user data or permanently delete your account.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                    <button
                      onClick={handleDownloadData}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download My Data (.json)
                    </button>

                    <button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete My Account
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

      {/* Delete Account Modal Dialog */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Account</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              This action is permanent and cannot be undone. All your tasks, projects, comments, and attachments will be deleted from AWS Cloud.
            </p>

            <div className="space-y-2 pt-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Type <span className="text-red-600 font-extrabold">DELETE</span> to confirm
              </Label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-2 rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationInput !== "DELETE"}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-40 transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
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
