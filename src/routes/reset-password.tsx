import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set New Password — D4TECH Movies" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    nav({ to: "/" });
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Enter your new password below."
      foot={<>Back to <Link to="/login" className="text-primary">Login</Link></>}
    >
      <form className="space-y-4" onSubmit={submit}>
        <div><Label>New password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" placeholder="At least 8 characters" /></div>
        <div><Label>Confirm password</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="mt-1" /></div>
        <Button className="w-full rounded-full glow-emerald" type="submit" disabled={loading}>{loading ? "Updating..." : "Update password"}</Button>
      </form>
    </AuthLayout>
  );
}
