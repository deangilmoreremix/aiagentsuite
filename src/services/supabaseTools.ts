// Supabase tools service
export async function getUserToolsFromSupabase(userId: string) {
  console.log('Getting user tools from Supabase for:', userId);
  return { tools: [], connections: [] };
}