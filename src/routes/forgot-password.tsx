import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset Password — D4TECH Movies" }] }),
  component: Forgot,
});

function Forgot() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Reset link sent");
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email and we'll send you a reset link."
      foot={<>Back to <Link to="/login" className="text-primary">Login</Link></>}
    >
      {sent ? (
        <div className="glass rounded-2xl p-6 text-sm">
          Check your inbox — we've sent a reset link to <span className="text-primary">{email}</span>.
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@d4tech.com" className="mt-1" /></div>
          <Button className="w-full rounded-full glow-emerald" type="submit" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button>
        </form>
      )}
    </AuthLayout>
  );
}
