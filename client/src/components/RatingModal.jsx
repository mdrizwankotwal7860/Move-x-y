import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import api from '../api/axios';

export default function RatingModal({ ride, onClose, onSubmitSuccess }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(null);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/ratings/', {
        ride_id: ride.id,
        rating,
        review,
      });
      onSubmitSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass w-full max-w-md p-6 rounded-2xl border border-white/10 shadow-2xl relative space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-100">Rate Your Ride</h3>
          <p className="text-sm text-slate-400 mt-1">How was your trip with {ride.driver_name || 'your driver'}?</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-rose-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Stars */}
          <div className="flex justify-center items-center space-x-2">
            {[...Array(5)].map((star, index) => {
              const ratingValue = index + 1;
              return (
                <label key={index}>
                  <input
                    type="radio"
                    name="rating"
                    className="hidden"
                    value={ratingValue}
                    onClick={() => setRating(ratingValue)}
                  />
                  <FaStar
                    className="cursor-pointer transition duration-150"
                    color={ratingValue <= (hover || rating) ? "#f59e0b" : "#334155"}
                    size={36}
                    onMouseEnter={() => setHover(ratingValue)}
                    onMouseLeave={() => setHover(null)}
                  />
                </label>
              );
            })}
          </div>

          {/* Feedback */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Leave a review (optional)</label>
            <textarea
              className="w-full px-4 py-3 bg-slate-900 border border-white/5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition"
              rows="3"
              placeholder="Tell us about the driving, vehicle condition, etc..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold border border-white/5 rounded-xl transition duration-200 text-sm"
              disabled={submitting}
            >
              Skip
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg transition duration-200 text-sm flex items-center justify-center"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
