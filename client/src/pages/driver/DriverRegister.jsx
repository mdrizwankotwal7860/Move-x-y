import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { FaCar, FaInfoCircle, FaArrowLeft } from 'react-icons/fa';

export default function DriverRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [color, setColor] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('sedan'); // 'sedan' | 'suv' | 'hatchback'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Link vehicle to the currently authenticated driver
      await api.post('/drivers/vehicle', {
        make,
        model,
        year,
        color,
        plate_number: plateNumber,
        vehicle_type: vehicleType,
      });
      // After successful vehicle registration, navigate back to driver dashboard
      navigate('/driver');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Vehicle registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/driver')}
          className="p-2.5 bg-slate-900 border border-white/5 hover:bg-slate-800 rounded-lg text-slate-300 transition duration-150"
        >
          <FaArrowLeft size={14} />
        </button>
        <div>
          <h2 className="text-xl md:text-3xl font-black text-slate-100 uppercase tracking-tight flex items-center space-x-2">
            <FaCar className="text-teal-400" />
            <span>Vehicle Registration</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-medium">Link your vehicle registration to your verified driver terminal profile</p>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-white/5 shadow-xl space-y-6">
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Manufacturer</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-slate-900 border border-white/5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition"
                  placeholder="e.g. Toyota, Maruti"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  disabled={loading}
                />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Model Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-white/5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition"
                placeholder="e.g. Swift, Fortuner"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Manufacture Year</label>
              <input
                type="number"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-white/5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-slate-100 text-sm outline-none transition"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Color</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-white/5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition"
                placeholder="e.g. White, Black"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Plate Number</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-900 border border-white/5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition uppercase"
                placeholder="KA01AB1234"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Vehicle Type</label>
              <select
                className="w-full px-4 py-3 bg-slate-900 border border-white/5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-slate-100 text-sm outline-none transition"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                disabled={loading}
              >
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="hatchback">Hatchback</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 text-xs text-slate-500 flex items-start space-x-2 leading-relaxed">
            <FaInfoCircle className="text-teal-500 shrink-0 mt-0.5" />
            <span>Vehicles plate registration coordinates are standardized. Admin approvals apply automatically. Plagiarism or invalid plates are subject to manual screening in the Admin panel.</span>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl shadow-lg transition duration-200 text-sm uppercase tracking-wider flex items-center justify-center space-x-2"
            disabled={loading}
          >
            <span>Register as Driver</span>
          </button>
        </form>
      </div>
    </div>
  );
}
