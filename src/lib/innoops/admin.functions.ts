import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { rateLimiterMiddleware } from "./security.middleware";

// Zod schemas for validation
const UpdateRequestStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "Pending",
    "Approved",
    "Rejected",
    "Open",
    "In Progress",
    "Resolved",
    "Information Required",
    "Escalated",
  ]),
  adminComment: z.string().optional(),
  assignedTo: z.string().optional(),
});

// Helper function to check if the current user has super_admin role
async function checkSuperAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();

  if (error || !data) {
    return false;
  }
  return true;
}

// 1. Server function to retrieve all requests for administrators
export const getAdminRequests = createServerFn({ method: "GET" })
  .middleware([rateLimiterMiddleware, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Verify admin role
    const isAdmin = await checkSuperAdmin(supabase, userId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Only administrators can access this resource.");
    }

    // Retrieve all requests
    const { data: requests, error } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Admin API] Error fetching requests:", error);
      throw new Error(error.message);
    }

    return requests;
  });

// 2. Server function to update status, comment, or assignment of a request
export const updateRequestStatus = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware, requireSupabaseAuth])
  .validator((d: unknown) => UpdateRequestStatusSchema.parse(d))
  .handler(async ({ data: input, context }) => {
    const { supabase, userId } = context;
    const { id, status, adminComment, assignedTo } = input;

    // Verify admin role
    const isAdmin = await checkSuperAdmin(supabase, userId);
    if (!isAdmin) {
      throw new Error("Unauthorized: Only administrators can update requests.");
    }

    // Fetch the admin's name for the timeline
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .maybeSingle();

    const actorName = adminProfile?.name || "Administrator";

    // Prepare update payload
    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (adminComment !== undefined) {
      updatePayload.admin_comment = adminComment;
    }

    if (assignedTo !== undefined) {
      updatePayload.assigned_to = assignedTo;
    }

    // Perform update in requests table
    const { data: updatedRequest, error: updateError } = await supabase
      .from("requests")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[Admin API] Error updating request:", updateError);
      throw new Error(updateError.message);
    }

    // Insert timeline entry
    const timelineNote =
      [
        adminComment ? `Comment: "${adminComment}"` : "",
        assignedTo ? `Assigned to: "${assignedTo}"` : "",
      ]
        .filter(Boolean)
        .join(" | ") || "Status updated";

    const { error: timelineError } = await supabase.from("request_timeline").insert({
      request_id: id,
      action: `Updated Status to ${status}`,
      actor_id: userId,
      actor_name: actorName,
      note: timelineNote,
    });

    if (timelineError) {
      console.error("[Admin API] Error logging timeline entry:", timelineError);
      // Don't throw here to avoid failing the main status update transaction, but log it
    }

    return {
      success: true,
      request: updatedRequest,
    };
  });
