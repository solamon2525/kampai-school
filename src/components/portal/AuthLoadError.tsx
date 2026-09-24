import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';

export const AuthLoadError = () => {
  const { authError, retryAuth } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-6 text-foreground">
      <p role="alert" className="max-w-md text-center">{authError}</p>
      <Button onClick={retryAuth}>ลองใหม่</Button>
    </div>
  );
};
