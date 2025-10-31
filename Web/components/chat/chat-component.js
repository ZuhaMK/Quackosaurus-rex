/* chat-component.js
   Exports: mountChat(containerSelector, options)
   Usage: import { mountChat } from './components/chat/chat-component.js';
          mountChat('#my-container', { dialog: DIALOG, assetsPath: '../assets' });
*/

export function mountChat(containerSelector, options = {}){
  const container = (typeof containerSelector === 'string') ? document.querySelector(containerSelector) : containerSelector;
  if(!container) throw new Error('mountChat: container not found: ' + containerSelector);

  // apply root class
  container.classList.add('quack-chat');

  // inject markup
  container.innerHTML = `
    <div class="background"></div>
    <div class="stage">
      <div class="avatar left" data-speaker="robot" aria-hidden="true">R</div>
      <div class="avatar right" data-speaker="duck" aria-hidden="true">D</div>
    </div>

    <div class="chat-box">
      <div class="chat-controls">
        <button class="control btn-back">⟵ Back</button>
        <button class="control btn-history">History</button>
      </div>

      <div class="line-area">
        <div class="speaker-label">&nbsp;</div>
        <div class="line-text" aria-live="polite"></div>
      </div>

      <div class="choices hidden"></div>
    </div>

    <div class="history-overlay hidden" role="dialog" aria-modal="true">
      <div class="history-inner">
        <button class="history-close">✕</button>
        <h2>Chat History</h2>
        <div class="history-list"></div>
      </div>
    </div>
  `;

  // scoped selectors
  const qs = s => container.querySelector(s);
  const avatarLeft = qs('.avatar.left');
  const avatarRight = qs('.avatar.right');
  const speakerLabel = qs('.speaker-label');
  const lineText = qs('.line-text');
  const btnBack = qs('.btn-back');
  const btnHistory = qs('.btn-history');
  const choicesEl = qs('.choices');
  const historyOverlay = qs('.history-overlay');
  const historyList = qs('.history-list');
  const historyClose = qs('.history-close');

  // dialog data - allow override
  const DIALOG = options.dialog || [
    {id:0, speaker:'robot', text:'Hello! I am QuackBot — ready to learn about saving today? 😄'},
    {id:1, speaker:'duck', text:'Yes, I want to learn how to save!'},
    {id:2, speaker:'robot', text:'Great! First question: If you get $50, what percent would you save?',
      choices:[
        {id:'a', text:'Save 10% (I need it now)', next:3, feedback:'You might struggle to reach goals saving only 10%.'},
        {id:'b', text:'Save 20% (sounds good)', next:4, feedback:'Nice! 20% is a healthy habit.'},
        {id:'c', text:'Save 50% (ambitious!)', next:5, feedback:'Impressive — but check if it fits your budget.'}
      ]
    },
    {id:3, speaker:'robot', text:'That choice is okay — try aiming higher when you can.'},
    {id:4, speaker:'robot', text:'Absolutely right! Building the habit matters more than perfect numbers.'},
    {id:5, speaker:'robot', text:'Ambitious choices can work, just keep flexible.'},
    {id:6, speaker:'robot', text:'Let’s practice another scenario later. Keep saving! ✨'}
  ];

  // state
  let index = 0; let history = []; let isTyping = false;
  let waitingForClick = false;
  let currentStepText = '';

  // audio
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playCharTone(){
    const now = audioCtx.currentTime; const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.type='sine'; o.frequency.setValueAtTime(880, now); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.04, now+0.01);
    o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now+0.06);
  }
  function playLineAudio(){
    const now = audioCtx.currentTime;
    const o1 = audioCtx.createOscillator(), g1 = audioCtx.createGain(); o1.type='triangle'; o1.frequency.setValueAtTime(660, now);
    g1.gain.setValueAtTime(0.001, now); g1.gain.linearRampToValueAtTime(0.05, now+0.02); o1.connect(g1); g1.connect(audioCtx.destination); o1.start(now); o1.stop(now+0.18);
    const o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain(); o2.type='sine'; o2.frequency.setValueAtTime(880, now+0.08);
    g2.gain.setValueAtTime(0.001, now+0.08); g2.gain.linearRampToValueAtTime(0.04, now+0.12); o2.connect(g2); g2.connect(audioCtx.destination); o2.start(now+0.08); o2.stop(now+0.28);
  }

  // util
  function speakerAvatar(s){ return s === 'robot' ? avatarLeft : avatarRight; }
  function showAvatar(s){ const a = speakerAvatar(s); if(!a) return; a.classList.add('speaking'); }
  function hideAvatar(s){ const a = speakerAvatar(s); if(!a) return; a.classList.remove('speaking'); }
  function appendHistory(item){ history.push(item); }

  // Resolve assets base path at runtime by probing likely locations.
  async function resolveAssetsBase(){
    const candidates = [
      '../assets',    // if component served from /components/chat and HTML at /html
      '../../assets', // if served from /components and HTML at root
      '/assets',      // absolute from site root
      'assets'        // relative to current page
    ];
    const probe = async (base, subpath)=>{
      try{
        const url = base.replace(/\/$/, '') + '/' + subpath.replace(/^\//,'');
        const r = await fetch(url, {method:'HEAD'});
        if(r.ok) return base;
      }catch(e){}
      return null;
    };
    for(const c of candidates){
      const ok = await probe(c, 'backgrounds/LivingRoom.jpeg');
      if(ok) return ok;
    }
    return candidates[0]; // fallback
  }

  // apply resolved asset paths to elements (background + avatars)
  (async function applyAssets(){
    const base = options.assetsPath || await resolveAssetsBase();
    // set background
    const bg = container.querySelector('.background');
    if(bg) bg.style.background = `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url("${base.replace(/\/$/,'')}/backgrounds/LivingRoom.jpeg") center/cover no-repeat`;
    // set avatars
    if(avatarLeft) avatarLeft.style.backgroundImage = `url('${base.replace(/\/$/,'')}/characters/robot.GIF')`;
    if(avatarRight) avatarRight.style.backgroundImage = `url('${base.replace(/\/$/,'')}/characters/duckFlip.GIF')`;
  })();

  async function typeLine(text){ isTyping = true; if(!lineText) return; lineText.textContent = '';
    for(let i=0;i<text.length;i++){ lineText.textContent += text[i]; if(text[i].trim()) playCharTone(); await new Promise(r=>setTimeout(r, 28 + Math.random()*40)); }
    isTyping = false; }

  async function renderStep(i){
    if(i<0) i=0; if(i>=DIALOG.length) i=DIALOG.length-1; index=i; const step = DIALOG[i];
    if(speakerLabel) speakerLabel.textContent = step.speaker === 'robot' ? 'QuackBot' : 'The Duck';
    // prepare current text (used for click-to-complete)
    currentStepText = step.text || '';
    showAvatar(step.speaker); hideAvatar(step.speaker==='robot'?'duck':'robot');

    // type the text (user can click during typing to finish immediately)
    await typeLine(step.text);
    playLineAudio();
    appendHistory({speaker:step.speaker, text:step.text});

    // show choices if present; if not, enable click-to-continue
    if(step.choices){
      showChoices(step.choices);
      waitingForClick = false;
    } else {
      choicesEl.classList.add('hidden');
      // if there's a next line, wait for user click to continue
      if(index < DIALOG.length-1){
        waitingForClick = true;
      } else {
        waitingForClick = false;
      }
    }

    // after some delay, fade out avatar (unless choices are shown)
    if(!step.choices){
      setTimeout(()=>hideAvatar(step.speaker), 900);
    }
  }

  function showChoices(choices){ if(!choicesEl) return; choicesEl.innerHTML='';
    choices.forEach(c=>{ const b = document.createElement('button'); b.className='choice-btn'; b.textContent=c.text; b.onclick=()=>handleChoice(c); choicesEl.appendChild(b); });
    choicesEl.classList.remove('hidden'); }

  function handleChoice(choice){ appendHistory({speaker:'duck', text:choice.text}); renderInlineDuckLine(choice.text); setTimeout(()=>{ if(choice.feedback) renderStepFromInline({speaker:'robot', text:choice.feedback, then:choice.next}); else renderStep(choice.next); }, 700); }

  async function renderInlineDuckLine(text){ showAvatar('duck'); if(speakerLabel) speakerLabel.textContent='You'; await typeLine(text); playLineAudio(); setTimeout(()=>hideAvatar('duck'), 500); }

  async function renderStepFromInline(obj){ showAvatar(obj.speaker); if(speakerLabel) speakerLabel.textContent = obj.speaker === 'robot' ? 'QuackBot' : 'You'; await typeLine(obj.text); playLineAudio(); appendHistory({speaker:obj.speaker, text:obj.text}); setTimeout(()=>hideAvatar(obj.speaker),700); setTimeout(()=>renderStep(obj.then),700); }

  function renderHistoryList(){ if(!historyList) return; historyList.innerHTML = ''; history.forEach(h=>{ const it = document.createElement('div'); it.className='history-item ' + (h.speaker==='robot'?'robot':'duck'); const av = document.createElement('div'); av.className='history-avatar'; av.textContent = h.speaker==='robot' ? 'R':'D'; const b = document.createElement('div'); b.className='history-bubble'; b.textContent = h.text; it.appendChild(av); it.appendChild(b); historyList.appendChild(it); }); }

  function openHistory(){ if(!historyOverlay) return; historyOverlay.classList.add('open'); historyOverlay.classList.remove('hidden'); renderHistoryList(); }
  function closeHistory(){ if(!historyOverlay) return; historyOverlay.classList.remove('open'); historyOverlay.classList.add('hidden'); }

  function goBack(){ if(isTyping) return; if(history.length<=1) return; history.pop(); const last = history[history.length-1]; if(!last) return; const found = DIALOG.findIndex(d=>d.text===last.text && d.speaker===last.speaker); if(found>=0){ index = found; if(speakerLabel) speakerLabel.textContent = last.speaker==='robot' ? 'QuackBot' : 'You'; if(lineText) lineText.textContent = last.text; showAvatar(last.speaker); setTimeout(()=>hideAvatar(last.speaker),700); } else { if(speakerLabel) speakerLabel.textContent = last.speaker==='robot' ? 'QuackBot' : 'You'; if(lineText) lineText.textContent = last.text; } }

  // wire controls
  if(btnBack) btnBack.addEventListener('click', ()=>goBack());
  if(btnHistory) btnHistory.addEventListener('click', ()=>openHistory());
  if(historyClose) historyClose.addEventListener('click', ()=>closeHistory());

  // click/interaction behaviour on the chat box:
  const chatBoxEl = container.querySelector('.chat-box');
  if(chatBoxEl){
    chatBoxEl.addEventListener('click', (e)=>{
      // if typing, finish immediately
      if(isTyping){
        // finish the typewriter immediately
        isTyping = false;
        if(lineText && currentStepText) lineText.textContent = currentStepText;
        playLineAudio();
        return;
      }

      // if we are waiting for click to continue (no choices shown), advance
      if(waitingForClick){
        waitingForClick = false;
        if(index < DIALOG.length-1){
          renderStep(index+1);
        }
      }
    });
  }

  // audio unlock
  document.body.addEventListener('click', function unlock(){ audioCtx.resume && audioCtx.resume(); document.body.removeEventListener('click', unlock); });

  // start
  renderStep(0);

  (async function autoAdvance(){ while(true){ while(isTyping) await new Promise(r=>setTimeout(r,200)); const step = DIALOG[index]; if(step && step.choices) break; if(index < DIALOG.length-1){ await new Promise(r=>setTimeout(r,900)); await renderStep(index+1); index = Math.min(index+1, DIALOG.length-1); } else break; }})();

  // return an API to control externally
  return {
    next: ()=>{ if(index < DIALOG.length-1) renderStep(index+1); },
    history: ()=>history.slice(),
    openHistory, closeHistory
  };
}
