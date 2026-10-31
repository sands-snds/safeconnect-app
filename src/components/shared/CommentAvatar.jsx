import React, { useEffect, useState } from 'react';

// A commenter's round avatar: their profile photo when they have one, and
// otherwise (or if the photo fails to load) the fallback passed as children
// -- their initials, or the shield for the barangay. className/style are the
// caller's usual avatar circle; the photo fills it.
export default function CommentAvatar({ photoUrl, className = '', style, children }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photoUrl]);

  const showPhoto = !!photoUrl && !failed;
  return (
    <div
      className={`${className} ${showPhoto ? 'comment-avatar-photo' : ''}`.trim()}
      style={showPhoto ? undefined : style}
    >
      {showPhoto ? (
        <img
          src={photoUrl}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
        />
      ) : children}
    </div>
  );
}
