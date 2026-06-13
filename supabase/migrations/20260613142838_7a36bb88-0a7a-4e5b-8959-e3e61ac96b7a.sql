
CREATE TYPE public.app_role AS ENUM ('employee', 'super_admin');
CREATE TYPE public.request_department AS ENUM ('HR', 'Finance', 'IT');
CREATE TYPE public.request_priority AS ENUM ('Low', 'Normal', 'High', 'Critical');
CREATE TYPE public.request_status AS ENUM ('Pending','Approved','Rejected','Open','In Progress','Resolved','Information Required','Escalated');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
