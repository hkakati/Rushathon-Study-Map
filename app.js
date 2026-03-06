/* ================================================================
   SkillRoute AI — Core Application Logic
   AI Learning Path Navigator
   ================================================================ */

'use strict';

// ─── API CONFIG ──────────────────────────────────────────────────
const API_BASE_URL = 'http://localhost:8000/api';

// ─── DATA STORE ──────────────────────────────────────────────────
const APP_STATE = {
  user_id: 'user_001', // Fixed for prototype demo
  currentPage: 'home',
  wizardStep: 1,
  selections: { goals: [], topics: [], skill: 'beginner', time: '3-5' },
  generatedPath: null,
  myPaths: JSON.parse(localStorage.getItem('myPaths') || '[]'),
  progress: JSON.parse(localStorage.getItem('progress') || JSON.stringify({
    hoursLearned: 0, coursesCompleted: 0, streak: 0, points: 0
  }))
};

// ─── RESOURCE CACHE (Will be populated by backend) ────────────────
let RESOURCES_DB = [];

// ─── LEARNING PATHS TEMPLATES ────────────────────────────────────
const PATH_TEMPLATES = {
  'ai-ml': {
    title: 'AI & Machine Learning Mastery',
    emoji: '🤖',
    desc: 'A curated journey from Python basics to deploying production ML models',
    weeks: 16,
    color: 'linear-gradient(90deg,#6366f1,#22d3ee)',
    phases: [
      { num: 1, title: 'Python & Math Foundations', desc: 'NumPy, Pandas, Statistics, Linear Algebra', topics: ['Python', 'Statistics', 'Linear Algebra', 'NumPy'], progress: 100 },
      { num: 2, title: 'Classical Machine Learning', desc: 'Supervised and unsupervised learning algorithms', topics: ['Regression', 'Classification', 'Clustering', 'SVM'], progress: 65 },
      { num: 3, title: 'Deep Learning & Neural Networks', desc: 'CNNs, RNNs, Transformers, and Transfer Learning', topics: ['TensorFlow', 'PyTorch', 'CNNs', 'Transformers'], progress: 20 },
      { num: 4, title: 'MLOps & Deployment', desc: 'Model serving, monitoring, and production pipelines', topics: ['Docker', 'FastAPI', 'MLflow', 'Kubernetes'], progress: 0 },
    ]
  },
  'web-dev': {
    title: 'Full-Stack Web Developer',
    emoji: '🌐',
    desc: 'Build modern web apps from scratch — HTML to cloud deployment',
    weeks: 14,
    color: 'linear-gradient(90deg,#f472b6,#fb923c)',
    phases: [
      { num: 1, title: 'HTML, CSS & JavaScript', desc: 'Core building blocks of the web', topics: ['HTML5', 'CSS3', 'JavaScript ES6+', 'DOM'], progress: 100 },
      { num: 2, title: 'React & Modern Frontend', desc: 'Component-based UI with state management', topics: ['React', 'Redux', 'TypeScript', 'Vite'], progress: 50 },
      { num: 3, title: 'Backend & APIs', desc: 'Node.js, REST APIs, databases, authentication', topics: ['Node.js', 'Express', 'MongoDB', 'JWT'], progress: 10 },
      { num: 4, title: 'DevOps & Deployment', desc: 'CI/CD, Docker, Nginx, cloud providers', topics: ['Git', 'Docker', 'AWS', 'Vercel'], progress: 0 },
    ]
  },
  'data-science': {
    title: 'Data Science & Analytics',
    emoji: '📊',
    desc: 'Transform raw data into actionable insights and predictive models',
    weeks: 12,
    color: 'linear-gradient(90deg,#4ade80,#22d3ee)',
    phases: [
      { num: 1, title: 'Data Wrangling', desc: 'Cleaning, transforming, and exploring datasets', topics: ['Python', 'Pandas', 'SQL', 'Excel'], progress: 80 },
      { num: 2, title: 'Statistical Analysis', desc: 'Hypothesis testing, probability, distributions', topics: ['Statistics', 'R', 'SciPy', 'Matplotlib'], progress: 40 },
      { num: 3, title: 'Visualization & Storytelling', desc: 'Creating compelling data narratives', topics: ['Tableau', 'Plotly', 'Seaborn', 'Power BI'], progress: 0 },
    ]
  },
  'cybersecurity': {
    title: 'Cybersecurity Professional',
    emoji: '🔒',
    desc: 'Defend systems and networks against modern cyber threats',
    weeks: 18,
    color: 'linear-gradient(90deg,#f59e0b,#ef4444)',
    phases: [
      { num: 1, title: 'Networking Fundamentals', desc: 'TCP/IP, DNS, firewalls, VPNs', topics: ['Networking', 'TCP/IP', 'Wireshark', 'Linux'], progress: 60 },
      { num: 2, title: 'Ethical Hacking', desc: 'Penetration testing and vulnerability assessment', topics: ['Kali Linux', 'Metasploit', 'Nmap', 'OWASP'], progress: 20 },
      { num: 3, title: 'Blue Team & Defense', desc: 'SIEM, incident response, threat hunting', topics: ['Splunk', 'SOC', 'SIEM', 'Forensics'], progress: 0 },
    ]
  }
};

