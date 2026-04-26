export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

export function spawnParticles(cx: number, cy: number): Particle[] {
  const colors = ['#e33b36', '#ff6b5a', '#ff9a8b', '#ffc4b8', '#ffffff'];
  const particles: Particle[] = [];

  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.5;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
  return particles;
}

export function updateAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
): Particle[] {
  return particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.02;
    p.life -= 0.015;

    if (p.life <= 0) return false;

    ctx.beginPath();
    ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
    ctx.globalAlpha = p.life * 0.45;
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.globalAlpha = 1;

    return true;
  });
}
