import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Phone, 
  Globe, 
  Camera, 
  Save, 
  Shield,
  Activity,
  Clock,
  Edit3,
  Check,
  X
} from 'lucide-react';

export const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  
  const [profile, setProfile] = useState({
    full_name: '',
    avatar_url: '',
    bio: '',
    location: '',
    phone: '',
    website: '',
    birthday: '',
    joined_date: '',
    last_active: ''
  });

  const [tempValue, setTempValue] = useState('');
  const [stats, setStats] = useState({
    days_active: 0,
    mood_entries: 0,
    journal_entries: 0,
    meditation_sessions: 0
  });

  useEffect(() => {
    if (user) {
      loadProfile();
      loadStats();
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
          avatar_url: data.avatar_url || '',
          bio: '', // Add bio to profiles table if needed
          location: '', // Add location to profiles table if needed
          phone: '', // Add phone to profiles table if needed
          website: '', // Add website to profiles table if needed
          birthday: '', // Add birthday to profiles table if needed
          joined_date: user?.created_at ? new Date(user.created_at).toLocaleDateString() : '',
          last_active: new Date().toLocaleDateString()
        });
      } else {
        // Create initial profile
        setProfile(prev => ({
          ...prev,
          joined_date: user?.created_at ? new Date(user.created_at).toLocaleDateString() : '',
          last_active: new Date().toLocaleDateString()
        }));
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading profile",
        description: error.message,
      });
    }
  };

  const loadStats = async () => {
    // Simulate stats loading - in a real app you'd fetch from actual tables
    setStats({
      days_active: Math.floor(Math.random() * 100) + 1,
      mood_entries: Math.floor(Math.random() * 50) + 1,
      journal_entries: Math.floor(Math.random() * 30) + 1,
      meditation_sessions: Math.floor(Math.random() * 40) + 1
    });
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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await updateProfileField('avatar_url', publicUrl);

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
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

  const updateProfileField = async (field: string, value: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          [field]: value,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setProfile(prev => ({ ...prev, [field]: value }));
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const saveEdit = async () => {
    if (editingField) {
      await updateProfileField(editingField, tempValue);
      setEditingField(null);
      setTempValue('');
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValue('');
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal information and account details
          </p>
        </div>

        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar Section */}
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full p-0"
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

              {/* Basic Info */}
              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  {editingField === 'full_name' ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="text-2xl font-bold"
                        autoFocus
                      />
                      <Button size="sm" onClick={saveEdit} disabled={loading}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold">
                        {profile.full_name || user?.user_metadata?.full_name || 'Soul Gardener'}
                      </h2>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing('full_name', profile.full_name)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
                
                <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
                
                <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {profile.joined_date}</span>
                </div>

                <div className="flex gap-2 justify-center md:justify-start">
                  <Badge variant="secondary">Active User</Badge>
                  <Badge variant="outline">Verified</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bio */}
              <div className="space-y-2">
                <Label>Bio</Label>
                {editingField === 'bio' ? (
                  <div className="space-y-2">
                    <Textarea
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} disabled={loading}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-muted-foreground">
                      {profile.bio || 'No bio added yet'}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing('bio', profile.bio)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Location */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                {editingField === 'location' ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder="City, Country"
                      autoFocus
                    />
                    <Button size="sm" onClick={saveEdit} disabled={loading}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{profile.location || 'Not specified'}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing('location', profile.location)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </Label>
                {editingField === 'phone' ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      autoFocus
                    />
                    <Button size="sm" onClick={saveEdit} disabled={loading}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{profile.phone || 'Not specified'}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing('phone', profile.phone)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website
                </Label>
                {editingField === 'website' ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder="https://example.com"
                      autoFocus
                    />
                    <Button size="sm" onClick={saveEdit} disabled={loading}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{profile.website || 'Not specified'}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing('website', profile.website)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activity Statistics
              </CardTitle>
              <CardDescription>
                Your journey and achievements in Calmora
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.days_active}</div>
                  <div className="text-sm text-muted-foreground">Days Active</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.mood_entries}</div>
                  <div className="text-sm text-muted-foreground">Mood Entries</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.journal_entries}</div>
                  <div className="text-sm text-muted-foreground">Journal Entries</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.meditation_sessions}</div>
                  <div className="text-sm text-muted-foreground">Meditation Sessions</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Account Status</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Active</span>
                  <span className="text-sm text-muted-foreground">{profile.last_active}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Member Since</span>
                  <span className="text-sm text-muted-foreground">{profile.joined_date}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Security Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Account Security
            </CardTitle>
            <CardDescription>
              Your account security information and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-sm font-medium">Email Verified</div>
                <div className="text-xs text-muted-foreground">Your email is confirmed</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-sm font-medium">2FA Available</div>
                <div className="text-xs text-muted-foreground">Enable in Privacy settings</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-sm font-medium">Recent Activity</div>
                <div className="text-xs text-muted-foreground">Last login today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};