import React, { useState, useEffect } from 'react';
import { createAssistanceRequest } from '../../Services/api';

const SERVICE_AREA = {
  barangay: 'Santa Fe',
  city: 'Dasmariñas',
  province: 'Cavite',
  country: 'Philippines',
  lat: 14.3198,
  lng: 120.9644
};

const SPECIAL_NEEDS_OPTIONS = [
  'Elderly',
  'Children',
  'Persons with disabilities',
  'Pregnant',
  'Pets'
];

const URGENCY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

// Reads the currently logged-in resident's name/contact/email, set at sign-in
const getCurrentUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  } catch {
    return {};
  }
};

function ResidentAssistanceModal({ show, type, serviceId, onClose }) {
  const [formData, setFormData] = useState({
  assistanceType: '',
  location: '',
  situation: '',
  special: [],
  consent: false
});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapQuery, setMapQuery] = useState(
    `${SERVICE_AREA.lat},${SERVICE_AREA.lng}`
  );

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [show]);

  useEffect(() => {
    const trimmed = formData.location.trim();

    const timer = setTimeout(() => {
      const query = trimmed
        ? `${trimmed}, Barangay ${SERVICE_AREA.barangay}, ${SERVICE_AREA.city}, ${SERVICE_AREA.province}, ${SERVICE_AREA.country}`
        : `${SERVICE_AREA.lat},${SERVICE_AREA.lng}`;
      setMapQuery(query);
    }, 700);

    return () => clearTimeout(timer);
  }, [formData.location]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSpecialToggle = (option) => {
    setFormData(prev => {
      const alreadySelected = prev.special.includes(option);
      return {
        ...prev,
        special: alreadySelected
          ? prev.special.filter(item => item !== option)
          : [...prev.special, option]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const currentUser = getCurrentUser();
      const fullName = currentUser.fullName || 'Anonymous Resident';
      const contact = currentUser.contact || 'Not provided';
      const email = currentUser.email || '';

      const fullLocation = `${formData.location}, Barangay ${SERVICE_AREA.barangay}, ${SERVICE_AREA.city}, ${SERVICE_AREA.province}, ${SERVICE_AREA.country}`;

      const result = await createAssistanceRequest({
        type: formData.assistanceType || 'General Assistance',
        fullname: fullName,
        contact,
        email,
        location: fullLocation,
        situation: formData.situation,
        special: formData.special.join(', ') || null
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to submit request');
      }

      alert('Assistance request submitted successfully! Our team will contact you soon.');
      setFormData({
        assistanceType: '',
        location: '',
        situation: '',
        special: [],
        consent: false
      });
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        padding: '20px',
        overflowY: 'auto'
      }}
    >
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid #e5e7eb',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ 
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: '#dc3545',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <i className="bi bi-life-preserver" style={{ 
              fontSize: '22px', 
              color: 'white'
            }}></i>
          </div>
          <h2 style={{ 
            margin: 0, 
            fontSize: '20px', 
            fontWeight: '700',
            color: '#1f2937',
            flex: 1
          }}>Request Assistance {type}</h2>
          <button 
            onClick={onClose}
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#1f2937'}
            onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151',
              fontSize: '13px'
            }}>
              <i 
                className="bi bi-list-check"
                style={{ color: '#374151', fontSize: '14px' }}
              ></i>
              Assistance Type <span style={{ color: '#dc3545' }}>*</span>
            </label>

            <select
              name="assistanceType"
              value={formData.assistanceType}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">Select assistance type</option>
              <option value="Food and Water">
                Food and Water
              </option>
              <option value="Medical Aid">
                Medical Aid
              </option>
            </select>
          </div>

            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151',
              fontSize: '13px'
            }}>
              <i className="bi bi-geo-alt-fill" style={{ color: '#374151', fontSize: '14px' }}></i>
              Current Location <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input 
              type="text" 
              name="location" 
              value={formData.location}
              onChange={handleChange}
              placeholder="Street / Purok / Landmark in Barangay Santa Fe" 
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#dc3545'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
              Requests are limited to Barangay Santa Fe, Dasmariñas, Cavite, Philippines
            </div>

            <div style={{
              marginTop: '10px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #d1d5db'
            }}>
              <iframe
                key={mapQuery}
                src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`}
                title="Map of the entered location within Barangay Santa Fe"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                style={{
                  display: 'block',
                  width: '100%',
                  height: '180px',
                  border: 0
                }}
              ></iframe>
              <a
                href={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '8px 10px',
                  fontSize: '12px',
                  color: '#dc3545',
                  textDecoration: 'none',
                  backgroundColor: '#fff',
                  borderTop: '1px solid #e5e7eb'
                }}
              >
                <i className="bi bi-box-arrow-up-right"></i> Open this location in Google Maps
              </a>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151',
              fontSize: '13px'
            }}>
              <i className="bi bi-chat-left-text-fill" style={{ color: '#374151', fontSize: '14px' }}></i>
              Describe Your Situation <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <textarea 
              name="situation" 
              value={formData.situation}
              onChange={handleChange}
              rows="4" 
              placeholder="Please provide details about what kind of help you need..." 
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#dc3545'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            ></textarea>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151',
              fontSize: '13px'
            }}>
              <i className="bi bi-info-circle-fill" style={{ color: '#374151', fontSize: '14px' }}></i>
              Special Needs / Considerations
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px'
            }}>
              {SPECIAL_NEEDS_OPTIONS.map((option) => (
                <label
                  key={option}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#374151',
                    cursor: 'pointer',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '8px 10px'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.special.includes(option)}
                    onChange={() => handleSpecialToggle(option)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      accentColor: '#dc3545'
                    }}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '10px', 
              cursor: 'pointer',
              fontSize: '12px',
              color: '#374151',
              lineHeight: '1.5'
            }}>
              <input 
                type="checkbox" 
                name="consent" 
                checked={formData.consent}
                onChange={handleChange}
                required 
                style={{
                  marginTop: '2px',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  accentColor: '#dc3545'
                }} 
              />
              <span>
                I confirm that the information provided is accurate and consent to be contacted by the response team.
              </span>
            </label>
          </div>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px', 
            marginTop: '24px'
          }}>
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '12px 20px',
                borderRadius: '24px',
                border: 'none',
                background: '#6b7280',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                color: 'white',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isSubmitting ? 0.5 : 1
              }}
              onMouseEnter={(e) => !isSubmitting && (e.target.style.background = '#4b5563')}
              onMouseLeave={(e) => e.target.style.background = '#6b7280'}
            >
              <i className="bi bi-x-circle-fill"></i> Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '12px 20px',
                borderRadius: '24px',
                border: 'none',
                background: '#dc3545',
                color: 'white',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isSubmitting ? 0.7 : 1
              }}
              onMouseEnter={(e) => !isSubmitting && (e.target.style.background = '#bb2d3b')}
              onMouseLeave={(e) => e.target.style.background = '#dc3545'}
            >
              {isSubmitting ? (
                <>
                  <i className="bi bi-hourglass-split"></i> Submitting...
                </>
              ) : (
                <>
                  <i className="bi bi-send-fill"></i> Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResidentAssistanceModal;