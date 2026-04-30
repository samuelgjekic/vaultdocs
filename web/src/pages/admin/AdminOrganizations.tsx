import { SectionTitle } from "../space-settings/GeneralSettings";
import { organizations } from "@/mock/data";

export default function AdminOrganizations() {
  return (
    <div className="space-y-4">
      <SectionTitle title="Organizations" />
      <ul className="divide-y divide-border border border-border rounded-lg">
        {organizations.map((o) => (
          <li key={o.id} className="p-3 flex items-center justify-between">
            <div>
              <p className="font-medium">{o.name}</p>
              <p className="text-xs text-muted-foreground">/{o.slug}</p>
            </div>
            <span className="text-xs text-muted-foreground">{o.created_at.slice(0, 10)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
