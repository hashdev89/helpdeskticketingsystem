"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bot, 
  MessageSquare, 
  Clock, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Users,
  TrendingUp,
  Globe,
  Image as ImageIcon,
  FileText,
  Smartphone,
  Mail,
  Phone,
  Calendar,
  Sun,
  Moon,
  Activity,
  Tag
} from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';
import { supabase } from '../../lib/supabase';
import { whatsappNumbersService } from '../../lib/supabase';

interface AutoReplyRule {
  id: string;
  name: string;
  keywords: string[];
  response: string;
  enabled: boolean;
  priority: number;
  category: 'greeting' | 'support' | 'sales' | 'billing' | 'custom';
  media_url?: string;
  created_at?: string;
}

interface BusinessHours {
  enabled: boolean;
  timezone: string;
  monday: { open: string; close: string; enabled: boolean };
  tuesday: { open: string; close: string; enabled: boolean };
  wednesday: { open: string; close: string; enabled: boolean };
  thursday: { open: string; close: string; enabled: boolean };
  friday: { open: string; close: string; enabled: boolean };
  saturday: { open: string; close: string; enabled: boolean };
  sunday: { open: string; close: string; enabled: boolean };
  after_hours_message: string;
}

interface LeadQualification {
  enabled: boolean;
  questions: Array<{
    id: string;
    question: string;
    type: 'text' | 'number' | 'choice';
    options?: string[];
    required: boolean;
  }>;
  auto_assign: boolean;
  assign_to_agent_id?: string;
}

