import React from "react";

import DismissalNote from "./DismissalNote";
import ReportImage from "./ReportImage";
import ReportLocationMap from "./ReportLocationMap";
import { ReportForDetails } from "./ReportFor";
import { tx } from "../../../../i18n/adminText";

// The opened row of a report table ("View details"). It only shows what the
// row doesn't: the description first and large, Dismiss beside it, then the
// few extra facts, the photo / video, and the map side by side (stacking on
// narrow screens).
const STYLE = `
  .rdp { display: flex; flex-direction: column; gap: 14px; }
  .rdp-top { display: flex; align-items: flex-start; gap: 14px; flex-wrap: wrap; }
  .rdp-desc { flex: 1 1 360px; min-width: 0; background: #fff; border: 1px solid #f1e4e7; border-left: 4px solid var(--rdp-accent); border-radius: 10px; padding: 12px 16px 14px; }
  /* Neutral labels (as .rdp-fact-label); the report type shows in the left border. */
  .rdp-kicker { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; }
  .rdp-kicker > .bi { color: #9ca3af; }
  .rdp-desc-text { margin: 0; font-size: 15.5px; line-height: 1.55; color: #111827; white-space: pre-wrap; word-break: break-word; }
  .rdp-desc-text.small { font-size: 14.5px; }
  .rdp-desc-text.empty { color: #9ca3af; font-style: italic; font-size: 14px; }
  .rdp-desc-extra { margin-top: 12px; padding-top: 10px; border-top: 1px dashed #ead9dd; }
  .rdp-actions { flex: 0 0 auto; display: flex; align-items: center; gap: 8px; }
  .rdp-body { display: flex; align-items: flex-start; gap: 18px; flex-wrap: wrap; }
  .rdp-facts { flex: 1 1 220px; min-width: 200px; max-width: 340px; display: flex; flex-direction: column; gap: 10px; }
  .rdp-fact { display: flex; gap: 10px; align-items: flex-start; }
  .rdp-fact > i { flex-shrink: 0; width: 28px; height: 28px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; background: #f6eef0; color: #6B2C3E; font-size: 14px; }
  .rdp-fact-label { font-size: 11px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; color: #6b7280; }
  .rdp-fact-value { font-size: 14px; color: #111827; line-height: 1.4; word-break: break-word; white-space: pre-wrap; }
  .rdp-fact-value.muted { color: #9ca3af; }
  .rdp-fact.warn > i { background: #fef3c7; color: #b45309; }
  .rdp-media { flex: 0 0 auto; }
  .rdp-map { flex: 2 1 360px; min-width: 0; }
  .rdp-map:empty, .rdp-media:empty { display: none; }
  @media (max-width: 760px) {
    .rdp-facts { max-width: none; }
    .rdp-actions { width: 100%; justify-content: flex-end; }
  }
`;

// facts: [{ icon, label, value, muted, warn, key }]; empty values are left out.
// extraText: { icon, label, value, empty } shown under the description in the
// same card (petty crime's suspect information).
const ReportDetailsPanel = ({
  extraText = null,
  type,
  report,
  accentColor = "#6B2C3E",
  descriptionLabel = "Description",
  facts = [],
  personLabel,
  actions = null
}) => {
  const description = (report.description || "").trim();
  const shown = facts.filter((f) => f && f.value != null && f.value !== "");

  return (
    <div className="rdp" style={{ "--rdp-accent": accentColor }}>
      <style>{STYLE}</style>

      <DismissalNote report={report} />

      <div className="rdp-top">
        {/* A div, not a section: App.css strips every section's padding. */}
        <div className="rdp-desc" role="region" aria-label={tx(descriptionLabel)}>
          <div className="rdp-kicker">
            <i className="bi bi-chat-square-text-fill" aria-hidden="true" /> {tx(descriptionLabel)}
          </div>
          <p className={`rdp-desc-text${description ? "" : " empty"}`}>
            {description || tx("No description was given.")}
          </p>
          {extraText && (
            <div className="rdp-desc-extra">
              <div className="rdp-kicker">
                <i className={`bi ${extraText.icon}`} aria-hidden="true" /> {extraText.label}
              </div>
              <p className={`rdp-desc-text small${extraText.value ? "" : " empty"}`}>
                {extraText.value || extraText.empty}
              </p>
            </div>
          )}
        </div>
        {actions && <div className="rdp-actions">{actions}</div>}
      </div>

      <div className="rdp-body">
        {(shown.length > 0 || personLabel) && (
          <div className="rdp-facts">
            <ReportForDetails report={report} personLabel={personLabel} />
            {shown.map((f) => (
              <div key={f.key || f.label} className={`rdp-fact${f.warn ? " warn" : ""}`}>
                <i className={`bi ${f.icon}`} aria-hidden="true" />
                <div style={{ minWidth: 0 }}>
                  <div className="rdp-fact-label">{f.label}</div>
                  <div className={`rdp-fact-value${f.muted ? " muted" : ""}`}>{f.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rdp-media">
          <ReportImage type={type} report={report} />
        </div>

        <div className="rdp-map">
          <ReportLocationMap latitude={report.latitude} longitude={report.longitude} />
        </div>
      </div>
    </div>
  );
};

export default ReportDetailsPanel;
