(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Track settings
  const lanes = 3;
  const laneHeight = H / (lanes + 2);
  const trackTop = laneHeight;

  // Player and AI runners
  const runner = { lane: 2, x: 80, speed: 2.4, stamina: 100, color: '#22d3ee', width: 18, height: 28 };
  const rivals = [
    { lane: 1, x: 60, speed: 2.3, color: '#f59e0b', width: 18, height: 28 },
    { lane: 3, x: 60, speed: 2.2, color: '#ef4444', width: 18, height: 28 }
  ];

  let timeMs = 0;
  let bestMs = Number(localStorage.getItem('sprint-league_best_ms') || 0);
  let finished = false;
  let position = 1;

  const keys = {};
  function init(){
    timeMs = 0; finished = false; position = 1;
    runner.x = 80; runner.speed = 2.4; runner.stamina = 100; runner.lane = 2;
    rivals[0].x = 60; rivals[1].x = 60;
    document.getElementById('score').textContent = 'Time: 0:00';
    document.getElementById('best').textContent = 'Best: ' + formatTime(bestMs);
    document.getElementById('position').textContent = 'Position: 1st';
    track('game_start');
    loop();
  }

  function loop(){ if (finished) return; update(); draw(); requestAnimationFrame(loop); }

  function update(){
    timeMs += 16;

    // Input: up/down change lanes, left/right control pace, or joystick analog with WASD/Arrows
    const up = keys['KeyW'] || keys['ArrowUp'];
    const down = keys['KeyS'] || keys['ArrowDown'];
    const left = keys['KeyA'] || keys['ArrowLeft'];
    const right = keys['KeyD'] || keys['ArrowRight'];

    if (up && runner.lane > 1) runner.lane = 1;
    if (down && runner.lane < 3) runner.lane = 3;

    // Pace and stamina management
    const targetSpeed = right ? 3.2 : left ? 2.0 : 2.6;
    const accel = 0.06;
    runner.speed += (targetSpeed - runner.speed) * accel;

    // Stamina drain when sprinting
    if (runner.speed > 2.7) runner.stamina = Math.max(0, runner.stamina - 0.15);
    else if (runner.stamina < 100) runner.stamina = Math.min(100, runner.stamina + 0.08);

    // Stamina affects max speed
    const staminaFactor = 0.6 + 0.4 * (runner.stamina / 100);
    const effectiveSpeed = runner.speed * staminaFactor;

    runner.x += effectiveSpeed;

    // AI logic: rubber-banding to keep races tight
    rivals.forEach((r,i)=>{
      const base = r.speed + 0.3 * Math.sin(timeMs/1000 + i);
      const catchup = Math.max(0, (runner.x - r.x) * 0.01);
      r.x += base + catchup;
    });

    // Determine position
    const ahead = rivals.filter(r => r.x > runner.x).length;
    position = 1 + ahead;
    document.getElementById('position').textContent = 'Position: ' + ordinal(position);

    document.getElementById('score').textContent = 'Time: ' + formatTime(timeMs);

    // Finish line
    const finishX = W - 80;
    if (runner.x >= finishX || rivals.some(r => r.x >= finishX)){
      finished = true;
      const all = [{name:'You', x: runner.x, pos: 0}].concat(rivals.map((r,i)=>({name:'Rival '+(i+1), x: r.x})));
      all.sort((a,b)=>b.x - a.x);
      const youIndex = all.findIndex(e => e.name==='You');
      position = youIndex + 1;
      const prevBest = bestMs || Infinity;
      if (position === 1) {
        bestMs = Math.min(prevBest, timeMs);
        localStorage.setItem('sprint-league_best_ms', String(bestMs));
      }
      showResult();
      track('game_end', Math.round(timeMs));
    }
  }

  function showResult(){
    document.getElementById('finalTime').textContent = formatTime(timeMs);
    document.getElementById('finalPosition').textContent = ordinal(position);
    document.getElementById('gameOverScreen').style.display = 'block';
  }

  function draw(){
    // background
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,W,H);

    // Track lanes
    for (let i=0;i<lanes;i++){
      const y = trackTop + i*laneHeight;
      ctx.fillStyle = i%2===0 ? '#1f2937' : '#111827';
      ctx.fillRect(0, y, W, laneHeight-6);

      // lane separators
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.setLineDash([6,8]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Finish line
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(W-80, trackTop, 6, laneHeight*lanes - 6);

    // Draw rivals and runner
    function drawRunner(r, laneIndex){
      const y = trackTop + (laneIndex-1)*laneHeight + laneHeight/2;
      ctx.fillStyle = r.color;
      ctx.fillRect(r.x - r.width/2, y - r.height/2, r.width, r.height);
      // head
      ctx.beginPath();
      ctx.arc(r.x, y - r.height/2 - 6, 6, 0, Math.PI*2);
      ctx.fillStyle = '#93c5fd'; ctx.fill();
    }

    drawRunner(rivals[0], 1);
    drawRunner(rivals[1], 3);
    drawRunner(runner, runner.lane);

    // Stamina bar
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(20, H-28, 200, 12);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(20, H-28, 200 * (runner.stamina/100), 12);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.strokeRect(20.5, H-28.5, 199, 11);
  }

  function restartGame(){
    document.getElementById('gameOverScreen').style.display = 'none';
    init();
  }

  function ordinal(n){
    const s=['th','st','nd','rd'];
    const v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]);
  }
  function formatTime(ms){
    if (!ms || !isFinite(ms)) return '0:00';
    const total = Math.max(0, Math.round(ms/1000));
    const m = Math.floor(total/60), s = total%60;
    return m + ':' + (s<10?'0':'') + s;
  }

  window.addEventListener('keydown', (e)=>{ keys[e.code] = true; });
  window.addEventListener('keyup', (e)=>{ keys[e.code] = false; });
  document.getElementById('restartBtn').addEventListener('click', restartGame);

  function track(action, score){ if (typeof window.trackGameEvent === 'function') window.trackGameEvent(action, score); }

  init();
})();