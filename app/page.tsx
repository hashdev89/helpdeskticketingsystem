"use client"

import React, { useState, useEffect, useCallback } from 'react';
import Notification from './components/Notification';
import AddAgentModal from './components/AddAgentModal';
import EditAgentModalFull from './components/EditAgentModalFull';
import { useNotification } from '../hooks/useNotification';
import { useWhatsApp } from '../hooks/useWhatsApp';

import { 
  MessageSquare, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  Phone,
  Clock,
  Tag,
  User,
  CheckCircle,
  AlertCircle,
  Circle,
  Send,
  MessageCircle,
  Smartphone,
  Globe,
  Check,
  CheckCheck,
  Mail,
  Edit,
  UserPlus,
  Shield,
  Star,
  Activity,
  X,
  Save,
  FileText,
  Folder,
  StickyNote,
  CheckSquare,
  Square
} from 'lucide-react';

// Import Supabase functions
import { 
  agentsService, 
  whatsappNumbersService, 
  ticketsService, 
  statusHistoryService, 
  whatsappMessagesService,
  chatMessagesService,
  chatNotesService,
  subscriptions 
} from '../lib/supabase.js';
import { supabase } from '../lib/supabase';
import { whatsappAPI } from '../lib/whatsapp-api';

// Type for ticketsService including delete
 type TicketsServiceType = {
  getAll: () => Promise<any[]>;
  getById: (id: any) => Promise<any>;
  getByCustomerPhone: (customerPhone: any) => Promise<any[]>;
  create: (ticket: any) => Promise<any>;
  update: (id: any, updates: any, sendWhatsAppUpdate?: boolean) => Promise<any>;
  getNextTicketNumber: () => Promise<string>;
  reassign: (ticketId: any, newAgentId: any, sendWhatsAppUpdate?: boolean) => Promise<any>;
  sendStatusUpdate: (ticketId: any, newStatus: any, note?: string, agentName?: string) => Promise<any>;
  sendWhatsAppReply: (ticketId: any, message: any, agentName?: string) => Promise<any>;
  createFromWhatsApp: (phoneNumber: any, customerName: any, message: any, whatsappNumber: any) => Promise<any>;
  delete: (id: any) => Promise<any>;
};

const typedTicketsService = ticketsService as unknown as TicketsServiceType;

import { LogOut } from 'lucide-react';
// Logout handler - Disabled (authentication bypassed)
function LogoutButton() {
  const handleLogout = async () => {
    // Authentication bypassed - logout disabled
    // await supabase.auth.signOut();
    // window.location.href = '/login';
    console.log('Logout disabled - authentication bypassed');
  };
  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center px-3 py-2 text-left text-xs font-medium rounded-lg text-gray-400 cursor-not-allowed mt-4 border-t border-gray-200"
      title="Logout disabled (auth bypassed)"
      disabled
    >
      <LogOut className="w-4 h-4 mr-2 text-red-500" />
      <span className="font-semibold text-red-600">Logout</span>
    </button>
  );
}

// Type definitions
interface WhatsAppNumber {
  id: string;
  number: string;
  display_name: string;
  is_active: boolean;
  assigned_agent_id: string;
  categories: string[];
  business_hours: string;
  auto_reply_enabled: boolean;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  whatsapp_numbers: string[];
  is_active: boolean;
  expertise: string[];
  current_load: number;
  max_tickets: number;
}

interface StatusHistoryItem {
  status: string;
  timestamp: string;
  updated_by: string;
  note: string;
}

interface Ticket {
  session_id: string;
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category: string;
  assigned_to: string;
  assigned_agent_id?: string | null;
  created_at: string;
  updated_at: string;
  tags: string[];
  channel: string;
  whatsapp_number?: string;
  statusHistory: StatusHistoryItem[];
}

interface WhatsAppMessage {
  message_type: string;
  created_at: string;
  to_number: string;
  from_number: string;
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: string;
  type: string;
  status?: string;
  isStatusUpdate?: boolean;
}

// Define proper types for database operations
interface DatabaseError {
  message: string;
}

interface StatusHistoryData {
  status: string;
  created_at: string;
  updated_by: string;
  note: string;
}

interface TicketData {
  session_id: string;
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category: string;
  assigned_to?: string;
  assigned_agent_id?: string | null;
  created_at: string;
  updated_at: string;
  tags: string[];
  channel: string;
  whatsapp_number?: string | null;
  assigned_agent?: { name: string } | null;
  status_history?: StatusHistoryData[];
}

interface MessagePayload {
  eventType: string;
  new: {
    id: string;
    from_number: string;
    to_number: string;
    body: string;
    created_at: string;
    message_type: string;
    status: string;
    is_status_update: boolean;
  };
}

import { useRouter } from 'next/navigation';

