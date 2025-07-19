import React, { useState, useEffect } from 'react';

/**
 * @typedef {Object} Agent
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} role
 * @property {string[]} whatsapp_numbers
 * @property {boolean} is_active
 * @property {string[]} expertise
 * @property {number} current_load
 * @property {number} max_tickets
 */

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {Agent | null} props.agent
 * @param {(updated: any) => Promise<void>} props.onSave
 * @param {boolean} props.loading
 */
const EditAgentModalFull = ({ open, onClose, agent, onSave, loading }) => {
  const [form, setForm] = useState({
  name: '',
  email: '',
  role: 'agent',
  expertise: '',
  whatsappNumbers: '',
  maxTickets: 10,
  isActive: true,
  password: ''
  });

  useEffect(() => {
    if (agent) {
      setForm({
      name: agent.name || '',
      email: agent.email || '',
      role: agent.role || 'agent',
      expertise: agent.expertise ? agent.expertise.join(', ') : '',
      whatsappNumbers: agent.whatsapp_numbers ? agent.whatsapp_numbers.join(', ') : '',
      maxTickets: agent.max_tickets || 10,
      isActive: !!agent.is_active,
      password: ''
      });
    }
  }, [agent]);

  if (!open || !agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4">Edit Agent</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSave({
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
            expertise: form.expertise.split(',').map(e => e.trim()).filter(Boolean),
            whatsapp_numbers: form.whatsappNumbers.split(',').map(n => n.trim()).filter(Boolean),
            max_tickets: Number(form.maxTickets) || 10,
            is_active: !!form.isActive,
            password: form.password
            });
          }}
        >
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <input
          type="email"
          className="w-full border rounded px-2 py-1 text-sm"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          required
          readOnly
          />
          </div>
          <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Password (required to confirm changes)</label>
          <input
          type="password"
          className="w-full border rounded px-2 py-1 text-sm"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          required
          />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
            >
              <option value="agent">Agent</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Expertise (comma separated)</label>
            <input
              type="text"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.expertise}
              onChange={e => setForm({ ...form, expertise: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp Numbers (comma separated)</label>
            <input
              type="text"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.whatsappNumbers}
              onChange={e => setForm({ ...form, whatsappNumbers: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Max Tickets</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.maxTickets}
              onChange={e => setForm({ ...form, maxTickets: Number(e.target.value) })}
              min={1}
            />
          </div>
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={e => setForm({ ...form, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-xs text-gray-700">Active</label>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditAgentModalFull;
