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

export default FormField;