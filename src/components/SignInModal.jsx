import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SignInModal() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    keepLoggedIn: false
  });
  useEffect(() => {
    return () => {
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '';
    };
  }, []);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [id]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Sign In:', formData);
    
    const modalElement = document.getElementById('signInModal');
    
    if (window.bootstrap && window.bootstrap.Modal) {
      const modal = window.bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }

    setTimeout(() => {

      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
      
      document.body.classList.remove('modal-open');
      
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '';
      
      if (modalElement) {
        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.removeAttribute('aria-modal');
      }
      
      navigate('/resident');
    }, 300); 
  };

  return (
    <div className="modal fade" id="signInModal" tabIndex="-1" aria-labelledby="signInModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">

          <div className="modal-header">
            <h5 className="modal-title fw-bold text-danger" id="signInModalLabel">Sign In</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-bold">Email address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  id="email" 
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email" 
                  required 
                />
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label fw-bold">Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  id="password" 
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password" 
                  required 
                />
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="keepLoggedIn"
                    checked={formData.keepLoggedIn}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="keepLoggedIn">
                    Keep me logged in
                  </label>
                </div>
                <a href="#" className="text-danger fw-bold small" onClick={(e) => e.preventDefault()}>Forgot password?</a>
              </div>

              <button type="submit" className="btn btn-danger w-100 fw-bold">Sign In</button>
            </form>

            <div className="d-flex align-items-center my-4">
              <hr className="flex-grow-1" />
              <span className="px-2 fw-bold text-muted">OR</span>
              <hr className="flex-grow-1" />
            </div>

            <div className="d-flex gap-3 justify-content-center mb-3">
              <button className="btn btn-outline-primary w-50 fw-bold" onClick={(e) => e.preventDefault()}>
                <i className="bi bi-facebook me-2"></i> Facebook
              </button>
              <button className="btn btn-outline-danger w-50 fw-bold" onClick={(e) => e.preventDefault()}>
                <i className="bi bi-google me-2"></i> Google
              </button>
            </div>

            <h6 className="fw-bold text-center mt-3">
              Don't have an account? 
              <button 
                className="btn btn-link text-danger text-decoration-none fw-semibold p-0 ms-1" 
                data-bs-toggle="modal" 
                data-bs-target="#registerModal" 
                data-bs-dismiss="modal"
                type="button"
              >
                Sign Up
              </button>
            </h6>
          </div>

        </div>
      </div>
    </div>
  );
}

export default SignInModal;