"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/providers/AuthProvider";
import { authRepository } from "@/repositories";
import { Settings, Shield, Bell, Palette, Save } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    updates: true,
  });
  
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [isUpdatingPreferences, setIsUpdatingPreferences] = useState(false);

  useEffect(() => {
    if (user?.preferences) {
      setNotifications(prev => ({
        ...prev,
        ...user.preferences
      }));
    }
  }, [user]);

  const handleSavePreferences = async () => {
    setIsUpdatingPreferences(true);
    try {
      await authRepository.updatePreferences(notifications);
      toast.success("Preferences saved successfully");
    } catch (error) {
      const e = error as Error;
      toast.error(e.message || "Failed to save preferences");
    } finally {
      setIsUpdatingPreferences(false);
    }
  };

  const handleSavePassword = async () => {
    if (!passwords.oldPassword || !passwords.newPassword) {
      toast.error("Both current and new passwords are required");
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      await authRepository.updatePassword(passwords.oldPassword, passwords.newPassword);
      toast.success("Password updated successfully");
      setPasswords({ oldPassword: "", newPassword: "" });
    } catch (error) {
      const e = error as Error;
      toast.error(e.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <Settings className="w-8 h-8 mr-3 text-gray-400" />
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6 grid grid-cols-4 h-auto p-1">
          <TabsTrigger value="profile" className="py-2.5"><UserIcon /> Profile</TabsTrigger>
          <TabsTrigger value="security" className="py-2.5"><Shield className="w-4 h-4 mr-2" /> Security</TabsTrigger>
          <TabsTrigger value="notifications" className="py-2.5"><Bell className="w-4 h-4 mr-2" /> Notifications</TabsTrigger>
          <TabsTrigger value="appearance" className="py-2.5"><Palette className="w-4 h-4 mr-2" /> Appearance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>This is just a shortcut to your profile page.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Go to the profile page to update your name, email, and avatar.</p>
            </CardContent>
            <CardFooter>
              <a href="/profile" className="text-indigo-600 hover:underline text-sm font-medium">Go to Profile →</a>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Update your password and secure your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <input
                  id="current-password"
                  type="password"
                  value={passwords.oldPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, oldPassword: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <input
                  id="new-password"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </CardContent>
            <CardFooter>
              <button 
                onClick={handleSavePassword} 
                disabled={isUpdatingPassword}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isUpdatingPassword ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Update Password
              </button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what you want to be notified about.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive daily summaries and task updates.</p>
                </div>
                <Switch 
                  checked={notifications.email} 
                  onCheckedChange={(c) => setNotifications(prev => ({ ...prev, email: c }))} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Push Notifications</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get notified instantly when someone assigns you a task.</p>
                </div>
                <Switch 
                  checked={notifications.push} 
                  onCheckedChange={(c) => setNotifications(prev => ({ ...prev, push: c }))} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Product Updates</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hear about new features and improvements.</p>
                </div>
                <Switch 
                  checked={notifications.updates} 
                  onCheckedChange={(c) => setNotifications(prev => ({ ...prev, updates: c }))} 
                />
              </div>
            </CardContent>
            <CardFooter>
              <button 
                onClick={handleSavePreferences} 
                disabled={isUpdatingPreferences}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isUpdatingPreferences ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Preferences
              </button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme("light")}
                  className={`border-2 rounded-lg p-4 flex flex-col items-center gap-2 hover:border-indigo-500 transition-colors ${theme === 'light' ? 'border-indigo-500 bg-indigo-50 dark:bg-transparent' : 'border-gray-200 dark:border-gray-700'}`}
                >
                  <div className="w-full h-20 bg-gray-100 rounded-md shadow-inner flex items-center justify-center">
                    <span className="text-gray-900 font-medium">Light</span>
                  </div>
                  <span className="text-sm font-medium">Light</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`border-2 rounded-lg p-4 flex flex-col items-center gap-2 hover:border-indigo-500 transition-colors ${theme === 'dark' ? 'border-indigo-500 bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                >
                  <div className="w-full h-20 bg-gray-900 rounded-md shadow-inner flex items-center justify-center">
                    <span className="text-white font-medium">Dark</span>
                  </div>
                  <span className="text-sm font-medium">Dark</span>
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`border-2 rounded-lg p-4 flex flex-col items-center gap-2 hover:border-indigo-500 transition-colors ${theme === 'system' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                >
                  <div className="w-full h-20 bg-gradient-to-r from-gray-100 to-gray-900 rounded-md shadow-inner flex items-center justify-center">
                    <span className="text-gray-500 font-medium text-xs bg-white/80 px-2 py-1 rounded">System</span>
                  </div>
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  )
}
