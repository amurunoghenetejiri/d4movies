import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — D4TECH Movies" }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue watching (optional — you can also browse without an account)."
      foot={<>Don't have an account? <Link to="/register" className="text-primary">Create one</Link></>}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setTimeout(() => { toast.success("Welcome back!"); nav({ to: "/" }); }, 900);
        }}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@d4tech.com" required className="mt-1" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pw">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary">Forgot?</Link>
          </div>
          <Input id="pw" type="password" placeholder="••••••••" required className="mt-1" />
        </div>
        <Button type="submit" className="w-full rounded-full glow-emerald" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
        <div className="text-center text-xs text-muted-foreground">or continue with</div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="rounded-full" onClick={(e) => { e.preventDefault(); toast("Coming in Phase 2"); }}>Google</Button>
          <Button variant="outline" className="rounded-full" onClick={(e) => { e.preventDefault(); toast("Coming in Phase 2"); }}>Apple</Button>
        </div>
        <Button asChild variant="ghost" className="w-full rounded-full"><Link to="/">Continue as guest</Link></Button>
      </form>
    </AuthLayout>
  );
}
