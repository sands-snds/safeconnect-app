import React, { useEffect, useRef } from "react";

const START_PX = 10;
const ARCHIVE_SHARE = 0.35; // of the row's width, or...
const ARCHIVE_MIN_PX = 90;  // ...at least this far
const SLIDE_MS = 200;
const COLLAPSE_MS = 200;

// The whole notification (everything passed as children) follows the finger.
// The drag moves it directly (no re-render per move); a swipe that goes far
// enough slides it out, closes the gap it leaves, then archives it. If
// onArchive answers false the notification comes back.
export default function SwipeToArchive({ onArchive, label, disabled = false, className = "", children }) {
    const wrapRef = useRef(null);
    const rowRef = useRef(null);
    const bgRef = useRef(null);
    const drag = useRef(null);
    const dx = useRef(0);
    const frame = useRef(0);
    const timers = useRef([]);
    const leaving = useRef(false);
    const swiped = useRef(false);

    useEffect(() => () => {
        cancelAnimationFrame(frame.current);
        timers.current.forEach(clearTimeout);
    }, []);

    if (disabled || !onArchive) return children;

    const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

    const showBg = (offset) => {
        const bg = bgRef.current;
        if (!bg) return;
        if (offset) bg.dataset.side = offset > 0 ? "left" : "right";
        bg.style.visibility = offset ? "visible" : "hidden";
    };

    const moveTo = (offset, ms = 0) => {
        const row = rowRef.current;
        if (!row) return;
        const duration = reducedMotion() ? 0 : ms;
        row.style.transition = duration ? `transform ${duration}ms ease` : "none";
        row.style.transform = offset ? `translate3d(${offset}px, 0, 0)` : "";
        if (offset) showBg(offset);
        else if (duration) later(() => { if (!dx.current) showBg(0); }, duration);
        else showBg(0);
    };

    const restore = () => {
        const wrap = wrapRef.current;
        if (!wrap || !wrap.isConnected) return;
        wrap.style.transition = "none";
        wrap.style.height = "";
        wrap.style.opacity = "";
        wrap.classList.remove("leaving");
        leaving.current = false;
        dx.current = 0;
        moveTo(0);
    };

    const slideOut = (dir) => {
        const wrap = wrapRef.current;
        const row = rowRef.current;
        if (!wrap || !row) return;
        leaving.current = true;
        wrap.classList.add("leaving");
        const motion = !reducedMotion();
        dx.current = dir * row.offsetWidth;
        moveTo(dx.current, SLIDE_MS);
        later(() => {
            // Close the gap: from its height to 0, so the list below moves up smoothly.
            wrap.style.height = `${wrap.offsetHeight}px`;
            void wrap.offsetHeight;
            wrap.style.transition = motion ? `height ${COLLAPSE_MS}ms ease, opacity ${COLLAPSE_MS}ms ease` : "none";
            wrap.style.height = "0px";
            wrap.style.opacity = "0";
            later(() => {
                Promise.resolve(onArchive()).then((ok) => { if (ok === false) restore(); }, restore);
            }, motion ? COLLAPSE_MS : 0);
        }, motion ? SLIDE_MS : 0);
    };

    const onPointerDown = (e) => {
        if (e.pointerType === "mouse" || leaving.current) return;
        drag.current = { x: e.clientX, y: e.clientY, axis: null, id: e.pointerId };
        swiped.current = false;
    };

    const onPointerMove = (e) => {
        const d = drag.current;
        if (!d || e.pointerId !== d.id) return;
        const moveX = e.clientX - d.x;
        const moveY = e.clientY - d.y;
        if (!d.axis) {
            if (Math.abs(moveX) < START_PX && Math.abs(moveY) < START_PX) return;
            d.axis = Math.abs(moveX) > Math.abs(moveY) ? "x" : "y";
            if (d.axis === "x") {
                rowRef.current?.setPointerCapture?.(e.pointerId);
                if (rowRef.current) rowRef.current.style.willChange = "transform";
            }
        }
        if (d.axis !== "x") return;
        swiped.current = true;
        dx.current = moveX;
        if (!frame.current) {
            frame.current = requestAnimationFrame(() => {
                frame.current = 0;
                if (drag.current) moveTo(dx.current);
            });
        }
    };

    const finish = () => {
        const d = drag.current;
        drag.current = null;
        cancelAnimationFrame(frame.current);
        frame.current = 0;
        if (rowRef.current) rowRef.current.style.willChange = "";
        if (!d || d.axis !== "x") return;
        const width = rowRef.current?.offsetWidth || 300;
        if (Math.abs(dx.current) >= Math.max(ARCHIVE_MIN_PX, width * ARCHIVE_SHARE)) {
            slideOut(dx.current > 0 ? 1 : -1);
        } else {
            dx.current = 0;
            moveTo(0, SLIDE_MS);
        }
    };

    // A swipe isn't a tap: don't open the notification at the end of it.
    const onClickCapture = (e) => {
        if (swiped.current) {
            e.preventDefault();
            e.stopPropagation();
            swiped.current = false;
        }
    };

    return (
        <div ref={wrapRef} className={`swipe-archive ${className}`}>
            <div ref={bgRef} className="swipe-archive-bg" data-side="right" style={{ visibility: "hidden" }} aria-hidden="true">
                <i className="bi bi-archive-fill" />
                <span>{label}</span>
            </div>
            <div
                ref={rowRef}
                className="swipe-archive-content"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={finish}
                onPointerCancel={finish}
                onClickCapture={onClickCapture}
            >
                {children}
            </div>
        </div>
    );
}
