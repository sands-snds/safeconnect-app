import React, { useEffect, useRef, useState } from "react";
import { MAP_TYPES, fromAdminReport } from "../../shared/location/mapReports";
import { playReportSounds, playReportSound, unlockAudio, useAudioState } from "./reportSounds";
import { tx } from "../../../i18n/adminText";

// A notice (and, when turned on, a sound) for each report that arrives
// while the admin panel is open. Works from the lists useAdminData keeps
// current through the live channel; the first load only records what is
// already there, and each report is announced once.
// Each kind of report has its own sound (reportSounds.js). When the browser
// is still blocking sound, the notice offers to turn it on.

const SHOW_MS = 8000;

export default function NewReportAlerts({ emergencyReports, assistanceRequests, pettyCrimeReports, loaded, soundOn, onOpen }) {
    const known = useRef(null);
    const [alerts, setAlerts] = useState([]);
    const audio = useAudioState();

    useEffect(() => {
        if (!loaded) return;
        const now = [
            ...emergencyReports.map((r) => fromAdminReport("emergency", r)),
            ...assistanceRequests.map((r) => fromAdminReport("assistance", r)),
            ...pettyCrimeReports.map((r) => fromAdminReport("pettyCrime", r))
        ];
        if (!known.current) {
            known.current = new Set(now.map((r) => r.key));
            return;
        }
        const fresh = now.filter((r) => !known.current.has(r.key));
        fresh.forEach((r) => known.current.add(r.key));
        if (!fresh.length) return;
        if (soundOn) playReportSounds(fresh.map((r) => r.kind));
        setAlerts((list) => [...fresh.map((r) => ({ ...r, shownAt: Date.now() })), ...list].slice(0, 4));
    }, [emergencyReports, assistanceRequests, pettyCrimeReports, loaded, soundOn]);

    useEffect(() => {
        if (!alerts.length) return undefined;
        const t = setTimeout(() => setAlerts((list) => list.filter((a) => Date.now() - a.shownAt < SHOW_MS)), 1000);
        return () => clearTimeout(t);
    }, [alerts]);

    if (!alerts.length) return null;
    return (
        <div className="nra-area" aria-live="polite">
            <style>{`
                .nra-area { position: fixed; top: 96px; right: 28px; z-index: 9000; display: flex; flex-direction: column; gap: 8px; width: 340px; max-width: calc(100vw - 20px); }
                .nra { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 10px 30px rgb(0 0 0 / .15); padding: 12px 14px; display: flex; gap: 12px; align-items: flex-start; animation: nra-in .25s ease-out; }
                .nra-ic { width: 36px; height: 36px; border-radius: 50%; background: var(--c); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
                .nra-text { flex: 1; min-width: 0; }
                .nra b { display: block; font-size: 14px; color: #111827; }
                .nra span.nra-sub { display: block; font-size: 12.5px; color: #6b7280; overflow-wrap: anywhere; }
                .nra-see { border: 0; background: none; padding: 0; font-size: 12.5px; font-weight: 600; color: #6B2C3E; cursor: pointer; }
                .nra-x { border: 0; background: none; color: #9ca3af; font-size: 14px; cursor: pointer; padding: 2px; }
                .nra-acts { display: flex; flex-wrap: wrap; gap: 4px 14px; margin-top: 2px; }
                .nra-sound { border: 0; background: none; padding: 0; font-size: 12.5px; font-weight: 600; color: #b45309; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
                @keyframes nra-in { from { transform: translateY(-6px); opacity: 0; } to { transform: none; opacity: 1; } }
                @media (prefers-reduced-motion: reduce) { .nra { animation: none; } }
                @media (max-width: 768px) { .nra-area { top: 72px; right: 10px; left: 10px; width: auto; } }
            `}</style>
            {alerts.map((a) => {
                const t = MAP_TYPES[a.type] || MAP_TYPES.emergency;
                return (
                    <div key={a.key} className="nra" style={{ "--c": t.color }} role="status">
                        <span className="nra-ic"><i className={`bi ${t.icon}`} aria-hidden="true" /></span>
                        <span className="nra-text">
                            <b>{tx("New {{type}}", { type: tx(a.title) })}</b>
                            <span className="nra-sub">{a.location} · {tx("just now")}</span>
                            <span className="nra-acts">
                                <button type="button" className="nra-see" onClick={() => { onOpen(a.key); setAlerts((l) => l.filter((x) => x.key !== a.key)); }}>
                                    {tx("See on map")}
                                </button>
                                {soundOn && audio === "blocked" && (
                                    <button type="button" className="nra-sound" onClick={() => unlockAudio().then((ok) => ok && playReportSound(a.kind))}>
                                        <i className="bi bi-volume-up-fill" aria-hidden="true" /> {tx("Turn on sound")}
                                    </button>
                                )}
                            </span>
                        </span>
                        <button type="button" className="nra-x" aria-label={tx("Close")} onClick={() => setAlerts((l) => l.filter((x) => x.key !== a.key))}>
                            <i className="bi bi-x-lg" aria-hidden="true" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
