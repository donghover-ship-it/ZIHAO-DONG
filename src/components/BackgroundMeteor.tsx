import React, { useEffect, useState } from 'react';

export const BackgroundMeteor = () => {
  const [meteors, setMeteors] = useState<Array<{ id: number; left: string; top: string; delay: string; duration: string }>>([]);

  useEffect(() => {
    const generateMeteors = () => {
      const newMeteors = Array.from({ length: 3 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 30 - 20}vw`,
        top: `${Math.random() * 40 + 20}vh`,
        delay: `${Math.random() * 15}s`,
        duration: `${Math.random() * 15 + 25}s`
      }));
      setMeteors(newMeteors);
    };

    generateMeteors();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {meteors.map((meteor) => (
        <span
          key={meteor.id}
          className="absolute w-[2px] h-[15vw] bg-gradient-to-b from-slate-300/60 to-transparent opacity-0 animate-meteor"
          style={{
            left: meteor.left,
            top: meteor.top,
            animationDelay: meteor.delay,
            animationDuration: meteor.duration
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-white shadow-[0_0_8px_2px_rgba(203,213,225,0.8)]" />
        </span>
      ))}
    </div>
  );
};
