import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Space } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { useSpaceStore } from "@/store/space";

export function SpacePasswordGate({ space }: { space: Space }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const unlock = useSpaceStore((s) => s.unlockSpace);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-sm w-full bg-card border border-border rounded-xl p-8 shadow-sm">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center mb-4">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold mb-1">{space.name}</h1>
        <p className="text-sm text-muted-foreground mb-6">{space.description ?? "This space is protected."}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // mock: any non-empty password unlocks
            if (!pw) { setErr("Enter a password"); return; }
            unlock(space.slug);
            navigate(0);
          }}
          className="space-y-3"
        >
          <Input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
          {err && <p className="text-xs text-destructive">{err}</p>}
          <Button type="submit" className="w-full">Unlock</Button>
        </form>
      </div>
    </div>
  );
}
