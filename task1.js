// script.js - API Response Mock Generator Tool
// All functionalities: generate, randomize, validate, copy, download, clear, history, dark mode

// DOM Elements
const jsonInput = document.getElementById('jsonInput');
const httpMethod = document.getElementById('httpMethod');
const endpointUrl = document.getElementById('endpointUrl');
const responseType = document.getElementById('responseType');
const delaySelect = document.getElementById('delaySelect');
const generateBtn = document.getElementById('generateBtn');
const randomizeBtn = document.getElementById('randomizeBtn');
const validateBtn = document.getElementById('validateBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const rawViewToggle = document.getElementById('rawViewToggle');
const treeViewDiv = document.getElementById('treeView');
const rawViewPre = document.getElementById('rawView');
const statusCodeSpan = document.getElementById('statusCodeSpan');
const spinnerOverlay = document.getElementById('spinnerOverlay');
const toastContainer = document.getElementById('toastContainer');
const darkModeToggle = document.getElementById('darkModeToggle');
const historyBtn = document.getElementById('historyBtn');
const historyDropdown = document.getElementById('historyDropdown');
const historyList = document.getElementById('historyList');
const historyCountSpan = document.getElementById('historyCount');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Sample templates
const sampleUser = {
  "user": {
    "id": 1001,
    "name": "Alex Rivera",
    "email": "alex.rivera@example.com",
    "role": "developer",
    "isActive": true
  },
  "posts": 42,
  "joined": "2024-01-15"
};

const samplePosts = {
  "posts": [
    { "id": 1, "title": "Getting Started with APIs", "likes": 120 },
    { "id": 2, "title": "JSON Best Practices", "likes": 89 }
  ],
  "total": 2,
  "page": 1
};

const sampleError = {
  "error": {
    "code": "SERVER_ERROR",
    "message": "Internal server error occurred",
    "timestamp": new Date().toISOString()
  },
  "status": 500
};

// Current generated response data
let currentResponseData = null;
let history = []; // Store history (max 10)

// Load history from localStorage
function loadHistory() {
  const saved = localStorage.getItem('mockGenHistory');
  if (saved) {
    try {
      history = JSON.parse(saved);
      if (!Array.isArray(history)) history = [];
      history = history.slice(0, 10);
      updateHistoryUI();
    } catch(e) { history = []; }
  }
}

// Save history to localStorage
function saveHistory() {
  localStorage.setItem('mockGenHistory', JSON.stringify(history.slice(0, 10)));
  updateHistoryUI();
}

function updateHistoryUI() {
  historyCountSpan.textContent = history.length;
  historyList.innerHTML = '';
  if (history.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No history yet';
    li.style.opacity = '0.6';
    li.style.fontStyle = 'italic';
    historyList.appendChild(li);
  } else {
    history.slice().reverse().forEach((item, idx) => {
      const li = document.createElement('li');
      const preview = typeof item === 'object' ? JSON.stringify(item).slice(0, 50) : item;
      li.textContent = preview + (preview.length >= 50 ? '...' : '');
      li.title = 'Click to restore this response';
      li.style.cursor = 'pointer';
      li.addEventListener('click', (e) => {
        e.stopPropagation();
        restoreFromHistory(item);
        historyDropdown.classList.remove('show');
      });
      historyList.appendChild(li);
    });
  }
}

function addToHistory(data) {
  if (!data) return;
  // Avoid duplicates (simple check)
  const stringified = JSON.stringify(data);
  if (history.length > 0 && JSON.stringify(history[0]) === stringified) return;
  history.unshift(data);
  if (history.length > 10) history.pop();
  saveHistory();
}

function restoreFromHistory(data) {
  try {
    const pretty = JSON.stringify(data, null, 2);
    jsonInput.value = pretty;
    currentResponseData = data;
    displayResponse(data);
    showToast('Restored from history', 'success');
    generateStatusAndCode();
  } catch(e) { showToast('Failed to restore', 'error'); }
}

// Toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${message}`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// Generate status code based on response type
function getStatusCode() {
  const type = responseType.value;
  if (type === 'success') return 200;
  if (type === 'error') return 500;
  return 200; // custom default
}

function generateStatusAndCode() {
  const code = getStatusCode();
  statusCodeSpan.textContent = code;
  const badge = document.getElementById('statusBadge');
  if (code >= 200 && code < 300) badge.style.borderLeftColor = '#10b981';
  else if (code >= 400) badge.style.borderLeftColor = '#ef4444';
  else badge.style.borderLeftColor = '#f59e0b';
}

// Collapsible JSON tree renderer (safe)
function renderJSONTree(obj, level = 0) {
  if (obj === null) return '<span class="json-null">null</span>';
  if (typeof obj === 'boolean') return `<span class="json-bool">${obj}</span>`;
  if (typeof obj === 'number') return `<span class="json-number">${obj}</span>`;
  if (typeof obj === 'string') return `<span class="json-string">"${escapeHtml(obj)}"</span>`;
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '<span class="json-bracket">[]</span>';
    let items = '';
    obj.forEach((item, idx) => {
      items += `<div class="tree-item" data-level="${level+1}">${renderJSONTree(item, level+1)}${idx < obj.length-1 ? ',' : ''}</div>`;
    });
    return `<span class="json-toggle expanded">▶</span><span class="json-bracket">[</span><div class="tree-children">${items}</div><span class="json-bracket">]</span>`;
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '<span class="json-bracket">{}</span>';
    let props = '';
    keys.forEach((key, idx) => {
      props += `<div class="tree-item"><span class="json-key">"${escapeHtml(key)}"</span>: ${renderJSONTree(obj[key], level+1)}${idx < keys.length-1 ? ',' : ''}</div>`;
    });
    return `<span class="json-toggle expanded">▶</span><span class="json-bracket">{</span><div class="tree-children">${props}</div><span class="json-bracket">}</span>`;
  }
  return String(obj);
}

