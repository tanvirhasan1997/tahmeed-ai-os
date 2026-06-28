// =============================================
// Tahmeed AI OS - Frontend Application
// =============================================

const API_BASE = '/api';

// =============================================
// Initialization
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    updateSystemTime();
    setInterval(updateSystemTime, 1000);
    loadDashboard();
});

function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            navigateToSection(section);
        });
    });
}

function navigateToSection(sectionId) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNav = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeNav) activeNav.classList.add('active');

    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`section-${sectionId}`);
    if (target) target.classList.add('active');

    const titles = { 'dashboard': 'ড্যাশবোর্ড', 'command-center': 'কমান্ড সেন্টার', 'agents': 'AI এজেন্ট', 'tasks': 'টাস্ক', 'memory': 'মেমরি', 'knowledge': 'নলেজ', 'automation': 'অটোমেশন', 'tools': 'টুলস', 'ai-settings': 'AI সেটিংস' };
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = titles[sectionId] || 'ড্যাশবোর্ড';

    switch (sectionId) {
        case 'dashboard': loadDashboard(); break;
        case 'agents': loadAgents(); break;
        case 'tasks': loadTasks(); break;
        case 'memory': loadMemory(); break;
        case 'knowledge': loadKnowledge(); break;
        case 'automation': loadAutomations(); break;
        case 'tools': loadTools(); break;
        case 'ai-settings': loadAISettings(); break;
    }
}

function updateSystemTime() {
    const now = new Date();
    const el = document.getElementById('system-time');
    if (el) el.textContent = now.toLocaleString('bn-BD');
}

