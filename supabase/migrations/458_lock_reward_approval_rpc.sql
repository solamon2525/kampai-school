-- Defense in depth: approval APIs are authenticated-only.
REVOKE EXECUTE ON FUNCTION public.can_approve_reward(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.approve_reward_claim(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reject_reward_claim(uuid, text) FROM anon;

GRANT EXECUTE ON FUNCTION public.can_approve_reward(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_reward_claim(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_reward_claim(uuid, text) TO authenticated;
