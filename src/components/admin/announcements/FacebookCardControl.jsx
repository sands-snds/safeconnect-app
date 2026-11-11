import React, { useRef, useState } from "react";
import FacebookPageCard, { useFacebookCard } from "../../shared/FacebookPageCard";
import { setFacebookCardEnabled, uploadFacebookCardImage } from "../../../Services/api";
import { tx } from "../../../i18n/adminText";

// The Facebook page card, always the first item of the Announcements list:
// the card as residents see it, with Change picture and an On / Off switch in
// a strip at its bottom. It can't be deleted.
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

const FacebookCardControl = () => {
  const [card, setCard] = useFacebookCard();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  if (!card) return null;

  const save = async (action) => {
    setBusy(true);
    setError("");
    try {
      const result = await action();
      if (result.success && result.card) setCard(result.card);
      else setError(result.message || tx("Couldn’t save the Facebook card."));
    } finally {
      setBusy(false);
    }
  };

  const pickImage = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setError(tx("Only JPEG, PNG, or WEBP images are allowed."));
      return;
    }
    save(() => uploadFacebookCardImage(file));
  };

  return (
    <div aria-label={tx("Facebook page card")} role="group">
      <FacebookPageCard
        card={card}
        off={!card.enabled}
        labels={{
          kicker: tx("Official Facebook page"),
          title: tx("Barangay Sta. Fe on Facebook"),
          subtitle: tx("More news, photos and advisories from the barangay."),
          visit: tx("Visit page")
        }}
        footer={(
          <>
            <span style={{ marginRight: "auto", fontSize: 12.5, color: "#6b7280" }}>
              <i className="bi bi-pin-angle-fill" style={{ color: "#6B2C3E", marginRight: 6 }} aria-hidden="true" />
              {tx("Pinned first on the residents’ News page. It can be turned off, not deleted.")}
            </span>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              style={{ fontSize: 12.5, padding: "6px 12px" }}
            >
              <i className="bi bi-image" aria-hidden="true" /> {busy ? tx("Uploading…") : tx("Change picture")}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickImage} />
            <button
              type="button"
              role="switch"
              aria-checked={card.enabled}
              aria-label={tx("Facebook page card")}
              disabled={busy}
              onClick={() => save(() => setFacebookCardEnabled(!card.enabled))}
              title={card.enabled ? tx("Shown to residents") : tx("Hidden from residents")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, minHeight: 34, padding: "0 12px", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                border: `1px solid ${card.enabled ? "#166534" : "#d1d5db"}`, background: card.enabled ? "#dcfce7" : "#f3f4f6", color: card.enabled ? "#166534" : "#6b7280"
              }}
            >
              <i className={`bi ${card.enabled ? "bi-toggle-on" : "bi-toggle-off"}`} style={{ fontSize: 18 }} aria-hidden="true" />
              {card.enabled ? tx("On") : tx("Off")}
            </button>
          </>
        )}
      />
      {error && <p role="alert" style={{ margin: "6px 0 0", fontSize: 12.5, fontWeight: 600, color: "#dc2626" }}>{error}</p>}
    </div>
  );
};

export default FacebookCardControl;
