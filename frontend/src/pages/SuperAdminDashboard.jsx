import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Building, AlertTriangle, CheckCircle2, Clock, 
  RefreshCw, BarChart2, PieChart as PieIcon, MapPin, Search, ChevronRight, Tag
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category = categoryFilter;

      const [cRes, aRes] = await Promise.all([
        adminAPI.getAllComplaints(params),
        adminAPI.getAnalytics()
      ]);

      setComplaints(cRes.data);
      setAnalytics(aRes.data);
    } catch (err) {
      console.error("Failed to load super admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (c) => {
    if (!c.sla_due_at) return false;
    if (c.status === 'Resolved' || c.status === 'Closed') return false;
    return new Date() > new Date(c.sla_due_at);
  };

  const overdueCount = complaints.filter(isOverdue).length;

  const categoryData = analytics ? Object.entries(analytics.by_category).map(([name, value]) => ({ name, value })) : [];
  const priorityData = analytics ? Object.entries(analytics.by_priority).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-3">
            <Building className="w-7 h-7 text-blue-600" />
            <span>Super Admin Dashboard</span>
          </h1>
          <p className="text-sm font-semibold text-slate-600 mt-2">
            <span className="text-blue-700 font-bold">System-wide administration</span>
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-2 block">{analytics.total_complaints}</span>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted</span>
            <span className="text-2xl font-extrabold text-slate-700 mt-2 block">
              {complaints.filter(c => c.status === 'Submitted').length}
            </span>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Under Review</span>
            </span>
            <span className="text-2xl font-extrabold text-purple-700 mt-2 block">
              {complaints.filter(c => c.status === 'Under Review').length}
            </span>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>In Progress</span>
            </span>
            <span className="text-2xl font-extrabold text-blue-700 mt-2 block">{analytics.in_progress_complaints}</span>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Resolved</span>
            </span>
            <span className="text-2xl font-extrabold text-emerald-700 mt-2 block">{analytics.resolved_complaints}</span>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl shadow-sm">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Reopened</span>
            </span>
            <span className="text-2xl font-extrabold text-orange-700 mt-2 block">
              {complaints.filter(c => c.status === 'Reopened').length}
            </span>
          </div>
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl shadow-sm col-span-2 lg:col-span-1">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Overdue</span>
            </span>
            <span className="text-2xl font-extrabold text-red-700 mt-2 block">{overdueCount}</span>
          </div>
        </div>
      )}

      {/* Analytics Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <span>Complaints by Category</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center space-x-2">
            <PieIcon className="w-4 h-4 text-purple-500" />
            <span>Priority Distribution</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* All Complaints Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">All Departments Complaint Queue</h2>
            <p className="text-sm text-slate-500 mt-1">System-wide overview of all complaints.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Reopened">Reopened</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No complaints found for the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-4 px-5">Priority</th>
                  <th className="py-4 px-5">Reference & Details</th>
                  <th className="py-4 px-5">Department</th>
                  <th className="py-4 px-5">Dates & SLA</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {complaints.map((item) => {
                  const overdue = isOverdue(item);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold uppercase ${
                          ['High', 'Critical'].includes(item.priority)
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : item.priority === 'Medium'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 mb-1">
                          #{item.id} - {item.title}
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
                          <span className="inline-flex items-center"><Tag className="w-3 h-3 mr-1" />{item.category}</span>
                          <span className="inline-flex items-center"><MapPin className="w-3 h-3 mr-1" />{item.location}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap text-xs font-semibold text-slate-700">
                        Dept: {item.department_id}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap text-xs">
                        <div className="text-slate-500 mb-1">
                          <span className="font-semibold">Sub:</span> {new Date(item.created_at).toLocaleDateString()}
                        </div>
                        <div className={overdue ? 'text-red-600 font-bold' : 'text-slate-700 font-medium'}>
                          <span className="font-semibold text-slate-500">SLA:</span> {item.sla_due_at ? new Date(item.sla_due_at).toLocaleDateString() : 'N/A'}
                          {overdue && ' (Overdue)'}
                        </div>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold border ${
                          overdue 
                            ? 'bg-red-50 border-red-200 text-red-700' 
                            : ['Resolved', 'Closed'].includes(item.status)
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : item.status === 'Reopened'
                                ? 'bg-orange-50 border-orange-200 text-orange-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}>
                          {overdue ? <AlertTriangle className="w-3 h-3" /> : null}
                          <span>{item.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap text-right">
                        <button
                          onClick={() => navigate(`/admin/super/complaints/${item.id}`)}
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
