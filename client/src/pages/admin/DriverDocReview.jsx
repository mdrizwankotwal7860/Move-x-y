import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import {
  FaArrowLeft, FaCheckCircle, FaTimesCircle, FaClock,
  FaIdCard, FaFingerprint, FaCar, FaShieldAlt, FaUserCircle, FaImage
} from 'react-icons/fa';

const DOC_CONFIG = [
  { key: 'license', label: "Driver's License", icon: FaIdCard },
  { key: 'aadhaar', label: 'Aadhaar Card', icon: FaFingerprint },
  { key: 'rc', label: 'Vehicle RC', icon: FaCar },
  { key: 'insurance', label: 'Vehicle Insurance', icon: FaShieldAlt },
  { key: 'driver_photo', label: 'Driver Photo', icon: FaUserCircle },
  { key: 'vehicle_photo', label: 'Vehicle Photo', icon: FaImage },
];

export default function DriverDocReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null); // for full screen image preview

  const fetchDocs = async () => {
    try {
      const res = await api.get(`/admin/drivers/${id}/documents`);
      setDriver(res.data.driver);
      setDocuments(res.data.documents);
    } catch (err) {
      setError('Failed to load driver documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [id]);

  const updateDocStatus = async (docKey, status) => {
    try {
      const res = await api.put(`/admin/drivers/${id}/documents/${docKey}`, { status });
      setDriver(prev => ({ ...prev, docs_verification_status: res.data.docs_verification_status }));
      setDocuments(prev => ({
        ...prev,
        [docKey]: { ...prev[docKey], status }
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500" />
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-rose-400">
        <p>{error || 'Driver not found'}</p>
        <button onClick={() => navigate('/admin/drivers')} className="mt-4 text-teal-400 underline">Back to Drivers</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/drivers')}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
        >
          <FaArrowLeft size={14} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight">
            Review Documents
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            Driver: <span className="text-white font-bold">{driver.name}</span> ({driver.email})
          </p>
        </div>
        <div className="ml-auto">
          <span className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
            driver.docs_verification_status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
            driver.docs_verification_status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            Overall: {driver.docs_verification_status}
          </span>
        </div>
      </div>

      {/* Docs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DOC_CONFIG.map(({ key, label, icon: Icon }) => {
          const doc = documents[key] || {};
          const hasData = !!doc.data;
          
          return (
            <div key={key} className="bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
              {/* Card Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-800/80">
                <div className="flex items-center gap-2">
                  <Icon className="text-teal-400" />
                  <span className="text-sm font-bold text-slate-200">{label}</span>
                </div>
                {doc.status === 'verified' && <FaCheckCircle className="text-emerald-400" />}
                {doc.status === 'rejected' && <FaTimesCircle className="text-rose-400" />}
                {doc.status === 'pending' && <FaClock className="text-yellow-400 animate-pulse" />}
                {doc.status === 'not_uploaded' && <span className="text-[10px] text-slate-500 font-bold uppercase">Missing</span>}
              </div>

              {/* Image Preview */}
              <div className="flex-1 bg-slate-900 flex items-center justify-center p-2 min-h-[200px] relative">
                {hasData ? (
                  <img
                    src={doc.data}
                    alt={label}
                    className="max-h-48 rounded cursor-pointer hover:opacity-80 transition"
                    onClick={() => setSelectedDoc({ label, data: doc.data })}
                  />
                ) : (
                  <p className="text-xs text-slate-600 font-semibold uppercase">No file uploaded</p>
                )}
              </div>

              {/* Actions */}
              <div className="p-3 bg-slate-800/80 flex gap-2">
                <button
                  disabled={!hasData || doc.status === 'verified'}
                  onClick={() => updateDocStatus(key, 'verified')}
                  className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-900 text-emerald-400 border border-emerald-500/20 font-bold text-xs rounded-lg transition disabled:opacity-30 disabled:hover:bg-emerald-500/10 disabled:hover:text-emerald-400"
                >
                  Approve
                </button>
                <button
                  disabled={!hasData || doc.status === 'rejected'}
                  onClick={() => updateDocStatus(key, 'rejected')}
                  className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500 hover:text-slate-900 text-rose-400 border border-rose-500/20 font-bold text-xs rounded-lg transition disabled:opacity-30 disabled:hover:bg-rose-500/10 disabled:hover:text-rose-400"
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Image Modal */}
      {selectedDoc && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedDoc(null)}
        >
          <div className="max-w-5xl max-h-full flex flex-col items-center gap-4">
            <h3 className="text-white font-bold tracking-wider">{selectedDoc.label}</h3>
            <img 
              src={selectedDoc.data} 
              alt={selectedDoc.label} 
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
            />
            <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">Click anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
