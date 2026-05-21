import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeToggleProps {
  /** Control button visual style — defaults to ghost icon button */
  variant?: "ghost" | "outline";
  /** Button size */
  size?: "sm" | "default" | "icon";
  className?: string;
}

/**
 * Theme switcher with 3 options: Light / Dark / System.
 * Uses next-themes under the hood (provider is set up in main.tsx).
 */
export function ThemeToggle({
  variant = "ghost",
  size = "icon",
  className,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch: only render icon after mount (next-themes recommended pattern)
  useEffect(() => setMounted(true), []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          aria-label="เปลี่ยนธีม (Theme)"
        >
          {mounted ? (
            <>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </>
          ) : (
            <Sun className="h-5 w-5 opacity-0" />
          )}
          <span className="sr-only">สลับธีม</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[8rem]">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={theme === "light" ? "bg-accent font-medium" : ""}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>สว่าง</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={theme === "dark" ? "bg-accent font-medium" : ""}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>มืด</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={theme === "system" ? "bg-accent font-medium" : ""}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>ตามระบบ</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
