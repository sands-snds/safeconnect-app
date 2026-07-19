import React from 'react';

const FormField = ({ label, name, type = 'text', required = false, placeholder = '', options = [], min, max }) => (
  <div className="form-field">
    <label className="form-label">
      {label}
    </label>
    {type === 'select' ? (
      <select name={name} required={required} className="form-select">
        {options.map((opt, i) => (
          <option key={i} value={opt}>{opt || 'Select...'}</option>
        ))}
      </select>
    ) : type === 'textarea' ? (
      <textarea name={name} required={required} placeholder={placeholder} className="form-textarea" />
    ) : (
      <input type={type} name={name} required={required} placeholder={placeholder} min={min} max={max} className="form-input" />
    )}
  </div>
);

const FormModal = ({ title, onClose, onSubmit, children, type }) => {
  const getFormFields = () => {
    switch (type) {
      case 'emergency':
        return (
          <>
            <FormField label="Reporter Name *" name="reporter" required />
            <FormField label="Phone Number *" name="phone" type="tel" required placeholder="+63 XXX XXX XXXX" />
            <FormField label="Emergency Type *" name="emergency" type="select" required options={['', 'Fire', 'Flood', 'Medical Emergency', 'Earthquake', 'Accident', 'Crime', 'Other']} />
            <FormField label="Severity *" name="severity" type="select" required options={['', 'Low', 'Medium', 'High', 'Critical']} />
            <FormField label="Location *" name="location" required placeholder="Barangay, City" />
            <FormField label="Description" name="description" type="textarea" placeholder="Describe the emergency situation..." />
            <FormField label="Date *" name="date" type="date" required />
          </>
        );
      case 'assistance':
        return (
          <>
            <FormField label="Requester Name *" name="requester" required />
            <FormField label="Phone Number *" name="phone" type="tel" required placeholder="+63 XXX XXX XXXX" />
            <FormField label="Email Address" name="email" type="email" placeholder="requester@email.com" />
            <FormField label="Assistance Type *" name="assistanceType" type="select" required options={['', 'Food & Water', 'Medical Supplies', 'Shelter', 'Clothing', 'Transportation', 'Other']} />
            <FormField label="Number of People Affected *" name="peopleAffected" type="number" required min="1" max="1000" />
            <FormField label="Location *" name="location" required placeholder="Barangay, City" />
            <FormField label="Description *" name="description" type="textarea" required placeholder="Describe the assistance needed..." />
            <FormField label="Date Needed *" name="date" type="date" required />
          </>
        );
      case 'announcement':
        return (
          <>
            <FormField label="Title *" name="title" required placeholder="Announcement title" />
            <FormField label="Category *" name="category" type="select" required options={['', 'General', 'Emergency Alert', 'Weather Advisory', 'Community Update', 'Other']} />
            <FormField label="Message *" name="message" type="textarea" required placeholder="Write the announcement details..." />
            <FormField label="Date *" name="date" type="date" required />
          </>
        );
      default:
        return children;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="font-bold text-xl uppercase">{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>
            ×
          </button>
        </div>
        <form onSubmit={onSubmit}>
          {getFormFields()}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button type="button" onClick={onClose} className="button button-secondary">
              Cancel
            </button>
            <button type="submit" className="button button-primary">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormModal;
