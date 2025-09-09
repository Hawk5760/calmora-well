import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Save, Bell, Moon, Sun, Globe, Trash2, Upload, Camera } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';

export const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    avatar_url: ''
  });
  const [preferences, setPreferences] = useState({
    notifications: true,
    email_updates: false,
    dark_mode: theme === 'dark',
    language: i18n.language || 'en'
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading profile",
        description: error.message,
      });
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;

    setUploadingAvatar(true);
    try {
      // Delete existing avatar if it exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Save to database immediately
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      // Update profile state after successful database save
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));

      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been updated.",
      });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload avatar. Please try again.",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file.",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
      });
      return;
    }

    uploadAvatar(file);
  };
  const updateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (isDark: boolean) => {
    setTheme(isDark ? 'dark' : 'light');
    setPreferences(prev => ({ ...prev, dark_mode: isDark }));
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete profile first
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user?.id);

      toast({
        title: "Account deletion requested",
        description: "Please contact support to complete account deletion.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting account",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t('settings.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('settings.description')}
          </p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('settings.profileInformation')}
            </CardTitle>
            <CardDescription>
              {t('settings.profileDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Upload Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {user?.user_metadata?.full_name 
                      ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                      : user?.email?.charAt(0).toUpperCase() || 'U'
                    }
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{t('settings.profilePicture')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('settings.profilePictureDescription')}
                </p>
              </div>
            </div>

            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('settings.fullName')}</Label>
                <Input
                  id="fullName"
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('settings.email')}</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <Button onClick={updateProfile} disabled={loading} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? t('settings.updating') : t('settings.updateProfile')}
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              {t('settings.preferences')}
            </CardTitle>
            <CardDescription>
              {t('settings.preferencesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.darkMode')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.darkModeDescription')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4" />
                <Switch
                  checked={preferences.dark_mode}
                  onCheckedChange={handleThemeChange}
                />
                <Moon className="w-4 h-4" />
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.pushNotifications')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.pushNotificationsDescription')}
                </p>
              </div>
              <Switch
                checked={preferences.notifications}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, notifications: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.emailUpdates')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.emailUpdatesDescription')}
                </p>
              </div>
              <Switch
                checked={preferences.email_updates}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, email_updates: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t('settings.languageAndRegion')}
            </CardTitle>
            <CardDescription>
              {t('settings.languageAndRegionDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="language">{t('settings.language')}</Label>
              <select
                id="language"
                value={preferences.language}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setPreferences(prev => ({ ...prev, language: newLang }));
                  // Change app language immediately and persist it
                  i18n.changeLanguage(newLang);
                  localStorage.setItem('i18nextLng', newLang);
                  toast({
                    title: t('toast.languageChanged'),
                    description: t('toast.languageChangedDescription'),
                  });
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="en">{t('languages.en')}</option>
                <option value="hi">{t('languages.hi')}</option>
                <option value="bn">{t('languages.bn')}</option>
                <option value="te">{t('languages.te')}</option>
                <option value="mr">{t('languages.mr')}</option>
                <option value="ta">{t('languages.ta')}</option>
                <option value="gu">{t('languages.gu')}</option>
                <option value="kn">{t('languages.kn')}</option>
                <option value="ml">{t('languages.ml')}</option>
                <option value="pa">{t('languages.pa')}</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              {t('settings.dangerZone')}
            </CardTitle>
            <CardDescription>
              {t('settings.dangerZoneDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={deleteAccount}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t('settings.deleteAccount')}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              {t('settings.deleteAccountDescription')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};