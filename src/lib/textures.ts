import * as THREE from 'three';

// Helper to parse hex color to RGB
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
}

// Generate wood grain on a canvas
export function createWoodCanvas(color: string, size = 512): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background base color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  // Generate wood grain waves
  const rgb = hexToRgb(color);
  
  // We'll draw several layers of grain
  // Darker grains
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = `rgba(${Math.max(0, rgb.r - 30)}, ${Math.max(0, rgb.g - 30)}, ${Math.max(0, rgb.b - 30)}, 0.15)`;
    ctx.lineWidth = 1 + Math.random() * 3;
    ctx.beginPath();
    
    let y = Math.random() * size;
    ctx.moveTo(0, y);
    
    // Draw wavy line across the canvas
    const steps = 10;
    const stepSize = size / steps;
    const waveFreq = 0.5 + Math.random() * 1.5;
    const waveAmp = 10 + Math.random() * 20;
    
    for (let j = 1; j <= steps; j++) {
      const nextX = j * stepSize;
      const nextY = y + Math.sin(j * waveFreq) * waveAmp + (Math.random() * 4 - 2);
      ctx.lineTo(nextX, nextY);
    }
    ctx.stroke();
  }

  // Lighter grains
  for (let i = 0; i < 20; i++) {
    ctx.strokeStyle = `rgba(${Math.min(255, rgb.r + 20)}, ${Math.min(255, rgb.g + 20)}, ${Math.min(255, rgb.b + 20)}, 0.08)`;
    ctx.lineWidth = 2 + Math.random() * 4;
    ctx.beginPath();
    
    let y = Math.random() * size;
    ctx.moveTo(0, y);
    
    const steps = 8;
    const stepSize = size / steps;
    for (let j = 1; j <= steps; j++) {
      const nextX = j * stepSize;
      const nextY = y + Math.cos(j * 0.8) * 15;
      ctx.lineTo(nextX, nextY);
    }
    ctx.stroke();
  }

  // Draw some fine wood lines/pores
  ctx.strokeStyle = `rgba(0, 0, 0, 0.08)`;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 80; i++) {
    const y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (Math.random() * 10 - 5));
    ctx.stroke();
  }

  return canvas;
}

// Generate marble veins
export function createMarbleCanvas(color: string, size = 512): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Base
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  // Draw marble veins
  const nVeins = 12;
  for (let v = 0; v < nVeins; v++) {
    ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(120, 120, 120, 0.15)' : 'rgba(80, 80, 80, 0.08)';
    ctx.lineWidth = 1 + Math.random() * 2.5;
    ctx.beginPath();
    
    let x = Math.random() * size;
    let y = 0;
    ctx.moveTo(x, y);

    while (y < size) {
      y += 5 + Math.random() * 15;
      x += (Math.random() * 20 - 10) + (Math.random() > 0.7 ? 15 : -15);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Soft blur overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, 50 + Math.random() * 100, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

// Generate granite speckles
export function createGraniteCanvas(color: string, size = 512): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  const rgb = hexToRgb(color);
  
  // Draw thousands of small speckles
  const nSpeckles = size * size * 0.08;
  for (let i = 0; i < nSpeckles; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 0.5 + Math.random() * 1.5;
    
    // Mix white, black, grey, and darker/lighter versions of the base color
    const rand = Math.random();
    if (rand < 0.25) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    } else if (rand < 0.5) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    } else if (rand < 0.75) {
      ctx.fillStyle = 'rgba(150, 150, 150, 0.25)';
    } else {
      ctx.fillStyle = `rgba(${Math.min(255, rgb.r + 30)}, ${Math.min(255, rgb.g + 30)}, ${Math.min(255, rgb.b + 30)}, 0.3)`;
    }
    
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

// Generate standard melamine texture (fine satin noise)
export function createMelamineCanvas(color: string, size = 256): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);

  // Very fine grain/noise for realism
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 5; // tiny noise
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
    data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  return canvas;
}

// Main helper to get Three.js texture
export function getTexture(color: string, name: string): THREE.Texture {
  if (typeof window === 'undefined') return new THREE.Texture();
  
  let canvas: HTMLCanvasElement;
  const lowerName = name.toLowerCase();

  if (lowerName.includes('roble') || lowerName.includes('nogal') || lowerName.includes('camelia') || lowerName.includes('madera')) {
    canvas = createWoodCanvas(color);
  } else if (lowerName.includes('mármol') || lowerName.includes('marmol')) {
    canvas = createMarbleCanvas(color);
  } else if (lowerName.includes('granito') || lowerName.includes('cuarzo')) {
    canvas = createGraniteCanvas(color);
  } else {
    canvas = createMelamineCanvas(color);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  // Set repeating based on type
  if (lowerName.includes('roble') || lowerName.includes('nogal') || lowerName.includes('camelia') || lowerName.includes('madera')) {
    texture.repeat.set(1.5, 1.5);
  } else {
    texture.repeat.set(1, 1);
  }
  
  return texture;
}
