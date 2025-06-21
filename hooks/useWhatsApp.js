// hooks/useWhatsApp.js - Custom hook for WhatsApp integration
import { useState, useEffect, useCallback } from 'react';
import { whatsappAPI, ticketsService, whatsappMessagesService, statusHistoryService } from '../lib/supabase.js';

export const useWhatsApp = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [loading, setLoading] = useState(false);

  // Check WhatsApp API connection
  const checkConnection = useCallback(async () => {
    try {
      const isConfigured = whatsappAPI.isConfigured();
      setIsConnected(isConfigured);
      setConnectionStatus(isConfigured ? 'connected' : 'simulation');
      
      console.log(isConfigured ? '✅ WhatsApp API configured' : '⚠️ WhatsApp API in simulation mode');
      return isConfigured;
    } catch (error) {
      console.error('WhatsApp connection check failed:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      return false;
    }
  }, []);

  // Send WhatsApp message
  const sendMessage = useCallback(async (ticketId, message, customerPhone) => {
    setLoading(true);
    try {
      if (isConnected) {
        // Use real WhatsApp API
        await ticketsService.sendWhatsAppReply(ticketId, message);
        console.log('✅ WhatsApp message sent via API');
        return { success: true, method: 'api' };
      } else {
        // Simulation mode
        const newMessage = {
          id: `sim_${Date.now()}`,
          ticket_id: ticketId,
          from_number: process.env.WHATSAPP_PHONE_NUMBER_ID || '+1234567890',
          to_number: customerPhone,
          body: message,
          message_type: 'outgoing',
          status: 'sent',
          is_status_update: false
        };
        
        await whatsappMessagesService.add(newMessage);
        console.log('✅ WhatsApp message simulated');
        return { success: true, method: 'simulation' };
      }
    } catch (error) {
      console.error('❌ Failed to send WhatsApp message:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Update ticket status with WhatsApp notification
  const updateTicketStatus = useCallback(async (ticketId, newStatus, note = '') => {
    setLoading(true);
    try {
      // Update ticket with automatic WhatsApp notification
      await ticketsService.update(ticketId, { 
        status: newStatus,
        note: note || `Status updated to ${newStatus}`
      }, isConnected);

      // Add status history
      await statusHistoryService.add(
        ticketId, 
        newStatus, 
        'Agent', 
        note || `Status updated to ${newStatus}`
      );

      console.log(`✅ Ticket ${ticketId} status updated to ${newStatus}`);
      return { success: true, notified: isConnected };
    } catch (error) {
      console.error('❌ Failed to update ticket status:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Reassign ticket with WhatsApp notification
  const reassignTicket = useCallback(async (ticketId, newAgentId) => {
    setLoading(true);
    try {
      await ticketsService.reassign(ticketId, newAgentId, isConnected);
      console.log(`✅ Ticket ${ticketId} reassigned`);
      return { success: true, notified: isConnected };
    } catch (error) {
      console.error('❌ Failed to reassign ticket:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Create ticket from WhatsApp message
  const createTicketFromMessage = useCallback(async (phoneNumber, customerName, message, whatsappNumber) => {
    setLoading(true);
    try {
      const newTicket = await ticketsService.createFromWhatsApp(
        phoneNumber,
        customerName,
        message,
        whatsappNumber
      );

      // Add the incoming message
      await whatsappMessagesService.add({
        id: `incoming_${Date.now()}`,
        ticket_id: newTicket.id,
        from_number: phoneNumber,
        to_number: whatsappNumber,
        body: message,
        message_type: 'incoming',
        status: 'received',
        timestamp: new Date().toISOString()
      });

      console.log(`✅ New ticket created: ${newTicket.id}`);
      return newTicket;
    } catch (error) {
      console.error('❌ Failed to create ticket from WhatsApp:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Test WhatsApp API connection
  const testConnection = useCallback(async (testNumber = '+94771234567') => {
    setLoading(true);
    try {
      if (!whatsappAPI.isConfigured()) {
        throw new Error('WhatsApp API credentials not configured');
      }

      const testMessage = '🧪 Test message from WhatsApp Help Desk - API connection successful!';
      await whatsappAPI.sendMessage(testNumber, testMessage);
      
      setIsConnected(true);
      setConnectionStatus('connected');
      console.log('✅ WhatsApp API test successful');
      return { success: true };
    } catch (error) {
      setIsConnected(false);
      setConnectionStatus('error');
      console.error('❌ WhatsApp API test failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Process incoming webhook data
  const processWebhookMessage = useCallback(async (webhookData) => {
    try {
      // This would be called by your webhook handler
      const ticket = await whatsappMessagesService.processIncomingMessage(webhookData);
      console.log('✅ Webhook message processed:', ticket?.id);
      return ticket;
    } catch (error) {
      console.error('❌ Failed to process webhook message:', error);
      throw error;
    }
  }, []);

  // Get quick reply templates
  const getQuickReplies = useCallback(() => {
    return {
      acknowledgment: [
        "Thank you for your message. I'm looking into this and will get back to you shortly.",
        "I've received your request and am working on it now.",
        "Thanks for the additional information. Let me check on this for you."
      ],
      investigation: [
        "I'm investigating this issue and will have an update for you within 2 hours.",
        "Let me check with our technical team and get back to you.",
        "I'm looking into the details of your account to resolve this quickly."
      ],
      resolution: [
        "I've resolved the issue. Please try restarting the application and let me know if it works.",
        "The problem has been fixed on our end. You should see the changes within 15 minutes.",
        "Your request has been processed successfully. Is there anything else I can help you with?"
      ],
      followUp: [
        "How did the solution work for you? Any other questions?",
        "Just checking in - is everything working properly now?",
        "Is there anything else I can help you with today?"
      ]
    };
  }, []);

  // Initialize connection check on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    // State
    isConnected,
    connectionStatus,
    loading,
    
    // Functions
    checkConnection,
    sendMessage,
    updateTicketStatus,
    reassignTicket,
    createTicketFromMessage,
    testConnection,
    processWebhookMessage,
    getQuickReplies,
    
    // Utilities
    isConfigured: whatsappAPI.isConfigured(),
    categorizeMessage: whatsappAPI.categorizeMessage,
    prioritizeMessage: whatsappAPI.prioritizeMessage,
    generateSubject: whatsappAPI.generateSubject
  };
};