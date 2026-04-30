import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionTitle } from "./GeneralSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { Member, Role } from "@/types";

const initial: Member[] = [
  { id: "m1", role: "admin", user: { id: "u_1", name: "Ada Lovelace", email: "ada@vaultdocs.io", role: "admin", created_at: "" } },
  { id: "m2", role: "editor", user: { id: "u_2", name: "Grace Hopper", email: "grace@vaultdocs.io", role: "editor", created_at: "" } },
  { id: "m3", role: "viewer", user: { id: "u_3", name: "Linus T.", email: "linus@vaultdocs.io", role: "viewer", created_at: "" } },
];

export default function MembersSettings() {
  const [members, setMembers] = useState<Member[]>(initial);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");

  return (
    <div className="space-y-6 max-w-xl">
      <SectionTitle title="Invite a member" />
      <div className="flex gap-2">
        <Input placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1" />
        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => {
          if (!email) return;
          setMembers([...members, { id: Math.random().toString(), role, user: { id: Math.random().toString(), name: email, email, role, created_at: "" } }]);
          setEmail("");
        }}>Invite</Button>
      </div>

      <SectionTitle title={`Members (${members.length})`} />
      <ul className="divide-y divide-border border border-border rounded-lg">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 p-3">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-sm font-semibold">
              {m.user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-muted">{m.role}</span>
            <button
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
              onClick={() => setMembers(members.filter((x) => x.id !== m.id))}
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
