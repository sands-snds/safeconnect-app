import React, { useState } from 'react';

function RegisterModal() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    regPassword: '',
    confirmPassword: '',
    terms: false
  });

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [id]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.regPassword !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    if (!formData.terms) {
      alert('Please agree to the Terms of Service');
      return;
    }
    
    console.log('Register:', formData);
    alert('Account created successfully!');
    
    const modal = document.getElementById('registerModal');
    const bsModal = window.bootstrap.Modal.getInstance(modal);
    if (bsModal) bsModal.hide();
  };

  return (
    <div className="modal fade" id="registerModal" tabIndex="-1" aria-labelledby="registerModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          
          <div className="modal-header border-bottom">
            <h5 className="modal-title fw-bold text-danger" id="registerModalLabel">Create Account</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          
          <div className="modal-body p-4">
            <form id="registerForm" onSubmit={handleSubmit}>
              
              <div className="mb-3">
                <label htmlFor="fullName" className="form-label fw-semibold">Full Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="fullName" 
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name" 
                  required 
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="regEmail" className="form-label fw-semibold">Email address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  id="regEmail" 
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email" 
                  required 
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="regPassword" className="form-label fw-semibold">Set Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  id="regPassword" 
                  value={formData.regPassword}
                  onChange={handleChange}
                  placeholder="Enter password" 
                  required 
                />
              </div>
              
              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label fw-semibold">Confirm Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  id="confirmPassword" 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password" 
                  required 
                />
              </div>
              
              <div className="form-check mb-3">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="terms" 
                  checked={formData.terms}
                  onChange={handleChange}
                  required 
                />
                <label className="form-check-label small" htmlFor="terms">
                  By creating an account, you agree to the 
                  <a href="#" className="text-danger text-decoration-none"> Terms of Service</a>, 
                  <a href="#" className="text-danger text-decoration-none"> Conditions</a>, and 
                  <a href="#" className="text-danger text-decoration-none"> Privacy Policy</a>.
                </label>
              </div>
              
              <button type="submit" className="btn btn-danger w-100 fw-bold py-2 mb-3">Create Account</button>
            </form>
            
            <div className="d-flex align-items-center my-4">
              <hr className="flex-grow-1" />
              <span className="px-3 fw-semibold text-muted">OR</span>
              <hr className="flex-grow-1" />
            </div>
            
            <div className="d-flex gap-2 mb-4">
              <button className="btn btn-outline-primary w-50 d-flex align-items-center justify-content-center gap-2">
                <i className="bi bi-facebook"></i>
                <span className="fw-semibold">Facebook</span>
              </button>
              <button className="btn btn-outline-danger w-50 d-flex align-items-center justify-content-center gap-2">
                <i className="bi bi-google"></i>
                <span className="fw-semibold">Google</span>
              </button>
            </div>
            
            <p className="text-center mb-0">
              Already have an account? 
              <button 
                className="btn btn-link text-danger text-decoration-none fw-semibold p-0 ms-1" 
                data-bs-toggle="modal" 
                data-bs-target="#signInModal" 
                data-bs-dismiss="modal"
              >
                Sign In
              </button>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default RegisterModal;