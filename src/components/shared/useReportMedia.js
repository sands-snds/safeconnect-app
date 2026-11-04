import { useEffect, useState } from 'react';
import { fetchReportMedia } from '../../Services/api';

// Loads one report's photo or video when its details are opened. Report lists
// only say whether there is one (hasMedia), so they stay small.
// type: emergency, assistance or pettyCrime. Returns { media, loading, failed }.
export default function useReportMedia(type, id, hasMedia) {
  const [state, setState] = useState({ media: null, loading: false, failed: false });

  useEffect(() => {
    if (!hasMedia || !type || id == null) {
      setState({ media: null, loading: false, failed: false });
      return undefined;
    }
    let cancelled = false;
    setState({ media: null, loading: true, failed: false });
    fetchReportMedia(type, id)
      .then((media) => {
        if (!cancelled) setState({ media: media.photoUrl ? media : null, loading: false, failed: false });
      })
      .catch(() => {
        if (!cancelled) setState({ media: null, loading: false, failed: true });
      });
    return () => { cancelled = true; };
  }, [type, id, hasMedia]);

  return state;
}
