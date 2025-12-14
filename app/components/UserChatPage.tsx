"use client"

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  User, 
  Bot, 
  MessageCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader,
  X,
  UserCheck
} from 'lucide-react';

// Import your existing supabase
import { supabase } from '../../lib/supabase';

interface ChatMessage {
  id: string;
  message_text: string;
  sender_type: 'user' | 'agent' | 'system';
  sender_name: string;
  created_at: string;
  metadata?: any;
}

interface TicketStatus {
  ticket_id: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  assigned_agent?: string;
}

export default function UserChatPage() {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ticketStatus, setTicketStatus] = useState<TicketStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [chatStarted, setChatStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [chatClosed, setChatClosed] = useState(false);
  const [agentTyping, setAgentTyping] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate session ID
  const generateSessionId = () => {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  

  // Test database connection
  const testConnection = async () => {
    try {
      setDebugInfo('Testing database connection...');
      
      // Test basic connection
      const { data, error } = await supabase.from('agents').select('count').limit(1);
      if (error) {
        setDebugInfo(`Connection Error: ${error.message}`);
        return false;
      }
      
      setDebugInfo('Database connected successfully!');
      return true;
    } catch (err) {
      if (err instanceof Error) {
        setDebugInfo(`Connection failed: ${err.message}`);
      } else {
        setDebugInfo('Connection failed: Unknown error');
      }
      return false;
    }
  };

  // Test on component mount and restore chat session
  useEffect(() => {
    testConnection();
    
    // Restore chat session from localStorage on page load
    const restoreChatSession = async () => {
      try {
        const savedSessionId = localStorage.getItem('chat_session_id');
        if (!savedSessionId) {
          console.log('No saved chat session found');
          return;
        }

        console.log('🔄 Restoring chat session:', savedSessionId);
        setDebugInfo('Restoring your chat session...');

        // Check if ticket is still open
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('id, status, session_id')
          .eq('session_id', savedSessionId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (ticketError || !ticketData) {
          console.log('No ticket found for session, clearing saved session');
          localStorage.removeItem('chat_session_id');
          return;
        }

        // If ticket is closed, don't restore
        if (ticketData.status === 'closed') {
          console.log('Ticket is closed, clearing saved session');
          localStorage.removeItem('chat_session_id');
          setChatClosed(true);
          return;
        }

        // Restore session
        setSessionId(savedSessionId);
        setChatStarted(true);
        setIsConnected(true);

        // Load ticket status
        setTicketStatus({
          ticket_id: ticketData.id,
          status: ticketData.status
        });

        // Load all messages
        const { data: messages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', savedSessionId)
          .order('created_at', { ascending: true });

        if (!messagesError && messages) {
          setMessages(messages.map(msg => ({
            id: msg.id,
            message_text: msg.message_text,
            sender_type: msg.sender_type,
            sender_name: msg.sender_name,
            created_at: msg.created_at,
            metadata: msg.metadata
          })));
          console.log('✅ Restored', messages.length, 'messages');
        }

        // Load user session info
        const { data: sessionData } = await supabase
          .from('user_sessions')
          .select('customer_name, customer_phone')
          .eq('session_id', savedSessionId)
          .single();

        if (sessionData) {
          setUserName(sessionData.customer_name || '');
          setUserPhone(sessionData.customer_phone || '');
        }

        setDebugInfo('Chat session restored successfully!');
        console.log('✅ Chat session restored');
      } catch (err) {
        console.error('Error restoring chat session:', err);
        localStorage.removeItem('chat_session_id');
      }
    };

    restoreChatSession();
  }, []);

  // Initialize chat session with better error handling
  const startChat = async () => {
    if (!newMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    setLoading(true);
    setDebugInfo('Starting chat...');
    
    try {
      // Test connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }

      const newSessionId = generateSessionId();
      const customerName = userName.trim() || `Guest User ${newSessionId.slice(-4)}`;

      setDebugInfo('Creating user session...');

      // Check if user_sessions table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('user_sessions')
        .select('count')
        .limit(1);

      if (tableError) {
        throw new Error(`user_sessions table error: ${tableError.message}`);
      }

      // Create user session
      const sessionData = {
        session_id: newSessionId,
        customer_name: customerName,
        customer_email: null,
        customer_phone: userPhone.trim() || null,
        is_anonymous: !userName.trim(),
        channel: 'web-chat',
        status: 'active'
      };

      setDebugInfo('Inserting session data...');
      console.log('Session data:', sessionData);

      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Session creation failed: ${sessionError.message}`);
      }

      setDebugInfo('Session created successfully. Adding first message...');

      // Check if chat_messages table exists
      const { data: messageTableCheck, error: messageTableError } = await supabase
        .from('chat_messages')
        .select('count')
        .limit(1);

      if (messageTableError) {
        throw new Error(`chat_messages table error: ${messageTableError.message}`);
      }

      // Add first user message
      const firstMessage = {
        session_id: newSessionId,
        message_text: newMessage.trim(),
        message_type: 'text',
        sender_type: 'user',
        sender_name: customerName,
        is_read: false,
        metadata: { is_first_message: true }
      };

      console.log('First message data:', firstMessage);

      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert([firstMessage])
        .select()
        .single();

      if (messageError) {
        console.error('Message error:', messageError);
        throw new Error(`Message creation failed: ${messageError.message}`);
      }

      setDebugInfo('Message created. Creating ticket...');

      // Create ticket automatically
      try {
        const ticketInfo = await createTicketFromChat(newSessionId, customerName, newMessage.trim(), userPhone.trim());
        setDebugInfo('Ticket created successfully!');
        setTicketStatus(ticketInfo);
      } catch (ticketError) {
        console.error('Ticket creation error:', ticketError);
        // Don't fail the chat if ticket creation fails
        setDebugInfo(
          `Warning: Ticket creation failed: ${
            ticketError instanceof Error ? ticketError.message : String(ticketError)
          }`
        );
      }

      setSessionId(newSessionId);
      setChatStarted(true);
      
      // Save session_id to localStorage for persistence
      localStorage.setItem('chat_session_id', newSessionId);
      console.log('💾 Saved session_id to localStorage:', newSessionId);
      
      // Load all existing messages for this session (in case there are any)
      try {
        const { data: existingMessages, error: loadError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', newSessionId)
          .order('created_at', { ascending: true });
        
        if (!loadError && existingMessages) {
          setMessages(existingMessages.map(msg => ({
            id: msg.id,
            message_text: msg.message_text,
            sender_type: msg.sender_type,
            sender_name: msg.sender_name,
            created_at: msg.created_at,
            metadata: msg.metadata
          })));
        } else {
          // If loading fails, at least show the first message
          setMessages([{
            id: messageData.id,
            message_text: newMessage,
            sender_type: 'user',
            sender_name: customerName,
            created_at: messageData.created_at
          }]);
        }
      } catch (loadErr) {
        // Fallback to just the first message
        setMessages([{
          id: messageData.id,
          message_text: newMessage,
          sender_type: 'user',
          sender_name: customerName,
          created_at: messageData.created_at
        }]);
      }
      
      setNewMessage('');
      setIsConnected(true);
      setDebugInfo('Chat started successfully!');

      // Add welcome system message
      setTimeout(async () => {
        try {
          const welcomeMessage = {
            session_id: newSessionId,
            message_text: `Hello ${customerName}! Thank you for contacting us. Your support request has been received and a ticket has been created. An agent will be with you shortly.`,
            message_type: 'text',
            sender_type: 'system',
            sender_name: 'Support Bot',
            is_read: false,
            metadata: { is_welcome: true }
          };

          const { data: welcomeData, error: welcomeError } = await supabase
            .from('chat_messages')
            .insert([welcomeMessage])
            .select()
            .single();

          if (!welcomeError && welcomeData) {
            setMessages(prev => [...prev, {
              id: welcomeData.id,
              message_text: welcomeMessage.message_text,
              sender_type: 'system',
              sender_name: 'Support Bot',
              created_at: welcomeData.created_at
            }]);
          }
        } catch (welcomeErr) {
          console.error('Welcome message error:', welcomeErr);
        }
      }, 1000);

    } catch (err) {
      console.error('Error starting chat:', err);
      if (err instanceof Error) {
        setDebugInfo(`Error: ${err.message}`);
        alert(`Failed to start chat: ${err.message}`);
      } else {
        setDebugInfo(`Error: ${String(err)}`);
        alert(`Failed to start chat: ${String(err)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Create ticket from chat with better error handling
  const createTicketFromChat = async (sessionId: string, customerName: string, firstMessage: string, customerPhone: string): Promise<TicketStatus> => {
    try {
      setDebugInfo('Getting next ticket number...');

      // Check if tickets table exists
      const { data: ticketTableCheck, error: ticketTableError } = await supabase
        .from('tickets')
        .select('count')
        .limit(1);

      if (ticketTableError) {
        throw new Error(`tickets table error: ${ticketTableError.message}`);
      }

      // Get next ticket number
      const { data: maxTicket, error: maxTicketError } = await supabase
        .from('tickets')
        .select('id')
        .like('id', 'TKT-%')
        .order('id', { ascending: false })
        .limit(1);

      if (maxTicketError) {
        console.error('Max ticket error:', maxTicketError);
        // Continue with default numbering if this fails
      }

      let nextNumber = 1;
      if (maxTicket && maxTicket.length > 0) {
        const lastNumber = parseInt(maxTicket[0].id.replace('TKT-', ''));
        nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
      }

      const ticketId = `TKT-${nextNumber.toString().padStart(3, '0')}`;
      setDebugInfo(`Generated ticket ID: ${ticketId}`);

      // Check if agents table exists and get available agent
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('current_load', { ascending: true })
        .limit(1);

      if (agentsError) {
        console.error('Agents error:', agentsError);
        // Continue without agent assignment
      }

      const assignedAgent = agents && agents.length > 0 ? agents[0] : null;
      setDebugInfo(`Agent assignment: ${assignedAgent ? assignedAgent.name : 'No agent available'}`);

      // Create ticket
      const newTicket = {
        id: ticketId,
        session_id: sessionId,
        customer_name: customerName,
        customer_phone: customerPhone || 'Not provided',
        customer_email: null,
        subject: `Live Chat: ${firstMessage.substring(0, 50)}${firstMessage.length > 50 ? '...' : ''}`,
        message: firstMessage,
        status: 'open',
        priority: 'medium',
        category: 'support',
        assigned_agent_id: assignedAgent?.id || null,
        channel: 'web-chat',  // Fixed: changed from 'web' to 'web-chat' to match schema
        tags: ['web-chat', 'auto-created']
      };

      console.log('Creating ticket:', newTicket);

      const { data: createdTicket, error: ticketError } = await supabase
        .from('tickets')
        .insert([newTicket])
        .select()
        .single();

      if (ticketError) {
        console.error('Ticket creation error:', ticketError);
        throw new Error(`Ticket creation failed: ${ticketError.message}`);
      }

      // Update agent load if assigned
      if (assignedAgent) {
        try {
          await supabase
            .from('agents')
            .update({ current_load: assignedAgent.current_load + 1 })
            .eq('id', assignedAgent.id);
        } catch (agentUpdateError) {
          console.error('Agent update error:', agentUpdateError);
          // Don't fail ticket creation if agent update fails
        }
      }

      // Add status history
      try {
        await supabase
          .from('status_history')
          .insert([{
            ticket_id: ticketId,
            status: 'open',
            updated_by: 'System',
            note: assignedAgent 
              ? `Created from web chat and assigned to ${assignedAgent.name}` 
              : 'Created from web chat - no agent assigned'
          }]);
      } catch (historyError) {
        console.error('Status history error:', historyError);
        // Don't fail ticket creation if history fails
      }

      return {
        ticket_id: ticketId,
        status: 'open',
        assigned_agent: assignedAgent?.name
      };

    } catch (err) {
      console.error('Error creating ticket:', err);
      throw err;
    }
  };

  // Send typing indicator
  const sendTypingIndicator = async (isTyping: boolean) => {
    if (!sessionId || !ticketStatus) return;

    try {
      await supabase
        .from('typing_indicators')
        .upsert({
          session_id: sessionId,
          ticket_id: ticketStatus.ticket_id,
          user_type: 'user',
          user_name: userName || 'User',
          is_typing: isTyping,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  };

  // Handle typing
  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      sendTypingIndicator(false);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTypingIndicator(false);
      }, 3000);
    }
  };

  // Handle image upload and send as chat message
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !sessionId || chatClosed) return;
    const file = event.target.files[0];
    if (!file) return;

    // Show temp message
    const tempId = `img_temp_${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      message_text: 'Uploading image...',
      sender_type: 'user',
      sender_name: userName || 'You',
      created_at: new Date().toISOString(),
      metadata: { uploading: true }
    }]);

    try {
      // Upload to Supabase Storage (bucket: 'chat-images')
      const fileExt = file.name.split('.').pop();
      const filePath = `chat/${sessionId}/${Date.now()}.${fileExt}`;
      let { error: uploadError } = await supabase.storage.from('chat-images').upload(filePath, file);
      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from('chat-images').getPublicUrl(filePath);
      const imageUrl = publicUrlData?.publicUrl;
      if (!imageUrl) throw new Error('Failed to get image URL');

      // Save image message to database
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          session_id: sessionId,
          ticket_id: ticketStatus?.ticket_id || null,
          message_text: imageUrl,
          message_type: 'image',
          sender_type: 'user',
          sender_name: userName || 'User',
          is_read: false,
          metadata: { file_name: file.name, file_type: file.type }
        }])
        .select()
        .single();

      if (error) throw error;

      // Replace temp message with real image message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setMessages(prev => [...prev, {
        id: data.id,
        message_text: imageUrl,
        sender_type: 'user',
        sender_name: userName || 'You',
        created_at: data.created_at,
        metadata: { file_name: file.name, file_type: file.type }
      }]);
    } catch (err) {
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      alert('Failed to upload image.');
      // Print the error object and its stringified version for debugging
      console.error('Image upload error:', err, JSON.stringify(err));
    }
  };

  // Send message with better error handling
  const sendMessage = async () => {
    if (!newMessage.trim() || !sessionId || chatClosed) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsTyping(false);
    sendTypingIndicator(false);
    
    // Add message to UI immediately
    const tempMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      message_text: messageText,
      sender_type: 'user',
      sender_name: userName || 'You',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      // Save to database
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          session_id: sessionId,
          ticket_id: ticketStatus?.ticket_id || null,
          message_text: messageText,
          message_type: 'text',
          sender_type: 'user',
          sender_name: userName || 'User',
          is_read: false,
          metadata: {}
        }])
        .select()
        .single();

      if (error) {
        console.error('Send message error:', error);
        // Remove the temp message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        throw error;
      }

      // Update the temp message with real ID, or if a message with the real ID already exists, remove the temp message
      setMessages(prev => {
        // If a message with the real ID already exists, remove the temp message
        if (prev.some(msg => msg.id === data.id)) {
          return prev.filter(msg => msg.id !== tempMessage.id);
        }
        // Otherwise, replace temp with real
        return prev.map(msg =>
          msg.id === tempMessage.id
            ? { ...msg, id: data.id }
            : msg
        );
      });

      // Update session activity
      await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('session_id', sessionId);

    } catch (err) {
      console.error('Error sending message:', err);
      if (err instanceof Error) {
        alert(`Failed to send message: ${err.message}`);
      } else {
        alert(`Failed to send message: ${String(err)}`);
      }
    }
  };

  // Function to refresh ticket status from database (defined early so it can be used in message handler)
  const refreshTicketStatus = useCallback(async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, status, assigned_agent_id, assigned_agent:agents!tickets_assigned_agent_fkey(name)')
        .eq('id', ticketId)
        .single();

      if (!error && data) {
        console.log('🔄 Refreshed ticket status from database:', data.status);
        setTicketStatus(prev => prev ? {
          ...prev,
          status: data.status,
          assigned_agent: data.assigned_agent?.name || prev.assigned_agent
        } : null);

        // Check if ticket is closed
        if (data.status === 'closed') {
          console.log('🔒 Ticket closed, clearing session');
          setChatClosed(true);
          setIsConnected(false);
          localStorage.removeItem('chat_session_id');
          
          // Only add closure message if not already present
          setMessages(prev => {
            if (prev.some(m => m.sender_type === 'system' && m.message_text.includes('This chat has been closed'))) {
              return prev;
            }
            const closureMessage: ChatMessage = {
              id: `closure_${Date.now()}`,
              message_text: 'This chat has been closed. Thank you for contacting support!',
              sender_type: 'system',
              sender_name: 'Support Bot',
              created_at: new Date().toISOString()
            };
            return [...prev, closureMessage];
          });
        }
        return data.status;
      }
    } catch (err) {
      console.error('Error refreshing ticket status:', err);
    }
    return null;
  }, []);

  // Real-time message subscription - Listen to ALL messages for this session
  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up real-time subscription for session:', sessionId);

    const messageChannel = supabase
      .channel(`chat_messages_${sessionId}_${Date.now()}`) // Unique channel name to avoid conflicts
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        async (payload) => {
          const newMessage = payload.new;
          console.log('📨 New message received via real-time:', {
            id: newMessage.id,
            sender_type: newMessage.sender_type,
            sender_name: newMessage.sender_name,
            message_preview: newMessage.message_text?.substring(0, 50),
            session_id: newMessage.session_id,
            expected_session_id: sessionId,
            match: newMessage.session_id === sessionId
          });
          
          // Verify session_id matches (safety check)
          if (newMessage.session_id !== sessionId) {
            console.warn('⚠️ Session ID mismatch, ignoring message:', {
              received: newMessage.session_id,
              expected: sessionId
            });
            return;
          }
          
          // Add ALL messages for this session (both user and agent/system)
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) {
              console.log('⚠️ Message already exists, skipping:', newMessage.id);
              return prev;
            }
            
            console.log('✅ Adding new message to chat UI:', {
              id: newMessage.id,
              sender_type: newMessage.sender_type,
              sender_name: newMessage.sender_name
            });
            
            return [...prev, {
              id: newMessage.id,
              message_text: newMessage.message_text,
              sender_type: newMessage.sender_type,
              sender_name: newMessage.sender_name,
              created_at: newMessage.created_at,
              metadata: newMessage.metadata
            }];
          });

          // Update ticket status if metadata contains it or if it's a status update message
          if (newMessage.metadata?.ticket_status || newMessage.metadata?.is_status_update) {
            const newStatus = newMessage.metadata?.ticket_status;
            console.log('🔄 Updating ticket status from message:', newStatus);
            
            // Refresh ticket status from database to ensure sync
            if (ticketStatus?.ticket_id) {
              refreshTicketStatus(ticketStatus.ticket_id);
            } else if (newMessage.ticket_id) {
              // If we have ticket_id in message but not in state, refresh it
              refreshTicketStatus(newMessage.ticket_id);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to chat messages for session:', sessionId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel subscription error for session:', sessionId);
        } else if (status === 'TIMED_OUT') {
          console.warn('⏱️ Subscription timed out, will retry...');
        }
      });

    // Fallback: Periodically refresh messages (every 5 seconds) in case real-time fails
    const refreshInterval = setInterval(async () => {
      if (!sessionId) {
        clearInterval(refreshInterval);
        return;
      }
      
      try {
        const { data: latestMessages, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });
        
        if (!error && latestMessages) {
          setMessages(prev => {
            // Only update if we have new messages
            if (latestMessages.length > prev.length) {
              console.log('🔄 Fallback refresh: Found', latestMessages.length - prev.length, 'new messages');
              return latestMessages.map(msg => ({
                id: msg.id,
                message_text: msg.message_text,
                sender_type: msg.sender_type,
                sender_name: msg.sender_name,
                created_at: msg.created_at,
                metadata: msg.metadata
              }));
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Error in fallback refresh:', err);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      console.log('Cleaning up subscription and interval for session:', sessionId);
      clearInterval(refreshInterval);
      supabase.removeChannel(messageChannel);
    };
  }, [sessionId, refreshTicketStatus, ticketStatus]);

  // Real-time ticket status subscription
  useEffect(() => {
    if (!ticketStatus?.ticket_id) return;

    console.log('Setting up ticket status subscription for ticket:', ticketStatus.ticket_id);

    const ticketChannel = supabase
      .channel(`ticket_updates_${ticketStatus.ticket_id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${ticketStatus.ticket_id}`
        },
        (payload) => {
          const updatedTicket = payload.new;
          console.log('📋 Ticket status updated via real-time:', {
            ticket_id: updatedTicket.id,
            status: updatedTicket.status
          });
          
          setTicketStatus(prev => prev ? {
            ...prev,
            status: updatedTicket.status,
            assigned_agent: updatedTicket.assigned_agent_name || prev.assigned_agent
          } : null);

          // Check if ticket is closed
          if (updatedTicket.status === 'closed') {
            console.log('🔒 Ticket closed, clearing session');
            setChatClosed(true);
            setIsConnected(false);
            localStorage.removeItem('chat_session_id');
            
            // Only add closure message if not already present
            setMessages(prev => {
              if (prev.some(m => m.sender_type === 'system' && m.message_text.includes('This chat has been closed'))) {
                return prev;
              }
              const closureMessage: ChatMessage = {
                id: `closure_${Date.now()}`,
                message_text: 'This chat has been closed. Thank you for contacting support!',
                sender_type: 'system',
                sender_name: 'Support Bot',
                created_at: new Date().toISOString()
              };
              return [...prev, closureMessage];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Ticket subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to ticket updates');
        }
      });

    // Polling fallback: Check status every 3 seconds in case real-time fails
    const pollInterval = setInterval(() => {
      if (ticketStatus?.ticket_id) {
        refreshTicketStatus(ticketStatus.ticket_id);
      }
    }, 3000);

    return () => {
      supabase.removeChannel(ticketChannel);
      clearInterval(pollInterval);
    };
  }, [ticketStatus?.ticket_id, refreshTicketStatus]);

  // Real-time typing indicators subscription
  useEffect(() => {
    if (!sessionId) return;

    const typingChannel = supabase
      .channel('typing_indicators')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators'
        },
        (payload) => {
          const typingData = (payload.new || payload.old) as { session_id?: string; user_type?: string; is_typing?: boolean; user_name?: string };
          
          if (typingData?.session_id === sessionId && typingData?.user_type === 'agent') {
            if (payload.eventType === 'DELETE' || !typingData.is_typing) {
              setAgentTyping(null);
            } else {
              setAgentTyping(typingData.user_name ?? null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [sessionId]);

  // Cleanup typing indicator on unmount
  useEffect(() => {
    return () => {
      if (sessionId && isTyping) {
        sendTypingIndicator(false);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [sessionId, isTyping]);

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatStarted && !chatClosed) {
        sendMessage();
      } else if (!chatStarted) {
        startChat();
      }
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'in-progress': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <X className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className={`${chatClosed ? 'bg-red-600' : 'bg-blue-600'} text-white p-4 rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-6 h-6" />
              <div>
                <h1 className="text-lg font-semibold">
                  {chatClosed ? 'Chat Closed' : 'Customer Support Chat'}
                </h1>
                <div className="flex items-center space-x-2 text-sm opacity-90">
                  {isConnected && !chatClosed && (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Connected</span>
                    </>
                  )}
                  {chatClosed && (
                    <>
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span>Closed</span>
                    </>
                  )}
                  {ticketStatus && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(ticketStatus.status)}
                        <span>{ticketStatus.ticket_id}</span>
                        <span>-</span>
                        <span className="capitalize">{ticketStatus.status}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <div className="p-2 bg-yellow-50 border-b text-xs text-yellow-800">
            <strong>Debug:</strong> {debugInfo}
          </div>
        )}

        {!chatStarted ? (
          /* Start Chat Form */
          <div className="flex-1 p-6 flex items-center justify-center">
            <div className="w-full max-w-md space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Start a Support Chat</h2>
                <p className="text-gray-600 text-sm">
                  Get instant help from our support team. Just type your message below to begin.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="Your name"
                  />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (Optional)
                </label>
                <input
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                placeholder="e.g. +1234567890"
                />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    How can we help you? *
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    rows={3}
                    placeholder="Describe your issue or question..."
                    required
                  />
                </div>

                <button
                  onClick={startChat}
                  disabled={!newMessage.trim() || loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Starting Chat...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      <span>Start Chat</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center text-xs text-gray-500 mt-4">
                By starting a chat, a support ticket will be automatically created for you.
              </div>
            </div>
          </div>
        ) : (
          /* Chat Interface */
          <>
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div className="space-y-4">
                {/* Deduplicate messages by id before rendering to avoid duplicate key errors */}
                {Array.from(new Map(messages.map(m => [m.id, m])).values()).map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.sender_type === 'system'
                        ? 'bg-gray-200 text-gray-800'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}>
                      {message.sender_type !== 'user' && (
                        <div className="flex items-center space-x-1 mb-1">
                          {message.sender_type === 'system' ? (
                            <Bot className="w-3 h-3 text-gray-500" />
                          ) : (
                            <UserCheck className="w-3 h-3 text-blue-500" />
                          )}
                          <span className="text-xs font-medium">
                            {message.sender_name}
                          </span>
                        </div>
                      )}
                      {/* Render image if message_type is image or message_text is an image URL */}
                      {message.message_text === 'image' || (typeof message.message_text === 'string' && message.message_text.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                        <img
                          src={message.message_text}
                          alt="chat-img"
                          className="max-w-[200px] max-h-[200px] rounded mb-1 border"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <p className="text-sm">{message.message_text}</p>
                      )}
                      <div className={`text-xs mt-1 ${
                        message.sender_type === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Agent typing indicator */}
                {agentTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-lg max-w-xs">
                      <div className="flex items-center space-x-1 mb-1">
                        <UserCheck className="w-3 h-3 text-blue-500" />
                        <span className="text-xs font-medium">{agentTyping}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className={`p-4 border-t ${chatClosed ? 'bg-gray-100' : 'bg-white'}`}>
              <div className="flex items-center space-x-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={chatClosed ? "Chat is closed" : "Type your message..."}
                  className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black resize-none ${
                    chatClosed ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  rows={1}
                  style={{ minHeight: '40px', maxHeight: '100px' }}
                  disabled={chatClosed}
                />
                {/* Image upload button */}
                <label className={`cursor-pointer ${chatClosed ? 'opacity-50 pointer-events-none' : ''}`}
                  title="Upload screenshot/image">
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                    disabled={chatClosed}
                  />
                  <span className="inline-block px-2 py-2 bg-gray-200 rounded hover:bg-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 3.13a4 4 0 010 7.75M8 7a4 4 0 100-8 4 4 0 000 8zm0 0v8m0 0l-4-4m4 4l4-4" /></svg>
                  </span>
                </label>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || chatClosed}
                  className={`px-4 py-2 rounded-md ${
                    chatClosed 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              
              {ticketStatus && (
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span>Ticket: {ticketStatus.ticket_id}</span>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(ticketStatus.status)}
                      <span className="capitalize">{ticketStatus.status}</span>
                    </div>
                  </div>
                  {ticketStatus.assigned_agent && (
                    <span>Agent: {ticketStatus.assigned_agent}</span>
                  )}
                </div>
              )}

              {/* Chat closed notice */}
              {chatClosed && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center space-x-2 text-red-800 text-sm">
                    <X className="w-4 h-4" />
                    <span>This chat has been closed by support. No new messages can be sent.</span>
                  </div>
                </div>
              )}

              {/* Connection status */}
              {!isConnected && !chatClosed && chatStarted && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center space-x-2 text-yellow-800 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Connection lost. Trying to reconnect...</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}