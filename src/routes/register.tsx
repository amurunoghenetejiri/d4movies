import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create Account — D4TECH Movies" }] }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  return (
    <AuthLayout
      title="Join D4TECH"
      subtitle="Create a free account — or keep browsing without one."
      foot={<>Already have an account? <Link to="/login" className="text-primary">Sign in</Link></>}
    >
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setLoading(true); setTimeout(() => { toast.success("Account created!"); nav({ to: "/" }); }, 900); }}>
        <div><Label>Name</Label><Input required className="mt-1" placeholder="Your name" /></div>
        <div><Label>Email</Label><Input type="email" required className="mt-1" placeholder="you@d4tech.com" /></div>
        <div><Label>Password</Label><Input type="password" required className="mt-1" placeholder="At least 8 characters" /></div>
        <Button type="submit" className="w-full rounded-full glow-emerald" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
        <Button asChild variant="ghost" className="w-full rounded-full"><Link to="/">Continue as guest</Link></Button>
      </form>
    </AuthLayout>
  );
}
