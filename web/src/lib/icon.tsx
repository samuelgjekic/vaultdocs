import {
  Book, BookOpen, FileText, Files, Folder, FolderOpen,
  Code, Code2, Terminal, Bug, Cpu, Database, Server, Cloud,
  Settings, Wrench, Hammer, Zap, Rocket, Sparkles,
  Lightbulb, Star, Flame, Heart, Bookmark, Tag,
  Lock, Unlock, Key, Shield, AlertCircle, CheckCircle2,
  MessageSquare, Bell, Mail, Megaphone,
  Globe, Map, Compass, Flag, Image as ImageIcon,
} from "lucide-react";

export const LUCIDE_ICONS = {
  // Docs
  Book, BookOpen, FileText, Files, Folder, FolderOpen,
  // Code
  Code, Code2, Terminal, Bug, Cpu, Database, Server, Cloud,
  // Tools
  Settings, Wrench, Hammer, Zap, Rocket, Sparkles,
  // Symbols
  Lightbulb, Star, Flame, Heart, Bookmark, Tag,
  // Status
  Lock, Unlock, Key, Shield, AlertCircle, CheckCircle2,
  // Comms
  MessageSquare, Bell, Mail, Megaphone,
  // World
  Globe, Map, Compass, Flag,
} as const;

export type LucideName = keyof typeof LUCIDE_ICONS;

const LUCIDE_PREFIX = "lucide:";

export function isLucideIcon(value: string | null | undefined): value is `lucide:${string}` {
  return typeof value === "string" && value.startsWith(LUCIDE_PREFIX);
}

export function isImageIcon(value: string | null | undefined): boolean {
  if (typeof value !== "string") return false;
  return value.startsWith("data:image/") || value.startsWith("http://") || value.startsWith("https://");
}

interface RenderProps {
  value: string | null | undefined;
  /** CSS size for image / lucide / emoji rendering */
  className?: string;
  /** Fallback when value is empty */
  fallback?: React.ReactNode;
}

/**
 * Renders an icon string. Supports four formats:
 *   - null / ""      → fallback
 *   - "lucide:Name"  → Lucide icon component
 *   - data:|http(s)  → <img> tag
 *   - otherwise      → plain text (emoji)
 */
export function IconRender({ value, className = "h-5 w-5", fallback = null }: RenderProps) {
  if (!value || value.trim() === "") return <>{fallback}</>;

  if (isLucideIcon(value)) {
    const name = value.slice(LUCIDE_PREFIX.length) as LucideName;
    const Cmp = LUCIDE_ICONS[name];
    if (Cmp) return <Cmp className={className} />;
    return <>{fallback}</>;
  }

  if (isImageIcon(value)) {
    return <img src={value} alt="" className={`${className} object-cover rounded`} />;
  }

  // emoji or any other plain text
  return <span className={className.includes("text-") ? className : `${className} inline-flex items-center justify-center text-2xl leading-none`}>{value}</span>;
}

export const lucideIconValue = (name: LucideName) => `${LUCIDE_PREFIX}${name}`;
