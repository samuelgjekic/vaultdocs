import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/vaultdocs-logo.png";
import { getSettings } from "@/api/settings";
import { useAuthStore } from "@/store/auth";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const { data: settings, isLoading } = useQuery({ queryKey: ["settings"], queryFn: getSettings });

  if (isLoading) return null;

  if (settings && !settings.registration_enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Registration is disabled.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="VaultDocs" width={48} height={48} className="mb-3" />
          <h1 className="text-xl font-semibold">Create your account</h1>
        </div>
        <form
          className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr("");
            if (password !== confirm) { setErr("Passwords don’t match"); return; }
            try {
              await register({ name, email, password, password_confirmation: confirm });
              navigate("/");
            } catch (e: unknown) {
              const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
              setErr(msg ?? "Registration failed");
            }
          }}
        >
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <div className="space-y-1.5"><Label>Confirm</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <Button type="submit" className="w-full">Create account</Button>
          <p className="text-xs text-center text-muted-foreground">
            Already have one? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
