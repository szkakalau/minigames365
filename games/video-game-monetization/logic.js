/*
 Video game monetization - Idle/Strategy Mini Game
 Mobile-first responsive canvas
*/
(function() {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Responsive sizing
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const maxWidth = Math.min(window.innerWidth - 24, 520);
    const width = Math.max(320, maxWidth);
    const height = Math.max(480, Math.min(window.innerHeight - 180, Math.round(width * 1.5)));

    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Game state
  let running = true;
  let time = 0;
  let score = 0;
  let best = Number(localStorage.getItem('vgm_best') || 0);
  document.getElementById('best').textContent = best;

  // Player happiness (0-100) and ad pressure (0-100)
  let happiness = 70;
  let adPressure = 20;

  // Entities: Revenue packets (green), Churn risks (red), Boosts (blue)
  const revenue = [];
  const risks = [];
  const boosts = [];

  const player = { x: 0.5, speed: 0.5 }; // normalized x (0..1)

  // Input handling
  let pointerX = null;
  function onPointerDown(e){
    const rect = canvas.getBoundingClientRect();
    pointerX = (e.touches? e.touches[0].clientX : e.clientX) - rect.left;
  }
  function onPointerMove(e){
    if(pointerX===null) return;
    const rect = canvas.getBoundingClientRect();
    pointerX = (e.touches? e.touches[0].clientX : e.clientX) - rect.left;
  }
  function onPointerUp(){ pointerX = null; }
  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('touchstart', onPointerDown, {passive:true});
  canvas.addEventListener('touchmove', onPointerMove, {passive:true});
  canvas.addEventListener('touchend', onPointerUp, {passive:true});

  // Keyboard
  const keys = { left:false, right:false };
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') keys.right = false;
  });

  function spawn() {
    // Revenue spawn rate scales with adPressure but too much raises risks
    if (Math.random() < 0.02 + adPressure*0.0008) {
      revenue.push({ x: Math.random(), y: -0.1, vy: 0.004 + Math.random()*0.004, r: 10 });
    }
    if (Math.random() < 0.01 + adPressure*0.0005 + (100-happiness)*0.0006) {
      risks.push({ x: Math.random(), y: -0.1, vy: 0.005 + Math.random()*0.005, r: 12 });
    }
    if (Math.random() < 0.002 + (100-happiness)*0.0002) {
      boosts.push({ x: Math.random(), y: -0.1, vy: 0.003 + Math.random()*0.004, r: 11 });
    }
  }

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  function update(dt) {
    if (!running) return;
    time += dt;

    // Player control: pointer dominates
    if (pointerX !== null) {
      const w = canvas.getBoundingClientRect().width;
      player.x = clamp(pointerX / w, 0.05, 0.95);
    } else {
      if (keys.left) player.x -= player.speed * dt;
      if (keys.right) player.x += player.speed * dt;
      player.x = clamp(player.x, 0.05, 0.95);
    }

    // Dynamic economy: adPressure slowly rises, happiness decays with pressure
    adPressure = clamp(adPressure + 5*dt/60, 0, 100);
    happiness = clamp(happiness - (adPressure*0.02)*dt, 0, 100);

    spawn();

    // Update entities
    const H = canvas.getBoundingClientRect().height;
    const W = canvas.getBoundingClientRect().width;

    for (const arr of [revenue, risks, boosts]) {
      for (let i = arr.length - 1; i >= 0; i--) {
        const it = arr[i];
        it.y += it.vy * (H);
        if (it.y > H + 20) arr.splice(i,1);
      }
    }

    // Collisions
    const px = player.x * W;
    const py = H - 60;

    function hit(it, rad){
      const dx = (it.x*W - px);
      const dy = (it.y - py);
      return dx*dx + dy*dy < (rad*rad);
    }

    for (let i = revenue.length - 1; i >= 0; i--) {
      if (hit(revenue[i], 26)) {
        score += Math.round(10 + adPressure*0.2);
        happiness = clamp(happiness - 2, 0, 100);
        revenue.splice(i,1);
      }
    }
    for (let i = risks.length - 1; i >= 0; i--) {
      if (hit(risks[i], 28)) {
        happiness = clamp(happiness - (10 + adPressure*0.15), 0, 100);
        risks.splice(i,1);
      }
    }
    for (let i = boosts.length - 1; i >= 0; i--) {
      if (hit(boosts[i], 24)) {
        adPressure = clamp(adPressure - 15, 0, 100);
        happiness = clamp(happiness + 8, 0, 100);
        boosts.splice(i,1);
      }
    }

    // Lose condition
    if (happiness <= 0) {
      running = false;
      document.getElementById('finalScore').textContent = score;
      document.getElementById('gameOver').classList.remove('hidden');
      if (score > best) {
        best = score;
        localStorage.setItem('vgm_best', String(best));
        document.getElementById('best').textContent = best;
      }
    }

    // HUD
    document.getElementById('score').textContent = score;
  }

  function draw() {
    const H = canvas.getBoundingClientRect().height;
    const W = canvas.getBoundingClientRect().width;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0f1226');
    g.addColorStop(1, '#1a1f3d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Bars: Happiness and Ad Pressure
    function bar(x, y, w, h, val, colorBg, colorFg){
      ctx.fillStyle = colorBg; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = colorFg; ctx.fillRect(x, y, w * (val/100), h);
    }
    bar(16, 16, W-32, 10, happiness, '#2a2f55', '#4caf50');
    bar(16, 32, W-32, 10, adPressure, '#2a2f55', '#e53935');

    // Player (product slider)
    ctx.fillStyle = '#ffd54f';
    const px = player.x * W;
    ctx.beginPath();
    ctx.arc(px, H-60, 20, 0, Math.PI*2);
    ctx.fill();

    // Entities
    ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    function drawItem(it, color, label){
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(it.x*W, it.y, 12, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(label, it.x*W, it.y);
    }

    revenue.forEach(it => drawItem(it, '#43a047', '+$'));
    risks.forEach(it => drawItem(it, '#e53935', '⚠'));
    boosts.forEach(it => drawItem(it, '#1e88e5', '💙'));
  }

  // Loop
  let last = performance.now();
  function loop(now){
    const dt = Math.min(1/30, (now - last)/1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Restart
  document.getElementById('restartBtn').addEventListener('click', () => {
    score = 0; happiness = 70; adPressure = 20; running = true; revenue.length = 0; risks.length = 0; boosts.length = 0;
    document.getElementById('gameOver').classList.add('hidden');
  });
})();