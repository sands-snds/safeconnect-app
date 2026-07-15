import React, { useState, useEffect } from 'react';
import { createPettyCrimeReport } from '../../Services/api';

const CRIME_TYPES = [
  'Theft',
  'Vandalism',
  'Public Disturbance',
  'Suspicious Activity',
  'Trespassing',
  'Harassment',
  'Other'
];
const SERVICE_AREA = {
  barangay: 'Santa Fe',
  city: 'Dasmariñas',
  province: 'Cavite',
  country: 'Philippines',
  lat: 14.3198,
  lng: 120.9644
};

// Reads the currently logged-in resident's name/contact, set at sign-in
const getCurrentUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  } catch {
    return {};
  }
};

function ResidentPettyCrimeModal({ show, type, onClose }) {

  const [formData, setFormData] = useState({
    location: '',
    crimeType: '',
    description: '',
    suspectInfo: '',
    consent: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mapQuery, setMapQuery] = useState(
    `${SERVICE_AREA.lat},${SERVICE_AREA.lng}`
  );

  useEffect(() => {

    document.body.style.overflow =
      show ? 'hidden' : 'auto';

    return () => {
      document.body.style.overflow = 'auto';
    };

  }, [show]);

  useEffect(() => {

    const timer = setTimeout(() => {

      const trimmed =
        formData.location.trim();

      const query = trimmed
        ? `${trimmed}, Barangay ${SERVICE_AREA.barangay}, ${SERVICE_AREA.city}, ${SERVICE_AREA.province}, ${SERVICE_AREA.country}`
        : `${SERVICE_AREA.lat},${SERVICE_AREA.lng}`;

      setMapQuery(query);

    }, 700);

    return () => clearTimeout(timer);

  }, [formData.location]);

  const handleChange = (e) => {

    const { name, value, type, checked } =
      e.target;

    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : value
    }));

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setIsSubmitting(true);

    try {

      const currentUser = getCurrentUser();
      const fullName = currentUser.fullName || 'Anonymous Resident';
      const contact = currentUser.contact || null;

      const fullLocation =
        `${formData.location}, Barangay ${SERVICE_AREA.barangay}, ${SERVICE_AREA.city}, ${SERVICE_AREA.province}, ${SERVICE_AREA.country}`;

      const result = await createPettyCrimeReport({
        crimeType: formData.crimeType,
        fullname: fullName,
        contact,
        location: fullLocation,
        description: formData.description,
        suspectInfo: formData.suspectInfo || null
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to submit report');
      }

      alert(
        'Petty crime report submitted successfully.'
      );

      setFormData({
        location: '',
        crimeType: '',
        description: '',
        suspectInfo: '',
        consent: false
      });

      onClose();

    } catch (error) {

      console.log(error);

      alert(
        'Error submitting report.'
      );

    } finally {

      setIsSubmitting(false);

    }

  };

  if (!show) return null;

  return (

    <div
      className="modal-overlay"
      onClick={(e)=>{
        if(e.target===e.currentTarget){
          onClose();
        }
      }}
      style={{
        position:'fixed',
        top:0,
        left:0,
        right:0,
        bottom:0,
        width:'100vw',
        height:'100vh',
        backgroundColor:'rgba(0,0,0,.75)',
        display:'flex',
        justifyContent:'center',
        alignItems:'center',
        zIndex:10000,
        padding:'20px',
        overflowY:'auto'
      }}
    >

      <div
        onClick={(e)=>e.stopPropagation()}
        style={{
          backgroundColor:'white',
          borderRadius:'12px',
          maxWidth:'800px',
          width:'100%',
          maxHeight:'90vh',
          overflowY:'auto',
          position:'relative',
          boxShadow:'0 20px 60px rgba(0,0,0,.3)'
        }}
      >

        <div style={{
          padding:'20px 24px',
          borderBottom:'1px solid #e5e7eb',
          display:'flex',
          alignItems:'center',
          gap:'12px'
        }}>

          <div style={{
            width:'44px',
            height:'44px',
            borderRadius:'50%',
            backgroundColor:'#dc3545',
            display:'flex',
            alignItems:'center',
            justifyContent:'center'
          }}>
            <i
              className="bi bi-shield-exclamation"
              style={{
                fontSize:'22px',
                color:'white'
              }}
            ></i>
          </div>

          <h2 style={{
            margin:0,
            fontSize:'20px',
            fontWeight:'700',
            color:'#1f2937',
            flex:1
          }}>
            Report Petty Crime
          </h2>

          <button
            onClick={onClose}
            type="button"
            style={{
              background:'transparent',
              border:'none',
              fontSize:'22px',
              cursor:'pointer',
              color:'#9ca3af',
              padding:'4px'
            }}
          >
            <i className="bi bi-x-lg"></i>
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          style={{ padding:'24px' }}
        >

          <div style={{ marginBottom:'16px' }}>

            <label style={{
              display:'flex',
              alignItems:'center',
              gap:'6px',
              marginBottom:'8px',
              fontWeight:'600',
              color:'#374151',
              fontSize:'13px'
            }}>
              <i className="bi bi-shield-fill-exclamation"></i>
              Crime Type
              <span style={{color:'#dc3545'}}>*</span>
            </label>

            <select
              name="crimeType"
              required
              value={formData.crimeType}
              onChange={handleChange}
              style={{
                width:'100%',
                padding:'10px 14px',
                borderRadius:'6px',
                border:'1px solid #d1d5db'
              }}
            >
              <option value="">
                Select Type
              </option>

              {CRIME_TYPES.map(item=>(
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

          <div style={{ marginTop:'20px', marginBottom:'16px' }}>

            <label style={{
              display:'flex',
              alignItems:'center',
              gap:'6px',
              marginBottom:'8px',
              fontWeight:'600',
              color:'#374151',
              fontSize:'13px'
            }}>
              <i className="bi bi-geo-alt-fill"></i>
              Current Location
              <span style={{color:'#dc3545'}}>*</span>
            </label>

            <input
              type="text"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              placeholder="Street / Landmark in Barangay Santa Fe"
              style={{
                width:'100%',
                padding:'10px 14px',
                borderRadius:'6px',
                border:'1px solid #d1d5db',
                fontSize:'14px',
                outline:'none'
              }}
            />

            <div style={{
              marginTop:'6px',
              fontSize:'12px',
              color:'#6b7280'
            }}>
              Reports are limited to Barangay Santa Fe, Dasmariñas, Cavite, Philippines
            </div>

          </div>

          <div style={{
            marginBottom:'16px',
            borderRadius:'8px',
            overflow:'hidden',
            border:'1px solid #d1d5db'
          }}>

            <iframe
              title="Location Map"
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`}
              style={{
                width:'100%',
                height:'180px',
                border:0
              }}
            />

            <a
              href={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:'block',
                padding:'8px 10px',
                fontSize:'12px',
                color:'#dc3545',
                textDecoration:'none',
                borderTop:'1px solid #e5e7eb'
              }}
            >
              <i className="bi bi-box-arrow-up-right"></i>
              {" "}
              Open this location in Google Maps
            </a>

          </div>

          </div>

          <div style={{marginBottom:'16px'}}>

            <label style={{
              display:'flex',
              alignItems:'center',
              gap:'6px',
              marginBottom:'8px',
              fontWeight:'600',
              color:'#374151',
              fontSize:'13px'
            }}>
              <i className="bi bi-chat-left-text-fill"></i>
              Description
              <span style={{color:'#dc3545'}}>*</span>
            </label>

            <textarea
              name="description"
              rows="4"
              required
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what happened..."
              style={{
                width:'100%',
                padding:'10px 14px',
                borderRadius:'6px',
                border:'1px solid #d1d5db'
              }}
            />

          </div>

          <div style={{marginBottom:'16px'}}>

            <label style={{
              display:'flex',
              alignItems:'center',
              gap:'6px',
              marginBottom:'8px',
              fontWeight:'600',
              color:'#374151',
              fontSize:'13px'
            }}>
              <i className="bi bi-person-fill"></i>
              Suspect Information
            </label>

            <textarea
              name="suspectInfo"
              rows="3"
              value={formData.suspectInfo}
              onChange={handleChange}
              placeholder="Appearance, clothing, vehicle..."
              style={{
                width:'100%',
                padding:'10px 14px',
                borderRadius:'6px',
                border:'1px solid #d1d5db'
              }}
            />

          </div>

          <div style={{marginBottom:'20px'}}>

            <label style={{
              display:'flex',
              alignItems:'flex-start',
              gap:'10px',
              cursor:'pointer',
              fontSize:'12px',
              color:'#374151'
            }}>

              <input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleChange}
                required
                style={{
                  accentColor:'#dc3545'
                }}
              />

              <span>
                I confirm that this report is accurate and consent to submit this petty crime report for review and action.
              </span>

            </label>

          </div>

          <div style={{
            display:'grid',
            gridTemplateColumns:'1fr 1fr',
            gap:'12px'
          }}>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding:'12px 20px',
                borderRadius:'24px',
                border:'none',
                background:'#6b7280',
                color:'white',
                fontWeight:'600'
              }}
            >
              <i className="bi bi-x-circle-fill"></i> Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding:'12px 20px',
                borderRadius:'24px',
                border:'none',
                background:'#dc3545',
                color:'white',
                fontWeight:'600'
              }}
            >
              {isSubmitting ? (
                <>
                  <i className="bi bi-hourglass-split"></i>
                  {" "}Submitting...
                </>
              ) : (
                <>
                  <i className="bi bi-send-fill"></i>
                  {" "}Submit Crime Report
                </>
              )}
            </button>

          </div>

        </form>

      </div>

    </div>

  );

}

export default ResidentPettyCrimeModal;