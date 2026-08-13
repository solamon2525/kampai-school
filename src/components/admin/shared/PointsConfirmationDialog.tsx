import { useEffect } from 'react';
import { PersonAvatar } from '@/components/shared/PersonAvatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface PointsConfirmation {
  studentName: string;
  photoUrl: string | null;
  latestPoints: number;
  accumulatedPoints: number;
}

interface PointsConfirmationDialogProps {
  confirmation: PointsConfirmation | null;
  title: string;
  latestLabel: string;
  accumulatedLabel: string;
  onClose: () => void;
}

const fmtPoints = (value: number) => value.toLocaleString('th-TH');

export const PointsConfirmationDialog = ({
  confirmation,
  title,
  latestLabel,
  accumulatedLabel,
  onClose,
}: PointsConfirmationDialogProps) => {
  useEffect(() => {
    if (!confirmation) return;
    const timer = window.setTimeout(onClose, 5000);
    return () => window.clearTimeout(timer);
  }, [confirmation, onClose]);

  return (
    <Dialog open={confirmation !== null} onOpenChange={(open) => !open && confirmation && onClose()}>
      <DialogContent className="max-w-2xl border-border bg-card px-5 py-8 text-center sm:px-10 sm:py-10">
        {confirmation && (
          <>
            <DialogHeader className="items-center text-center">
              <div className="mb-2 flex items-center gap-3">
                <PersonAvatar
                  name={confirmation.studentName}
                  photoUrl={confirmation.photoUrl}
                  size="lg"
                  className="ring-4 ring-primary/20"
                />
                <div className="text-left">
                  <DialogTitle className="text-xl font-extrabold text-foreground sm:text-2xl">
                    {title}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-base font-semibold text-foreground/75 sm:text-lg">
                    {confirmation.studentName}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5">
                <p className="text-sm font-bold text-foreground sm:text-base">{latestLabel}</p>
                <p className="mt-2 text-4xl font-black tabular-nums text-primary sm:text-5xl">
                  +{fmtPoints(confirmation.latestPoints)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-primary p-5 text-primary-foreground">
                <p className="text-sm font-bold sm:text-base">{accumulatedLabel}</p>
                <p className="mt-2 text-4xl font-black tabular-nums sm:text-5xl">
                  {fmtPoints(confirmation.accumulatedPoints)}
                </p>
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              หน้าต่างนี้จะปิดอัตโนมัติภายใน 5 วินาที
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
