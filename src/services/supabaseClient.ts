import { createClient } from '@supabase/supabase-js';
import { apiConfig } from '../config/apiConfig';

// Initialize Supabase client only if properly configured
export const supabase = apiConfig.supabase.isConfigured 
  ? createClient(apiConfig.supabase.url, apiConfig.supabase.anonKey)
  : null;

// Database table interfaces based on your schema
export interface Contact {
  id: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  title?: string;
  company?: string;
  website?: string;
  address?: any;
  lead_source?: string;
  lead_status?: string;
  contact_type?: string;
  assigned_to?: string;
  lead_score?: number;
  engagement_score?: number;
  last_contacted?: string;
  last_activity?: string;
  social_profiles?: any;
  custom_fields?: any;
  tags?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
  activity_log?: any[];
  next_send_date?: string;
}

export interface Deal {
  id: string;
  customer_id: string;
  title: string;
  description?: string;
  value?: number;
  currency?: string;
  stage_id: string;
  probability?: number;
  expected_close_date?: string;
  actual_close_date?: string;
  contact_id?: string;
  assigned_to?: string;
  created_by?: string;
  status?: string;
  deal_type?: string;
  lead_source?: string;
  competitors?: string[];
  tags?: string[];
  custom_fields?: any;
  attachments?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  plan: string;
  status: string;
  domain?: string;
  subdomain?: string;
  created_at?: string;
  last_active?: string;
  billing_info?: any;
  usage?: any;
  limits?: any;
  customization?: any;
  features?: string[];
  analytics?: any;
  customer_success?: any;
  security?: any;
  integrations?: any;
  workflows?: any;
  ai_features?: any;
  lifecycle?: any;
}

// Helper function to check if Supabase is available
const checkSupabaseAvailable = () => {
  if (!supabase) {
    console.warn('⚠️ Supabase is not configured. Some features may not work properly.');
    return null;
  }
  return supabase;
};

// Supabase service functions
export const supabaseService = {
  // Contact operations
  async createContact(contact: Partial<Contact>) {
    const client = checkSupabaseAvailable();
    if (!client) return null;
    
    const { data, error } = await client
      .from('contacts')
      .insert(contact)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getContacts(_customerId?: string) {
    const client = checkSupabaseAvailable();
    if (!client) return [];
    
    // Note: contacts table doesn't have customer_id column
    // So we select all contacts for authenticated users
    const query = client
      .from('contacts')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        company,
        position,
        status,
        source,
        lead_score,
        engagement_score,
        last_contacted,
        last_activity,
        social_profiles,
        custom_fields,
        tags,
        notes,
        created_at,
        updated_at,
        activity_log,
        next_send_date,
        is_team_member,
        role,
        gamification_stats,
        ai_score
      `)
      .order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  async updateContact(id: string, updates: Partial<Contact>) {
    const client = checkSupabaseAvailable();
    if (!client) return null;
    
    const { data, error } = await client
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Deal operations
  async createDeal(deal: Partial<Deal>) {
    const client = checkSupabaseAvailable();
    if (!client) return null;
    
    const { data, error } = await client
      .from('deals')
      .insert(deal)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getDeals(customerId?: string) {
    const client = checkSupabaseAvailable();
    if (!client) return [];
    
    let query = client
      .from('deals')
      .select(`
        id,
        customer_id,
        title,
        description,
        value,
        currency,
        stage_id,
        probability,
        expected_close_date,
        actual_close_date,
        contact_id,
        assigned_to,
        created_by,
        status,
        deal_type,
        lead_source,
        competitors,
        tags,
        custom_fields,
        attachments,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });
    
    // Only filter by customer_id if provided and if user wants to filter
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  async updateDeal(id: string, updates: Partial<Deal>) {
    const client = checkSupabaseAvailable();
    if (!client) return null;
    
    const { data, error } = await client
      .from('deals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Customer operations
  async createCustomer(customer: Partial<Customer>) {
    const client = checkSupabaseAvailable();
    if (!client) return null;
    
    const { data, error } = await client
      .from('customers')
      .insert(customer)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getCustomer(id: string) {
    const client = checkSupabaseAvailable();
    if (!client) return null;
    
    const { data, error } = await client
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Activity logging
  async logActivity(activity: {
    customer_id: string;
    type: string;
    title: string;
    description?: string;
    contact_id?: string;
    deal_id?: string;
    metadata?: any;
  }) {
    const client = checkSupabaseAvailable();
    if (!client) return null;
    
    const { data, error } = await client
      .from('sales_activities')
      .insert({
        ...activity,
        status: 'completed',
        created_by: 'ai-agent', // Default AI agent ID
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Real-time subscriptions
  subscribeToContacts(customerId: string, callback: (payload: any) => void) {
    const client = checkSupabaseAvailable();
    if (!client) return null;
    
    return client
      .channel(`contacts:${customerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts',
          filter: `customer_id=eq.${customerId}`
        },
        callback
      )
      .subscribe();
  },

  subscribeToDeals(customerId: string, callback: (payload: any) => void) {
    const client = checkSupabaseAvailable();
    if (!client) return null;
    
    return client
      .channel(`deals:${customerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals',
          filter: `customer_id=eq.${customerId}`
        },
        callback
      )
      .subscribe();
  },

  // Connection test
  async testConnection() {
    try {
      if (!supabase) {
        console.log('⚠️ Supabase client not initialized');
        return false;
      }
      
      // Test with a simple query that should always work
      const { error } = await supabase
        .from('contacts')
        .select('id')
        .limit(1);
      
      if (error) {
        console.warn('⚠️ Supabase connection test failed:', error);
        return false;
      }
      
      console.log('✅ Supabase connection test passed');
      return true;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  },

  // Check if Supabase is available
  isAvailable() {
    return !!supabase;
  },

  // Storage operations
  async uploadFile(
    bucketName: string,
    filePath: string,
    file: File,
    options?: { cacheControl?: string; upsert?: boolean }
  ) {
    const client = checkSupabaseAvailable();
    if (!client) throw new Error('Supabase is not configured');
    
    const { data, error } = await client.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: options?.cacheControl || '3600',
        upsert: options?.upsert || false
      });
    
    if (error) throw error;
    return data;
  },

  async downloadFile(bucketName: string, filePath: string) {
    const client = checkSupabaseAvailable();
    if (!client) throw new Error('Supabase is not configured');
    
    const { data, error } = await client.storage
      .from(bucketName)
      .download(filePath);
    
    if (error) throw error;
    return data;
  },

  async deleteFile(bucketName: string, filePath: string) {
    const client = checkSupabaseAvailable();
    if (!client) throw new Error('Supabase is not configured');
    
    const { data, error } = await client.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) throw error;
    return data;
  },

  async getPublicUrl(bucketName: string, filePath: string) {
    const client = checkSupabaseAvailable();
    if (!client) throw new Error('Supabase is not configured');
    
    const { data } = client.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  },

  async createSignedUrl(
    bucketName: string, 
    filePath: string, 
    expiresIn: number = 3600
  ) {
    const client = checkSupabaseAvailable();
    if (!client) throw new Error('Supabase is not configured');
    
    const { data, error } = await client.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);
    
    if (error) throw error;
    return data.signedUrl;
  },

  async listFiles(bucketName: string, folder?: string) {
    const client = checkSupabaseAvailable();
    if (!client) throw new Error('Supabase is not configured');
    
    const { data, error } = await client.storage
      .from(bucketName)
      .list(folder);
    
    if (error) throw error;
    return data;
  }
};

export default supabase;