// =============================================
// Command Execution
// =============================================
async function executeCommand() {
    const input = document.getElementById('command-input');
    const command = input.value.trim();
    if (!command) return;

    const resultsPanel = document.getElementById('command-results');
    resultsPanel.innerHTML = `<div class="result-item"><div class="result-content"><span class="loading-spinner"></span> এজেন্টরা কাজ করছে...</div></div>`;

    try {
        const response = await fetch(`${API_BASE}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
        });
        const data = await response.json();

        if (data.success) {
            let html = `<div class="result-item fade-in">
                <div class="result-content" style="color: var(--success); margin-bottom: 12px;">
                    <strong>${data.message}</strong><br>
                    <small>Primary Agent: ${data.routing?.primaryAgent || 'N/A'} | Intents: ${data.routing?.intents?.join(', ') || 'N/A'}</small>
                </div>
            </div>`;

            if (data.results) {
                data.results.forEach(r => {
                    if (r.status === 'fulfilled' && r.result) {
                        const res = r.result;
                        html += `<div class="result-item fade-in">
                            <div class="result-content">
                                <strong>${res.icon || '🤖'} ${r.agent?.toUpperCase() || ''} Agent</strong><br>
                                ${res.summary || ''}<br><br>`;

                        if (res.steps) {
                            html += `<strong>ধাপসমূহ:</strong><br>`;
                            res.steps.forEach(s => { html += `✓ ${s.action} - ${s.detail}<br>`; });
                        }
                        if (res.recommendations) {
                            html += `<br><strong>💡 সুপারিশ:</strong><br>`;
                            res.recommendations.forEach(rec => { html += `→ ${rec}<br>`; });
                        }
                        if (res.aiResponse) {
                            html += `<br><strong>🤖 AI Response:</strong><br>${res.aiResponse}`;
                        }
                        html += `<br><small>⏱️ ${res.completionTime || ''}</small></div></div>`;
                    }
                });
            }
            resultsPanel.innerHTML = html;
        } else {
            resultsPanel.innerHTML = `<div class="result-item"><div class="result-content" style="color: var(--danger);">❌ ${data.error || 'কমান্ড প্রসেস করতে সমস্যা হয়েছে'}</div></div>`;
        }
        input.value = '';
    } catch (error) {
        resultsPanel.innerHTML = `<div class="result-item"><div class="result-content" style="color: var(--danger);">❌ সার্ভার সংযোগ ব্যর্থ: ${error.message}</div></div>`;
    }
}

function fillCommand(text) {
    const input = document.getElementById('command-input');
    if (input) { input.value = text; input.focus(); }
}

// =============================================
// Dashboard
// =============================================
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/dashboard`);
        const data = await response.json();

        const agentCount = Array.isArray(data.agents) ? data.agents.length : 0;
        setText('stat-agents', agentCount);
        setText('stat-completed', data.tasks?.completed || 0);
        setText('stat-pending', data.tasks?.pending || 0);
        setText('stat-memory', data.memory?.total || 0);

        const agents = Array.isArray(data.agents) ? data.agents : [];
        renderAgentCards(agents, 'agents-grid');
    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

// =============================================
// Agents
// =============================================
async function loadAgents() {
    try {
        const response = await fetch(`${API_BASE}/agents`);
        const data = await response.json();
        const agents = Array.isArray(data) ? data : (data.agents || []);
        renderAgentCards(agents, 'agents-list');
    } catch (error) {
        document.getElementById('agents-list').innerHTML = `<div class="empty-state"><span class="empty-icon">⚠️</span><p>এজেন্ট লোড ব্যর্থ</p></div>`;
    }
}

function renderAgentCards(agents, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !agents.length) return;

    container.innerHTML = agents.map(agent => `
        <div class="agent-card fade-in">
            <div class="agent-card-header">
                <div class="agent-avatar">${getAgentIcon(agent.name)}</div>
                <div class="agent-info">
                    <h4>${agent.description || agent.name}</h4>
                    <div class="agent-status">
                        <span class="status-dot online"></span>
                        <span>${agent.status === 'idle' ? 'প্রস্তুত' : 'কাজ করছে'}</span>
                        ${agent.aiPowered ? ' • 🤖 AI' : ''}
                    </div>
                </div>
            </div>
            <div class="agent-capabilities">
                ${(agent.capabilities || []).map(c => `<span class="capability-tag">${c}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

// =============================================
// Tasks
// =============================================
async function loadTasks() {
    try {
        const response = await fetch(`${API_BASE}/tasks`);
        const tasks = await response.json();
        const container = document.getElementById('tasks-list');

        if (!tasks.length) {
            container.innerHTML = `<div class="empty-state"><span class="empty-icon">📋</span><p>কোনো টাস্ক নেই। কমান্ড দিলে টাস্ক তৈরি হবে।</p></div>`;
            return;
        }

        container.innerHTML = tasks.map(task => `
            <div class="task-item fade-in">
                <div class="task-left">
                    <span class="task-status-icon">${task.status === 'completed' ? '✅' : '⏳'}</span>
                    <div>
                        <div class="task-title">${task.title || 'টাস্ক'}</div>
                        <div class="task-meta">${getAgentIcon(task.assigned_agent)} ${task.assigned_agent || ''} • ${task.priority || ''}</div>
                    </div>
                </div>
                <span class="task-badge ${task.status}">${getStatusLabel(task.status)}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Tasks error:', error);
    }
}

// =============================================
// Memory
// =============================================
async function loadMemory() {
    try {
        const response = await fetch(`${API_BASE}/memory`);
        const memories = await response.json();
        const container = document.getElementById('memory-list');

        if (!memories.length) {
            container.innerHTML = `<div class="empty-state"><span class="empty-icon">💾</span><p>মেমরি খালি। কমান্ড দিলে মেমরি তৈরি হবে।</p></div>`;
            return;
        }

        container.innerHTML = memories.map(m => `
            <div class="memory-item fade-in">
                <h4>${m.type || 'মেমরি'}</h4>
                <p>${m.content || ''}</p>
                <div class="meta">📅 ${m.created_at || m._created_at || ''}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Memory error:', error);
    }
}

// =============================================
// Knowledge
// =============================================
async function loadKnowledge() {
    try {
        const response = await fetch(`${API_BASE}/knowledge`);
        const items = await response.json();
        const container = document.getElementById('knowledge-list');

        if (!items.length) {
            container.innerHTML = `<div class="empty-state"><span class="empty-icon">📚</span><p>নলেজ ভল্ট খালি</p></div>`;
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="knowledge-item fade-in">
                <h4>${item.title || 'ডকুমেন্ট'}</h4>
                <p>${item.type || ''}</p>
                <div class="meta">📅 ${item.created_at || ''}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Knowledge error:', error);
    }
}

// =============================================
// Automations
// =============================================
async function loadAutomations() {
    try {
        const response = await fetch(`${API_BASE}/automations`);
        const automations = await response.json();
        const container = document.getElementById('automation-list');

        if (!automations.length) {
            container.innerHTML = `<div class="empty-state"><span class="empty-icon">⚙️</span><p>কোনো অটোমেশন নেই</p></div>`;
            return;
        }

        container.innerHTML = automations.map(auto => `
            <div class="automation-item fade-in">
                <div class="automation-info">
                    <span class="automation-icon">⚡</span>
                    <div class="automation-details">
                        <h4>${auto.name || 'অটোমেশন'}</h4>
                        <p>🕐 ${auto.trigger_config || ''} • ${auto.action_type || ''}</p>
                    </div>
                </div>
                <div class="automation-toggle ${auto.is_active ? 'active' : ''}" onclick="toggleAutomation('${auto.id}')"></div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Automations error:', error);
    }
}

async function toggleAutomation(id) {
    await fetch(`${API_BASE}/automations/${id}/toggle`, { method: 'PUT' });
    loadAutomations();
}

// =============================================
// Tools
// =============================================
async function loadTools() {
    try {
        const response = await fetch(`${API_BASE}/tools`);
        const tools = await response.json();
        const container = document.getElementById('tools-list');

        container.innerHTML = tools.map(tool => `
            <div class="tool-card fade-in">
                <div class="tool-icon">${tool.icon || '🔧'}</div>
                <h4>${tool.name}</h4>
                <p>${tool.description || ''}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Tools error:', error);
    }
}

// =============================================
// AI Settings
// =============================================
async function loadAISettings() {
    try {
        const response = await fetch(`${API_BASE}/ai/status`);
        const status = await response.json();

        const statusEl = document.querySelector('.providers-grid');
        if (statusEl) {
            document.querySelectorAll('.provider-card').forEach(card => {
                const provider = card.getAttribute('data-provider');
                if (provider === status.activeProvider) {
                    card.classList.add('active');
                    const s = card.querySelector('.provider-status');
                    if (s) { s.textContent = '✅ সক্রিয়'; s.classList.add('configured'); }
                }
            });
        }
    } catch (error) {
        console.error('AI Settings error:', error);
    }
}

async function saveAIConfig() {
    const provider = document.getElementById('ai-provider-select').value;
    const apiKey = document.getElementById('ai-api-key').value.trim();
    const model = document.getElementById('ai-model-select').value;

    if (!apiKey) { alert('অনুগ্রহ করে API Key দিন'); return; }

    try {
        const response = await fetch(`${API_BASE}/ai/configure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, apiKey, model })
        });
        const data = await response.json();
        if (data.success) {
            alert('✅ ' + data.message);
            document.getElementById('ai-api-key').value = '';
            loadAISettings();
        } else {
            alert('❌ ' + (data.error || 'ব্যর্থ'));
        }
    } catch (error) {
        alert('❌ সংযোগ ব্যর্থ');
    }
}

async function testAI() {
    const chatMessages = document.getElementById('ai-chat-messages');
    chatMessages.innerHTML += `<div class="chat-message user">🧪 টেস্ট করা হচ্ছে...</div>`;

    try {
        const response = await fetch(`${API_BASE}/ai/test`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const data = await response.json();
        if (data.success) {
            chatMessages.innerHTML += `<div class="chat-message ai">✅ সফল! ${data.response || ''}</div>`;
        } else {
            chatMessages.innerHTML += `<div class="chat-message ai" style="color: var(--danger);">❌ ${data.error || 'ব্যর্থ'}</div>`;
        }
    } catch (error) {
        chatMessages.innerHTML += `<div class="chat-message ai" style="color: var(--danger);">❌ ${error.message}</div>`;
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendAIChat() {
    const input = document.getElementById('ai-chat-input');
    const message = input.value.trim();
    if (!message) return;

    const chatMessages = document.getElementById('ai-chat-messages');
    chatMessages.innerHTML += `<div class="chat-message user">${message}</div>`;
    input.value = '';

    try {
        const response = await fetch(`${API_BASE}/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        if (data.success) {
            chatMessages.innerHTML += `<div class="chat-message ai">${data.response || 'কোনো উত্তর নেই'}</div>`;
        } else {
            chatMessages.innerHTML += `<div class="chat-message ai" style="color: var(--danger);">❌ ${data.error}</div>`;
        }
    } catch (error) {
        chatMessages.innerHTML += `<div class="chat-message ai" style="color: var(--danger);">❌ ${error.message}</div>`;
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// =============================================
// Helpers
// =============================================
function getAgentIcon(name) {
    const icons = { 'coding': '💻', 'research': '🔬', 'accounting': '💰', 'marketing': '📣', 'security': '🔒', 'content': '📝', 'data_analysis': '📊' };
    return icons[name] || '🤖';
}

function getStatusLabel(status) {
    const labels = { 'completed': 'সম্পন্ন', 'pending': 'পেন্ডিং', 'in_progress': 'চলমান', 'failed': 'ব্যর্থ', 'idle': 'প্রস্তুত' };
    return labels[status] || status || 'অজানা';
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// Keyboard shortcut: Ctrl+K
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        navigateToSection('command-center');
        setTimeout(() => { const i = document.getElementById('command-input'); if (i) i.focus(); }, 100);
    }
});
