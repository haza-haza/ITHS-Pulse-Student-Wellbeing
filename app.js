// ITHS Pulse — Student Wellbeing App
// JavaScript for interactivity, data management, and UI logic

// ===== DATA STRUCTURES =====
let userData = {
  name: "Alex M.",
  grade: "Grade 11",
  checkins: [],
  messages: [],
  resources: []
};

// Mock teacher data
const teachers = [
  { id: 1, name: "Ms. Johnson", subject: "Math", email: "math@iths.se", avatar: "J", color: "#3b82f6" },
  { id: 2, name: "Mr. Smith", subject: "English", email: "english@iths.se", avatar: "S", color: "#ec4899" },
  { id: 3, name: "Dr. Lee", subject: "Science", email: "science@iths.se", avatar: "L", color: "#22c55e" },
  { id: 4, name: "Mrs. Brown", subject: "History", email: "history@iths.se", avatar: "B", color: "#f59e0b" },
  { id: 5, name: "Ms. Andersson", subject: "Swedish", email: "swedish@iths.se", avatar: "A", color: "#a78bfa" },
  { id: 6, name: "Coach Wilson", subject: "PE", email: "pe@iths.se", avatar: "W", color: "#f97316" }
];

// Mock resources
const mockResources = [
  { id: 1, title: "Algebra Basics Guide", subject: "Math", type: "📄 Notes", desc: "Step-by-step algebra fundamentals", uploader: "Ms. Johnson" },
  { id: 2, title: "Shakespeare Analysis Video", subject: "English", type: "🎬 Video", desc: "Understanding Romeo & Juliet themes", uploader: "Mr. Smith" },
  { id: 3, title: "Periodic Table Study Sheet", subject: "Science", type: "📄 Notes", desc: "Quick reference for elements", uploader: "Dr. Lee" },
  { id: 4, title: "World War II Timeline", subject: "History", type: "📝 Guide", desc: "Key events and dates", uploader: "Mrs. Brown" },
  { id: 5, title: "Swedish Verb Conjugations", subject: "Swedish", type: "📄 Notes", desc: "Present and past tense forms", uploader: "Ms. Andersson" },
  { id: 6, title: "Fitness Training Plans", subject: "PE", type: "📝 Guide", desc: "Workout routines for all levels", uploader: "Coach Wilson" }
];

// Message templates
const messageTemplates = {
  overwhelmed: "Hi, I've been feeling overwhelmed with recent assignments. Could you share extra resources or guidance?",
  resources: "Hello, I'm struggling with some concepts and would appreciate additional study materials.",
  deadline: "Hi, I'm finding it difficult to meet the upcoming deadline. Could we discuss an extension?",
  checkin: "Hello, just checking in to see how I'm doing in class and if there's anything I can improve."
};

// ===== UTILITY FUNCTIONS =====
function $(id) { return document.getElementById(id); }
function $$(selector) { return document.querySelectorAll(selector); }

// Load data from localStorage
function loadData() {
  const saved = localStorage.getItem('ithsPulseData');
  if (saved) {
    const parsed = JSON.parse(saved);
    userData = { ...userData, ...parsed };
  }
  // Merge mock resources (avoid duplicates)
  const userUploaded = userData.resources.filter(r => !mockResources.find(m => m.id === r.id));
  userData.resources = [...mockResources, ...userUploaded];
}

// Save data to localStorage
function saveData() {
  localStorage.setItem('ithsPulseData', JSON.stringify({
    checkins: userData.checkins,
    messages: userData.messages,
    resources: userData.resources.filter(r => !mockResources.find(m => m.id === r.id))
  }));
}

// Calculate burnout score (0-100)
function calculateBurnout(sleep, stress, hw, mood, history = []) {
  let score = 0;

  // Sleep factor (ideal 7-9h)
  if (sleep < 6) score += 30;
  else if (sleep < 7) score += 15;
  else if (sleep > 10) score += 10;

  // Stress factor (1-10)
  score += (stress - 1) * 5; // 0-45

  // Homework factor (0-10h)
  score += hw * 3; // 0-30

  // Mood factor (1-5, lower is worse)
  score += (6 - mood) * 8; // 0-40

  // Trend factor: increasing workload over last 3 days
  if (history.length >= 3) {
    const recent = history.slice(-3);
    const workloads = recent.map(d => d.hw);
    if (workloads[2] > workloads[0] + 1) score += 15;
  }

  return Math.min(100, Math.max(0, score));
}

