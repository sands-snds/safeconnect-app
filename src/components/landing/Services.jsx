import React from 'react';

function Services() {
  const services = [
    {
      id: 2,
      title: 'Rescue Teams',
      icon: 'bi-truck',
      bgColor: 'bg-danger',
      items: ['Search and rescue', 'Disaster response', 'Emergency medical services']
    },
    {
      id: 3,
      title: 'Volunteers',
      icon: 'bi-hand-thumbs-up',
      bgColor: 'bg-primary',
      items: ['Community outreach', 'First aid support', 'Relief distribution']
    },
    {
      id: 4,
      title: 'Residents',
      icon: 'bi-people',
      bgColor: 'bg-success',
      items: ['Real-time alerts', 'Evacuation assistance', 'Safe shelters']
    },
    {
      id: 5,
      title: 'Donors & Supporters',
      icon: 'bi-heart-fill',
      bgColor: 'bg-warning',
      items: ['Emergency equipment', 'Financial support', 'Training programs']
    }
  ];

  return (
    <section id="services" className="services-section container py-5 mt-5 text-center">
      <h2 className="fw-bold text-danger section-title">Our Services</h2>

      <div 
        className="d-flex flex-wrap justify-content-center"
        style={{
          maxWidth: '820px',
          margin: '0 auto',
          gap: '15px 20px'
        }}
      >
        {services.map((service) => (
          <div
            key={service.id}
            className="d-flex justify-content-center"
            style={{ flex: '1 1 calc(50% - 20px)', minWidth: '320px' }}
          >
            <div
              className={`service-card p-4 text-center ${service.bgColor} text-white rounded shadow`}
              style={{
                width: '100%',
                maxWidth: '380px',
                minHeight: '280px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <i className={`bi ${service.icon} mb-3`} style={{ fontSize: '2.5rem' }}></i>
              <h5 className="fw-bold">{service.title}</h5>
              <ul className="list-unstyled mt-3 mb-0">
                {service.items.map((item, index) => (
                  <li key={index}>
                    <i className="bi bi-check-circle me-2"></i>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Services;
