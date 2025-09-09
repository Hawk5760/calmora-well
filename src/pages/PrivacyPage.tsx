import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Key, Eye, Download, Lock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import QRCode from 'qrcode';

export const PrivacyPage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [otpAuthUrl, setOtpAuthUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    data_collection: true,
    analytics: false,
    third_party_sharing: false,
    marketing_emails: false,
    profile_visibility: 'private'
  });
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    loadSessions();
    loadTwoFAStatus();
  }, []);

  const loadSessions = async () => {
    try {
      // In a real app, you'd fetch session data from your backend
      // For now, we'll simulate current session
      setSessions([
        {
          id: 1,
          device: 'Current Device',
          location: 'Current Location',
          lastActive: new Date().toISOString(),
          current: true
        }
      ]);
    } catch (error: any) {
      console.error('Error loading sessions:', error);
    }
  };


  const loadTwoFAStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('totp', { body: {} });
      if (!error) {
        setTwoFAEnabled(!!data?.is_enabled);
      }
    } catch (e) {
      console.error('Load 2FA status error', e);
    }
  };

  const enable2FA = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('totp', { body: { action: 'generate' } });
      if (error) throw error;
      const otpauthUrl: string = data.otpauthUrl;
      setOtpAuthUrl(otpauthUrl);
      const url = await QRCode.toDataURL(otpauthUrl);
      setQrDataUrl(url);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to enable 2FA', description: error.message });
    }
  };

  const verify2FA = async () => {
    if (totpCode.length !== 6) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('totp', { body: { action: 'verify', code: totpCode } });
      if (error) throw error;
      if (data?.valid) {
        setTwoFAEnabled(true);
        setQrDataUrl(null);
        setOtpAuthUrl(null);
        setTotpCode('');
        toast({ title: 'Two-Factor enabled', description: '2FA has been activated for your account.' });
      } else {
        toast({ variant: 'destructive', title: 'Invalid code', description: 'Please try again.' });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Verification failed', description: error.message });
    } finally {
      setVerifying(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm('Disable Two-Factor Authentication?')) return;
    try {
      const { error } = await supabase.functions.invoke('totp', { body: { action: 'disable' } });
      if (error) throw error;
      setTwoFAEnabled(false);
      toast({ title: 'Two-Factor disabled', description: '2FA has been turned off for your account.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to disable 2FA', description: error.message });
    }
  };

  const require2FA = async (): Promise<boolean> => {
    if (!twoFAEnabled) return true;
    const code = window.prompt('Enter your 6-digit 2FA code to continue');
    if (!code) return false;
    try {
      const { data, error } = await supabase.functions.invoke('totp', { body: { action: 'validate', code } });
      if (error) throw error;
      if (data?.valid) return true;
      toast({ variant: 'destructive', title: 'Invalid 2FA code', description: 'Please try again.' });
      return false;
    } catch (error: any) {
      toast({ variant: 'destructive', title: '2FA validation failed', description: error.message });
      return false;
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all password fields.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please ensure both new password fields match.",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating password",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const proceed = await require2FA();
      if (!proceed) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      const exportData = {
        user: {
          id: user?.id,
          email: user?.email,
          created_at: user?.created_at
        },
        profile: profile,
        exported_at: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calmora-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been successfully exported.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error.message,
      });
    }
  };

  const revokeAllSessions = async () => {
    if (!confirm('This will sign you out of all devices. Continue?')) {
      return;
    }

    const proceed = await require2FA();
    if (!proceed) return;

    try {
      await signOut();
      toast({
        title: "Sessions revoked",
        description: "You have been signed out of all devices.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error revoking sessions",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Privacy & Security</h1>
          <p className="text-muted-foreground mt-2">
            Manage your privacy settings and account security
          </p>
        </div>

        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Account Security
            </CardTitle>
            <CardDescription>
              Manage your password and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Secure your account with 2FA</p>
                </div>
                {twoFAEnabled ? (
                  <Badge variant="secondary">Enabled</Badge>
                ) : (
                  <Badge variant="outline">Disabled</Badge>
                )}
              </div>

              {!twoFAEnabled && !qrDataUrl && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                  <Button size="sm" onClick={enable2FA}>Enable 2FA</Button>
                </div>
              )}

              {!twoFAEnabled && qrDataUrl && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="flex flex-col items-center gap-2">
                    <img src={qrDataUrl} alt="Scan QR code for TOTP setup" className="w-40 h-40" />
                    <p className="text-xs text-muted-foreground">Scan with Google Authenticator or Authy</p>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="totpCode">Enter 6-digit code</Label>
                    <Input
                      id="totpCode"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="123456"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                    <div className="flex gap-2">
                      <Button onClick={verify2FA} disabled={verifying || totpCode.length !== 6}>
                        {verifying ? 'Verifying...' : 'Verify & Enable'}
                      </Button>
                      <Button variant="ghost" onClick={() => { setQrDataUrl(null); setOtpAuthUrl(null); setTotpCode(''); }}>Cancel</Button>
                    </div>
                  </div>
                </div>
              )}

              {twoFAEnabled && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">2FA is active on your account.</p>
                  <Button variant="destructive" size="sm" onClick={disable2FA}>Disable 2FA</Button>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Key className="w-4 h-4" />
                Change Password
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <Button onClick={changePassword} disabled={loading} className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Privacy Controls
            </CardTitle>
            <CardDescription>
              Control how your data is collected and used
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Data Collection</Label>
                <p className="text-sm text-muted-foreground">
                  Allow collection of usage data to improve the app
                </p>
              </div>
              <Switch
                checked={privacySettings.data_collection}
                onCheckedChange={(checked) => 
                  setPrivacySettings(prev => ({ ...prev, data_collection: checked }))
                }
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Share anonymous analytics to help improve features
                </p>
              </div>
              <Switch
                checked={privacySettings.analytics}
                onCheckedChange={(checked) => 
                  setPrivacySettings(prev => ({ ...prev, analytics: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Third-party Sharing</Label>
                <p className="text-sm text-muted-foreground">
                  Allow sharing data with trusted third-party services
                </p>
              </div>
              <Switch
                checked={privacySettings.third_party_sharing}
                onCheckedChange={(checked) => 
                  setPrivacySettings(prev => ({ ...prev, third_party_sharing: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive promotional emails and product updates
                </p>
              </div>
              <Switch
                checked={privacySettings.marketing_emails}
                onCheckedChange={(checked) => 
                  setPrivacySettings(prev => ({ ...prev, marketing_emails: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Manage devices that have access to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{session.device}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.location} • Active {new Date(session.lastActive).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {session.current && (
                  <Badge variant="secondary">Current</Badge>
                )}
              </div>
            ))}
            <Button 
              variant="destructive" 
              onClick={revokeAllSessions}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Revoke All Sessions
            </Button>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Data Export
            </CardTitle>
            <CardDescription>
              Download a copy of your data for backup or transfer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You can export your data at any time. This includes your profile information,
                settings, and any data you've stored in the app.
              </p>
              <Button onClick={exportData} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export My Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};