// lib/supabase.js - Complete fixed version
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database service functions for your WhatsApp ticket system

// Agents
export const agentsService = {
  // Get all agents
  async getAll() {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Get agent by ID
  async getById(id) {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Update agent
  async update(id, updates) {
    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Create agent
  async create(agent) {
    const { data, error } = await supabase
      .from('agents')
      .insert([agent])
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// WhatsApp Numbers
export const whatsappNumbersService = {
  // Get all WhatsApp numbers
  async getAll() {
    const { data, error } = await supabase
      .from('whatsapp_numbers')
      .select(`
        *,
        assigned_agent:agents(name, email)
      `)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Update WhatsApp number
  async update(id, updates) {
    const { data, error } = await supabase
      .from('whatsapp_numbers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Tickets
export const ticketsService = {
  // Get all tickets with related data
  async getAll() {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        assigned_agent:agents(name, email),
        whatsapp_number_info:whatsapp_numbers(display_name),
        status_history(status, updated_by, note, created_at)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Get ticket by ID
  async getById(id) {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        assigned_agent:agents(name, email),
        whatsapp_number_info:whatsapp_numbers(display_name),
        status_history(status, updated_by, note, created_at)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Create ticket
  async create(ticket) {
    const { data, error } = await supabase
      .from('tickets')
      .insert([ticket])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update ticket
  async update(id, updates) {
    const { data, error } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get next ticket number with collision handling
  async getNextTicketNumber() {
    const maxRetries = 5;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Get the highest ticket number
        const { data, error } = await supabase
          .from('tickets')
          .select('id')
          .like('id', 'TKT-%')
          .order('id', { ascending: false })
          .limit(1)
        
        if (error) throw error
        
        let nextNumber;
        if (!data || data.length === 0) {
          nextNumber = 1;
        } else {
          const lastTicket = data[0].id
          const numberPart = lastTicket.replace('TKT-', '')
          const lastNumber = parseInt(numberPart, 10)
          nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
        }
        
        const ticketId = `TKT-${nextNumber.toString().padStart(3, '0')}`;
        
        // Check if this ID already exists
        const { data: existing, error: checkError } = await supabase
          .from('tickets')
          .select('id')
          .eq('id', ticketId)
          .limit(1)
        
        if (checkError) throw checkError
        
        if (!existing || existing.length === 0) {
          return ticketId;
        }
        
        console.log(`Ticket ID ${ticketId} already exists, retrying...`);
        
        // If collision, wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        if (attempt === maxRetries - 1) {
          // Last attempt failed, use timestamp fallback
          break;
        }
      }
    }
    
    // Fallback: use timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `TKT-${timestamp}${randomSuffix}`;
  }
}

// Status History
export const statusHistoryService = {
  // Add status history entry
  async add(ticketId, status, updatedBy, note = '') {
    const { data, error } = await supabase
      .from('status_history')
      .insert([{
        ticket_id: ticketId,
        status,
        updated_by: updatedBy,
        note
      }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get history for ticket
  async getByTicketId(ticketId) {
    const { data, error } = await supabase
      .from('status_history')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  }
}

// WhatsApp Messages
export const whatsappMessagesService = {
  // Get all messages
  async getAll() {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Get messages for ticket
  async getByTicketId(ticketId) {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Add message
  async add(message) {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert([message])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update message status
  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get messages between phone numbers
  async getConversation(customerPhone, whatsappNumber) {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .or(`and(from_number.eq.${customerPhone},to_number.eq.${whatsappNumber}),and(from_number.eq.${whatsappNumber},to_number.eq.${customerPhone})`)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  }
}

// Real-time subscriptions
export const subscriptions = {
  // Subscribe to ticket changes
  subscribeToTickets(callback) {
    return supabase
      .channel('tickets')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets' }, 
        callback
      )
      .subscribe()
  },

  // Subscribe to new messages
  subscribeToMessages(callback) {
    return supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'whatsapp_messages' }, 
        (payload) => callback({ eventType: payload.eventType, new: payload.new })
      )
      .subscribe()
  },

  // Subscribe to agent updates
  subscribeToAgents(callback) {
    return supabase
      .channel('agents')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'agents' }, 
        callback
      )
      .subscribe()
  }
}

export default supabase