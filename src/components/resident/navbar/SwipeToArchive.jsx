import React, { useRef, useState } from "react";

// Phones: swipe a notification left or right to archive it. Only touch
// drags count (a mouse click still just opens it), and a mostly vertical
// drag is left to the page so the list scrolls as usual.
const START_PX = 10;      // movement before we decide it's a sideways swipe
const ARCHIVE_SHARE = 0.35; // of the row's width, or...
const ARCHIVE_MIN_PX = 90;  // ...at least this far

export default function SwipeToArchive({ onArchive, label, disabled = false, className = "", children }) {
    const rowRef = useRef(null);
    const drag = useRef(null);
    const swiped = useRef(false);
    const [dx, setDx] = useState(0);
    const [leaving, setLeaving] = useState(0); // -1 / 1 while sliding out
    const [animating, setAnimating] = useState(false);

    if (disabled || !onArchive) return children;

    const onPointerDown = (e) => {
        if (e.pointerType === "mouse" || leaving) return;
        drag.current = { x: e.clientX, y: e.clientY, axis: null, id: e.pointerId };
        swiped.current = false;
        setAnimating(false);
    };

    const onPointerMove = (e) => {
        const d = drag.current;
        if (!d || e.pointerId !== d.id) return;
        const moveX = e.clientX - d.x;
        const moveY = e.clientY - d.y;
        if (!d.axis) {
            if (Math.abs(moveX) < START_PX && Math.abs(moveY) < START_PX) return;
            d.axis = Math.abs(moveX) > Math.abs(moveY) ? "x" : "y";
            if (d.axis === "x") rowRef.current?.setPointerCapture?.(e.pointerId);
        }
        if (d.axis !== "x") return;
        swiped.current = true;
        setDx(moveX);
    };

    const finish = () => {
        const d = drag.current;
        drag.current = null;
        if (!d || d.axis !== "x") return;
        const width = rowRef.current?.offsetWidth || 300;
        setAnimating(true);
        if (Math.abs(dx) >= Math.max(ARCHIVE_MIN_PX, width * ARCHIVE_SHARE)) {
            const dir = dx > 0 ? 1 : -1;
            setLeaving(dir);
            setDx(dir * width);
            setTimeout(() => onArchive(), 200);
        } else {
            setDx(0);
        }
    };

    // A swipe isn't a tap: don't open the notification after one.
    const onClickCapture = (e) => {
        if (swiped.current) {
            e.preventDefault();
            e.stopPropagation();
            swiped.current = false;
        }
    };

    const side = dx > 0 ? "left" : "right";

    return (
        <div className={`swipe-archive ${leaving ? "leaving" : ""} ${className}`}>
            {dx !== 0 && (
                <div className={`swipe-archive-bg ${side}`} aria-hidden="true">
                    <i className="bi bi-archive-fill" />
                    <span>{label}</span>
                </div>
            )}
            <div
                ref={rowRef}
                className="swipe-archive-content"
                style={{
                    transform: dx ? `translateX(${dx}px)` : undefined,
                    transition: animating ? "transform 0.2s ease" : "none"
                }}
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