const FEATURED_PATHS = [
  { id: 'ai-ml', emoji: '🤖', title: 'AI & Machine Learning', desc: 'From Python to production ML systems', weeks: 16, learners: '12.5K', level: 'Intermediate', color: 'linear-gradient(90deg,#6366f1,#22d3ee)' },
  { id: 'web-dev', emoji: '🌐', title: 'Full-Stack Web Dev', desc: 'Node, React, databases, cloud deployment', weeks: 14, learners: '8.2K', level: 'Beginner', color: 'linear-gradient(90deg,#f472b6,#fb923c)' },
  { id: 'data-science', emoji: '📊', title: 'Data Science & Analytics', desc: 'Pandas, visualization, ML workflows', weeks: 12, learners: '9.8K', level: 'Beginner', color: 'linear-gradient(90deg,#4ade80,#22d3ee)' },
  { id: 'cybersecurity', emoji: '🔒', title: 'Cybersecurity', desc: 'Ethical hacking and blue team defense', weeks: 18, learners: '5.4K', level: 'Intermediate', color: 'linear-gradient(90deg,#f59e0b,#ef4444)' },
  { id: 'cloud', emoji: '☁️', title: 'Cloud Computing', desc: 'AWS, Azure, GCP, Terraform, Kubernetes', weeks: 10, learners: '7.1K', level: 'Intermediate', color: 'linear-gradient(90deg,#38bdf8,#6366f1)' },
  { id: 'design', emoji: '🎨', title: 'UI/UX Design', desc: 'Figma, design systems, user research', weeks: 8, learners: '11.3K', level: 'Beginner', color: 'linear-gradient(90deg,#e879f9,#f472b6)' },
];