export default function AutomatedAgentsPage() {
  const { showSuccess, showError } = useNotification();
  
  const [activeTab, setActiveTab] = useState<'rules' | 'hours' | 'qualification' | 'analytics'>('rules');
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [whatsappNumbers, setWhatsappNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    enabled: false,
    timezone: 'Asia/Colombo',
    monday: { open: '09:00', close: '18:00', enabled: true },
    tuesday: { open: '09:00', close: '18:00', enabled: true },
    wednesday: { open: '09:00', close: '18:00', enabled: true },
    thursday: { open: '09:00', close: '18:00', enabled: true },
    friday: { open: '09:00', close: '18:00', enabled: true },
    saturday: { open: '09:00', close: '13:00', enabled: true },
    sunday: { open: '00:00', close: '00:00', enabled: false },
    after_hours_message: 'Thank you for contacting us! We are currently closed. Our business hours are Monday-Friday 9 AM - 6 PM. We will get back to you as soon as we open.'
  });

  const [leadQualification, setLeadQualification] = useState<LeadQualification>({
    enabled: false,
    questions: [],
    auto_assign: false
  });

  const [newRule, setNewRule] = useState<Partial<AutoReplyRule>>({
    name: '',
    keywords: [],
    response: '',
    enabled: true,
    priority: 1,
    category: 'custom'
  });

  const [keywordInput, setKeywordInput] = useState('');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesData, numbersData] = await Promise.all([
        loadAutoReplyRules(),
        whatsappNumbersService.getAll()
      ]);
      setRules(rulesData);
      setWhatsappNumbers(numbersData);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load data', 'Please try again later');
    } finally {
      setLoading(false);
    }
  };

  const loadAutoReplyRules = async (): Promise<AutoReplyRule[]> => {
    try {
      // Check if table exists, if not return empty array
      const { data, error } = await (supabase as any)
        .from('auto_reply_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error && error.code === '42P01') {
        // Table doesn't exist, return empty array
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error loading auto reply rules:', error);
      return [];
    }
  };

  const handleSaveRule = async () => {
    try {
      if (!newRule.name || !newRule.response || !newRule.keywords || newRule.keywords.length === 0) {
        showError('Validation Error', 'Please fill in all required fields');
        return;
      }

      const ruleData = {
        ...newRule,
        keywords: newRule.keywords,
        id: editingRule?.id || `rule_${Date.now()}`,
        created_at: editingRule?.created_at || new Date().toISOString()
      };

      if (editingRule) {
        // Update existing rule
        const { error } = await (supabase as any)
          .from('auto_reply_rules')
          .update(ruleData)
          .eq('id', editingRule.id);

        if (error) throw error;
        showSuccess('Rule Updated', 'Auto-reply rule has been updated successfully');
      } else {
        // Create new rule
        const { error } = await (supabase as any)
          .from('auto_reply_rules')
          .insert([ruleData]);

        if (error) throw error;
        showSuccess('Rule Created', 'Auto-reply rule has been created successfully');
      }

      setShowRuleModal(false);
      setEditingRule(null);
      setNewRule({
        name: '',
        keywords: [],
        response: '',
        enabled: true,
        priority: 1,
        category: 'custom'
      });
      setKeywordInput('');
      loadData();
    } catch (error: any) {
      console.error('Error saving rule:', error);
      showError('Save Failed', error.message || 'Failed to save rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const { error } = await (supabase as any)
        .from('auto_reply_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess('Rule Deleted', 'Auto-reply rule has been deleted');
      loadData();
    } catch (error: any) {
      showError('Delete Failed', error.message || 'Failed to delete rule');
    }
  };

  const handleToggleRule = async (rule: AutoReplyRule) => {
    try {
      const { error } = await (supabase as any)
        .from('auto_reply_rules')
        .update({ enabled: !rule.enabled })
        .eq('id', rule.id);

      if (error) throw error;
      showSuccess('Rule Updated', `Rule ${!rule.enabled ? 'enabled' : 'disabled'}`);
      loadData();
    } catch (error: any) {
      showError('Update Failed', error.message || 'Failed to update rule');
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !newRule.keywords?.includes(keywordInput.trim().toLowerCase())) {
      setNewRule({
        ...newRule,
        keywords: [...(newRule.keywords || []), keywordInput.trim().toLowerCase()]
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setNewRule({
      ...newRule,
      keywords: newRule.keywords?.filter(k => k !== keyword) || []
    });
  };

  const openEditModal = (rule: AutoReplyRule) => {
    setEditingRule(rule);
    setNewRule(rule);
    setKeywordInput('');
    setShowRuleModal(true);
  };

  const openNewModal = () => {
    setEditingRule(null);
    setNewRule({
      name: '',
      keywords: [],
      response: '',
      enabled: true,
      priority: 1,
      category: 'custom'
    });
    setKeywordInput('');
    setShowRuleModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading Automated Agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Automated Agents</h1>
                <p className="text-sm text-gray-500">Configure AI-powered automated responses</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">24/7 Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'rules', label: 'Auto-Reply Rules', icon: MessageSquare },
              { id: 'hours', label: 'Business Hours', icon: Clock },
              { id: 'qualification', label: 'Lead Qualification', icon: Users },
              { id: 'analytics', label: 'Analytics', icon: Activity }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'rules' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Rules</p>
                    <p className="text-2xl font-bold text-gray-900">{rules.length}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Rules</p>
                    <p className="text-2xl font-bold text-green-600">{rules.filter(r => r.enabled).length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Categories</p>
                    <p className="text-2xl font-bold text-gray-900">{new Set(rules.map(r => r.category)).size}</p>
                  </div>
                  <Tag className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">WhatsApp Numbers</p>
                    <p className="text-2xl font-bold text-gray-900">{whatsappNumbers.length}</p>
                  </div>
                  <Smartphone className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </div>

            {/* Rules List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Auto-Reply Rules</h2>
                <button
                  onClick={openNewModal}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Rule</span>
                </button>
              </div>

              <div className="divide-y divide-gray-200">
                {rules.length === 0 ? (
                  <div className="p-12 text-center">
                    <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No auto-reply rules configured yet</p>
                    <button
                      onClick={openNewModal}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create Your First Rule
                    </button>
                  </div>
                ) : (
                  rules.map(rule => (
                    <div key={rule.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              rule.enabled 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {rule.enabled ? 'Active' : 'Inactive'}
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
                              {rule.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{rule.response}</p>
                          <div className="flex flex-wrap gap-2">
                            {rule.keywords.map(keyword => (
                              <span
                                key={keyword}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleToggleRule(rule)}
                            className={`p-2 rounded-lg transition-colors ${
                              rule.enabled
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title={rule.enabled ? 'Disable' : 'Enable'}
                          >
                            {rule.enabled ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => openEditModal(rule)}
                            className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hours' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Business Hours Configuration</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Enable Business Hours</p>
                  <p className="text-sm text-gray-500">Send automated message when outside business hours</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={businessHours.enabled}
                    onChange={(e) => setBusinessHours({ ...businessHours, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {businessHours.enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map(day => {
                      const getDayConfig = (d: typeof day): { open: string; close: string; enabled: boolean } => {
                        switch (d) {
                          case 'monday': return businessHours.monday;
                          case 'tuesday': return businessHours.tuesday;
                          case 'wednesday': return businessHours.wednesday;
                          case 'thursday': return businessHours.thursday;
                          case 'friday': return businessHours.friday;
                          case 'saturday': return businessHours.saturday;
                          case 'sunday': return businessHours.sunday;
                        }
                      };
                      
                      const dayConfig = getDayConfig(day);
                      
                      const updateDayConfig = (updates: Partial<{ open: string; close: string; enabled: boolean }>) => {
                        const newConfig = { ...dayConfig, ...updates };
                        setBusinessHours({
                          ...businessHours,
                          [day]: newConfig
                        } as BusinessHours);
                      };
                      
                      return (
                        <div key={day} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={dayConfig.enabled}
                                onChange={(e) => updateDayConfig({ enabled: e.target.checked })}
                                className="rounded"
                              />
                              <span className="font-medium capitalize">{day}</span>
                            </label>
                          </div>
                          {dayConfig.enabled && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="time"
                                value={dayConfig.open}
                                onChange={(e) => updateDayConfig({ open: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                              />
                              <span className="text-gray-500">to</span>
                              <input
                                type="time"
                                value={dayConfig.close}
                                onChange={(e) => updateDayConfig({ close: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      After Hours Message
                    </label>
                    <textarea
                      value={businessHours.after_hours_message}
                      onChange={(e) => setBusinessHours({ ...businessHours, after_hours_message: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Message to send when outside business hours..."
                    />
                  </div>

                  <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Save Business Hours
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'qualification' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Lead Qualification Automation</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Enable Lead Qualification</p>
                  <p className="text-sm text-gray-500">Automatically qualify leads with custom questions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={leadQualification.enabled}
                    onChange={(e) => setLeadQualification({ ...leadQualification, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {leadQualification.enabled && (
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-4">Qualification Questions</h3>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Add Question
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-4">Auto-Assignment</h3>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={leadQualification.auto_assign}
                        onChange={(e) => setLeadQualification({ ...leadQualification, auto_assign: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Automatically assign qualified leads to agent</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Automation Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Auto-Replies Sent</p>
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>
              <div className="p-6 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Leads Qualified</p>
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>
              <div className="p-6 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Response Rate</p>
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">0%</p>
                <p className="text-xs text-gray-500 mt-1">Average response time</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRule ? 'Edit Auto-Reply Rule' : 'Create Auto-Reply Rule'}
              </h2>
              <button
                onClick={() => {
                  setShowRuleModal(false);
                  setEditingRule(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={newRule.name || ''}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Greeting Response"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newRule.category || 'custom'}
                  onChange={(e) => setNewRule({ ...newRule, category: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="greeting">Greeting</option>
                  <option value="support">Support</option>
                  <option value="sales">Sales</option>
                  <option value="billing">Billing</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords * (comma-separated or one per line)
                </label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter keyword and press Enter"
                  />
                  <button
                    onClick={addKeyword}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newRule.keywords?.map(keyword => (
                    <span
                      key={keyword}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-2"
                    >
                      <span>{keyword}</span>
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Message *
                </label>
                <textarea
                  value={newRule.response || ''}
                  onChange={(e) => setNewRule({ ...newRule, response: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter the automated response message..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newRule.priority || 1}
                    onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    checked={newRule.enabled !== false}
                    onChange={(e) => setNewRule({ ...newRule, enabled: e.target.checked })}
                    className="rounded"
                  />
                  <label className="text-sm text-gray-700">Enable this rule</label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowRuleModal(false);
                    setEditingRule(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRule}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

