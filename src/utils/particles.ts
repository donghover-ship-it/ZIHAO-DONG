let lastPanelClickTime = 0;

export const createPanelClickParticles = (e: React.MouseEvent<HTMLElement>) => {
  const now = Date.now();
  if (now - lastPanelClickTime < 300) return;
  lastPanelClickTime = now;

  const button = e.currentTarget;
  const rect = button.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(button);
  const borderRadius = computedStyle.borderRadius;
  
  // 1. Create the Silver Glow Outline
  const glow = document.createElement('div');
  glow.style.position = 'fixed';
  glow.style.top = `${rect.top}px`;
  glow.style.left = `${rect.left}px`;
  glow.style.width = `${rect.width}px`;
  glow.style.height = `${rect.height}px`;
  glow.style.borderRadius = borderRadius || '16px';
  glow.style.pointerEvents = 'none';
  glow.style.zIndex = '9998';
  glow.style.boxShadow = '0 0 20px 2px rgba(226, 232, 240, 0.7), inset 0 0 15px 2px rgba(255, 255, 255, 0.4)';
  glow.style.border = '1px solid rgba(255, 255, 255, 0.9)';
  document.body.appendChild(glow);

  glow.animate([
    { opacity: 0.8, transform: 'scale(1)' },
    { opacity: 0, transform: 'scale(1.03)' }
  ], {
    duration: 1200,
    easing: 'ease-out',
    fill: 'forwards'
  });

  setTimeout(() => glow.remove(), 1200);

  // 2. Create Particles
  const particleCount = 50; // Slightly increased for better evenness
  const perimeter = 2 * (rect.width + rect.height);
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    
    // Very fine diamond powder style
    const size = Math.random() * 1.5 + 0.5; // Finer size (0.5px to 2px)
    particle.style.position = 'fixed';
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // Brilliant silver/white colors
    const colors = ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0'];
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Diamond shapes (rotated squares) and some circles
    particle.style.borderRadius = Math.random() > 0.4 ? '50%' : '1px';
    
    // Subtle glow
    const glowSpread = Math.random() * 0.5;
    const glowBlur = Math.random() * 2 + 1;
    particle.style.boxShadow = `0 0 ${glowBlur}px ${glowSpread}px rgba(255, 255, 255, 0.8), 0 0 ${glowBlur * 2}px ${glowSpread}px rgba(226, 232, 240, 0.6)`;
    
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999';
    particle.style.left = '0px';
    particle.style.top = '0px';
    
    document.body.appendChild(particle);
    
    // Uniform distribution along perimeter
    let startX, startY, tx, ty;
    const d = Math.random() * perimeter;
    const offset = (Math.random() - 0.5) * 8; // +/- 4px thickness around the edge
    const velocity = Math.random() * 10 + 5; // 5 to 15px drift distance outwards
    const spread = (Math.random() - 0.5) * 15; // lateral drift
    
    if (d < rect.width) { // Top edge
      startX = rect.left + d;
      startY = rect.top + offset;
      tx = spread;
      ty = -velocity;
    } else if (d < rect.width + rect.height) { // Right edge
      startX = rect.right + offset;
      startY = rect.top + (d - rect.width);
      tx = velocity;
      ty = spread;
    } else if (d < 2 * rect.width + rect.height) { // Bottom edge
      startX = rect.right - (d - rect.width - rect.height); // right to left
      startY = rect.bottom + offset;
      tx = spread;
      ty = velocity;
    } else { // Left edge
      startX = rect.left + offset;
      startY = rect.bottom - (d - 2 * rect.width - rect.height); // bottom to top
      tx = -velocity;
      ty = spread;
    }
    
    const duration = Math.random() * 800 + 1000; // 1 to 1.8 seconds
    
    // Random rotation for diamond shapes to twinkle
    const rotation = Math.random() * 360;
    const endRotation = rotation + (Math.random() * 90 - 45);
    
    // Main movement and fade out
    particle.animate([
      { 
        transform: `translate(calc(${startX}px - 50%), calc(${startY}px - 50%)) rotate(${rotation}deg) scale(0)`, 
        opacity: 0,
        offset: 0
      },
      { 
        transform: `translate(calc(${startX + tx * 0.2}px - 50%), calc(${startY + ty * 0.2}px - 50%)) rotate(${rotation + 2}deg) scale(1)`, 
        opacity: 0.9,
        offset: 0.1 // Quickly fade in and scale up
      },
      { 
        transform: `translate(calc(${startX + tx}px - 50%), calc(${startY + ty}px - 50%)) rotate(${endRotation}deg) scale(0.5)`, 
        opacity: 0,
        offset: 1
      }
    ], {
      duration,
      easing: 'ease-out',
      fill: 'forwards'
    });
    
    // Twinkling/flashing effect
    const twinkleDuration = duration / (Math.random() * 3 + 3);
    particle.animate([
      { opacity: 0.9, filter: 'brightness(1.3)' },
      { opacity: 0.3, filter: 'brightness(0.8)' },
      { opacity: 0.9, filter: 'brightness(1.3)' }
    ], {
      duration: twinkleDuration,
      iterations: Math.ceil(duration / twinkleDuration)
    });
    
    setTimeout(() => {
      particle.remove();
    }, duration);
  }
};

