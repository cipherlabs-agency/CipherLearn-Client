"use client";

import * as React from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

export interface AppSelectorProps {
  apps: AppItem[];
  selected: string[];
  onToggle: (id: string) => void;
  label?: string;
  className?: string;
}

interface AppAvatarProps {
  app: AppItem;
  isSelected: boolean;
  onClick: () => void;
}

function AppAvatar({ app, isSelected, onClick }: AppAvatarProps) {
  const Icon = app.icon;
  return (
    <motion.button
      layoutId={`app-${app.id}`}
      onClick={onClick}
      className="group relative flex flex-col items-center gap-2 outline-none cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div
        className={cn(
          "relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 border shadow-sm",
          isSelected 
            ? "bg-white text-black border-primary/20 shadow-md dark:bg-neutral-800 dark:text-white dark:border-white/20" 
            : "bg-muted/30 text-muted-foreground border-transparent grayscale hover:grayscale-0 hover:bg-muted/50"
        )}
      >
        <Icon className="w-6 h-6" />
        
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow border border-background"
            >
              <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <span
        className={cn(
          "text-xs font-medium truncate max-w-[80px] transition-colors duration-200",
          isSelected ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {app.label}
      </span>
    </motion.button>
  );
}

export function AppSelector({
  apps,
  selected,
  onToggle,
  label,
  className,
}: AppSelectorProps) {

  return (
    <div className={cn("relative", className)}>
      {label && (
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          {label}
        </div>
      )}
      <div className="flex items-start gap-4 flex-wrap">
        <LayoutGroup>
          {apps.map((app) => (
            <AppAvatar
              key={app.id}
              app={app}
              isSelected={selected.includes(app.id)}
              onClick={() => onToggle(app.id)}
            />
          ))}
        </LayoutGroup>
      </div>
    </div>
  );
}
