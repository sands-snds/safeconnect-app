import React, { useState } from 'react';
import { signinUser, setAuthToken } from '../../../Services/api';

// This modal never existed in the project — isAuthenticated had no way to
// ever become true, which is why the dashboard/reports/etc never rendered
// even though nothing was throwing an error.
const SignInModal = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await signinUser(email, password);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message || 'Invalid email or password.');
      return;
    }

    if (!result.isAdmin) {
      setError('This account does not have admin access.');
      return;
    }

    sessionStorage.setItem('adminAuthenticated', 'true');
    setAuthToken(result.token);
    onSuccess();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '380px' }}>
        <h2 className="font-bold text-xl uppercase" style={{ marginBottom: '20px' }}>
          Admin Sign In
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="admin@example.com"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p style={{ color: '#dc2626', fontSize: '.85rem', marginTop: '4px' }}>
              {error}
            </p>
          )}

          <div style={{ marginTop: '20px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="button button-primary"
              style={{ width: '100%' }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignInModal;
