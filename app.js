// ITHS Pulse — Student Wellbeing App
// JavaScript for interactivity, data management, and UI logic

// ===== DATA STRUCTURES =====
let userData = {
  name: "ITHS student",
  grade: "Grade 11",
  checkins: [],
  messages: [],
  resources: []
};

// Mock teacher data
const teachers = [
  { id: 1, name: "Mr. Chen", subject: "Math", email: "math@iths.se", avatar: "C", color: "#3b82f6" },
  { id: 2, name: "Ms. Robinson", subject: "English", email: "english@iths.se", avatar: "R", color: "#ec4899" },
  { id: 3, name: "Dr. Turner", subject: "Science", email: "science@iths.se", avatar: "T", color: "#22c55e" },
  { id: 4, name: "Ms. Estrada", subject: "History", email: "history@iths.se", avatar: "E", color: "#f59e0b" },
  { id: 5, name: "Ms. Harvey", subject: "Spanish", email: "spanish@iths.se", avatar: "H", color: "#a78bfa" },
  { id: 6, name: "Mr. Serrano", subject: "PE", email: "pe@iths.se", avatar: "S", color: "#f97316" },
  { id: 7, name: "Mr. Rivera", subject: "CTE", email: "cte@iths.se", avatar: "R", color: "#06b6d4" }
];

