import { SectionTitle } from "../space-settings/GeneralSettings";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const rows = [
  { name: "Ada Lovelace", email: "ada@vaultdocs.io", role: "admin", created: "2025-01-01" },
  { name: "Grace Hopper", email: "grace@vaultdocs.io", role: "editor", created: "2025-02-15" },
  { name: "Linus T.", email: "linus@vaultdocs.io", role: "viewer", created: "2025-03-04" },
];

export default function AdminUsers() {
  return (
    <div className="space-y-4">
      <SectionTitle title="Users" subtitle="Manage all users in this installation." />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.email}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className="text-muted-foreground">{r.email}</TableCell>
              <TableCell>{r.role}</TableCell>
              <TableCell className="text-muted-foreground">{r.created}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
