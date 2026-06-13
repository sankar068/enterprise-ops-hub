import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AgentResponseSchema, SYSTEM_PROMPT, type AgentResponse } from "./schema";
import { rateLimiterMiddleware } from "./security.middleware";

const InputSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).min(1),
  draft: z.record(z.string(), z.unknown()).optional(),
});

// Deterministic fallback for Demo Mode (no Foundry secrets present).
function demoFallback(messages: { role: string; content: string }[]): AgentResponse {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const msg = lastUser.toLowerCase();

  if (/(server (is )?down|outage|all employees)/i.test(msg)) {
    return {
      department: "IT", intent: "create_request", requestType: "Major Incident", intentConfidence: 0.98,
      title: "Company-wide server outage", description: "Production server reported down affecting all employees.",
      priority: "Critical", extractedDetails: { issueCategory: "Infrastructure", deviceOrSoftware: "Server", issueDescription: lastUser, businessImpact: "Org-wide outage", urgency: "Immediate" },
      missingFields: [], readyToCreate: true, nextAction: "Show request preview",
      responseToUser: "This looks like a critical org-wide outage. I've prepared a ticket for immediate escalation. Please confirm to submit.",
    };
  }
  if (/(camera|wi-?fi|laptop|password|printer|software|crash|not working)/i.test(msg)) {
    const high = /(meeting|client|urgent|now|asap|hour)/i.test(msg);
    return {
      department: "IT", intent: "create_request", requestType: "IT Support Ticket", intentConfidence: 0.92,
      title: "IT issue reported", description: lastUser,
      priority: high ? "High" : "Normal",
      extractedDetails: { issueCategory: "Hardware/Software", deviceOrSoftware: "Laptop", issueDescription: lastUser, businessImpact: high ? "Blocks urgent meeting" : "Productivity impact", urgency: high ? "High" : "Normal" },
      missingFields: [], readyToCreate: true, nextAction: "Show preview with troubleshooting",
      responseToUser: "I've drafted an IT ticket. Quick checks first: restart the app, verify permissions, reboot the device. Confirm below to submit the ticket.",
    };
  }
  if (/(leave|vacation|day off|casual|sick)/i.test(msg)) {
    const dateMatch = msg.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/gi);
    const hasReason = /(personal|family|wedding|medical|vacation|work)/i.test(msg);
    const ready = (dateMatch?.length ?? 0) >= 2 && hasReason;
    return {
      department: "HR", intent: ready ? "create_request" : "clarify", requestType: "Leave Request", intentConfidence: 0.95,
      title: "Casual Leave Request", description: lastUser, priority: "Normal",
      extractedDetails: ready ? { leaveType: "Casual Leave", startDate: dateMatch?.[0], endDate: dateMatch?.[1], reason: lastUser } : {},
      missingFields: ready ? [] : ["leaveType", "startDate", "endDate", "reason"],
      readyToCreate: ready, nextAction: ready ? "Show request preview" : "Ask for dates and reason",
      responseToUser: ready ? "Your leave request is ready for review." : "Sure — what leave type, what dates (start and end), and what's the reason?",
    };
  }
  if (/(expense|reimburs|claim|₹|rs\.?|inr|usd|\$)/i.test(msg)) {
    const amtMatch = msg.match(/(?:₹|rs\.?|inr|\$)\s?(\d[\d,]*)/i);
    const amount = amtMatch ? Number(amtMatch[1].replace(/,/g, "")) : null;
    const hasReceipt = /receipt/i.test(msg);
    const ready = !!amount && hasReceipt;
    return {
      department: "Finance", intent: ready ? "create_request" : "clarify", requestType: "Expense Claim", intentConfidence: 0.94,
      title: "Expense Claim", description: lastUser, priority: "Normal",
      extractedDetails: ready ? { expenseType: "Travel", amount, currency: /\$/.test(msg) ? "USD" : "INR", expenseDate: msg.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/i)?.[0], purpose: lastUser, receiptAvailable: true } : {},
      missingFields: ready ? [] : ["amount", "expenseDate", "purpose", "receiptAvailable"],
      readyToCreate: ready, nextAction: ready ? "Show request preview" : "Ask for amount, date, purpose, receipt",
      responseToUser: ready ? "Your Finance claim is ready for review." : "Got it. What was the amount, the date, the purpose, and do you have the receipt?",
    };
  }
  if (/(pending|status|track|my request)/i.test(msg)) {
    return {
      department: "Tracking", intent: "list_requests", requestType: "Status Tracking", intentConfidence: 0.97,
      title: "Track requests", description: lastUser, priority: "Low",
      extractedDetails: {}, missingFields: [], readyToCreate: false, nextAction: "Show user's requests",
      responseToUser: "Opening your requests below. You can filter by department and status.",
    };
  }
  return {
    department: "Unsupported", intent: "clarify", requestType: "Unknown", intentConfidence: 0.4,
    title: "Need more details", description: lastUser, priority: "Low",
    extractedDetails: {}, missingFields: [], readyToCreate: false, nextAction: "Ask for clarification",
    responseToUser: "Could you clarify? I can help with HR leave, Finance reimbursements, or IT support tickets.",
  };
}

async function callFoundry(messages: { role: string; content: string }[], endpoint: string, key: string, model: string): Promise<AgentResponse> {
  const url = endpoint.replace(/\/+$/, "") + `/openai/deployments/${model}/chat/completions?api-version=2024-08-01-preview`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": key },
    body: JSON.stringify({
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error(`Foundry ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  return AgentResponseSchema.parse(parsed);
}

export const chatWithAgent = createServerFn({ method: "POST" })
  .middleware([rateLimiterMiddleware])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const endpoint = process.env.AZURE_AI_ENDPOINT;
    const key = process.env.AZURE_AI_API_KEY;
    const model = process.env.AZURE_AI_MODEL;
    const live = Boolean(endpoint && key && model);

    if (!live) {
      return { ok: true as const, mode: "demo" as const, result: demoFallback(data.messages) };
    }
    try {
      const result = await callFoundry(data.messages, endpoint!, key!, model!);
      return { ok: true as const, mode: "foundry" as const, result };
    } catch (err) {
      console.error("[Foundry] error:", err);
      return { ok: true as const, mode: "demo" as const, result: demoFallback(data.messages), warning: "Foundry unavailable, using Demo Mode." };
    }
  });
