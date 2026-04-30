import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/vaultdocs-logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="VaultDocs" width={48} height={48} className="mb-3" />
          <h1 className="text-xl font-semibold">Sign in to VaultDocs</h1>
        </div>
        <form
          className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr("");
            setLoading(true);
            try {
              await login(email, password);
              navigate("/");
            } catch (e: unknown) {
              const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
              setErr(msg ?? "Sign in failed");
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a className="text-xs text-primary hover:underline" href="#">Forgot password?</a>
            </div>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            New here? <Link to="/register" className="text-primary hover:underline">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