let lastDiamondParticleTime = 0;

export const createDiamondParticles = (e: React.MouseEvent<HTMLElement>) => {
  const now = Date.now();
  if (now - lastDiamondParticleTime < 500) return; // Throttle to once every 500ms
  lastDiamondParticleTime = now;

  const button = e.currentTarget;
  const rect = button.getBoundingClientRect();
  
  const particleCount = 50; // Reduced from 150 to 50 for performance
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    
    // Very fine diamond powder style
    const size = Math.random() * 1.5 + 0.5; // Finer size (0.5px to 2px)
    particle.style.position = 'fixed';
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // Brilliant silver/white colors for high clarity and brightness
    const colors = ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0'];
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Diamond shapes (rotated squares) and some circles
    particle.style.borderRadius = Math.random() > 0.4 ? '50%' : '1px';
    
    // Enhanced glow for higher brightness and clarity
    const glowSpread = Math.random() * 1;
    const glowBlur = Math.random() * 4 + 1;
    particle.style.boxShadow = `0 0 ${glowBlur}px ${glowSpread}px rgba(255, 255, 255, 0.95), 0 0 ${glowBlur * 2}px ${glowSpread}px rgba(226, 232, 240, 0.8)`;
    
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999';
    particle.style.left = '0px';
    particle.style.top = '0px';
    
    document.body.appendChild(particle);
    
    // Start on the perimeter of the button
    let startX, startY, tx, ty;
    const rand = Math.random();
    let edge;
    // Distribute more evenly, but slightly more on left (30%) and right (30%) than top (20%) and bottom (20%)
    if (rand < 0.2) edge = 0; // top
    else if (rand < 0.5) edge = 1; // right
    else if (rand < 0.7) edge = 2; // bottom
    else edge = 3; // left
    
    const offset = (Math.random() - 0.5) * 16; // +/- 8px spread around the edge for a softer, more even look
    const velocity = Math.random() * 15 + 10; // 10 to 25px drift distance outwards
    const spread = (Math.random() - 0.5) * 30; // slightly wider lateral spread for evenness
    
    if (edge === 0) { // Top edge
      startX = rect.left + Math.random() * rect.width;
      startY = rect.top + offset;
      tx = spread;
      ty = -velocity;
    } else if (edge === 1) { // Right edge
      startX = rect.right + offset;
      startY = rect.top + Math.random() * rect.height;
      tx = velocity;
      ty = spread;
    } else if (edge === 2) { // Bottom edge
      startX = rect.left + Math.random() * rect.width;
      startY = rect.bottom + offset;
      tx = spread;
      ty = velocity;
    } else { // Left edge
      startX = rect.left + offset;
      startY = rect.top + Math.random() * rect.height;
      tx = -velocity;
      ty = spread;
    }
    
    const duration = Math.random() * 1000 + 2000; // 2 to 3 seconds
    
    // Random rotation for diamond shapes to twinkle
    const rotation = Math.random() * 360;
    const endRotation = rotation + (Math.random() * 180 - 90);
    
    // Main movement and fade out
    particle.animate([
      { 
        transform: `translate(calc(${startX}px - 50%), calc(${startY}px - 50%)) rotate(${rotation}deg) scale(0)`, 
        opacity: 0,
        offset: 0
      },
      { 
        transform: `translate(calc(${startX + tx * 0.1}px - 50%), calc(${startY + ty * 0.1}px - 50%)) rotate(${rotation + 5}deg) scale(1)`, 
        opacity: 1,
        offset: 0.1 // Quickly fade in and scale up
      },
      { 
        transform: `translate(calc(${startX + tx}px - 50%), calc(${startY + ty}px - 50%)) rotate(${endRotation}deg) scale(0.5)`, 
        opacity: 0,
        offset: 1
      }
    ], {
      duration,
      easing: 'ease-out', // Gentle deceleration, not a sharp burst
      fill: 'forwards'
    });
    
    // Twinkling/flashing effect
    const twinkleDuration = duration / (Math.random() * 4 + 4);
    particle.animate([
      { opacity: 1, filter: 'brightness(1.5)' },
      { opacity: 0.2, filter: 'brightness(0.8)' },
      { opacity: 1, filter: 'brightness(1.5)' }
    ], {
      duration: twinkleDuration,
      iterations: Math.ceil(duration / twinkleDuration)
    });
    
    setTimeout(() => {
      particle.remove();
    }, duration);
  }
};
