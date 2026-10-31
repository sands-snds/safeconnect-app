import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchSiteContent, updateSiteMedia, uploadSiteMedia } from "../../../Services/api";
import { showPopup, confirmPopup } from "../../shared/popup";
import { setSiteMedia, mediaSrc, hasVideo } from "../../shared/useSiteContent";
import DemoVideoPlayer from "../../shared/DemoVideoPlayer";
import { tx } from "../../../i18n/adminText";

const TEXT_MAX = 40;

const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 20 };
const hint = { margin: "0 0 12px", fontSize: 13, color: "#6b7280" };
const label = { fontSize: 12, fontWeight: 600, color: "#6b7280" };

const stackedField = { display: "flex", flexDirection: "column", gap: 4 };
const smallButton = (danger) => ({
  width: 32, height: 32, border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff",
  color: danger ? "#b91c1c" : "#374151", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center"
});

const move = (list, index, delta) => {
  const next = [...list];
  const target = index + delta;
  if (target < 0 || target >= next.length) return list;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

// A labelled on/off switch.
const Toggle = ({ checked, onChange, children }) => (
  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "#111827" }}>
    <span
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onChange(!checked); } }}
      style={{ width: 40, height: 22, borderRadius: 999, background: checked ? "#6B2C3E" : "#d1d5db", position: "relative", flexShrink: 0, transition: "background .15s" }}
    >
      <span style={{ position: "absolute", top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
    </span>
    {children}
  </label>
);

function useUploader() {
  const [progress, setProgress] = useState(null); // null = idle
  const upload = async (file, onUploaded) => {
    setProgress(0);
    const result = await uploadSiteMedia(file, setProgress);
    setProgress(null);
    if (!result?.success) {
      showPopup({ type: "error", title: tx("Upload Failed"), message: result?.message || "Please try again." });
      return;
    }
    onUploaded(result.url);
  };
  return { progress, upload };
}

function VideoEditor({ demo, onChange, children }) {
  const fileRef = useRef(null);
  const { progress, upload } = useUploader();
  const [youtubeInput, setYoutubeInput] = useState(demo.video.source === "youtube" ? `https://youtu.be/${demo.video.url}` : "");
  const source = demo.video.source;

  const setVideo = (video) => onChange({ ...demo, video });

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["video/mp4", "video/webm"].includes(file.type)) {
      showPopup({ type: "warning", title: tx("Unsupported Video"), message: tx("Please choose an MP4 or WebM video.") });
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      showPopup({ type: "warning", title: tx("Video Too Large"), message: tx("Videos must be 100 MB or smaller. For longer videos, upload them to YouTube and paste the link instead.") });
      return;
    }
    upload(file, (url) => setVideo({ source: "upload", url }));
  };

  const chipStyle = (active) => ({
    padding: "7px 12px", borderRadius: 8, border: `1px solid ${active ? "#6B2C3E" : "#d1d5db"}`,
    background: active ? "#FDECEC" : "#fff", color: active ? "#6B2C3E" : "#374151", fontSize: 13, fontWeight: active ? 600 : 500, cursor: "pointer"
  });

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <span style={label}>{tx("Video")}</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            <button type="button" style={chipStyle(source === "upload")} onClick={() => fileRef.current?.click()} disabled={progress !== null}>
              <i className="bi bi-upload" /> {source === "upload" ? tx("Replace uploaded video") : tx("Upload a video")}
            </button>
            <button type="button" style={chipStyle(source === "youtube")} onClick={() => setVideo({ source: "youtube", url: demo.video.source === "youtube" ? demo.video.url : "" })}>
              <i className="bi bi-youtube" /> {tx("YouTube link")}
            </button>
            <button type="button" style={chipStyle(source === "none")} onClick={async () => {
              // Taking a video off asks first.
              if (source !== "none" && !(await confirmPopup({ type: "danger", title: tx("Remove this video?"), message: tx("The video is taken off the site when you save changes."), confirmLabel: tx("Remove") }))) return;
              setVideo({ source: "none", url: "" });
            }}>
              {tx("No video")}
            </button>
            <input ref={fileRef} type="file" accept="video/mp4,video/webm" hidden onChange={pickFile} />
          </div>
          <p style={{ ...hint, margin: "6px 0 0" }}>{tx("MP4 or WebM up to 100 MB. Longer videos work better as a YouTube link.")}</p>
          {progress !== null && (
            <div style={{ marginTop: 8 }}>
              <div style={{ height: 8, background: "#f3f4f6", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "#6B2C3E", transition: "width .2s" }} />
              </div>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{tx("Uploading… {{n}}%", { n: progress })}</span>
            </div>
          )}
        </div>

        {source === "youtube" && (
          <label style={stackedField}>
            <span style={label}>{tx("YouTube link")}</span>
            <input
              className="form-input"
              value={youtubeInput}
              placeholder="https://www.youtube.com/watch?v=..."
              onChange={(e) => {
                setYoutubeInput(e.target.value);
                const m = e.target.value.trim().match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/) || e.target.value.trim().match(/^([\w-]{11})$/);
                setVideo({ source: "youtube", url: m ? m[1] : "" });
              }}
            />
          </label>
        )}

        <label style={stackedField}>
          <span style={label}>{tx("Title")}</span>
          <input className="form-input" value={demo.title} maxLength={TEXT_MAX} onChange={(e) => onChange({ ...demo, title: e.target.value })} />
        </label>
        <label style={stackedField}>
          <span style={label}>{tx("Caption (one or two sentences)")}</span>
          <textarea className="form-input" rows={2} value={demo.caption} maxLength={300} onChange={(e) => onChange({ ...demo, caption: e.target.value })} style={{ resize: "vertical" }} />
        </label>
        {children}
      </div>

      <div style={{ flex: "1 1 320px" }}>
        <span style={label}>{tx("Preview")}</span>
        <div style={{ marginTop: 6 }}>
          <DemoVideoPlayer
            demo={demo}
            placeholder={
              <div style={{ aspectRatio: "16 / 9", borderRadius: 12, background: "#f3f4f6", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, textAlign: "center", padding: 16 }}>
                {source === "youtube" ? tx("Paste a valid YouTube link to preview it.") : tx("No video yet.")}
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}

