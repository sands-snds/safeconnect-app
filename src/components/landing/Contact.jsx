  import React from 'react';

  function Contact() {
    const contacts = [  
      {
        id: 2,
        title: 'Rescue',
        subtitle: 'Emergency Services',
        icon: 'bi-truck',
        bgColor: 'bg-danger',
        description: 'For rescue operations and emergencies.',
        email: 'rescue@safeconnect.org',
        phone: '(0987) 456 7394',
        hours: '24 hours a day, 7 days a week',
      },
      {
        id: 3,
        title: 'Volunteers',
        subtitle: 'Support & Assistance',
        icon: 'bi-hand-thumbs-up',
        bgColor: 'bg-primary',
        description: 'For those interested in volunteering.',
        email: 'volunteers@safeconnect.org',
        phone: '(0965) 436 4355',
        hours: 'Monday to Friday',
      },
      {
        id: 4,
        title: 'Resident',
        subtitle: 'Community Members',
        icon: 'bi-people',
        bgColor: 'bg-success',
        description: 'For residents seeking assistance.',
        email: 'residents@safeconnect.org',
        phone: '(0964) 7384 3829',
        hours: 'Monday to Friday',
      },
      {
        id: 5,
        title: 'Donor',
        subtitle: 'Support & Contributions',
        icon: 'bi-heart-fill',
        bgColor: 'bg-warning',
        description: 'For donors and supporters.',
        email: 'donors@safeconnect.org',
        phone: '(0925) 364 5759',
        hours: 'Monday to Friday',
      }
    ];

    return (
      <section id="contact" className="container py-5 mt-5">
        <h2 className="text-center fw-bold mb-4 text-danger">Contact Us</h2>
        <p className="text-center lead text-muted mb-5">
          Get in touch with the right department for your needs. We're here to help.
        </p>

        {/* Center the grid more tightly */}
        <div 
          className="d-flex flex-wrap justify-content-center"
          style={{
            maxWidth: '820px', 
            margin: '0 auto', 
            gap: '15px 20px' 
          }}
        >
          {contacts.map((contact) => (
            <div 
              key={contact.id} 
              className="d-flex justify-content-center"
              style={{ flex: '1 1 calc(50% - 20px)', minWidth: '320px' }}
            >
              <div 
                className="contact-card d-flex flex-column rounded shadow border-0 text-center"
                style={{ width: '100%', maxWidth: '380px' }}
              >
                <div className={`card-header ${contact.bgColor} text-white py-3`}>
                  <i className={`bi ${contact.icon} mb-2`} style={{ fontSize: '2.3rem' }}></i>
                  <h5 className="fw-bold mb-0">{contact.title}</h5>
                  <small className={contact.bgColor === 'bg-warning' ? 'text-dark' : 'text-white-50'}>
                    {contact.subtitle}
                  </small>
                </div>

                <div className="card-body p-3">
                  <p className="small text-muted mb-3">{contact.description}</p>
                  <ul className="list-unstyled small mb-0">
                    <li className="mb-2"><span className="fw-bold">Email:</span> {contact.email}</li>
                    <li className="mb-2"><span className="fw-bold">Phone:</span> {contact.phone}</li>
                    <li><span className="fw-bold">Hours:</span> {contact.hours}</li>
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" 
          rel="stylesheet"
        />
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.10.5/font/bootstrap-icons.min.css" 
          rel="stylesheet"
        />
      </section>
    );
  }

  export default Contact;
