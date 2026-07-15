import React, { useState } from "react";

const newsItems = [
  {
    title: "Emergency Flash Flood Response",
    date: "April 15, 2024",
    location: "Cagayan Valley, Philippines",
    badge: "Emergency Response",
    badgeColor: "danger",
    image: "https://cdn.hswstatic.com/gif/flash-flood-update.jpg",
    description: "Our rapid response team deployed within 24 hours to provide emergency shelter and medical aid to over 5,000 displaced families.",
    content: "Our emergency response teams have been working around the clock in Southeast Asia following devastating floods. We've established 15 temporary shelters, provided medical care to thousands, and distributed essential supplies including food, water, and hygiene kits to affected communities.",
    impact: "5,000+ families displaced; 15,000 individuals affected",
    responseTime: "24-hour rapid response deployment",
    donations: "₱25,000 raised from 1041 donors",
    situationOverview: "Heavy monsoon rains have caused rivers in the Cagayan Valley to overflow, resulting in widespread flooding in towns such as Tuguegarao, Aparri, and Lal-lo. Hundreds of families have been displaced, homes and farmland submerged, and roads rendered impassable. Immediate assistance is needed for food, clean water, temporary shelter, and medical supplies to support affected communities.",
    responseActions: [
      "Deployed 12 emergency response teams across affected regions",
      "Provided emergency shelter for 5,000+ families",
      "Distributed 75,000 liters of clean drinking water",
      "Delivered 10,000 emergency food packages"
    ]
  },
  {
    title: "Emergency Earthquake Response",
    date: "October 12, 2025",
    location: "Davao Oriental, Philippines",
    badge: "Recovery",
    badgeColor: "warning",
    image: "https://newsinfo.inquirer.net/files/2025/10/AFP__20251011__78EW34P__v1__HighRes__PhilippinesEarthquakeTsunami-1200x740.jpg",
    description: "Thanks to your generous donations, we've rebuilt 150 homes and established 3 medical clinics in earthquake-affected regions.",
    content: "Three months after the devastating earthquake, our recovery program has made significant progress. With the support of our donors, we've successfully rebuilt 150 homes, established 3 fully-equipped medical clinics, and provided vocational training to 500 individuals to help them rebuild their livelihoods.",
    impact: "150 homes rebuilt; 3 medical clinics established",
    responseTime: "3-month ongoing recovery program",
    donations: "₱45,000 raised from 2,678 donors",
    situationOverview: "Davao Oriental, located along the Eastern Mindanao Fault, recently experienced a strong earthquake that damaged homes, schools, and public infrastructure in municipalities like Mati and Baganga. Many families are now displaced, and urgent assistance is needed for temporary shelter, food, water, and medical care for those affected.",
    responseActions: [
      "Rebuilt 150 permanent homes for affected families",
      "Established 3 fully-equipped medical clinics",
      "Provided vocational training to 500 individuals",
      "Distributed construction materials to 300 families"
    ]
  },
  {
    title: "Emergency Fire Response",
    date: "December 10, 2024",
    location: "Sitio San Roque, Marikina City, Philippines",
    badge: "Shelter Program",
    badgeColor: "primary",
    image: "https://media.licdn.com/dms/image/v2/D5612AQFYrBWsYGxJhQ/article-inline_image-shrink_1000_1488/article-inline_image-shrink_1000_1488/0/1711134337223?e=2147483647&v=beta&t=2EQiaYIsyAHNWLxoXQ_rQd4Fjb3RjM_0LPa-TqzCT4I",
    description: "Our fire relief program has provided temporary shelter, food, and essential supplies for over 200 individuals affected by residential fires, helping them recover safely from the disaster.",
    content: "As winter temperatures dropped to record lows, our emergency shelter program opened its doors to provide warmth and safety. We've served hot meals daily, provided warm clothing and blankets, and connected individuals with long-term housing solutions and support services.",
    impact: "2,000+ individuals sheltered; 50,000+ meals served",
    responseTime: "3-week fire relief program",
    donations: "₱15,000 raised from 892 donors",
    situationOverview: "A major residential fire broke out in Sitio San Roque, a densely populated area of Marikina City. Several houses were destroyed, leaving dozens of families without shelter. Immediate support is needed for temporary housing, food, clothing, and basic necessities for affected residents.",
    responseActions: [
      "Opened 5 emergency shelters for families displaced by residential fires",
      "Distributed 10,000+ hot meals and relief packs to affected households",
      "Provided temporary housing and recovery support to 400 fire-affected families"
    ]
  }
];

