import { useParams } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSpace } from "@/api/spaces";
import { SectionTitle } from "./GeneralSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DangerSettings() {
  const { orgSlug = "", spaceSlug = "" } = useParams();
  const { data: space } = useQuery({ queryKey: ["space", orgSlug, spaceSlug], queryFn: () => getSpace(orgSlug, spaceSlug) });
  const [confirm, setConfirm] = useState("");
  if (!space) return null;
  return (
    <div className="space-y-4 max-w-xl">
      <SectionTitle title="Delete space" subtitle="This action cannot be undone." />
      <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-4 space-y-3">
        <p className="text-sm">
          Type <strong className="font-mono">{space.name}</strong> to confirm.
        </p>
        <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={space.name} />
        <Button variant="destructive" disabled={confirm !== space.name}>
          Delete this space
        </Button>
      </div>
    </div>
  );
}
