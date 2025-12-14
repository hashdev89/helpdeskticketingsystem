// lib/supabase.js - Enhanced with WhatsApp API Integration and Chat Support
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Lazy initialization to avoid build-time errors
let supabaseClient = null

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
  }
  
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  
  return supabaseClient
}

// Export a proxy that lazily initializes the client on first property access
// This prevents build-time errors while still working correctly at runtime
export const supabase = new Proxy({}, {
  get(target, prop) {
    try {
      const client = getSupabaseClient()
      const value = client[prop]
      
      // If it's a function, bind it to preserve 'this' context
      if (typeof value === 'function') {
        return value.bind(client)
      }
      
      // For objects (like auth, storage, etc.) and other values, return directly
      // Supabase's internal methods are already properly bound
      return value
    } catch (error) {
      // Provide a helpful error message in the browser console
      if (typeof window !== 'undefined') {
        console.error('Supabase Client Error:', error.message)
        console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Vercel environment variables.')
      }
      throw error
    }
  }
})

// WhatsApp API Integration Class
class WhatsAppAPI {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    
    if (!this.accessToken || !this.phoneNumberId) {
      console.warn('WhatsApp API credentials not configured - running in simulation mode');
    }
  }

  // Check if WhatsApp API is properly configured
  isConfigured() {
    return !!(this.accessToken && this.phoneNumberId);
  }

  // Send WhatsApp message
  async sendMessage(to, message, ticketId = null) {
    try {
      if (!this.isConfigured()) {
        console.log('WhatsApp API not configured - simulating message send');
        return { messages: [{ id: `sim_${Date.now()}` }] };
      }

      const payload = {
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'text',
        text: { body: message }
      };

      const response = await fetch(`${this.baseURL}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`WhatsApp API error: ${error.error?.message || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  // Categorize message based on content
  categorizeMessage(message) {
    const lowercaseMessage = message.toLowerCase();
    
    const keywords = {
      billing: ['bill', 'payment', 'invoice', 'charge', 'refund', 'money', 'cost', 'price', 'subscription'],
      technical: ['bug', 'error', 'not working', 'broken', 'issue', 'problem', 'technical', 'app', 'website', 'login'],
      sales: ['buy', 'purchase', 'price', 'quote', 'demo', 'product', 'service', 'sales', 'pricing'],
      support: ['help', 'support', 'question', 'how to', 'assistance', 'guide']
    };

    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => lowercaseMessage.includes(word))) {
        return category;
      }
    }

    return 'support';
  }

  // Prioritize message based on urgency indicators
  prioritizeMessage(message) {
    const lowercaseMessage = message.toLowerCase();
    
    const urgentKeywords = ['urgent', 'emergency', 'asap', 'critical', 'broken', 'not working', 'down'];
    const highKeywords = ['important', 'soon', 'quickly', 'priority'];
    
    if (urgentKeywords.some(word => lowercaseMessage.includes(word))) {
      return 'urgent';
    }
    
    if (highKeywords.some(word => lowercaseMessage.includes(word))) {
      return 'high';
    }
    
    return 'medium';
  }

  // Generate subject line from message
  generateSubject(message, category) {
    const truncated = message.length > 50 ? message.substring(0, 50) + '...' : message;
    return `WhatsApp ${category.charAt(0).toUpperCase() + category.slice(1)}: ${truncated}`;
  }

  // Verify webhook for WhatsApp
  verifyWebhook(mode, token, challenge) {
    if (mode === 'subscribe' && token === this.webhookVerifyToken) {
      console.log('WhatsApp webhook verified successfully');
      return challenge;
    }
    throw new Error('Invalid webhook verification');
  }
}

// Create WhatsApp API instance
export const whatsappAPI = new WhatsAppAPI();

// UUID validation helper
function isValidUUID(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
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
  },

  // Get available agent for assignment
  async getAvailableAgent(category) {
    try {
      const agents = await this.getAll();
      const availableAgents = agents.filter(agent => 
        agent.is_active && agent.current_load < agent.max_tickets
      );

      if (availableAgents.length === 0) return null;

      // Find agents with expertise in the category
      const expertAgents = availableAgents.filter(agent => 
        agent.expertise?.includes(category)
      );

      const agentsToChooseFrom = expertAgents.length > 0 ? expertAgents : availableAgents;
      
      // Return agent with lowest current load
      return agentsToChooseFrom.reduce((min, agent) => 
        agent.current_load < min.current_load ? agent : min
      );

    } catch (error) {
      console.error('Error getting available agent:', error);
      return null;
    }
  },

