import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSpace, updateSpace } from "@/api/spaces";
import { apiBaseURL } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { FileText, FileType, FileCode } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function GeneralSettings() {
  const { orgSlug = "", spaceSlug = "" } = useParams();
  const qc = useQueryClient();
  const { data: space } = useQuery({ queryKey: ["space", orgSlug, spaceSlug], queryFn: () => getSpace(orgSlug, spaceSlug) });
  const [form, setForm] = useState({ name: "", slug: "", description: "", icon: "" });

  useEffect(() => {
    if (space) setForm({ name: space.name, slug: space.slug, description: space.description ?? "", icon: space.icon ?? "" });
  }, [space]);

  if (!space) return null;

  return (
    <form
      className="space-y-6 max-w-xl"
      onSubmit={async (e) => {
        e.preventDefault();
        await updateSpace(orgSlug, space.slug, form);
        qc.invalidateQueries({ queryKey: ["space"] });
        toast.success("Settings saved");
      }}
    >
      <SectionTitle title="General" subtitle="Basic information about this space." />
      <div>
        <Label>Icon</Label>
        <div className="mt-1.5">
          <EmojiPicker
            value={form.icon}
            onChange={(emoji) => setForm({ ...form, icon: emoji ?? "" })}
          />
        </div>
      </div>
      <div><Label>Space name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" /></div>
      <div>
        <Label>Slug</Label>
        <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1.5" />
        <p className="text-xs text-muted-foreground mt-1">Changing the slug will break existing links.</p>
      </div>
      <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" rows={3} /></div>
      <Button type="submit">Save changes</Button>

      <ExportSection orgSlug={orgSlug} spaceSlug={space.slug} />
    </form>
  );
}

function ExportSection({ orgSlug, spaceSlug }: { orgSlug: string; spaceSlug: string }) {
  const download = (format: "pdf" | "md" | "txt") => {
    window.location.href = `${apiBaseURL}/orgs/${orgSlug}/spaces/${spaceSlug}/export?format=${format}`;
  };

  return (
    <div className="space-y-3 pt-4">
      <SectionTitle title="Export" subtitle="Download this space as a single file." />
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => download("pdf")}>
          <FileType className="h-3.5 w-3.5 mr-2" />
          Export as PDF
        </Button>
        <Button type="button" variant="outline" onClick={() => download("md")}>
          <FileCode className="h-3.5 w-3.5 mr-2" />
          Export as Markdown
        </Button>
        <Button type="button" variant="outline" onClick={() => download("txt")}>
          <FileText className="h-3.5 w-3.5 mr-2" />
          Export as TXT
        </Button>
      </div>
    </div>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-border pb-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}
