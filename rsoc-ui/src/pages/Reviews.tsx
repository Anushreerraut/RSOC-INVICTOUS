import { useState, useEffect } from 'react';
import api from '../api';

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fetchReviews = async () => {
    try {
      const data = await api.get('/reviews');
      setReviews(data);
    } catch {
      console.error('Failed to fetch reviews');
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await api.post('/reviews', {
        user_name: userName || 'Anonymous',
        rating,
        comment
      });
      setSuccess(true);
      setUserName('');
      setRating(5);
      setComment('');
      fetchReviews();
    } catch {
      setError('Failed to submit feedback. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page fadeIn">
      <div className="page-header">
        <h1>💬 Reviews & Suggestions</h1>
        <p>Help us improve RSOC by sharing your feedback and ideas</p>
      </div>

      <div className="two-col">
        {/* Feedback Form */}
        <div>
          <div className="card">
            <div className="card-title">Submit Feedback</div>
            <form onSubmit={handleSubmit}>
              {error && <div className="alert error">{error}</div>}
              {success && <div className="alert success">✅ Thank you! Your feedback has been submitted.</div>}

              <div className="form-group">
                <label>Your Name (Optional)</label>
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Anonymous"
                />
              </div>

              <div className="form-group">
                <label>Rating</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 24, padding: 0,
                        color: rating >= star ? 'var(--accent2)' : 'var(--muted)',
                        transition: 'transform 0.1s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      {rating >= star ? '★' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Suggestion / Review</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="How can we make RSOC better for you? Found a bug? Have a feature request?"
                  style={{ minHeight: 120, fontFamily: 'inherit' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !comment.trim()}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? '⏳ Submitting...' : '🚀 Submit Feedback'}
              </button>
            </form>
          </div>
        </div>

        {/* Reviews List */}
        <div>
          <div className="card" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="card-title">Recent Feedback</div>
            {reviews.length === 0 ? (
              <div className="empty">
                <div className="icon">💬</div>
                <h3>No reviews yet</h3>
                <p>Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {reviews.map(review => (
                  <div key={review.id} style={{
                    padding: 16, borderRadius: 12, background: 'var(--bg3)',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent2)' }}>{review.user_name}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ color: 'var(--accent2)', marginBottom: 8, fontSize: 14 }}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {review.comment}
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
}
