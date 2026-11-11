import React, { useEffect, useState } from 'react';
import { fetchFacebookCard } from '../../Services/api';

// The barangay's Facebook page, as a small card pinned above the
// announcements: a square picture, a line about the page, and a button that
// opens it. Officials and Admins switch it on / off and change the picture
// from the admin Announcements tab.

// The card's settings ({ enabled, imageUrl, pageUrl }), or null while loading
// or when they can't be read.
export function useFacebookCard() {
  const [card, setCard] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetchFacebookCard()
      .then((c) => { if (!cancelled) setCard(c); })
      .catch(() => { if (!cancelled) setCard(null); });
    return () => { cancelled = true; };
  }, []);
  return [card, setCard];
}

const STYLE = `
  .fb-card { display: flex; align-items: center; gap: 14px; padding: 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
  .fb-card.off { opacity: .55; }
  .fb-card-img { width: 84px; height: 84px; border-radius: 10px; object-fit: cover; flex-shrink: 0; background: #f3f4f6; }
  .fb-card-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  .fb-card-kicker { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; color: #1877f2; letter-spacing: .03em; text-transform: uppercase; }
  .fb-card-title { margin: 0; font-size: 15px; font-weight: 700; color: #111827; line-height: 1.3; }
  .fb-card-sub { margin: 0; font-size: 12.5px; color: #6b7280; line-height: 1.4; }
  .fb-card-go { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: 10px; background: #1877f2; color: #fff; font-size: 13px; font-weight: 700; text-decoration: none; white-space: nowrap; flex-shrink: 0; }
  .fb-card-go:hover { background: #166fe5; color: #fff; }
  @media (max-width: 480px) {
    .fb-card { flex-wrap: wrap; }
    .fb-card-img { width: 64px; height: 64px; }
    .fb-card-go { flex: 1 1 100%; justify-content: center; }
  }
`;

// labels: { kicker, title, subtitle, visit }. off: drawn faded (the admin's
// view of a hidden card).
export default function FacebookPageCard({ card, labels, off = false }) {
  if (!card) return null;
  return (
    <div className={`fb-card${off ? ' off' : ''}`}>
      <style>{STYLE}</style>
      <img className="fb-card-img" src={card.imageUrl} alt="" loading="lazy" />
      <div className="fb-card-text">
        <span className="fb-card-kicker"><i className="bi bi-facebook" aria-hidden="true"></i> {labels.kicker}</span>
        <p className="fb-card-title">{labels.title}</p>
        <p className="fb-card-sub">{labels.subtitle}</p>
      </div>
      <a className="fb-card-go" href={card.pageUrl} target="_blank" rel="noopener noreferrer">
        {labels.visit} <i className="bi bi-box-arrow-up-right" aria-hidden="true"></i>
      </a>
    </div>
  );
}
