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
  const [userEmail, setUserEmail] = useState('');
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

  // Test on component mount
  useEffect(() => {
    testConnection();
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
        customer_email: userEmail.trim() || null,
        customer_phone: null,
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
        const ticketInfo = await createTicketFromChat(newSessionId, customerName, newMessage.trim());
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
      setMessages([{
        id: messageData.id,
        message_text: newMessage,
        sender_type: 'user',
        sender_name: customerName,
        created_at: messageData.created_at
      }]);
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
  const createTicketFromChat = async (sessionId: string, customerName: string, firstMessage: string): Promise<TicketStatus> => {
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
        customer_phone: 'Not provided',
        customer_email: userEmail.trim() || null,
        subject: `Live Chat: ${firstMessage.substring(0, 50)}${firstMessage.length > 50 ? '...' : ''}`,
        message: firstMessage,
        status: 'open',
        priority: 'medium',
        category: 'support',
        assigned_agent_id: assignedAgent?.id || null,
        channel: 'web',
        tags: ['web', 'auto-created']
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

      // Update the temp message with real ID
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...msg, id: data.id }
          : msg
      ));

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

  // Real-time message subscription
  useEffect(() => {
    if (!sessionId) return;

    const messageChannel = supabase
      .channel('chat_messages_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMessage = payload.new;
          
          // Filter here in JS instead of the Supabase filter param
          if (newMessage.session_id === sessionId && newMessage.sender_type !== 'user') {
            setMessages(prev => [...prev, {
              id: newMessage.id,
              message_text: newMessage.message_text,
              sender_type: newMessage.sender_type,
              sender_name: newMessage.sender_name,
              created_at: newMessage.created_at,
              metadata: newMessage.metadata
            }]);

            if (newMessage.metadata?.ticket_status) {
              setTicketStatus(prev => prev ? {
                ...prev,
                status: newMessage.metadata.ticket_status
              } : null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [sessionId]);

  // Real-time ticket status subscription
  useEffect(() => {
    if (!ticketStatus?.ticket_id) return;

    const ticketChannel = supabase
      .channel('ticket_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets'
        },
        (payload) => {
          const updatedTicket = payload.new;
          
          if (updatedTicket.id === ticketStatus.ticket_id) {
            setTicketStatus(prev => prev ? {
              ...prev,
              status: updatedTicket.status,
              assigned_agent: updatedTicket.assigned_agent_name || prev.assigned_agent
            } : null);

            // Check if ticket is closed
            if (updatedTicket.status === 'closed') {
              setChatClosed(true);
              setIsConnected(false);
              
              // Add system message about chat closure
              const closureMessage: ChatMessage = {
                id: `closure_${Date.now()}`,
                message_text: 'This chat has been closed. Thank you for contacting support!',
                sender_type: 'system',
                sender_name: 'Support Bot',
                created_at: new Date().toISOString()
              };
              
              setMessages(prev => [...prev, closureMessage]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketChannel);
    };
  }, [ticketStatus?.ticket_id]);

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your@email.com"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                {messages.map((message) => (
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
                      <p className="text-sm">{message.message_text}</p>
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
                  className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                    chatClosed ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  rows={1}
                  style={{ minHeight: '40px', maxHeight: '100px' }}
                  disabled={chatClosed}
                />
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