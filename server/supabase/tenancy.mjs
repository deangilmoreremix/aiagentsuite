// Tenant resolution for the shared database's VERIFIED ownership model:
// root `tenants`, membership `tenant_members(user_id, tenant_id)` (fallback
// `user_roles`). tenant_id is NEVER assumed to equal auth.uid().
import { getServiceClient } from './serviceClient.mjs';

export async function resolveTenantForUser(db, userId) {
  if (!db || !userId) return null;
  try {
    const { data, error } = await db
      .from('tenant_members')
      .select('tenant_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1);
    if (!error && Array.isArray(data) && data.length) return data[0].tenant_id || null;
  } catch { /* fall through */ }
  try {
    const { data, error } = await db
      .from('user_roles')
      .select('tenant_id')
      .eq('user_id', userId)
      .limit(1);
    if (!error && Array.isArray(data) && data.length) return data[0].tenant_id || null;
  } catch { /* fall through */ }
  return null;
}

export async function getTenantIdForUser(userId) {
  return resolveTenantForUser(getServiceClient(), userId);
}
