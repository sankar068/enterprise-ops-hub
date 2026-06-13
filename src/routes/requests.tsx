import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/requests")({
  head: () => ({ meta: [{ title: "My Requests · InnoOps AI" }] }),
  component: MyRequests,
});

type Req = {
  id: string;
  request_id: string;
  department: string;
  request_type: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
};

function MyRequests() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: rows } = await supabase
        .from("requests")
        .select("id,request_id,department,request_type,title,status,priority,created_at")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });
      setItems((rows as Req[] | null) ?? []);
      setLoading(false);
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-hero text-white">
              <Bot className="h-4 w-4" />
            </div>
            <span className="font-display font-bold">InnoOps AI</span>
          </Link>
          <Link to="/employee">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <h1 className="font-display text-2xl font-bold">My Requests</h1>
        <p className="text-sm text-muted-foreground">
          Everything you've submitted through InnoOps AI.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No requests yet.{" "}
              <Link to="/employee" className="text-accent underline">
                Start one
              </Link>
              .
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Request ID</th>
                  <th className="px-4 py-3 text-left">Dept</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Created</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 font-mono text-xs">{r.request_id}</td>
                    <td className="px-4 py-3">{r.department}</td>
                    <td className="px-4 py-3">{r.title}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{r.priority}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
