// lib/whatsapp-api.js - WhatsApp Business API Integration
import { ticketsService, whatsappMessagesService, statusHistoryService, agentsService } from './supabase.js';

class WhatsAppAPI {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    
    if (!this.accessToken || !this.phoneNumberId) {
      console.warn('WhatsApp API credentials not configured');
    }
  }

  // Webhook verification for WhatsApp
  verifyWebhook(mode, token, challenge) {
    if (mode === 'subscribe' && token === this.webhookVerifyToken) {
      console.log('WhatsApp webhook verified successfully');
      return challenge;
    }
    throw new Error('Invalid webhook verification');
  }

  // Process incoming WhatsApp webhook
  async processWebhook(body) {
    try {
      console.log('Processing WhatsApp webhook:', JSON.stringify(body, null, 2));

      if (!body?.entry?.length) return;

      for (const entry of body.entry) {
        if (!entry.changes?.length) continue;

        for (const change of entry.changes) {
          if (change.field !== 'messages') continue;

          const { messages, statuses, contacts } = change.value;

          // Process incoming messages
          if (messages?.length) {
            for (const message of messages) {
              await this.handleIncomingMessage(message, contacts);
            }
          }

          // Process message status updates
          if (statuses?.length) {
            for (const status of statuses) {
              await this.handleStatusUpdate(status);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error);
      throw error;
    }
  }

  // Handle incoming WhatsApp message
  async handleIncomingMessage(message, contacts = []) {
    try {
      console.log('Processing incoming message:', message);

      const { from, text, timestamp, id: whatsappMessageId, type } = message;
      
      // Get contact info
      const contact = contacts?.find(c => c.wa_id === from);
      const customerName = contact?.profile?.name || `Customer ${from.slice(-4)}`;

      // Only process text messages for now
      if (type !== 'text' || !text?.body) {
        console.log('Skipping non-text message');
        return;
      }

      const messageBody = text.body;
      const phoneNumber = `+${from}`;

      // Check if customer has existing open tickets
      const existingTickets = await ticketsService.getByCustomerPhone(phoneNumber);
      const openTickets = existingTickets.filter(t => ['open', 'in-progress'].includes(t.status));

      if (openTickets.length > 0) {
        // Add message to existing ticket
        const ticket = openTickets[0];
        
        await whatsappMessagesService.add({
          id: `wa_${whatsappMessageId}`,
          whatsapp_message_id: whatsappMessageId,
          ticket_id: ticket.id,
          from_number: phoneNumber,
          to_number: this.phoneNumberId,
          body: messageBody,
          message_type: 'incoming',
          status: 'received',
          timestamp: new Date(parseInt(timestamp) * 1000).toISOString()
        });

        console.log(`Message added to existing ticket: ${ticket.id}`);
        return ticket;
      }

      // Create new ticket
      const ticketId = await ticketsService.getNextTicketNumber();
      const category = this.categorizeMessage(messageBody);
      const priority = this.prioritizeMessage(messageBody);
      
      // Get available agent
      const assignedAgent = await this.getAvailableAgent(category);

      const newTicket = {
        id: ticketId,
        customer_name: customerName,
        customer_phone: phoneNumber,
        subject: this.generateSubject(messageBody, category),
        message: messageBody,
        status: 'open',
        priority: priority,
        category: category,
        assigned_agent_id: assignedAgent?.id || null,
        channel: 'whatsapp',
        whatsapp_number: this.phoneNumberId,
        tags: ['whatsapp', 'auto-created', category],
        created_at: new Date(parseInt(timestamp) * 1000).toISOString()
      };

      // Create ticket in database
      const createdTicket = await ticketsService.create(newTicket);

      // Add incoming message
      await whatsappMessagesService.add({
        id: `wa_${whatsappMessageId}`,
        whatsapp_message_id: whatsappMessageId,
        ticket_id: ticketId,
        from_number: phoneNumber,
        to_number: this.phoneNumberId,
        body: messageBody,
        message_type: 'incoming',
        status: 'received',
        timestamp: new Date(parseInt(timestamp) * 1000).toISOString()
      });

      // Add status history
      await statusHistoryService.add(
        ticketId,
        'open',
        'WhatsApp Bot',
        assignedAgent ? `Auto-assigned to ${assignedAgent.name}` : 'No agents available'
      );

      // Update agent load if assigned
      if (assignedAgent) {
        await agentsService.update(assignedAgent.id, {
          current_load: assignedAgent.current_load + 1
        });
      }

      // Send auto-reply
      await this.sendAutoReply(phoneNumber, ticketId, assignedAgent, category);

      console.log(`New ticket created: ${ticketId}`);
      return createdTicket;

    } catch (error) {
      console.error('Error handling incoming message:', error);
      throw error;
    }
  }

  // Handle message status updates (sent, delivered, read)
  async handleStatusUpdate(statusUpdate) {
    try {
      const { id: whatsappMessageId, status, timestamp } = statusUpdate;
      
      await whatsappMessagesService.updateStatusByWhatsAppId(whatsappMessageId, status);
      
      console.log(`Message ${whatsappMessageId} status updated to: ${status}`);
    } catch (error) {
      console.error('Error handling status update:', error);
    }
  }

  // Send WhatsApp message
  async sendMessage(to, message, ticketId = null) {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        throw new Error('WhatsApp API not configured');
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

      const result = await response.json();
      const whatsappMessageId = result.messages?.[0]?.id;

      // Save message to database
      if (ticketId) {
        await whatsappMessagesService.add({
          id: `wa_out_${Date.now()}`,
          whatsapp_message_id: whatsappMessageId,
          ticket_id: ticketId,
          from_number: this.phoneNumberId,
          to_number: to,
          body: message,
          message_type: 'outgoing',
          status: 'sent',
          timestamp: new Date().toISOString()
        });
      }

      return result;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  // Send templated auto-reply
  async sendAutoReply(customerPhone, ticketId, assignedAgent, category) {
    try {
      const templates = {
        support: `🎫 Thank you for contacting support! Your ticket ${ticketId} has been created${assignedAgent ? ` and assigned to ${assignedAgent.name}` : ''}. We'll assist you shortly.`,
        
        billing: `💳 Thank you for your billing inquiry! Your ticket ${ticketId} has been created${assignedAgent ? ` and assigned to ${assignedAgent.name}` : ''}. Our billing team will review and respond within 2 hours.`,
        
        technical: `🔧 Thank you for reporting this technical issue! Your ticket ${ticketId} has been created${assignedAgent ? ` and assigned to ${assignedAgent.name}` : ''}. Our technical team will investigate and respond within 4 hours.`,
        
        sales: `💼 Thank you for your interest! Your sales inquiry ${ticketId} has been created${assignedAgent ? ` and assigned to ${assignedAgent.name}` : ''}. Our sales team will contact you within 1 hour.`,
        
        default: `🎫 Thank you for contacting us! Your support ticket ${ticketId} has been created${assignedAgent ? ` and assigned to ${assignedAgent.name}` : ''}. Our team will assist you shortly.`
      };

      const message = templates[category] || templates.default;
      await this.sendMessage(customerPhone, message, ticketId);

    } catch (error) {
      console.error('Error sending auto-reply:', error);
    }
  }

  // Send status update to customer
  async sendStatusUpdate(ticketId, newStatus, note = '', agentName = '') {
    try {
      const ticket = await ticketsService.getById(ticketId);
      if (!ticket || ticket.channel !== 'whatsapp') return;

      const statusMessages = {
        'in-progress': `🔄 Update on ticket ${ticketId}: ${agentName || 'Our team'} is now working on your request. ${note ? `\n\nNote: ${note}` : ''}`,
        
        'resolved': `✅ Great news! Your ticket ${ticketId} has been resolved by ${agentName || 'our team'}. ${note ? `\n\nSolution: ${note}` : ''}\n\nIf you need further assistance, please let us know!`,
        
        'closed': `📝 Your ticket ${ticketId} has been closed. Thank you for contacting us!${note ? `\n\nFinal note: ${note}` : ''}\n\nFeel free to reach out if you have any other questions.`,
        
        'reopened': `🔄 Your ticket ${ticketId} has been reopened by ${agentName || 'our team'}. We're here to help!${note ? `\n\nNote: ${note}` : ''}`
      };

      const message = statusMessages[newStatus];
      if (message) {
        await this.sendMessage(ticket.customer_phone, message, ticketId);
      }

    } catch (error) {
      console.error('Error sending status update:', error);
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

  // Get available agent for category
  async getAvailableAgent(category) {
    try {
      const agents = await agentsService.getAll();
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
  }

  // Send template message
  async sendTemplate(to, templateName, templateParams, ticketId = null) {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        throw new Error('WhatsApp API not configured');
      }

      const payload = {
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: templateParams
        }
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
      console.error('Error sending template message:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const whatsappAPI = new WhatsAppAPI();
export default whatsappAPI;