// lib/supabase.js - Fixed version with proper relationship handling
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Enhanced WhatsApp Messages service with proper error handling
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
    // Ensure all required fields are present with defaults
    const messageWithDefaults = {
      from_number: '',
      to_number: '',
      body: '',
      message_type: 'text',
      status: 'sent',
      is_status_update: false,
      timestamp: new Date().toISOString(),
      ...message // Override with provided values
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

  // Update status by WhatsApp message ID (for webhook status updates)
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
  },

  // Send real WhatsApp message via API
  async sendWhatsAppMessage(ticketId, fromNumber, toNumber, message, isStatusUpdate = false) {
    try {
      // Send via WhatsApp API
      const { whatsappAPI } = await import('./whatsapp-api');
      
      if (!whatsappAPI.isConfigured()) {
        throw new Error('WhatsApp API is not configured. Please check your environment variables.');
      }

      const result = await whatsappAPI.sendMessage(toNumber, message, fromNumber);
      
      // Save to database with all required fields
      const messageRecord = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ticket_id: ticketId,
        from_number: fromNumber,
        to_number: toNumber,
        body: message,
        message_type: 'outgoing',
        status: result.status || 'sent',
        is_status_update: isStatusUpdate,
        whatsapp_message_id: result.messageId || null,
        timestamp: result.timestamp || new Date().toISOString()
      };
      
      const savedMessage = await this.add(messageRecord);
      return { ...savedMessage, whatsapp_result: result };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  },

  // Send status update with predefined templates
  async sendStatusUpdate(ticketId, customerPhone, whatsappNumber, status, note = '', agentName = '') {
    try {
      const { whatsappAPI } = await import('./whatsapp-api');
      
      if (!whatsappAPI.isConfigured()) {
        console.warn('WhatsApp API not configured, skipping status update');
        return null;
      }

      const result = await whatsappAPI.sendStatusUpdateNotification(
        customerPhone,
        ticketId,
        status,
        note,
        agentName,
        whatsappNumber
      );
      
      // Construct the message body for database storage
      const statusMessages = {
        'in-progress': `🔄 Your ticket ${ticketId} is now being worked on${agentName ? ` by ${agentName}` : ''}. We'll keep you updated on the progress.`,
        'resolved': `✅ Good news! Your ticket ${ticketId} has been resolved${agentName ? ` by ${agentName}` : ''}. Please let us know if you need any further assistance.`,
        'closed': `📝 Your ticket ${ticketId} has been closed. Thank you for contacting us. Feel free to reach out if you have any other questions.`
      };

      let messageBody = statusMessages[status] || `📋 Your ticket ${ticketId} status has been updated to: ${status}`;
      if (note) {
        messageBody += `\n\nNote: ${note}`;
      }
      
      // Save status update message to database
      const messageRecord = {
        id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ticket_id: ticketId,
        from_number: whatsappNumber,
        to_number: customerPhone,
        body: messageBody,
        message_type: 'outgoing',
        status: result.status || 'sent',
        is_status_update: true,
        whatsapp_message_id: result.messageId || null,
        timestamp: result.timestamp || new Date().toISOString()
      };
      
      const savedMessage = await this.add(messageRecord);
      return { ...savedMessage, whatsapp_result: result };
    } catch (error) {
      console.error('Error sending status update:', error);
      throw error;
    }
  },

  // Test WhatsApp API connection
  async testWhatsAppConnection() {
    try {
      const { whatsappAPI } = await import('./whatsapp-api');
      return await whatsappAPI.testConnection();
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

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
    // Fixed: Use explicit foreign key reference to avoid ambiguity
    const { data, error } = await supabase
      .from('whatsapp_numbers')
      .select(`
        *,
        assigned_agent:assigned_agent_id(name, email)
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

// Tickets service with fixed relationship queries
export const ticketsService = {
  async getAll() {
    // Fixed: Use explicit foreign key reference to avoid relationship ambiguity
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        assigned_agent:assigned_agent_id(name, email),
        whatsapp_number_info:whatsapp_number(display_name),
        status_history(status, updated_by, note, created_at)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id) {
    // Fixed: Use explicit foreign key reference
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        assigned_agent:assigned_agent_id(name, email),
        whatsapp_number_info:whatsapp_number(display_name),
        status_history(status, updated_by, note, created_at)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getByCustomerPhone(customerPhone) {
    // Fixed: Use explicit foreign key reference
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        assigned_agent:assigned_agent_id(name, email),
        whatsapp_number_info:whatsapp_number(display_name),
        status_history(status, updated_by, note, created_at)
      `)
      .eq('customer_phone', customerPhone)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(ticket) {
    const { data, error } = await supabase
      .from('tickets')
      .insert([ticket])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

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
    
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `TKT-${timestamp}${randomSuffix}`;
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