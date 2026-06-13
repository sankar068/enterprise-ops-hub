import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, Briefcase, Wrench, Wallet, ArrowRight, Sparkles, ShieldCheck, Workflow, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InnoOps AI — One agent for HR, Finance & IT" },
      { name: "description", content: "InnoOps AI lets employees submit HR leave, finance claims, and IT tickets through one conversational interface, powered by Microsoft Foundry." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-hero text-white shadow-glow">
              <Bot className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">InnoOps AI</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#modules" className="hover:text-foreground">Modules</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#tech" className="hover:text-foreground">Architecture</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Sign In</Button></Link>
            <Link to="/auth"><Button size="sm">Launch Demo</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero opacity-[0.04]" />
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Microsoft Agents League · Reasoning Agents Track
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
              One Intelligent Agent for{" "}
              <span className="bg-hero bg-clip-text text-transparent">HR, Finance & IT</span> Operations
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              InnoOps AI helps employees submit requests, receive assistance, and track internal
              workflows through one conversational interface — powered by Microsoft Foundry reasoning.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/auth"><Button size="lg" className="bg-hero text-white shadow-glow hover:opacity-95">Launch Demo <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
              <a href="#tech"><Button size="lg" variant="outline">View Architecture</Button></a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Demo accounts: <code className="rounded bg-muted px-1.5 py-0.5">employee@innoops.ai</code> · <code className="rounded bg-muted px-1.5 py-0.5">admin@innoops.ai</code> — password <code className="rounded bg-muted px-1.5 py-0.5">demo123</code></p>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold">Three agents. One conversation.</h2>
          <p className="mt-2 text-muted-foreground">Stop juggling portals. Just describe what you need.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Briefcase, title: "HR Agent", desc: "Apply for leave, get follow-ups for missing dates or reason, and track approvals.", color: "text-info" },
            { icon: Wallet, title: "Finance Agent", desc: "Submit expense claims with amount, currency, purpose, and receipt status.", color: "text-success" },
            { icon: Wrench, title: "IT Helpdesk", desc: "Raise tickets with auto priority + basic troubleshooting before escalation.", color: "text-warning" },
          ].map((m) => (
            <div key={m.title} className="rounded-2xl border border-border bg-card-gradient p-6 shadow-soft">
              <div className={`mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-secondary ${m.color}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{m.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center font-display text-3xl font-bold">How it works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              { n: "01", t: "Describe", d: "Employee types a natural-language request." },
              { n: "02", t: "Reason", d: "Foundry classifies intent, extracts fields, scores priority." },
              { n: "03", t: "Confirm", d: "Employee reviews the structured preview." },
              { n: "04", t: "Route", d: "Request is stored, routed, and visible to admins." },
            ].map((s) => (
              <div key={s.n} className="rounded-xl bg-card p-5 shadow-soft">
                <div className="text-xs font-bold tracking-widest text-accent">{s.n}</div>
                <div className="mt-2 font-semibold">{s.t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="tech" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center font-display text-3xl font-bold">Architecture</h2>
        <p className="mt-2 text-center text-muted-foreground">Built on Lovable Cloud with Microsoft Foundry as the reasoning layer.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { icon: MessageSquare, t: "Conversational UI", d: "TanStack Start, React, Tailwind." },
            { icon: Workflow, t: "Foundry Reasoning", d: "Structured JSON · Zod-validated · Multi-turn." },
            { icon: ShieldCheck, t: "Secure Backend", d: "Lovable Cloud Postgres + RLS + Auth." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <c.icon className="h-6 w-6 text-accent" />
              <div className="mt-3 font-semibold">{c.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Future scope: Microsoft Teams · Outlook · SharePoint · M365 Copilot · HRMS · ITSM · AWS S3.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="rounded-3xl bg-hero p-10 text-center text-white shadow-glow">
          <h3 className="font-display text-3xl font-bold">Try the live demo</h3>
          <p className="mt-2 text-white/80">One conversation becomes one complete operational process.</p>
          <div className="mt-6 flex justify-center"><Link to="/auth"><Button size="lg" variant="secondary">Sign in to InnoOps AI <ArrowRight className="ml-1 h-4 w-4" /></Button></Link></div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} InnoOps AI · Built solo by Boyina Sankar</span>
          <span>Microsoft Agents League Hackathon 2026</span>
        </div>
      </footer>
    </div>
  );
}
