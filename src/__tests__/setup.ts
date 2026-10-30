import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Provide a complete 2D context mock in jsdom so Viewport3D canvas rendering executes cleanly in tests
const createGradientMock = () => ({
  addColorStop: vi.fn(),
});

const canvas2DMock = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  roundRect: vi.fn(),
  ellipse: vi.fn(),
  quadraticCurveTo: vi.fn(),
  setLineDash: vi.fn(),
  createLinearGradient: vi.fn(createGradientMock),
  createRadialGradient: vi.fn(createGradientMock),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: vi.fn(() => canvas2DMock),
});
