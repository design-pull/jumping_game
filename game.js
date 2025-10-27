/* game.js — extracted from the single-file version
   Place this file in same folder as index.html and styles.css
*/
(() => {
  // Elements
  const game = document.getElementById('game');
  const objs = document.getElementById('objs');
  const player = document.getElementById('player');
  const scoreEl = document.getElementById('score');
  const highEl = document.getElementById('high');
  const livesEl = document.getElementById('lives');
  const overlay = document.getElementById('overlay');
  const card = document.getElementById('card');
  const finalText = document.getElementById('finalText');
  const retryBtn = document.getElementById('retryBtn');
  const retry2 = document.getElementById('retry2');
  const muteBtn = document.getElementById('muteBtn');
  const clouds = document.getElementById('clouds');

  // Viewport
  let W = window.innerWidth, H = window.innerHeight;
  window.addEventListener('resize', () => { W = window.innerWidth; H = window.innerHeight; });

  // Audio
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = (AudioCtx ? new AudioCtx() : null);
  let muted = false;
  function tone(freq=440,type='sine',dur=0.12,vol=0.12){
    if(muted || !audioCtx) return;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur); o.stop(audioCtx.currentTime + dur + 0.02);
  }
  function sJump(){ tone(540,'sine',0.22,0.22); } function sLand(){ tone(920,'triangle',0.08,0.12); } function sHit(){ tone(220,'sawtooth',0.16,0.28); } function sWin(){ tone(880,'sawtooth',0.16,0.18); setTimeout(()=>tone(1160,'sine',0.12,0.14),160); }

  muteBtn.addEventListener('click', ()=>{ muted = !muted; muteBtn.textContent = muted ? '🔈' : '🔊'; if(!muted) tone(900,'triangle',0.08,0.12); });
  ['pointerdown','touchstart','keydown','click'].forEach(e=>document.addEventListener(e, ()=>{ if(audioCtx && audioCtx.state==='suspended') audioCtx.resume(); }, {once:true}));

  // Game state
  let running = false;
  let baseSpeed = 360;
  let speed = baseSpeed;
  let accel = 12;
  let lastTime = 0, spawnTimer = 0;
  let spawnInterval = 1.4;
  const MIN_GAP_PX = 420;
  let score = 0, high = parseInt(localStorage.getItem('jumpGameHigh')||'0',10);
  if(highEl) highEl.textContent = 'High: ' + high;

  // Physics
  let vy = 0, playerY = 0;
  let gravity = -2200;
  let jumpSpeed = 1300;
  let groundY = 160, isGrounded = true;

  // Obstacles
  let obstacles = [], survived = 0;
  let lives = 3, invulnerable = false, INVULN_MS = 900;
  if(livesEl) livesEl.textContent = lives;

  function makeBuilding(){
    const w = 18 + Math.floor(Math.random()*54);
    const h = 40 + Math.floor(Math.random()*140);
    const el = document.createElement('div');
    el.className = 'ob building';
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.left = (W + 60) + 'px';
    el.style.opacity = '1';
    const pal = ['#ea6','#7ac','#f8b840','#9ad','#c9a'];
    const bg = pal[Math.floor(Math.random()*pal.length)];
    el.innerHTML = `<div class="bldg" style="background:${bg};height:100%;border-radius:8px;position:relative;"><div class="windows" aria-hidden="true"></div></div>`;
    const wins = el.querySelector('.windows');
    const cols = Math.max(1, Math.floor((w-6)/12));
    const rows = Math.max(1, Math.floor((h-14)/18));
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      const wn = document.createElement('div'); wn.className='win';
      wn.style.background = (Math.random()>0.5)?'#fff7b0':'#ffd';
      if(Math.random()>0.75) wn.style.opacity='0.25';
      wins.appendChild(wn);
    }
    objs.appendChild(el);
    return {el, x: W + 60, w, h, removed:false};
  }

  function rectsCollide(a,b){
    return !(a.right < b.left + 6 || a.left > b.right - 6 || a.bottom < b.top + 6 || a.top > b.bottom - 6);
  }

  function setLives(n){
    lives = n; if(livesEl) livesEl.textContent = lives;
    if(lives <= 0) requestAnimationFrame(()=>endGame());
  }

  function handleHit(ob){
    if(invulnerable) return;
    invulnerable = true;
    setLives(lives - 1);
    sHit();
    player.classList.add('hurt');
    setTimeout(()=>player.classList.remove('hurt'), 500);
    if(ob && !ob.removed){
      ob.removed = true;
      ob.el.style.opacity = '0.08';
      ob.el.style.transform = 'translateY(6px) scale(0.98)';
      setTimeout(()=>{ try{ ob.el.remove(); }catch(e){} }, 420);
    }
    setTimeout(()=>{ invulnerable = false; }, INVULN_MS);
  }

  function spawnIfFarEnough(){
    const lastX = (obstacles.length ? obstacles[obstacles.length-1].x : Infinity);
    if(lastX === Infinity){ const b = makeBuilding(); obstacles.push(b); return; }
    if(lastX < W - MIN_GAP_PX){ const b = makeBuilding(); obstacles.push(b); }
  }

  function doJump(){
    if(!running) return;
    if(isGrounded){
      vy = jumpSpeed;
      isGrounded = false;
      sJump();
    } else {
      sLand();
    }
  }

  document.addEventListener('keydown', e => { if(e.code === 'Space'){ e.preventDefault(); doJump(); }});
  game.addEventListener('pointerdown', e => { const t = e.target; if(t.closest('#controls') || t.closest('#card')) return; doJump(); }, {passive:true});
  retryBtn.addEventListener('click', resetGame);
  retry2.addEventListener('click', resetGame);

  function resetGame(){
    obstacles.forEach(o=>{ try{o.el.remove(); }catch(e){} });
    obstacles = []; spawnTimer = 0; spawnInterval = 1.4; speed = baseSpeed;
    score = 0; survived = 0; vy = 0; playerY = 0; isGrounded = true;
    player.style.bottom = (groundY + 20) + 'px'; player.style.transform = '';
    if(scoreEl) scoreEl.textContent = 'Score: 0'; overlay.style.pointerEvents = 'none'; card.classList.add('hidden');
    running = true; lastTime = performance.now(); setLives(3); invulnerable = false; requestAnimationFrame(loop);
  }

  function endGame(){
    running = false; sHit(); overlay.style.pointerEvents = 'auto'; card.classList.remove('hidden');
    if(finalText) finalText.textContent = 'You survived ' + Math.floor(survived) + 's · Score ' + Math.floor(score);
    if(Math.floor(score) > high){ high = Math.floor(score); localStorage.setItem('jumpGameHigh', high); if(highEl) highEl.textContent = 'High: ' + high; sWin(); }
  }

  function updatePlayerAnim(dt){
    if(isGrounded){
      const t = performance.now() / 140;
      const bob = Math.sin(t * (1 + (speed - baseSpeed)/600)) * 6;
      player.style.bottom = (groundY + 20 + Math.round(playerY) + bob) + 'px';
      player.style.transform = `translateY(0) rotate(${Math.sin(t*3)*2}deg)`;
    } else {
      player.style.bottom = (groundY + 20 + Math.round(playerY)) + 'px';
      const rot = Math.max(-20, Math.min(40, (vy) / 20));
      player.style.transform = `translateY(0) rotate(${rot}deg)`;
    }
  }

  function loop(ts){
    if(!running) return;
    const dt = Math.min(0.05, (ts - lastTime) / 1000);
    lastTime = ts;
    // faster movement overall
    speed += accel * dt;
    spawnTimer += dt;
    const adjustedSpawn = Math.max(0.5, spawnInterval - (speed - baseSpeed) / 3000);
    if(spawnTimer > adjustedSpawn){ spawnTimer = 0; spawnIfFarEnough(); }

    for(let i = obstacles.length -1; i >= 0; i--){
      const o = obstacles[i];
      o.x -= speed * dt;
      o.el.style.left = (o.x) + 'px';
      if(o.x + o.w < -160){ try{o.el.remove();}catch(e){} obstacles.splice(i,1); score += 12; survived += adjustedSpawn; if(scoreEl) scoreEl.textContent = 'Score: ' + Math.floor(score); continue; }
      if(!o.removed){
        const pRect = player.getBoundingClientRect();
        const oRect = o.el.getBoundingClientRect();
        if(rectsCollide(pRect,oRect)){ handleHit(o); }
      }
    }

    vy += gravity * dt;
    playerY += vy * dt;
    if(playerY <= 0){
      if(!isGrounded && playerY < 0) sLand();
      playerY = 0; vy = 0; isGrounded = true;
    }

    updatePlayerAnim(dt);

    // clouds parallax (stable)
    const t = performance.now();
    const base = Math.max(W, 1200);
    clouds.style.transform = `translateX(${-(t*0.03) % base}px)`;

    survived += dt;
    if(scoreEl) scoreEl.textContent = 'Score: ' + Math.floor(score + survived * 3.5);

    requestAnimationFrame(loop);
  }

  // start on load
  resetGame();

  // pause on visibility hidden
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden && running){ running = false; card.classList.remove('hidden'); overlay.style.pointerEvents='auto'; if(finalText) finalText.textContent = 'Paused'; } });
})();
