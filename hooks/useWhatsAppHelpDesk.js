// hooks/useWhatsAppHelpDesk.js
import { useState, useEffect } from 'react'
import { 
  agentsService, 
  whatsappNumbersService, 
  ticketsService, 
  statusHistoryService, 
  whatsappMessagesService,
  subscriptions 
} from '../lib/supabase'

export function useWhatsAppHelpDesk() {
  const [agents, setAgents] = useState([])
  const [whatsappNumbers, setWhatsappNumbers] = useState([])
  const [tickets, setTickets] = useState([])
  const [whatsappMessages, setWhatsappMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    const ticketSubscription = subscriptions.subscribeToTickets((payload) => {
      console.log('Ticket change:', payload)
      // Refresh tickets when changes occur
      loadTickets()
    })

    const messageSubscription = subscriptions.subscribeToMessages((payload) => {
      console.log('New message:', payload)
      // Add new message to state
      if (payload.eventType === 'INSERT') {
        setWhatsappMessages(prev => [...prev, payload.new])
      }
    })

    const agentSubscription = subscriptions.subscribeToAgents((payload) => {
      console.log('Agent change:', payload)
      // Refresh agents when changes occur
      loadAgents()
    })

    return () => {
      ticketSubscription.unsubscribe()
      messageSubscription.unsubscribe()
      agentSubscription.unsubscribe()
    }
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadAgents(),
        loadWhatsappNumbers(),
        loadTickets(),
        loadMessages()
      ])
    } catch (err) {
      setError(err.message)
      console.error('Error loading initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAgents = async () => {
    try {
      const data = await agentsService.getAll()
      setAgents(data)
    } catch (err) {
      console.error('Error loading agents:', err)
      throw err
    }
  }

  const loadWhatsappNumbers = async () => {
    try {
      const data = await whatsappNumbersService.getAll()
      setWhatsappNumbers(data)
    } catch (err) {
      console.error('Error loading WhatsApp numbers:', err)
      throw err
    }
  }

  const loadTickets = async () => {
    try {
      const data = await ticketsService.getAll()
      // Transform the data to match your component's expected format
      const transformedTickets = data.map(ticket => ({
        ...ticket,
        assignedTo: ticket.assigned_agent?.name || 'Unassigned',
        statusHistory: ticket.status_history.map(sh => ({
          status: sh.status,
          timestamp: sh.created_at,
          updatedBy: sh.updated_by,
          note: sh.note
        }))
      }))
      setTickets(transformedTickets)
    } catch (err) {
      console.error('Error loading tickets:', err)
      throw err
    }
  }

  const loadMessages = async () => {
    try {
      // For now, we'll load all messages. In production, you might want to load per ticket
      const allTickets = await ticketsService.getAll()
      let allMessages = []
      
      for (const ticket of allTickets) {
        if (ticket.channel === 'whatsapp') {
          const messages = await whatsappMessagesService.getByTicketId(ticket.id)
          allMessages = [...allMessages, ...messages]
        }
      }
      
      // Transform to match your component format
      const transformedMessages = allMessages.map(msg => ({
        id: msg.id,
        from: msg.from_number,
        to: msg.to_number,
        body: msg.body,
        timestamp: msg.created_at,
        type: msg.message_type,
        status: msg.status,
        isStatusUpdate: msg.is_status_update
      }))
      
      setWhatsappMessages(transformedMessages)
    } catch (err) {
      console.error('Error loading messages:', err)
      throw err
    }
  }

  // Helper function to get agent for assignment
  const getAgentForAssignment = (category, whatsappNumber) => {
    let eligibleAgents = agents.filter(agent => 
      agent.is_active && agent.current_load < agent.max_tickets
    )

    if (whatsappNumber) {
      const waAgents = eligibleAgents.filter(agent => 
        agent.whatsapp_numbers.includes(whatsappNumber)
      )
      if (waAgents.length > 0) {
        eligibleAgents = waAgents
      }
    }

    if (eligibleAgents.length === 0) {
      return agents.find(agent => agent.is_active && agent.current_load < agent.max_tickets)
    }

    eligibleAgents.sort((a, b) => a.current_load - b.current_load)
    
    const expertAgents = eligibleAgents.filter(agent => 
      agent.expertise.includes(category)
    )

    return expertAgents.length > 0 ? expertAgents[0] : eligibleAgents[0]
  }

  // Create manual ticket
  const createManualTicket = async (ticketForm) => {
    try {
      const ticketId = await ticketsService.getNextTicketNumber()
      const currentTime = new Date().toISOString()
      
      const assignedAgent = ticketForm.assignedAgentId 
        ? agents.find(a => a.id === ticketForm.assignedAgentId)
        : getAgentForAssignment(ticketForm.category, ticketForm.whatsappNumber || undefined)

      const newTicket = {
        id: ticketId,
        customer_name: ticketForm.customerName,
        customer_phone: ticketForm.customerPhone || 'Not provided',
        customer_email: ticketForm.customerEmail || null,
        subject: ticketForm.subject,
        message: ticketForm.message,
        status: 'open',
        priority: ticketForm.priority,
        category: ticketForm.category,
        assigned_to: assignedAgent?.name || 'Unassigned',
        assigned_agent_id: assignedAgent?.id || null,
        channel: ticketForm.channel,
        whatsapp_number: ticketForm.whatsappNumber || null,
        tags: ticketForm.tags ? ticketForm.tags.split(',').map(tag => tag.trim()) : ['manual-entry']
      }

      // Create ticket in database
      const createdTicket = await ticketsService.create(newTicket)

      // Add status history
      await statusHistoryService.add(
        ticketId,
        'open',
        'Manual Entry',
        assignedAgent ? `Manually created and assigned to ${assignedAgent.name}` : 'Manually created - no agent assigned'
      )

      // Update agent load if assigned
      if (assignedAgent) {
        await agentsService.update(assignedAgent.id, {
          current_load: assignedAgent.current_load + 1
        })
      }

      // Send WhatsApp notification if applicable
      if (ticketForm.channel === 'whatsapp' && ticketForm.customerPhone && ticketForm.whatsappNumber) {
        const notificationMessage = {
          id: `manual_notification_${Date.now()}`,
          ticket_id: ticketId,
          from_number: ticketForm.whatsappNumber,
          to_number: ticketForm.customerPhone,
          body: `🎫 Hello ${ticketForm.customerName}! A support ticket ${ticketId} has been created for you${assignedAgent ? ` and assigned to ${assignedAgent.name}` : ''}. We'll be in touch soon regarding: ${ticketForm.subject}`,
          message_type: 'outgoing',
          status: 'sent',
          is_status_update: true
        }

        await whatsappMessagesService.add(notificationMessage)
      }

      // Refresh data
      await loadTickets()
      await loadAgents()

      return createdTicket
    } catch (err) {
      console.error('Error creating manual ticket:', err)
      throw err
    }
  }

  // Create ticket from WhatsApp message
  const createTicketFromWhatsApp = async (incomingMessage, customerName, whatsappNumber) => {
    try {
      const ticketId = await ticketsService.getNextTicketNumber()
      
      const waNumber = whatsappNumbers.find(wn => wn.number === whatsappNumber)
      const category = waNumber?.categories[0] || 'support'
      
      const assignedAgent = getAgentForAssignment(category, whatsappNumber)
      
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
      }

      // Create ticket
      const createdTicket = await ticketsService.create(newTicket)

      // Add incoming message
      const messageData = {
        id: incomingMessage.id,
        ticket_id: ticketId,
        from_number: incomingMessage.from,
        to_number: incomingMessage.to,
        body: incomingMessage.body,
        message_type: 'incoming'
      }
      await whatsappMessagesService.add(messageData)

      // Add status history
      await statusHistoryService.add(
        ticketId,
        'open',
        'System',
        assignedAgent ? `Auto-assigned to ${assignedAgent.name}` : 'No agents available for assignment'
      )

      // Update agent load
      if (assignedAgent) {
        await agentsService.update(assignedAgent.id, {
          current_load: assignedAgent.current_load + 1
        })
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
      }

      await whatsappMessagesService.add(autoReply)

      // Refresh data
      await loadTickets()
      await loadAgents()
      await loadMessages()

      return createdTicket
    } catch (err) {
      console.error('Error creating ticket from WhatsApp:', err)
      throw err
    }
  }

  // Update ticket status
  const updateTicketStatus = async (ticketId, newStatus, note = '') => {
    try {
      const ticket = tickets.find(t => t.id === ticketId)
      if (!ticket) return

      // Update ticket
      await ticketsService.update(ticketId, { status: newStatus })

      // Add status history
      await statusHistoryService.add(ticketId, newStatus, ticket.assignedTo || 'System', note || `Status updated to ${newStatus}`)

      // Send WhatsApp status update if applicable
      if (ticket.channel === 'whatsapp' && newStatus !== 'open') {
        const statusMessages = {
          'in-progress': `🔄 Your ticket ${ticketId} is now being worked on by ${ticket.assignedTo}. We'll keep you updated on the progress.`,
          'resolved': `✅ Good news! Your ticket ${ticketId} has been resolved by ${ticket.assignedTo}. Please let us know if you need any further assistance.`,
          'closed': `📝 Your ticket ${ticketId} has been closed. Thank you for contacting us. Feel free to reach out if you have any other questions.`
        }

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
          }

          await whatsappMessagesService.add(statusUpdateMessage)
        }
      }

      // Refresh data
      await loadTickets()
      await loadMessages()
    } catch (err) {
      console.error('Error updating ticket status:', err)
      throw err
    }
  }

  // Reassign ticket
  const reassignTicket = async (ticketId, newAgentId) => {
    try {
      const newAgent = agents.find(a => a.id === newAgentId)
      if (!newAgent) return

      const oldTicket = tickets.find(t => t.id === ticketId)
      const oldAgent = agents.find(a => a.id === oldTicket?.assigned_agent_id)

      // Update ticket
      await ticketsService.update(ticketId, {
        assigned_to: newAgent.name,
        assigned_agent_id: newAgentId
      })

      // Add status history
      await statusHistoryService.add(ticketId, oldTicket.status, 'System', `Reassigned to ${newAgent.name}`)

      // Update agent loads
      if (oldAgent) {
        await agentsService.update(oldAgent.id, {
          current_load: Math.max(0, oldAgent.current_load - 1)
        })
      }

      await agentsService.update(newAgentId, {
        current_load: newAgent.current_load + 1
      })

      // Refresh data
      await loadTickets()
      await loadAgents()
    } catch (err) {
      console.error('Error reassigning ticket:', err)
      throw err
    }
  }

  // Send WhatsApp reply
  const sendWhatsAppReply = async (ticketId, message) => {
    try {
      const ticket = tickets.find(t => t.id === ticketId)
      if (!ticket || ticket.channel !== 'whatsapp') return

      const newMessage = {
        id: `msg_${Date.now()}`,
        ticket_id: ticketId,
        from_number: ticket.whatsapp_number || '+94772776151',
        to_number: ticket.customer_phone,
        body: message,
        message_type: 'outgoing',
        status: 'sent',
        is_status_update: false
      }

      await whatsappMessagesService.add(newMessage)

      // Simulate delivery status updates
      setTimeout(async () => {
        await whatsappMessagesService.updateStatus(newMessage.id, 'delivered')
        await loadMessages()
      }, 1000)

      setTimeout(async () => {
        await whatsappMessagesService.updateStatus(newMessage.id, 'read')
        await loadMessages()
      }, 3000)

      await loadMessages()
    } catch (err) {
      console.error('Error sending WhatsApp reply:', err)
      throw err
    }
  }

  // Update agent
  const updateAgent = async (agentId, updates) => {
    try {
      await agentsService.update(agentId, updates)
      await loadAgents()
    } catch (err) {
      console.error('Error updating agent:', err)
      throw err
    }
  }

  // Create new agent
  const createAgent = async (agentData) => {
    try {
      await agentsService.create(agentData)
      await loadAgents()
    } catch (err) {
      console.error('Error creating agent:', err)
      throw err
    }
  }

  // Update WhatsApp number
  const updateWhatsAppNumber = async (numberId, updates) => {
    try {
      await whatsappNumbersService.update(numberId, updates)
      await loadWhatsappNumbers()
    } catch (err) {
      console.error('Error updating WhatsApp number:', err)
      throw err
    }
  }

  // Get messages for specific ticket
  const getMessagesForTicket = async (ticketId) => {
    try {
      const messages = await whatsappMessagesService.getByTicketId(ticketId)
      return messages.map(msg => ({
        id: msg.id,
        from: msg.from_number,
        to: msg.to_number,
        body: msg.body,
        timestamp: msg.created_at,
        type: msg.message_type,
        status: msg.status,
        isStatusUpdate: msg.is_status_update
      }))
    } catch (err) {
      console.error('Error getting messages for ticket:', err)
      throw err
    }
  }

  return {
    // State
    agents,
    whatsappNumbers,
    tickets,
    whatsappMessages,
    loading,
    error,

    // Actions
    createManualTicket,
    createTicketFromWhatsApp,
    updateTicketStatus,
    reassignTicket,
    sendWhatsAppReply,
    updateAgent,
    createAgent,
    updateWhatsAppNumber,
    getMessagesForTicket,

    // Refresh functions
    loadAgents,
    loadWhatsappNumbers,
    loadTickets,
    loadMessages,
    loadInitialData
  }
}