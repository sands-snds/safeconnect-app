import React, { useEffect, useState } from 'react';





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
