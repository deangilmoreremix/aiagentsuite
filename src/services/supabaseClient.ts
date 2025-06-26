import { createClient } from '@supabase/supabase-js';
import { apiConfig } from '../config/apiConfig';

// Initialize Supabase client
export const supabase = createClient(
  apiConfig.supabase.url || '',
  apiConfig.supabase.anonKey || ''
);

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

// Supabase service functions
export const supabaseService = {
  // Contact operations
  async createContact(contact: Partial<Contact>) {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getContacts(customerId: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateContact(id: string, updates: Partial<Contact>) {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('deals')
      .insert(deal)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getDeals(customerId: string) {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        contacts (first_name, last_name, email)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateDeal(id: string, updates: Partial<Deal>) {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getCustomer(id: string) {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    return supabase
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
    return supabase
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
      const { data, error } = await supabase
        .from('customers')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }
};

export default supabase;