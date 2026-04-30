import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/vaultdocs-logo.png";
import { Check, Loader2 } from "lucide-react";
import { getSettings, runSetup } from "@/api/settings";
import { useAuthStore } from "@/store/auth";

export default function Setup() {
  const [step, setStep] = useState(1);
  const [appName, setAppName] = useState("VaultDocs");
  const [admin, setAdmin] = useState({ name: "", email: "", password: "" });
  const [org, setOrg] = useState({ name: "", slug: "" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });

  useEffect(() => {
    if (settings && !settings.setup_required) navigate("/", { replace: true });
  }, [settings, navigate]);

  const submit = async () => {
    setSubmitting(true);
    setErr("");
    try {
      await runSetup({
        app_name: appName,
        admin_name: admin.name,
        admin_email: admin.email,
        admin_password: admin.password,
        organization_name: org.name,
      });
      await fetchMe();
      qc.invalidateQueries();
      setStep(4);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setErr(msg ?? "Setup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="VaultDocs" width={48} height={48} />
        </div>
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <Stepper step={step} />
          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold mb-1">Welcome</h2>
              <p className="text-sm text-muted-foreground mb-4">Let’s get your VaultDocs installation set up.</p>
              <Label>Application name</Label>
              <Input value={appName} onChange={(e) => setAppName(e.target.value)} className="mt-1.5 mb-4" />
              <Button className="w-full" onClick={() => setStep(2)}>Continue</Button>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold mb-4">Create admin account</h2>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={admin.name} onChange={(e) => setAdmin({ ...admin, name: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={admin.email} onChange={(e) => setAdmin({ ...admin, email: e.target.value })} /></div>
                <div><Label>Password</Label><Input type="password" value={admin.password} onChange={(e) => setAdmin({ ...admin, password: e.target.value })} /></div>
              </div>
              <Button className="w-full mt-4" onClick={() => setStep(3)}>Continue</Button>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="text-lg font-semibold mb-4">Create your first organization</h2>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} /></div>
                <div><Label>Slug</Label><Input value={org.slug} onChange={(e) => setOrg({ ...org, slug: e.target.value })} /></div>
              </div>
              {err && <p className="text-xs text-destructive mt-2">{err}</p>}
              <Button className="w-full mt-4" onClick={submit} disabled={submitting}>
                {submitting ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Setting up…</> : "Finish setup"}
              </Button>
            </>
          )}
          {step === 4 && (
            <>
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center mb-3">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold mb-1">All set!</h2>
              <p className="text-sm text-muted-foreground mb-4">{appName} is ready. Let’s create your first space.</p>
              <Button className="w-full" onClick={() => navigate("/")}>Go to dashboard</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-muted"}`} />
      ))}
    </div>
  );
}
