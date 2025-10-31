/* chat.js - mock chat UI with animations, typewriter, choices and history overlay */

// Simple dialogue script (mock) - demonstrate branching choices
const DIALOG = [
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

// State
let index = 0;
let history = [];
let isTyping = false;

// Elements (will be bound on load)
let avatarRobot, avatarDuck, speakerLabel, lineText, btnBack, btnHistory, choicesEl, historyOverlay, historyList, historyClose;

// WebAudio synth for short chime per character
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playCharTone(){
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(880, now);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.04, now + 0.01);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(now); o.stop(now + 0.06);
}

function playLineAudio(){
  // playful short melody per line (two quick tones)
  const now = audioCtx.currentTime;
  const o1 = audioCtx.createOscillator(), g1 = audioCtx.createGain();
  o1.type='triangle'; o1.frequency.setValueAtTime(660, now);
  g1.gain.setValueAtTime(0.001, now); g1.gain.linearRampToValueAtTime(0.05, now+0.02);
  o1.connect(g1); g1.connect(audioCtx.destination);
  o1.start(now); o1.stop(now+0.18);
  const o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain();
  o2.type='sine'; o2.frequency.setValueAtTime(880, now+0.08);
  g2.gain.setValueAtTime(0.001, now+0.08); g2.gain.linearRampToValueAtTime(0.04, now+0.12);
  o2.connect(g2); g2.connect(audioCtx.destination);
  o2.start(now+0.08); o2.stop(now+0.28);
}

// Utilities
function speakerAvatar(speaker){
  return speaker === 'robot' ? avatarRobot : avatarDuck;
}

function showAvatar(speaker){
  const av = speakerAvatar(speaker);
  if(!av) return;
  av.classList.add('speaking');
}
function hideAvatar(speaker){
  const av = speakerAvatar(speaker);
  if(!av) return;
  av.classList.remove('speaking');
}

function appendHistory(item){
  history.push(item);
}

// Typewriter effect with per-char audio
async function typeLine(text){
  isTyping = true;
  lineText.textContent = '';
  for(let i=0;i<text.length;i++){
    lineText.textContent += text[i];
    // play small sound for readable chars
    if(text[i].trim()) playCharTone();
    await new Promise(r=>setTimeout(r, 28 + Math.random()*40));
  }
  isTyping = false;
}

// Render a step (index into DIALOG)
async function renderStep(i){
  // clamp
  if(i<0) i=0;
  if(i>=DIALOG.length) i=DIALOG.length-1;
  index = i;
  const step = DIALOG[i];
  // show speaker label
  speakerLabel.textContent = step.speaker === 'robot' ? 'QuackBot' : 'The Duck';

  // animate avatar in
  showAvatar(step.speaker);
  // hide the other
  hideAvatar(step.speaker === 'robot' ? 'duck' : 'robot');

  // type the text
  await typeLine(step.text);
  playLineAudio();

  // append to history
  appendHistory({speaker:step.speaker, text:step.text});

  // show choices if present
  if(step.choices){
    showChoices(step.choices);
  } else {
    choicesEl.classList.add('hidden');
  }

  // after some delay, fade out avatar (unless choices are shown)
  if(!step.choices){
    setTimeout(()=>hideAvatar(step.speaker), 900);
  }
}

function showChoices(choices){
  if(!choicesEl) return;
  choicesEl.innerHTML='';
  choices.forEach(c=>{
    const b = document.createElement('button');
    b.className='choice-btn';
    b.textContent = c.text;
    b.onclick = ()=>handleChoice(c);
    choicesEl.appendChild(b);
  });
  choicesEl.classList.remove('hidden');
}

function handleChoice(choice){
  // add the user's choice as duck line
  appendHistory({speaker:'duck', text:choice.text});
  // show as duck speaking briefly
  renderInlineDuckLine(choice.text);
  // then show feedback from robot if exists
  setTimeout(()=>{
    // robot feedback: we'll use choice.feedback then follow next index
    if(choice.feedback){
      renderStepFromInline({speaker:'robot', text:choice.feedback, then:choice.next});
    } else {
      renderStep(choice.next);
    }
  }, 700);
}

