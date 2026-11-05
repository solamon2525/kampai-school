import { useState, useEffect } from 'react';
import SchoolLogoMark from '@/components/SchoolLogoMark';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Lock, Mail, ArrowLeft, Eye, EyeOff, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password Recovery Mode (เมื่อผู้ใช้คลิกลิงก์กู้คืนรหัสผ่านจากอีเมล)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Forgot Password Dialog
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const safeRedirect = (path: string | null) => {
    if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
    return path;
  };

  const redirectByRole = async (userId: string) => {
    const pending = safeRedirect(searchParams.get('redirect'));
    const { data } = await supabase
      .from('user_roles' as any)
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    const role = (data as any)?.role ?? 'admin';

    if (pending) {
      const teacherPaths = pending.startsWith('/teacher');
      const parentPaths = pending.startsWith('/parent');
      const adminPaths = pending.startsWith('/admin');
      const allowed =
        (role === 'teacher' && teacherPaths) ||
        (role === 'parent' && parentPaths) ||
        (role === 'admin' && (adminPaths || teacherPaths || parentPaths)) ||
        (role === 'viewer' && !teacherPaths && !parentPaths && !adminPaths);
      if (allowed) {
        navigate(pending);
        return;
      }
    }

    if (role === 'teacher') navigate('/teacher');
    else if (role === 'parent') navigate('/parent');
    else navigate('/admin/dashboard');
  };

  useEffect(() => {
    // ตรวจสอบว่ามาจากการคลิกลิงก์ Recovery Email หรือไม่
    const hash = window.location.hash || '';
    if (hash.includes('type=recovery')) {
      setIsRecoveryMode(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      } else if (event === 'SIGNED_IN' && session?.user && !isRecoveryMode) {
        redirectByRole(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !window.location.hash.includes('type=recovery')) {
        redirectByRole(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyModifier = (e: React.KeyboardEvent) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      toast({
        title: 'กรุณากรอกอีเมล',
        description: 'กรุณาใส่อีเมลสำหรับเข้าสู่ระบบ',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      toast({
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        description: error.message === 'Invalid login credentials'
          ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบแป้นพิมพ์ภาษาอังกฤษ/ไทย'
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'เข้าสู่ระบบสำเร็จ',
        description: 'ยินดีต้อนรับเข้าสู่ระบบจัดการโรงเรียน',
      });
      if (data.user) await redirectByRole(data.user.id);
      else navigate('/admin/dashboard');
    }
    setIsLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({
        title: 'รหัสผ่านสั้นเกินไป',
        description: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: 'รหัสผ่านไม่ตรงกัน',
        description: 'กรุณากรอกรหัสผ่านใหม่และการยืนยันให้ตรงกัน',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingPassword(true);
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({
        title: 'ไม่สามารถเปลี่ยนรหัสผ่านได้',
        description: error.message,
        variant: 'destructive',
      });
      setIsUpdatingPassword(false);
    } else {
      toast({
        title: 'ตั้งรหัสผ่านใหม่สำเร็จ',
        description: 'กำลังนำท่านเข้าสู่ระบบ...',
      });
      setIsRecoveryMode(false);
      if (data.user) await redirectByRole(data.user.id);
      else navigate('/admin/dashboard');
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = forgotEmail.trim().toLowerCase();
    if (!targetEmail) {
      toast({
        title: 'กรุณากรอกอีเมล',
        description: 'ใส่อีเมลที่ลงทะเบียนไว้เพื่อรับลิงก์รีเซ็ตรหัสผ่าน',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingForgot(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${window.location.origin}/admin`,
      });
      if (error) throw error;

      toast({
        title: 'ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว',
        description: `ระบบส่งลิงก์ไปที่ ${targetEmail} แล้ว กรุณาตรวจสอบกล่องจดหมาย (รวมถึงโฟลเดอร์ Junk/Spam)`,
      });
      setIsForgotOpen(false);
    } catch (err: any) {
      toast({
        title: 'ไม่สามารถส่งลิงก์ได้',
        description: err?.message || 'เกิดข้อผิดพลาดในการส่งคำขอรีเซ็ตรหัสผ่าน',
        variant: 'destructive',
      });
    } finally {
      setIsSendingForgot(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <SchoolLogoMark className="w-20 h-20 mx-auto mb-4 bg-primary" fallbackClassName="text-accent text-2xl" />
          <CardTitle className="text-2xl text-primary">
            {isRecoveryMode ? 'ตั้งรหัสผ่านใหม่' : 'ระบบจัดการโรงเรียน'}
          </CardTitle>
          <CardDescription>
            {isRecoveryMode
              ? 'กรุณากำหนดรหัสผ่านใหม่สำหรับบัญชีของท่าน'
              : 'กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูล'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRecoveryMode ? (
            /* ═══ ฟอร์มตั้งรหัสผ่านใหม่เมื่อคลิกลิงก์จากอีเมล ═══ */
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label={showNewPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? 'กำลังบันทึกรหัสผ่านใหม่...' : 'บันทึกรหัสผ่านและเข้าสู่ระบบ'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsRecoveryMode(false)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  กลับไปหน้าเข้าสู่ระบบปกติ
                </button>
              </div>
            </form>
          ) : (
            /* ═══ ฟอร์มเข้าสู่ระบบปกติ ═══ */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="กรอกอีเมล (เช่น toom2lyou@gmail.com)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email.trim().toLowerCase());
                      setIsForgotOpen(true);
                    }}
                    className="text-xs text-primary hover:underline font-medium transition-colors"
                  >
                    ลืมรหัสผ่าน?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="กรอกรหัสผ่าน"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyModifier}
                    onKeyUp={handleKeyModifier}
                    className="pl-10 pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {capsLockOn && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 p-1.5 rounded border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>แป้นพิมพ์ Caps Lock กำลังเปิดอยู่</span>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับสู่หน้าหลัก
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Modal ลืมรหัสผ่าน ═══ */}
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-primary">
              <KeyRound className="w-5 h-5 text-primary" />
              ขอลิงก์รีเซ็ตรหัสผ่าน
            </DialogTitle>
            <DialogDescription>
              กรอกอีเมลที่ลงทะเบียนไว้กับระบบโรงเรียน ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังกล่องจดหมายของท่าน
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendResetEmail} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">อีเมลบัญชีผู้ใช้</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="เช่น toom2lyou@gmail.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-md text-xs text-muted-foreground space-y-1 border border-border">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                คำแนะนำ:
              </div>
              <p>• ตรวจสอบทั้งในกล่องจดหมายเข้า (Inbox) และโฟลเดอร์จดหมายขยะ (Spam/Junk)</p>
              <p>• เมื่อได้รับอีเมลแล้ว ให้คลิกลิงก์เพื่อกลับมากำหนดรหัสผ่านใหม่ได้ทันที</p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsForgotOpen(false)}
                disabled={isSendingForgot}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isSendingForgot}>
                {isSendingForgot ? 'กำลังส่งคำขอ...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLogin;
