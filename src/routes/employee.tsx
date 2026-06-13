import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  LogOut,
  Send,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Briefcase,
  Wallet,
  Wrench,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { chatWithAgent } from "@/lib/innoops/agent.functions";
import { generateRequestId } from "@/lib/innoops/ids";
import type { AgentResponse } from "@/lib/innoops/schema";

export const Route = createFileRoute("/employee")({
  head: () => ({ meta: [{ title: "Employee Dashboard · InnoOps AI" }] }),
  component: EmployeeDashboard,
});

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  agent?: AgentResponse;
  mode?: "foundry" | "demo";
};

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

function EmployeeDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm InnoOps AI. Tell me about a leave, expense, or IT issue — or ask 'show my pending requests'.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<Req[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", data.user.id)
        .maybeSingle();
      setUser({
        id: data.user.id,
        email: data.user.email ?? "",
        name: p?.name || data.user.email?.split("@")[0] || "Employee",
      });
      loadRequests(data.user.id);
    });
  }, [navigate]);

  async function loadRequests(uid: string) {
    const { data } = await supabase
      .from("requests")
      .select("id,request_id,department,request_type,title,status,priority,created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(20);
    setRequests((data as Req[] | null) ?? []);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading || !user) return;
    setInput("");
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", content };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setLoading(true);
    try {
      const apiMsgs = nextMsgs
        .filter((m) => m.id !== "welcome")
        .map(({ role, content }) => ({ role, content }));
      const resp = await chatWithAgent({ data: { messages: apiMsgs } });
      if (resp.mode === "demo") setDemoMode(true);
      const agent = resp.result;
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: agent.responseToUser,
          agent,
          mode: resp.mode,
        },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Agent error";
      toast.error(msg);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: `Sorry — ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function confirmRequest(agent: AgentResponse) {
    if (!user) return;
    if (agent.department === "Tracking" || agent.department === "Unsupported") return;
    const rid = generateRequestId(agent.department as "HR" | "Finance" | "IT");
    const initialStatus = agent.department === "IT" ? "Open" : "Pending";
    const { error, data } = await supabase
      .from("requests")
      .insert({
        request_id: rid,
        user_id: user.id,
        employee_name: user.name,
        department: agent.department,
        request_type: agent.requestType,
        title: agent.title,
        description: agent.description,
        priority: agent.priority,
        status: initialStatus,
        details: agent.extractedDetails,
        original_message: agent.description,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    await supabase.from("request_timeline").insert({
      request_id: data.id,
      action: "Created",
      actor_id: user.id,
      actor_name: user.name,
      note: `Submitted via InnoOps AI`,
    });
    toast.success(`Request ${rid} submitted.`);
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `✅ Request **${rid}** created and routed to ${agent.department}.`,
      },
    ]);
    loadRequests(user.id);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const stats = {
    total: requests.length,
    pending: requests.filter((r) =>
      ["Pending", "Open", "In Progress", "Information Required"].includes(r.status),
    ).length,
    approved: requests.filter((r) => ["Approved", "Resolved"].includes(r.status)).length,
    it: requests.filter((r) => r.department === "IT" && ["Open", "In Progress"].includes(r.status))
      .length,
  };

  const suggestions = [
    "Apply casual leave from June 20 to June 22 for personal work",
    "Submit ₹2,500 as travel reimbursement for client meeting on June 10. I have the receipt.",
    "My laptop camera is not working and I have an important meeting in one hour",
    "Show my pending requests",
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-hero text-white">
              <Bot className="h-4 w-4" />
            </div>
            <span className="font-display font-bold">InnoOps AI</span>
          </Link>
          <div className="flex items-center gap-2">
            {demoMode && (
              <Badge variant="outline" className="border-warning text-warning">
                <Sparkles className="mr-1 h-3 w-3" />
                Demo Mode
              </Badge>
            )}
            <Link to="/requests">
              <Button variant="ghost" size="sm">
                <ClipboardList className="mr-1 h-4 w-4" />
                My Requests
              </Button>
            </Link>
            <span className="hidden text-sm text-muted-foreground md:inline">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold">
            Welcome back, {user?.name?.split(" ")[0] || "there"}.
          </h1>
          <p className="text-sm text-muted-foreground">
            Describe what you need — InnoOps AI will route it for you.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            {
              label: "Total Requests",
              value: stats.total,
              icon: ClipboardList,
              color: "text-accent",
            },
            { label: "Pending", value: stats.pending, icon: Loader2, color: "text-warning" },
            {
              label: "Approved/Resolved",
              value: stats.approved,
              icon: CheckCircle2,
              color: "text-success",
            },
            { label: "Open IT Tickets", value: stats.it, icon: Wrench, color: "text-info" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="mt-2 text-2xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Chat */}
          <div className="flex flex-col rounded-2xl border border-border bg-card shadow-soft">
            <div className="border-b border-border px-5 py-3">
              <h2 className="font-display text-sm font-semibold">Chat with InnoOps AI</h2>
            </div>
            <div
              ref={scrollRef}
              className="max-h-[55vh] min-h-[400px] flex-1 space-y-4 overflow-y-auto p-5"
            >
              {messages.map((m) => (
                <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex gap-3"}>
                  {m.role === "assistant" && (
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-hero text-white">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground"
                        : "max-w-[85%] space-y-3 text-sm"
                    }
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    {m.agent &&
                      m.agent.readyToCreate &&
                      m.agent.department !== "Tracking" &&
                      m.agent.department !== "Unsupported" && (
                        <RequestPreview
                          agent={m.agent}
                          onConfirm={() => confirmRequest(m.agent!)}
                        />
                      )}
                    {m.agent && m.agent.missingFields.length > 0 && (
                      <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs">
                        <span className="font-medium">Still needed:</span>{" "}
                        {m.agent.missingFields.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-hero text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Reasoning…
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-border p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground transition hover:border-accent hover:text-foreground"
                  >
                    {s.length > 50 ? s.slice(0, 48) + "…" : s}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your request…"
                  disabled={loading}
                  autoFocus
                />
                <Button type="submit" disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          {/* Recent + Quick Actions */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h3 className="mb-3 font-display text-sm font-semibold">Quick actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <QuickAction
                  icon={Briefcase}
                  label="Apply Leave"
                  onClick={() => send("I'd like to apply for leave")}
                />
                <QuickAction
                  icon={Wallet}
                  label="Submit Expense"
                  onClick={() => send("I want to submit an expense claim")}
                />
                <QuickAction
                  icon={Wrench}
                  label="IT Ticket"
                  onClick={() => send("I have an IT issue to report")}
                />
                <QuickAction
                  icon={ClipboardList}
                  label="Track"
                  onClick={() => send("Show my pending requests")}
                />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h3 className="mb-3 font-display text-sm font-semibold">Recent requests</h3>
              {requests.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No requests yet — start a conversation.
                </p>
              ) : (
                <ul className="space-y-2">
                  {requests.slice(0, 5).map((r) => (
                    <li key={r.id} className="rounded-lg border border-border p-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-medium">{r.request_id}</span>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        {r.department} · {r.request_type}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-1 rounded-lg border border-border bg-secondary/40 p-3 text-left text-xs font-medium transition hover:border-accent hover:bg-accent/5"
    >
      <Icon className="h-4 w-4 text-accent" />
      {label}
    </button>
  );
}

function RequestPreview({ agent, onConfirm }: { agent: AgentResponse; onConfirm: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wide text-accent">
            Request preview
          </span>
        </div>
        <Badge variant="outline">
          {agent.department} · {agent.priority}
        </Badge>
      </div>
      <div className="text-sm font-semibold">{agent.title}</div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {Object.entries(agent.extractedDetails).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium">{String(v)}</dd>
          </div>
        ))}
      </dl>
      {!done ? (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              onConfirm();
              setDone(true);
            }}
          >
            <CheckCircle2 className="mr-1 h-4 w-4" />
            Confirm & Submit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDone(true)}>
            <XCircle className="mr-1 h-4 w-4" />
            Cancel
          </Button>
        </div>
      ) : (
        <div className="mt-3 text-xs text-muted-foreground">Preview closed.</div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: "border-warning text-warning",
    Open: "border-info text-info",
    "In Progress": "border-info text-info",
    Approved: "border-success text-success",
    Resolved: "border-success text-success",
    Rejected: "border-destructive text-destructive",
    "Information Required": "border-accent text-accent",
    Escalated: "border-destructive text-destructive",
  };
  return (
    <Badge variant="outline" className={map[status] ?? ""}>
      {status}
    </Badge>
  );
}
