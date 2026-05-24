import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught error:', error, errorInfo);
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="max-w-md w-full text-center space-y-4">
                    <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
                    <h1 className="text-2xl font-bold text-foreground">เกิดข้อผิดพลาด</h1>
                    <p className="text-muted-foreground">
                        ขออภัย ระบบมีปัญหาชั่วคราว กรุณาลองโหลดหน้านี้อีกครั้ง
                    </p>
                    <div className="flex gap-2 justify-center pt-2">
                        <Button onClick={() => window.location.reload()}>
                            โหลดหน้านี้ใหม่
                        </Button>
                        <Button variant="outline" onClick={() => (window.location.href = '/')}>
                            กลับหน้าแรก
                        </Button>
                    </div>
                    {this.state.error && (
                        <pre className="mt-4 text-xs text-left bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-200 overflow-auto max-h-48 font-mono">
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
