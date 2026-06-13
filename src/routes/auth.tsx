import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in · InnoOps AI" }, { name: "description", content: "Sign in or create an InnoOps AI account." }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/employee" });
    });
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/employee" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name || email.split("@")[0] }, emailRedirectTo: `${window.location.origin}/employee` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. You're signed in.");
    navigate({ to: "/employee" });
  }

  function fillDemo(kind: "employee" | "admin") {
    setEmail(kind === "employee" ? "employee@innoops.ai" : "admin@innoops.ai");
    setPassword("demo123");
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-hero p-10 text-white md:flex">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/15 backdrop-blur"><Bot className="h-5 w-5" /></div>
          <span className="font-display text-xl font-bold">InnoOps AI</span>
        </Link>
        <div>
          <h2 className="font-display text-3xl font-bold leading-tight">One agent for HR, Finance & IT operations.</h2>
          <p className="mt-3 max-w-md text-white/80">Describe what you need. Foundry reasons, extracts, and routes it to the right workflow.</p>
        </div>
        <p className="text-xs text-white/60">Microsoft Agents League 2026 · Reasoning Agents Track</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 md:hidden">
            <Link to="/" className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-lg bg-hero text-white"><Bot className="h-5 w-5" /></div><span className="font-display text-lg font-bold">InnoOps AI</span></Link>
          </div>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="signin">Sign in</TabsTrigger><TabsTrigger value="signup">Create account</TabsTrigger></TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></div>
                <div><Label htmlFor="password">Password</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}</Button>
              </form>
              <div className="mt-6 rounded-lg border border-dashed border-border bg-secondary/50 p-3 text-xs">
                <div className="mb-2 font-semibold text-foreground">Demo accounts</div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => fillDemo("employee")}>Use Employee</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => fillDemo("admin")}>Use Super Admin</Button>
                </div>
                <p className="mt-2 text-muted-foreground">Sign up first if these accounts don't exist yet — the password is <code>demo123</code>.</p>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div><Label htmlFor="su-name">Full name</Label><Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Doe" /></div>
                <div><Label htmlFor="su-email">Email</Label><Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label htmlFor="su-pw">Password</Label><Input id="su-pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