export default function DonationNewsSection() {
  const [showModal, setShowModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  const handleReadMore = (news) => {
    setSelectedNews(news);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedNews(null);
  };

  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.75);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          padding: 20px;
          overflow-y: auto;
        }

        .modal-content-wrapper {
          background: white;
          border-radius: 12px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 24px;
          color: #666;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          z-index: 10;
          transition: all 0.2s ease;
        }

        .modal-close-btn:hover {
          background: #f5f5f5;
          color: #333;
          transform: rotate(90deg);
        }

        .modal-header-image {
          width: 100%;
          height: 300px;
          object-fit: cover;
          border-radius: 12px 12px 0 0;
        }

        .modal-body {
          padding: 40px;
        }

        .modal-meta {
          display: flex;
          align-items: center;
          gap: 15px;
          color: #666;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .modal-meta i {
          color: #b81c1c;
        }

        .modal-title {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 30px;
          line-height: 1.3;
        }

        .modal-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
          padding: 25px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .modal-stat {
          text-align: center;
        }

        .modal-stat-label {
          font-size: 12px;
          font-weight: 600;
          color: #b81c1c;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .modal-stat-value {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.4;
        }

        .modal-section {
          margin-bottom: 30px;
        }

        .modal-section-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 15px;
        }

        .modal-section-content {
          font-size: 15px;
          line-height: 1.7;
          color: #4a4a4a;
        }

        .modal-actions-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .modal-action-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .modal-action-item:last-child {
          border-bottom: none;
        }

        .modal-action-icon {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          background: #b81c1c;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
        }

        .modal-action-icon svg {
          width: 14px;
          height: 14px;
          color: white;
        }

        .modal-action-text {
          font-size: 15px;
          line-height: 1.6;
          color: #4a4a4a;
          flex: 1;
        }

        .modal-footer {
          padding: 25px 40px;
          background: #f8f9fa;
          border-radius: 0 0 12px 12px;
          display: flex;
          justify-content: center;
        }

        .modal-close-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 40px;
          border-radius: 25px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-close-button:hover {
          background: #5a6268;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .modal-header-image {
            height: 200px;
          }

          .modal-body {
            padding: 25px;
          }

          .modal-title {
            font-size: 22px;
          }

          .modal-stats {
            grid-template-columns: 1fr;
            gap: 15px;
            padding: 20px;
          }

          .modal-footer {
            padding: 20px 25px;
          }
        }
      `}</style>

      <section className="news-section" id="news">
        <div className="container py-5">
          <h2 className="text-center news-title mb-3">DONATION NEWS</h2>
          <p className="text-center news-description mb-5">
            Stay updated with our latest rescue operations and see how your donations are making<br />
            a real impact in emergency situations worldwide.
          </p>
          
          <div className="row g-4">
            {newsItems.map((item, index) => (
              <div className="col-md-4" key={index}>
                <div className="card h-100">
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={item.image} 
                      className="card-img-top" 
                      alt={item.title}
                    />
                    <span className={`badge bg-${item.badgeColor} tag-badge`}>
                      {item.badge}
                    </span>
                  </div>
                  <div className="card-body d-flex flex-column">
                    <div className="mb-2 text-muted small">
                      <i className="bi bi-calendar3 me-2"></i>{item.date}
                    </div>
                    <h5 className="card-title">{item.title}</h5>
                    <p className="card-text flex-grow-1">{item.description}</p>
                    <button 
                      className="card-link mt-2"
                      onClick={() => handleReadMore(item)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        padding: 0,
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      Read More →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-5">
            <a href="#all-news" className="btn btn-danger">
              <i className="bi bi-newspaper me-2"></i> View All News
            </a>
          </div>
        </div>
      </section>

      {showModal && selectedNews && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseModal}>
              ×
            </button>
            
            <img 
              src={selectedNews.image} 
              alt={selectedNews.title}
              className="modal-header-image"
            />
            
            <div className="modal-body">
              <div className="modal-meta">
                <span><i className="bi bi-calendar3"></i> {selectedNews.date}</span>
                <span><i className="bi bi-geo-alt"></i> {selectedNews.location}</span>
              </div>
              
              <h2 className="modal-title">{selectedNews.title}</h2>
              
              <div className="modal-stats">
                <div className="modal-stat">
                  <div className="modal-stat-label">Impact</div>
                  <div className="modal-stat-value">{selectedNews.impact}</div>
                </div>
                <div className="modal-stat">
                  <div className="modal-stat-label">Response Time</div>
                  <div className="modal-stat-value">{selectedNews.responseTime}</div>
                </div>
                <div className="modal-stat">
                  <div className="modal-stat-label">Donations</div>
                  <div className="modal-stat-value">{selectedNews.donations}</div>
                </div>
              </div>
              
              <div className="modal-section">
                <h3 className="modal-section-title">Situation Overview</h3>
                <p className="modal-section-content">{selectedNews.situationOverview}</p>
              </div>
              
              <div className="modal-section">
                <h3 className="modal-section-title">Our Response Actions</h3>
                <ul className="modal-actions-list">
                  {selectedNews.responseActions.map((action, idx) => (
                    <li key={idx} className="modal-action-item">
                      <div className="modal-action-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="modal-action-text">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="modal-close-button" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}