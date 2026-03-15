/* =============================================
   VoiceNote AI — app.js (Gemini Version)
   ============================================= */

'use strict';

const state = {
  isRecording: false,
  mediaRecorder: null,
  audioChunks: [],
  timerInterval: null,
  seconds: 0,
  currentTone: 'professional',
  currentTab: 'record',
  audioBlob: null,
  recognition: null,
  liveTranscript: '',
  recognizedText: '',
  summaryText: '',
};

const $ = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
  const savedKey = sessionStorage.getItem('gemini_api_key');
  if (savedKey) $('api-key').value = savedKey;
  $('api-key').addEventListener('input', e => {
    sessionStorage.setItem('gemini_api_key', e.target.value.trim());
  });
  $('api-key').placeholder = 'AIzaSy...';
});

function switchTab(tab, el) {
  state.currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  $('tab-record').style.display = tab === 'record' ? 'flex' : 'none';
  $('tab-type').style.display   = tab === 'type'   ? 'flex' : 'none';
  if (tab === 'record') {
    $('tab-record').style.flexDirection = 'column';
    $('tab-record').style.gap = '1rem';
  }
}

function selectChip(group, value, el) {
  if (group === 'tone') state.currentTone = value;
  const container = el.closest('.chip-row');
  container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

function toggleKeyVisibility() {
  const inp = $('api-key');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function toggleRecording() {
  state.isRecording ? stopRecording() : startRecording();
}

function startRecording() {
  state.liveTranscript = '';
  state.recognizedText = '';
  state.seconds = 0;
  state.audioChunks = [];

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    state.recognition = new SR();
    state.recognition.continuous = true;
    state.recognition.interimResults = true;
    state.recognition.lang = 'en-US';
    state.recognition.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) state.liveTranscript += e.results[i][0].transcript + ' ';
        else interim = e.results[i][0].transcript;
      }
      state.recognizedText = state.liveTranscript + interim;
    };
    state.recognition.onerror = () => {};
    try { state.recognition.start(); } catch(e) {}
  }

  state.isRecording = true;
  updateRecordUI(true);

  state.timerInterval = setInterval(() => {
    state.seconds++;
    const m = Math.floor(state.seconds / 60);
    const s = state.seconds % 60;
    $('timer').textContent = `${m}:${s.toString().padStart(2, '0')}`;
  }, 1000);

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      state.mediaRecorder = new MediaRecorder(stream);
      state.mediaRecorder.ondataavailable = e => state.audioChunks.push(e.data);
      state.mediaRecorder.onstop = () => {
        state.audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(state.audioBlob);
        $('audio-player').src = url;
        $('audio-preview').style.display = 'flex';
        stream.getTracks().forEach(t => t.stop());
      };
      state.mediaRecorder.start();
    })
    .catch(() => {
      showError('Microphone access denied. Please allow microphone access and try again.');
      stopRecording();
    });
}

function stopRecording() {
  state.isRecording = false;
  clearInterval(state.timerInterval);
  if (state.recognition) { try { state.recognition.stop(); } catch(e) {} }
  if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') state.mediaRecorder.stop();
  updateRecordUI(false);
}

function updateRecordUI(recording) {
  $('mic-btn').classList.toggle('recording', recording);
  $('waveform').classList.toggle('active', recording);
  $('mic-svg').style.display  = recording ? 'none'  : 'block';
  $('stop-svg').style.display = recording ? 'block' : 'none';
  $('rec-label').textContent  = recording ? 'recording — tap to stop' : 'tap to start recording';
  $('timer').classList.toggle('active', recording);
  if (!recording) {
    $('timer').textContent = `${Math.floor(state.seconds/60)}:${(state.seconds%60).toString().padStart(2,'0')}`;
  }
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  state.audioBlob = file;
  state.recognizedText = `[Audio file: ${file.name}]`;
  const url = URL.createObjectURL(file);
  $('audio-player').src = url;
  $('audio-preview').style.display = 'flex';
  $('file-meta').textContent = `${file.name} · ${(file.size / 1024).toFixed(0)} KB`;
}

async function runPipeline() {
  const apiKey = $('api-key').value.trim();
  if (!apiKey) { showError('Please enter your Gemini API key above.'); return; }

  let inputText = '';
  if (state.currentTab === 'type') {
    inputText = $('manual-text').value.trim();
    if (!inputText) { showError('Please paste or type some text first.'); return; }
  } else {
    inputText = (state.recognizedText || '').trim();
    if (!inputText) {
      if (state.audioBlob) {
        inputText = 'Voice memo recorded. Please use the text input tab to paste your transcript.';
      } else {
        showError('Please record a voice note or paste some text first.');
        return;
      }
    }
  }

  hideError();
  setLoading(true);
  showOutput('loading');
  setPipelineStep(1);
  await delay(600);
  setPipelineStep(2);
  $('loading-text').textContent = 'Sending to Gemini AI...';

  try {
    const result = await callGeminiAPI(apiKey, inputText);
    setPipelineStep(3);
    $('loading-text').textContent = 'Formatting results...';
    await delay(400);
    renderResult(result, inputText);
    showOutput('result');
    $('output-actions').style.display = 'flex';
  } catch (err) {
    showOutput('empty');
    showError(err.message || 'Something went wrong. Check your API key and try again.');
  } finally {
    setLoading(false);
  }
}

