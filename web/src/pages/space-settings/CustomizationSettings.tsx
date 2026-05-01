import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSpace, updateSpace } from "@/api/spaces";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "./GeneralSettings";
import { toast } from "sonner";
import { Globe, Lock, Eye, Sun, Moon, Monitor } from "lucide-react";

const swatches = ["#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

export default function CustomizationSettings() {
  const { orgSlug = "", spaceSlug = "" } = useParams();
  const qc = useQueryClient();
  const { data: space } = useQuery({ queryKey: ["space", orgSlug, spaceSlug], queryFn: () => getSpace(orgSlug, spaceSlug) });
  const [form, setForm] = useState({
    visibility: "public" as "public" | "private" | "unlisted",
    password_protected: false,
    accent_color: "#4F46E5",
    default_theme: "system" as "light" | "dark" | "system",
    show_powered_by: true,
  });

  useEffect(() => {
    if (space) setForm({
      visibility: space.visibility,
      password_protected: !!space.password_protected,
      accent_color: space.accent_color ?? "#4F46E5",
      default_theme: (space.default_theme ?? "system") as "light" | "dark" | "system",
      show_powered_by: space.show_powered_by,
    });
  }, [space]);

  if (!space) return null;

  const visOpts = [
    { v: "public", icon: Globe, label: "Public", desc: "Anyone on the internet can view." },
    { v: "private", icon: Lock, label: "Private", desc: "Only invited members can view." },
    { v: "unlisted", icon: Eye, label: "Unlisted", desc: "Only people with the link can view." },
  ] as const;

  const themeOpts = [
    { v: "light", icon: Sun, label: "Light", desc: "Always light, regardless of OS preference." },
    { v: "dark", icon: Moon, label: "Dark", desc: "Always dark, regardless of OS preference." },
    { v: "system", icon: Monitor, label: "System", desc: "Match the visitor's operating system." },
  ] as const;

  return (
    <form
      className="space-y-6 max-w-xl"
      onSubmit={async (e) => {
        e.preventDefault();
        await updateSpace(orgSlug, space.slug, form);
        qc.invalidateQueries({ queryKey: ["space"] });
        toast.success("Customization saved");
      }}
    >
      <SectionTitle title="Visibility" />
      <div className="space-y-2">
        {visOpts.map((o) => (
          <label
            key={o.v}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.visibility === o.v ? "border-primary bg-primary-soft" : "border-border hover:border-foreground/20"}`}
          >
            <input type="radio" name="vis" className="mt-1" checked={form.visibility === o.v} onChange={() => setForm({ ...form, visibility: o.v })} />
            <o.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{o.label}</p>
              <p className="text-xs text-muted-foreground">{o.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <SectionTitle title="Password protection" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Require password</p>
          <p className="text-xs text-muted-foreground">For public spaces.</p>
        </div>
        <Switch checked={form.password_protected} onCheckedChange={(v) => setForm({ ...form, password_protected: v })} />
      </div>
      {form.password_protected && (
        <Input type="password" placeholder="Set password" />
      )}

      <SectionTitle title="Branding" />
      <div>
        <Label>Accent color</Label>
        <div className="flex items-center gap-2 mt-2">
          {swatches.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setForm({ ...form, accent_color: c })}
              className={`h-7 w-7 rounded-full border-2 ${form.accent_color === c ? "border-foreground" : "border-transparent"}`}
              style={{ background: c }}
              aria-label={c}
            />
          ))}
          <Input value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="w-28 ml-2" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Show "Powered by VaultDocs"</p>
          <p className="text-xs text-muted-foreground">Displayed in the sidebar footer.</p>
        </div>
        <Switch checked={form.show_powered_by} onCheckedChange={(v) => setForm({ ...form, show_powered_by: v })} />
      </div>

      <SectionTitle title="Default theme" subtitle="What visitors see if they haven't set a theme themselves." />
      <div className="space-y-2">
        {themeOpts.map((o) => (
          <label
            key={o.v}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${form.default_theme === o.v ? "border-primary bg-primary-soft" : "border-border hover:border-foreground/20"}`}
          >
            <input type="radio" name="theme" className="mt-1" checked={form.default_theme === o.v} onChange={() => setForm({ ...form, default_theme: o.v })} />
            <o.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{o.label}</p>
              <p className="text-xs text-muted-foreground">{o.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <Button type="submit">Save changes</Button>
    </form>
  );
}