async delete(id) {
  // Unassign agent from all tickets first
  
  const { error: ticketError } = await supabase
    .from('tickets')
    .update({ assigned_agent_id: null })
    .eq('assigned_agent_id', id);
  if (ticketError) throw ticketError;
  // Now delete the agent
  const { error } = await supabase.from('agents').delete().eq('id', id);
  if (error) throw error;
}
}

// WhatsApp Numbers service
export const whatsappNumbersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('whatsapp_numbers')
      .select(`
        *,
        assigned_agent:agents!whatsapp_numbers_assigned_agent_fkey(id, name, email)
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

// Enhanced Tickets service with WhatsApp integration and Chat support
export const ticketsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        whatsapp_number_info:whatsapp_numbers!tickets_whatsapp_number_fkey(display_name),
        assigned_agent:agents!tickets_assigned_agent_fkey(id, name, email, role),
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
        assigned_agent:agents!tickets_assigned_agent_fkey(id, name, email, role),
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
        assigned_agent:agents!tickets_assigned_agent_fkey(id, name, email, role),
        status_history(status, updated_by, note, created_at)
      `)
      .eq('customer_phone', customerPhone)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async create(ticket) {
    const cleanTicket = {
      id: ticket.id,
      customer_name: ticket.customer_name,
      customer_phone: ticket.customer_phone,
      customer_email: ticket.customer_email || null,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assigned_agent_id: isValidUUID(ticket.assigned_agent_id) ? ticket.assigned_agent_id : null,
      channel: ticket.channel,
      whatsapp_number: ticket.whatsapp_number || null,
      session_id: ticket.session_id || null, // Add session_id support
      tags: ticket.tags || [],
      created_at: ticket.created_at || new Date().toISOString(),
      updated_at: ticket.updated_at || new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert([cleanTicket])
      .select(`
        *,
        assigned_agent:agents!tickets_assigned_agent_fkey(id, name, email, role)
      `)
      .single()

    if (error) throw error
    return data
  },

  // Enhanced update with WhatsApp status notifications
  async update(id, updates, sendWhatsAppUpdate = true) {
    const cleanUpdates = { ...updates }
    delete cleanUpdates.assigned_to

    if (updates.assigned_to && !updates.assigned_agent_id) {
      console.warn('assigned_to field is not in database. Use assigned_agent_id instead.')
      delete cleanUpdates.assigned_to
    }

    // Get original ticket for comparison
    const originalTicket = await this.getById(id);

    const { data, error } = await supabase
      .from('tickets')
      .update({
        ...cleanUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        assigned_agent:agents!tickets_assigned_agent_fkey(id, name, email, role)
      `)
      .single()

    if (error) throw error

    // Send WhatsApp status update if status changed and it's a WhatsApp ticket
    if (sendWhatsAppUpdate && 
        updates.status && 
        updates.status !== originalTicket.status && 
        originalTicket.channel === 'whatsapp') {
      
      try {
        await this.sendStatusUpdate(id, updates.status, updates.note || '', data.assigned_agent?.name || '');
      } catch (error) {
        console.error('Error sending WhatsApp status update:', error);
        // Don't fail the ticket update if WhatsApp notification fails
      }
    }

    // Send chat status update if status changed and it's a web-chat ticket
    if (updates.status && 
        updates.status !== originalTicket.status && 
        originalTicket.channel === 'web-chat' && 
        originalTicket.session_id) {
      
      try {
        // Get status update message (note is stored in status_history, not in ticket updates)
        let statusMessage = this.getStatusUpdateMessage(updates.status, data.assigned_agent?.name);
        
        await chatMessagesService.sendSystemMessage(
          originalTicket.session_id,
          id,
          statusMessage,
          { ticket_status: updates.status, is_status_update: true }
        );
        
        console.log('Chat status update sent:', { session_id: originalTicket.session_id, status: updates.status });
      } catch (error) {
        console.error('Error sending chat status update:', error);
        // Don't fail the ticket update if chat notification fails
      }
    }

    return data
  },

  // Get status update message for chat
  getStatusUpdateMessage(status, agentName = '') {
    const statusMessages = {
      'in-progress': `🔄 Your ticket is now being worked on${agentName ? ` by ${agentName}` : ' by our team'}.`,
      'resolved': `✅ Your ticket has been resolved${agentName ? ` by ${agentName}` : ' by our team'}! Is there anything else we can help you with?`,
      'closed': `📝 Your ticket has been closed. Thank you for contacting us!`
    };
    return statusMessages[status] || `📋 Your ticket status has been updated to: ${status}`;
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
  },

  // Enhanced reassign with WhatsApp notification
  async reassign(ticketId, newAgentId, sendWhatsAppUpdate = true) {
    try {
      const ticket = await this.getById(ticketId);
      const newAgent = newAgentId ? await agentsService.getById(newAgentId) : null;
      const oldAgent = ticket.assigned_agent;

      const { data, error } = await supabase
        .from('tickets')
        .update({
          assigned_agent_id: newAgentId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select(`
          *,
          assigned_agent:agents!tickets_assigned_agent_fkey(id, name, email, role)
        `)
        .single()

      if (error) throw error

      // Update agent loads
      if (oldAgent) {
        await agentsService.update(oldAgent.id, {
          current_load: Math.max(0, oldAgent.current_load - 1)
        });
      }

      if (newAgent) {
        await agentsService.update(newAgentId, {
          current_load: newAgent.current_load + 1
        });
      }

      // Send WhatsApp reassignment notification
      if (sendWhatsAppUpdate && ticket.channel === 'whatsapp') {
        try {
          const message = `🔄 Your ticket ${ticketId} has been reassigned to ${newAgent?.name || 'our team'}. They will continue assisting you with your request.`;
          await whatsappAPI.sendMessage(ticket.customer_phone, message, ticketId);
          
          // Save the notification message
          await whatsappMessagesService.add({
            id: `reassign_${Date.now()}`,
            ticket_id: ticketId,
            from_number: ticket.whatsapp_number || process.env.WHATSAPP_PHONE_NUMBER_ID,
            to_number: ticket.customer_phone,
            body: message,
            message_type: 'outgoing',
            status: 'sent',
            is_status_update: true
          });
        } catch (error) {
          console.error('Error sending WhatsApp reassignment notification:', error);
        }
      }

      return data
    } catch (error) {
      console.error('Error reassigning ticket:', error)
      throw error
    }
  },

  // Send WhatsApp status update to customer
  async sendStatusUpdate(ticketId, newStatus, note = '', agentName = '') {
    try {
      const ticket = await this.getById(ticketId);
      if (!ticket || ticket.channel !== 'whatsapp') return;

      const statusMessages = {
        'in-progress': `🔄 Update on ticket ${ticketId}: ${agentName || 'Our team'} is now working on your request.${note ? `\n\nNote: ${note}` : ''}`,
        
        'resolved': `✅ Great news! Your ticket ${ticketId} has been resolved by ${agentName || 'our team'}.${note ? `\n\nSolution: ${note}` : ''}\n\nIf you need further assistance, please let us know!`,
        
        'closed': `📝 Your ticket ${ticketId} has been closed. Thank you for contacting us!${note ? `\n\nFinal note: ${note}` : ''}\n\nFeel free to reach out if you have any other questions.`,
        
        'reopened': `🔄 Your ticket ${ticketId} has been reopened by ${agentName || 'our team'}. We're here to help!${note ? `\n\nNote: ${note}` : ''}`
      };

      const message = statusMessages[newStatus];
      if (message) {
        await whatsappAPI.sendMessage(ticket.customer_phone, message, ticketId);
        
        // Save the status update message
        await whatsappMessagesService.add({
          id: `status_${Date.now()}`,
          ticket_id: ticketId,
          from_number: ticket.whatsapp_number || process.env.WHATSAPP_PHONE_NUMBER_ID,
          to_number: ticket.customer_phone,
          body: message,
          message_type: 'outgoing',
          status: 'sent',
          is_status_update: true
        });
      }

    } catch (error) {
      console.error('Error sending status update:', error);
      throw error;
    }
  },

  // Send WhatsApp reply
  async sendWhatsAppReply(ticketId, message, agentName = '') {
    try {
      const ticket = await this.getById(ticketId);
      
      if (ticket.channel !== 'whatsapp') {
        throw new Error('Ticket is not a WhatsApp ticket');
      }

      // Send message via WhatsApp API
      await whatsappAPI.sendMessage(ticket.customer_phone, message, ticketId);

      // Save the message
      await whatsappMessagesService.add({
        id: `reply_${Date.now()}`,
        ticket_id: ticketId,
        from_number: ticket.whatsapp_number || process.env.WHATSAPP_PHONE_NUMBER_ID,
        to_number: ticket.customer_phone,
        body: message,
        message_type: 'outgoing',
        status: 'sent',
        is_status_update: false
      });

      // Update ticket status if it was open
      if (ticket.status === 'open') {
        await this.update(ticketId, { status: 'in-progress' }, false);
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending WhatsApp reply:', error);
      throw error;
    }
  },

  // Create ticket from WhatsApp message
  async createFromWhatsApp(phoneNumber, customerName, message, whatsappNumber) {
    try {
      const ticketId = await this.getNextTicketNumber();
      
      const category = whatsappAPI.categorizeMessage(message);
      const priority = whatsappAPI.prioritizeMessage(message);
      const assignedAgent = await agentsService.getAvailableAgent(category);
      
      const newTicket = {
        id: ticketId,
        customer_name: customerName,
        customer_phone: phoneNumber,
        subject: whatsappAPI.generateSubject(message, category),
        message: message,
        status: 'open',
        priority: priority,
        category: category,
        assigned_agent_id: assignedAgent?.id || null,
        channel: 'whatsapp',
        whatsapp_number: whatsappNumber,
        tags: ['whatsapp', 'auto-created', category]
      };

      // Create ticket
      const createdTicket = await this.create(newTicket);

      // Update agent load if assigned
      if (assignedAgent) {
        await agentsService.update(assignedAgent.id, {
          current_load: assignedAgent.current_load + 1
        });
      }

      // Send auto-reply
      const autoReplyTemplates = {
        support: `🎫 Thank you for contacting support! Your ticket ${ticketId} has been created${assignedAgent ? ` and assigned to ${assignedAgent.name}` : ''}. We'll assist you shortly.`,
        
        billing: `💳 Thank you for your billing inquiry! Your ticket ${ticketId} has been created${assignedAgent ? ` and assigned to ${assignedAgent.name}` : ''}. Our billing team will review and respond within 2 hours.`,
        
        technical: `🔧 Thank you for reporting this technical issue! Your ticket ${ticketId} has been created${assignedAgent ? ` and assigned to ${assignedAgent.name}` : ''}. Our technical team will investigate and respond within 4 hours.`,
        
        sales: `💼 Thank you for your interest! Your sales inquiry ${ticketId} has been created${assignedAgent ? ` and assigned to ${assignedAgent.name}` : ''}. Our sales team will contact you within 1 hour.`
      };

      const autoReply = autoReplyTemplates[category] || autoReplyTemplates.support;

      await whatsappAPI.sendMessage(phoneNumber, autoReply, ticketId);

      // Save auto-reply message
      await whatsappMessagesService.add({
        id: `auto_reply_${Date.now()}`,
        ticket_id: ticketId,
        from_number: whatsappNumber,
        to_number: phoneNumber,
        body: autoReply,
        message_type: 'outgoing',
        status: 'sent',
        is_status_update: true
      });

      return createdTicket;

    } catch (error) {
      console.error('Error creating ticket from WhatsApp:', error);
      throw error;
    }
  },

  async delete(id) {
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) throw error;
  }
}