// Mock resources
const mockResources = [
  { id: 1, title: "Algebra Basics Guide", subject: "Math", type: "📄 Notes", desc: "Step-by-step algebra fundamentals", uploader: "Mr. Chen" },
  { id: 2, title: "Shakespeare Analysis Video", subject: "English", type: "🎬 Video", desc: "Understanding Romeo & Juliet themes", uploader: "Ms. Robinson" },
  { id: 3, title: "Periodic Table Study Sheet", subject: "Science", type: "📄 Notes", desc: "Quick reference for elements", uploader: "Dr. Turner" },
  { id: 4, title: "World War II Timeline", subject: "History", type: "📝 Guide", desc: "Key events and dates", uploader: "Ms. Estrada" },
  { id: 5, title: "Spanish Verb Conjugations", subject: "Spanish", type: "📄 Notes", desc: "Present and past tense forms", uploader: "Ms. Harvey" },
  { id: 6, title: "Fitness Training Plans", subject: "PE", type: "📝 Guide", desc: "Workout routines for all levels", uploader: "Mr. Serrano" },
  { id: 7, title: "CTE Career Pathways Guide", subject: "CTE", type: "📝 Guide", desc: "Exploring career and technical education options", uploader: "Mr. Rivera" }
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

  // Load chat history
  const savedChat = localStorage.getItem('ithspulse_chat_history');
  if (savedChat) {
    chatHistory = JSON.parse(savedChat);
  }
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

  // Update achievements display
  updateAchievementsDisplay();
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

  // Check for achievements after check-in
  checkAchievements();

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
        <span class="rc-chip" onclick="viewResource(${r.id})" style="cursor: pointer;">View</span>
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

// Resource content database
const resourceContent = {
  1: {
    title: "Algebra Basics Guide",
    fullContent: `
<strong>Key Concepts:</strong>
• Variables and Expressions
• Solving Linear Equations
• Working with Exponents and Roots
• Polynomials and Factoring
• Quadratic Equations

<strong>Learning Objectives:</strong>
After studying this guide, you will be able to:
1. Identify and simplify algebraic expressions
2. Solve equations with one and multiple variables
3. Factor complex expressions
4. Solve quadratic equations using multiple methods

<strong>Practice Problems:</strong>
• Beginner: Solve 2x + 5 = 13
• Intermediate: Factor x² + 5x + 6
• Advanced: Solve x² - 4x - 12 = 0

<strong>Tips for Success:</strong>
- Always show your work step by step
- Check your answers by substituting back
- Use a graphing tool to visualize equations
- Practice regularly with different problem types
    `
  },
  2: {
    title: "Shakespeare Analysis Video",
    fullContent: `
<strong>Video Overview:</strong>
Duration: 45 minutes
Topics Covered: Character Analysis, Themes, Literary Devices

<strong>Key Scenes Analyzed:</strong>
• Act 1, Scene 5 - The Balcony Scene
• Act 3, Scene 1 - The Fight Scene
• Act 5, Scene 3 - The Tragic Ending

<strong>Character Development:</strong>
• Romeo's transformation from lovesick to devoted
• Juliet's journey from obedient daughter to independent lover
• The Nurse as comic relief and confidante
• Friar Lawrence's role as facilitator

<strong>Themes Explored:</strong>
- Love vs. Fate
- Family Conflict and Revenge
- Youth vs. Age
- Light and Darkness as Symbols

<strong>Important Quotes to Remember:</strong>
- "O Romeo, Romeo! Wherefore art thou Romeo?"
- "What's in a name? That which we call a rose by any other name would smell as sweet."
- "Parting is such sweet sorrow"

<strong>Study Tips:</strong>
- Take notes while watching
- Pause and reflect on important scenes
- Compare themes to other Shakespeare works
    `
  },
  3: {
    title: "Periodic Table Study Sheet",
    fullContent: `
<strong>Periodic Table Basics:</strong>
• Organized by atomic number
• Groups (columns) show similar properties
• Periods (rows) show increasing atomic number

<strong>Element Categories:</strong>
• Metals (left side) - Shiny, conductive, malleable
• Nonmetals (right side) - Dull, poor conductors
• Metalloids (staircase) - Properties between metals and nonmetals
• Noble Gases (Group 18) - Highly stable, rarely reactive

<strong>Key Elements to Know:</strong>
• H (Hydrogen) - Most abundant element
• O (Oxygen) - Essential for life
• C (Carbon) - Basis of organic chemistry
• N (Nitrogen) - Component of proteins
• Fe (Iron) - Important for blood oxygen transport
• Au (Gold) - Precious metal, highly valued

<strong>Electron Configuration Patterns:</strong>
- Valence electrons determine reactivity
- Elements in same group have similar valence electrons
- First ionization energy increases across period

<strong>Memory Aid (Mnemonic):</strong>
"Na, Na, K K, Ca Ca" - Remember alkali metals
"F, Cl, Br, I" - Remember halogens

<strong>Practice Exercises:</strong>
- Identify element by atomic number
- Predict reactivity based on position
- Determine electron configuration
    `
  },
  4: {
    title: "World War II Timeline",
    fullContent: `
<strong>Major Events and Dates:</strong>

1939: 
• September 1 - Germany invades Poland
• September 3 - Britain and France declare war

1940:
• May-June - Fall of France
• July-September - Battle of Britain
• September 27 - Tripartite Pact signed

1941:
• June 22 - Operation Barbarossa begins
• December 7 - Pearl Harbor attacked
• December 11 - US enters the war

1942:
• June - Battle of Midway (turning point)
• August-February - Battle of Stalingrad

1944:
• June 6 - D-Day Normandy invasion
• August - Liberation of Paris

1945:
• January - Liberation of concentration camps
• May 7 - Germany surrenders
• August 6 & 9 - Atomic bombs on Japan
• August 15 - Japan surrenders

<strong>Key Figures:</strong>
• Adolf Hitler - German dictator
• Winston Churchill - British Prime Minister
• Franklin D. Roosevelt - US President
• Joseph Stalin - Soviet leader
• Benito Mussolini - Italian fascist leader

<strong>Consequences:</strong>
- Estimated 70-85 million deaths
- Creation of United Nations
- Beginning of Cold War
- Holocaust and war crimes trials
    `
  },
  5: {
    title: "Spanish Verb Conjugations",
    fullContent: `
<strong>Present Tense Regular Verbs:</strong>

HABLAR (to speak):
• Yo hablo - I speak
• Tú hablas - You speak
• Él/Ella habla - He/She speaks
• Nosotros hablamos - We speak
• Vosotros habláis - You all speak
• Ellos/Ellas hablan - They speak

COMER (to eat):
• Yo como - I eat
• Tú comes - You eat
• Él/Ella come - He/She eats
• Nosotros comemos - We eat
• Vosotros coméis - You all eat
• Ellos/Ellas comen - They eat

<strong>Common Irregular Verbs:</strong>
• SER (to be - permanent)
• ESTAR (to be - location/condition)
• TENER (to have)
• HACER (to do/make)
• IR (to go)

<strong>Past Tense (Pretérito):</strong>
Used for completed actions
• Hablar: hablé, hablaste, habló, hablamos...
• Comer: comí, comiste, comió, comimos...

<strong>Imperfect Tense:</strong>
Used for ongoing/habitual past actions
• Hablar: hablaba, hablabas, hablaba...
• Comer: comía, comías, comía...

<strong>Practice Conjugation:</strong>
- Regular verbs: -ar, -er, -ir endings
- Irregular verbs: memorize common patterns
- Practice with sentences, not just lists
    `
  },
  6: {
    title: "Fitness Training Plans",
    fullContent: `
<strong>Beginner Fitness Plan (3 days/week):</strong>

Day 1 - Upper Body:
• 5 min warm-up
• 3x10 Push-ups
• 3x10 Dumbbell rows
• 3x10 Shoulder press
• 5 min cool-down

Day 2 - Lower Body:
• 5 min warm-up
• 3x15 Squats
• 3x15 Lunges (each leg)
• 3x15 Calf raises
• 5 min cool-down

Day 3 - Cardio + Core:
• 20 min jogging/cycling
• 3x15 Crunches
• 3x30 sec Plank
• Stretching

<strong>Intermediate Plan (4-5 days/week):</strong>
• Combine upper/lower splits
• Increase weight and reps
• Add variety in exercises
• Rest 48 hours between muscle groups

<strong>Nutrition Tips:</strong>
• Protein intake: 0.8-1g per lb of body weight
• Carbs for energy: brown rice, oats
• Healthy fats: avocado, nuts, olive oil
• Hydration: 8+ glasses of water daily

<strong>Recovery:</strong>
• 7-9 hours of sleep
• Foam rolling for soreness
• Active rest days (light walking)
• Stress management

<strong>Progress Tracking:</strong>
- Keep a training log
- Measure performance improvements
- Take photos for visual progress
- Adjust plan every 4-6 weeks
    `
  },
  7: {
    title: "CTE Career Pathways Guide",
    fullContent: `
<strong>Career and Technical Education Overview:</strong>
CTE programs prepare students for high-skill, high-wage, in-demand careers

<strong>Main Career Pathways:</strong>

1. Healthcare & Life Sciences
   • Nursing, Physical Therapy, Medical Technology
   • Job Outlook: Excellent, Growing demand
   • Typical Salary: $50,000-$80,000+

2. Information Technology
   • Network Administration, Cybersecurity, Web Development
   • Job Outlook: High demand, Rapid growth
   • Typical Salary: $60,000-$100,000+

3. Construction & Trades
   • Carpentry, Electrical, Plumbing, HVAC
   • Job Outlook: Strong demand, Good wages
   • Typical Salary: $45,000-$70,000+

4. Manufacturing & Engineering
   • CNC Operations, Welding, Mechanical Engineering
   • Job Outlook: Stable with modernization
   • Typical Salary: $40,000-$75,000+

5. Hospitality & Tourism
   • Hotel Management, Culinary Arts, Event Planning
   • Job Outlook: Seasonal but growing
   • Typical Salary: $30,000-$60,000+

<strong>Benefits of CTE:</strong>
✓ Hands-on training
✓ Industry certifications
✓ Networking opportunities
✓ Direct pathway to employment
✓ Alternative to 4-year college

<strong>Next Steps:</strong>
1. Explore different pathways
2. Talk to CTE teachers and professionals
3. Visit job shadowing opportunities
4. Plan your career timeline
    `
  }
};

function viewResource(resourceId) {
  const resource = userData.resources.find(r => r.id === resourceId);
  if (!resource) return;

  // Track viewed resources for achievements
  const viewedResources = JSON.parse(localStorage.getItem('ithspulse_viewed_resources') || '[]');
  if (!viewedResources.includes(resourceId)) {
    viewedResources.push(resourceId);
    localStorage.setItem('ithspulse_viewed_resources', JSON.stringify(viewedResources));
    checkAchievements(); // Check if this unlocks any achievements
  }

  const content = resourceContent[resourceId] || { title: resource.title, fullContent: "Content coming soon." };

  $('resource-modal-title').textContent = content.title;
  $('resource-modal-type').textContent = resource.type;
  $('resource-modal-subject').textContent = `By ${resource.uploader} • ${resource.subject}`;
  $('resource-modal-content').innerHTML = content.fullContent;
  $('resource-modal-teacher').textContent = `From ${resource.uploader}`;

  openModal('modal-resource-view');
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

// ===== AI CHATBOT FUNCTIONS =====

let chatHistory = []; // stores { role, content } pairs for multi-turn conversation
let isChatbotOpen = false;

function openChatbot() {
  const panel = $('chatbot-panel');
  const fab = $('chatbot-fab');
  panel.classList.add('open');
  fab.classList.add('open');
  isChatbotOpen = true;

  // Initialize chatbot with welcome message if it's the first time
  if (chatHistory.length === 0) {
    initializeChatbot();
  }

  $('chatbot-input').focus();
}

function initializeChatbot() {
  // Add welcome message
  setTimeout(() => {
    appendChatMessage('ai', "👋 Hi! I'm Pulse AI Coach, your personal wellbeing assistant. I'm here to help you navigate the challenges of student life with practical advice on stress management, study strategies, sleep, and emotional wellbeing.\n\nHow are you feeling today?");

    // Add quick suggestion buttons
    setTimeout(() => {
      addQuickSuggestions();
    }, 1000);
  }, 500);
}

function addQuickSuggestions() {
  const container = $('chatbot-messages');
  const suggestionsDiv = document.createElement('div');
  suggestionsDiv.className = 'chat-suggestions';

  const suggestions = [
    "I'm feeling stressed about exams",
    "I can't sleep well",
    "Need study tips",
    "Feeling overwhelmed with homework"
  ];

  suggestionsDiv.innerHTML = `
    <div style="margin: 12px 0; font-size: 0.85rem; color: var(--text-muted);">Quick topics:</div>
    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
      ${suggestions.map(suggestion => `
        <button class="suggestion-btn" onclick="sendSuggestion(this)">${suggestion}</button>
      `).join('')}
    </div>
  `;

  container.appendChild(suggestionsDiv);
  container.scrollTop = container.scrollHeight;
}

function closeChatbot() {
  const panel = $('chatbot-panel');
  const fab = $('chatbot-fab');
  panel.classList.remove('open');
  fab.classList.remove('open');
  isChatbotOpen = false;
}

function clearChat() {
  chatHistory = [];
  const container = $('chatbot-messages');
  container.innerHTML = '';
  initializeChatbot();
}

function sendSuggestion(btn) {
  const text = btn.textContent.trim();
  // Remove the suggestions row so they don't clutter the chat
  const suggestionsRow = btn.closest('.chat-suggestions');
  if (suggestionsRow) suggestionsRow.remove();
  sendChatMessage(text);
}

function appendChatMessage(role, text) {
  const container = $('chatbot-messages');
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = text;

  div.appendChild(bubble);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

function appendTypingIndicator() {
  const container = $('chatbot-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg ai';
  div.id = 'typing-indicator';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble typing-bubble';
  bubble.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';

  div.appendChild(bubble);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = $('typing-indicator');
  if (indicator) indicator.remove();
}

function generateAIResponse(userMessage) {
  const message = userMessage.toLowerCase();
  const latest = userData.checkins[userData.checkins.length - 1];

  // Get personalized context
  let context = '';
  if (latest) {
    const score = calculateBurnout(latest.sleep, latest.stress, latest.hw, latest.mood, userData.checkins);
    const level = getBurnoutLevel(score);
    context = `Your latest burnout score is ${score}% (${level.level} risk). `;
  }

  // Stress and anxiety responses
  if (message.includes('stress') || message.includes('anxious') || message.includes('worried') || message.includes('overwhelmed')) {
    const responses = [
      `${context}I understand feeling stressed is really tough. Try this quick breathing exercise: inhale for 4 counts, hold for 4, exhale for 6. This activates your parasympathetic nervous system and can help calm your mind. Have you tried taking short breaks between study sessions?`,
      `Stress is your body's way of signaling you need a break. ${context}Consider the Pomodoro technique: 25 minutes focused work, then 5 minutes of something enjoyable. What subjects are causing you the most stress right now?`,
      `You're not alone in feeling this way. ${context}Sometimes just acknowledging the stress helps. Try grounding yourself: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This can help bring you back to the present moment.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Sleep responses
  if (message.includes('sleep') || message.includes('tired') || message.includes('exhausted') || message.includes('insomnia')) {
    const responses = [
      `${context}Sleep is crucial for learning and wellbeing. Try creating a "sleep sanctuary" - keep your room cool, dark, and quiet. Avoid screens 1 hour before bed as blue light interferes with melatonin production.`,
      `Quality sleep matters more than quantity sometimes. ${context}Establish a consistent bedtime routine: dim lights, read something light, avoid heavy meals 2 hours before bed. Your brain consolidates learning during deep sleep stages.`,
      `If you're struggling with sleep, that's okay - it's common for students. ${context}Try progressive muscle relaxation: tense and release each muscle group from your toes to your head. This can signal to your body that it's time to rest.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Study and homework responses
  if (message.includes('study') || message.includes('homework') || message.includes('exam') || message.includes('test') || message.includes('learn')) {
    const responses = [
      `Effective studying is about quality over quantity. ${context}Try active recall: test yourself on the material rather than just re-reading. Space out your study sessions over days rather than cramming. What subject are you working on?`,
      `Study strategies can make a big difference. ${context}Consider the Feynman technique: explain the concept as if teaching it to someone else. If you can't explain it simply, you need to study more. Have you tried study groups with classmates?`,
      `Learning is a skill you can improve. ${context}Mix up your study methods: diagrams, flashcards, teaching others, or practical applications. Take regular breaks to let your brain process the information.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Mood and emotional responses
  if (message.includes('sad') || message.includes('depressed') || message.includes('mood') || message.includes('happy') || message.includes('feeling')) {
    const responses = [
      `Emotions are valid and important to acknowledge. ${context}Try keeping a gratitude journal - write down 3 things you're thankful for each day. This can help shift perspective during tough times. How are you feeling right now?`,
      `Your wellbeing matters. ${context}Small acts of self-care add up: a walk outside, listening to favorite music, connecting with friends. Remember that it's okay to not be okay sometimes. What usually helps lift your mood?`,
      `Mood fluctuations are normal, especially during busy school periods. ${context}Physical activity releases endorphins that naturally boost mood. Even a 10-minute walk can make a difference. Have you noticed any patterns in your mood?`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Motivation responses
  if (message.includes('motivation') || message.includes('lazy') || message.includes('procrastinat') || message.includes('focus')) {
    const responses = [
      `Motivation follows action, not the other way around. ${context}Start with just 5 minutes of the task you want to do. Often, getting started creates the momentum you need. What's one small step you could take right now?`,
      `Procrastination is common but manageable. ${context}Break tasks into micro-steps and use implementation intentions: "When X happens, I will do Y." For example, "When I finish eating, I will start my homework."`,
      `Focus can be trained like a muscle. ${context}Try the "two-minute rule": if something takes less than 2 minutes, do it immediately. This builds momentum and reduces decision fatigue. What helps you concentrate best?`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Social and relationship responses
  if (message.includes('friend') || message.includes('social') || message.includes('lonely') || message.includes('relationship')) {
    const responses = [
      `Social connections are vital for wellbeing. ${context}Even small interactions matter - a quick chat with a classmate or helping someone. Quality over quantity in friendships. Have you reached out to anyone recently?`,
      `Feeling connected matters. ${context}Try joining a club or study group that interests you. Shared experiences create bonds. Remember that it's okay to be selective about who you spend time with.`,
      `School can be socially challenging. ${context}Focus on being kind to yourself and others. Sometimes just being present and listening can strengthen relationships. What social activities do you enjoy?`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Burnout and self-care responses
  if (message.includes('burnout') || message.includes('burnt out') || message.includes('self-care') || message.includes('balance')) {
    const responses = [
      `${context}Burnout is serious and your body telling you to rest. Prioritize recovery: adequate sleep, nourishing food, movement you enjoy, and activities that recharge you. What recharges your batteries?`,
      `Work-life balance is crucial for students too. ${context}Set boundaries around study time and protect your personal time. Remember that consistent moderate effort beats unsustainable intensity.`,
      `Self-care isn't selfish, it's necessary. ${context}Try the "energy audit": track what drains your energy and what replenishes it. Then adjust your schedule to include more of what helps you thrive.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Crisis or serious concern responses
  if (message.includes('suicide') || message.includes('self-harm') || message.includes('hurt myself') || message.includes('crisis')) {
    return `I'm really concerned about what you're sharing. Your safety is the most important thing. Please reach out immediately to someone who can help you right now. In Sweden, you can call Mind Självmordslinjen at 90101 (available 24/7) or talk to a trusted adult, teacher, or school counselor. You're not alone, and help is available. 💙`;
  }

  // Teacher or help-seeking responses
  if (message.includes('teacher') || message.includes('help') || message.includes('support') || message.includes('counselor')) {
    return `${context}Reaching out for help is a sign of strength, not weakness. Your teachers and school counselors are here to support you. Consider messaging a teacher about your concerns, or visiting the school wellness center. What kind of support are you looking for?`;
  }

  // General wellbeing check
  if (message.includes('how are you') || message.includes('what\'s up') || message.includes('hello') || message.includes('hi')) {
    const responses = [
      `Hello! I'm here to support your wellbeing journey. ${context}How are you feeling today? I'm here to listen and offer some practical suggestions if you'd like.`,
      `Hi there! I'm Pulse AI Coach, your wellbeing companion. ${context}What's on your mind? Whether it's stress, sleep, studying, or just needing someone to talk to, I'm here to help.`,
      `Hey! Great to see you checking in with yourself. ${context}I'm here to help with any wellbeing concerns - from study strategies to stress management. What's going on?`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Gratitude and positive responses
  if (message.includes('thank') || message.includes('thanks') || message.includes('appreciate')) {
    return `You're very welcome! I'm glad I could help. Remember that taking care of your wellbeing is an ongoing journey, and it's okay to ask for support along the way. You've got this! 🌟`;
  }

  // Default response for unrecognized topics
  const defaultResponses = [
    `${context}I want to make sure I understand what you're going through. Could you tell me a bit more about what's on your mind? I'm here to help with stress, sleep, studying, motivation, or any other wellbeing concerns.`,
    `Thanks for sharing that with me. ${context}While I'm not a substitute for professional advice, I can offer some general wellbeing strategies. What specific aspect would you like to focus on - stress management, study techniques, sleep, or something else?`,
    `I appreciate you opening up about this. ${context}Every student's journey is different, and it's great that you're being proactive about your wellbeing. What would be most helpful for you right now?`
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

async function sendChatMessage(overrideText) {
  const input = $('chatbot-input');
  const text = overrideText ?? input.value.trim();
  if (!text) return;

  // Clear input and disable send while waiting
  input.value = '';
  input.style.height = 'auto';
  const sendBtn = $('chatbot-send');
  sendBtn.disabled = true;

  // Show user message
  appendChatMessage('user', text);

  // Add to history
  chatHistory.push({ role: 'user', content: text });

  // Show typing indicator
  appendTypingIndicator();

  try {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const reply = generateAIResponse(text);

    removeTypingIndicator();

    // Add assistant reply to history
    chatHistory.push({ role: 'assistant', content: reply });

    // Save chat history
    localStorage.setItem('ithspulse_chat_history', JSON.stringify(chatHistory));

    appendChatMessage('ai', reply);

  } catch (err) {
    removeTypingIndicator();
    console.error('Chatbot error:', err);
    appendChatMessage('ai', "Sorry, I'm having trouble connecting right now. Please try again in a moment. 💙");
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

// ===== SEARCH FUNCTIONALITY =====
function filterResources() {
  const searchTerm = document.getElementById('resource-search').value.toLowerCase();
  const resourceItems = document.querySelectorAll('.resource-card');

  resourceItems.forEach(item => {
    const title = item.querySelector('.rc-title').textContent.toLowerCase();
    const desc = item.querySelector('.rc-desc').textContent.toLowerCase();
    const subject = item.querySelector('.rc-subject').textContent.toLowerCase();
    const teacher = item.querySelector('.rc-teacher').textContent.toLowerCase();

    const matches = title.includes(searchTerm) ||
                   desc.includes(searchTerm) ||
                   subject.includes(searchTerm) ||
                   teacher.includes(searchTerm);

    item.style.display = matches ? 'block' : 'none';
  });
}

// ===== ACHIEVEMENT SYSTEM =====
const achievements = [
  {
    id: 'first-checkin',
    title: 'First Steps',
    desc: 'Complete your first wellbeing check-in',
    icon: '🌟',
    unlocked: false
  },
  {
    id: 'week-streak',
    title: 'Weekly Warrior',
    desc: 'Complete check-ins for 7 consecutive days',
    icon: '🔥',
    unlocked: false
  },
  {
    id: 'resource-explorer',
    title: 'Knowledge Seeker',
    desc: 'View 5 different resources',
    icon: '📚',
    unlocked: false
  },
  {
    id: 'low-burnout',
    title: 'Wellness Champion',
    desc: 'Achieve a burnout score below 3',
    icon: '🏆',
    unlocked: false
  }
];

function loadAchievements() {
  const saved = localStorage.getItem('ithspulse_achievements');
  if (saved) {
    const unlockedIds = JSON.parse(saved);
    achievements.forEach(achievement => {
      achievement.unlocked = unlockedIds.includes(achievement.id);
    });
  }
  updateAchievementsDisplay();
}

function updateAchievementsDisplay() {
  const container = document.getElementById('achievements-grid');
  if (!container) return;

  container.innerHTML = achievements.map(achievement => `
    <div class="achievement-item ${achievement.unlocked ? 'unlocked' : ''}">
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-info">
        <div class="achievement-title">${achievement.title}</div>
        <div class="achievement-desc">${achievement.desc}</div>
      </div>
    </div>
  `).join('');
}

function checkAchievements() {
  const data = userData.checkins;
  const unlockedIds = achievements.filter(a => a.unlocked).map(a => a.id);

  // First check-in achievement
  if (data.length > 0 && !unlockedIds.includes('first-checkin')) {
    unlockAchievement('first-checkin');
  }

  // Weekly streak achievement
  const last7Days = data.slice(-7);
  if (last7Days.length >= 7 && !unlockedIds.includes('week-streak')) {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const hasStreak = last7Days.every(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= sevenDaysAgo && entryDate <= today;
    });
    if (hasStreak) unlockAchievement('week-streak');
  }

  // Resource explorer achievement
  const viewedResources = JSON.parse(localStorage.getItem('ithspulse_viewed_resources') || '[]');
  if (viewedResources.length >= 5 && !unlockedIds.includes('resource-explorer')) {
    unlockAchievement('resource-explorer');
  }

  // Low burnout achievement
  const lowBurnoutEntry = data.find(entry => {
    const score = calculateBurnout(entry.sleep, entry.stress, entry.hw, entry.mood, data);
    return score < 30; // Assuming burnout score below 30 is "low"
  });
  if (lowBurnoutEntry && !unlockedIds.includes('low-burnout')) {
    unlockAchievement('low-burnout');
  }
}

function unlockAchievement(id) {
  const achievement = achievements.find(a => a.id === id);
  if (achievement && !achievement.unlocked) {
    achievement.unlocked = true;
    saveAchievements();
    updateAchievementsDisplay();

    // Show notification
    showToast(`Achievement Unlocked: ${achievement.title}!`, 'success');
  }
}

function saveAchievements() {
  const unlockedIds = achievements.filter(a => a.unlocked).map(a => a.id);
  localStorage.setItem('ithspulse_achievements', JSON.stringify(unlockedIds));
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

  // Chatbot keyboard events
  const chatInput = $('chatbot-input');
  if (chatInput) {
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });
  }

  // Search functionality
  const searchInput = $('resource-search');
  if (searchInput) {
    searchInput.addEventListener('input', filterResources);
  }

  // Initialize achievements
  loadAchievements();

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
