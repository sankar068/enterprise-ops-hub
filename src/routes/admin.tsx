import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Bot, 
  LogOut, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Wrench, 
  AlertCircle, 
  Calendar, 
  User, 
  Lock, 
  ChevronRight, 
  FileText, 
  MessageSquare,
  Sparkles,
  ClipboardList
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getAdminRequests, updateRequestStatus } from "@/lib/innoops/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Portal · InnoOps AI" }] }),
  component: AdminDashboard,
});

type Request = {
  id: string;
  request_id: string;
  user_id: string;
  employee_name: string;
  department: string;
  request_type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  details: Record<string, any>;
  assigned_to?: string;
  admin_comment?: string;
  created_at: string;
};

type TimelineEvent = {
  id: string;
  action: string;
  actor_name: string;
  note: string;
  created_at: string;
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState<"All" | "HR" | "Finance" | "IT">("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Admin action states
  const [adminComment, setAdminComment] = useState("");
  const [assignedToInput, setAssignedToInput] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    // Authenticate and verify role
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        navigate({ to: "/auth" });
        return;
      }
      
      // Query user_roles table for super_admin
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (roleError || !roleData) {
        setAuthorized(false);
        setLoading(false);
        toast.error("Access Denied: You do not have administrator permissions.");
        setTimeout(() => navigate({ to: "/employee" }), 2500);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", data.user.id)
        .maybeSingle();

      setUser({ id: data.user.id, name: profile?.name || "Administrator" });
      setAuthorized(true);
      
      // Load all requests
      loadAllRequests();
    });
  }, [navigate]);

  async function loadAllRequests() {
    setLoading(true);
    try {
      const data = await getAdminRequests();
      setRequests((data as Request[] | null) ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }

  // Fetch timeline events for selected request
  useEffect(() => {
    if (!selectedRequest) {
      setTimeline([]);
      return;
    }

    setTimelineLoading(true);
    supabase
      .from("request_timeline")
      .select("id, action, actor_name, note, created_at")
      .eq("request_id", selectedRequest.id)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          toast.error("Failed to load timeline logs.");
        } else {
          setTimeline((data as TimelineEvent[]) || []);
        }
        setTimelineLoading(false);
      });
  }, [selectedRequest]);

  async function handleAdminAction(status: string) {
    if (!selectedRequest) return;
    setSubmittingAction(true);
    
    try {
      const res = await updateRequestStatus({
        id: selectedRequest.id,
        status: status as any,
        adminComment: adminComment.trim() || undefined,
        assignedTo: assignedToInput.trim() || undefined,
      });

      if (res.success) {
        toast.success(`Request ${selectedRequest.request_id} updated successfully.`);
        setAdminComment("");
        
        // Refresh requests and update local selectedRequest state
        const updatedRequests = requests.map((r) => 
          r.id === selectedRequest.id 
            ? { 
                ...r, 
                status, 
                admin_comment: adminComment.trim() || r.admin_comment,
                assigned_to: assignedToInput.trim() || r.assigned_to 
              } 
            : r
        );
        setRequests(updatedRequests);
        setSelectedRequest(updatedRequests.find((r) => r.id === selectedRequest.id) || null);
        
        // Reload timeline
        const { data: newTimeline } = await supabase
          .from("request_timeline")
          .select("id, action, actor_name, note, created_at")
          .eq("request_id", selectedRequest.id)
          .order("created_at", { ascending: true });
        setTimeline((newTimeline as TimelineEvent[]) || []);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error executing admin action.");
    } finally {
      setSubmittingAction(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  // Calculate statistics
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => ["Pending", "Open"].includes(r.status)).length,
    approved: requests.filter((r) => ["Approved", "Resolved"].includes(r.status)).length,
    inProgress: requests.filter((r) => r.status === "In Progress").length,
    critical: requests.filter((r) => r.priority === "Critical" && r.status !== "Resolved" && r.status !== "Approved" && r.status !== "Rejected").length,
  };

  // Filters application
  const filteredRequests = requests.filter((r) => {
    const matchesSearch = 
      r.request_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesDept = deptFilter === "All" || r.department === deptFilter;
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  if (authorized === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive mb-4">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold">Unauthorized Access</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          You do not have administrative roles associated with this account. You are being redirected to the employee dashboard.
        </p>
      </div>
    );
  }

  if (authorized === null || (loading && requests.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-6 w-6 animate-spin text-accent" />
          Loading Admin Portal…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-hero text-white shadow-soft">
                <Bot className="h-4 w-4" />
              </div>
              <span className="font-display font-bold tracking-tight">InnoOps AI</span>
            </Link>
            <Badge variant="outline" className="border-accent/30 text-accent bg-accent/5">
              <Sparkles className="mr-1 h-3 w-3" /> Admin Console
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/employee">
              <Button variant="ghost" size="sm">Employee Hub</Button>
            </Link>
            <div className="h-4 w-px bg-border hidden md:block" />
            <span className="text-xs text-muted-foreground hidden md:inline">Logged in: <strong>{user?.name}</strong></span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Welcome Section */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Operations Center</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage cross-department workflows, IT issues, leave records, and expense approvals.</p>
          </div>
          <Button size="sm" variant="outline" onClick={loadAllRequests} className="self-start">
            Refresh Data
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { label: "Total Submissions", value: stats.total, icon: ClipboardList, color: "text-primary bg-primary/5 border-primary/10" },
            { label: "Awaiting Action", value: stats.pending, icon: Clock, color: "text-warning bg-warning/5 border-warning/10" },
            { label: "Approved/Resolved", value: stats.approved, icon: CheckCircle2, color: "text-success bg-success/5 border-success/10" },
            { label: "In Progress", value: stats.inProgress, icon: Wrench, color: "text-info bg-info/5 border-info/10" },
            { label: "Critical Outages", value: stats.critical, icon: AlertCircle, color: `border-destructive/20 bg-destructive/5 text-destructive ${stats.critical > 0 ? "animate-pulse" : ""}` },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border p-4 shadow-soft flex flex-col justify-between bg-card ${s.color.split(" ")[1]} ${s.color.split(" ")[2]}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.color.split(" ")[0]}`} />
              </div>
              <div className="mt-4 text-3xl font-black tracking-tight">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* Requests Management Panel */}
          <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden flex flex-col">
            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-border bg-secondary/20 space-y-3">
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    placeholder="Search by ID, name, request title..." 
                    className="pl-9 bg-background"
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Approved">Approved</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Information Required">Info Required</option>
                  </select>
                </div>
              </div>

              {/* Department Tabs */}
              <div className="flex gap-1.5 overflow-x-auto border-t border-border/50 pt-3">
                {(["All", "HR", "Finance", "IT"] as const).map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setDeptFilter(dept)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                      deptFilter === dept 
                        ? "bg-primary text-primary-foreground shadow" 
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {dept === "All" ? "All Operations" : dept === "HR" ? "HR Leave" : dept === "Finance" ? "Finance claims" : "IT Helpdesk"}
                  </button>
                ))}
              </div>
            </div>

            {/* Requests Table */}
            <div className="flex-1 overflow-x-auto min-h-[400px]">
              {filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-sm text-muted-foreground h-full">
                  <FileText className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  No requests found matching your filters.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground tracking-wider font-semibold border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Employee</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Priority</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Submitted</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredRequests.map((r) => (
                      <tr 
                        key={r.id} 
                        onClick={() => setSelectedRequest(r)}
                        className={`transition hover:bg-secondary/30 cursor-pointer ${
                          selectedRequest?.id === r.id ? "bg-accent/5 border-l-4 border-l-accent" : ""
                        }`}
                      >
                        <td className="px-4 py-3.5 font-mono text-xs font-semibold">{r.request_id}</td>
                        <td className="px-4 py-3.5 font-medium">{r.employee_name}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs text-muted-foreground">{r.department}</span>
                            <span>{r.request_type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <PriorityBadge priority={r.priority} />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedRequest(r)}
                            className="text-accent hover:bg-accent/10 hover:text-accent font-semibold text-xs"
                          >
                            Review <ChevronRight className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Details & Action Sidebar */}
          <div className="rounded-2xl border border-border bg-card shadow-soft p-5 flex flex-col min-h-[500px]">
            {!selectedRequest ? (
              <div className="flex flex-col items-center justify-center text-center text-sm text-muted-foreground flex-1 h-full py-16">
                <Lock className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <h3 className="font-display font-bold text-foreground">Select a Request</h3>
                <p className="mt-1 max-w-[240px] text-xs">Choose a submission from the table to review details, timeline, and authorize updates.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full space-y-5">
                {/* Details Header */}
                <div className="border-b border-border/80 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-muted-foreground">{selectedRequest.request_id}</span>
                    <Badge variant="outline" className="border-primary/20 bg-primary/5 uppercase font-bold text-xs">{selectedRequest.department}</Badge>
                  </div>
                  <h2 className="font-display text-xl font-bold tracking-tight">{selectedRequest.title}</h2>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>Submitted by: <strong>{selectedRequest.employee_name}</strong></span>
                    <span>•</span>
                    <span>{new Date(selectedRequest.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Details Content */}
                <div className="space-y-4 flex-1 overflow-y-auto max-h-[35vh] pr-1">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Description</h4>
                    <p className="text-xs leading-relaxed bg-secondary/30 rounded-xl p-3 border border-border/40 whitespace-pre-wrap">{selectedRequest.description || "No description provided."}</p>
                  </div>

                  {/* Extracted Details */}
                  {Object.keys(selectedRequest.details || {}).length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Extracted Parameters</h4>
                      <dl className="grid grid-cols-2 gap-2 text-xs bg-secondary/20 border border-border/40 rounded-xl p-3">
                        {Object.entries(selectedRequest.details).map(([k, v]) => (
                          <div key={k} className="flex flex-col border-b border-border/40 pb-1.5 last:border-b-0 last:pb-0">
                            <dt className="text-muted-foreground capitalize font-medium">{k.replace(/([A-Z])/g, ' $1').trim()}</dt>
                            <dd className="font-semibold text-foreground mt-0.5">{String(v)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {/* Assignments and Admin comments */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <h4 className="font-bold text-muted-foreground mb-1">Assigned Support</h4>
                      <p className="font-medium">{selectedRequest.assigned_to || "Unassigned"}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-muted-foreground mb-1">Current Status</h4>
                      <p className="font-medium"><StatusBadge status={selectedRequest.status} /></p>
                    </div>
                  </div>
                </div>

                {/* Timeline History */}
                <div className="border-t border-border pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-accent" /> Timeline Logs
                  </h4>
                  {timelineLoading ? (
                    <div className="text-center text-xs text-muted-foreground py-4">Loading timeline...</div>
                  ) : timeline.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic py-2">No activity logged.</div>
                  ) : (
                    <ul className="space-y-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border max-h-[20vh] overflow-y-auto pr-1">
                      {timeline.map((event) => (
                        <li key={event.id} className="relative pl-6 text-xs">
                          <div className="absolute left-[7px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent border-2 border-card" />
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{event.action}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(event.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-muted-foreground font-semibold text-[10px]">By {event.actor_name}</p>
                          {event.note && (
                            <p className="mt-1 bg-secondary/50 rounded-lg p-1.5 text-[11px] text-muted-foreground font-sans italic">
                              {event.note}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Admin Actions panel */}
                <div className="border-t border-border pt-4 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5" /> Execute Authorization Action
                  </h4>

                  {/* Comment box */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">Decision Notes / Comments</label>
                    <textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      placeholder="Add reason for approval, rejection, escalation, or troubleshooting instructions..."
                      rows={2}
                      className="w-full rounded-lg border border-border bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  {/* IT Assignment input (only for IT tickets) */}
                  {selectedRequest.department === "IT" && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Assign Technician</label>
                      <Input
                        value={assignedToInput}
                        onChange={(e) => setAssignedToInput(e.target.value)}
                        placeholder="e.g. Senior Tech Engineer"
                        className="bg-background text-xs"
                      />
                    </div>
                  )}

                  {/* Actions buttons */}
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {selectedRequest.department === "HR" && (
                      <>
                        <Button 
                          size="sm" 
                          disabled={submittingAction || selectedRequest.status === "Approved"} 
                          onClick={() => handleAdminAction("Approved")}
                          className="bg-success text-success-foreground hover:bg-success/90 font-bold text-xs"
                        >
                          Approve Leave
                        </Button>
                        <Button 
                          size="sm" 
                          disabled={submittingAction || selectedRequest.status === "Rejected"} 
                          onClick={() => handleAdminAction("Rejected")}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold text-xs"
                        >
                          Reject Leave
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          disabled={submittingAction || selectedRequest.status === "Information Required"} 
                          onClick={() => handleAdminAction("Information Required")}
                          className="font-bold text-xs"
                        >
                          Request Info
                        </Button>
                      </>
                    )}

                    {selectedRequest.department === "Finance" && (
                      <>
                        <Button 
                          size="sm" 
                          disabled={submittingAction || selectedRequest.status === "Approved"} 
                          onClick={() => handleAdminAction("Approved")}
                          className="bg-success text-success-foreground hover:bg-success/90 font-bold text-xs"
                        >
                          Approve Claim
                        </Button>
                        <Button 
                          size="sm" 
                          disabled={submittingAction || selectedRequest.status === "Rejected"} 
                          onClick={() => handleAdminAction("Rejected")}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold text-xs"
                        >
                          Reject Claim
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          disabled={submittingAction || selectedRequest.status === "Information Required"} 
                          onClick={() => handleAdminAction("Information Required")}
                          className="font-bold text-xs"
                        >
                          Request Receipt
                        </Button>
                      </>
                    )}

                    {selectedRequest.department === "IT" && (
                      <>
                        <Button 
                          size="sm" 
                          disabled={submittingAction || selectedRequest.status === "In Progress"} 
                          onClick={() => handleAdminAction("In Progress")}
                          className="bg-warning text-warning-foreground hover:bg-warning/90 font-bold text-xs"
                        >
                          Mark In Progress
                        </Button>
                        <Button 
                          size="sm" 
                          disabled={submittingAction || selectedRequest.status === "Resolved"} 
                          onClick={() => handleAdminAction("Resolved")}
                          className="bg-success text-success-foreground hover:bg-success/90 font-bold text-xs"
                        >
                          Resolve Ticket
                        </Button>
                        <Button 
                          size="sm" 
                          disabled={submittingAction || selectedRequest.status === "Escalated"} 
                          onClick={() => handleAdminAction("Escalated")}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold text-xs"
                        >
                          Escalate Issue
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    Low: "bg-secondary text-secondary-foreground border-border",
    Normal: "bg-muted text-muted-foreground border-border",
    High: "bg-warning/10 text-warning border-warning/20",
    Critical: "bg-destructive/10 text-destructive border-destructive/20 font-bold animate-pulse",
  };
  return <Badge variant="outline" className={styles[priority] ?? ""}>{priority}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-warning/10 text-warning border-warning/20",
    Open: "bg-info/10 text-info border-info/20",
    "In Progress": "bg-info/15 text-info border-info/30",
    Approved: "bg-success/10 text-success border-success/20",
    Resolved: "bg-success/15 text-success border-success/30",
    Rejected: "bg-destructive/10 text-destructive border-destructive/20",
    "Information Required": "bg-primary/10 text-primary border-primary/20",
    Escalated: "bg-destructive/15 text-destructive border-destructive/30 font-semibold",
  };
  return <Badge variant="outline" className={styles[status] ?? ""}>{status}</Badge>;
}
