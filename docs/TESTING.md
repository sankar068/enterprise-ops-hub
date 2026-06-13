# Testing

## Local Testing
Run the following commands to verify the health of the application locally:

```bash
npm run typecheck   # Validates all TypeScript types
npm run lint        # Runs ESLint checks
npm run build       # Verifies production asset bundling
```

## Manual Workflows
1. Log in as an employee (`employee@innoops.ai`).
2. Type an HR, Finance, or IT request in the chat.
3. Validate that Demo mode accurately extracts details and creates the database ticket.
4. Log out and log in as admin (`admin@innoops.ai`).
5. Validate that the ticket can be resolved from the Admin Dashboard.
