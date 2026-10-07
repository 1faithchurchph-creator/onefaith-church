import React from 'react';

/**
 * Displays a static preview of how the navigation cover image will appear
 * on the public site. It mimics the size (1090 × 900) and
 * object‑positioning logic used in Navbar.jsx.
 */
const NavbarPreview = ({ imageUrl, position }) => {
  if (!imageUrl) return null;

  const parse = (value) => {
    const [x = '50%', y = '50%'] = (value || '50% 50%').split(/\s+/);
    return {
      x: Number.parseFloat(x) || 50,
      y: Number.parseFloat(y) || 50,
    };
  };

  const { x, y } = parse(position || '50% 50%');

  return (
    <div style={{ marginTop: '1rem' }}>
      <h4 style={{ fontWeight: 600, fontSize: '0.9rem' }}>Live preview for public site</h4>
      <div
        style={{
          width: '100%',
          aspectRatio: '1090 / 900',
          border: '1px solid #cbd5e0',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <img
          src={imageUrl}
          alt="Cover preview"
          style={{
            width: '120%',
            height: '120%',
            objectFit: 'cover',
            objectPosition: `${x}% ${y}%`,
            display: 'block',
          }}
        />
      </div>
    </div>
  );
};

export default NavbarPreview;
