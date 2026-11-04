import { useState, memo } from 'react';

const Particles = memo(({ containerClassName, particleClassName }) => {
  const [particles] = useState(() => {
    return [...Array(30)].map((_, i) => ({
      key: i,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${15 + Math.random() * 15}s`,
        opacity: Math.random() * 0.5 + 0.2
      }
    }));
  });

  return (
    <div className={containerClassName}>
      {particles.map((particle) => (
        <div
          key={particle.key}
          className={particleClassName}
          style={particle.style}
        />
      ))}
    </div>
  );
});

Particles.displayName = 'Particles';

export default Particles;