// Get burnout level text + color
function getBurnoutLevel(score) {
  if (score < 30) return { level: "Low", color: "safe", desc: "You're doing great! Keep up the good habits." };
  if (score < 60) return { level: "Medium", color: "warn", desc: "Some stress detected. Consider taking a break or reaching out." };
  return { level: "High", color: "danger", desc: "High burnout risk. Please seek support from teachers or counselors." };
}

// Generate personalized suggestions
function generateSuggestions(score, inputs) {
  const suggestions = [];
  const level = getBurnoutLevel(score);

  if (level.level === "High") {
    suggestions.push({
      type: "urgent",
      icon: "🚨",
      text: "High burnout detected. Consider messaging a teacher or using anonymous help.",
      action: "switchView('messages')"
    });
  }

  if (inputs.sleep < 7) {
    suggestions.push({
      type: "tip",
      icon: "🌙",
      text: "Try to get more sleep tonight. Aim for 7-9 hours.",
      action: null
    });
  }

  if (inputs.stress > 7) {
    suggestions.push({
      type: "resource",
      icon: "🧘",
      text: "Check out stress management resources in the hub.",
      action: "switchView('resources')"
    });
  }

  if (inputs.hw > 5) {
    suggestions.push({
      type: "resource",
      icon: "📚",
      text: "Heavy homework load. Look for study guides in your subjects.",
      action: "switchView('resources')"
    });
  }

  // Subject-specific suggestions
  if (inputs.classes && inputs.classes.length > 0) {
    inputs.classes.forEach(subject => {
      const teacher = teachers.find(t => t.subject === subject);
      if (teacher) {
        suggestions.push({
          type: "contact",
          icon: "👩‍🏫",
          text: `Reach out to ${teacher.name} for ${subject} support.`,
          action: `selectTeacher(${teacher.id})`
        });
      }
    });
  }

  return suggestions;
}

// ===== UI FUNCTIONS =====

// BUG FIX: was missing '#' in getElementById call — used template literal but forgot the 'id-' prefix
function switchView(viewName) {
  // Update nav active state
  $$('.nav-item').forEach(item => item.classList.remove('active'));
  const navItem = document.querySelector(`[data-view="${viewName}"]`);
  if (navItem) navItem.classList.add('active');

  // Show/hide views — FIX: was $(`view-${viewName}`) missing the id prefix logic
  $$('.view').forEach(view => view.classList.remove('active'));
  const view = $(`view-${viewName}`);
  if (view) view.classList.add('active');

  // Scroll to top
  document.querySelector('.main-content').scrollTop = 0;

  // Special view logic
  if (viewName === 'dashboard') updateDashboard();
  if (viewName === 'resources') updateResources();
  if (viewName === 'messages') { updateMessages(); updateSentMessages(); }
  if (viewName === 'teachers') updateTeachers();
}