// ─── DOM HELPERS ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function showToast(msg, type = 'info') {
  const tc = $('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✅' : '💡'}</span><span>${msg}</span>`;
  tc.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(100%)'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 3500);
}

// ─── NAVIGATION ──────────────────────────────────────────────────
function navigateTo(page) {
  APP_STATE.currentPage = page;
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-link').forEach(l => { l.classList.toggle('active', l.dataset.page === page); });
  const el = $(`page-${page}`);
  if (el) { el.classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  if (page === 'explore') renderExploreResources();
  if (page === 'my-paths') renderMyPaths();
  if (page === 'progress') renderProgress();
}

$$('.nav-link').forEach(link => {
  link.addEventListener('click', e => { e.preventDefault(); navigateTo(link.dataset.page); });
});

// ─── FEATURED PATHS ───────────────────────────────────────────────
function renderFeaturedPaths() {
  const container = $('featuredPaths');
  container.innerHTML = FEATURED_PATHS.map(p => `
    <div class="path-card" style="--path-color:${p.color}" onclick="openFeaturedPath('${p.id}')">
      <span class="pc-emoji">${p.emoji}</span>
      <div class="pc-title">${p.title}</div>
      <div class="pc-desc">${p.desc}</div>
      <div class="pc-meta">
        <span>📅 ${p.weeks}w</span>
        <span>👥 ${p.learners}</span>
        <span>⚡ ${p.level}</span>
      </div>
      <div class="pc-enroll">Enroll Now →</div>
    </div>
  `).join('');
}

function openFeaturedPath(id) {
  const tpl = PATH_TEMPLATES[id];
  if (!tpl) { showToast('Path coming soon!', 'info'); return; }
  const fp = FEATURED_PATHS.find(p => p.id === id);
  APP_STATE.selections.topics = [id];
  APP_STATE.selections.skill = 'intermediate';
  APP_STATE.selections.time = '3-5';
  generateAndShowPath(tpl, fp || {});
}

// ─── WIZARD LOGIC ─────────────────────────────────────────────────
$('startJourneyBtn').addEventListener('click', () => {
  $('wizardSection').style.display = 'block';
  $('featuredSection').style.display = 'none';
  $('wizardSection').scrollIntoView({ behavior: 'smooth' });
});

$('exploreBtn').addEventListener('click', () => navigateTo('explore'));

// Multi-select options
function initMultiSelect(gridId, stateKey) {
  const grid = $(gridId);
  if (!grid) return;
  grid.querySelectorAll('[data-value]').forEach(card => {
    card.addEventListener('click', () => {
      const v = card.dataset.value;
      card.classList.toggle('selected');
      if (card.classList.contains('selected')) {
        if (!APP_STATE.selections[stateKey].includes(v)) APP_STATE.selections[stateKey].push(v);
      } else {
        APP_STATE.selections[stateKey] = APP_STATE.selections[stateKey].filter(x => x !== v);
      }
    });
  });
}

function initSingleSelect(gridId, stateKey) {
  const grid = $(gridId);
  if (!grid) return;
  grid.querySelectorAll('[data-value]').forEach(card => {
    card.addEventListener('click', () => {
      grid.querySelectorAll('[data-value]').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      APP_STATE.selections[stateKey] = card.dataset.value;
    });
  });
}

initMultiSelect('goalGrid', 'goals');
initMultiSelect('topicGrid', 'topics');
initSingleSelect('skillGrid', 'skill');
initSingleSelect('timeGrid', 'time');

// Wizard navigation
$$('.wizard-next').forEach(btn => {
  btn.addEventListener('click', () => {
    const step = parseInt(btn.dataset.step);
    advanceWizard(step);
  });
});

function advanceWizard(currentStep) {
  const nextStep = currentStep + 1;
  $(`step${currentStep}`).classList.remove('active');
  const next = $(`step${nextStep}`);
  if (next) {
    next.classList.add('active');
    APP_STATE.wizardStep = nextStep;
    const pct = (nextStep / 4) * 100;
    $('wizardProgressFill').style.width = pct + '%';
  }
}

$('generatePathBtn').addEventListener('click', async () => {
  try {
    const payload = {
      goals: APP_STATE.selections.goals,
      topics: APP_STATE.selections.topics.length ? APP_STATE.selections.topics : ['ai-ml'],
      skill: APP_STATE.selections.skill,
      time: APP_STATE.selections.time,
      user_id: APP_STATE.user_id
    };

    showToast('🚀 Generating your path with AI...', 'info');

    const res = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('API request failed');
    const pathData = await res.json();

    $('wizardSection').style.display = 'none';
    generateAndShowPath(pathData);
  } catch (err) {
    console.error(err);
    showToast('Error connecting to backend server', 'error');
  }
});

// ─── PATH GENERATION ──────────────────────────────────────────────
function generateAndShowPath(pathData) {
  APP_STATE.generatedPath = pathData;
  const pr = $('pathResult');
  pr.style.display = 'block';
  $('featuredSection').style.display = 'none';
  pr.scrollIntoView({ behavior: 'smooth' });

  $('pathTitle').textContent = pathData.title;
  $('pathDesc').textContent = pathData.desc;
  $('difficultyChip').textContent = `⚡ ${pathData.skill_level.charAt(0).toUpperCase() + pathData.skill_level.slice(1)}`;

  // build roadmap
  const roadmap = $('pathRoadmap');
  roadmap.innerHTML = pathData.phases.map(ph => `
    <div class="roadmap-phase">
      <div class="phase-dot">${ph.num}</div>
      <div class="phase-card">
        <h4>${ph.title}</h4>
        <p>${ph.desc}</p>
        <div class="phase-topics">
          ${ph.topics.map(t => `<span class="phase-topic">${t}</span>`).join('')}
        </div>
        ${ph.progress > 0 ? `
          <div class="phase-progress-bar">
            <div class="phase-progress-fill" style="width:${ph.progress}%"></div>
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');

  // render matched resources
  const rGrid = $('resourceGrid');
  rGrid.innerHTML = (pathData.recommended_resources || []).map(r => renderResourceCard(r)).join('');

  showToast('✨ Learning path generated! Ready to start?', 'success');
}

function renderResourceCard(r) {
  return `
    <div class="resource-card" onclick="openResource(${r.id})">
      <span class="rc-type ${r.type}">${r.type.toUpperCase()}</span>
      <div class="rc-title">${r.title}</div>
      <div class="rc-source">${r.source} • ${r.duration}</div>
      <div class="rc-meta">
        <span class="rc-rating">★ ${r.rating}</span>
        <span>${r.level}</span>
        ${r.free ? '<span class="rc-free">FREE</span>' : '<span>PAID</span>'}
      </div>
    </div>
  `;
}

function openResource(id) {
  const r = RESOURCES_DB.find(x => x.id === id);
  if (r) showToast(`Opening "${r.title}"...`, 'info');
}

$('savePathBtn').addEventListener('click', () => {
  if (!APP_STATE.generatedPath) return;
  const topicKey = APP_STATE.selections.topics[0] || 'ai-ml';
  const fp = FEATURED_PATHS.find(p => p.id === topicKey) || FEATURED_PATHS[0];
  const savedPath = {
    id: Date.now(),
    title: APP_STATE.generatedPath.title,
    emoji: APP_STATE.generatedPath.emoji,
    desc: APP_STATE.generatedPath.desc,
    weeks: APP_STATE.generatedPath.weeks,
    topics: APP_STATE.selections.topics,
    progress: 0,
    status: 'active',
    savedAt: new Date().toISOString()
  };
  APP_STATE.myPaths.push(savedPath);
  localStorage.setItem('myPaths', JSON.stringify(APP_STATE.myPaths));
  showToast('Path saved to My Paths! 🎉', 'success');
});

$('regenerateBtn').addEventListener('click', () => {
  const topicKeys = Object.keys(PATH_TEMPLATES);
  const randKey = topicKeys[Math.floor(Math.random() * topicKeys.length)];
  const tpl = PATH_TEMPLATES[randKey];
  APP_STATE.selections.topics = [randKey];
  generateAndShowPath(tpl, {});
});

$('sharePath').addEventListener('click', () => {
  navigator.clipboard?.writeText(window.location.href);
  showToast('Link copied to clipboard!', 'success');
});

// ─── EXPLORE PAGE ──────────────────────────────────────────────────
let activeFilter = 'all';
let searchQuery = '';

async function renderExploreResources() {
  const container = $('exploreResources');
  if (!container) return;

  try {
    let url = `${API_BASE_URL}/resources`;
    if (activeFilter !== 'all' && activeFilter !== 'free') {
      url += `?topic=${APP_STATE.selections.topics[0] || ''}`;
    }

    const res = await fetch(url);
    RESOURCES_DB = await res.json();

    let filtered = RESOURCES_DB;
    if (activeFilter === 'free') filtered = filtered.filter(r => r.free);
    else if (activeFilter !== 'all' && activeFilter !== 'course' && activeFilter !== 'tutorial') {
      // Fallback for types not strictly in DB tags
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => r.title.toLowerCase().includes(q) || r.source.toLowerCase().includes(q));
    }

    container.innerHTML = filtered.length
      ? filtered.map(r => renderResourceCard(r)).join('')
      : '<p style="color:var(--text2);padding:2rem">No results found. Try a different search.</p>';
  } catch (err) {
    container.innerHTML = '<p style="color:red;padding:2rem">Error loading resources.</p>';
  }
}

$$('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    $$('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    renderExploreResources();
  });
});

$('searchBtn').addEventListener('click', () => {
  searchQuery = $('searchInput').value.trim();
  renderExploreResources();
});

$('searchInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') { searchQuery = $('searchInput').value.trim(); renderExploreResources(); }
});

$('viewAllPaths')?.addEventListener('click', () => navigateTo('explore'));

// ─── MY PATHS PAGE ────────────────────────────────────────────────
function renderMyPaths() {
  const container = $('myPathsGrid');
  if (!container) return;
  if (APP_STATE.myPaths.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--text2)">
        <div style="font-size:3rem;margin-bottom:1rem">📭</div>
        <h3 style="font-size:1.2rem;margin-bottom:.5rem">No paths saved yet</h3>
        <p style="margin-bottom:1.5rem">Generate a personalized path to get started</p>
        <button class="btn-primary" onclick="navigateTo('home')">Start Learning →</button>
      </div>`;
    return;
  }
  container.innerHTML = APP_STATE.myPaths.map(p => `
    <div class="my-path-card">
      <div class="mp-header">
        <span class="mp-icon">${p.emoji || '📚'}</span>
        <span class="mp-status status-${p.status}">${p.status}</span>
      </div>
      <div class="mp-title">${p.title}</div>
      <div class="mp-sub">${p.desc || ''}</div>
      <div class="mp-progress-info"><span>Progress</span><span>${p.progress}%</span></div>
      <div class="mp-bar"><div class="mp-fill" style="width:${p.progress}%"></div></div>
      <div class="mp-actions">
        <button class="btn-primary" onclick="continuePath(${p.id})">Continue →</button>
        <button class="btn-ghost" onclick="deletePath(${p.id})">Remove</button>
      </div>
    </div>
  `).join('');
}

