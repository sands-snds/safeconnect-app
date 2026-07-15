import React from 'react';

function About() {
  const pillars = [
    {
      id: 2,
      title: 'Rescue Organizations',
      icon: 'bi-truck',
      color: 'danger',
      description: 'Professional rescue teams and emergency services providing specialized response capabilities and expertise.',
      items: ['Emergency medical services', 'Fire and rescue operations', 'Search and rescue', 'Disaster response']
    },
    {
      id: 3,
      title: 'Volunteers',
      icon: 'bi-people',
      color: 'success',
      description: 'Dedicated community volunteers providing on-ground support, local knowledge, and additional manpower during emergencies.',
      items: ['Community outreach', 'First aid support', 'Evacuation assistance', 'Relief distribution']
    },
    {
      id: 4,
      title: 'Residents',
      icon: 'bi-house-door',
      color: 'primary',
      description: 'Local residents ensuring preparedness, cooperation, and resilience within their communities during crises.',
      items: ['Family preparedness', 'Community cooperation', 'Reporting emergencies', 'Maintaining resilience']
    },
    {
      id: 5,
      title: 'Donors',
      icon: 'bi-heart-fill',
      color: 'warning',
      description: 'Generous individuals and organizations providing financial support, equipment, and resources for emergency preparedness.',
      items: ['Emergency equipment', 'Relief supplies', 'Technology infrastructure', 'Training programs']
    }
  ];

  return (
    <section id="about" className="about-us py-5 mt-5">
      {/* About Us */}
      <div className="container mb-5">
        <div className="col-lg-10 col-xl-8 mx-auto text-center">
          <div className="about-content">
            <h2 className="fw-bold mb-3 about-mission-title">About Us</h2>
            <p className="lead text-muted about-subtitle">
              <b>SafeConnect</b> is a community-based platform designed to strengthen disaster preparedness and response. Our mission is to connect people, organizations, and responders to ensure fast communication and coordinated action during emergencies.
            </p>
            <p className="lead text-muted about-subtitle">
              SafeConnect brings together individuals, local responders, volunteers, and organizations into a unified network where information flows quickly and effectively. From real-time alerts to resource sharing, we make it possible for communities to respond faster, help each other more efficiently, and recover more smoothly.
            </p>
            <p className="lead text-muted about-subtitle">
              We understand that disasters affect everyone differently, and preparedness goes beyond emergency kits and plans. It’s about building trust, fostering collaboration, and empowering people to take action before, during, and after a crisis. That’s why <b>SafeConnect</b> is more than a platform — it’s a community movement dedicated to resilience, safety, and mutual support.
            </p>
            <p className="lead text-muted about-subtitle">
              Join us as we continue to make the online world a safer place — one connection at a time.
            </p>
          </div>
        </div>
      </div>

      {/* Our Mission */}
      <div className="container mb-5">
        <div className="col-lg-10 col-xl-8 mx-auto text-center">
          <div className="about-content">
            <h2 className="fw-bold mb-3 about-mission-title">Our Mission</h2>
            <p className="lead about-text mb-4">
              <b>SafeConnect</b> is a comprehensive emergency response platform that brings together Local Government Units (LGUs), 
              rescue organizations, volunteers, and communities to create a unified network of safety and preparedness. 
              We believe that when everyone is connected and informed, we can respond faster, save more lives, and build 
              more resilient communities.
            </p>
            <p className="lead about-text">
              Our platform serves as the critical link between those who need help and those who can provide it, 
              ensuring that no call for assistance goes unanswered and no community stands alone in times of crisis.
            </p>
          </div>
        </div>
      </div>

      {/* Our Network */}
      <div className="container mb-5">
        <div className="col-lg-10 col-xl-8 mx-auto text-center">
          <div className="about-content">
            <h2 className="fw-bold mb-3 text-danger network-title">Our Network</h2>
            <p className="lead text-muted about-subtitle">
              At <b>SafeConnect</b>, our network is made up of people and organizations united by one goal — keeping communities safe and prepared in times of disaster.
            </p>
            <p className="lead text-muted about-subtitle">
              We connect local responders, volunteers, and citizens through a reliable communication system that ensures quick coordination and support when it matters most. 
              By linking communities, government units, and aid organizations, we make disaster response faster, more organized, and more effective.
            </p>
            <p className="lead text-muted about-subtitle">
              Every connection in our network helps save lives, share resources, and build resilience. Together, we stand stronger before, during, and after every crisis.
            </p>
          </div>
        </div>
      </div>

     {/* Pillars */}
      <div className="container d-flex justify-content-center">
    <div className="row" style={{ maxWidth: '700px' }}> 
      {pillars.map((pillar) => (
        <div 
          key={pillar.id} 
          className="col-6 d-flex justify-content-center"
          style={{ padding: '5px' }} 
          >
          <div className="pillar-card text-center p-3 rounded shadow border-0 d-flex flex-column" style={{width: '100%'}}>
            <div className="pillar-icon mb-2">
              <div className={`icon-circle bg-${pillar.color} mx-auto d-flex align-items-center justify-content-center rounded-circle`} style={{width:'50px', height:'50px'}}>
                <i className={`bi ${pillar.icon} pillar-icon-size text-white`} style={{fontSize:'24px'}}></i>
              </div>
            </div>
            <h4 className={`text-${pillar.color} fw-bold pillar-title`}>{pillar.title}</h4>
            <p className="text-muted mb-2 small pillar-description">{pillar.description}</p>
            <ul className="list-unstyled text-start small pillar-list flex-grow-1">
              {pillar.items.map((item, index) => (
                <li key={index} className="mb-1">
                  <i className={`bi bi-check-circle text-${pillar.color} me-2`}></i> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  </div>


    </section>
  );
}

export default About;
