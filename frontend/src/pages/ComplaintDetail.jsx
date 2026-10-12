import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { complaintsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Clock, CheckCircle2, AlertTriangle, 
  MapPin, Tag, FileText, Info, Building, MessageSquare
} from 'lucide-react';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Reopen State
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [reopenRemark, setReopenRemark] = useState('');
  const [reopenSubmitting, setReopenSubmitting] = useState(false);
  const [reopenError, setReopenError] = useState('');
  const [reopenSuccess, setReopenSuccess] = useState('');

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    try {
      const res = await complaintsAPI.getById(id);
      setComplaint(res.data);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        setError('Complaint not found or you do not have permission to view it.');
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

  const handleReopen = async (e) => {
    e.preventDefault();
    if (!reopenRemark.trim()) {
      setReopenError('Please provide a reason.');
      return;
    }
    setReopenSubmitting(true);
    setReopenError('');
    setReopenSuccess('');
    
    try {
      await complaintsAPI.reopen(id, reopenRemark);
      setReopenSuccess('Complaint has been successfully reopened.');
      setShowReopenForm(false);
      setReopenRemark('');
      fetchComplaint();
    } catch (err) {
      setReopenError(err.response?.data?.detail || 'Failed to reopen complaint.');
    } finally {
      setReopenSubmitting(false);
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
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <button
          onClick={() => navigate('/citizen')}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    );
  }

  const overdue = isOverdue(complaint);
  const isOwner = user?.role === 'CITIZEN' && user?.id === complaint.citizen_id;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => navigate('/citizen')}
        className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Complaints</span>
      </button>

      {reopenSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center space-x-2 font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{reopenSuccess}</span>
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
              </div>
            </div>

            <div className="prose prose-slate max-w-none mb-8 text-slate-700">
              <p className="whitespace-pre-wrap">{complaint.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-slate-500 mb-1">
                  <Tag className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Category</span>
                </div>
                <p className="font-medium text-slate-900">{complaint.category}</p>
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
                  <Building className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Department</span>
                </div>
                <p className="font-medium text-slate-900">Dept ID: {complaint.department_id}</p>
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
            
            {complaint.photo_path && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Attached Evidence</h3>
                <img src={complaint.photo_path} alt="Complaint Evidence" className="rounded-xl border border-slate-200 max-h-96 object-cover" />
              </div>
            )}
          </div>

          {/* Reopen Action Block */}
          {complaint.status === 'Resolved' && isOwner && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 shadow-sm">
              {!showReopenForm ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-orange-900">Issue not fixed?</h3>
                    <p className="text-sm text-orange-700 mt-1">If the problem persists, you can reopen this complaint.</p>
                  </div>
                  <button
                    onClick={() => setShowReopenForm(true)}
                    className="whitespace-nowrap px-6 py-3 bg-white border-2 border-orange-200 text-orange-700 font-bold rounded-xl hover:bg-orange-100 transition-colors"
                  >
                    Problem Not Resolved
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReopen} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-orange-900 mb-2">Reopen Complaint</h3>
                    <label className="block text-sm font-semibold text-orange-800 mb-2">
                      Please explain why the issue is not resolved:
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={reopenRemark}
                      onChange={(e) => setReopenRemark(e.target.value)}
                      placeholder="The pothole was only partially filled..."
                      className="w-full px-4 py-3 bg-white border border-orange-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  {reopenError && <p className="text-red-600 text-sm font-medium">{reopenError}</p>}
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={reopenSubmitting}
                      className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {reopenSubmitting ? 'Reopening...' : 'Submit Reopen Request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReopenForm(false);
                        setReopenRemark('');
                        setReopenError('');
                      }}
                      className="px-6 py-2.5 bg-white border border-orange-200 text-orange-700 font-bold rounded-xl hover:bg-orange-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Timeline & Meta */}
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Timeline</h3>
            
            <div className="space-y-6">
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
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">Activity History</h3>
            
            {(!complaint.updates || complaint.updates.length === 0) ? (
              <p className="text-sm text-slate-500 italic">No updates yet.</p>
            ) : (
              <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                {complaint.updates.map((update, index) => (
                  <div key={update.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500"></div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{update.status}</span>
                      <span className="text-xs font-medium text-slate-500">
                        {new Date(update.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
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
  );
};

export default ComplaintDetail;