function attachTreeToggleEvents() {
  document.querySelectorAll('.json-toggle').forEach(toggle => {
    toggle.removeEventListener('click', handleToggle);
    toggle.addEventListener('click', handleToggle);
  });
}

function handleToggle(e) {
  e.stopPropagation();
  const toggle = e.currentTarget;
  const parent = toggle.parentElement;
  const childrenDiv = parent.querySelector('.tree-children');
  if (childrenDiv) {
    const isExpanded = toggle.classList.contains('expanded');
    if (isExpanded) {
      toggle.classList.remove('expanded');
      toggle.classList.add('collapsed');
      childrenDiv.style.display = 'none';
    } else {
      toggle.classList.remove('collapsed');
      toggle.classList.add('expanded');
      childrenDiv.style.display = 'block';
    }
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
    return c;
  });
}

function displayResponse(data) {
  if (!data) {
    treeViewDiv.innerHTML = '<div class="placeholder">No response yet. Click Generate.</div>';
    rawViewPre.textContent = '';
    return;
  }
  const rawJsonStr = JSON.stringify(data, null, 2);
  rawViewPre.textContent = rawJsonStr;
  if (!rawViewToggle.checked) {
    treeViewDiv.innerHTML = renderJSONTree(data);
    attachTreeToggleEvents();
    treeViewDiv.classList.remove('hidden');
    rawViewPre.classList.add('hidden');
  } else {
    treeViewDiv.classList.add('hidden');
    rawViewPre.classList.remove('hidden');
  }
}

// Randomize data recursively
function randomizeData(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => randomizeData(item));
  }
  if (typeof obj === 'object') {
    const newObj = {};
    for (let key in obj) {
      const val = obj[key];
      if (typeof val === 'string') {
        if (key.toLowerCase().includes('name')) newObj[key] = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson'][Math.floor(Math.random()*4)];
        else if (key.toLowerCase().includes('email')) newObj[key] = `user${Math.floor(Math.random()*9000)+1000}@mockapi.com`;
        else if (key.toLowerCase().includes('id')) newObj[key] = Math.floor(Math.random() * 10000) + 1;
        else if (key.toLowerCase().includes('title')) newObj[key] = `Random Title ${Math.floor(Math.random()*100)}`;
        else newObj[key] = val.replace(/[a-zA-Z]+/, (match) => ['Mock', 'Random', 'Sample', 'Test'][Math.floor(Math.random()*4)]);
      } else if (typeof val === 'number') {
        newObj[key] = Math.floor(Math.random() * 1000);
      } else if (typeof val === 'boolean') {
        newObj[key] = Math.random() > 0.5;
      } else {
        newObj[key] = randomizeData(val);
      }
    }
    return newObj;
  }
  return obj;
}

// Validate JSON input
function validateJSON() {
  const raw = jsonInput.value.trim();
  if (!raw) {
    document.getElementById('validationMsg').innerHTML = '<span class="error-msg"><i class="fas fa-times-circle"></i> Empty JSON</span>';
    return false;
  }
  try {
    const parsed = JSON.parse(raw);
    document.getElementById('validationMsg').innerHTML = '<span class="success-msg"><i class="fas fa-check-circle"></i> Valid JSON syntax</span>';
    setTimeout(() => {
      if (document.getElementById('validationMsg').innerHTML.includes('Valid')) 
        document.getElementById('validationMsg').innerHTML = '';
    }, 2000);
    return parsed;
  } catch(e) {
    document.getElementById('validationMsg').innerHTML = `<span class="error-msg"><i class="fas fa-exclamation-triangle"></i> ${e.message}</span>`;
    return null;
  }
}

// Generate final response based on type & user json
async function generateResponse() {
  const isValid = validateJSON();
  if (!isValid) {
    showToast('Invalid JSON structure', 'error');
    return;
  }
  let userData;
  try {
    userData = JSON.parse(jsonInput.value);
  } catch(e) { showToast('Cannot parse JSON', 'error'); return; }
  
  const delay = parseInt(delaySelect.value);
  const respType = responseType.value;
  let finalData = { ...userData };
  
  if (respType === 'error') {
    finalData = {
      error: true,
      message: "Mock server error: Something went wrong",
      code: "INTERNAL_ERROR",
      originalData: userData
    };
  } else if (respType === 'custom') {
    finalData = userData;
  } else {
    finalData = userData;
  }
  
  spinnerOverlay.classList.remove('hidden');
  generateBtn.disabled = true;
  
  setTimeout(() => {
    currentResponseData = finalData;
    displayResponse(finalData);
    generateStatusAndCode();
    addToHistory(finalData);
    spinnerOverlay.classList.add('hidden');
    generateBtn.disabled = false;
    showToast('Response generated successfully', 'success');
  }, delay);
}

