import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    isClearing: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null, isClearing: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, isClearing: false };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught error:', error, errorInfo);
    }

    handleReloadWithCacheClear = async () => {
        this.setState({ isClearing: true });
        try {
            if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map((r) => r.unregister()));
            }
            if (typeof window !== 'undefined' && 'caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map((k) => caches.delete(k)));
            }
        } catch (e) {
            console.warn('Cache clear error:', e);
        }
        const url = new URL(window.location.href);
        url.searchParams.set('reset_sw', '1');
        url.searchParams.set('_t', String(Date.now()));
        window.location.replace(url.toString());
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="max-w-md w-full text-center space-y-4">
                    <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
                    <h1 className="text-2xl font-bold text-foreground">เกิดข้อผิดพลาด</h1>
                    <p className="text-muted-foreground text-sm">
                        ขออภัย ระบบพบข้อผิดพลาดจากแคชเก่าหรือการเชื่อมต่อ กรุณากดปุ่มเพื่อล้างแคชและโหลดข้อมูลล่าสุด
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center pt-2">
                        <Button
                            onClick={this.handleReloadWithCacheClear}
                            disabled={this.state.isClearing}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                        >
                            <RefreshCw className={`w-4 h-4 ${this.state.isClearing ? 'animate-spin' : ''}`} />
                            {this.state.isClearing ? 'กำลังล้างแคช...' : 'ล้างแคชและโหลดใหม่'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => (window.location.href = '/')}
                            className="gap-1.5"
                        >
                            <Home className="w-4 h-4" />
                            กลับหน้าแรก
                        </Button>
                    </div>
                    {this.state.error && (
                        <pre className="mt-4 text-xs text-left bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 overflow-auto max-h-48 font-mono">
                            {this.state.error.message}
                            {'\n\n'}
                            {this.state.error.stack}
                        </pre>
                    )}
                </div>
            </div>
        );
    }
}
