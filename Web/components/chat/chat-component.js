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

    <div class="dropdown-menu">
      <button class="dropdown-toggle">☰ Menu</button>
      <div class="dropdown-content">
        <div class="dropdown-item" data-action="go-back">Go Back to Options</div>
        <div class="dropdown-item" data-action="history">Chat History</div>
        <div class="dropdown-item" data-action="mute">Mute Music</div>
      </div>
    </div>

    <div class="chat-box">
      <div class="line-area">
        <div class="speaker-label">&nbsp;</div>
        <div class="line-text" aria-live="polite"></div>
      </div>
      <button class="btn-next hidden">
        <img src="${(options.assetsPath || './assets')}/arrows/rightArrow.png" alt="Next" class="btn-next-arrow" />
      </button>
    </div>

    <div class="choices-overlay hidden"></div>
    <div class="choices hidden"></div>

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
  const btnNext = qs('.btn-next');
  const choicesEl = qs('.choices');
  const choicesOverlay = qs('.choices-overlay');
  const historyOverlay = qs('.history-overlay');
  const historyList = qs('.history-list');
  const historyClose = qs('.history-close');
  const dropdownToggle = qs('.dropdown-toggle');
  const dropdownContent = qs('.dropdown-content');
  const dropdownItems = dropdownContent ? dropdownContent.querySelectorAll('.dropdown-item') : [];

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
  let waitingForChoiceClick = false; // New: tracks if we're waiting for click to show choices
  let currentStepText = '';

  // audio - using animalese.js
  let currentAnimaleseAudio = null;
  
  async function loadAnimalese() {
    // Check if animalese is already loaded
    if (window.animalese) {
      return window.animalese;
    }
    
    // Load animalese.js if not already loaded
    return new Promise((resolve, reject) => {
      if (window.animalese) {
        resolve(window.animalese);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://acedio.github.io/animalese.js/animalese.js';
      script.onload = () => {
        if (window.animalese) {
          resolve(window.animalese);
        } else {
          reject(new Error('Animalese failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load animalese.js'));
      document.head.appendChild(script);
    });
  }

  async function playCharTone(text = ''){
    // For character-by-character, we'll use a simpler approach
    // Just prepare for full text animalese
    return;
  }

  async function playLineAudio(text = ''){
    // Check if muted
    if (window.animaleseMuted) {
      return;
    }
    
    try {
      // Stop any currently playing audio
      if (currentAnimaleseAudio) {
        if (!currentAnimaleseAudio.paused) {
          currentAnimaleseAudio.pause();
        }
        currentAnimaleseAudio.currentTime = 0;
      }
      
      // Only play if we have text
      if (!text || text.trim() === '') {
        return;
      }
      
      // Load animalese if needed
      const animalese = await loadAnimalese();
      
      // Generate and play animalese audio for the text
      // animalese.js returns an Audio object
      if (typeof animalese === 'function') {
        try {
          // Try with options first (pitch adjustment)
          currentAnimaleseAudio = animalese(text, { pitch: 20 });
          // If that doesn't work, try without options
          if (!currentAnimaleseAudio) {
            currentAnimaleseAudio = animalese(text);
          }
          
          if (currentAnimaleseAudio && currentAnimaleseAudio.play) {
            // Ensure audio can play
            const playPromise = currentAnimaleseAudio.play();
            if (playPromise !== undefined) {
              playPromise.catch(err => {
                // Auto-play was prevented, user interaction required
                console.debug('Animalese audio requires user interaction:', err);
              });
            }
          }
        } catch (err) {
          console.warn('Error generating animalese audio:', err);
        }
      }
    } catch (error) {
      // Graceful degradation - if animalese fails, chat still works
      console.warn('Animalese audio error (continuing without audio):', error);
    }
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

  // apply resolved asset paths to elements (background + avatars + chat box)
  (async function applyAssets(){
    const base = options.assetsPath || await resolveAssetsBase();
    // set background
    const bg = container.querySelector('.background');
    if(bg) bg.style.background = `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url("${base.replace(/\/$/,'')}/backgrounds/LivingRoom.jpeg") center/cover no-repeat`;
    // set avatars
    if(avatarLeft) avatarLeft.style.backgroundImage = `url('${base.replace(/\/$/,'')}/characters/robot.GIF')`;
    if(avatarRight) avatarRight.style.backgroundImage = `url('${base.replace(/\/$/,'')}/characters/duckFlip.GIF')`;
    // set chat box background
    const chatBox = container.querySelector('.chat-box');
    if(chatBox) chatBox.style.backgroundImage = `url('${base.replace(/\/$/,'')}/textBox/textBox.png')`;
  })();

  // Function to update chat box width and height based on text content
  function updateChatBoxSize(text) {
    const chatBox = container.querySelector('.chat-box');
    if (!chatBox || !text) return;
    
    // Create temporary element to measure text dimensions
    const tempMeasure = document.createElement('div');
    tempMeasure.style.position = 'absolute';
    tempMeasure.style.visibility = 'hidden';
    tempMeasure.style.fontFamily = '"Pixelify Sans", sans-serif';
    tempMeasure.style.fontSize = '36px'; // Same as line-text
    tempMeasure.style.fontWeight = '400';
    tempMeasure.style.lineHeight = '1.4';
    tempMeasure.style.whiteSpace = 'pre-wrap';
    tempMeasure.style.wordWrap = 'break-word';
    
    // Set a reasonable max width for text wrapping (80% of screen width)
    const maxTextWidth = Math.min(window.innerWidth * 0.8, 1200);
    tempMeasure.style.maxWidth = `${maxTextWidth - 140}px`; // Account for padding and button space
    tempMeasure.style.width = 'auto';
    tempMeasure.textContent = text;
    document.body.appendChild(tempMeasure);
    
    // Measure the actual dimensions needed
    const textWidth = tempMeasure.offsetWidth;
    const textHeight = tempMeasure.offsetHeight;
    document.body.removeChild(tempMeasure);
    
    // Calculate chat box width: use actual text width + padding, but ensure it fits screen
    // Add padding (35px each side = 70px) + gap for next button (25px) + next button space (~80px) = ~175px
    const calculatedWidth = Math.max(textWidth + 175, 400); // Minimum 400px
    const maxWidth = window.innerWidth - 60; // Leave 30px margin on each side for safety
    
    chatBox.style.width = `${Math.min(calculatedWidth, maxWidth)}px`;
    
    // Calculate and set height: text height + padding + extra space for taller box
    const minHeight = 280; // Increased minimum height
    const calculatedHeight = Math.max(textHeight + 80, minHeight); // padding top/bottom = 50px + 30px extra
    chatBox.style.minHeight = `${calculatedHeight}px`;
    chatBox.style.height = 'auto'; // Allow natural expansion
    
    chatBox.style.left = '50%';
    chatBox.style.right = 'auto';
    chatBox.style.transform = 'translateX(-50%)';
  }
  
  async function typeLine(text){ 
    isTyping = true; 
    if(!lineText) return; 
    lineText.textContent = '';
    
    // Update chat box size based on text
    updateChatBoxSize(text);
    
    // Start playing animalese audio for the full text
    playLineAudio(text);
    
    // Type character by character with slower speed (50-100ms per character)
    for(let i=0;i<text.length;i++){ 
      // Check if user clicked to skip (handled by main click handler)
      if (!isTyping) {
        // User clicked, show full text immediately
        lineText.textContent = text;
        updateChatBoxSize(text); // Update size when skipping
        break;
      }
      lineText.textContent += text[i]; 
      // Slower typing speed: 50-100ms per character (was 28-68ms)
      await new Promise(r=>setTimeout(r, 50 + Math.random()*50)); 
    }
    
    // Ensure full text is shown
    if (lineText) {
      lineText.textContent = text;
      updateChatBoxSize(text); // Final size update
    }
    
    isTyping = false; 
  }

  async function renderStep(i){
    if(i<0) i=0; if(i>=DIALOG.length) i=DIALOG.length-1; index=i; const step = DIALOG[i];
    // Support custom speaker names from options
    const speakerNames = options.speakerNames || {};
    const robotName = speakerNames.robot || 'QuackBot';
    const duckName = speakerNames.duck || 'The Duck';
    if(speakerLabel) speakerLabel.textContent = step.speaker === 'robot' ? robotName : duckName;
    // prepare current text (used for click-to-complete)
    currentStepText = step.text || '';
    showAvatar(step.speaker); hideAvatar(step.speaker==='robot'?'duck':'robot');
    
    // Hide choices and overlay when starting a new step
    if(choicesEl) {
      choicesEl.classList.add('hidden');
      choicesEl.classList.remove('show');
    }
    if(choicesOverlay) {
      choicesOverlay.classList.add('hidden');
    }
    
    // Hide Next button initially (will show after typing completes if needed)
    if(btnNext) btnNext.classList.add('hidden');
    waitingForChoiceClick = false;
    waitingForClick = false;

    // type the text (user can click during typing to finish immediately)
    await typeLine(step.text);
    // Animalese is already playing from typeLine, no need to call again
    appendHistory({speaker:step.speaker, text:step.text});

    // Handle choices vs. regular dialogue
    if(step.choices){
      // Don't show choices yet - wait for user to click text box
      waitingForChoiceClick = true;
      waitingForClick = false;
      if(btnNext) btnNext.classList.add('hidden');
    } else {
      // No choices - enable click-to-continue
      choicesEl.classList.add('hidden');
      choicesEl.classList.remove('show');
      if(choicesOverlay) choicesOverlay.classList.add('hidden');
      // Always wait for user click to continue (no auto-advance)
      if(index < DIALOG.length-1){
        waitingForClick = true;
        if(btnNext) btnNext.classList.remove('hidden');
      } else {
        waitingForClick = false;
        if(btnNext) btnNext.classList.add('hidden');
      }
    }

    // after some delay, fade out avatar (unless choices will be shown)
    if(!step.choices){
      setTimeout(()=>hideAvatar(step.speaker), 900);
    }
  }

  function showChoices(choices){ 
    if(!choicesEl) return; 
    choicesEl.innerHTML='';
    const bubbleAssets = ['bubblePink.png', 'bubbleYellow.png', 'bubbleBlue.PNG'];
    const tabAssets = ['tabPink.png', 'tabYellow.png', 'tabBlue.png', 'tabGreen.png'];
    
    // Show overlay first (darken screen)
    if(choicesOverlay) {
      choicesOverlay.classList.remove('hidden');
    }
    
    // Create a temporary container for measuring text
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.fontFamily = '"Pixelify Sans", sans-serif';
    tempContainer.style.fontSize = '32px';
    tempContainer.style.fontWeight = '600';
    document.body.appendChild(tempContainer);
    
    // Create each button with its own dynamic size based on its text
    choices.forEach((c, idx)=>{
      // Measure this specific button's text
      // First, measure without width constraint to see natural single-line width
      const tempTextUnconstrained = document.createElement('div');
      tempTextUnconstrained.textContent = c.text;
      tempTextUnconstrained.style.display = 'inline-block';
      tempTextUnconstrained.style.whiteSpace = 'nowrap';
      tempTextUnconstrained.style.fontFamily = '"Pixelify Sans", sans-serif';
      tempTextUnconstrained.style.fontSize = '32px';
      tempTextUnconstrained.style.fontWeight = '600';
      tempContainer.appendChild(tempTextUnconstrained);
      
      const naturalWidth = tempTextUnconstrained.offsetWidth;
      tempContainer.removeChild(tempTextUnconstrained);
      
      // Now measure with wrapping enabled (allowing multi-line)
      const tempText = document.createElement('div');
      tempText.textContent = c.text;
      tempText.style.display = 'block';
      tempText.style.maxWidth = '1200px'; // Max width before wrapping
      tempText.style.width = 'auto';
      tempText.style.wordWrap = 'break-word';
      tempText.style.whiteSpace = 'normal';
      tempText.style.fontFamily = '"Pixelify Sans", sans-serif';
      tempText.style.fontSize = '32px';
      tempText.style.fontWeight = '600';
      tempText.style.lineHeight = '1.4';
      tempContainer.appendChild(tempText);
      
      // Measure actual width and height for THIS button's text (with wrapping allowed)
      const wrappedWidth = tempText.offsetWidth;
      const textHeight = tempText.offsetHeight;
      
      tempContainer.removeChild(tempText);
      
      // Determine button width:
      // - If text fits in one line (natural width <= 1200px), use natural width
      // - If text wraps (natural width > 1200px), use the wrapped width (actual width after wrapping)
      // - Always ensure minimum width of 600px
      const actualTextWidth = naturalWidth <= 1200 ? naturalWidth : Math.max(wrappedWidth, 1200);
      
      // Calculate button size: doubled change rate - reduced padding (50px each side = 100px total, 50px top + 90px bottom = 140px total)
      // Reduced padding from 200px to 100px to make buttons 2x more responsive to text width changes
      const buttonWidth = Math.max(actualTextWidth + 100, 600);
      const buttonHeight = Math.max(textHeight + 140, 180);
      
      // Create the button
      const b = document.createElement('button');
      b.className='choice-btn';
      b.textContent=c.text;
      b.onclick=()=>handleChoice(c);
      // Use tab assets for choices, cycle through them
      const assetIndex = idx % tabAssets.length;
      const assetPath = options.assetsPath ? `${options.assetsPath}/tabs/${tabAssets[assetIndex]}` : `./assets/tabs/${tabAssets[assetIndex]}`;
      b.style.backgroundImage = `url('${assetPath}')`;
      // Set individual width and height based on THIS button's text
      b.style.width = `${buttonWidth}px`;
      b.style.height = `${buttonHeight}px`;
      b.style.minHeight = `${buttonHeight}px`;
      // Remove any margin/padding that might cause larger clickable area
      b.style.margin = '0';
      b.style.overflow = 'visible';
      choicesEl.appendChild(b);
    });
    
    document.body.removeChild(tempContainer);
    
    choicesEl.classList.remove('hidden');
    choicesEl.classList.add('show');
    // Hide Next button when choices are shown
    if(btnNext) btnNext.classList.add('hidden');
    waitingForChoiceClick = false;
  }

  function handleChoice(choice){ 
    // Hide choices and overlay when choice is made
    if(choicesEl) {
      choicesEl.classList.add('hidden');
      choicesEl.classList.remove('show');
    }
    if(choicesOverlay) {
      choicesOverlay.classList.add('hidden');
    }
    
    appendHistory({speaker:'duck', text:choice.text}); 
    renderInlineDuckLine(choice.text); 
    setTimeout(()=>{ 
      if(choice.feedback) renderStepFromInline({speaker:'robot', text:choice.feedback, then:choice.next}); 
      else renderStep(choice.next); 
    }, 700); 
  }

  async function renderInlineDuckLine(text){ showAvatar('duck'); const speakerNames = options.speakerNames || {}; if(speakerLabel) speakerLabel.textContent = speakerNames.duck || 'You'; await typeLine(text); setTimeout(()=>hideAvatar('duck'), 500); }

  async function renderStepFromInline(obj){ showAvatar(obj.speaker); const speakerNames = options.speakerNames || {}; const robotName = speakerNames.robot || 'QuackBot'; if(speakerLabel) speakerLabel.textContent = obj.speaker === 'robot' ? robotName : 'You'; await typeLine(obj.text); appendHistory({speaker:obj.speaker, text:obj.text}); setTimeout(()=>hideAvatar(obj.speaker),700); setTimeout(()=>renderStep(obj.then),700); }

  function renderHistoryList(){ if(!historyList) return; historyList.innerHTML = ''; history.forEach(h=>{ const it = document.createElement('div'); it.className='history-item ' + (h.speaker==='robot'?'robot':'duck'); const av = document.createElement('div'); av.className='history-avatar'; av.textContent = h.speaker==='robot' ? 'R':'D'; const b = document.createElement('div'); b.className='history-bubble'; b.textContent = h.text; it.appendChild(av); it.appendChild(b); historyList.appendChild(it); }); }

  function openHistory(){ if(!historyOverlay) return; historyOverlay.classList.add('open'); historyOverlay.classList.remove('hidden'); renderHistoryList(); }
  function closeHistory(){ if(!historyOverlay) return; historyOverlay.classList.remove('open'); historyOverlay.classList.add('hidden'); }

  function goBack(){ if(isTyping) return; if(history.length<=1) return; history.pop(); const last = history[history.length-1]; if(!last) return; const found = DIALOG.findIndex(d=>d.text===last.text && d.speaker===last.speaker); if(found>=0){ index = found; if(speakerLabel) speakerLabel.textContent = last.speaker==='robot' ? 'QuackBot' : 'You'; if(lineText) lineText.textContent = last.text; showAvatar(last.speaker); setTimeout(()=>hideAvatar(last.speaker),700); } else { if(speakerLabel) speakerLabel.textContent = last.speaker==='robot' ? 'QuackBot' : 'You'; if(lineText) lineText.textContent = last.text; } }

  // wire controls
  if(btnNext) btnNext.addEventListener('click', ()=>{
    if(waitingForClick && index < DIALOG.length-1){
      waitingForClick = false;
      renderStep(index+1);
    }
  });
  
  // Dropdown menu functionality
  if(dropdownToggle){
    dropdownToggle.addEventListener('click', (e)=>{
      e.stopPropagation();
      dropdownContent.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e)=>{
      if(!dropdownToggle.contains(e.target) && !dropdownContent.contains(e.target)){
        dropdownContent.classList.remove('show');
      }
    });
  }
  
  // Dropdown menu items
  dropdownItems.forEach(item => {
    item.addEventListener('click', (e)=>{
      const action = item.getAttribute('data-action');
      dropdownContent.classList.remove('show');
      
      if(action === 'go-back'){
        // Go back to options page (bank reception)
        if(options.goBackUrl){
          window.location.href = options.goBackUrl;
        } else {
          window.location.href = 'bankReception.html';
        }
      } else if(action === 'history'){
        openHistory();
      } else if(action === 'mute'){
        // Toggle mute for animalese audio
        if(window.animaleseMuted){
          window.animaleseMuted = false;
          item.textContent = 'Mute Music';
        } else {
          window.animaleseMuted = true;
          item.textContent = 'Unmute Music';
        }
      }
    });
  });
  
  if(historyClose) historyClose.addEventListener('click', ()=>closeHistory());

  // click/interaction behaviour on the chat box:
  const chatBoxEl = container.querySelector('.chat-box');
  if(chatBoxEl){
    chatBoxEl.addEventListener('click', (e)=>{
      // Don't trigger on button clicks inside chat box
      if (e.target.tagName === 'BUTTON') {
        return;
      }
      
      // First click: if typing, finish immediately and show full text
      if(isTyping){
        isTyping = false; // This will cause typeLine to display full text
        if(lineText && currentStepText) {
          lineText.textContent = currentStepText;
        }
        return; // Don't advance to next step yet
      }

      // Second click: if waiting for choices to be shown (question fully displayed)
      if(waitingForChoiceClick){
        const step = DIALOG[index];
        if(step && step.choices){
          showChoices(step.choices);
          return;
        }
      }

      // Second click: if waiting for click to continue (no choices), advance to next step
      if(waitingForClick){
        waitingForClick = false;
        if(index < DIALOG.length-1){
          renderStep(index+1);
        }
      }
    }, { once: false });
  }
  
  // Initialize mute state
  window.animaleseMuted = false;

  // audio unlock - ensure audio context can play (for animalese)
  document.body.addEventListener('click', function unlock(){ 
    // Audio context may be needed for animalese
    if (window.AudioContext || window.webkitAudioContext) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume && ctx.resume();
    }
    document.body.removeEventListener('click', unlock); 
  });

  // start
  renderStep(0);

  // Auto-advance disabled - user must click to proceed to next line
  // (async function autoAdvance(){ while(true){ while(isTyping) await new Promise(r=>setTimeout(r,200)); const step = DIALOG[index]; if(step && step.choices) break; if(index < DIALOG.length-1){ await new Promise(r=>setTimeout(r,900)); await renderStep(index+1); index = Math.min(index+1, DIALOG.length-1); } else break; }})();

  // return an API to control externally
  return {
    next: ()=>{ if(index < DIALOG.length-1) renderStep(index+1); },
    history: ()=>history.slice(),
    openHistory, closeHistory
  };
}