// Randomize button
function randomizeDataAction() {
  const parsed = validateJSON();
  if (!parsed) {
    showToast('Cannot randomize: invalid JSON', 'error');
    return;
  }
  const randomized = randomizeData(parsed);
  jsonInput.value = JSON.stringify(randomized, null, 2);
  showToast('Data randomized with realistic values', 'success');
  if (currentResponseData) {
    const newResp = randomizeData(currentResponseData);
    currentResponseData = newResp;
    displayResponse(newResp);
    generateStatusAndCode();
  }
}

// Copy response
function copyResponse() {
  if (!currentResponseData) {
    showToast('No response to copy. Generate first.', 'error');
    return;
  }
  const raw = JSON.stringify(currentResponseData, null, 2);
  navigator.clipboard.writeText(raw).then(() => {
    showToast('Copied to clipboard!', 'success');
  }).catch(() => showToast('Copy failed', 'error'));
}

// Download JSON
function downloadResponse() {
  if (!currentResponseData) {
    showToast('No response to download', 'error');
    return;
  }
  const dataStr = JSON.stringify(currentResponseData, null, 2);
  const blob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mock_response_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Downloaded as .json file', 'success');
}

// Clear all with confirmation
function clearAll() {
  if (confirm('Are you sure you want to reset all fields and clear response?')) {
    jsonInput.value = '{\n  "example": "Provide your JSON structure"\n}';
    httpMethod.value = 'GET';
    endpointUrl.value = '/api/v1/mock';
    responseType.value = 'success';
    delaySelect.value = '0';
    currentResponseData = null;
    treeViewDiv.innerHTML = '<div class="placeholder">Response cleared. Click Generate.</div>';
    rawViewPre.textContent = '';
    statusCodeSpan.textContent = '—';
    document.getElementById('statusBadge').style.borderLeftColor = '#64748b';
    document.getElementById('validationMsg').innerHTML = '';
    showToast('All fields reset', 'info');
    if (rawViewToggle.checked) {
      rawViewToggle.checked = false;
      treeViewDiv.classList.remove('hidden');
      rawViewPre.classList.add('hidden');
    }
  }
}

// Sample templates
function loadSample(sampleObj) {
  jsonInput.value = JSON.stringify(sampleObj, null, 2);
  showToast('Template loaded', 'success');
  validateJSON();
}

// Toggle raw view
function toggleRawView() {
  if (currentResponseData) {
    displayResponse(currentResponseData);
  } else {
    if (!rawViewToggle.checked) {
      treeViewDiv.classList.remove('hidden');
      rawViewPre.classList.add('hidden');
    } else {
      treeViewDiv.classList.add('hidden');
      rawViewPre.classList.remove('hidden');
      if (!rawViewPre.textContent) rawViewPre.textContent = 'No response yet.';
    }
  }
}

// Dark mode
function initDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.body.classList.add('dark');
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }
  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const darkEnabled = document.body.classList.contains('dark');
    localStorage.setItem('darkMode', darkEnabled);
    darkModeToggle.innerHTML = darkEnabled ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    if (currentResponseData) displayResponse(currentResponseData);
  });
}

// History dropdown toggle
historyBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  historyDropdown.classList.toggle('show');
});
document.addEventListener('click', () => {
  historyDropdown.classList.remove('show');
});
if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    history = [];
    saveHistory();
    showToast('History cleared', 'info');
    historyDropdown.classList.remove('show');
  });
}

// Event Listeners
generateBtn.addEventListener('click', generateResponse);
randomizeBtn.addEventListener('click', randomizeDataAction);
validateBtn.addEventListener('click', () => { validateJSON(); });
copyBtn.addEventListener('click', copyResponse);
downloadBtn.addEventListener('click', downloadResponse);
clearBtn.addEventListener('click', clearAll);
rawViewToggle.addEventListener('change', toggleRawView);
document.getElementById('sampleUserBtn').addEventListener('click', () => loadSample(sampleUser));
document.getElementById('samplePostsBtn').addEventListener('click', () => loadSample(samplePosts));
document.getElementById('sampleErrorBtn').addEventListener('click', () => loadSample(sampleError));

// Initialize
function init() {
  loadHistory();
  initDarkMode();
  jsonInput.value = JSON.stringify(sampleUser, null, 2);
  validateJSON();
  currentResponseData = null;
  treeViewDiv.innerHTML = '<div class="placeholder">Ready. Click Generate to see mock response.</div>';
  statusCodeSpan.textContent = '—';
}
init();