export default function WhatsAppHelpDesk() {
  const router = useRouter();
  // Authentication check disabled - bypassing login for now
  // React.useEffect(() => {
  //   (async () => {
  //     const { data: { user } } = await supabase.auth.getUser();
  //     if (!user) {
  //       window.location.href = '/login';
  //       return;
  //     }
  //     // Check if user exists in agents table
  //     const { data: agent, error: agentError } = await supabase
  //       .from('agents')
  //       .select('*')
  //       .eq('email', user.email)
  //       .single();
  //     if (agentError || !agent) {
  //       await supabase.auth.signOut();
  //       window.location.href = '/login';
  //     }
  //   })();
  // }, []);
  // Notification system
  const {
    notification,
    
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  } = useNotification();

  // For demo: replace with real auth logic
  const [currentUserRole, setCurrentUserRole] = useState<string>('admin'); // 'admin', 'supervisor', 'agent'

  // Client-side only flag to prevent hydration issues
  const [isClient, setIsClient] = useState(false);
  
  // Database state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [whatsappNumbers, setWhatsappNumbers] = useState<WhatsAppNumber[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>([]);
  const [webChatMessages, setWebChatMessages] = useState<any[]>([]); // For web chat messages
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load web chat messages for a ticket
  const loadWebChatMessages = useCallback(async (ticket: { channel: string; id: any; }) => {
    if (!ticket || ticket.channel !== 'web-chat') {
      setWebChatMessages([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });
      if (!error) {
        setWebChatMessages(data || []);
      }
    } catch (err) {
      setWebChatMessages([]);
    }
  }, []);

  // UI state management
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [replyMessage, setReplyMessage] = useState('');
  const [currentView, setCurrentView] = useState('tickets');
  const [showIncomingMessage, setShowIncomingMessage] = useState(false);
  const [showWhatsAppSetup, setShowWhatsAppSetup] = useState(false);
  const [showManualTicketForm, setShowManualTicketForm] = useState(false);
  // Add Agent modal state
  const [showAddAgentForm, setShowAddAgentForm] = useState(false);
  const [addAgentForm, setAddAgentForm] = useState<{
  name: string;
  email: string;
  password: string;
  role: string;
  expertise: string;
  whatsappNumbers: string;
  maxTickets: number;
  isActive: boolean;
  }>({
  name: '',
  email: '',
  password: '',
  role: 'agent',
  expertise: '',
  whatsappNumbers: '',
  maxTickets: 10,
  isActive: true
  });
  const [addingAgent, setAddingAgent] = useState(false);
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  
  // Simulation state
  const [simulatedMessage, setSimulatedMessage] = useState('');
  const [simulatedPhone, setSimulatedPhone] = useState('+94771234567');
  const [simulatedName, setSimulatedName] = useState('Customer Name');
  const [simulatedWhatsAppNumber, setSimulatedWhatsAppNumber] = useState('');

  // Manual ticket form state
  const [manualTicketForm, setManualTicketForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    subject: '',
    message: '',
    priority: 'medium',
    category: 'support',
    channel: 'email',
    assignedAgentId: '',
    whatsappNumber: '',
    tags: ''
  });
  // Track ticket creation loading state
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Bulk messaging state
  const [showBulkMessaging, setShowBulkMessaging] = useState(false);
  const [selectedTicketsForBulk, setSelectedTicketsForBulk] = useState<Set<string>>(new Set());
  const [bulkMessage, setBulkMessage] = useState('');
  const [sendingBulkMessages, setSendingBulkMessages] = useState(false);

  // Chat grouping state
  const [groupBy, setGroupBy] = useState<'none' | 'category' | 'agent' | 'status' | 'channel'>('none');

  // Chat notes state
  const [chatNotes, setChatNotes] = useState<any[]>([]);
  const [showNotesSection, setShowNotesSection] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Delete agent
  const handleDeleteAgent = async (agentId: string) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return;
    try {
      await agentsService.delete(agentId);
      showSuccess('Agent Deleted', 'The agent was deleted successfully.');
      await loadAgents();
    } catch (err) {
      const error = err as DatabaseError;
      showError('Delete Agent Failed', error.message);
    }
  };

  // Delete ticket
  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await typedTicketsService.delete(ticketId);
      showSuccess('Ticket Deleted', 'The ticket was deleted successfully.');
      await loadTickets();
    } catch (err) {
      const error = err as DatabaseError;
      showError('Delete Ticket Failed', error.message);
    }
  };

  // Database functions with proper error handling
  const loadAgents = useCallback(async () => {
    try {
      const data = await agentsService.getAll();
      setAgents(data);
    } catch (err) {
      const error = err as DatabaseError;
      console.error('Error loading agents:', error);
      throw error;
    }
  }, []);

  const loadWhatsappNumbers = useCallback(async () => {
    try {
      const data = await whatsappNumbersService.getAll();
      setWhatsappNumbers(data);
    } catch (err) {
      const error = err as DatabaseError;
      console.error('Error loading WhatsApp numbers:', error);
      throw error;
    }
  }, []);

  const loadTickets = useCallback(async () => {
    try {
      const data: TicketData[] = await typedTicketsService.getAll();
      // Transform the data to match the component's expected format
      const transformedTickets: Ticket[] = data.map(ticket => ({
        ...ticket,
        session_id: ticket.session_id || ticket.id, // Ensure session_id is present; fallback to id if missing
        customer_email: ticket.customer_email || undefined,
        whatsapp_number: ticket.whatsapp_number || undefined,
        assigned_to: ticket.assigned_agent?.name || 'Unassigned',
        assigned_agent_id: ticket.assigned_agent_id || null,
        statusHistory: ticket.status_history?.map((sh: StatusHistoryData) => ({
          status: sh.status,
          timestamp: sh.created_at,
          updated_by: sh.updated_by,
          note: sh.note
        })) || []
      }));
      setTickets(transformedTickets);
    } catch (err) {
      const error = err as DatabaseError;
      console.error('Error loading tickets:', error);
      throw error;
    }
  }, []);

  const loadMessages = useCallback(async () => {
    try {
      // Load all messages
      const allTickets: TicketData[] = await typedTicketsService.getAll();
      let allMessages: WhatsAppMessage[] = [];
      
      for (const ticket of allTickets) {
        if (ticket.channel === 'whatsapp') {
          const messages = await whatsappMessagesService.getByTicketId(ticket.id);
          allMessages = [...allMessages, ...messages];
        }
      }
      
      // Transform to match component format
      const transformedMessages: WhatsAppMessage[] = allMessages.map(msg => ({
        id: msg.id,
        message_type: msg.message_type,
        created_at: msg.created_at,
        to_number: msg.to_number,
        from_number: msg.from_number,
        from: msg.from_number,
        to: msg.to_number,
        body: msg.body,
        timestamp: msg.created_at,
        type: msg.message_type,
        status: msg.status,
        isStatusUpdate: msg.isStatusUpdate
      }));
      
      setWhatsappMessages(transformedMessages);
    } catch (err) {
      const error = err as DatabaseError;
      console.error('Error loading messages:', error);
      throw error;
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAgents(),
        loadWhatsappNumbers(),
        loadTickets(),
        loadMessages()
      ]);
    } catch (err) {
      const error = err as DatabaseError;
      setError(error.message);
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadAgents, loadWhatsappNumbers, loadTickets, loadMessages]);

  useEffect(() => {
    setIsClient(true);
    loadInitialData();
  }, [loadInitialData]);

  // Set up real-time subscriptions
  useEffect(() => {
    const ticketSubscription = subscriptions.subscribeToTickets(() => {
      loadTickets();
    });

    const messageSubscription = subscriptions.subscribeToMessages((payload: MessagePayload) => {
      if (payload.eventType === 'INSERT') {
        const newMessage: WhatsAppMessage = {
          id: payload.new.id,
          from: payload.new.from_number,
          to: payload.new.to_number,
          body: payload.new.body,
          timestamp: payload.new.created_at,
          type: payload.new.message_type,
          status: payload.new.status,
          isStatusUpdate: payload.new.is_status_update,
          message_type: 'incoming',
          created_at: new Date().toISOString(),
          to_number: simulatedWhatsAppNumber,
          from_number: simulatedPhone
        };
        setWhatsappMessages(prev => [...prev, newMessage]);
      }
    });

    const agentSubscription = subscriptions.subscribeToAgents(() => {
      loadAgents();
    });

    return () => {
      ticketSubscription.unsubscribe();
      messageSubscription.unsubscribe();
      agentSubscription.unsubscribe();
    };
  }, [loadTickets, loadAgents]);

  // Set default WhatsApp number when numbers are loaded
  useEffect(() => {
    if (whatsappNumbers.length > 0 && !simulatedWhatsAppNumber) {
      setSimulatedWhatsAppNumber(whatsappNumbers[0].number);
    }
  }, [whatsappNumbers, simulatedWhatsAppNumber]);

  // Update selected ticket when tickets change
  useEffect(() => {
    if (selectedTicket && tickets.length > 0) {
      const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
        // Load web chat messages if web chat ticket
        if (updatedTicket.channel === 'web-chat') {
          loadWebChatMessages(updatedTicket);
        } else {
          setWebChatMessages([]);
        }
      }
    }
  }, [tickets, selectedTicket, loadWebChatMessages]);

  // Real-time subscription for web chat messages - Fixed for 'web-chat' channel
  useEffect(() => {
    if (!selectedTicket || selectedTicket.channel !== 'web-chat') return;
    
    console.log('Setting up real-time subscription for ticket:', selectedTicket.id);
    
    const channel = supabase
      .channel(`web_chat_${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`
        },
        (payload) => {
          const newMessage = payload.new;
          console.log('New chat message received:', newMessage);
          
          // Add message if it doesn't already exist
          setWebChatMessages((prev) => {
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev; // Already exists
            }
            return [...prev, newMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `ticket_id=eq.${selectedTicket.id}`
        },
        (payload) => {
          // Update existing message if it was modified
          setWebChatMessages((prev) => 
            prev.map(msg => msg.id === payload.new.id ? payload.new : msg)
          );
        }
      )
      .subscribe((status) => {
        console.log('Agent chat subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Agent successfully subscribed to chat messages');
        }
      });
    
    // Also load messages immediately and poll every 2 seconds as backup
    loadWebChatMessages(selectedTicket);
    const interval = setInterval(() => {
      loadWebChatMessages(selectedTicket);
    }, 2000);
    
    return () => {
      console.log('Cleaning up agent chat subscription');
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [selectedTicket, loadWebChatMessages]);

  // Poll ticket list every 1 second for reliability
  useEffect(() => {
    const ticketInterval = setInterval(() => {
      loadTickets();
    }, 1000);
    return () => clearInterval(ticketInterval);
  }, [loadTickets]);

  // Helper function to get agent for assignment
  const getAgentForAssignment = (category: string, whatsappNumber?: string): Agent | undefined => {
    let eligibleAgents = agents.filter(agent => 
      agent.is_active && agent.current_load < agent.max_tickets
    );

    if (whatsappNumber) {
      const waAgents = eligibleAgents.filter(agent => 
        agent.whatsapp_numbers.includes(whatsappNumber)
      );
      if (waAgents.length > 0) {
        eligibleAgents = waAgents;
      }
    }

    if (eligibleAgents.length === 0) {
      return agents.find(agent => agent.is_active && agent.current_load < agent.max_tickets);
    }

    eligibleAgents.sort((a, b) => a.current_load - b.current_load);
    
    const expertAgents = eligibleAgents.filter(agent => 
      agent.expertise.includes(category)
    );

    return expertAgents.length > 0 ? expertAgents[0] : eligibleAgents[0];
  };

  // Create manual ticket
  const createManualTicket = async () => {
    if (!manualTicketForm.customerName.trim() || !manualTicketForm.subject.trim() || !manualTicketForm.message.trim()) {
      showWarning('Missing Fields', 'Please fill in all required fields (Customer Name, Subject, Message)');
      return;
    }
    setCreatingTicket(true);
    try {
      const ticketId = await typedTicketsService.getNextTicketNumber();
      
      const assignedAgent = manualTicketForm.assignedAgentId 
        ? agents.find(a => a.id === manualTicketForm.assignedAgentId)
        : getAgentForAssignment(manualTicketForm.category, manualTicketForm.whatsappNumber || undefined);

      const newTicket = {
        id: ticketId,
        customer_name: manualTicketForm.customerName,
        customer_phone: manualTicketForm.customerPhone || 'Not provided',
        customer_email: manualTicketForm.customerEmail || null,
        subject: manualTicketForm.subject,
        message: manualTicketForm.message,
        status: 'open',
        priority: manualTicketForm.priority,
        category: manualTicketForm.category,
        assigned_to: assignedAgent?.name || 'Unassigned',
        assigned_agent_id: assignedAgent?.id || null,
        channel: manualTicketForm.channel,
        whatsapp_number: manualTicketForm.whatsappNumber || null,
        tags: manualTicketForm.tags ? manualTicketForm.tags.split(',').map(tag => tag.trim()) : ['manual-entry']
      };

      // Create ticket in database
      const createdTicket = await typedTicketsService.create(newTicket);

      // Add status history
      await statusHistoryService.add(
        ticketId,
        'open',
        'Manual Entry',
        assignedAgent ? `Manually created and assigned to ${assignedAgent.name}` : 'Manually created - no agent assigned'
      );

      // Update agent load if assigned
      if (assignedAgent) {
        await agentsService.update(assignedAgent.id, {
          current_load: assignedAgent.current_load + 1
        });
      }

      // Send WhatsApp notification if applicable
      if (manualTicketForm.channel === 'whatsapp' && manualTicketForm.customerPhone && manualTicketForm.whatsappNumber) {
        const notificationMessage = {
          id: `manual_notification_${Date.now()}`,
          ticket_id: ticketId,
          from_number: manualTicketForm.whatsappNumber,
          to_number: manualTicketForm.customerPhone,
          body: `🎫 Hello ${manualTicketForm.customerName}! A support ticket ${ticketId} has been created for you${assignedAgent ? ` and assigned to ${assignedAgent.name}` : ''}. We'll be in touch soon regarding: ${manualTicketForm.subject}`,
          message_type: 'outgoing',
          status: 'sent',
          is_status_update: true
        };

        await whatsappMessagesService.add(notificationMessage);
      }

      // Refresh data
      await loadTickets();
      await loadAgents();
      await loadMessages();

      // Set as selected ticket
      const transformedTicket: Ticket = {
        ...createdTicket,
        assigned_to: assignedAgent?.name || 'Unassigned',
        statusHistory: [{
          status: 'open',
          timestamp: new Date().toISOString(),
          updated_by: 'Manual Entry',
          note: assignedAgent ? `Manually created and assigned to ${assignedAgent.name}` : 'Manually created - no agent assigned'
        }]
      };
      setSelectedTicket(transformedTicket);
      setShowManualTicketForm(false);

      // Show success notification
      showSuccess('Ticket Created', 'The ticket was added successfully.');

      // Reset form
      setManualTicketForm({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        subject: '',
        message: '',
        priority: 'medium',
        category: 'support',
        channel: 'email',
        assignedAgentId: '',
        whatsappNumber: '',
        tags: ''
      });
    } catch (err) {
      const error = err as DatabaseError;
      showError('Ticket Creation Failed', error.message);
    } finally {
      setCreatingTicket(false);
    }
  };

  // Create ticket from WhatsApp message
  const createTicketFromWhatsApp = async (incomingMessage: WhatsAppMessage, customerName: string, whatsappNumber: string): Promise<Ticket> => {
    try {
      const ticketId = await typedTicketsService.getNextTicketNumber();
      
      const waNumber = whatsappNumbers.find(wn => wn.number === whatsappNumber);
      const category = waNumber?.categories[0] || 'support';
      
      const assignedAgent = getAgentForAssignment(category, whatsappNumber);
      
      const newTicket = {
        id: ticketId,
        customer_name: customerName,
        customer_phone: incomingMessage.from,
        subject: `WhatsApp: ${category.charAt(0).toUpperCase() + category.slice(1)} Request`,
        message: incomingMessage.body,
        status: 'open',
        priority: 'medium',
        category: category,
        assigned_to: assignedAgent?.name || 'Unassigned',
        assigned_agent_id: assignedAgent?.id || null,
        channel: 'whatsapp',
        whatsapp_number: whatsappNumber,
        tags: ['whatsapp', 'auto-created', category]
      };

      // Create ticket
      const createdTicket = await typedTicketsService.create(newTicket);

      // Add incoming message
      const messageData = {
        id: incomingMessage.id,
        ticket_id: ticketId,
        from_number: incomingMessage.from,
        to_number: incomingMessage.to,
        body: incomingMessage.body,
        message_type: 'incoming'
      };
      await whatsappMessagesService.add(messageData);

      // Add status history
      await statusHistoryService.add(
        ticketId,
        'open',
        'System',
        assignedAgent ? `Auto-assigned to ${assignedAgent.name}` : 'No agents available for assignment'
      );

      // Update agent load
      if (assignedAgent) {
        await agentsService.update(assignedAgent.id, {
          current_load: assignedAgent.current_load + 1
        });
      }

      // Send auto-reply
      const autoReply = {
        id: `auto_reply_${Date.now()}`,
        ticket_id: ticketId,
        from_number: whatsappNumber,
        to_number: incomingMessage.from,
        body: `🎫 Thank you for contacting us! Your support ticket ${ticketId} has been created${assignedAgent ? ` and assigned to ${assignedAgent.name}` : ''}. Our team will assist you shortly.`,
        message_type: 'outgoing',
        status: 'sent',
        is_status_update: true
      };

      await whatsappMessagesService.add(autoReply);

      // Refresh data
      await loadTickets();
      await loadAgents();
      await loadMessages();

      return {
        ...createdTicket,
        assigned_to: assignedAgent?.name || 'Unassigned',
        statusHistory: [{
          status: 'open',
          timestamp: incomingMessage.timestamp,
          updated_by: 'System',
          note: assignedAgent ? `Auto-assigned to ${assignedAgent.name}` : 'No agents available for assignment'
        }]
      };
    } catch (err) {
      const error = err as DatabaseError;
      showError('WhatsApp Ticket Creation Failed', error.message);
      throw error;
    }
  };

  const simulateIncomingWhatsApp = async () => {
    if (!simulatedMessage.trim()) return;

    try {
      const incomingMessage: WhatsAppMessage = {
        id: `incoming_${Date.now()}`,
        from: simulatedPhone,
        to: simulatedWhatsAppNumber,
        body: simulatedMessage,
        timestamp: new Date().toISOString(),
        type: 'incoming',
        message_type: 'incoming',
        created_at: new Date().toISOString(),
        to_number: simulatedWhatsAppNumber,
        from_number: simulatedPhone
      };

      const newTicket = await createTicketFromWhatsApp(incomingMessage, simulatedName, simulatedWhatsAppNumber);
      
      setSimulatedMessage('');
      setShowIncomingMessage(false);
      
      setTimeout(() => {
        setSelectedTicket(newTicket);
      }, 500);
    } catch (err) {
      const error = err as DatabaseError;
      showError('WhatsApp Ticket Creation Failed', error.message);
    }
  };

  const handleSendWhatsAppReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    
    try {
      const newMessage = {
        id: `msg_${Date.now()}`,
        ticket_id: selectedTicket.id,
        from_number: selectedTicket.whatsapp_number || '+94772776151',
        to_number: selectedTicket.customer_phone,
        body: replyMessage,
        message_type: 'outgoing',
        status: 'sent',
        is_status_update: false
      };
      
      await whatsappMessagesService.add(newMessage);
      setReplyMessage('');

      // Simulate delivery status updates
      setTimeout(async () => {
        await whatsappMessagesService.updateStatus(newMessage.id, 'delivered');
        await loadMessages();
      }, 1000);

      setTimeout(async () => {
        await whatsappMessagesService.updateStatus(newMessage.id, 'read');
        await loadMessages();
      }, 3000);

      await loadMessages();
    } catch (err) {
      const error = err as DatabaseError;
      showError('Reply Failed', error.message);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    const note = prompt(`Update status to "${newStatus}". Add a note (optional):`);
    
    try {
      const ticket = tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      // Get current agent name for status update message
      const { data: { user } } = await supabase.auth.getUser();
      let agentName = 'Agent';
      if (user) {
        const { data: agent } = await supabase
          .from('agents')
          .select('name')
          .eq('email', user.email)
          .single();
        if (agent) agentName = agent.name;
      }

      // Update ticket (note is stored in status_history, not in tickets table)
      await typedTicketsService.update(ticketId, { 
        status: newStatus
      });

      // Add status history
      await statusHistoryService.add(ticketId, newStatus, agentName || 'System', note || `Status updated to ${newStatus}`);

      // Send chat status update for web-chat tickets
      if (ticket.channel === 'web-chat' && ticket.session_id && newStatus !== 'open') {
        try {
          // Get status update message
          const statusMessages: Record<string, string> = {
            'in-progress': `🔄 Your ticket is now being worked on${agentName ? ` by ${agentName}` : ' by our team'}.`,
            'resolved': `✅ Your ticket has been resolved${agentName ? ` by ${agentName}` : ' by our team'}! Is there anything else we can help you with?`,
            'closed': `📝 Your ticket has been closed. Thank you for contacting us!`
          };

          let statusMessage = statusMessages[newStatus] || `📋 Your ticket status has been updated to: ${newStatus}`;
          
          // Add note if provided
          if (note && note.trim()) {
            statusMessage += `\n\nNote: ${note}`;
          }

          // Send system message to chat (note is already saved in status_history)
          await chatMessagesService.sendSystemMessage(
            ticket.session_id,
            ticketId,
            statusMessage,
            { ticket_status: newStatus, is_status_update: true }
          );

          console.log('✅ Status update message sent to chat:', { session_id: ticket.session_id, status: newStatus });
        } catch (chatError) {
          console.error('❌ Error sending chat status update:', chatError);
          // Don't fail the whole update if chat message fails
        }
      }

      // Send WhatsApp status update if applicable
      if (ticket.channel === 'whatsapp' && newStatus !== 'open') {
        const statusMessages: Record<string, string> = {
          'in-progress': `🔄 Your ticket ${ticketId} is now being worked on by ${agentName || ticket.assigned_to}. We'll keep you updated on the progress.`,
          'resolved': `✅ Good news! Your ticket ${ticketId} has been resolved by ${agentName || ticket.assigned_to}. Please let us know if you need any further assistance.`,
          'closed': `📝 Your ticket ${ticketId} has been closed. Thank you for contacting us. Feel free to reach out if you have any other questions.`
        };

        if (statusMessages[newStatus]) {
          const statusUpdateMessage = {
            id: `status_${Date.now()}`,
            ticket_id: ticketId,
            from_number: ticket.whatsapp_number || '+94772776151',
            to_number: ticket.customer_phone,
            body: statusMessages[newStatus] + (note ? `\n\nNote: ${note}` : ''),
            message_type: 'outgoing',
            status: 'sent',
            is_status_update: true
          };

          await whatsappMessagesService.add(statusUpdateMessage);
        }
      }

      // Refresh data
      await loadTickets();
      await loadMessages();
      
      // Reload chat messages if it's a web-chat ticket
      if (ticket.channel === 'web-chat' && selectedTicket?.id === ticketId) {
        await loadWebChatMessages(ticket);
      }
      
      showSuccess('Status Updated', `Ticket status updated to ${newStatus}${note ? ' with note' : ''}`);
    } catch (err) {
      const error = err as DatabaseError;
      showError('Status Update Failed', error.message);
    }
  };

  const reassignTicket = async (ticketId: string, newAgentId: string) => {
    try {
      const newAgent = agents.find(a => a.id === newAgentId);
      if (!newAgent) return;

      const oldTicket = tickets.find(t => t.id === ticketId);
      const oldAgentName = oldTicket?.assigned_to || 'Unassigned';
      const oldAgentId = oldTicket?.assigned_agent_id;
      const oldAgent = oldAgentId ? agents.find(a => a.id === oldAgentId) : null;

      // Update ticket
      await typedTicketsService.update(ticketId, {
        assigned_to: newAgent.name,
        assigned_agent_id: newAgentId
      });

      // Add status history
      await statusHistoryService.add(ticketId, oldTicket?.status || 'open', 'System', `Reassigned to ${newAgent.name}`);

      // Update agent loads
      if (oldAgent) {
        await agentsService.update(oldAgent.id, {
          current_load: Math.max(0, oldAgent.current_load - 1)
        });
      }

      await agentsService.update(newAgentId, {
        current_load: newAgent.current_load + 1
      });

      // Add system message to chat if it's a web-chat ticket
      if (oldTicket?.channel === 'web-chat') {
        try {
          // Get session_id from ticket or from chat_messages
          let sessionId = oldTicket.session_id;
          
          if (!sessionId) {
            // Try to fetch from chat_messages for this ticket
            const { data: msgs } = await supabase
              .from('chat_messages')
              .select('session_id')
              .eq('ticket_id', ticketId)
              .limit(1);
            
            sessionId = msgs && msgs.length > 0 ? msgs[0].session_id : null;
          }

          if (sessionId) {
            // Create system message for agent switch
            const switchMessage = oldAgentName && oldAgentName !== 'Unassigned'
              ? `🔄 Your conversation has been transferred from ${oldAgentName} to ${newAgent.name}. ${newAgent.name} will continue assisting you.`
              : `🔄 Your conversation has been assigned to ${newAgent.name}. They will assist you with your request.`;

            const { error: messageError } = await supabase
              .from('chat_messages')
              .insert([
                {
                  session_id: sessionId,
                  ticket_id: ticketId,
                  message_text: switchMessage,
                  message_type: 'text',
                  sender_type: 'system',
                  sender_name: 'Support System',
                  is_read: false,
                  metadata: {
                    agent_switch: true,
                    old_agent: oldAgentName,
                    new_agent: newAgent.name
                  }
                }
              ]);

            if (messageError) {
              console.error('Error adding agent switch message to chat:', messageError);
            } else {
              // Reload web chat messages if this ticket is currently selected
              if (selectedTicket?.id === ticketId) {
                await loadWebChatMessages(selectedTicket);
              }
            }
          }
        } catch (chatError) {
          console.error('Error adding agent switch message to chat:', chatError);
          // Don't fail the reassignment if chat message fails
        }
      }

      // Refresh data
      await loadTickets();
      await loadAgents();
    } catch (err) {
      const error = err as DatabaseError;
      showError('Reassignment Failed', error.message);
    }
  };

  const updateAgent = async (agentId: string, updates: Partial<Agent>) => {
    try {
      await agentsService.update(agentId, updates);
      await loadAgents();
    } catch (err) {
      const error = err as DatabaseError;
      showError('Agent Update Failed', error.message);
    }
  };

  // Load chat notes for a ticket
  const loadChatNotes = useCallback(async (ticketId: string) => {
    try {
      const notes = await chatNotesService.getByTicketId(ticketId);
      setChatNotes(notes);
    } catch (err) {
      console.error('Error loading chat notes:', err);
      setChatNotes([]);
    }
  }, []);

  // Add a chat note
  const addChatNote = async (ticketId: string, noteText: string) => {
    if (!noteText.trim()) return;
    
    setAddingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let agentName = 'Agent';
      let agentId = null;

      if (user) {
        const { data: agent } = await supabase
          .from('agents')
          .select('id, name')
          .eq('email', user.email)
          .single();
        if (agent) {
          agentName = agent.name;
          agentId = agent.id;
        }
      }

      const selectedTicket = tickets.find(t => t.id === ticketId);
      await chatNotesService.add({
        ticket_id: ticketId,
        session_id: selectedTicket?.session_id || null,
        note_text: noteText.trim(),
        created_by: agentId,
        created_by_name: agentName,
        is_private: false
      });

      setNewNote('');
      await loadChatNotes(ticketId);
      showSuccess('Note Added', 'Chat note has been added successfully.');
    } catch (err) {
      const error = err as DatabaseError;
      showError('Failed to Add Note', error.message);
    } finally {
      setAddingNote(false);
    }
  };

  // Bulk messaging function
  const sendBulkMessages = async () => {
    if (!bulkMessage.trim() || selectedTicketsForBulk.size === 0) {
      showWarning('Missing Information', 'Please select tickets and enter a message.');
      return;
    }

    setSendingBulkMessages(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      let agentName = 'Agent';
      let agentId = null;

      if (user) {
        const { data: agent } = await supabase
          .from('agents')
          .select('id, name')
          .eq('email', user.email)
          .single();
        if (agent) {
          agentName = agent.name;
          agentId = agent.id;
        }
      }

      const ticketsToSend = tickets.filter(t => selectedTicketsForBulk.has(t.id));

      for (const ticket of ticketsToSend) {
        try {
          if (ticket.channel === 'web-chat' && ticket.session_id) {
            // Send to web chat
            await supabase.from('chat_messages').insert([{
              session_id: ticket.session_id,
              ticket_id: ticket.id,
              message_text: bulkMessage.trim(),
              message_type: 'text',
              sender_type: 'agent',
              sender_name: agentName,
              sender_id: agentId,
              is_read: false,
              metadata: { bulk_message: true }
            }]);
            successCount++;
          } else if (ticket.channel === 'whatsapp' && ticket.customer_phone) {
            // Send WhatsApp message
            await typedTicketsService.sendWhatsAppReply(ticket.id, bulkMessage.trim(), agentName);
            successCount++;
          }
        } catch (err) {
          console.error(`Error sending message to ticket ${ticket.id}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        showSuccess('Bulk Messages Sent', `Successfully sent ${successCount} message(s). ${failCount > 0 ? `${failCount} failed.` : ''}`);
      } else {
        showError('Bulk Messages Failed', 'Failed to send messages to selected tickets.');
      }

      setSelectedTicketsForBulk(new Set());
      setBulkMessage('');
      setShowBulkMessaging(false);
      await loadTickets();
    } catch (err) {
      const error = err as DatabaseError;
      showError('Bulk Messaging Failed', error.message);
    } finally {
      setSendingBulkMessages(false);
    }
  };

  // Toggle ticket selection for bulk messaging
  const toggleTicketSelection = (ticketId: string) => {
    const newSelection = new Set(selectedTicketsForBulk);
    if (newSelection.has(ticketId)) {
      newSelection.delete(ticketId);
    } else {
      newSelection.add(ticketId);
    }
    setSelectedTicketsForBulk(newSelection);
  };

  // Add Agent logic
  const handleAddAgent = async () => {
    if (!addAgentForm.name.trim() || !addAgentForm.email.trim() || !addAgentForm.password) {
      showWarning('Missing Fields', 'Please fill in all required fields (Name, Email, Password)');
      return;
    }
    setAddingAgent(true);
    try {
      // 1. Create user in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: addAgentForm.email,
        password: addAgentForm.password,
      });
      if (signUpError) throw signUpError;
      // 2. Add to agents table
      const newAgent = {
        id: data.user?.id,
        name: addAgentForm.name.trim(),
        email: addAgentForm.email.trim(),
        role: addAgentForm.role,
        expertise: addAgentForm.expertise.split(',').map(e => e.trim()).filter(Boolean),
        whatsapp_numbers: addAgentForm.whatsappNumbers.split(',').map(n => n.trim()).filter(Boolean),
        max_tickets: Number(addAgentForm.maxTickets) || 10,
        is_active: !!addAgentForm.isActive,
        current_load: 0
      };
      await agentsService.create(newAgent);
      // Send WhatsApp message to each number added
      const numbers = addAgentForm.whatsappNumbers.split(',').map(n => n.trim()).filter(Boolean);
      for (const number of numbers) {
        try {
          await whatsappAPI.sendMessage(number, `Welcome! Your number has been added as an agent in the system.`);
        } catch (e) {
          console.error('Failed to send WhatsApp message to', number, e);
        }
      }
      showSuccess('Agent Added', 'The agent was added successfully.');
      setShowAddAgentForm(false);
      setAddAgentForm({
        name: '',
        email: '',
        password: '',
        role: 'agent',
        expertise: '',
        whatsappNumbers: '',
        maxTickets: 10,
        isActive: true
      });
      await loadAgents();
    } catch (err) {
      const error = err as DatabaseError;
      showError('Add Agent Failed', error.message);
    } finally {
      setAddingAgent(false);
    }
  };

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
    const matchesAgent = filterAgent === 'all' || ticket.assigned_to === filterAgent;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesAgent;
  });

  // Group tickets function
  const groupedTickets = (() => {
    if (groupBy === 'none') return { 'All Tickets': filteredTickets };

    const grouped: { [key: string]: Ticket[] } = {};
    filteredTickets.forEach(ticket => {
      let key = 'Uncategorized';
      switch (groupBy) {
        case 'category':
          key = ticket.category || 'Uncategorized';
          break;
        case 'agent':
          key = ticket.assigned_to || 'Unassigned';
          break;
        case 'status':
          key = ticket.status || 'Unknown';
          break;
        case 'channel':
          key = ticket.channel || 'Unknown';
          break;
      }
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ticket);
    });
    return grouped;
  })();

  // Helper functions for UI
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Circle className="w-4 h-4 text-red-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'email': return <Mail className="w-4 h-4 text-blue-500" />;
      case 'phone': return <Phone className="w-4 h-4 text-purple-500" />;
      case 'web': return <Globe className="w-4 h-4 text-gray-500" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMessageStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'sent': return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered': return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read': return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default: return null;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-red-500" />;
      case 'supervisor': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'agent': return <User className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  // Show loading state
  if (!isClient || loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading WhatsApp Help Desk...</p>
        </div>
      {/* Add Agent Modal (for adding) */}
      {!isEditingAgent && (
        <AddAgentModal
          open={showAddAgentForm}
          onClose={() => {
            setShowAddAgentForm(false);
            setIsEditingAgent(false);
            setEditingAgent(null);
            setAddAgentForm({
              name: '',
              email: '',
              password: '',
              role: 'agent',
              expertise: '',
              whatsappNumbers: '',
              maxTickets: 10,
              isActive: true
            });
          }}
          form={addAgentForm}
          setForm={setAddAgentForm}
          loading={addingAgent}
          onSubmit={handleAddAgent}
        />
      )}
      {/* Edit Agent Modal (for editing) */}
      {isEditingAgent && (
        <EditAgentModalFull
          open={showAddAgentForm}
          onClose={() => {
            setShowAddAgentForm(false);
            setIsEditingAgent(false);
            setEditingAgent(null);
            setAddAgentForm({
              name: '',
              email: '',
              password: '',
              role: 'agent',
              expertise: '',
              whatsappNumbers: '',
              maxTickets: 10,
              isActive: true
            });
          }}
          agent={editingAgent}
          loading={addingAgent}
          onSave={async (updated) => {
            if (editingAgent) {
              setAddingAgent(true);
              try {
                await updateAgent(editingAgent.id, updated);
                showSuccess('Agent Updated', 'The agent was updated successfully.');
                setShowAddAgentForm(false);
                setIsEditingAgent(false);
                setEditingAgent(null);
                setAddAgentForm({
                  name: '',
                  email: '',
                  password: '',
                  role: 'agent',
                  expertise: '',
                  whatsappNumbers: '',
                  maxTickets: 10,
                  isActive: true
                });
              } catch (err) {
                const error = err as DatabaseError;
                showError('Update Agent Failed', error.message);
              } finally {
                setAddingAgent(false);
              }
            }
          }}
        />
      )}
    </div>
  );
}

  // Show error state
  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Database Connection Error</h2>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const whatsappTicketsCount = tickets.filter(t => t.channel === 'whatsapp').length;
  const openWhatsappTickets = tickets.filter(t => t.channel === 'whatsapp' && t.status === 'open').length;
  const activeAgents = agents.filter(a => a.is_active).length;

  return (
    <>
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        duration={notification.duration}
        onClose={hideNotification}
        position={notification.position} ticketId={undefined} priority={undefined} assignee={undefined} timestamp={undefined}      />
      <div className="h-screen bg-gray-50 text-sm flex flex-col" style={{ color: '#f1f1f1', fontFamily: 'Arial, sans-serif' }}>
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white shadow-sm border-r flex-shrink-0">
          <div className="p-4 border-b">
            <h1 className="text-lg font-bold text-black">Chat System Dashboard</h1>
            <p className="text-xs text-gray-800"></p>
            <p className="text-xs text-gray-600">Build by Hashantha Bandara</p>
            <div className="mt-2 text-xs text-green-600">
              🟢 Connected to Database
            </div>
          </div>
        
          {/* WhatsApp Status */}
          <div className="p-3 border-b bg-green-50">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-black">WhatsApp Business</span>
            </div>
            <div className="text-xs space-y-1 text-black">
              <div>{whatsappNumbers.length} numbers • {activeAgents} agents</div>
              <div>
                <span className="text-green-600 font-medium">{whatsappTicketsCount}</span> total tickets
                <span className="mx-1">•</span>
                <span className="text-orange-600 font-medium">{openWhatsappTickets}</span> open
              </div>
            </div>
          </div>
        
          <nav className="mt-4">
            <div className="px-3">
              <button 
                onClick={() => setCurrentView('tickets')}
                className={`w-full flex items-center px-3 py-2 text-left text-xs font-medium rounded-lg ${
                  currentView === 'tickets' ? 'text-white bg-blue-600' : 'text-black hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Tickets
                <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                  currentView === 'tickets' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-black'
                }`}>
                  {tickets.length}
                </span>
              </button>
            </div>
            
            <div className="mt-2 px-3">
              <button 
                onClick={() => setCurrentView('agents')}
                className={`w-full flex items-center px-3 py-2 text-left text-xs rounded-lg ${
                  currentView === 'agents' ? 'text-white bg-blue-600' : 'text-black hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Agents & Numbers
                <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                  currentView === 'agents' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-black'
                }`}>
                  {activeAgents}
                </span>
              </button>
            </div>
            <LogoutButton />
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {currentView === 'tickets' ? (
            <>
              {/* Tickets List */}
              <div className="w-80 bg-white border-r">
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-black">Tickets</h2>
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => setShowBulkMessaging(!showBulkMessaging)}
                        className={`p-1 rounded ${showBulkMessaging ? 'bg-blue-100 text-blue-600' : 'text-blue-600 hover:bg-blue-50'}`}
                        title="Bulk messaging"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setShowManualTicketForm(true)}
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                        title="Create new ticket"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Bulk Messaging UI */}
                  {showBulkMessaging && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-blue-800">Bulk Messaging</span>
                        <span className="text-xs text-blue-600">{selectedTicketsForBulk.size} selected</span>
                      </div>
                      <textarea
                        value={bulkMessage}
                        onChange={(e) => setBulkMessage(e.target.value)}
                        placeholder="Enter message to send to selected tickets..."
                        className="w-full px-2 py-1.5 text-xs border border-blue-300 rounded mb-2 text-black resize-none"
                        rows={3}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={sendBulkMessages}
                          disabled={sendingBulkMessages || selectedTicketsForBulk.size === 0 || !bulkMessage.trim()}
                          className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {sendingBulkMessages ? 'Sending...' : `Send to ${selectedTicketsForBulk.size} ticket(s)`}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTicketsForBulk(new Set());
                            setBulkMessage('');
                            setShowBulkMessaging(false);
                          }}
                          className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Grouping Selector */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-black mb-1">Group By</label>
                    <select
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value as any)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded text-black"
                    >
                      <option value="none">No Grouping</option>
                      <option value="category">Category</option>
                      <option value="agent">Agent</option>
                      <option value="status">Status</option>
                      <option value="channel">Channel</option>
                    </select>
                  </div>
                  
                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                  
                  {/* Filters */}
                  <div className="space-y-2">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded text-black"
                    >
                      <option value="all">All Status</option>
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    
                    <div className="flex space-x-1">
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded text-black"
                      >
                        <option value="all">All Categories</option>
                        <option value="sales">Sales</option>
                        <option value="billing">Billing</option>
                        <option value="support">Support</option>
                        <option value="technical">Technical</option>
                      </select>
                      
                      <select
                        value={filterAgent}
                        onChange={(e) => setFilterAgent(e.target.value)}
                        className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded text-black"
                      >
                        <option value="all">All Agents</option>
                        {agents.filter(a => a.is_active).map(agent => (
                          <option key={agent.id} value={agent.id}>{agent.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Tickets */}
                <div className="overflow-y-auto h-full">
                  {Object.entries(groupedTickets).map(([groupName, groupTickets]) => (
                    <div key={groupName}>
                      {groupBy !== 'none' && (
                        <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-700">{groupName}</span>
                            <span className="text-xs text-gray-500">{groupTickets.length} ticket(s)</span>
                          </div>
                        </div>
                      )}
                      {groupTickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          onClick={() => {
                            setSelectedTicket(ticket);
                            if (ticket.id) {
                              loadChatNotes(ticket.id);
                            }
                          }}
                          className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                            selectedTicket?.id === ticket.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                          }`}
                        >
                          {showBulkMessaging && (
                            <div className="absolute left-2 top-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTicketSelection(ticket.id);
                                }}
                                className="text-blue-600"
                              >
                                {selectedTicketsForBulk.has(ticket.id) ? (
                                  <CheckSquare className="w-4 h-4" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          )}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(ticket.status)}
                          <span className="text-xs font-medium text-black">{ticket.id}</span>
                          {getChannelIcon(ticket.channel)}
                          {ticket.tags?.includes('auto-created') && (
                            <span className="text-xs bg-green-100 text-green-600 px-1 rounded">Auto</span>
                          )}
                          {ticket.tags?.includes('manual-entry') && (
                            <span className="text-xs bg-purple-100 text-purple-600 px-1 rounded">Manual</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          {currentUserRole === 'admin' && (
                            <button
                              onClick={e => { e.stopPropagation(); handleDeleteTicket(ticket.id); }}
                              className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs"
                              title="Delete Ticket"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-sm font-medium text-black mb-1">{ticket.subject}</h3>
                      <p className="text-xs text-black mb-1">{ticket.customer_name}</p>
                      <p className="text-xs text-gray-700 truncate">{ticket.message}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-black">{ticket.assigned_to || 'Unassigned'}</span>
                        </div>
                        <div className="flex space-x-1">
                          {ticket.tags?.slice(0, 2).map((tag) => (
                            <span key={tag} className={`px-1.5 py-0.5 text-xs rounded ${
                              tag === 'whatsapp' ? 'bg-green-100 text-green-800' : 
                              tag === 'auto-created' ? 'bg-blue-100 text-blue-600' :
                              tag === 'manual-entry' ? 'bg-purple-100 text-purple-600' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(ticket.created_at).toLocaleString()}
                      </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ticket Details */}
              <div className="flex-1 flex flex-col">
                {selectedTicket ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(selectedTicket.status)}
                          <h1 className="text-lg font-semibold text-black">{selectedTicket.subject}</h1>
                          {getChannelIcon(selectedTicket.channel)}
                          {selectedTicket.channel === 'whatsapp' && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              {whatsappNumbers.find(wn => wn.number === selectedTicket.whatsapp_number)?.display_name || 'WhatsApp'}
                            </span>
                          )}
                          {selectedTicket.tags?.includes('manual-entry') && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                              Manual Entry
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <select
                            value={selectedTicket.assigned_to || ''}
                            onChange={(e) => e.target.value && reassignTicket(selectedTicket.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded text-black"
                          >
                            <option value="">Unassigned</option>
                            {agents.filter(a => a.is_active).map(agent => (
                              <option key={agent.id} value={agent.id}>
                                {agent.name} ({agent.current_load}/{agent.max_tickets})
                              </option>
                            ))}
                          </select>
                          
                          <select
                            value={selectedTicket.status}
                            onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded text-black"
                          >
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3 text-xs">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-700">Customer:</span>
                          <span className="font-medium text-black">{selectedTicket.customer_name}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-700">Phone:</span>
                          <span className="font-medium text-black">{selectedTicket.customer_phone}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Tag className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-700">Category:</span>
                          <span className="font-medium capitalize text-black">{selectedTicket.category}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-700">Priority:</span>
                          <select
                            value={selectedTicket.priority}
                            onChange={async (e) => {
                              const newPriority = e.target.value;
                              await typedTicketsService.update(selectedTicket.id, { priority: newPriority });
                              await loadTickets();
                              showSuccess('Priority Updated', `Priority set to ${newPriority}`);
                            }}
                            className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)} border border-yellow-400 text-black ml-1`}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>

                      {/* Agent Info */}
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-black">Assigned Agent:</span>
                            {selectedTicket.assigned_to ? (
                              <div className="flex items-center space-x-1">
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                  {selectedTicket.assigned_to?.charAt(0)}
                                </div>
                                <span className="text-black">{selectedTicket.assigned_to}</span>
                                <span className="text-gray-600">
                                  {(() => {
                                    const agent: Agent | undefined = agents.find(a => a.id === selectedTicket.assigned_to);
                                    return `(${agent?.current_load || 0}/${agent?.max_tickets || 0} tickets)`;
                                  })()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-orange-600">Unassigned</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600 capitalize">{selectedTicket.channel}</span>
                            {selectedTicket.whatsapp_number && (
                              <span className="text-gray-600">via {selectedTicket.whatsapp_number}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                      <div className="space-y-3">
                        {/* Customer's initial message */}
                        <div className="flex justify-start">
                          <div className="max-w-xs bg-white border border-gray-200 text-black px-3 py-2 rounded-lg">
                            <div className="flex items-center space-x-1 mb-1">
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                {selectedTicket.customer_name.charAt(0)}
                              </div>
                              <span className="font-medium text-xs text-black">{selectedTicket.customer_name}</span>
                              {getChannelIcon(selectedTicket.channel)}
                              {selectedTicket.tags?.includes('manual-entry') && (
                                <span className="text-xs bg-purple-100 text-purple-600 px-1 rounded">Manual</span>
                              )}
                            </div>
                            <p className="text-sm text-black">{selectedTicket.message}</p>
                            <div className="text-xs text-gray-600 mt-1">
                              {new Date(selectedTicket.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        {/* WhatsApp messages */}
                        {selectedTicket.channel === 'whatsapp' && whatsappMessages
                          .filter(msg => msg.from === selectedTicket.customer_phone || msg.to === selectedTicket.customer_phone)
                          .slice(1)
                          .map((message) => (
                          <div key={message.id} className={`flex ${message.type === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs px-3 py-2 rounded-lg ${
                              message.type === 'outgoing' 
                                ? message.isStatusUpdate 
                                  ? 'bg-blue-500 text-white border-l-4 border-blue-600' 
                                  : 'bg-green-500 text-white'
                                : 'bg-white border border-gray-200 text-black'
                            }`}>
                              {message.type === 'outgoing' && (
                                <div className="flex items-center space-x-1 mb-1">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                                    message.isStatusUpdate ? 'bg-blue-600' : 'bg-green-600'
                                  }`}>
                                    {message.isStatusUpdate ? '🎫' : (selectedTicket.assigned_to?.charAt(0) || 'A')}
                                  </div>
                                  <span className="font-medium text-xs text-white">
                                    {message.isStatusUpdate ? 'System' : (selectedTicket.assigned_to || 'Agent')}
                                  </span>
                                  {message.isStatusUpdate && (
                                    <span className="text-xs bg-blue-400 px-1 rounded">Auto</span>
                                  )}
                                </div>
                              )}

                              {message.type === 'incoming' && (
                                <div className="flex items-center space-x-1 mb-1">
                                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                    {selectedTicket.customer_name.charAt(0)}
                                  </div>
                                  <span className="font-medium text-xs text-black">{selectedTicket.customer_name}</span>
                                  <MessageCircle className="w-3 h-3 text-green-500" />
                                </div>
                              )}
                              
                              <p className={`text-sm ${message.type === 'outgoing' ? 'text-white' : 'text-black'}`}>{message.body}</p>
                              
                              <div className={`text-xs mt-1 flex items-center justify-between ${
                                message.type === 'outgoing' ? 'text-gray-200' : 'text-gray-600'
                              }`}>
                                <span>{new Date(message.timestamp).toLocaleString()}</span>
                                {message.type === 'outgoing' && getMessageStatusIcon(message.status)}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* For non-WhatsApp tickets, show a placeholder for future replies */}
                        {/* Web Chat Messages */}
                        {selectedTicket.channel === 'web-chat' && (
                          <div className="space-y-3">
                            {webChatMessages.map((message) => (
                              <div key={message.id} className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs px-3 py-2 rounded-lg ${
                                  message.sender_type === 'agent'
                                    ? 'bg-blue-600 text-white'
                                    : message.sender_type === 'system'
                                    ? 'bg-gray-200 text-gray-800'
                                    : 'bg-white border border-gray-200 text-black'
                                }`}>
                                  <div className="flex items-center space-x-1 mb-1">
                                    {message.sender_type === 'agent' && (
                                      <User className="w-3 h-3 text-white" />
                                    )}
                                    {message.sender_type === 'system' && (
                                      <AlertCircle className="w-3 h-3 text-gray-500" />
                                    )}
                                    <span className="text-xs font-medium">
                                      {message.sender_name}
                                    </span>
                                  </div>
                                  <p className="text-sm">{message.message_text}</p>
                                  <div className={`text-xs mt-1 ${
                                    message.sender_type === 'agent' ? 'text-blue-200' : 'text-gray-500'
                                  }`}>
                                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* For non-WhatsApp, non-web tickets, show a placeholder */}
                        {selectedTicket.channel !== 'whatsapp' && selectedTicket.channel !== 'web-chat' && (
                          <div className="text-center py-4">
                            <div className="text-xs text-gray-500 mb-2">
                              {selectedTicket.channel === 'email' && '📧 Email conversation will appear here'}
                              {selectedTicket.channel === 'phone' && '📞 Phone call notes will appear here'}
                            </div>
                            <div className="text-xs text-gray-400">
                              Use the reply section below to add notes or send responses
                            </div>
                          </div>
                        )}

                        {/* Status History */}
                        {selectedTicket.statusHistory && selectedTicket.statusHistory.length > 1 && (
                          <div className="mt-4 p-3 bg-white rounded border">
                            <h4 className="text-xs font-medium text-black mb-2">Status History</h4>
                            <div className="space-y-1">
                              {selectedTicket.statusHistory.map((history, index) => (
                                <div key={index} className="text-xs">
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(history.status)}
                                    <span className="font-medium text-black capitalize">{history.status}</span>
                                    <span className="text-gray-600">by {history.updated_by}</span>
                                    <span className="text-gray-500">{new Date(history.timestamp).toLocaleString()}</span>
                                  </div>
                                  {history.note && (
                                    <p className="text-gray-700 ml-6 mt-1">{history.note}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Chat Notes Section */}
                    <div className="p-4 border-t bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={() => setShowNotesSection(!showNotesSection)}
                          className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                          <StickyNote className="w-4 h-4" />
                          <span>Chat Notes ({chatNotes.length})</span>
                        </button>
                        {showNotesSection && (
                          <button
                            onClick={() => {
                              setNewNote('');
                              setShowNotesSection(false);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Hide
                          </button>
                        )}
                      </div>
                      
                      {showNotesSection && (
                        <div className="space-y-3">
                          {/* Add Note Form */}
                          <div className="space-y-2">
                            <textarea
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              placeholder="Add a note about this conversation..."
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-black"
                              rows={3}
                            />
                            <button
                              onClick={() => {
                                if (selectedTicket?.id) {
                                  addChatNote(selectedTicket.id, newNote);
                                }
                              }}
                              disabled={addingNote || !newNote.trim()}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
                            >
                              <StickyNote className="w-3 h-3" />
                              <span>{addingNote ? 'Adding...' : 'Add Note'}</span>
                            </button>
                          </div>
                          
                          {/* Notes List */}
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {chatNotes.length === 0 ? (
                              <p className="text-xs text-gray-500 text-center py-4">No notes yet. Add one above.</p>
                            ) : (
                              chatNotes.map((note) => (
                                <div key={note.id} className="p-3 bg-gray-50 border border-gray-200 rounded">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <StickyNote className="w-3 h-3 text-gray-500" />
                                      <span className="text-xs font-medium text-gray-700">{note.created_by_name || 'Agent'}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {new Date(note.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.note_text}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Reply Section */}
                    <div className="p-4 border-t bg-white">
                      {selectedTicket.channel === 'whatsapp' ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-1 text-xs text-green-600">
                            <MessageCircle className="w-3 h-3" />
                            <span>Replying via {whatsappNumbers.find(wn => wn.number === selectedTicket.whatsapp_number)?.display_name || 'WhatsApp'} to {selectedTicket.customer_phone}</span>
                          </div>
                          
                          <div className="flex space-x-3">
                            <textarea
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder="Type your WhatsApp reply..."
                              className="flex-1 p-2 text-sm border border-gray-300 rounded resize-none focus:ring-1 focus:ring-green-500 focus:border-transparent text-black"
                              rows={2}
                            />
                            <div className="flex flex-col space-y-1">
                              <button 
                                onClick={handleSendWhatsAppReply}
                                disabled={!replyMessage.trim()}
                                className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
                              >
                                <Send className="w-3 h-3" />
                                <span>Send</span>
                              </button>
                            </div>
                          </div>
                          
                          {/* Quick reply templates */}
                          <div className="flex flex-wrap gap-1">
                            <button 
                              onClick={() => setReplyMessage("Thank you for your message. I'm looking into this and will get back to you shortly.")}
                              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded hover:bg-green-200"
                            >
                              Standard Reply
                            </button>
                            <button 
                              onClick={() => setReplyMessage("I understand your concern. Let me escalate this to our technical team for a quick resolution.")}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200"
                            >
                              Escalation
                            </button>
                            <button 
                              onClick={() => setReplyMessage("Your issue has been resolved. Please let me know if you need any further assistance.")}
                              className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded hover:bg-purple-200"
                            >
                              Resolution
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-1 text-xs text-gray-600">
                            {getChannelIcon(selectedTicket.channel)}
                            <span>
                              {selectedTicket.channel === 'email' && `Replying via email to ${selectedTicket.customer_phone}`}
                              {selectedTicket.channel === 'phone' && 'Add phone call notes or follow-up'}
                              {selectedTicket.channel === 'web-chat' && 'Replying to user via web chat'}
                            </span>
                          </div>
                          <div className="flex space-x-3">
                            <textarea
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder={`Type your ${selectedTicket.channel === 'web-chat' ? 'web chat reply' : selectedTicket.channel + ' response or internal note'}...`}
                              className="flex-1 p-2 text-sm border border-gray-300 rounded resize-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-black"
                              rows={2}
                              onPaste={async (e) => {
                                if (selectedTicket.channel !== 'web-chat') return;
                                if (!e.clipboardData) return;
                                const items = e.clipboardData.items;
                                for (let i = 0; i < items.length; i++) {
                                  const item = items[i];
                                  if (item.type.indexOf('image') !== -1) {
                                    const file = item.getAsFile();
                                    if (file) {
                                      const fileExt = file.name.split('.').pop() || 'png';
                                      const filePath = `chat/${selectedTicket.session_id || selectedTicket.id}/${Date.now()}.${fileExt}`;
                                      const { error } = await supabase.storage.from('chat-images').upload(filePath, file);
                                      if (error) {
                                        showError('Image Upload Failed', error.message || 'Failed to upload image');
                                        return;
                                      }
                                      const { data: publicUrlData } = supabase.storage.from('chat-images').getPublicUrl(filePath);
                                      const imageUrl = publicUrlData?.publicUrl;
                                      if (imageUrl) {
                                        await supabase.from('chat_messages').insert([
                                          {
                                            session_id: selectedTicket.session_id,
                                            ticket_id: selectedTicket.id,
                                            message_text: imageUrl,
                                            message_type: 'image',
                                            sender_type: 'agent',
                                            sender_name: 'Agent',
                                            is_read: false,
                                            metadata: { pasted: true }
                                          }
                                        ]);
                                        await loadWebChatMessages(selectedTicket);
                                      }
                                    }
                                    e.preventDefault();
                                    break;
                                  }
                                }
                              }}
                            />
                            <button
                              onClick={async () => {
                                if (!replyMessage.trim()) return;
                                if (selectedTicket.channel === 'web-chat') {
                                  // Send agent reply to chat_messages
                                  try {
                                    // session_id may not be present in selectedTicket, so fetch it if needed
                                    let sessionId = selectedTicket.session_id;
                                    console.log('🔍 Agent reply - Current session_id from ticket:', sessionId);
                                    
                                    if (!sessionId) {
                                      console.log('⚠️ session_id not in ticket, fetching from chat_messages...');
                                      // Try to fetch from chat_messages for this ticket
                                      const { data: msgs, error: msgError } = await supabase
                                        .from('chat_messages')
                                        .select('session_id')
                                        .eq('ticket_id', selectedTicket.id)
                                        .limit(1);
                                      
                                      if (msgError) {
                                        console.error('Error fetching session_id:', msgError);
                                      }
                                      
                                      sessionId = msgs && msgs.length > 0 ? msgs[0].session_id : null;
                                      console.log('🔍 Found session_id from messages:', sessionId);
                                    }
                                    
                                    if (!sessionId) {
                                      // Last resort: try to get from user_sessions via ticket
                                      console.log('⚠️ Trying to get session_id from user_sessions...');
                                      const { data: sessionData } = await supabase
                                        .from('user_sessions')
                                        .select('session_id')
                                        .eq('channel', 'web-chat')
                                        .limit(1);
                                      
                                      if (sessionData && sessionData.length > 0) {
                                        sessionId = sessionData[0].session_id;
                                        console.log('🔍 Found session_id from user_sessions:', sessionId);
                                      }
                                    }
                                    
                                    if (!sessionId) {
                                      console.error('❌ Session ID not found for ticket:', selectedTicket.id);
                                      showError('Reply Failed', 'Session ID not found for this ticket. Please refresh the page.');
                                      return;
                                    }
                                    
                                    console.log('✅ Using session_id for agent reply:', sessionId);
                                    
                                    // Get current agent name
                                    const { data: { user } } = await supabase.auth.getUser();
                                    let agentName = 'Agent';
                                    if (user) {
                                      const { data: agent } = await supabase
                                        .from('agents')
                                        .select('name')
                                        .eq('email', user.email)
                                        .single();
                                      if (agent) agentName = agent.name;
                                    }
                                    
                                    const { data, error } = await supabase
                                      .from('chat_messages')
                                      .insert([
                                        {
                                          session_id: sessionId,
                                          ticket_id: selectedTicket.id,
                                          message_text: replyMessage,
                                          message_type: 'text',
                                          sender_type: 'agent',
                                          sender_name: agentName,
                                          is_read: false,
                                          metadata: {}
                                        }
                                      ])
                                      .select()
                                      .single();
                                    
                                    if (error) {
                                      throw error;
                                    }
                                    
                                    console.log('✅ Agent message sent to chat:', {
                                      id: data.id,
                                      session_id: sessionId,
                                      ticket_id: selectedTicket.id,
                                      message: replyMessage.substring(0, 50)
                                    });
                                    setReplyMessage('');
                                    // Reload messages to show the new one (backup)
                                    await loadWebChatMessages(selectedTicket);
                                    showSuccess('Message Sent', 'Your reply has been sent to the user');
                                    
                                    // The real-time subscription should pick it up automatically
                                    // But we reload as backup to ensure it appears
                                  } catch (err) {
                                    console.error('Error sending agent message:', err);
                                    showError('Reply Failed', (err as Error)?.message || 'Failed to send reply');
                                  }
                                } else {
                                  // Add internal note logic here
                                  showSuccess('Note Added', 'Note added to ticket (this would be saved in the database)');
                                  setReplyMessage('');
                                }
                              }}
                              disabled={!replyMessage.trim()}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              {selectedTicket.channel === 'web-chat' ? 'Send' : 'Add Note'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-700 text-sm">Select a ticket to view details</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Messages and conversations will appear here
                      </p>
                      <button 
                        onClick={() => setShowManualTicketForm(true)}
                        className="mt-3 px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center space-x-1 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create New Ticket</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Agents Management View */
            <div className="flex-1">
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-black">Agents</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowAddAgentForm(true)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center space-x-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Add Agent</span>
                    </button>
             
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {/* Agents Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-black mb-3">Agents ({agents.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.map((agent) => (
                      <div key={agent.id} className={`p-4 border rounded-lg ${agent.is_active ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {agent.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-black">{agent.name}</h4>
                              <div className="flex items-center space-x-1">
                                {getRoleIcon(agent.role)}
                                <span className="text-xs text-black capitalize">{agent.role}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${agent.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="text-xs text-black">{agent.is_active ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700">Load:</span>
                            <span className={`font-medium ${agent.current_load > agent.max_tickets * 0.8 ? 'text-red-600' : 'text-black'}`}>
                              {agent.current_load}/{agent.max_tickets}
                            </span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                agent.current_load > agent.max_tickets * 0.8 ? 'bg-red-500' : 
                                agent.current_load > agent.max_tickets * 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min((agent.current_load / agent.max_tickets) * 100, 100)}%` }}
                            ></div>
                          </div>

                          <div>
                            <span className="text-gray-700">WhatsApp Numbers:</span>
                            <div className="mt-1 space-y-1">
                              {agent.whatsapp_numbers && agent.whatsapp_numbers.length > 0 ? (
                                agent.whatsapp_numbers.map(number => (
                                  <div key={number} className="flex items-center space-x-1">
                                    <MessageCircle className="w-3 h-3 text-green-500" />
                                    <span className="font-mono text-xs text-black">{number}</span>
                                    <span className="text-gray-600">
                                      ({whatsappNumbers.find(wn => wn.number === number)?.display_name})
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-gray-600 italic">No numbers assigned</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-gray-700">Expertise:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {agent.expertise && agent.expertise.map(skill => (
                                <span key={skill} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex space-x-1">
                          <button
                            onClick={() => {
                              setIsEditingAgent(true);
                              setEditingAgent(agent);
                              setAddAgentForm({
                                name: agent.name,
                                email: agent.email,
                                password: '',
                                role: agent.role,
                                expertise: agent.expertise.join(", "),
                                whatsappNumbers: agent.whatsapp_numbers.join(", "),
                                maxTickets: agent.max_tickets,
                                isActive: agent.is_active
                              });
                              setShowAddAgentForm(true);
                            }}
                            className="px-2 py-1 bg-gray-100 text-black text-xs rounded hover:bg-gray-200 flex items-center space-x-1"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => updateAgent(agent.id, { is_active: !agent.is_active })}
                            className={`px-2 py-1 text-xs rounded flex items-center space-x-1 ${
                              agent.is_active 
                                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                            }`}
                          >
                            <Activity className="w-3 h-3" />
                            <span>{agent.is_active ? 'Deactivate' : 'Activate'}</span>
                          </button>
                          {currentUserRole === 'admin' && (
                            <button
                              onClick={() => handleDeleteAgent(agent.id)}
                              className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200"
                              title="Delete Agent"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Manual Ticket Creation Modal */}
        {showManualTicketForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-black">Create New Ticket</h2>
                <button
                  onClick={() => setShowManualTicketForm(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Customer Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-black">Customer Information</h3>
                  
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Customer Name *</label>
                    <input
                      type="text"
                      value={manualTicketForm.customerName}
                      onChange={(e) => setManualTicketForm(prev => ({ ...prev, customerName: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 text-black"
                      placeholder="Enter customer name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={manualTicketForm.customerPhone}
                      onChange={(e) => setManualTicketForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 text-black"
                      placeholder="+94771234567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Email Address</label>
                    <input
                      type="email"
                      value={manualTicketForm.customerEmail}
                      onChange={(e) => setManualTicketForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 text-black"
                      placeholder="customer@example.com"
                    />
                  </div>
                </div>

                {/* Ticket Details */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-black">Ticket Details</h3>
                  
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Channel</label>
                    <select
                      value={manualTicketForm.channel}
                      onChange={(e) => setManualTicketForm(prev => ({ ...prev, channel: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 text-black"
                    >
                      <option value="email">📧 Email</option>
                      <option value="phone">📞 Phone</option>
                      <option value="web">💬 Web Chat</option>
                      <option value="whatsapp">📱 WhatsApp</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-black mb-1">Priority</label>
                      <select
                        value={manualTicketForm.priority}
                        onChange={(e) => setManualTicketForm(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 text-black"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-black mb-1">Category</label>
                      <select
                        value={manualTicketForm.category}
                        onChange={(e) => setManualTicketForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 text-black"
                      >
                        <option value="support">Support</option>
                        <option value="technical">Technical</option>
                        <option value="billing">Billing</option>
                        <option value="sales">Sales</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-black mb-1">Assign to Agent</label>
                    <select
                      value={manualTicketForm.assignedAgentId}
                      onChange={(e) => setManualTicketForm(prev => ({ ...prev, assignedAgentId: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 text-black"
                    >
                      <option value="">Auto-assign based on category</option>
                      {agents.filter(a => a.is_active).map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} ({agent.current_load}/{agent.max_tickets}) - {agent.expertise?.join(', ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* WhatsApp specific field */}
              {manualTicketForm.channel === 'whatsapp' && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-black mb-1">WhatsApp Business Number</label>
                  <select
                    value={manualTicketForm.whatsappNumber}
                    onChange={(e) => setManualTicketForm(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 text-black"
                  >
                    <option value="">Select WhatsApp number</option>
                    {whatsappNumbers.filter(wn => wn.is_active).map(number => (
                      <option key={number.id} value={number.number}>
                        {number.display_name} ({number.number}) - {number.categories?.join(', ')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject and Message */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-black mb-1">Subject *</label>
                  <input
                    type="text"
                    value={manualTicketForm.subject}
                    onChange={(e) => setManualTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 text-black"
                    placeholder="Brief description of the issue or request"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-black mb-1">Message/Description *</label>
                  <textarea
                    value={manualTicketForm.message}
                    onChange={(e) => setManualTicketForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 text-black"
                    placeholder="Detailed description of the customer's issue, request, or inquiry..."
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-black mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={manualTicketForm.tags}
                    onChange={(e) => setManualTicketForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 text-black"
                    placeholder="urgent, billing, follow-up, etc."
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="mb-4 p-3 bg-gray-50 rounded border">
                <h4 className="text-xs font-medium text-black mb-2">Ticket Preview:</h4>
                <div className="text-xs space-y-1">
                  <div><span className="text-gray-600">Customer:</span> <span className="font-medium text-black">{manualTicketForm.customerName || 'Not specified'}</span></div>
                  <div><span className="text-gray-600">Channel:</span> 
                    <span className="ml-1 capitalize text-black">{manualTicketForm.channel}</span>
                    {getChannelIcon(manualTicketForm.channel)}
                  </div>
                  <div><span className="text-gray-600">Priority:</span> 
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${getPriorityColor(manualTicketForm.priority)}`}>
                      {manualTicketForm.priority}
                    </span>
                  </div>
                  <div><span className="text-gray-600">Category:</span> <span className="ml-1 capitalize text-black">{manualTicketForm.category}</span></div>
                  {manualTicketForm.assignedAgentId && (() => {
                  const agent: Agent | undefined = agents.find(a => a.id === manualTicketForm.assignedAgentId);
                  return (
                  <div><span className="text-gray-600">Agent:</span> <span className="ml-1 text-black">{agent?.name}</span></div>
                  );
                  })()}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowManualTicketForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                onClick={createManualTicket}
                disabled={creatingTicket || !manualTicketForm.customerName.trim() || !manualTicketForm.subject.trim() || !manualTicketForm.message.trim()}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                <Save className="w-4 h-4" />
                <span>{creatingTicket ? 'Creating...' : 'Create Ticket'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simulate Incoming WhatsApp Message Modal */}
        {showIncomingMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-3 text-black">Simulate Incoming WhatsApp Message</h2>
              <p className="text-xs text-gray-700 mb-3">
                This simulates a customer sending a message to your WhatsApp Business number, which will automatically create a ticket and assign an agent.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-black mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={simulatedName}
                    onChange={(e) => setSimulatedName(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 text-black"
                    placeholder="Enter customer name"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-black mb-1">Customer Phone</label>
                  <input
                    type="tel"
                    value={simulatedPhone}
                    onChange={(e) => setSimulatedPhone(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 text-black"
                    placeholder="+94771234567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1">WhatsApp Business Number</label>
                  <select
                    value={simulatedWhatsAppNumber}
                    onChange={(e) => setSimulatedWhatsAppNumber(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 text-black"
                  >
                    {whatsappNumbers.filter(wn => wn.is_active).map(number => (
                      <option key={number.id} value={number.number}>
                        {number.display_name} ({number.number}) - {number.categories?.join(', ')}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-black mb-1">WhatsApp Message</label>
                  <textarea
                    value={simulatedMessage}
                    onChange={(e) => setSimulatedMessage(e.target.value)}
                    rows={3}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 text-black"
                    placeholder="Hi! I need help with my account. Can someone assist me?"
                  />
                </div>
                
                <div className="p-2 bg-green-50 rounded text-xs">
                  <p className="font-medium text-green-800 mb-1">What happens next:</p>
                  <ul className="text-green-700 space-y-1">
                    <li>• Message creates a new ticket automatically</li>
                    <li>• Ticket gets assigned to available agent</li>
                    <li>• Customer receives confirmation with ticket number</li>
                    <li>• Agent can reply and update status</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowIncomingMessage(false)}
                  className="px-3 py-1.5 text-xs text-black border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={simulateIncomingWhatsApp}
                  disabled={!simulatedMessage.trim()}
                  className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Database Info Modal */}
        {showWhatsAppSetup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 w-full max-w-lg">
              <h2 className="text-lg font-semibold mb-3 text-black">Database Integration Status</h2>
              
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded">
                  <h3 className="font-medium text-green-800 mb-2 text-sm">✅ Connected to Supabase</h3>
                  <div className="space-y-1 text-xs text-green-700">
                    <div>• Database: whatsapp-ticket-system</div>
                    <div>• Tables: agents, whatsapp_numbers, tickets, status_history, whatsapp_messages</div>
                    <div>• Real-time subscriptions: Active</div>
                    <div>• Row Level Security: Enabled</div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded">
                  <h3 className="font-medium text-blue-800 mb-2 text-sm">🔄 Real-time Features</h3>
                  <div className="space-y-1 text-xs text-blue-700">
                    <div>✓ Live ticket updates across all clients</div>
                    <div>✓ Instant message synchronization</div>
                    <div>✓ Agent status changes reflected immediately</div>
                    <div>✓ Automatic ticket assignment</div>
                    <div>✓ WhatsApp message status tracking</div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded">
                  <h3 className="font-medium text-purple-800 mb-2 text-sm">📊 Current Statistics</h3>
                  <div className="space-y-1 text-xs text-purple-700">
                    <div>• Total Tickets: {tickets.length}</div>
                    <div>• Active Agents: {activeAgents}</div>
                    <div>• WhatsApp Numbers: {whatsappNumbers.length}</div>
                    <div>• Open Tickets: {tickets.filter(t => t.status === 'open').length}</div>
                    <div>• WhatsApp Messages: {whatsappMessages.length}</div>
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 rounded">
                  <h3 className="font-medium text-yellow-800 mb-2 text-sm">⚙️ Next Steps</h3>
                  <div className="space-y-1 text-xs text-yellow-700">
                    <div>1. Connect real WhatsApp Business API</div>
                    <div>2. Set up webhook endpoints for incoming messages</div>
                    <div>3. Configure email notifications</div>
                    <div>4. Add user authentication system</div>
                    <div>5. Implement advanced reporting</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setShowWhatsAppSetup(false)}
                  className="px-3 py-1.5 text-xs text-black border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      </div>
      
      {/* Add Agent Modal */}
      <AddAgentModal
      open={showAddAgentForm}
      onClose={() => setShowAddAgentForm(false)}
      form={addAgentForm}
      setForm={setAddAgentForm}
      loading={addingAgent}
      onSubmit={handleAddAgent}
      />
      </>
      );
      }