async function renderInlineDuckLine(text){
  // show duck avatar and type quickly
  showAvatar('duck');
  speakerLabel.textContent = 'You';
  await typeLine(text);
  playLineAudio();
  setTimeout(()=>hideAvatar('duck'),500);
}

async function renderStepFromInline(obj){
  // obj: {speaker,text,then}
  showAvatar(obj.speaker);
  speakerLabel.textContent = obj.speaker === 'robot' ? 'QuackBot' : 'You';
  await typeLine(obj.text);
  playLineAudio();
  appendHistory({speaker:obj.speaker, text:obj.text});
  setTimeout(()=>hideAvatar(obj.speaker),700);
  // then go to next
  setTimeout(()=>renderStep(obj.then),700);
}

// history overlay functions
function openHistory(){
  if(!historyOverlay) return;
  // prefer an explicit 'open' class so display rules are deterministic
  historyOverlay.classList.add('open');
  historyOverlay.classList.remove('hidden');
  renderHistoryList();
}
function closeHistory(){ if(historyOverlay){ historyOverlay.classList.remove('open'); historyOverlay.classList.add('hidden'); } }

function renderHistoryList(){
  if(!historyList) return;
  historyList.innerHTML='';
  history.forEach((h,idx)=>{
    const it = document.createElement('div');
    it.className = 'history-item ' + (h.speaker==='robot'?'robot':'duck');
    const av = document.createElement('div'); av.className='history-avatar'; av.textContent = h.speaker==='robot' ? 'R' : 'D';
    const b = document.createElement('div'); b.className='history-bubble'; b.textContent = h.text;
    it.appendChild(av); it.appendChild(b);
    historyList.appendChild(it);
  });
}

// Back button - go to previous spoken line in history
function goBack(){
  if(isTyping) return; // don't interrupt typing
  if(history.length<=1) return;
  // remove last (current) history entry
  history.pop();
  const last = history[history.length-1];
  if(!last) return;
  // find dialog index matching last
  const found = DIALOG.findIndex(d=>d.text === last.text && d.speaker === last.speaker);
  if(found>=0){
    index = found;
    // render static representation (don't push into history)
    if(speakerLabel) speakerLabel.textContent = last.speaker === 'robot' ? 'QuackBot' : 'You';
    if(lineText) lineText.textContent = last.text;
    showAvatar(last.speaker);
    setTimeout(()=>hideAvatar(last.speaker),700);
  } else {
    if(speakerLabel) speakerLabel.textContent = last.speaker === 'robot' ? 'QuackBot' : 'You';
    if(lineText) lineText.textContent = last.text;
  }
}

// initial wiring (moved into window.load to avoid running before DOM is ready)

// start conversation
window.addEventListener('load', ()=>{
  // bind elements after DOM ready
  avatarRobot = document.getElementById('avatar-robot');
  avatarDuck = document.getElementById('avatar-duck');
  speakerLabel = document.getElementById('speaker-label');
  lineText = document.getElementById('line-text');
  btnBack = document.getElementById('btn-back');
  btnHistory = document.getElementById('btn-history');
  choicesEl = document.getElementById('choices');
  historyOverlay = document.getElementById('history-overlay');
  historyList = document.getElementById('history-list');
  historyClose = document.getElementById('history-close');

  // safety: attach listeners only if elements exist
  if(btnBack) btnBack.addEventListener('click', ()=>goBack());
  if(btnHistory) btnHistory.addEventListener('click', ()=>openHistory());
  if(historyClose) historyClose.addEventListener('click', ()=>closeHistory());

  // small unlock for audio on some browsers
  document.body.addEventListener('click', function unlock(){
    audioCtx.resume && audioCtx.resume();
    document.body.removeEventListener('click', unlock);
  });

  renderStep(0);

  // auto-advance to next lines when there are no choices
  (async function autoAdvance(){
    while(true){
      // wait until typing finishes
      while(isTyping) await new Promise(r=>setTimeout(r,200));
      // if current step has choices, wait
      const step = DIALOG[index];
      if(step && step.choices) break;
      // if next exists, advance after a little pause
      if(index < DIALOG.length-1){
        await new Promise(r=>setTimeout(r,900));
        await renderStep(index+1);
        index = Math.min(index+1, DIALOG.length-1);
      } else break;
    }
  })();
});
