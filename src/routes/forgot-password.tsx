import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset Password — D4TECH Movies" }] }),
  component: Forgot,
});

function Forgot() {
  const [sent, setSent] = useState(false);
  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email and we'll send you a reset link."
      foot={<>Back to <Link to="/login" className="text-primary">Login</Link></>}
    >
      {sent ? (
        <div className="glass rounded-2xl p-6 text-sm">
          Check your inbox — we've sent a reset link. (Demo — Phase 1)
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); toast.success("Reset link sent"); }}>
          <div><Label>Email</Label><Input type="email" required placeholder="you@d4tech.com" className="mt-1" /></div>
          <Button className="w-full rounded-full glow-emerald" type="submit">Send reset link</Button>
        </form>
      )}
    </AuthLayout>
  );
}
