import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "secondary";
}

export interface EmptyStateProps {
  /** Lucide icon — used when no `illustration` is provided */
  icon?: LucideIcon;
  /** Optional custom illustration (SVG, img, or any ReactNode). Takes precedence over `icon`. */
  illustration?: ReactNode;
  /** Main heading text */
  title: string;
  /** Supporting description text (optional) */
  description?: string;
  /** Primary call-to-action button */
  action?: EmptyStateAction;
  /** Secondary call-to-action button */
  secondaryAction?: EmptyStateAction;
  /** Visual layout */
  variant?: "card" | "inline" | "full-page";
  className?: string;
}

/**
 * Reusable empty-state placeholder for lists, tables, and pages with no data.
 *
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon={Inbox}
 *   title="ยังไม่มีข้อมูล"
 *   description="เริ่มต้นโดยการเพิ่มรายการแรกของคุณ"
 *   action={{ label: "เพิ่มรายการ", icon: Plus, onClick: () => setOpen(true) }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  action,
  secondaryAction,
  variant = "card",
  className,
}: EmptyStateProps) {
  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "animate-in fade-in slide-in-from-bottom-2 duration-500",
        variant === "card" && "p-8 md:p-12",
        variant === "inline" && "py-8",
        variant === "full-page" && "min-h-[60vh] p-12",
      )}
    >
      {/* Icon or illustration */}
      {illustration ? (
        <div className="mb-6 w-full max-w-[240px]">{illustration}</div>
      ) : Icon ? (
        <div
          className={cn(
            "mb-4 flex items-center justify-center rounded-full bg-primary/10",
            variant === "full-page" ? "h-24 w-24" : "h-16 w-16",
          )}
        >
          <Icon
            className={cn(
              "text-primary",
              variant === "full-page" ? "h-12 w-12" : "h-8 w-8",
            )}
          />
        </div>
      ) : null}

      {/* Text */}
      <h3
        className={cn(
          "font-semibold text-foreground",
          variant === "full-page" ? "text-2xl" : "text-lg",
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "mt-2 max-w-md text-muted-foreground",
            variant === "full-page" ? "text-base" : "text-sm",
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant ?? "default"}
              size={variant === "full-page" ? "lg" : "default"}
            >
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant ?? "outline"}
              size={variant === "full-page" ? "lg" : "default"}
            >
              {secondaryAction.icon && (
                <secondaryAction.icon className="mr-2 h-4 w-4" />
              )}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (variant === "card") {
    return (
      <Card className={cn("bg-muted/30 border-dashed", className)}>
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    );
  }

  return <div className={className}>{content}</div>;
}
