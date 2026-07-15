import React, { useState } from 'react';
import VolunteerNavbar from '../components/volunteer/VolunteerNavbar';

export default function VolunteerPage() {
  const [showStatus, setShowStatus] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    email: '',
    contact: '',
    dob: '',
    skills: '',
    availability: '',
    dateSubmitted: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
 
  const [submittedData, setSubmittedData] = useState(() => {
  const saved = localStorage.getItem('volunteerData');
  return saved ? JSON.parse(saved) : null;
});


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleViewStatus = (e) => {
    e.preventDefault();
    setShowStatus(true);
  };

  const generateNewId = async () => {
    try {
      const existingResponse = await fetch("https://sheetdb.io/api/v1/v3sl33nft98qd");
      
      if (!existingResponse.ok) {
        console.warn('Could not fetch existing data, using timestamp fallback');
        return Date.now();
      }
      
      const existingData = await existingResponse.json();
      
      if (!Array.isArray(existingData) || existingData.length === 0) {
        return 1; 
      }
      
      const maxId = Math.max(...existingData.map(item => {
        const id = parseInt(item.Id);
        return isNaN(id) ? 0 : id;
      }));
      
      return maxId + 1; 
      
    } catch (error) {
      console.error('Error generating ID:', error);
      return Date.now(); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) {
      alert('Submission in progress, please wait...');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📤 Submitting volunteer application...', formData);

      const newId = await generateNewId();
      console.log('🆔 Generated ID:', newId);

      const response = await fetch("https://sheetdb.io/api/v1/v3sl33nft98qd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [{
            "Id": newId, 
            "FULL NAME": formData.fullName,
            "EMAIL ADDRESS": formData.email,
            "DATE OF BIRTH": formData.dob,
            "ADDRESS": formData.address,
            "CONTACT NUMBER": formData.contact,
            "SKILLS": formData.skills,
            "AVAILABILITY": formData.availability,
            "TIMESTAMP": new Date().toLocaleString(),
            "STATUS": "Pending"
          }]
        }),
      });
      
      console.log('📊 Response status:', response.status);
      const responseText = await response.text();
      console.log('📄 Response body:', responseText);

      if (response.ok) {
        setSubmitted(true);
        setSubmittedData(formData); 
        localStorage.setItem('volunteerData', JSON.stringify(formData));

        alert("Thank you for your application! We will review it and get back to you soon.");
        
        setFormData({
          fullName: '',
          address: '',
          email: '',
          contact: '',
          dob: '',
          skills: '',
          availability: '',
          dateSubmitted: ''
        });
      } else if (response.status === 429) {
        alert('⚠️ Submission limit reached. Please try again later or contact the administrator.');
      } else {
        alert(`Submission failed (Status: ${response.status}). ${responseText || 'Please try again later.'}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(`Error submitting form: ${error.message}. Please try again later.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToForm = () => {
    setShowStatus(false);
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.navbarContainer}>
        <VolunteerNavbar />
      </div>
      <div style={styles.body}>
        <div style={styles.overlay}></div>
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.headerTitle}>Join Our Mission</h1>
            <p style={styles.headerText}>
              Make a difference in your community by becoming a Safe Connect volunteer. 
              Help us build safer neighborhoods and stronger communities together.
            </p>
          </div>

          {!showStatus ? (
            <div style={styles.formContainer}>
              <h2 style={styles.formTitle}>BECOME A VOLUNTEER</h2>
              <form onSubmit={handleSubmit}>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>FULL NAME</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      style={styles.input}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>ADDRESS / BARANGAY</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter your address"
                      style={styles.input}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>EMAIL ADDRESS</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      style={styles.input}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>CONTACT NUMBER</label>
                    <input
                      type="tel"
                      name="contact"
                      value={formData.contact}
                      onChange={handleInputChange}
                      placeholder="Enter your contact number"
                      style={styles.input}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>DATE OF BIRTH</label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      style={styles.input}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>SKILLS</label>
                    <select
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      style={styles.input}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">Select your skills</option>
                      <option value="first-aid">First Aid</option>
                      <option value="communication">Communication</option>
                      <option value="organization">Organization</option>
                      <option value="teaching">Teaching</option>
                      <option value="technology">Technology</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.fullWidthGroup}>
                    <label style={styles.label}>AVAILABILITY</label>
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      style={styles.input}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">Select your availability</option>
                      <option value="weekdays">Weekdays</option>
                      <option value="weekends">Weekends</option>
                      <option value="flexible">Flexible</option>
                      <option value="mornings">Mornings Only</option>
                      <option value="afternoons">Afternoons Only</option>
                      <option value="evenings">Evenings Only</option>
                    </select>
                  </div>
                </div>

                <div style={styles.submitSection}>
                  <button 
                    type="submit" 
                    style={{
                      ...styles.submitBtn,
                      opacity: isSubmitting ? 0.6 : 1,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
                  </button>
                </div>
              </form>

              <div style={styles.viewStatusContainer}>
                <a
                  href="#"
                  onClick={handleViewStatus}
                  style={styles.viewStatusLink}
                >
                  VIEW APPLICATION STATUS
                </a>
              </div>
            </div>
          ) : (
            <div style={styles.statusContainer}>
              <h2 style={styles.statusTitle}>APPLICATION STATUS</h2>
              <p style={styles.statusText}>Check your application progress below:</p>

              <div style={styles.statusBadge}>Pending</div>

              <div style={styles.statusGrid}>
              <div style={styles.statusItem}>
                <p style={styles.statusLabel}>Name</p>
                <p style={styles.statusValue}>{(submittedData?.fullName || formData.fullName) || 'N/A'}</p>
              </div>

              <div style={styles.statusItem}>
                <p style={styles.statusLabel}>Address</p>
                <p style={styles.statusValue}>{(submittedData?.address || formData.address) || 'N/A'}</p>
              </div>

              <div style={styles.statusItem}>
                <p style={styles.statusLabel}>Email</p>
                <p style={styles.statusValue}>{(submittedData?.email || formData.email) || 'N/A'}</p>
              </div>

              <div style={styles.statusItem}>
                <p style={styles.statusLabel}>Contact</p>
                <p style={styles.statusValue}>{(submittedData?.contact || formData.contact) || 'N/A'}</p>
              </div>

              <div style={styles.statusItem}>
                <p style={styles.statusLabel}>Date of Birth</p>
                <p style={styles.statusValue}>{(submittedData?.dob || formData.dob) || 'N/A'}</p>
              </div>

              <div style={styles.statusItem}>
                <p style={styles.statusLabel}>Skills</p>
                <p style={styles.statusValue}>{(submittedData?.skills || formData.skills) || 'N/A'}</p>
              </div>

              <div style={styles.statusItem}>
                <p style={styles.statusLabel}>Availability</p>
                <p style={styles.statusValue}>{(submittedData?.availability || formData.availability) || 'N/A'}</p>
              </div>

              <div style={styles.statusItem}>
                <p style={styles.statusLabel}>Date Submitted</p>
                <p style={styles.statusValue}>
                  {submittedData ? new Date().toLocaleString() : 'Pending submission'}
                </p>
              </div>

              <div style={styles.statusItem}>
                <p style={styles.statusLabel}>Remarks</p>
                <p style={styles.statusValue}>
                  Your application is under review. You'll receive an update soon.
                </p>
              </div>
            </div>

              <div style={styles.nextStepsBox}>
                <h3 style={styles.nextStepsTitle}>Next Steps</h3>
                <p style={styles.nextStepsText}>
                  Once your application is reviewed, we'll reach out via email for the next stage of onboarding.
                </p>
              </div>

              <button onClick={handleBackToForm} style={styles.backBtn}>
                Back to Form
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


const styles = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column'
  },
  navbarContainer: {
    width: '100%',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  body: {
    fontFamily: 'Arial, sans-serif',
    backgroundImage: 'url("/images/volunteer-bg.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    flex: 1,
    margin: 0,
    padding: '20px 15px',
    position: 'relative'
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    zIndex: -1
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
    width: '100%'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '0 10px'
  },
  headerTitle: {
    color: '#6b2c2c',
    fontSize: '2em',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  headerText: {
    color: '#8b3a3a',
    fontSize: '1em',
    lineHeight: '1.5'
  },
  formContainer: {
    backgroundColor: '#f5e6e8',
    border: '3px solid #6b2c2c',
    borderRadius: '12px',
    padding: '30px 25px',
    width: '100%',
    boxSizing: 'border-box'
  },
  formTitle: {
    textAlign: 'center',
    color: '#6b2c2c',
    fontSize: '1.5em',
    marginBottom: '30px',
    fontWeight: 'bold'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
    alignItems: 'start'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '80px'
  },
  fullWidthGroup: {
    display: 'flex',
    flexDirection: 'column',
    gridColumn: '1 / -1'
  },
  label: {
    color: '#6b2c2c',
    fontSize: '0.8em',
    fontWeight: 'bold',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    height: '16px', 
    display: 'flex',
    alignItems: 'center'
  },
  input: {
    padding: '12px',
    border: '2px solid #8b3a3a',
    borderRadius: '6px',
    fontSize: '0.9em',
    backgroundColor: 'white',
    color: '#333',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '44px', 
    margin: 0 
  },
  submitSection: {
    textAlign: 'center',
    marginTop: '30px'
  },
  submitBtn: {
    backgroundColor: '#6b2c2c',
    color: 'white',
    padding: '14px 40px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    transition: 'background-color 0.3s',
    width: '100%',
    maxWidth: '300px',
    minHeight: '50px'
  },
  viewStatusContainer: {
    textAlign: 'center',
    marginTop: '20px'
  },
  viewStatusLink: {
    display: 'block',
    color: '#6b2c2c',
    textDecoration: 'underline',
    fontWeight: 'bold',
    fontSize: '0.9em',
    cursor: 'pointer'
  },
  statusContainer: {
    backgroundColor: '#f5e6e8',
    border: '3px solid #6b2c2c',
    borderRadius: '12px',
    padding: '30px 25px',
    width: '100%',
    boxSizing: 'border-box'
  },
  statusTitle: {
    textAlign: 'center',
    color: '#6b2c2c',
    fontSize: '1.5em',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  statusText: {
    color: '#8b3a3a',
    marginBottom: '15px',
    textAlign: 'center',
    fontSize: '0.9em'
  },
  statusBadge: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '10px auto',
    width: '100px',
    padding: '6px 0',
    borderRadius: '4px',
    background: '#fef3c7',
    color: '#92400e',
    fontWeight: 'bold',
    marginBottom: '30px',
    fontSize: '0.8em'
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '25px'
  },
  statusItem: {
    textAlign: 'left'
  },
  statusLabel: {
    color: '#8b3a3a',
    fontWeight: 'bold',
    fontSize: '0.75em',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px'
  },
  statusValue: {
    color: '#6b2c2c',
    fontSize: '0.9em',
    wordBreak: 'break-word'
  },
  nextStepsBox: {
    background: '#fef2f2',
    borderLeft: '4px solid #dc2626',
    padding: '20px',
    margin: '25px 0',
    borderRadius: '4px'
  },
  nextStepsTitle: {
    color: '#6b2c2c',
    marginBottom: '10px',
    fontSize: '1em'
  },
  nextStepsText: {
    color: '#8b3a3a',
    lineHeight: '1.5',
    fontSize: '0.9em'
  },
  backBtn: {
    backgroundColor: '#6b2c2c',
    color: 'white',
    padding: '12px 30px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9em',
    fontWeight: 'bold',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    transition: 'background-color 0.3s',
    display: 'block',
    margin: '0 auto',
    width: '100%',
    maxWidth: '200px'
  },
 
  '@media (max-width: 768px)': {
    body: {
      padding: '15px 10px'
    },
    headerTitle: {
      fontSize: '1.8em'
    },
    headerText: {
      fontSize: '0.95em'
    },
    formContainer: {
      padding: '25px 20px'
    },
    formTitle: {
      fontSize: '1.3em'
    },
    formRow: {
      gap: '15px',
      marginBottom: '15px'
    },
    input: {
      padding: '10px',
      fontSize: '0.85em',
      minHeight: '42px'
    },
    label: {
      marginBottom: '6px',
      height: '14px'
    }
  },

  '@media (max-width: 480px)': {
    body: {
      padding: '10px 8px'
    },
    header: {
      marginBottom: '20px'
    },
    headerTitle: {
      fontSize: '1.5em',
      marginBottom: '10px'
    },
    headerText: {
      fontSize: '0.9em',
      lineHeight: '1.4'
    },
    formContainer: {
      padding: '20px 15px',
      borderWidth: '2px'
    },
    formTitle: {
      fontSize: '1.2em',
      marginBottom: '20px'
    },
    formRow: {
      gridTemplateColumns: '1fr',
      gap: '15px', 
      marginBottom: '15px'
    },
    formGroup: {
      minHeight: '75px'
    },
    label: {
      fontSize: '0.75em',
      marginBottom: '6px',
      height: '14px'
    },
    input: {
      padding: '10px',
      fontSize: '0.85em',
      borderWidth: '1px',
      minHeight: '44px' 
    },
    submitBtn: {
      padding: '12px 20px',
      fontSize: '0.9em',
      maxWidth: '100%',
      minHeight: '48px'
    },
    statusContainer: {
      padding: '20px 15px',
      borderWidth: '2px'
    },
    statusTitle: {
      fontSize: '1.2em'
    },
    statusGrid: {
      gridTemplateColumns: '1fr',
      gap: '15px'
    },
    statusBadge: {
      marginBottom: '20px'
    },
    nextStepsBox: {
      padding: '15px',
      margin: '20px 0'
    }
  },

  '@media (max-width: 375px)': {
    body: {
      padding: '8px 5px'
    },
    headerTitle: {
      fontSize: '1.3em'
    },
    headerText: {
      fontSize: '0.85em'
    },
    formContainer: {
      padding: '15px 12px',
      borderRadius: '8px'
    },
    formTitle: {
      fontSize: '1.1em',
      marginBottom: '15px'
    },
    formRow: {
      gap: '12px',
      marginBottom: '12px'
    },
    formGroup: {
      minHeight: '70px'
    },
    label: {
      fontSize: '0.7em',
      marginBottom: '5px',
      height: '12px'
    },
    input: {
      padding: '8px 10px',
      fontSize: '0.8em',
      minHeight: '42px'
    },
    submitBtn: {
      padding: '10px 15px',
      fontSize: '0.85em',
      minHeight: '44px'
    },
    viewStatusLink: {
      fontSize: '0.8em'
    },
    statusContainer: {
      padding: '15px 12px',
      borderRadius: '8px'
    },
    statusTitle: {
      fontSize: '1.1em'
    },
    statusText: {
      fontSize: '0.8em'
    },
    statusGrid: {
      gap: '12px'
    },
    statusLabel: {
      fontSize: '0.7em'
    },
    statusValue: {
      fontSize: '0.8em'
    },
    nextStepsTitle: {
      fontSize: '0.9em'
    },
    nextStepsText: {
      fontSize: '0.8em'
    },
    backBtn: {
      padding: '10px 15px',
      fontSize: '0.85em',
      minHeight: '44px'
    }
  },

  '@media (max-width: 320px)': {
    headerTitle: {
      fontSize: '1.2em'
    },
    formTitle: {
      fontSize: '1em'
    },
    statusTitle: {
      fontSize: '1em'
    },
    input: {
      padding: '7px 8px',
      fontSize: '0.75em'
    },
    formGroup: {
      minHeight: '65px'
    }
  }
};