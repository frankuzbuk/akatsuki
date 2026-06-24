import React from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const PageWrapper = ({ pageName, children, overlayOpacity = 0.85 }) => {
  const { getBgImage } = useSiteSettings();
  const bgImage = getBgImage(pageName);

  if (!bgImage) {
    return <>{children}</>;
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div
        className="absolute inset-0 bg-gray-900"
        style={{ opacity: overlayOpacity }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default PageWrapper;