// Status History service
export const statusHistoryService = {
  async add(ticketId, status, updatedBy, note = '', updatedByAgentId = null) {
    const { data, error } = await supabase
      .from('status_history')
      .insert([{
        ticket_id: ticketId,
        status,
        updated_by: updatedBy,
        note,
        updated_by_agent_id: updatedByAgentId
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

// Enhanced WhatsApp Messages service
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
      created_at: new Date().toISOString(),
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
  },

  // Process incoming WhatsApp message
  async processIncomingMessage(messageData) {
    try {
      const { from, text, timestamp, id: whatsappMessageId } = messageData;
      const phoneNumber = `+${from}`;
      const messageBody = text?.body || '';

      if (!messageBody) return;

      // Check for existing open tickets
      const existingTickets = await ticketsService.getByCustomerPhone(phoneNumber);
      const openTickets = existingTickets.filter(t => ['open', 'in-progress'].includes(t.status));

      if (openTickets.length > 0) {
        // Add message to existing ticket
        const ticket = openTickets[0];
        
        await this.add({
          id: `wa_${whatsappMessageId}`,
          whatsapp_message_id: whatsappMessageId,
          ticket_id: ticket.id,
          from_number: phoneNumber,
          to_number: process.env.WHATSAPP_PHONE_NUMBER_ID,
          body: messageBody,
          message_type: 'incoming',
          status: 'received',
          timestamp: new Date(parseInt(timestamp) * 1000).toISOString()
        });

        return ticket;
      }

      // Create new ticket
      const customerName = `Customer ${from.slice(-4)}`;
      const newTicket = await ticketsService.createFromWhatsApp(
        phoneNumber,
        customerName,
        messageBody,
        process.env.WHATSAPP_PHONE_NUMBER_ID
      );

      // Add incoming message to ticket
      await this.add({
        id: `wa_${whatsappMessageId}`,
        whatsapp_message_id: whatsappMessageId,
        ticket_id: newTicket.id,
        from_number: phoneNumber,
        to_number: process.env.WHATSAPP_PHONE_NUMBER_ID,
        body: messageBody,
        message_type: 'incoming',
        status: 'received',
        timestamp: new Date(parseInt(timestamp) * 1000).toISOString()
      });

      return newTicket;

    } catch (error) {
      console.error('Error processing incoming WhatsApp message:', error);
      throw error;
    }
  }
}

// NEW: User Chat Sessions service
export const userChatService = {
  async createSession(sessionData) {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert([sessionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSession(sessionId) {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) throw error;
    return data;
  },

  async getAllActiveSessions() {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('status', 'active')
      .order('last_activity', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateSession(sessionId, updates) {
    const { data, error } = await supabase
      .from('user_sessions')
      .update(updates)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// NEW: Chat Messages service
export const chatMessagesService = {
  async addMessage(messageData) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([messageData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMessagesBySession(sessionId) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getAllMessages() {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return data || [];
  },

  async sendSystemMessage(sessionId, ticketId, message, metadata = {}) {
    return await this.addMessage({
      session_id: sessionId,
      ticket_id: ticketId,
      message_text: message,
      message_type: 'text',
      sender_type: 'system',
      sender_name: 'Support System',
      is_read: false,
      metadata: metadata
    });
  },

  async markAsRead(messageId) {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// NEW: Enhanced tickets service with chat integration
export const chatTicketsService = {
  // Create ticket from chat session
  async createFromChat(sessionId, customerName, firstMessage, customerEmail = null) {
    try {
      const ticketId = await ticketsService.getNextTicketNumber();
      
      const category = whatsappAPI.categorizeMessage(firstMessage);
      const priority = whatsappAPI.prioritizeMessage(firstMessage);
      const assignedAgent = await agentsService.getAvailableAgent(category);
      
      const newTicket = {
        id: ticketId,
        session_id: sessionId,
        customer_name: customerName,
        customer_phone: 'Not provided',
        customer_email: customerEmail,
        subject: `Live Chat: ${firstMessage.substring(0, 50)}${firstMessage.length > 50 ? '...' : ''}`,
        message: firstMessage,
        status: 'open',
        priority: priority,
        category: category,
        assigned_agent_id: assignedAgent?.id || null,
        channel: 'web-chat',
        tags: ['web-chat', 'auto-created', category]
      };

      // Create ticket
      const createdTicket = await ticketsService.create(newTicket);

      // Update agent load if assigned
      if (assignedAgent) {
        await agentsService.update(assignedAgent.id, {
          current_load: assignedAgent.current_load + 1
        });
      }

      // Add status history
      await statusHistoryService.add(
        ticketId,
        'open',
        'System',
        assignedAgent 
          ? `Created from web chat and assigned to ${assignedAgent.name}` 
          : 'Created from web chat - no agent assigned',
        assignedAgent?.id
      );

      return createdTicket;

    } catch (error) {
      console.error('Error creating ticket from chat:', error);
      throw error;
    }
  }
}

// Real-time subscriptions (enhanced with chat support)
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
  },

  // Subscribe to real-time messages for a specific session
subscribeToChatMessages(sessionId, callback) {
  return supabase
    .channel(`chat_messages_${sessionId}`) // dynamic channel name is good
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `session_id=eq.${sessionId}`
    }, callback)
    .subscribe();
},

  // NEW: Subscribe to user sessions
  subscribeToUserSessions(callback) {
    return supabase
      .channel('user_sessions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_sessions' },
        callback
      )
      .subscribe()
  },

  // NEW: Subscribe to specific chat session
  subscribeToChatSession(sessionId, callback) {
    return supabase
      .channel(`chat_session_${sessionId}`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        callback
      )
      .subscribe()
  }
}

// Chat Notes service
export const chatNotesService = {
  async add(noteData) {
    const { data, error } = await supabase
      .from('chat_notes')
      .insert([noteData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getByTicketId(ticketId) {
    const { data, error } = await supabase
      .from('chat_notes')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getBySessionId(sessionId) {
    const { data, error } = await supabase
      .from('chat_notes')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async update(noteId, updates) {
    const { data, error } = await supabase
      .from('chat_notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(noteId) {
    const { error } = await supabase
      .from('chat_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  }
}

// Promotions service
export const promotionsService = {
  async create(promotion) {
    const { data, error } = await supabase
      .from('promotions')
      .insert([promotion])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export default supabase