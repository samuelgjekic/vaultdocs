import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { SectionTitle } from "../space-settings/GeneralSettings";

export default function AccountSettings() {
  const user = useAuthStore((s) => s.user);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  return (
    <div className="space-y-6 max-w-xl">
      <SectionTitle title="Profile" />
      <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
      <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" /></div>
      <Button>Save</Button>

      <SectionTitle title="Change password" />
      <div><Label>Current password</Label><Input type="password" className="mt-1.5" /></div>
      <div><Label>New password</Label><Input type="password" className="mt-1.5" /></div>
      <Button variant="outline">Update password</Button>
    </div>
  );
}
