
CREATE TABLE public.request_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  actor_name TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.request_timeline TO authenticated;
GRANT ALL ON public.request_timeline TO service_role;
ALTER TABLE public.request_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timeline_select" ON public.request_timeline
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_timeline.request_id AND (r.user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin')))
  );
CREATE POLICY "timeline_insert" ON public.request_timeline
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.requests r WHERE r.id = request_timeline.request_id AND (r.user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin')))
  );

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.requests(id) ON DELETE CASCADE,
  performed_by UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  previous_status public.request_status,
  new_status public.request_status,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select_admin" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
