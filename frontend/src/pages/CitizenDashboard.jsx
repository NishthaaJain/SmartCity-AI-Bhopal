import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { complaintsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Clock, CheckCircle2, AlertTriangle, FileText, MapPin, Tag } from 'lucide-react';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await complaintsAPI.getUserComplaints();
      setComplaints(res.data);
    } catch (err) {
      setError('Failed to load your complaints');
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (complaint) => {
    if (!complaint.sla_due_at) return false;
    if (complaint.status === 'Resolved' || complaint.status === 'Closed') return false;
    return new Date() > new Date(complaint.sla_due_at);
  };

  const getStatusBadge = (status, overdue) => {
    if (overdue) {
      return <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200"><AlertTriangle className="w-3.5 h-3.5" /><span>Overdue</span></span>;
    }
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircle2 className="w-3.5 h-3.5" /><span>{status}</span></span>;
      case 'In Progress':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200"><Clock className="w-3.5 h-3.5" /><span>In Progress</span></span>;
      case 'Under Review':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200"><Clock className="w-3.5 h-3.5" /><span>Under Review</span></span>;
      case 'Reopened':
        return <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200"><AlertTriangle className="w-3.5 h-3.5" /><span>Reopened</span></span>;
      default:
        // Submitted or other
        return <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"><FileText className="w-3.5 h-3.5" /><span>{status}</span></span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical':
      case 'High':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-200">{priority}</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200">{priority}</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">{priority}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome, {user?.name}!</h1>
          <p className="text-sm text-slate-500 mt-1">Track status of your submitted civic issues and file new requests.</p>
        </div>
        <Link
          to="/new-complaint"
          className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Report New Issue</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block uppercase">Total Filed</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{complaints.length}</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block uppercase">In Progress</span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">{complaints.filter(c => ['Submitted', 'Under Review', 'In Progress', 'Reopened'].includes(c.status)).length}</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block uppercase">Overdue</span>
          <span className="text-2xl font-bold text-red-600 mt-1 block">{complaints.filter(c => isOverdue(c)).length}</span>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block uppercase">Resolved</span>
          <span className="text-2xl font-bold text-green-600 mt-1 block">{complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length}</span>
        </div>
      </div>

      {/* Complaints List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>My Submitted Complaints ({complaints.length})</span>
          </h2>
        </div>

        {complaints.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No complaints submitted yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Have an issue in your zone? File a report to alert municipal teams.</p>
            <Link
              to="/new-complaint"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Complaint</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((item) => {
              const overdue = isOverdue(item);
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/complaint/${item.id}`)}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-md transition-all shadow-sm space-y-3 cursor-pointer relative"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-semibold text-slate-500">#{item.id}</span>
                      <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                      {getPriorityBadge(item.priority)}
                    </div>
                    <div>{getStatusBadge(item.status, overdue)}</div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-600">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex items-center space-x-1 font-medium bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        <Tag className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.category}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.location}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="font-medium">
                        Dept: <span className="text-slate-900">{/* Department info is available in backend via getById, but list doesn't have dept name, we can use item.department if it existed. Let's just not show dept here if we don't have it, or show ID. We can just skip it here or use it if available */}</span>
                      </span>
                      <span className="text-slate-500">
                        Filed: {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;
