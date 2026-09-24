-- Tighten existing function ACLs after the RPC rollout. No table data changes.
REVOKE ALL ON FUNCTION public.record_savings_transaction(uuid, text, numeric, date, text, text, uuid, uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_savings_transaction(uuid, text, numeric, date, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_savings_transaction(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_parent_savings_summary(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_parent_savings_history(uuid, integer) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.record_savings_transaction(uuid, text, numeric, date, text, text, uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_savings_transaction(uuid, text, numeric, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_savings_transaction(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_savings_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_savings_history(uuid, integer) TO authenticated;
