import React from "react";

export default function DonationModal({ selectedNews, setShowModal }) {
  if (!selectedNews) return null;

  return (
    <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content p-3">
          <div className="modal-header">
            <h5 className="modal-title">{selectedNews.title}</h5>
            <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
          </div>
          <div className="modal-body">
            <p>{selectedNews.content}</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

