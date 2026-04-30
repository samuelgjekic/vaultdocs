import { SectionTitle } from "../space-settings/GeneralSettings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function AdminSettings() {
  return (
    <div className="space-y-6 max-w-xl">
      <SectionTitle title="Application" />
      <div><Label>App name</Label><Input defaultValue="VaultDocs" className="mt-1.5" /></div>

      <SectionTitle title="Registration" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Allow public registration</p>
          <p className="text-xs text-muted-foreground">Anyone can create an account.</p>
        </div>
        <Switch defaultChecked />
      </div>

      <SectionTitle title="SMTP" />
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Host</Label><Input className="mt-1.5" /></div>
        <div><Label>Port</Label><Input className="mt-1.5" defaultValue="587" /></div>
        <div className="col-span-2"><Label>User</Label><Input className="mt-1.5" /></div>
      </div>

      <Button>Save</Button>
    </div>
  );
}
