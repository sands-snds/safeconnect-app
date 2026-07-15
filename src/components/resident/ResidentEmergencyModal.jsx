import React, { useState, useEffect } from 'react';
import { createEmergencyReport } from '../../Services/api';


// Fixed service area — form only accepts reports from this barangay
const SERVICE_AREA = {
  barangay: 'Santa Fe',
  city: 'Dasmariñas',
  province: 'Cavite',
  country: 'Philippines',
  lat: 14.3198,
  lng: 120.9644
};

const PEOPLE_AFFECTED_OPTIONS = ['1-10', '11-20', '21-30', '31-40'];

// Reads the currently logged-in resident's name/contact, set at sign-in
const getCurrentUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  } catch {
    return {};
  }
};

function ResidentEmergencyModal({ show, type, onClose }) {
  const [formData, setFormData] = useState({
  emergencyType: '',
  location: '', 
  details: '',
  people: '',
  photo: null
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

  // Debounce the typed location so the map updates a moment after typing stops,
  // rather than reloading the iframe on every keystroke
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
    const { name, value, files } = e.target;

    if (name === 'photo') {
      const file = files[0];
      if (file) {
        const allowedTypes = ['image/jpeg', 'image/jpg'];
        const isJpeg =
          allowedTypes.includes(file.type) || /\.(jpe?g)$/i.test(file.name);

        if (!isJpeg) {
          alert('Only JPEG/JPG images are allowed. Please choose a .jpg or .jpeg file.');
          e.target.value = '';
          setFormData((prev) => ({ ...prev, photo: null }));
          return;
        }
      }
      setFormData((prev) => ({ ...prev, photo: file || null }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const uploadPhoto = async (file) => {
    if (!file) return null;

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Photo is too large (max 20MB). Please choose a smaller image.');
      return null;
    }

    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Store as data URL which includes the Base64 image
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Photo conversion error:', error);
      return `Photo: ${file.name} - Upload failed`;
    }
  };

  const getSeverity = (emergencyType) => {
    const severityMap = {
      'Flood Emergency': 'Critical',
      'Fire Emergency': 'Critical',
      'Earthquake': 'High',
      'Landslide': 'High',
      'Accident': 'Urgent',
      'Other Emergency': 'Variable'
    };
    return severityMap[emergencyType] || 'Medium';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🚨 Submit button clicked");

    setIsSubmitting(true);

    try {
      const currentUser = getCurrentUser();
      const reporterName = currentUser.fullName || 'Anonymous Resident';
      const reporterContact = currentUser.contact || 'Not provided';

      let photoUrl = '';

      // Upload photo first if exists
      if (formData.photo) {
        const uploadedUrl = await uploadPhoto(formData.photo);
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        } else {
          console.warn('Photo upload failed, continuing without photo');
        }
      }

      const fullLocation = `${formData.location}, Barangay ${SERVICE_AREA.barangay}, ${SERVICE_AREA.city}, ${SERVICE_AREA.province}, ${SERVICE_AREA.country}`;

      const result = await createEmergencyReport({
        emergencyType: formData.emergencyType,
        severity: getSeverity(formData.emergencyType),
        name: reporterName,
        contact: reporterContact,
        location: fullLocation,
        details: formData.details,
        people: formData.people || 0,
        photoUrl: photoUrl || null
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to submit report');
      }

      // Success message
      alert('Emergency report submitted successfully! Our team will respond shortly. Stay safe!');

      // Reset form
      setFormData({
        emergencyType: '',
        location: '',
        details: '',
        people: '',
        photo: null
      });

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

      onClose();

    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again or call emergency hotline: 911');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  if (!show) return null;

  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.75);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          padding: 20px;
          overflow-y: auto;
        }

        @media (max-width: 480px) {
          .modal-overlay {
            padding: 10px;
            align-items: flex-start;
          }
        }

        .modal-container {
          background-color: white;
          border-radius: 12px;
          max-width: 820px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        @media (max-width: 480px) {
          .modal-container {
            max-height: 95vh;
            border-radius: 8px;
          }
        }

        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        @media (max-width: 480px) {
          .modal-header {
            padding: 16px 20px;
            gap: 10px;
          }
        }

        .header-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: #dc3545;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        @media (max-width: 480px) {
          .header-icon {
            width: 40px;
            height: 40px;
          }
        }

        .header-icon i {
          font-size: 22px;
          color: white;
        }

        @media (max-width: 480px) {
          .header-icon i {
            font-size: 20px;
          }
        }

        .modal-title {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: #1f2937;
          flex: 1;
        }

        @media (max-width: 480px) {
          .modal-title {
            font-size: 18px;
          }
        }

        .close-button {
          background: transparent;
          border: none;
          font-size: 22px;
          cursor: pointer;
          color: #9ca3af;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        @media (max-width: 480px) {
          .close-button {
            font-size: 20px;
          }
        }

        .close-button:hover {
          color: #1f2937;
        }

        .close-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-form {
          padding: 24px;
        }

        @media (max-width: 480px) {
          .modal-form {
            padding: 20px;
          }
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }

        .form-group {
          margin-bottom: 16px;
        }

        @media (max-width: 480px) {
          .form-group {
            margin-bottom: 12px;
          }
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
          font-size: 13px;
        }

        @media (max-width: 480px) {
          .form-label {
            font-size: 12px;
            margin-bottom: 6px;
          }
        }

        .required {
          color: #dc3545;
        }

        .form-input, .form-textarea, .form-file, .form-select {
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          font-size: 14px;
          outline: none;
          transition: border 0.2s;
          background-color: #fff;
          font-family: inherit;
        }

        @media (max-width: 480px) {
          .form-input, .form-textarea, .form-file, .form-select {
            padding: 8px 12px;
            font-size: 13px;
            border-radius: 6px;
          }
        }

        .form-input:focus, .form-textarea:focus, .form-file:focus, .form-select:focus {
          border-color: #dc3545;
        }

        .form-input:disabled, .form-textarea:disabled, .form-file:disabled, .form-select:disabled {
          background-color: #f3f4f6;
          cursor: not-allowed;
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        @media (max-width: 480px) {
          .form-textarea {
            min-height: 80px;
          }
        }

        .form-file {
          cursor: pointer;
        }

        .form-select {
          cursor: pointer;
        }

        .contact-input-group {
          display: flex;
          align-items: stretch;
        }

        .contact-prefix {
          display: flex;
          align-items: center;
          padding: 0 12px;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-right: none;
          border-radius: 8px 0 0 8px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          white-space: nowrap;
        }

        @media (max-width: 480px) {
          .contact-prefix {
            padding: 0 10px;
            font-size: 13px;
            border-radius: 6px 0 0 6px;
          }
        }

        .contact-input-group .form-input {
          border-radius: 0 8px 8px 0;
        }

        @media (max-width: 480px) {
          .contact-input-group .form-input {
            border-radius: 0 6px 6px 0;
          }
        }

        .location-fixed-area {
          margin-top: 6px;
          font-size: 12px;
          color: #6b7280;
        }

        .map-preview {
          margin-top: 10px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #d1d5db;
        }

        .map-preview iframe {
          display: block;
          width: 100%;
          height: 180px;
          border: 0;
        }

        @media (max-width: 480px) {
          .map-preview iframe {
            height: 150px;
          }
        }

        .map-preview-link {
          display: block;
          padding: 8px 10px;
          font-size: 12px;
          color: #dc3545;
          text-decoration: none;
          background-color: #fff;
          border-top: 1px solid #e5e7eb;
        }

        .map-preview-link:hover {
          text-decoration: underline;
        }

        .button-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 24px;
        }

        @media (max-width: 480px) {
          .button-group {
            grid-template-columns: 1fr;
            gap: 10px;
            margin-top: 20px;
          }
        }

        .btn-cancel, .btn-submit {
          padding: 12px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        @media (max-width: 480px) {
          .btn-cancel, .btn-submit {
            padding: 10px 16px;
            font-size: 13px;
            border-radius: 6px;
          }
        }

        .btn-cancel {
          background: #6b7280;
          color: white;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #4b5563;
        }

        .btn-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-submit {
          background: #dc3545;
          color: white;
        }

        .btn-submit:hover:not(:disabled) {
          background: #bb2d3b;
        }

        .btn-submit:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        className="modal-overlay"
        onClick={handleOverlayClick}
      >
        <div
          className="modal-container"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <div className="header-icon">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <h2 className="modal-title">Report {type}</h2>
            <button
              className="close-button"
              onClick={onClose}
              type="button"
              disabled={isSubmitting}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <form className="modal-form" onSubmit={handleSubmit}>

            <div className="form-group">
              <div className="form-group">
                <label className="form-label">
                  <i
                    className="bi bi-exclamation-circle-fill"
                    style={{
                      color: '#6b7280',
                      fontSize: '14px',
                      marginRight: '6px'
                    }}
                  ></i>
                  Emergency Type <span className="required">*</span>
                </label>

                <select
                  name="emergencyType"
                  value={formData.emergencyType}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="form-select"
                >
                  <option value="">Select emergency type</option>
                  <option value="Fire Emergency">Fire</option>
                  <option value="Flood Emergency">Flood</option>
                  <option value="Earthquake">Earthquake</option>
                </select>
              </div>
              <label className="form-label">
                <i className="bi bi-geo-alt-fill" style={{ color: '#6b7280', fontSize: '14px', marginRight: '6px' }}></i>
                Location <span className="required">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Street / Purok / Landmark in Barangay Santa Fe"
                required
                disabled={isSubmitting}
                className="form-input"
              />
              <div className="location-fixed-area">
                Reports are limited to Barangay Santa Fe, Dasmariñas, Cavite, Philippines
              </div>

              <div className="map-preview">
                <iframe
                  key={mapQuery}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`}
                  title="Map of the entered location within Barangay Santa Fe"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                ></iframe>
                <a
                  className="map-preview-link"
                  href={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-box-arrow-up-right"></i> Open this location in Google Maps
                </a>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <i className="bi bi-card-text" style={{ color: '#6b7280', fontSize: '14px', marginRight: '6px' }}></i>
                Incident Details <span className="required">*</span>
              </label>
              <textarea
                name="details"
                value={formData.details}
                onChange={handleChange}
                rows="5"
                placeholder="Describe the emergency situation..."
                required
                disabled={isSubmitting}
                className="form-textarea"
              ></textarea>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-people-fill" style={{ color: '#6b7280', fontSize: '14px', marginRight: '6px' }}></i>
                  Number of People Affected
                </label>
                <select
                  name="people"
                  value={formData.people}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="form-select"
                >
                  <option value="">Select range</option>
                  {PEOPLE_AFFECTED_OPTIONS.map((range) => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">
                  <i className="bi bi-camera-fill" style={{ color: '#6b7280', fontSize: '14px', marginRight: '6px' }}></i>
                  Photo (Optional - JPEG/JPG, Max 20MB)
                </label>
                <input
                  type="file"
                  name="photo"
                  onChange={handleChange}
                  accept=".jpg,.jpeg,image/jpeg"
                  disabled={isSubmitting}
                  className="form-file"
                />
              </div>
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
                    <i className="bi bi-hourglass-split loading-spinner"></i> Submitting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send-fill"></i> Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default ResidentEmergencyModal;