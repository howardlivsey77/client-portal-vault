import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/layout/PageContainer";
import { useToast } from "@/hooks/use-toast";

export default function CreatePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate("/auth");
      const must = (session.user.user_metadata as any)?.must_set_password;
      if (!must) return navigate("/");
      setChecking(false);
    })();
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast({ title: "Password too short", variant: "destructive" });
    if (password !== confirm) return toast({ title: "Passwords do not match", variant: "destructive" });

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({
      password,
      data: { must_set_password: false },
    });
    setSubmitting(false);

    if (error) {
      return toast({ title: "Could not set password", description: error.message, variant: "destructive" });
    }

    toast({ title: "Password set", description: "Please sign in with your new password." });
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (checking) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-md mx-auto py-10">
        <h1 className="text-2xl font-semibold mb-2">Create your password</h1>
        <p className="text-muted-foreground mb-6">Finish setting up your account.</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">New password</label>
            <input type="password" className="w-full rounded-md border px-3 py-2"
              value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password" required minLength={8} />
            <p className="text-xs text-muted-foreground mt-1">At least 8 characters.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm password</label>
            <input type="password" className="w-full rounded-md border px-3 py-2"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password" required />
          </div>

          <button type="submit"
            className="w-full inline-flex justify-center items-center rounded-md bg-primary text-primary-foreground px-4 py-2 disabled:opacity-60"
            disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save password
          </button>
        </form>
      </div>
    </PageContainer>
  );
}