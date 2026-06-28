// =============================================
// Tahmeed AI OS - Frontend Application
// =============================================

const API_BASE = '/api';

// =============================================
// Navigation
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    updateSystemTime();
    setInterval(updateSystemTime, 1000);
    loadDashboard();
});

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            navigateToSection(section);
        });
    });
}

function navigateToSection(sectionId) {
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNav = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Show/hide sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) targetSection.classList.add('active');

    // Update page title
    const titles = {
        'dashboard': 'ড্যাশবোর্ড',
        'command-center': 'কমান্ড সেন্টার',
        'agents': 'AI এজেন্ট',
        'tasks': 'টাস্ক',
        'memory': 'মেমরি',
        'knowledge': 'নলেজ',
        'automation': 'অটোমেশন',
        'tools': 'টুলস',
        'ai-settings': 'AI সেটিংস'
    };
    document.getElementById('page-title').textContent = titles[sectionId] || 'ড্যাশবোর্ড';

    // Load section data
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

// =============================================
// System Time
// =============================================
function updateSystemTime() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    const timeStr = now.toLocaleString('bn-BD', options);
    const el = document.getElementById('system-time');
    if (el) el.textContent = timeStr;
}

// =============================================
// Command Execution
// =============================================
async function executeCommand() {
    const input = document.getElementById('command-input');
    const command = input.value.trim();
    if (!command) return;

    const resultsPanel = document.getElementById('command-results');
    resultsPanel.innerHTML = `<div class="result-item fade-in">
        <div class="result-time">${new Date().toLocaleTimeString('bn-BD')}</div>
        <div class="result-content"><span class="loading-spinner"></span> প্রক্রিয়াকরণ হচ্ছে...</div>
    </div>`;

    try {
        const response = await fetch(`${API_BASE}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
        });
        const data = await response.json();

        resultsPanel.innerHTML = `<div class="result-item fade-in">
            <div class="result-time">${new Date().toLocaleTimeString('bn-BD')}</div>
            <div class="result-content">${formatResult(data)}</div>
        </div>` + resultsPanel.innerHTML.replace(/<div class="result-item fade-in">.*?<\/div>\s*<\/div>/, '');

        input.value = '';
    } catch (error) {
        resultsPanel.innerHTML = `<div class="result-item fade-in">
            <div class="result-time">${new Date().toLocaleTimeString('bn-BD')}</div>
            <div class="result-content" style="color: var(--danger);">❌ ত্রুটি: ${error.message}</div>
        </div>`;
    }
}

function formatResult(data) {
    if (data.error) return `<span style="color: var(--danger);">❌ ${data.error}</span>`;
    if (data.result) return data.result;
    if (data.message) return data.message;
    return JSON.stringify(data, null, 2);
}

function fillCommand(text) {
    const input = document.getElementById('command-input');
    input.value = text;
    input.focus();
}

// =============================================
// Dashboard
// =============================================
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/dashboard`);
        const data = await response.json();

        // Agents is an array from API
        const agentCount = Array.isArray(data.agents) ? data.agents.length : (data.agents || 0);
        document.getElementById('stat-agents').textContent = agentCount;
        document.getElementById('stat-completed').textContent = data.tasks?.completed || data.completedTasks || 0;
        document.getElementById('stat-pending').textContent = data.tasks?.pending || data.pendingTasks || 0;
        document.getElementById('stat-memory').textContent = data.memory?.total || data.memoryItems || 0;

        // Render agent cards
        const agents = Array.isArray(data.agents) ? data.agents : [];
        if (agents.length > 0) {
            renderAgentCards(agents, 'agents-grid');
        }
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

// =============================================
// Agents
// =============================================
async function loadAgents() {
    try {
        const response = await fetch(`${API_BASE}/agents`);
        const data = await response.json();
        const agents = data.agents || data || [];
        renderAgentCards(agents, 'agents-list');
        renderAgentCards(agents, 'agents-grid');
    } catch (error) {
        console.error('Agents load error:', error);
        document.getElementById('agents-list').innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">⚠️</span>
                <p>এজেন্ট লোড করতে ব্যর্থ</p>
            </div>`;
    }
}

function renderAgentCards(agents, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!agents || agents.length === 0) {
        container.innerHTML = `<div class="empty-state">
            <span class="empty-icon">🤖</span>
            <p>কোনো এজেন্ট পাওয়া যায়নি</p>
        </div>`;
        return;
    }

    container.innerHTML = agents.map(agent => `
        <div class="agent-card fade-in">
            <div class="agent-card-header">
                <div class="agent-avatar">${getAgentIcon(agent.type || agent.name)}</div>
                <div class="agent-info">
                    <h4>${agent.name || 'Unknown Agent'}</h4>
                    <div class="agent-status">
                        <span class="status-dot ${agent.status === 'active' ? 'online' : ''}"></span>
                        <span>${getStatusLabel(agent.status)}</span>
                    </div>
                </div>
            </div>
            <p class="agent-description">${agent.description || 'কোনো বিবরণ নেই'}</p>
            <div class="agent-capabilities">
                ${(agent.capabilities || []).map(cap => `<span class="capability-tag">${cap}</span>`).join('')}
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
        const data = await response.json();
        const tasks = data.tasks || data || [];

        const container = document.getElementById('tasks-list');
        if (tasks.length === 0) {
            container.innerHTML = `<div class="empty-state">
                <span class="empty-icon">📋</span>
                <p>কোনো টাস্ক নেই</p>
            </div>`;
            return;
        }

        container.innerHTML = tasks.map(task => `
            <div class="task-item fade-in">
                <div class="task-left">
                    <span class="task-status-icon">${task.status === 'completed' ? '✅' : task.status === 'running' ? '⚡' : '⏳'}</span>
                    <div>
                        <div class="task-title">${task.title || task.command || 'Unknown Task'}</div>
                        <div class="task-meta">${task.agent || ''} • ${task.createdAt ? new Date(task.createdAt).toLocaleString('bn-BD') : ''}</div>
                    </div>
                </div>
                <span class="task-badge ${task.status || 'pending'}">${getStatusLabel(task.status)}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Tasks load error:', error);
    }
}

// =============================================
// Memory
// =============================================
async function loadMemory() {
    try {
        const response = await fetch(`${API_BASE}/memory`);
        const data = await response.json();
        const memories = data.memories || data || [];

        const container = document.getElementById('memory-list');
        if (memories.length === 0) {
            container.innerHTML = `<div class="empty-state">
                <span class="empty-icon">💾</span>
                <p>মেমরি খালি</p>
            </div>`;
            return;
        }

        container.innerHTML = memories.map(mem => `
            <div class="memory-item fade-in">
                <h4>${mem.key || mem.title || 'মেমরি আইটেম'}</h4>
                <p>${mem.value || mem.content || ''}</p>
                <div class="meta">📅 ${mem.timestamp ? new Date(mem.timestamp).toLocaleString('bn-BD') : 'Unknown'} • 🏷️ ${mem.category || 'general'}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Memory load error:', error);
    }
}

// =============================================
// Knowledge
// =============================================
async function loadKnowledge() {
    try {
        const response = await fetch(`${API_BASE}/knowledge`);
        const data = await response.json();
        const items = data.items || data || [];

        const container = document.getElementById('knowledge-list');
        if (items.length === 0) {
            container.innerHTML = `<div class="empty-state">
                <span class="empty-icon">📚</span>
                <p>নলেজ ভল্ট খালি</p>
            </div>`;
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="knowledge-item fade-in">
                <h4>${item.title || 'নলেজ আইটেম'}</h4>
                <p>${item.content || item.summary || ''}</p>
                <div class="meta">📅 ${item.createdAt ? new Date(item.createdAt).toLocaleString('bn-BD') : ''} • 🏷️ ${item.category || ''}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Knowledge load error:', error);
    }
}

// =============================================
// Automations
// =============================================
async function loadAutomations() {
    try {
        const response = await fetch(`${API_BASE}/automations`);
        const data = await response.json();
        const automations = data.automations || data || [];

        const container = document.getElementById('automation-list');
        if (automations.length === 0) {
            container.innerHTML = `<div class="empty-state">
                <span class="empty-icon">⚙️</span>
                <p>কোনো অটোমেশন সেটআপ হয়নি</p>
            </div>`;
            return;
        }

        container.innerHTML = automations.map(auto => `
            <div class="automation-item fade-in">
                <div class="automation-info">
                    <span class="automation-icon">⚙️</span>
                    <div class="automation-details">
                        <h4>${auto.name || 'অটোমেশন'}</h4>
                        <p>${auto.trigger || auto.description || ''} • ${auto.schedule || ''}</p>
                    </div>
                </div>
                <div class="automation-toggle ${auto.active ? 'active' : ''}" onclick="toggleAutomation('${auto.id}')"></div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Automations load error:', error);
    }
}

async function toggleAutomation(id) {
    try {
        await fetch(`${API_BASE}/automations/${id}/toggle`, { method: 'POST' });
        loadAutomations();
    } catch (error) {
        console.error('Toggle automation error:', error);
    }
}

// =============================================
// Tools
// =============================================
async function loadTools() {
    try {
        const response = await fetch(`${API_BASE}/tools`);
        const data = await response.json();
        const tools = data.tools || data || [];

        const container = document.getElementById('tools-list');
        if (tools.length === 0) {
            container.innerHTML = `<div class="empty-state">
                <span class="empty-icon">🔧</span>
                <p>কোনো টুল পাওয়া যায়নি</p>
            </div>`;
            return;
        }

        container.innerHTML = tools.map(tool => `
            <div class="tool-card fade-in">
                <div class="tool-icon">${tool.icon || '🔧'}</div>
                <h4>${tool.name || 'টুল'}</h4>
                <p>${tool.description || ''}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Tools load error:', error);
    }
}

// =============================================
// AI Settings
// =============================================
async function loadAISettings() {
    try {
        const response = await fetch(`${API_BASE}/ai/settings`);
        const data = await response.json();

        if (data.provider) {
            document.getElementById('ai-provider-select').value = data.provider;
        }
        if (data.model) {
            document.getElementById('ai-model-select').value = data.model;
        }

        // Update provider statuses
        ['openai', 'gemini', 'claude'].forEach(provider => {
            const statusEl = document.getElementById(`status-${provider}`);
            const card = document.querySelector(`[data-provider="${provider}"]`);
            if (data.configured && data.configured.includes(provider)) {
                if (statusEl) {
                    statusEl.textContent = 'কনফিগার করা হয়েছে ✓';
                    statusEl.classList.add('configured');
                }
                if (card) card.classList.add('active');
            } else {
                if (statusEl) {
                    statusEl.textContent = 'কনফিগার করা হয়নি';
                    statusEl.classList.remove('configured');
                }
                if (card) card.classList.remove('active');
            }
        });
    } catch (error) {
        console.error('AI Settings load error:', error);
    }
}

async function saveAIConfig() {
    const provider = document.getElementById('ai-provider-select').value;
    const apiKey = document.getElementById('ai-api-key').value.trim();
    const model = document.getElementById('ai-model-select').value;

    if (!apiKey) {
        alert('অনুগ্রহ করে API Key দিন');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/ai/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, apiKey, model })
        });
        const data = await response.json();

        if (data.success) {
            alert('✅ AI কনফিগারেশন সংরক্ষিত হয়েছে!');
            document.getElementById('ai-api-key').value = '';
            loadAISettings();
        } else {
            alert('❌ সংরক্ষণ ব্যর্থ: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        alert('❌ ত্রুটি: ' + error.message);
    }
}

async function testAI() {
    const chatMessages = document.getElementById('ai-chat-messages');
    chatMessages.innerHTML += `<div class="chat-message user">🧪 সংযোগ পরীক্ষা করা হচ্ছে...</div>`;

    try {
        const response = await fetch(`${API_BASE}/ai/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        if (data.success) {
            chatMessages.innerHTML += `<div class="chat-message ai">✅ AI সংযোগ সফল! মডেল: ${data.model || 'N/A'}</div>`;
        } else {
            chatMessages.innerHTML += `<div class="chat-message ai" style="color: var(--danger);">❌ সংযোগ ব্যর্থ: ${data.error || 'Unknown error'}</div>`;
        }
    } catch (error) {
        chatMessages.innerHTML += `<div class="chat-message ai" style="color: var(--danger);">❌ ত্রুটি: ${error.message}</div>`;
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

        chatMessages.innerHTML += `<div class="chat-message ai">${data.reply || data.message || 'কোনো উত্তর পাওয়া যায়নি'}</div>`;
    } catch (error) {
        chatMessages.innerHTML += `<div class="chat-message ai" style="color: var(--danger);">❌ ত্রুটি: ${error.message}</div>`;
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// =============================================
// Helper Functions
// =============================================
function getAgentIcon(type) {
    const icons = {
        'research': '🔬',
        'research-agent': '🔬',
        'coding': '💻',
        'coding-agent': '💻',
        'content': '📝',
        'content-agent': '📝',
        'marketing': '📣',
        'marketing-agent': '📣',
        'data-analysis': '📊',
        'data-analysis-agent': '📊',
        'security': '🔒',
        'security-agent': '🔒',
        'accounting': '💰',
        'accounting-agent': '💰'
    };
    const key = (type || '').toLowerCase();
    return icons[key] || '🤖';
}

function getStatusLabel(status) {
    const labels = {
        'active': 'সক্রিয়',
        'idle': 'নিষ্ক্রিয়',
        'busy': 'ব্যস্ত',
        'offline': 'অফলাইন',
        'completed': 'সম্পন্ন',
        'pending': 'পেন্ডিং',
        'running': 'চলমান',
        'failed': 'ব্যর্থ'
    };
    return labels[status] || status || 'অজানা';
}

// =============================================
// Keyboard Shortcuts
// =============================================
document.addEventListener('keydown', (e) => {
    // Ctrl+K - Focus command input
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        navigateToSection('command-center');
        setTimeout(() => {
            const input = document.getElementById('command-input');
            if (input) input.focus();
        }, 100);
    }
});