// Update dashboard with latest data
function updateDashboard() {
  const today = new Date().toLocaleDateString('en-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  $('header-date').textContent = today;

  const latest = userData.checkins[userData.checkins.length - 1];
  if (latest) {
    const burnout = calculateBurnout(latest.sleep, latest.stress, latest.hw, latest.mood, userData.checkins);
    const level = getBurnoutLevel(burnout);

    $('hero-score-val').textContent = burnout;
    $('hero-level-text').textContent = level.level;
    $('hero-desc').textContent = level.desc;

    // Color the score
    $('hero-score-val').style.color = `var(--${level.color})`;
    $('hero-level-text').style.color = `var(--${level.color})`;

    // Update ring color
    $('ring-fill').style.stroke = `var(--${level.color})`;
    updateRadial('ring-fill', burnout);
    $('radial-pct').textContent = `${burnout}%`;

    // Update stats
    $('stat-sleep').textContent = latest.sleep + 'h';
    $('stat-stress').textContent = latest.stress + '/10';
    $('stat-hw').textContent = latest.hw + 'h';
    $('stat-mood').textContent = ['😫','😔','😐','🙂','😄'][latest.mood - 1];

    updateStatBars(latest);
    updateSuggestions(burnout, latest);
    updateChart();
  }
}

// Update radial progress ring
function updateRadial(ringId, pct) {
  const circumference = 502; // 2 * π * 80
  const offset = circumference - (pct / 100) * circumference;
  $(ringId).style.strokeDashoffset = offset;
}

// BUG FIX: stat bars are vertical — must set height not width
function updateStatBars(data) {
  const sleepPct = (data.sleep / 12) * 100;
  const stressPct = (data.stress / 10) * 100;
  const hwPct = (data.hw / 10) * 100;
  const moodPct = (data.mood / 5) * 100;

  $('bar-sleep').style.height = `${sleepPct}%`;
  $('bar-stress').style.height = `${stressPct}%`;
  $('bar-hw').style.height = `${hwPct}%`;
  $('bar-mood').style.height = `${moodPct}%`;
}

// Update suggestions in dashboard
function updateSuggestions(score, inputs) {
  const suggestions = generateSuggestions(score, inputs);
  const container = $('alerts-list');

  if (suggestions.length === 0) {
    container.innerHTML = '<div class="empty-state">No suggestions at this time. Keep up the good work! 🌟</div>';
    return;
  }

  container.innerHTML = suggestions.map(s => `
    <div class="alert-item ${s.type}" ${s.action ? `onclick="${s.action}"` : ''} style="${s.action ? 'cursor:pointer' : ''}">
      <span class="alert-ico">${s.icon}</span>
      <span class="alert-text">${s.text}</span>
      ${s.action ? '<span style="margin-left:auto;color:var(--text-muted)">→</span>' : ''}
    </div>
  `).join('');
}

// Update 7-day trend chart (improved with gradient fill + labels)
function updateChart() {
  const canvas = $('trendChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const recent = userData.checkins.slice(-7);
  if (recent.length < 2) {
    // Draw placeholder
    ctx.fillStyle = 'rgba(90,112,128,0.3)';
    ctx.font = '14px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Complete more check-ins to see your trend', width / 2, height / 2);
    return;
  }

  const scores = recent.map(d => calculateBurnout(d.sleep, d.stress, d.hw, d.mood));

  const padX = 30, padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const getX = i => padX + (i / (scores.length - 1)) * chartW;
  const getY = s => padY + chartH - (s / 100) * chartH;

  // Gradient fill under line
  const grad = ctx.createLinearGradient(0, padY, 0, height);
  grad.addColorStop(0, 'rgba(0,210,190,0.25)');
  grad.addColorStop(1, 'rgba(0,210,190,0)');

  ctx.beginPath();
  scores.forEach((score, i) => {
    const x = getX(i), y = getY(score);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(getX(scores.length - 1), height);
  ctx.lineTo(getX(0), height);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.strokeStyle = '#00d2be';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  scores.forEach((score, i) => {
    const x = getX(i), y = getY(score);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Points + labels
  scores.forEach((score, i) => {
    const x = getX(i);
    const y = getY(score);
    const color = score < 30 ? '#22c55e' : score < 60 ? '#f59e0b' : '#ef4444';

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Score label
    ctx.fillStyle = 'rgba(240,244,248,0.8)';
    ctx.font = 'bold 11px Syne, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(score, x, y - 10);

    // Day label at bottom
    const date = new Date(recent[i].date);
    const dayLabel = date.toLocaleDateString('en-SE', { weekday: 'short' });
    ctx.fillStyle = 'rgba(90,112,128,0.8)';
    ctx.font = '10px DM Sans, sans-serif';
    ctx.fillText(dayLabel, x, height - 4);
  });
}

// ===== CHECK-IN FUNCTIONS =====

function updateSlider(sliderId, valId, suffix = '') {
  const slider = $(sliderId);
  const val = $(valId);
  val.textContent = slider.value + suffix;
  updatePreview();
}

// BUG FIX: was adding class 'active' but CSS selector was '.stress-dot.selected'
function selectStress(level) {
  $$('.stress-dot').forEach(dot => dot.classList.remove('selected'));
  const dot = document.querySelector(`#stress-grid [data-val="${level}"]`);
  if (dot) dot.classList.add('selected');
  updatePreview();
}

// BUG FIX: was adding class 'active' but CSS uses '.mood-btn.selected'
function selectMood(mood) {
  $$('.mood-btn').forEach(btn => btn.classList.remove('selected'));
  const btn = document.querySelector(`#mood-grid [data-val="${mood}"]`);
  if (btn) btn.classList.add('selected');
  const labels = ['Terrible','Bad','Meh','Okay','Great'];
  $('mood-label').textContent = labels[mood - 1] || '';
  updatePreview();
}

// BUG FIX: was using $('[data-class="X"]') which is ambiguous — scope to #class-tags
// BUG FIX: was toggling class 'active' but CSS uses '.class-tag.selected'
function toggleClass(subject) {
  const tag = document.querySelector(`#class-tags [data-class="${subject}"]`);
  if (tag) tag.classList.toggle('selected');
}

// Update live preview ring
function updatePreview() {
  const sleep = parseFloat($('inp-sleep').value);
  const stress = parseInt(document.querySelector('#stress-grid .stress-dot.selected')?.dataset.val || 5);
  const hw = parseFloat($('inp-hw').value);
  const mood = parseInt(document.querySelector('#mood-grid .mood-btn.selected')?.dataset.val || 3);

  const score = calculateBurnout(sleep, stress, hw, mood);
  const level = getBurnoutLevel(score);

  $('preview-ring').style.stroke = `var(--${level.color})`;
  updateRadial('preview-ring', score);
  $('preview-pct').textContent = `${score}%`;
  $('preview-level').textContent = level.level;
  $('preview-level').style.color = `var(--${level.color})`;

  // Factor rows
  const factors = [
    { id: 'f-sleep', label: 'Sleep', display: `${sleep}h`, good: sleep >= 7 && sleep <= 10 },
    { id: 'f-stress', label: 'Stress', display: `${stress}/10`, good: stress <= 5 },
    { id: 'f-hw', label: 'Homework', display: `${hw}h`, good: hw <= 4 },
    { id: 'f-mood', label: 'Mood', display: ['Terrible','Bad','Meh','Okay','Great'][mood-1] || mood, good: mood >= 4 }
  ];

  factors.forEach(f => {
    const el = $(f.id);
    const cls = f.good ? 'good' : 'bad';
    el.innerHTML = `<span class="factor-dot ${cls}"></span>${f.label}: ${f.display}`;
  });
}

// Submit check-in
function submitCheckin() {
  const sleep = parseFloat($('inp-sleep').value);
  const stress = parseInt(document.querySelector('#stress-grid .stress-dot.selected')?.dataset.val || 5);
  const hw = parseFloat($('inp-hw').value);
  const mood = parseInt(document.querySelector('#mood-grid .mood-btn.selected')?.dataset.val || 3);
  const classes = Array.from($$('#class-tags .class-tag.selected')).map(tag => tag.dataset.class);

  const checkin = {
    date: new Date().toISOString(),
    sleep, stress, hw, mood, classes
  };

  userData.checkins.push(checkin);
  saveData();

  const score = calculateBurnout(sleep, stress, hw, mood, userData.checkins);
  const level = getBurnoutLevel(score);

  $('modal-ring').style.stroke = `var(--${level.color})`;
  updateRadial('modal-ring', score);
  $('modal-pct').textContent = `${score}%`;
  $('modal-title').textContent = `Your Burnout Score: ${score}`;
  $('modal-level').textContent = level.level;
  $('modal-level').style.color = `var(--${level.color})`;
  $('modal-message').textContent = level.desc;

  const actions = $('modal-actions');
  if (level.level === 'High') {
    actions.innerHTML = `
      <button class="btn-secondary" onclick="switchView('messages'); closeModal('modal-result')">Message Teacher</button>
      <button class="btn-secondary" onclick="openAnonHelp(); closeModal('modal-result')">Anonymous Help</button>
    `;
  } else if (level.level === 'Medium') {
    actions.innerHTML = `
      <button class="btn-secondary" onclick="switchView('resources'); closeModal('modal-result')">Browse Resources</button>
    `;
  } else {
    actions.innerHTML = '<p style="color:var(--safe);font-weight:600">🌟 Keep up the great work!</p>';
  }

  openModal('modal-result');
}

// ===== RESOURCES FUNCTIONS =====

function updateResources() {
  const grid = $('resources-grid');
  const activeFilter = document.querySelector('.filter-btn.active');
  const filter = activeFilter?.dataset.filter || 'all';

  const filtered = userData.resources.filter(r =>
    filter === 'all' || r.subject === filter
  );

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state">No resources found for this subject.</div>';
    return;
  }

  // BUG FIX: was using wrong CSS class names (resource-header etc.) — corrected to rc-* per CSS
  grid.innerHTML = filtered.map(r => `
    <div class="resource-card ${r.subject}">
      <div class="rc-type">${r.type}</div>
      <div class="rc-subject">${r.subject}</div>
      <div class="rc-title">${r.title}</div>
      <p class="rc-desc">${r.desc}</p>
      <div class="rc-meta">
        <span class="rc-teacher">by ${r.uploader}</span>
        <span class="rc-chip">View</span>
      </div>
    </div>
  `).join('');
}

function filterResources(filter) {
  $$('.filter-btn').forEach(btn => btn.classList.remove('active'));
  const btn = document.querySelector(`[data-filter="${filter}"]`);
  if (btn) btn.classList.add('active');
  updateResources();
}

function openUploadModal() {
  openModal('modal-upload');
}

function submitUpload() {
  const title = $('up-title').value.trim();
  const subject = $('up-subject').value;
  const type = $('up-type').value;
  const desc = $('up-desc').value.trim();

  if (!title || !desc) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  const resource = {
    id: Date.now(),
    title, subject, type, desc,
    uploader: userData.name
  };

  userData.resources.push(resource);
  saveData();

  $('up-title').value = '';
  $('up-desc').value = '';
  closeModal('modal-upload');
  updateResources();
  showToast('Resource uploaded successfully! 🎉');
}

// ===== MESSAGES FUNCTIONS =====

function updateMessages() {
  const list = $('teacher-list-items');
  list.innerHTML = teachers.map(t => `
    <div class="tl-item" id="tl-${t.id}" onclick="selectTeacher(${t.id})">
      <div class="tl-avatar" style="background:${t.color}">${t.avatar}</div>
      <div>
        <div class="tl-name">${t.name}</div>
        <div class="tl-subject">${t.subject}</div>
      </div>
    </div>
  `).join('');
}

function selectTeacher(id) {
  const teacher = teachers.find(t => t.id === id);
  if (!teacher) return;

  $('compose-to').textContent = `To: ${teacher.name} (${teacher.subject})`;
  $('compose-to').dataset.teacherId = id;

  // Highlight selected teacher in list
  $$('.tl-item').forEach(el => el.classList.remove('selected'));
  const item = $(`tl-${id}`);
  if (item) item.classList.add('selected');

  // Navigate to messages view if not already there
  const msgView = $('view-messages');
  if (!msgView.classList.contains('active')) {
    switchView('messages');
  }
}

function toggleAnon() {
  const toggle = $('anon-toggle');
  const note = $('anon-note');
  const isAnon = toggle.classList.toggle('active');
  note.style.display = isAnon ? 'block' : 'none';
}

function useTemplate(template) {
  $('compose-text').value = messageTemplates[template];
  $('compose-text').focus();
}

function sendMessage() {
  const teacherId = $('compose-to').dataset.teacherId;
  const text = $('compose-text').value.trim();
  const isAnon = $('anon-toggle').classList.contains('active');

  if (!teacherId) {
    showToast('Please select a teacher first', 'error');
    return;
  }
  if (!text) {
    showToast('Please write a message', 'error');
    return;
  }

  const message = {
    id: Date.now(),
    teacherId: parseInt(teacherId),
    text, isAnon,
    date: new Date().toISOString()
  };

  userData.messages.push(message);
  saveData();

  $('compose-text').value = '';
  $('compose-to').textContent = 'Select a teacher →';
  delete $('compose-to').dataset.teacherId;
  $('anon-toggle').classList.remove('active');
  $('anon-note').style.display = 'none';

  // Deselect teacher
  $$('.tl-item').forEach(el => el.classList.remove('selected'));

  showToast(isAnon ? '🕵 Anonymous message sent!' : '✉ Message sent!');
  updateSentMessages();
}

// NEW FEATURE: render sent messages history
function updateSentMessages() {
  const list = $('sent-messages-list');
  const badge = $('sent-count-badge');
  if (!list) return;

  const msgs = [...userData.messages].reverse(); // most recent first
  if (badge) badge.textContent = msgs.length;

  if (msgs.length === 0) {
    list.innerHTML = '<div class="empty-state">No messages sent yet.</div>';
    return;
  }

  list.innerHTML = msgs.map(m => {
    const teacher = teachers.find(t => t.id === m.teacherId);
    const date = new Date(m.date).toLocaleDateString('en-SE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="sent-msg">
        <div class="sent-msg-header">
          <span class="sent-msg-to" style="color:${teacher?.color || 'var(--accent)'}">
            ${m.isAnon ? '🕵 Anonymous → ' : ''}${teacher?.name || 'Unknown'}
          </span>
          <span class="sent-msg-date">${date}</span>
        </div>
        <div class="sent-msg-body">${m.text}</div>
      </div>
    `;
  }).join('');
}

// ===== TEACHERS FUNCTIONS =====

// BUG FIX: was using wrong CSS class names (teacher-avatar-lg etc.) — corrected to tc-* per CSS
function updateTeachers() {
  const grid = $('teachers-grid');
  grid.innerHTML = teachers.map(t => `
    <div class="teacher-card" onclick="selectTeacher(${t.id}); switchView('messages')">
      <div class="tc-avatar" style="background:${t.color}">${t.avatar}</div>
      <div class="tc-name">${t.name}</div>
      <div class="tc-subject">${t.subject}</div>
      <div class="tc-tags">
        <span class="tc-tag">${t.subject}</span>
        <span class="tc-tag">${t.email}</span>
      </div>
      <button class="tc-btn">Contact →</button>
    </div>
  `).join('');
}

// ===== MODAL FUNCTIONS =====

function openModal(id) {
  $(id).classList.add('open');
}

function closeModal(id) {
  $(id).classList.remove('open');
}

function openAnonHelp() {
  openModal('modal-anon');
}

function submitAnon() {
  const text = $('anon-text').value.trim();
  if (!text) {
    showToast("Please describe what you're going through", 'error');
    return;
  }

  showToast('🕵 Anonymous help request submitted. A counselor will follow up.');
  $('anon-text').value = '';
  closeModal('modal-anon');
}

// ===== TOAST NOTIFICATIONS =====

function showToast(message, type = 'success') {
  const toast = $('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.style.display = 'block';

  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.style.display = 'none'; }, 400);
  }, 3000);
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', function () {
  loadData();

  // Nav clicks
  $$('.nav-item').forEach(item => {
    item.addEventListener('click', () => switchView(item.dataset.view));
  });

  // Slider listeners
  $('inp-sleep').addEventListener('input', () => updateSlider('inp-sleep', 'val-sleep', 'h'));
  $('inp-hw').addEventListener('input', () => updateSlider('inp-hw', 'val-hw', 'h'));

  // Stress dots
  $$('.stress-dot').forEach(dot => {
    dot.addEventListener('click', () => selectStress(parseInt(dot.dataset.val)));
  });

  // Mood buttons
  $$('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => selectMood(parseInt(btn.dataset.val)));
  });

  // Class tags
  $$('.class-tag').forEach(tag => {
    tag.addEventListener('click', () => toggleClass(tag.dataset.class));
  });

  // Filter buttons (resources)
  $$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => filterResources(btn.dataset.filter));
  });

  // Close modals on overlay click
  $$('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Initial render
  updateDashboard();
  updateResources();
  updateMessages();
  updateSentMessages();
  updateTeachers();

  // Default selections
  selectStress(5);
  selectMood(3);

  // Kick off preview
  updatePreview();
});
