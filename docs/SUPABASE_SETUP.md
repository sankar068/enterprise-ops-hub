# Supabase Setup Guide

This document outlines the steps required to configure Supabase for the InnoOps AI project.

## 1. Create a Supabase Project
1. Log in to [Supabase](https://supabase.com/).
2. Create a new project.
3. Note your **Project URL**, **anon key**, and **service_role key**.

## 2. Apply Migrations
1. Navigate to the SQL Editor in your Supabase dashboard.
2. Run the SQL files located in the `supabase/migrations` folder of this repository in order.
3. This will create all required tables (`profiles`, `user_roles`, `requests`, `conversations`, `conversation_messages`, `request_timeline`, `audit_logs`).
4. It will also establish all necessary constraints, functions, and Row-Level Security (RLS) policies.

## 3. Configure Environment Variables
Copy `.env.example` to `.env` locally or add the following secrets to your deployment environment:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> **WARNING**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in the frontend or commit it to version control!

## 4. Setup Demo Users
To test the platform, create the following users manually in the Supabase **Authentication** dashboard:
1. `employee@innoops.ai`
2. `admin@innoops.ai`

Assign the `super_admin` role to the admin user:
1. Go to the SQL Editor or Table Editor.
2. Insert a row into the `user_roles` table:
   - `user_id`: the UUID of `admin@innoops.ai`
   - `role`: `super_admin`

All other newly signed-up users are automatically assigned the `employee` role via the `handle_new_user()` database trigger.
