# Deployment

## Prerequisites
- Node.js 22.x
- Supabase Project (PostgreSQL)
- Microsoft Azure OpenAI account

## Process
1. Push your code to a remote repository.
2. Link the repository to your host (e.g., Azure App Service, AWS EC2, or custom Node.js server). Note: Render and Vercel are not supported for this specific configuration as per constraints.
3. Supply the environment variables matching `.env.example`.
4. Run `npm install`, then `npm run build`.
5. Start the server using `npm run start` (or your platform's start command).
