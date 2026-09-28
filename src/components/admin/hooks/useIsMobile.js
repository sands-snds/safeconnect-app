import { useEffect, useState } from "react";

// Same breakpoint as the mobile rules in styles/admin.css.
export const MOBILE_QUERY = "(max-width: 768px)";

const matches = () =>
    typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia(MOBILE_QUERY).matches
        : false;

// True on phone-sized screens; updates when the window is resized/rotated.
export default function useIsMobile() {
    const [isMobile, setIsMobile] = useState(matches);

    useEffect(() => {
        if (!window.matchMedia) return;
        const mql = window.matchMedia(MOBILE_QUERY);
        const onChange = () => setIsMobile(mql.matches);
        onChange();
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return isMobile;
}