function CarouselEditor({ icon, title, hint: hintText, slides, onChange }) {
  const photoRef = useRef(null);
  const { progress, upload } = useUploader();

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showPopup({ type: "warning", title: tx("Unsupported Photo"), message: tx("Please choose a JPG, PNG or WebP image.") });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showPopup({ type: "warning", title: tx("Photo Too Large"), message: tx("Photos must be 5 MB or smaller.") });
      return;
    }
    upload(file, (url) => onChange((list) => [...list, { src: url, alt: "" }]));
  };

  return (
    <div style={card}>
      <h3 style={{ margin: "0 0 4px", fontSize: 17 }}>
        <i className={`bi ${icon}`} style={{ color: "#6B2C3E", marginRight: 8 }} />
        {title}
      </h3>
      <p style={hint}>{hintText}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {slides.map((s, i) => (
          <div key={`${s.src}-${i}`} style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", background: "#fafafa" }}>
            <div style={{ position: "relative", aspectRatio: "16 / 9", background: "#e5e7eb" }}>
              <img src={mediaSrc(s.src)} alt={s.alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <span style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,.6)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{i + 1}</span>
            </div>
            <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                className="form-input"
                value={s.alt}
                maxLength={TEXT_MAX}
                placeholder={tx("Short description (for screen readers)")}
                onChange={(e) => onChange((list) => list.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                style={{ fontSize: 13 }}
              />
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button type="button" style={smallButton()} title={tx("Move earlier")} disabled={i === 0} onClick={() => onChange((l) => move(l, i, -1))}><i className="bi bi-arrow-left" /></button>
                <button type="button" style={smallButton()} title={tx("Move later")} disabled={i === slides.length - 1} onClick={() => onChange((l) => move(l, i, 1))}><i className="bi bi-arrow-right" /></button>
                <button type="button" style={smallButton(true)} title={tx("Remove")} disabled={slides.length === 1} onClick={async () => {
                  if (await confirmPopup({ type: "danger", title: tx("Remove this photo?"), message: tx("It's taken out of the carousel when you save changes."), confirmLabel: tx("Remove") })) onChange((l) => l.filter((_, j) => j !== i));
                }}><i className="bi bi-trash3" /></button>
              </div>
            </div>
          </div>
        ))}

        {slides.length < 10 && (
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            disabled={progress !== null}
            style={{ border: "2px dashed #d1d5db", borderRadius: 10, background: "#fff", color: "#6b7280", minHeight: 180, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <i className="bi bi-plus-circle" style={{ fontSize: 26 }} />
            {progress !== null ? tx("Uploading… {{n}}%", { n: progress }) : tx("Add a photo")}
          </button>
        )}
        <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickPhoto} />
      </div>
    </div>
  );
}

export default function SiteContentsPage() {
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    fetchSiteContent()
      .then((result) => {
        if (!result?.media) throw new Error();
        setSaved(result.media);
        setDraft(result.media);
      })
      .catch(() => setLoadError(true));
  }, []);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  if (loadError) return <div style={{ ...card, maxWidth: 1000, margin: "0 auto" }}>{tx("Couldn't load the page contents. Make sure the backend is up to date, then refresh the page.")}</div>;
  if (!draft) return <div style={{ ...card, maxWidth: 1000, margin: "0 auto" }}>{tx("Loading page contents...")}</div>;

  const handleSave = async () => {
    for (const [key, name] of [["systemDemo", "Video for Residents"], ["adminDemo", "Admin demo"]]) {
      if (draft[key].video.source === "youtube" && !draft[key].video.url) {
        showPopup({ type: "warning", title: tx("Check the YouTube Link"), message: `The ${name} video needs a valid YouTube link, or choose "No video".` });
        return;
      }
    }
    setSaving(true);
    try {
      const result = await updateSiteMedia(draft);
      if (!result?.success) {
        showPopup({ type: "error", title: tx("Couldn't Save"), message: result?.message || "Please check the details and try again." });
        return;
      }
      setSaved(result.media);
      setDraft(result.media);
      setSiteMedia(result.media);
      showPopup({ type: "success", title: tx("Page Contents Saved"), message: tx("The landing page, resident page, News and admin sign-in now use these photos and videos.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 80 }}>
      <CarouselEditor
        icon="bi-images"
        title={tx("Landing Page Carousel")}
        hint={tx("The background photos that slide behind the landing page's heading, in this order. Wide photos (landscape) look best. JPG, PNG or WebP up to 5 MB.")}
        slides={draft.carousel}
        onChange={(fn) => setDraft((d) => ({ ...d, carousel: fn(d.carousel) }))}
      />

      <CarouselEditor
        icon="bi-house-heart"
        title={tx("Resident Page Carousel")}
        hint={tx("The background photos that slide behind “Stay safe, stay informed” on the resident page after signing in, in this order.")}
        slides={draft.residentCarousel}
        onChange={(fn) => setDraft((d) => ({ ...d, residentCarousel: fn(d.residentCarousel) }))}
      />

      {/* ── System demo video ── */}
      <div style={card}>
        <h3 style={{ margin: "0 0 4px", fontSize: 17 }}>
          <i className="bi bi-play-circle-fill" style={{ color: "#6B2C3E", marginRight: 8 }} />
          {tx("Video for Residents")}
        </h3>
        <p style={hint}>{tx("Include a video that residents and visitors will see on the landing page (below the carousel, above \"What you can do\") and in the resident News tab (below the weather), such as a guide to using Safe Connect, an advisory or a barangay update. Choose where it shows below. Until a video is added, the landing page shows a \"coming soon\" placeholder.")}</p>
        <VideoEditor demo={draft.systemDemo} onChange={(systemDemo) => setDraft((d) => ({ ...d, systemDemo }))}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
            <Toggle checked={draft.systemDemo.showOnLanding} onChange={(v) => setDraft((d) => ({ ...d, systemDemo: { ...d.systemDemo, showOnLanding: v } }))}>
              {tx("Show on the landing page")}
            </Toggle>
            <Toggle checked={draft.systemDemo.showInNews} onChange={(v) => setDraft((d) => ({ ...d, systemDemo: { ...d.systemDemo, showInNews: v } }))}>
              {tx("Show in the resident News tab")} {hasVideo(draft.systemDemo) ? "" : tx("(once a video is added)")}
            </Toggle>
          </div>
        </VideoEditor>
      </div>

      {/* ── Admin demo video ── */}
      <div style={card}>
        <h3 style={{ margin: "0 0 4px", fontSize: 17 }}>
          <i className="bi bi-person-video3" style={{ color: "#6B2C3E", marginRight: 8 }} />
          {tx("Admin Demo Video")}
        </h3>
        <p style={hint}>{tx("For Admins and Officials: pops up right after they sign in to the admin panel (each person can choose not to see it again). It can always be watched here.")}</p>
        <VideoEditor demo={draft.adminDemo} onChange={(adminDemo) => setDraft((d) => ({ ...d, adminDemo }))}>
          <div style={{ paddingTop: 4 }}>
            <Toggle checked={draft.adminDemo.showOnSignIn} onChange={(v) => setDraft((d) => ({ ...d, adminDemo: { ...d.adminDemo, showOnSignIn: v } }))}>
              {tx("Show after signing in to the admin panel")}
            </Toggle>
          </div>
        </VideoEditor>
      </div>

      {/* ── Save bar ── */}
      <div style={{ position: "sticky", bottom: 0, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(255,255,255,0.95)", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
        <span style={{ marginRight: "auto", fontSize: 13, color: dirty ? "#92400e" : "#6b7280" }}>
          {dirty ? tx("You have unsaved changes. Uploaded files appear on the site only after you save.") : tx("All changes saved.")}
        </span>
        <button type="button" className="button button-secondary" disabled={!dirty || saving} onClick={() => setDraft(saved)}>
          {tx("Discard changes")}
        </button>
        <button type="button" className="button button-soft" onClick={() => setPreviewing(true)}>
          <i className="bi bi-eye" style={{ marginRight: 6 }} />
          {tx("Preview")}
        </button>
        <button type="button" className="button button-primary" disabled={!dirty || saving} onClick={handleSave}>
          <i className={`bi ${saving ? "bi-hourglass-split" : "bi-check-lg"}`} style={{ marginRight: 6 }} />
          {saving ? tx("Saving…") : tx("Save changes")}
        </button>
      </div>

      {previewing && <MediaPreview draft={draft} onClose={() => setPreviewing(false)} />}
    </div>
  );
}

function MediaPreview({ draft, onClose }) {
  const strip = (title, slides) => (
    <div>
      <div style={{ ...label, marginBottom: 8 }}>{tx(title)}</div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {slides.map((s, i) => (
          <img key={`${s.src}-${i}`} src={mediaSrc(s.src)} alt={s.alt} style={{ width: 200, aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
        ))}
      </div>
    </div>
  );
  const where = (demo, places) => places.filter(([on]) => on).map(([, name]) => tx(name)).join(" and ") || tx("Hidden");
  const video = (title, demo, places) => (
    <div>
      <div style={{ ...label, marginBottom: 8 }}>{tx(title)} <span style={{ fontWeight: 400 }}>({where(demo, places)})</span></div>
      <div style={{ maxWidth: 560 }}>
        <DemoVideoPlayer demo={demo} placeholder={<div style={{ padding: 20, background: "#f3f4f6", borderRadius: 8, color: "#6b7280", fontSize: 13 }}>{tx("No video.")}</div>} />
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label={tx("Preview")} style={{ background: "#fff", borderRadius: 14, width: "min(900px, 100%)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17 }}>{tx("Preview")}</h3>
            <p style={{ margin: 0, fontSize: 12.5, color: "#6b7280" }}>{tx("Not saved yet. This is how the site will look after you save.")}</p>
          </div>
          <button type="button" className="button button-secondary" onClick={onClose}>{tx("Close")}</button>
        </div>
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 20 }}>
          {strip("Landing page carousel", draft.carousel)}
          {strip("Resident page carousel", draft.residentCarousel)}
          {video("Video for Residents", draft.systemDemo, [[draft.systemDemo.showOnLanding, "Landing page"], [draft.systemDemo.showInNews, "News tab"]])}
          {video("Admin demo video", draft.adminDemo, [[draft.adminDemo.showOnSignIn, "After signing in"]])}
        </div>
      </div>
    </div>
  );
}
