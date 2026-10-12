import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { complaintsAPI, adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Clock, CheckCircle2, AlertTriangle, 
  MapPin, Tag, FileText, Info, Building, ShieldAlert, Sparkles, FolderSync
} from 'lucide-react';

const CATEGORIES = [
  "Road / Pothole",
  "Garbage / Waste",
  "Water Supply",
  "Streetlight / Electricity",
  "Drainage",
  "Traffic Signal",
  "Public Infrastructure",
  "Other"
];

const SuperAdminComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [complaint, setComplaint] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [updateStatus, setUpdateStatus] = useState('');
  const [resolutionRemark, setResolutionRemark] = useState('');
  
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [updating, setUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, dRes] = await Promise.all([
        complaintsAPI.getById(id),
        adminAPI.getDepartments()
      ]);
      setComplaint(cRes.data);
      setDepartments(dRes.data);
      
      setUpdateStatus(cRes.data.status);
      setSelectedDepartmentId(cRes.data.department_id);
      setSelectedCategory(cRes.data.category);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        setError('Complaint not found or Access Denied.');
      } else {
        setError('Failed to load complaint details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (c) => {
    if (!c.sla_due_at) return false;
    if (c.status === 'Resolved' || c.status === 'Closed') return false;
    return new Date() > new Date(c.sla_due_at);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (updateStatus === 'Resolved' && !resolutionRemark.trim()) {
      setActionError('A resolution remark is required when marking a complaint as Resolved.');
      return;
    }

    setUpdating(true);
    setActionError('');
    setActionSuccess('');
    
    try {
      await adminAPI.updateStatus(id, updateStatus, updateStatus === 'Resolved' ? resolutionRemark : null);
      setActionSuccess('Status updated successfully.');
      if (updateStatus !== 'Resolved') setResolutionRemark('');
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (String(selectedDepartmentId) === String(complaint.department_id)) return;
    
    setUpdating(true);
    setActionError('');
    setActionSuccess('');
    
    try {
      await adminAPI.reassignDepartment(id, parseInt(selectedDepartmentId, 10));
      setActionSuccess('Department reassigned successfully.');
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to reassign department.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCorrectCategory = async (e) => {
    e.preventDefault();
    if (selectedCategory === complaint.category) return;
    
    setUpdating(true);
    setActionError('');
    setActionSuccess('');
    
    try {
      await adminAPI.correctCategory(id, selectedCategory);
      setActionSuccess('Category corrected successfully.');
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to correct category.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status, overdue) => {
    if (overdue) {
      return <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700 border border-red-200"><AlertTriangle className="w-4 h-4" /><span>Overdue</span></span>;
    }
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircle2 className="w-4 h-4" /><span>{status}</span></span>;
      case 'In Progress':
        return <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-700 border border-blue-200"><Clock className="w-4 h-4" /><span>In Progress</span></span>;
      case 'Under Review':
        return <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-700 border border-purple-200"><Clock className="w-4 h-4" /><span>Under Review</span></span>;
      case 'Reopened':
        return <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-700 border border-orange-200"><AlertTriangle className="w-4 h-4" /><span>Reopened</span></span>;
      default:
        return <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-700 border border-slate-200"><FileText className="w-4 h-4" /><span>{status}</span></span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <button
          onClick={() => navigate('/admin/super')}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    );
  }

  const overdue = isOverdue(complaint);
  const aiCategory = complaint.predicted_category || "N/A";
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => navigate('/admin/super')}
        className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Super Admin Dashboard</span>
      </button>

      {actionSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center space-x-2 font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center space-x-2 font-medium">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Complaint Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-6">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Ref ID: #{complaint.id}</span>
                  {getStatusBadge(complaint.status, overdue)}
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">{complaint.title}</h1>
                <p className="text-sm text-slate-500 mt-2">
                  Submitted by: <span className="font-semibold text-slate-700">{complaint.user_name || 'Citizen'}</span> ({complaint.user_email})
                </p>
              </div>
            </div>

            <div className="prose prose-slate max-w-none mb-8 text-slate-700">
              <p className="whitespace-pre-wrap">{complaint.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-slate-500 mb-1">
                  <Tag className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Category (Final)</span>
                </div>
                <p className="font-medium text-slate-900">{complaint.category}</p>
                <p className="text-xs text-blue-600 mt-1 font-medium"><Sparkles className="w-3 h-3 inline mr-1" />AI Suggested: {aiCategory}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-slate-500 mb-1">
                  <Building className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Department</span>
                </div>
                <p className="font-medium text-slate-900">
                  {departments.find(d => d.id === complaint.department_id)?.name || `Dept ID: ${complaint.department_id}`}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-slate-500 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Location</span>
                </div>
                <p className="font-medium text-slate-900">{complaint.location} ({complaint.zone})</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-slate-500 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Priority</span>
                </div>
                <p className={`font-semibold ${['High', 'Critical'].includes(complaint.priority) ? 'text-red-600' : 'text-amber-600'}`}>
                  {complaint.priority}
                </p>
              </div>
            </div>

            {complaint.ai_reasoning && (
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-blue-800 mb-1">
                  <Info className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">AI Priority Reasoning</span>
                </div>
                <p className="text-sm text-blue-900">{complaint.ai_reasoning}</p>
              </div>
            )}
            
            {complaint.resolution_remark && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-green-800 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Resolution Remark</span>
                </div>
                <p className="text-sm text-green-900">{complaint.resolution_remark}</p>
              </div>
            )}
            
            {complaint.photo_path && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Attached Evidence</h3>
                <img src={complaint.photo_path} alt="Complaint Evidence" className="rounded-xl border border-slate-200 max-h-96 object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Super Admin Actions & Timeline */}
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2 border-b border-slate-100 pb-2">
              <ShieldAlert className="w-5 h-5 text-blue-600" />
              <span>Super Admin Controls</span>
            </h3>
            
            {/* Reassign Department */}
            <form onSubmit={handleReassign} className="mb-6 pb-6 border-b border-slate-100">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Reassign Department
              </label>
              <div className="flex space-x-2">
                <select
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={updating || String(selectedDepartmentId) === String(complaint.department_id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center"
                >
                  <FolderSync className="w-4 h-4 mr-1" /> Save
                </button>
              </div>
            </form>

            {/* Correct Category */}
            <form onSubmit={handleCorrectCategory} className="mb-6 pb-6 border-b border-slate-100">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Correct Category
              </label>
              <div className="flex space-x-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={updating || selectedCategory === complaint.category}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center"
                >
                  <Tag className="w-4 h-4 mr-1" /> Save
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                <strong>AI Suggestion:</strong> {aiCategory}
              </p>
            </form>

            {/* Update Status */}
            <form onSubmit={handleUpdateStatus}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Update Status
              </label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
                className="w-full px-3 py-2 mb-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                {complaint.status === 'Reopened' && <option value="Reopened">Reopened</option>}
              </select>

              {updateStatus === 'Resolved' && (
                <div className="mb-3">
                  <textarea
                    required
                    rows={2}
                    value={resolutionRemark}
                    onChange={(e) => setResolutionRemark(e.target.value)}
                    placeholder="Resolution remark (required)..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <button
                type="submit"
                disabled={updating || updateStatus === complaint.status}
                className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                Update Status
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Timeline & History</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Submitted Date</span>
                <span className="font-medium text-slate-900">{new Date(complaint.created_at).toLocaleString()}</span>
              </div>
              
              {complaint.sla_due_at && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">SLA Due Date</span>
                  <span className={`font-medium ${overdue ? 'text-red-600' : 'text-slate-900'}`}>
                    {new Date(complaint.sla_due_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="border-t border-slate-100 pt-4">
              {(!complaint.updates || complaint.updates.length === 0) ? (
                <p className="text-sm text-slate-500 italic">No updates yet.</p>
              ) : (
                <div className="relative border-l-2 border-slate-100 ml-3 space-y-4">
                  {complaint.updates.map((update) => (
                    <div key={update.id} className="relative pl-5">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500"></div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{update.status}</span>
                        <span className="text-[10px] font-medium text-slate-500">
                          {new Date(update.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 whitespace-pre-wrap">
                        {update.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SuperAdminComplaintDetail;
