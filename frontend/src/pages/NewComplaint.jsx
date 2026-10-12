import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { complaintsAPI, predictAPI } from '../services/api';
import { Sparkles, Upload, MapPin, AlertCircle, ArrowLeft, CheckCircle2, Search, Info } from 'lucide-react';

const CATEGORIES = [
  "Auto-detect",
  "Road / Pothole",
  "Garbage / Waste",
  "Water Supply",
  "Streetlight / Electricity",
  "Drainage",
  "Traffic Signal",
  "Public Infrastructure",
  "Other"
];

const BHOPAL_LOCATIONS = [
  "MP Nagar",
  "Arera Colony",
  "New Market",
  "Kolar Road",
  "Shahpura",
  "Habibganj",
  "Bairagarh",
  "TT Nagar",
  "Lalghati",
  "Ayodhya Bypass"
];

const NewComplaint = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Auto-detect');
  const [location, setLocation] = useState('MP Nagar');
  const [photo, setPhoto] = useState(null);

  // Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAssessment, setAiAssessment] = useState(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [error, setError] = useState('');
  
  // Duplicate Warning State
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Success State
  const [successData, setSuccessData] = useState(null);

  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!description || description.trim().length < 5) {
      setError("Please provide a more detailed description before analyzing.");
      return;
    }
    setError('');
    setAnalyzing(true);
    try {
      const res = await predictAPI.analyzeComplaint(description);
      setAiAssessment(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to analyze complaint.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    if (!aiAssessment) {
      setError("Please analyze the complaint first before submitting.");
      return;
    }
    setError('');
    setCheckingDuplicate(true);
    try {
      const finalCategory = category === 'Auto-detect' ? aiAssessment.predicted_category : category;
      const res = await complaintsAPI.checkDuplicate({
        description,
        category: finalCategory,
        location
      });
      
      if (res.data.duplicates && res.data.duplicates.length > 0) {
        setDuplicates(res.data.duplicates);
        setShowDuplicateWarning(true);
      } else {
        await submitFinalComplaint();
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to check duplicates.");
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const submitFinalComplaint = async () => {
    setSubmitting(true);
    setError('');
    setShowDuplicateWarning(false);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      
      const finalCategory = category === 'Auto-detect' ? aiAssessment.predicted_category : category;
      formData.append('category', finalCategory);
      formData.append('location', location);
      formData.append('zone', location); // Use location as zone for backend compatibility
      
      if (photo) {
        formData.append('photo', photo);
      }

      const res = await complaintsAPI.submit(formData);
      setSuccessData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Complaint Submitted Successfully</h2>
          <p className="text-slate-600 mb-8">Your civic issue has been logged and assigned for resolution.</p>
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-left space-y-4 mb-8">
            <div className="flex justify-between border-b border-slate-200 pb-3">
              <span className="text-slate-500 font-medium">Reference ID</span>
              <span className="text-slate-900 font-bold">#{successData.id}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-3">
              <span className="text-slate-500 font-medium">Category</span>
              <span className="text-slate-900 font-semibold">{successData.category}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-3">
              <span className="text-slate-500 font-medium">Priority</span>
              <span className={`font-semibold ${successData.priority === 'High' || successData.priority === 'Critical' ? 'text-red-600' : 'text-amber-600'}`}>
                {successData.priority}
              </span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-slate-500 font-medium">Status</span>
              <span className="text-blue-600 font-semibold">{successData.status}</span>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/citizen')}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            <span>View My Complaints</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/citizen')}
        className="inline-flex items-center space-x-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Complaints</span>
      </button>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Report a Civic Issue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Provide details about the problem. Our system will analyze the issue and route it to the correct department.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Duplicate Warning Modal/Overlay */}
        {showDuplicateWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
              <div className="p-6 bg-amber-50 border-b border-amber-100 flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-bold text-amber-900">Similar complaint may already exist nearby.</h3>
                  <p className="text-sm text-amber-700 mt-1">We found active issues matching your description and location.</p>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 space-y-4 max-h-60 overflow-y-auto">
                {duplicates.map(dup => (
                  <div key={dup.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-slate-900">{dup.title}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium border border-slate-200">{dup.status}</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-2">{dup.description}</p>
                    <div className="text-xs text-slate-400 font-medium">
                      {dup.category} • {dup.location} • {dup.created_at}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-6 border-t border-slate-200 flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate(`/complaint/${duplicates[0].id}`)}
                  className="flex-1 py-3 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors text-center"
                >
                  View Existing Complaint
                </button>
                <button
                  type="button"
                  onClick={submitFinalComplaint}
                  disabled={submitting}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Anyway'}
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleInitialSubmit} className="space-y-8">
          
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Complaint Details</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Complaint Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole on main road causing accidents"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Detailed Description *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setAiAssessment(null); // Reset analysis if description changes
                }}
                placeholder="Describe the issue, exact location markers, and any hazards observed..."
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Category Selection
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setAiAssessment(null);
                }}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Location</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Bhopal Location *
              </label>
              <div className="relative">
                <MapPin className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
                >
                  {BHOPAL_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Photo Evidence (Optional)
              </label>
              <div className="flex items-center space-x-4">
                <label className="cursor-pointer px-4 py-3 bg-white border border-slate-300 hover:border-slate-400 rounded-xl flex items-center space-x-2 text-sm text-slate-600 font-medium transition-colors">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span>{photo ? photo.name : 'Choose Image File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                {photo && (
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="text-sm font-medium text-red-500 hover:text-red-700"
                  >
                    Remove file
                  </button>
                )}
              </div>
            </div>
          </div>

          {!aiAssessment ? (
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing || !description}
                className="w-full py-4 px-6 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {analyzing ? (
                  <>
                    <Search className="w-5 h-5 animate-spin text-slate-400" />
                    <span>Analyzing complaint...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <span>Analyze Complaint</span>
                  </>
                )}
              </button>
              <p className="text-xs text-center text-slate-500 mt-3 font-medium">
                Analysis must be completed before submission.
              </p>
            </div>
          ) : (
            <div className="pt-4 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-900">AI Assessment</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</span>
                    <span className="font-medium text-slate-900">{aiAssessment.predicted_category}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Assigned Department</span>
                    <span className="font-medium text-slate-900">{aiAssessment.department}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Priority</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      aiAssessment.priority === 'High' || aiAssessment.priority === 'Critical' 
                        ? 'bg-red-100 text-red-700 border border-red-200' 
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {aiAssessment.priority}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">SLA</span>
                    <span className="font-medium text-slate-900">{aiAssessment.sla_hours} hours</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reason</span>
                    <div className="flex items-start space-x-2 bg-white border border-blue-100 rounded-xl p-3">
                      <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{aiAssessment.priority_reason}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || checkingDuplicate}
                className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {checkingDuplicate ? 'Checking for similar complaints...' : 
                 submitting ? 'Submitting Complaint...' : 'Submit Complaint'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default NewComplaint;
