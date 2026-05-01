import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Globe, Lock, Eye, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { createSpace } from "@/api/spaces";
import type { Space } from "@/types";

interface Props {
  orgSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VIS_OPTIONS = [
  { value: "public", icon: Globe, label: "Public", desc: "Anyone on the internet can read." },
  { value: "private", icon: Lock, label: "Private", desc: "Only members of this organization." },
  { value: "unlisted", icon: Eye, label: "Unlisted", desc: "Anyone with the link can read." },
] as const;

type Visibility = (typeof VIS_OPTIONS)[number]["value"];

export function CreateSpaceDialog({ orgSlug, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<string>("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [err, setErr] = useState("");

  const reset = () => {
    setName(""); setDescription(""); setIcon(""); setVisibility("private"); setErr("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setErr("");
    try {
      const space: Space = await createSpace(orgSlug, {
        name: name.trim(),
        visibility,
        description: description.trim() || undefined,
        icon: icon || undefined,
      });
      qc.invalidateQueries({ queryKey: ["spaces"] });
      toast.success(`Created “${space.name}”`);
      onOpenChange(false);
      reset();
      navigate(`/${space.org_slug}/${space.slug}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setErr(msg ?? "Couldn't create space");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New space</DialogTitle>
          <DialogDescription>A space is a separate doc set with its own pages, search, and visibility.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-end gap-3">
            <div>
              <Label className="text-xs">Icon</Label>
              <div className="mt-1.5">
                <EmojiPicker value={icon} onChange={(v) => setIcon(v ?? "")} />
              </div>
            </div>
            <div className="flex-1">
              <Label htmlFor="cs-name" className="text-xs">Name</Label>
              <Input
                id="cs-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product Docs"
                autoFocus
                required
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cs-desc" className="text-xs">Description (optional)</Label>
            <Textarea
              id="cs-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What lives in this space?"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-xs">Visibility</Label>
            <div className="mt-1.5 space-y-1.5">
              {VIS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${
                    visibility === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-foreground/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    className="mt-1"
                    checked={visibility === opt.value}
                    onChange={() => setVisibility(opt.value)}
                  />
                  <opt.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {err && <p className="text-xs text-destructive">{err}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Creating</> : "Create space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
