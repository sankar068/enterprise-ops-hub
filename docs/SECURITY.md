# Security

## 1. Authentication
Uses Supabase Auth with secure session cookies. Passwords must be strong. No untrusted browser signups are permitted for admin roles.

## 2. Row Level Security (RLS)
- Employees can only read and create their own requests.
- Employees can only read their own profiles.
- Admins have read-write access to all requests for operational workflows.

## 3. Middleware
`rateLimiterMiddleware` protects all sensitive server functions via IP-based and User-based thresholds to mitigate brute force and DDoS vectors.

## 4. Prompt Engineering Security
The Microsoft Foundry / AI integrations include strict instructions mitigating Prompt Injection, Hallucinations, and Jailbreak attempts.

## 5. API Keys
No secrets are shipped to the client bundle. Azure keys and Supabase service roles are strictly confined to the server.
