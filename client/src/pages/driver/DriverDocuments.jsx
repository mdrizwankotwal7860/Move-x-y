import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
  FaIdCard, FaFingerprint, FaCar, FaShieldAlt,
  FaUserCircle, FaImage, FaUpload, FaCheckCircle,
  FaTimesCircle, FaClock, FaArrowLeft, FaCloudUploadAlt
} from 'react-icons/fa';

const DOC_CONFIG = [
  {
    key: 'license',
    label: "Driver's License",
    icon: FaIdCard,
    hint: 'Front side of your valid driving licence',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    key: 'aadhaar',
    label: 'Aadhaar Card',
    icon: FaFingerprint,
    hint: 'Front + back of your Aadhaar card',
    color: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  {
    key: 'rc',
    label: 'Vehicle RC (Registration Certificate)',
    icon: FaCar,
    hint: 'Registration certificate of your vehicle',
    color: 'from-teal-500 to-teal-600',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
  },
  {
    key: 'insurance',
    label: 'Vehicle Insurance',
    icon: FaShieldAlt,
    hint: 'Current valid insurance policy document',
    color: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  {
    key: 'driver_photo',
    label: 'Driver Photo',
    icon: FaUserCircle,
    hint: 'Clear passport-size photo of yourself',
    color: 'from-pink-500 to-pink-600',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
  },
  {
    key: 'vehicle_photo',
    label: 'Vehicle Photo',
    icon: FaImage,
    hint: 'Clear front-facing photo of your vehicle',
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
];

const STATUS_CONFIG = {
  not_uploaded: { label: 'Not Uploaded', icon: FaCloudUploadAlt, color: 'text-slate-400', bg: 'bg-slate-700/50' },
  pending: { label: 'Pending Review', icon: FaClock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  verified: { label: 'Verified', icon: FaCheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  rejected: { label: 'Rejected', icon: FaTimesCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
};

export default function DriverDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState({});
  const [uploading, setUploading] = useState({});
  const [previews, setPreviews] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const fileRefs = useRef({});

  useEffect(() => {
    fetchDocStatus();
  }, []);

  const fetchDocStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/drivers/documents');
      setDocuments(res.data.driver?.documents || {});
    } catch (err) {
      setError('Failed to load document status.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (docKey, file) => {
    if (!file) return;
    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviews(p => ({ ...p, [docKey]: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (docKey) => {
    const file = fileRefs.current[docKey]?.files?.[0];
    if (!file) {
      setError('Please select a file first.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10 MB.');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(u => ({ ...u, [docKey]: true }));

    try {
      const base64 = await fileToBase64(file);
      const res = await api.post(`/drivers/documents/${docKey}`, { data: base64 });
      setDocuments(res.data.driver?.documents || {});
      setSuccess(`${DOC_CONFIG.find(d => d.key === docKey)?.label} uploaded successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploading(u => ({ ...u, [docKey]: false }));
    }
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const getCompletionCount = () =>
    DOC_CONFIG.filter(d => documents[d.key]?.status === 'verified').length;

  const getOverallStatus = () => {
    const statuses = DOC_CONFIG.map(d => documents[d.key]?.status || 'not_uploaded');
    if (statuses.every(s => s === 'verified')) return 'verified';
    if (statuses.some(s => s === 'rejected')) return 'rejected';
    if (statuses.some(s => s === 'pending')) return 'pending';
    return 'not_uploaded';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500" />
      </div>
    );
  }

  const overallStatus = getOverallStatus();
  const completedCount = getCompletionCount();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/driver')}
          className="p-2.5 bg-slate-800 border border-white/5 hover:bg-slate-700 rounded-xl text-slate-300 transition"
        >
          <FaArrowLeft size={14} />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Document Verification
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Upload all 6 required documents for admin review
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-slate-800/60 border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Verification Progress</p>
            <p className="text-white text-lg font-bold mt-1">
              {completedCount} / {DOC_CONFIG.length} Documents Verified
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl text-sm font-bold ${
            overallStatus === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
            overallStatus === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
            overallStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-slate-700 text-slate-400'
          }`}>
            {overallStatus === 'verified' ? '✓ All Verified' :
             overallStatus === 'rejected' ? '✗ Action Required' :
             overallStatus === 'pending' ? '⏳ Under Review' :
             'Upload Required'}
          </div>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${(completedCount / DOC_CONFIG.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium">
          ✓ {success}
        </div>
      )}

      {/* Document Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOC_CONFIG.map((doc) => {
          const Icon = doc.icon;
          const docData = documents[doc.key] || { status: 'not_uploaded' };
          const statusCfg = STATUS_CONFIG[docData.status] || STATUS_CONFIG.not_uploaded;
          const StatusIcon = statusCfg.icon;
          const preview = previews[doc.key];
          const isUploading = uploading[doc.key];

          return (
            <div
              key={doc.key}
              className={`bg-slate-800/60 border rounded-2xl p-5 space-y-4 transition ${doc.border}`}
            >
              {/* Doc header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${doc.bg} flex items-center justify-center`}>
                    <Icon className={`bg-gradient-to-br ${doc.color} bg-clip-text text-transparent`} size={18}
                      style={{ color: doc.color.includes('blue') ? '#3b82f6' :
                        doc.color.includes('purple') ? '#a855f7' :
                        doc.color.includes('teal') ? '#14b8a6' :
                        doc.color.includes('orange') ? '#f97316' :
                        doc.color.includes('pink') ? '#ec4899' : '#10b981' }}
                    />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{doc.label}</p>
                    <p className="text-slate-500 text-xs">{doc.hint}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
                  <StatusIcon size={11} />
                  <span>{statusCfg.label}</span>
                </div>
              </div>

              {/* Preview */}
              {(preview || docData.has_file) && (
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-slate-900">
                  {preview ? (
                    <img
                      src={preview}
                      alt={doc.label}
                      className="w-full h-36 object-cover"
                    />
                  ) : (
                    <div className="h-36 flex items-center justify-center">
                      <p className="text-slate-500 text-xs">File uploaded — preview not available</p>
                    </div>
                  )}
                  {docData.status === 'verified' && (
                    <div className="absolute inset-0 bg-emerald-900/40 flex items-center justify-center">
                      <FaCheckCircle className="text-emerald-400" size={32} />
                    </div>
                  )}
                </div>
              )}

              {/* Upload area */}
              <div>
                <input
                  ref={(el) => (fileRefs.current[doc.key] = el)}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  id={`file-${doc.key}`}
                  onChange={(e) => handleFileSelect(doc.key, e.target.files?.[0])}
                />
                <div className="flex gap-2">
                  <label
                    htmlFor={`file-${doc.key}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-700 hover:bg-slate-600 border border-white/10 rounded-xl text-slate-300 text-xs font-semibold cursor-pointer transition"
                  >
                    <FaUpload size={11} />
                    {previews[doc.key] ? 'Change File' : 'Select File'}
                  </label>
                  {(previews[doc.key] || docData.status === 'rejected') && (
                    <button
                      onClick={() => handleUpload(doc.key)}
                      disabled={isUploading}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 rounded-xl text-white text-xs font-bold disabled:opacity-50 transition"
                    >
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white" />
                      ) : (
                        <FaCloudUploadAlt size={12} />
                      )}
                      {isUploading ? 'Uploading…' : 'Upload'}
                    </button>
                  )}
                </div>
                {docData.uploaded_at && (
                  <p className="text-slate-500 text-xs mt-1.5">
                    Last uploaded: {new Date(docData.uploaded_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info banner */}
      <div className="bg-slate-800/40 border border-white/5 rounded-2xl p-5 text-slate-400 text-sm leading-relaxed">
        <p className="font-semibold text-slate-300 mb-1">📋 What happens after upload?</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Each document is reviewed individually by our admin team.</li>
          <li>Verification typically takes 24–48 hours.</li>
          <li>You'll be able to go online and accept rides once your account is approved.</li>
          <li>Rejected documents must be re-uploaded with a clearer image.</li>
        </ul>
      </div>
    </div>
  );
}
