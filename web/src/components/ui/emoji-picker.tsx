import { useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IconRender, LUCIDE_ICONS, lucideIconValue, type LucideName } from "@/lib/icon";
import { Smile, Shapes, Upload, Ban } from "lucide-react";

interface IconPickerProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
}

const EMOJIS = [
  "📘", "📗", "📕", "📙", "📔", "📓", "📒", "📚", "📖", "🗂️", "📂", "📁", "🗃️", "🗄️", "📋", "📝",
  "⚙️", "🛠️", "🔧", "🔨", "⚡", "🚀", "✨", "🎯", "🎨", "🧩", "🔬", "🧪",
  "💬", "💭", "📣", "📢", "📡", "✉️", "📨",
  "✅", "⚠️", "❌", "🚧", "🔒", "🔓", "🔑",
  "⭐", "🔥", "💡", "🌟", "🏷️", "🎁",
  "🐙", "🐳", "🦊", "🦄", "🤖", "👻",
];

const TABS = ["emoji", "icon", "upload"] as const;
type Tab = typeof TABS[number];

const MAX_UPLOAD_BYTES = 200 * 1024; // 200 KB

// Re-exported for callers that already import { EmojiPicker }
export { IconPicker as EmojiPicker };

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("emoji");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const select = (next: string | null) => {
    onChange(next);
    setOpen(false);
  };

  const handleFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Pick an image file.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError(`Image too large (max ${Math.round(MAX_UPLOAD_BYTES / 1024)} KB).`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") select(reader.result);
    };
    reader.onerror = () => setUploadError("Couldn't read the file.");
    reader.readAsDataURL(file);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Choose icon"
          className="h-12 w-12 rounded-md border border-border bg-background flex items-center justify-center hover:border-foreground/30 transition-colors overflow-hidden"
        >
          <IconRender
            value={value}
            className="h-7 w-7"
            fallback={<span className="text-muted-foreground text-xs">None</span>}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 p-0">
        <div className="flex items-center border-b border-border">
          <TabBtn active={tab === "emoji"} onClick={() => setTab("emoji")} icon={<Smile className="h-3.5 w-3.5" />} label="Emoji" />
          <TabBtn active={tab === "icon"} onClick={() => setTab("icon")} icon={<Shapes className="h-3.5 w-3.5" />} label="Icon" />
          <TabBtn active={tab === "upload"} onClick={() => setTab("upload")} icon={<Upload className="h-3.5 w-3.5" />} label="Upload" />
          <button
            type="button"
            onClick={() => select(null)}
            className="ml-auto px-3 py-2 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            title="Use no icon"
          >
            <Ban className="h-3.5 w-3.5" />
            None
          </button>
        </div>

        <div className="p-2 max-h-72 overflow-y-auto">
          {tab === "emoji" && (
            <div className="grid grid-cols-8 gap-0.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => select(e)}
                  className={`h-8 w-8 rounded text-lg leading-none flex items-center justify-center hover:bg-muted transition-colors ${value === e ? "bg-muted ring-1 ring-primary/40" : ""}`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {tab === "icon" && (
            <div className="grid grid-cols-8 gap-0.5">
              {(Object.keys(LUCIDE_ICONS) as LucideName[]).map((name) => {
                const Cmp = LUCIDE_ICONS[name];
                const v = lucideIconValue(name);
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => select(v)}
                    className={`h-8 w-8 rounded flex items-center justify-center hover:bg-muted transition-colors ${value === v ? "bg-muted ring-1 ring-primary/40" : ""}`}
                  >
                    <Cmp className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          )}

          {tab === "upload" && (
            <div className="space-y-2 p-2">
              <p className="text-xs text-muted-foreground">
                Pick a square image. Max {Math.round(MAX_UPLOAD_BYTES / 1024)} KB. PNG / JPG / SVG.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
                className="block w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer file:text-xs hover:file:bg-primary/90"
              />
              {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
              {value && value.startsWith("data:image/") && (
                <div className="flex items-center gap-2 p-2 rounded bg-muted">
                  <img src={value} alt="" className="h-8 w-8 rounded object-cover" />
                  <span className="text-xs text-muted-foreground">Current upload</span>
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 text-xs inline-flex items-center gap-1.5 border-b-2 transition-colors ${active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
    >
      {icon}
      {label}
    </button>
  );
}
