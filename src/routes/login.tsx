import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — D4TECH Movies" }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back!");
    nav({ to: "/" });
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error(res.error.message ?? "Google sign-in failed");
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue watching (optional — you can also browse without an account)."
      foot={<>Don't have an account? <Link to="/register" className="text-primary">Create one</Link></>}
    >
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@d4tech.com" required className="mt-1" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pw">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary">Forgot?</Link>
          </div>
          <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="mt-1" />
        </div>
        <Button type="submit" className="w-full rounded-full glow-emerald" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
        <div className="text-center text-xs text-muted-foreground">or continue with</div>
        <Button type="button" variant="outline" className="w-full rounded-full" onClick={google}>Continue with Google</Button>
        <Button asChild variant="ghost" className="w-full rounded-full"><Link to="/">Continue as guest</Link></Button>
      </form>
    </AuthLayout>
  );
}
