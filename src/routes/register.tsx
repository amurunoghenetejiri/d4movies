import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create Account — D4TECH Movies" }] }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created! Check your email if confirmation is required.");
    nav({ to: "/" });
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error(res.error.message ?? "Google sign-up failed");
  };

  return (
    <AuthLayout
      title="Join D4TECH"
      subtitle="Create a free account — or keep browsing without one."
      foot={<>Already have an account? <Link to="/login" className="text-primary">Sign in</Link></>}
    >
      <form className="space-y-4" onSubmit={submit}>
        <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" placeholder="Your name" /></div>
        <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" placeholder="you@d4tech.com" /></div>
        <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" placeholder="At least 8 characters" /></div>
        <Button type="submit" className="w-full rounded-full glow-emerald" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
        <div className="text-center text-xs text-muted-foreground">or</div>
        <Button type="button" variant="outline" className="w-full rounded-full" onClick={google}>Continue with Google</Button>
        <Button asChild variant="ghost" className="w-full rounded-full"><Link to="/">Continue as guest</Link></Button>
      </form>
    </AuthLayout>
  );
}
