# Manual Setup Required

These steps require human intervention and cannot be entirely automated via scripts:

1. **Database Linking**: Provision a Supabase project and execute the migrations in `supabase/migrations`.
2. **Microsoft Foundry Provisioning**: Obtain API keys from your Azure portal as described in `FOUNDRY_SETUP.md`.
3. **Admin User Creation**: Create an admin user via the Supabase Dashboard and manually assign their role metadata to `admin` in the user's secure profile.
4. **Environment Variables**: Safely securely inject `.env` secrets on your final deployment platform.
