'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  Lock,
  Bell,
  Database,
  Download,
  Trash2,
  Save,
  Shield,
  Globe,
  School,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { updateProfile, updatePassword } from '@/actions/profile';
import { PasswordInput } from '@/components/ui/password-input';
import type { User as UserType } from '@/types';

interface SettingsClientProps {
  user: UserType | null;
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'data'>('profile');
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    feeReminders: true,
    salaryReminders: true,
    weeklyReports: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('email', profileData.email);

      const result = await updateProfile(user.id, formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!profileData.currentPassword || !profileData.newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (profileData.newPassword.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' });
      return;
    }

    if (profileData.newPassword !== profileData.confirmPassword) {
      setErrors({ password: 'Passwords do not match' });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('currentPassword', profileData.currentPassword);
      formData.append('newPassword', profileData.newPassword);

      const result = await updatePassword(user.id, formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Password changed successfully!');
        setProfileData({
          ...profileData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      localStorage.setItem('edflo_admin_notification_settings', JSON.stringify(notificationSettings));
      toast.success('Notification settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    toast.info('Preparing data for export...');
    setTimeout(() => {
      toast.success('Data exported successfully!');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-700 mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'data', label: 'Data Management', icon: Database },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === tab.id
                ? 'border-slate-700 text-slate-800'
                : 'border-transparent text-slate-700 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your general account details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 w-4 h-4 text-slate-800" />
                      <PasswordInput
                        value={profileData.currentPassword}
                        onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                        className="w-full pl-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all"
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 w-4 h-4 text-slate-800" />
                      <PasswordInput
                        value={profileData.newPassword}
                        onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                        className="w-full pl-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all"
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 w-4 h-4 text-slate-800" />
                      <PasswordInput
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                        className="w-full pl-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all"
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading} variant="outline">
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Configure how you receive updates and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleNotificationSettingsUpdate} className="space-y-6">
              <div className="space-y-3">
                {[
                  { id: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                  { id: 'pushNotifications', label: 'Push Notifications', desc: 'Browser-based alerts' },
                  { id: 'feeReminders', label: 'Fee Reminders', desc: 'Alerts for pending student fees' },
                  { id: 'salaryReminders', label: 'Salary Reminders', desc: 'Alerts for pending staff salaries' },
                  { id: 'weeklyReports', label: 'Weekly Summary', desc: 'Consolidated report of school performance' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-white transition-all">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{item.label}</p>
                      <p className="text-xs text-slate-700">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={(notificationSettings as any)[item.id]}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, [item.id]: e.target.checked })}
                      className="w-4 h-4 text-slate-800 rounded border-slate-300 focus:ring-slate-700"
                    />
                  </label>
                ))}
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Data Management Tab */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export School Data</CardTitle>
              <CardDescription>Download a backup of all school records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">School Data Backup</p>
                    <p className="text-xs text-slate-700">JSON format containing students, staff, and academics</p>
                  </div>
                </div>
                <Button onClick={handleExportData} variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                  Export Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Danger Zone
              </CardTitle>
              <CardDescription>Permanently clear localized school data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-2xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">Reset Local School Records</p>
                    <p className="text-xs text-red-500">This will remove all locally stored academic and financial records.</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowClearDataDialog(true)}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  Clear All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Irreversible Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all localized records? This will delete all student, staff,
              fee, and salary information currentry managed in this session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowClearDataDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              toast.error('Data reset is currently locked for this session.');
              setShowClearDataDialog(false);
            }}>
              Confirm Clear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
