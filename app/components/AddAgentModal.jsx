import React from 'react';
import { X, UserPlus, Edit } from 'lucide-react';

const AddAgentModal = ({
  open,
  onClose,
  form,
  setForm,
  loading,
  onSubmit,
  isEditing = false,
  editingAgent = null
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-black">
            {isEditing ? 'Edit Agent' : 'Add New Agent'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-black mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-black"
              placeholder="Agent name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-black mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-black"
              placeholder="agent@example.com"
            />
          </div>
          {!isEditing && (
            <div>
              <label className="block text-xs font-medium text-black mb-1">Password *</label>
              <input
                type="password"
                value={form.password || ''}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-black"
                placeholder="Password"
                required={!isEditing}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-black mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-black"
            >
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-black mb-1">Expertise (comma separated)</label>
            <input
              type="text"
              value={form.expertise}
              onChange={e => setForm(f => ({ ...f, expertise: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-black"
              placeholder="support, billing, technical"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-black mb-1">WhatsApp Numbers (comma separated)</label>
            <input
              type="text"
              value={form.whatsappNumbers}
              onChange={e => setForm(f => ({ ...f, whatsappNumbers: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-black"
              placeholder="+94771234567, +94770000000"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-black mb-1">Max Tickets</label>
            <input
              type="number"
              min={1}
              value={form.maxTickets}
              onChange={e => setForm(f => ({ ...f, maxTickets: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 text-black"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="mr-2"
              id="isActiveAgent"
            />
            <label htmlFor="isActiveAgent" className="text-xs text-black">Active</label>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading || !form.name.trim() || !form.email.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            {isEditing ? <Edit className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>
              {loading 
                ? (isEditing ? 'Updating...' : 'Adding...') 
                : (isEditing ? 'Update Agent' : 'Add Agent')
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAgentModal;