// lib/supabase.js - Updated service matching the actual database schema
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Agents service
export const agentsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

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

// WhatsApp Numbers service
export const whatsappNumbersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('whatsapp_numbers')
      .select(`
        *,
        assigned_agent:agents!whatsapp_numbers_assigned_agent_fkey(name, email)
      `)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

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

// Tickets service - Using assigned_to (string) instead of foreign key relationships
export const ticketsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        whatsapp_number_info:whatsapp_numbers!tickets_whatsapp_number_fkey(display_name),
        status_history(status, updated_by, note, created_at)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        whatsapp_number_info:whatsapp_numbers!tickets_whatsapp_number_fkey(display_name),
        status_history(status, updated_by, note, created_at)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getByCustomerPhone(customerPhone) {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        whatsapp_number_info:whatsapp_numbers!tickets_whatsapp_number_fkey(display_name),
        status_history(status, updated_by, note, created_at)
      `)
      .eq('customer_phone', customerPhone)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(ticket) {
    // Ensure we only pass fields that exist in the database schema
    const cleanTicket = {
      id: ticket.id,
      customer_name: ticket.customer_name,
      customer_phone: ticket.customer_phone,
      customer_email: ticket.customer_email,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assigned_to: ticket.assigned_to || 'Unassigned', // Use assigned_to (string)
      channel: ticket.channel,
      whatsapp_number: ticket.whatsapp_number,
      tags: ticket.tags,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert([cleanTicket])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id, updates) {
    // Ensure we only update fields that exist in the database schema
    const cleanUpdates = { ...updates }
    
    // Remove assigned_agent_id if it exists (not used anymore)
    delete cleanUpdates.assigned_agent_id
    
    // Ensure assigned_to is used for assignment updates
    if (updates.assigned_agent_id && !updates.assigned_to) {
      console.warn('assigned_agent_id field is not used. Use assigned_to instead.')
    }

    const { data, error } = await supabase
      .from('tickets')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getNextTicketNumber() {
    const maxRetries = 5;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
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
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        if (attempt === maxRetries - 1) {
          break;
        }
      }
    }
    
    // Fallback to timestamp-based ID
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `TKT-${timestamp}${randomSuffix}`;
  },

  // Helper method to reassign tickets using agent names (matching the database schema)
  async reassign(ticketId, newAgentName) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ 
          assigned_to: newAgentName || 'Unassigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single()
    
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error reassigning ticket:', error)
      throw error
    }
  }
}

// Status History service
export const statusHistoryService = {
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

// WhatsApp Messages service
export const whatsappMessagesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getByTicketId(ticketId) {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async add(message) {
    const messageWithDefaults = {
      from_number: '',
      to_number: '',
      body: '',
      message_type: 'text',
      status: 'sent',
      is_status_update: false,
      timestamp: new Date().toISOString(),
      ...message
    };

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .insert([messageWithDefaults])
      .select()
      .single()
    
    if (error) {
      console.error('Error adding WhatsApp message:', error);
      throw error;
    }
    return data
  },

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

  async updateStatusByWhatsAppId(whatsappMessageId, status) {
    if (!whatsappMessageId) {
      console.warn('No WhatsApp message ID provided for status update');
      return [];
    }

    const { data, error } = await supabase
      .from('whatsapp_messages')
      .update({ status })
      .eq('whatsapp_message_id', whatsappMessageId)
      .select()
    
    if (error) {
      console.error('Error updating message status by WhatsApp ID:', error);
      throw error;
    }
    return data || []
  },

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
  subscribeToTickets(callback) {
    return supabase
      .channel('tickets')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets' }, 
        callback
      )
      .subscribe()
  },

  subscribeToMessages(callback) {
    return supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'whatsapp_messages' }, 
        (payload) => callback({ eventType: payload.eventType, new: payload.new })
      )
      .subscribe()
  },

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