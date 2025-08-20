(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  let cookies = 0;
  let best = Number(localStorage.getItem('cookie-clicker_alltime') || 0);
  let cps = 0; // cookies per second
  let clickValue = 1;
  let lastTime = performance.now();

  const bigCookie = { x: W/2, y: H/2, r: 120, pulse: 0 };

  const upgrades = [
    { id:'cursor', name:'Cursor', base: 15, owned: 0, cps: 0.1 },
    { id:'grandma', name:'Grandma', base: 100, owned: 0, cps: 1 },
    { id:'farm', name:'Farm', base: 1100, owned: 0, cps: 8 },
    { id:'factory', name:'Factory', base: 13000, owned: 0, cps: 47 }
  ];

  function priceOf(u){ return Math.floor(u.base * Math.pow(1.15, u.owned)); }

  function updateCPS(){ cps = upgrades.reduce((acc,u)=> acc + u.owned * u.cps, 0); document.getElementById('cps').textContent = 'Per second: ' + cps.toFixed(1); }
  function updateHUD(){ document.getElementById('score').textContent = 'Cookies: ' + Math.floor(cookies); document.getElementById('best').textContent = 'All time: ' + Math.floor(best); }

  function init(){
    cookies = 0; cps = 0; clickValue = 1; upgrades.forEach(u=>u.owned=0);
    updateCPS(); updateHUD();
    buildUpgrades();
    track('game_start');
    loop();
  }

  function loop(){
    const now = performance.now();
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;
    cookies += cps * dt;
    best = Math.max(best, cookies);
    draw();
    requestAnimationFrame(loop);
  }

  function draw(){
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0,0,W,H);

    // Big cookie
    const r = bigCookie.r * (1 + bigCookie.pulse*0.02);
    ctx.beginPath();
    ctx.arc(bigCookie.x, bigCookie.y, r, 0, Math.PI*2);
    ctx.fillStyle = '#b5651d';
    ctx.fill();

    // chocolate chips
    ctx.fillStyle = '#3d2b1f';
    for(let i=0;i<20;i++){
      const ang = (i/20)*Math.PI*2;
      const rr = r*0.7;
      const cx = bigCookie.x + Math.cos(ang)*rr;
      const cy = bigCookie.y + Math.sin(ang)*rr;
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI*2); ctx.fill();
    }

    // Text overlays
    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px system-ui,-apple-system,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Math.floor(cookies) + ' cookies', W/2, 40);
    ctx.font = '16px system-ui,-apple-system,sans-serif';
    ctx.fillText(cps.toFixed(1) + ' per second', W/2, 66);

    updateHUD();
  }

  function clickCookie(){
    cookies += clickValue;
    bigCookie.pulse = 1; setTimeout(()=> bigCookie.pulse = 0, 100);
    track('click', Math.floor(cookies));
  }

  function onPointerDown(e){
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const d = Math.hypot(x - bigCookie.x, y - bigCookie.y);
    if (d <= bigCookie.r * 1.1) clickCookie();
  }

  function buildUpgrades(){
    const list = document.getElementById('upgradesList');
    list.innerHTML = '';
    upgrades.forEach(u => {
      const btn = document.createElement('button');
      btn.className = 'game-button';
      const price = priceOf(u);
      btn.textContent = `${u.name} (+${u.cps}/s) — ${price} cookies [${u.owned}]`;
      btn.onclick = () => {
        if (cookies >= price){
          cookies -= price; u.owned += 1; updateCPS(); buildUpgrades(); track('buy_'+u.id, u.owned);
        }
      };
      list.appendChild(btn);
    });
  }

  window.addEventListener('pointerdown', onPointerDown);

  window.addEventListener('beforeunload', ()=>{
    localStorage.setItem('cookie-clicker_alltime', String(Math.max(best, cookies)));
  });

  function track(action, score){ if (typeof window.trackGameEvent==='function') window.trackGameEvent(action, score); }

  document.getElementById('resetBtn').addEventListener('click', ()=>{
    cookies = 0; upgrades.forEach(u=>u.owned=0); updateCPS(); buildUpgrades(); track('reset');
  });

  init();
})();