async function callGeminiAPI(apiKey, transcript) {
  const toneMap = {
    professional: 'Use formal, business-appropriate language.',
    concise:      'Be extremely brief. No fluff.',
    casual:       'Use friendly, conversational language.',
    detailed:     'Be thorough and comprehensive with context.',
  };

  const prompt = `You are an AI assistant that analyzes voice notes and meeting transcripts.

Analyze this transcript and return a JSON object with EXACTLY this structure:
{
  "tldr": "One clear sentence summarizing the note",
  "key_points": ["point 1", "point 2", "point 3"],
  "action_items": ["action 1", "action 2", "action 3"],
  "sentiment": "positive|neutral|negative",
  "topic": "Main topic in 2-4 words",
  "context": "2-3 sentence contextual summary of what was discussed",
  "duration_estimate": "e.g. 2 min note"
}

Rules:
- Extract 2-5 action items (things someone needs to DO)
- Extract 2-5 key points (important facts, decisions, or information)
- Sentiment must be exactly one of: positive, neutral, negative
- Tone: ${toneMap[state.currentTone]}
- Return ONLY valid JSON. No markdown, no backticks, no explanation.

Transcript:
"${transcript}"`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
      }),
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const clean = raw.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error('Could not parse Gemini response. Please try again.');
  }
}

function renderResult(r, transcript) {
  $('tldr-text').textContent = r.tldr || '—';

  const sb = $('sentiment-badge');
  const sentMap = { positive: '↑ Positive', neutral: '• Neutral', negative: '↓ Negative' };
  sb.textContent = sentMap[r.sentiment] || '• Neutral';
  sb.className = `meta-badge sentiment-badge ${r.sentiment || 'neutral'}`;

  $('topic-badge').textContent    = r.topic || '';
  $('duration-badge').textContent = r.duration_estimate || '';

  const words = transcript.split(/\s+/).filter(Boolean).length;
  $('transcript-display').textContent = transcript;
  $('word-count').textContent = `${words} words`;

  const keyList = $('key-list');
  keyList.innerHTML = '';
  (r.key_points || []).forEach(point => {
    const li = document.createElement('li');
    li.textContent = point;
    keyList.appendChild(li);
  });

  $('context-text').textContent = r.context || r.key_points?.[0] || '—';

  const actionList = $('action-list');
  actionList.innerHTML = '';
  (r.action_items || []).forEach((action, i) => {
    const item = document.createElement('div');
    item.className = 'action-item';
    item.innerHTML = `
      <div class="checkbox" id="chk-${i}" onclick="toggleCheck(${i})" role="checkbox" aria-checked="false" tabindex="0"></div>
      <div class="action-text" id="atxt-${i}">${escapeHtml(action)}</div>
    `;
    actionList.appendChild(item);
  });
  $('action-count').textContent = `${(r.action_items || []).length} items`;

  state.summaryText = `Summary: ${r.tldr}. Key points: ${(r.key_points || []).join('. ')}. Action items: ${(r.action_items || []).join('. ')}`;
}

function toggleCheck(i) {
  const chk  = $(`chk-${i}`);
  const text = $(`atxt-${i}`);
  const checked = chk.classList.toggle('checked');
  text.classList.toggle('done', checked);
  chk.setAttribute('aria-checked', checked);
}

function speakSummary() {
  if (!state.summaryText || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(state.summaryText);
  utt.rate = 0.95;
  window.speechSynthesis.speak(utt);
}

function copyAll() {
  if (!state.summaryText) return;
  navigator.clipboard.writeText(state.summaryText).then(() => {
    const btn = document.querySelector('.icon-btn');
    const orig = btn.innerHTML;
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
  });
}

function resetApp() {
  if (state.isRecording) stopRecording();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  Object.assign(state, { seconds:0, audioBlob:null, audioChunks:[], liveTranscript:'', recognizedText:'', summaryText:'' });
  $('timer').textContent = '0:00';
  $('timer').classList.remove('active');
  $('rec-label').textContent = 'tap to start recording';
  $('audio-preview').style.display = 'none';
  $('manual-text').value = '';
  $('output-actions').style.display = 'none';
  showOutput('empty');
  hideError();
}

function showOutput(mode) {
  $('empty-state').style.display   = mode === 'empty'   ? 'flex'  : 'none';
  $('loading-state').style.display = mode === 'loading' ? 'flex'  : 'none';
  $('result-state').style.display  = mode === 'result'  ? 'flex'  : 'none';
}

function setPipelineStep(step) {
  for (let i = 1; i <= 3; i++) {
    const el = $(`pip-${i}`);
    el.classList.remove('active', 'done');
    if (i < step) el.classList.add('done');
    if (i === step) el.classList.add('active');
  }
  const labels = ['Transcribing', 'Analyzing with Gemini', 'Extracting insights'];
  $('loading-text').textContent = labels[step - 1] + '...';
}

function setLoading(loading) {
  const btn = $('run-btn');
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<div class="spinner"></div> Analyzing...'
    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg> Analyze & Summarize';
}

function showError(msg) {
  const el = $('error-msg');
  el.textContent = msg;
  el.style.display = 'block';
}

function hideError() { $('error-msg').style.display = 'none'; }

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