function continuePath(id) { showToast('Resuming your learning session...', 'info'); }

function deletePath(id) {
  APP_STATE.myPaths = APP_STATE.myPaths.filter(p => p.id !== id);
  localStorage.setItem('myPaths', JSON.stringify(APP_STATE.myPaths));
  renderMyPaths();
  showToast('Path removed', 'info');
}

// ─── PROGRESS PAGE ────────────────────────────────────────────────
async function renderProgress() {
  let p = APP_STATE.progress;
  try {
    const res = await fetch(`${API_BASE_URL}/progress/${APP_STATE.user_id}`);
    if (res.ok) {
      const data = await res.json();
      p = {
        hoursLearned: data.hours_learned,
        coursesCompleted: data.courses_completed,
        streak: data.streak_days,
        points: data.points
      };
    }
  } catch (err) { }

  // If no data from API, let's derive some from our myPaths to show "some" progress
  if (APP_STATE.myPaths.length > 0) {
    const derivedHours = APP_STATE.myPaths.reduce((acc, path) => acc + (path.progress / 100) * (path.weeks * 5), 0);
    const derivedPoints = APP_STATE.myPaths.reduce((acc, path) => acc + (path.progress * 10), 0);
    p.hoursLearned = Math.max(p.hoursLearned, Math.round(derivedHours * 10) / 10);
    p.points = Math.max(p.points, derivedPoints);
  }

  const overview = $('progressOverview');
  if (!overview) return;

  // Stats cards
  overview.innerHTML = [
    { icon: '⏱️', val: p.hoursLearned, label: 'Hours Learned', color: 'var(--primary)' },
    { icon: '✅', val: p.coursesCompleted, label: 'Completed', color: 'var(--green)' },
    { icon: '🔥', val: p.streak, label: 'Day Streak', color: 'var(--orange)' },
    { icon: '⭐', val: p.points.toLocaleString(), label: 'Points Earned', color: 'var(--accent)' },
  ].map(s => `
    <div class="progress-stat-card" style="--accent:${s.color}">
      <div class="psc-icon">${s.icon}</div>
      <div class="psc-val">${s.val}</div>
      <div class="psc-label">${s.label}</div>
    </div>
  `).join('');

  // Charts
  const charts = $('progressCharts');

  const weeklyData = [
    { label: 'Mon', hrs: 1.5 }, { label: 'Tue', hrs: 0 }, { label: 'Wed', hrs: 2.5 },
    { label: 'Thu', hrs: 1 }, { label: 'Fri', hrs: 3 }, { label: 'Sat', hrs: 2 }, { label: 'Sun', hrs: 0.5 }
  ];

  const topicMap = {};
  APP_STATE.myPaths.forEach(path => {
    const topics = path.topics || ['general'];
    topics.forEach(t => {
      topicMap[t] = (topicMap[t] || 0) + (path.progress || 10); // Assume min weight of 10 for visibility
    });
  });

  const topicEntries = Object.entries(topicMap);
  const totalWeight = topicEntries.reduce((acc, [_, val]) => acc + val, 0) || 100;

  const topicData = topicEntries.length > 0
    ? topicEntries.map(([label, val]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1).replace('-', ' '),
      pct: Math.round((val / totalWeight) * 100),
      color: `hsl(${Math.random() * 360}, 75%, 65%)`
    }))
    : [
      { label: 'AI/ML', pct: 75, color: '#6366f1' }, { label: 'Web Dev', pct: 50, color: '#f472b6' }
    ];

  charts.innerHTML = `
    <div class="chart-card">
      <div class="cc-header">
        <h3>📅 Weekly Activity</h3>
        <span class="cc-avg">${Math.round(weeklyData.reduce((a, b) => a + b.hrs, 0) * 10) / 10} hrs this week</span>
      </div>
      <div class="bar-chart">
        ${weeklyData.map(d => `
          <div class="bar-row">
            <span class="bar-label">${d.label}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${(d.hrs / 4) * 100}%;background:linear-gradient(90deg,var(--primary),var(--accent))"></div></div>
            <span class="bar-val">${d.hrs}h</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="chart-card">
      <div class="cc-header">
        <h3>🧩 Knowledge Distribution</h3>
        <span class="cc-avg">Based on saved paths</span>
      </div>
      <div class="bar-chart">
        ${topicData.map(d => `
          <div class="bar-row">
            <span class="bar-label">${d.label}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${d.pct}%;background:${d.color}"></div></div>
            <span class="bar-val">${d.pct}%</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Recent Activity (New Section)
  const activitySection = document.createElement('div');
  activitySection.className = 'activity-section';
  const activities = APP_STATE.myPaths.length > 0
    ? APP_STATE.myPaths.slice(0, 3).map(path => ({
      icon: '📚',
      text: `Enrolled in <strong>${path.title}</strong>`,
      time: 'Just now'
    }))
    : [{ icon: '✨', text: 'Welcome! Start by generating a learning path.', time: 'Today' }];

  // Achievements
  const achievements = [
    { icon: '🚀', name: 'First Step', desc: 'Complete first resource', locked: false },
    { icon: '🔥', name: 'On Fire', desc: '7-day streak', locked: false },
    { icon: '📚', name: 'BookWorm', desc: 'Complete 5 courses', locked: false },
    { icon: '🏆', name: 'Champion', desc: 'Finish a full path', locked: false },
    { icon: '⚡', name: 'Speed Run', desc: 'Complete 3 in a week', locked: true },
    { icon: '🌟', name: 'Star Learner', desc: 'Earn 5000 points', locked: true },
    { icon: '🎯', name: 'Sharpshooter', desc: 'Quiz score 100%', locked: true },
    { icon: '💎', name: 'Diamond', desc: '90-day streak', locked: true },
  ];

  $('achievementsSection').innerHTML = `
    <div class="dashboard-grid">
        <div class="activity-column">
            <h2>📜 Recent Activity</h2>
            <div class="activity-feed">
                ${activities.map(a => `
                    <div class="activity-item">
                        <div class="ai-icon">${a.icon}</div>
                        <div class="ai-content">
                            <div class="ai-text">${a.text}</div>
                            <div class="ai-time">${a.time}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="achievements-column">
            <h2>🏅 Achievements</h2>
            <div class="achievements-grid">
                ${achievements.map(a => `
                    <div class="achievement-card ${a.locked ? 'ach-locked' : ''}">
                        <div class="ach-icon">${a.icon}</div>
                        <div class="ach-name">${a.name}</div>
                        <div class="ach-desc">${a.desc}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
  `;
}

// ─── INIT ───────────────────────────────────────────────────────
renderFeaturedPaths();

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const nb = $('navbar');
  if (nb) nb.style.boxShadow = window.scrollY > 10 ? '0 4px 30px rgba(0,0,0,.4)' : 'none';
});

console.log('🚀 SkillRoute AI loaded successfully!');
