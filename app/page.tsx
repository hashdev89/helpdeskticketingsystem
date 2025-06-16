"use client"

import React, { useState, useEffect } from 'react';
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
  FileText
} from 'lucide-react';

// Type definitions
interface WhatsAppNumber {
  id: string;
  number: string;
  displayName: string;
  isActive: boolean;
  assignedAgentId: string;
  categories: string[];
  businessHours: string;
  autoReplyEnabled: boolean;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  whatsappNumbers: string[];
  isActive: boolean;
  expertise: string[];
  currentLoad: number;
  maxTickets: number;
}

interface StatusHistoryItem {
  status: string;
  timestamp: string;
  updatedBy: string;
  note: string;
}

interface Ticket {
  id: string;
  customerName: string;
  customerPhone: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  category: string;
  assignedTo: string;
  assignedAgentId: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  channel: string;
  whatsappNumber: string;
  statusHistory: StatusHistoryItem[];
}

interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: string;
  type: string;
  status?: string;
  isStatusUpdate?: boolean;
}

export default function WhatsAppHelpDesk() {
  // Client-side only flag to prevent hydration issues
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  // Mock data
  const [whatsappNumbers] = useState<WhatsAppNumber[]>([
    {
      id: 'wa1',
      number: '+94772776151',
      displayName: 'Main Support',
      isActive: true,
      assignedAgentId: 'agent1',
      categories: ['support', 'technical'],
      businessHours: '9:00 AM - 6:00 PM LKT',
      autoReplyEnabled: true
    },
    {
      id: 'wa2',
      number: '+1234567891',
      displayName: 'Sales Team',
      isActive: true,
      assignedAgentId: 'agent2',
      categories: ['sales'],
      businessHours: '8:00 AM - 8:00 PM EST',
      autoReplyEnabled: true
    },
    {
      id: 'wa3',
      number: '+1234567892',
      displayName: 'Billing Support',
      isActive: true,
      assignedAgentId: 'agent3',
      categories: ['billing'],
      businessHours: '9:00 AM - 5:00 PM EST',
      autoReplyEnabled: true
    }
  ]);

  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'agent1',
      name: 'John Smith',
      email: 'john@company.com',
      role: 'agent',
      whatsappNumbers: ['+94772776151', '+1234567892'],
      isActive: true,
      expertise: ['technical', 'billing'],
      currentLoad: 3,
      maxTickets: 10
    },
    {
      id: 'agent2',
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      role: 'supervisor',
      whatsappNumbers: ['+1234567891'],
      isActive: true,
      expertise: ['sales', 'support'],
      currentLoad: 2,
      maxTickets: 8
    },
    {
      id: 'agent3',
      name: 'Mike Davis',
      email: 'mike@company.com',
      role: 'agent',
      whatsappNumbers: ['+1234567892'],
      isActive: true,
      expertise: ['billing', 'support'],
      currentLoad: 1,
      maxTickets: 12
    }
  ]);

  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'TKT-001',
      customerName: 'Alice Cooper',
      customerPhone: '+94771234567',
      subject: 'WhatsApp: Login Issues',
      message: 'Hi! I cannot access my account after the recent update. Can you help me?',
      status: 'open',
      priority: 'high',
      category: 'technical',
      assignedTo: 'John Smith',
      assignedAgentId: 'agent1',
      createdAt: '2024-06-14T10:30:00Z',
      updatedAt: '2024-06-14T10:30:00Z',
      tags: ['login', 'urgent', 'whatsapp'],
      channel: 'whatsapp',
      whatsappNumber: '+94772776151',
      statusHistory: [
        { status: 'open', timestamp: '2024-06-14T10:30:00Z', updatedBy: 'System', note: 'Auto-assigned to John Smith' }
      ]
    },
    {
      id: 'TKT-002',
      customerName: 'Bob Wilson',
      customerPhone: '+1234567891',
      subject: 'WhatsApp: Billing Question',
      message: 'Hello, I was charged twice for my subscription this month. Please check my account.',
      status: 'in-progress',
      priority: 'medium',
      category: 'billing',
      assignedTo: 'Mike Davis',
      assignedAgentId: 'agent3',
      createdAt: '2024-06-14T09:15:00Z',
      updatedAt: '2024-06-14T11:20:00Z',
      tags: ['billing', 'duplicate-charge', 'whatsapp'],
      channel: 'whatsapp',
      whatsappNumber: '+1234567892',
      statusHistory: [
        { status: 'open', timestamp: '2024-06-14T09:15:00Z', updatedBy: 'System', note: 'Auto-assigned to Mike Davis' },
        { status: 'in-progress', timestamp: '2024-06-14T11:20:00Z', updatedBy: 'Mike Davis', note: 'Investigating billing issue' }
      ]
    }
  ]);

  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>([
    {
      id: 'msg1',
      from: '+94771234567',
      to: '+94772776151',
      body: 'Hi! I cannot access my account after the recent update. Can you help me?',
      timestamp: '2024-06-14T10:30:00Z',
      type: 'incoming'
    },
    {
      id: 'auto_reply_1',
      from: '+94772776151',
      to: '+94771234567',
      body: '🎫 Thank you for contacting us! Your support ticket TKT-001 has been created and assigned to John Smith.',
      timestamp: '2024-06-14T10:31:00Z',
      type: 'outgoing',
      status: 'read',
      isStatusUpdate: true
    }
  ]);

  // State management
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(tickets[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [replyMessage, setReplyMessage] = useState('');
  const [currentView, setCurrentView] = useState('tickets');
  const [showIncomingMessage, setShowIncomingMessage] = useState(false);

  const [showWhatsAppSetup, setShowWhatsAppSetup] = useState(false);
  const [showManualTicketForm, setShowManualTicketForm] = useState(false);
  
  // Simulation state
  const [simulatedMessage, setSimulatedMessage] = useState('');
  const [simulatedPhone, setSimulatedPhone] = useState('+94771234567');
  const [simulatedName, setSimulatedName] = useState('Customer Name');
  const [simulatedWhatsAppNumber, setSimulatedWhatsAppNumber] = useState('+94772776151');

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

  // Helper functions
  const getAgentForAssignment = (category: string, whatsappNumber?: string): Agent | undefined => {
    let eligibleAgents = agents.filter(agent => 
      agent.isActive && agent.currentLoad < agent.maxTickets
    );

    // If WhatsApp number specified, prefer agents assigned to that number
    if (whatsappNumber) {
      const waAgents = eligibleAgents.filter(agent => 
        agent.whatsappNumbers.includes(whatsappNumber)
      );
      if (waAgents.length > 0) {
        eligibleAgents = waAgents;
      }
    }

    if (eligibleAgents.length === 0) {
      return agents.find(agent => agent.isActive && agent.currentLoad < agent.maxTickets);
    }

    eligibleAgents.sort((a, b) => a.currentLoad - b.currentLoad);
    
    const expertAgents = eligibleAgents.filter(agent => 
      agent.expertise.includes(category)
    );

    return expertAgents.length > 0 ? expertAgents[0] : eligibleAgents[0];
  };

  const createManualTicket = () => {
    if (!manualTicketForm.customerName.trim() || !manualTicketForm.subject.trim() || !manualTicketForm.message.trim()) {
      alert('Please fill in all required fields (Customer Name, Subject, Message)');
      return;
    }

    const ticketId = `TKT-${String(Date.now()).slice(-6)}`;
    const currentTime = new Date().toISOString();
    const assignedAgent = manualTicketForm.assignedAgentId 
      ? agents.find(a => a.id === manualTicketForm.assignedAgentId)
      : getAgentForAssignment(manualTicketForm.category, manualTicketForm.whatsappNumber || undefined);

    const newTicket: Ticket = {
      id: ticketId,
      customerName: manualTicketForm.customerName,
      customerPhone: manualTicketForm.customerPhone || 'Not provided',
      subject: manualTicketForm.subject,
      message: manualTicketForm.message,
      status: 'open',
      priority: manualTicketForm.priority,
      category: manualTicketForm.category,
      assignedTo: assignedAgent?.name || 'Unassigned',
      assignedAgentId: assignedAgent?.id || 'unassigned',
      createdAt: currentTime,
      updatedAt: currentTime,
      tags: manualTicketForm.tags ? manualTicketForm.tags.split(',').map(tag => tag.trim()) : ['manual-entry'],
      channel: manualTicketForm.channel,
      whatsappNumber: manualTicketForm.whatsappNumber || '',
      statusHistory: [
        { 
          status: 'open', 
          timestamp: currentTime, 
          updatedBy: 'Manual Entry', 
          note: assignedAgent ? `Manually created and assigned to ${assignedAgent.name}` : 'Manually created - no agent assigned'
        }
      ]
    };

    if (assignedAgent) {
      setAgents(prev => prev.map(agent => 
        agent.id === assignedAgent.id 
          ? { ...agent, currentLoad: agent.currentLoad + 1 }
          : agent
      ));
    }

    setTickets(prev => [newTicket, ...prev]);
    setSelectedTicket(newTicket);
    setShowManualTicketForm(false);

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

    // If it's a WhatsApp ticket, optionally send a notification
    if (manualTicketForm.channel === 'whatsapp' && manualTicketForm.customerPhone && manualTicketForm.whatsappNumber) {
      const notificationMessage: WhatsAppMessage = {
        id: `manual_notification_${String(Date.now())}`,
        from: manualTicketForm.whatsappNumber,
        to: manualTicketForm.customerPhone,
        body: `🎫 Hello ${manualTicketForm.customerName}! A support ticket ${ticketId} has been created for you${assignedAgent ? ` and assigned to ${assignedAgent.name}` : ''}. We'll be in touch soon regarding: ${manualTicketForm.subject}`,
        timestamp: currentTime,
        type: 'outgoing',
        status: 'sent',
        isStatusUpdate: true
      };

      setWhatsappMessages(prev => [...prev, notificationMessage]);
    }
  };

  const createTicketFromWhatsApp = (incomingMessage: WhatsAppMessage, customerName: string, whatsappNumber: string): Ticket => {
    const ticketId = `TKT-${String(Date.now()).slice(-6)}`;
    
    const waNumber = whatsappNumbers.find(wn => wn.number === whatsappNumber);
    const category = waNumber?.categories[0] || 'support';
    
    const assignedAgent = getAgentForAssignment(category, whatsappNumber);
    
    const newTicket: Ticket = {
      id: ticketId,
      customerName: customerName,
      customerPhone: incomingMessage.from,
      subject: `WhatsApp: ${category.charAt(0).toUpperCase() + category.slice(1)} Request`,
      message: incomingMessage.body,
      status: 'open',
      priority: 'medium',
      category: category,
      assignedTo: assignedAgent?.name || 'Unassigned',
      assignedAgentId: assignedAgent?.id || 'unassigned',
      createdAt: incomingMessage.timestamp,
      updatedAt: incomingMessage.timestamp,
      tags: ['whatsapp', 'auto-created', category],
      channel: 'whatsapp',
      whatsappNumber: whatsappNumber,
      statusHistory: [
        { 
          status: 'open', 
          timestamp: incomingMessage.timestamp, 
          updatedBy: 'System', 
          note: assignedAgent ? `Auto-assigned to ${assignedAgent.name}` : 'No agents available for assignment'
        }
      ]
    };

    if (assignedAgent) {
      setAgents(prev => prev.map(agent => 
        agent.id === assignedAgent.id 
          ? { ...agent, currentLoad: agent.currentLoad + 1 }
          : agent
      ));
    }

    setTickets(prev => [newTicket, ...prev]);

    const autoReply: WhatsAppMessage = {
      id: `auto_reply_${String(Date.now())}`,
      from: whatsappNumber,
      to: incomingMessage.from,
      body: `🎫 Thank you for contacting us! Your support ticket ${ticketId} has been created${assignedAgent ? ` and assigned to ${assignedAgent.name}` : ''}. Our team will assist you shortly.`,
      timestamp: new Date().toISOString(),
      type: 'outgoing',
      status: 'sent',
      isStatusUpdate: true
    };

    setWhatsappMessages(prev => [...prev, incomingMessage, autoReply]);

    setTimeout(() => {
      setWhatsappMessages(prev => 
        prev.map(msg => 
          msg.id === autoReply.id ? { ...msg, status: 'delivered', isStatusUpdate: true } : msg
        )
      );
    }, 1000);

    setTimeout(() => {
      setWhatsappMessages(prev => 
        prev.map(msg => 
          msg.id === autoReply.id ? { ...msg, status: 'read', isStatusUpdate: true } : msg
        )
      );
    }, 2000);

    return newTicket;
  };

  const simulateIncomingWhatsApp = () => {
    if (!simulatedMessage.trim()) return;

    const currentTime = new Date().toISOString();
    const incomingMessage: WhatsAppMessage = {
      id: `incoming_${String(Date.now())}`,
      from: simulatedPhone,
      to: simulatedWhatsAppNumber,
      body: simulatedMessage,
      timestamp: currentTime,
      type: 'incoming'
    };

    const newTicket = createTicketFromWhatsApp(incomingMessage, simulatedName, simulatedWhatsAppNumber);
    
    setSimulatedMessage('');
    setShowIncomingMessage(false);
    
    setTimeout(() => {
      setSelectedTicket(newTicket);
    }, 500);
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
    const matchesAgent = filterAgent === 'all' || ticket.assignedAgentId === filterAgent;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesAgent;
  });

  const handleSendWhatsAppReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    
    const currentTime = new Date().toISOString();
    const newMessage: WhatsAppMessage = {
      id: `msg_${String(Date.now())}`,
      from: selectedTicket.whatsappNumber || '+94772776151',
      to: selectedTicket.customerPhone,
      body: replyMessage,
      timestamp: currentTime,
      type: 'outgoing',
      status: 'sent',
      isStatusUpdate: false
    };
    
    setWhatsappMessages([...whatsappMessages, newMessage]);
    setReplyMessage('');
    
    setTimeout(() => {
      setWhatsappMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'delivered', isStatusUpdate: false } : msg
        )
      );
    }, 1000);

    setTimeout(() => {
      setWhatsappMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'read', isStatusUpdate: false } : msg
        )
      );
    }, 3000);
  };

  const updateTicketStatus = (ticketId: string, newStatus: string) => {
    const note = prompt(`Update status to "${newStatus}". Add a note (optional):`);
    const currentTime = new Date().toISOString();
    
    setTickets(tickets.map(ticket => {
      if (ticket.id === ticketId) {
        const updatedTicket = {
          ...ticket,
          status: newStatus,
          updatedAt: currentTime,
          statusHistory: [
            ...ticket.statusHistory,
            {
              status: newStatus,
              timestamp: currentTime,
              updatedBy: ticket.assignedTo || 'System',
              note: note || `Status updated to ${newStatus}`
            }
          ]
        };

        // Send status update to customer
        if (ticket.channel === 'whatsapp' && newStatus !== 'open') {
          type StatusMessageKey = 'in-progress' | 'resolved' | 'closed';
          const statusMessage: Record<StatusMessageKey, string> = {
            'in-progress': `🔄 Your ticket ${ticketId} is now being worked on by ${ticket.assignedTo}. We'll keep you updated on the progress.`,
            'resolved': `✅ Good news! Your ticket ${ticketId} has been resolved by ${ticket.assignedTo}. Please let us know if you need any further assistance.`,
            'closed': `📝 Your ticket ${ticketId} has been closed. Thank you for contacting us. Feel free to reach out if you have any other questions.`
          };

          const statusUpdateMessage: WhatsAppMessage = {
            id: `status_${String(Date.now())}`,
            from: ticket.whatsappNumber || '+94772776151',
            to: ticket.customerPhone,
            body: statusMessage[newStatus as StatusMessageKey] + (note ? `\n\nNote: ${note}` : ''),
            timestamp: currentTime,
            type: 'outgoing',
            status: 'sent',
            isStatusUpdate: true
          };

          setWhatsappMessages(prev => [...prev, statusUpdateMessage]);
        }

        return updatedTicket;
      }
      return ticket;
    }));
    
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const reassignTicket = (ticketId: string, newAgentId: string) => {
    const newAgent = agents.find(a => a.id === newAgentId);
    if (!newAgent) return;

    const currentTime = new Date().toISOString();
    setTickets(tickets.map(ticket => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          assignedTo: newAgent.name,
          assignedAgentId: newAgentId,
          updatedAt: currentTime,
          statusHistory: [
            ...ticket.statusHistory,
            {
              status: ticket.status,
              timestamp: currentTime,
              updatedBy: 'System',
              note: `Reassigned to ${newAgent.name}`
            }
          ]
        };
      }
      return ticket;
    }));

    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { 
        ...prev, 
        assignedTo: newAgent.name, 
        assignedAgentId: newAgentId 
      } : null);
    }
  };

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

  const whatsappTicketsCount = tickets.filter(t => t.channel === 'whatsapp').length;
  const openWhatsappTickets = tickets.filter(t => t.channel === 'whatsapp' && t.status === 'open').length;
  const activeAgents = agents.filter(a => a.isActive).length;

  // Prevent hydration issues by not rendering until client-side
  if (!isClient) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading WhatsApp Help Desk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 text-sm flex flex-col" style={{ color: '#f1f1f1', fontFamily: 'Arial, sans-serif' }}>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-4 border-b">
            <h1 className="text-lg font-bold text-black">Indra IT Help Desk</h1>
            <p className="text-xs text-gray-800">2025 Copyrighted Indra IT</p>
            <p className="text-xs text-gray-600">Build by Hashantha Bandara</p>

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
            
            <div className="mt-4 px-3 border-t pt-3">
              <div className="text-xs font-medium text-gray-700 mb-2">Quick Actions</div>
              
              <button 
                onClick={() => setShowManualTicketForm(true)}
                className="w-full flex items-center px-3 py-2 text-left text-xs text-purple-600 hover:bg-purple-50 rounded-lg border border-purple-200 mb-2"
              >
                <FileText className="w-4 h-4 mr-2" />
                Create Ticket
              </button>
              
              <button 
                onClick={() => setShowIncomingMessage(true)}
                className="w-full flex items-center px-3 py-2 text-left text-xs text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 mb-2"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Simulate Message
              </button>
              
              <button 
                onClick={() => setShowWhatsAppSetup(true)}
                className="w-full flex items-center px-3 py-2 text-left text-xs text-black hover:bg-gray-50 rounded-lg"
              >
                <Settings className="w-4 h-4 mr-2" />
                WhatsApp Setup
              </button>
            </div>
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
                    <button 
                      onClick={() => setShowManualTicketForm(true)}
                      className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                      title="Create new ticket"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
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
                        {agents.filter(a => a.isActive).map(agent => (
                          <option key={agent.id} value={agent.id}>{agent.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Tickets */}
                <div className="overflow-y-auto h-full">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedTicket?.id === ticket.id ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(ticket.status)}
                          <span className="text-xs font-medium text-black">{ticket.id}</span>
                          {getChannelIcon(ticket.channel)}
                          {ticket.tags.includes('auto-created') && (
                            <span className="text-xs bg-green-100 text-green-600 px-1 rounded">Auto</span>
                          )}
                          {ticket.tags.includes('manual-entry') && (
                            <span className="text-xs bg-purple-100 text-purple-600 px-1 rounded">Manual</span>
                          )}
                        </div>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      
                      <h3 className="text-sm font-medium text-black mb-1">{ticket.subject}</h3>
                      <p className="text-xs text-black mb-1">{ticket.customerName}</p>
                      <p className="text-xs text-gray-700 truncate">{ticket.message}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-black">{ticket.assignedTo || 'Unassigned'}</span>
                        </div>
                        <div className="flex space-x-1">
                          {ticket.tags.slice(0, 2).map((tag) => (
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
                        {new Date(ticket.createdAt).toLocaleString()}
                      </div>
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
                              {whatsappNumbers.find(wn => wn.number === selectedTicket.whatsappNumber)?.displayName || 'WhatsApp'}
                            </span>
                          )}
                          {selectedTicket.tags.includes('manual-entry') && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                              Manual Entry
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <select
                            value={selectedTicket.assignedAgentId || ''}
                            onChange={(e) => e.target.value && reassignTicket(selectedTicket.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded text-black"
                          >
                            <option value="">Unassigned</option>
                            {agents.filter(a => a.isActive).map(agent => (
                              <option key={agent.id} value={agent.id}>
                                {agent.name} ({agent.currentLoad}/{agent.maxTickets})
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
                          <span className="font-medium text-black">{selectedTicket.customerName}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-700">Phone:</span>
                          <span className="font-medium text-black">{selectedTicket.customerPhone}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Tag className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-700">Category:</span>
                          <span className="font-medium capitalize text-black">{selectedTicket.category}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-700">Priority:</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                            {selectedTicket.priority}
                          </span>
                        </div>
                      </div>

                      {/* Agent Info */}
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-black">Assigned Agent:</span>
                            {selectedTicket.assignedAgentId ? (
                              <div className="flex items-center space-x-1">
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                  {selectedTicket.assignedTo?.charAt(0)}
                                </div>
                                <span className="text-black">{selectedTicket.assignedTo}</span>
                                <span className="text-gray-600">
                                  ({agents.find(a => a.id === selectedTicket.assignedAgentId)?.currentLoad || 0}/{agents.find(a => a.id === selectedTicket.assignedAgentId)?.maxTickets || 0} tickets)
                                </span>
                              </div>
                            ) : (
                              <span className="text-orange-600">Unassigned</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600 capitalize">{selectedTicket.channel}</span>
                            {selectedTicket.whatsappNumber && (
                              <span className="text-gray-600">via {selectedTicket.whatsappNumber}</span>
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
                                {selectedTicket.customerName.charAt(0)}
                              </div>
                              <span className="font-medium text-xs text-black">{selectedTicket.customerName}</span>
                              {getChannelIcon(selectedTicket.channel)}
                              {selectedTicket.tags.includes('manual-entry') && (
                                <span className="text-xs bg-purple-100 text-purple-600 px-1 rounded">Manual</span>
                              )}
                            </div>
                            <p className="text-sm text-black">{selectedTicket.message}</p>
                            <div className="text-xs text-gray-600 mt-1">
                              {new Date(selectedTicket.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        {/* WhatsApp messages */}
                        {selectedTicket.channel === 'whatsapp' && whatsappMessages
                          .filter(msg => msg.from === selectedTicket.customerPhone || msg.to === selectedTicket.customerPhone)
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
                                    {message.isStatusUpdate ? '🎫' : (selectedTicket.assignedTo?.charAt(0) || 'A')}
                                  </div>
                                  <span className="font-medium text-xs text-white">
                                    {message.isStatusUpdate ? 'System' : (selectedTicket.assignedTo || 'Agent')}
                                  </span>
                                  {message.isStatusUpdate && (
                                    <span className="text-xs bg-blue-400 px-1 rounded">Auto</span>
                                  )}
                                </div>
                              )}

                              {message.type === 'incoming' && (
                                <div className="flex items-center space-x-1 mb-1">
                                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                    {selectedTicket.customerName.charAt(0)}
                                  </div>
                                  <span className="font-medium text-xs text-black">{selectedTicket.customerName}</span>
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
                        {selectedTicket.channel !== 'whatsapp' && (
                          <div className="text-center py-4">
                            <div className="text-xs text-gray-500 mb-2">
                              {selectedTicket.channel === 'email' && '📧 Email conversation will appear here'}
                              {selectedTicket.channel === 'phone' && '📞 Phone call notes will appear here'}
                              {selectedTicket.channel === 'web' && '💬 Web chat messages will appear here'}
                            </div>
                            <div className="text-xs text-gray-400">
                              Use the reply section below to add notes or send responses
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Reply Section */}
                    <div className="p-4 border-t bg-white">
                      {selectedTicket.channel === 'whatsapp' ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-1 text-xs text-green-600">
                            <MessageCircle className="w-3 h-3" />
                            <span>Replying via {whatsappNumbers.find(wn => wn.number === selectedTicket.whatsappNumber)?.displayName || 'WhatsApp'} to {selectedTicket.customerPhone}</span>
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
                              {selectedTicket.channel === 'email' && `Replying via email to ${selectedTicket.customerPhone}`}
                              {selectedTicket.channel === 'phone' && 'Add phone call notes or follow-up'}
                              {selectedTicket.channel === 'web' && 'Add internal notes or web response'}
                            </span>
                          </div>
                          
                          <div className="flex space-x-3">
                            <textarea
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder={`Type your ${selectedTicket.channel} response or internal note...`}
                              className="flex-1 p-2 text-sm border border-gray-300 rounded resize-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-black"
                              rows={2}
                            />
                            <button 
                              onClick={() => {
                                if (replyMessage.trim()) {
                                  // Add internal note logic here
                                  alert('Note added to ticket (this would be saved in the database)');
                                  setReplyMessage('');
                                }
                              }}
                              disabled={!replyMessage.trim()}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                              Add Note
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
                  <h2 className="text-lg font-semibold text-black">Agents & WhatsApp Numbers</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => alert('Add Agent feature coming soon!')}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center space-x-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Add Agent</span>
                    </button>
                    <button
                      onClick={() => alert('Add WhatsApp Number feature coming soon!')}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center space-x-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Add Number</span>
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
                      <div key={agent.id} className={`p-4 border rounded-lg ${agent.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
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
                            <div className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="text-xs text-black">{agent.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700">Load:</span>
                            <span className={`font-medium ${agent.currentLoad > agent.maxTickets * 0.8 ? 'text-red-600' : 'text-black'}`}>
                              {agent.currentLoad}/{agent.maxTickets}
                            </span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                agent.currentLoad > agent.maxTickets * 0.8 ? 'bg-red-500' : 
                                agent.currentLoad > agent.maxTickets * 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min((agent.currentLoad / agent.maxTickets) * 100, 100)}%` }}
                            ></div>
                          </div>

                          <div>
                            <span className="text-gray-700">WhatsApp Numbers:</span>
                            <div className="mt-1 space-y-1">
                              {agent.whatsappNumbers.length > 0 ? (
                                agent.whatsappNumbers.map(number => (
                                  <div key={number} className="flex items-center space-x-1">
                                    <MessageCircle className="w-3 h-3 text-green-500" />
                                    <span className="font-mono text-xs text-black">{number}</span>
                                    <span className="text-gray-600">
                                      ({whatsappNumbers.find(wn => wn.number === number)?.displayName})
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
                              {agent.expertise.map(skill => (
                                <span key={skill} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex space-x-1">
                          <button
                            className="px-2 py-1 bg-gray-100 text-black text-xs rounded hover:bg-gray-200 flex items-center space-x-1"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setAgents(prev => prev.map(a => 
                                a.id === agent.id ? { ...a, isActive: !a.isActive } : a
                              ));
                            }}
                            className={`px-2 py-1 text-xs rounded flex items-center space-x-1 ${
                              agent.isActive 
                                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                            }`}
                          >
                            <Activity className="w-3 h-3" />
                            <span>{agent.isActive ? 'Deactivate' : 'Activate'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WhatsApp Numbers Section */}
                <div>
                  <h3 className="text-sm font-semibold text-black mb-3">WhatsApp Numbers ({whatsappNumbers.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {whatsappNumbers.map((number) => (
                      <div key={number.id} className={`p-4 border rounded-lg ${number.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <MessageCircle className="w-6 h-6 text-green-500" />
                            <div>
                              <h4 className="font-medium text-sm text-black">{number.displayName}</h4>
                              <span className="text-xs font-mono text-gray-700">{number.number}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${number.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="text-xs text-black">{number.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-gray-700">Assigned Agent:</span>
                            <span className="ml-1 font-medium text-black">
                              {number.assignedAgentId 
                                ? agents.find(a => a.id === number.assignedAgentId)?.name || 'Unknown'
                                : 'Unassigned'
                              }
                            </span>
                          </div>

                          <div>
                            <span className="text-gray-700">Categories:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {number.categories.map(category => (
                                <span key={category} className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded capitalize">
                                  {category}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-gray-700">Business Hours:</span>
                            <span className="ml-1 text-black">{number.businessHours}</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <span className="text-gray-700">Auto-Reply:</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                              number.autoReplyEnabled 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {number.autoReplyEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex space-x-1">
                          <button className="px-2 py-1 bg-gray-100 text-black text-xs rounded hover:bg-gray-200 flex items-center space-x-1">
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
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
                      {agents.filter(a => a.isActive).map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} ({agent.currentLoad}/{agent.maxTickets}) - {agent.expertise.join(', ')}
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
                    {whatsappNumbers.filter(wn => wn.isActive).map(number => (
                      <option key={number.id} value={number.number}>
                        {number.displayName} ({number.number}) - {number.categories.join(', ')}
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
                  {manualTicketForm.assignedAgentId && (
                    <div><span className="text-gray-600">Agent:</span> <span className="ml-1 text-black">{agents.find(a => a.id === manualTicketForm.assignedAgentId)?.name}</span></div>
                  )}
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
                  disabled={!manualTicketForm.customerName.trim() || !manualTicketForm.subject.trim() || !manualTicketForm.message.trim()}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Create Ticket</span>
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
                    {whatsappNumbers.filter(wn => wn.isActive).map(number => (
                      <option key={number.id} value={number.number}>
                        {number.displayName} ({number.number}) - {number.categories.join(', ')}
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

        {/* WhatsApp Setup Modal */}
        {showWhatsAppSetup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 w-full max-w-lg">
              <h2 className="text-lg font-semibold mb-3 text-black">WhatsApp Business API Setup</h2>
              
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded">
                  <h3 className="font-medium text-blue-800 mb-2 text-sm">Agent Assignment Rules</h3>
                  <div className="space-y-1 text-xs text-blue-700">
                    <div>1. Tickets auto-assign to agents with matching WhatsApp numbers</div>
                    <div>2. Agents with expertise in ticket category get priority</div>
                    <div>3. Least busy agents (by current load) are selected first</div>
                    <div>4. If no specialized agents available, any active agent is assigned</div>
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded">
                  <h3 className="font-medium text-green-800 mb-2 text-sm">Ticket Creation Features</h3>
                  <div className="space-y-1 text-xs text-green-700">
                    <div>✓ Manual ticket creation for all channels (Email, Phone, Web, WhatsApp)</div>
                    <div>✓ Automatic WhatsApp message processing and ticket creation</div>
                    <div>✓ Intelligent agent assignment based on expertise and workload</div>
                    <div>✓ Customer notification system with status updates</div>
                    <div>✓ Multi-channel conversation tracking</div>
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 rounded">
                  <h3 className="font-medium text-yellow-800 mb-2 text-sm">Integration Features</h3>
                  <div className="space-y-1 text-xs text-yellow-700">
                    <div>✓ Multiple WhatsApp Business numbers support</div>
                    <div>✓ Category-based routing (Sales, Billing, Support, Technical)</div>
                    <div>✓ Real-time status updates to customers</div>
                    <div>✓ Agent workload monitoring and balancing</div>
                    <div>✓ Comprehensive ticket management system</div>
                    <div>✓ Database integration for data persistence</div>
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
  );
}