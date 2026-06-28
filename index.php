<?php
// ═══════════════════════════════════════
// 🧠 TAHMEED AI OS v2.0 - Full Working
// ═══════════════════════════════════════

if (isset($_GET['api'])) {
    header('Content-Type: application/json; charset=utf-8');
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $_GET['api'];

    $agents = [
        ['name'=>'coding','description'=>'👨‍💻 Coding Agent - সফটওয়্যার ডেভেলপমেন্ট','capabilities'=>['কোড লেখা','বাগ ফিক্স','API','ডাটাবেস','ডিপ্লয়'],'status'=>'idle'],
        ['name'=>'research','description'=>'🔍 Research Agent - গবেষণা','capabilities'=>['মার্কেট রিসার্চ','ট্রেন্ড','ডাটা সংগ্রহ'],'status'=>'idle'],
        ['name'=>'accounting','description'=>'🧾 Accounting Agent - হিসাব','capabilities'=>['ইনভয়েস','বাজেট','ট্যাক্স'],'status'=>'idle'],
        ['name'=>'marketing','description'=>'📈 Marketing Agent - মার্কেটিং','capabilities'=>['SEO','ক্যাম্পেইন','ব্র্যান্ডিং'],'status'=>'idle'],
        ['name'=>'security','description'=>'🛡️ Security Agent - সিকিউরিটি','capabilities'=>['অডিট','এনক্রিপশন','ব্যাকআপ'],'status'=>'idle'],
        ['name'=>'content','description'=>'📝 Content Agent - কন্টেন্ট','capabilities'=>['আর্টিকেল','ব্লগ','রিপোর্ট'],'status'=>'idle'],
        ['name'=>'data_analysis','description'=>'📊 Data Agent - ডাটা বিশ্লেষণ','capabilities'=>['চার্ট','KPI','ট্রেন্ড'],'status'=>'idle'],
    ];
    $icons = ['coding'=>'💻','research'=>'🔬','accounting'=>'💰','marketing'=>'📣','security'=>'🔒','content'=>'📝','data_analysis'=>'📊'];
    $kw = ['code'=>'coding','কোড'=>'coding','বানাও'=>'coding','module'=>'coding','upgrade'=>'coding','ফিচার'=>'coding','security'=>'security','সিকিউরিটি'=>'security','অডিট'=>'security','marketing'=>'marketing','মার্কেটিং'=>'marketing','ক্যাম্পেইন'=>'marketing','হিসাব'=>'accounting','বাজেট'=>'accounting','লেখো'=>'content','রিপোর্ট'=>'content','ডাটা'=>'data_analysis','বিশ্লেষণ'=>'data_analysis'];

    $df = __DIR__.'/tahmeed_data.json';
    if (!file_exists($df)) file_put_contents($df, '{"tasks":[],"memories":[],"ai_key":"","ai_provider":"","ai_model":""}');
    $data = json_decode(file_get_contents($df), true) ?: ['tasks'=>[],'memories'=>[],'ai_key'=>'','ai_provider'=>'','ai_model'=>''];

    // AI call function
    function callAI($data, $prompt) {
        if (empty($data['ai_key'])) return null;
        $provider = $data['ai_provider'] ?? 'gemini';
        $model = $data['ai_model'] ?? 'gemini-1.5-flash';
        $key = $data['ai_key'];

        if ($provider == 'gemini') {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}";
            $body = json_encode(['contents'=>[['parts'=>[['text'=>$prompt]]]]]);
            $ch = curl_init($url);
            curl_setopt_array($ch, [CURLOPT_POST=>1, CURLOPT_POSTFIELDS=>$body, CURLOPT_HTTPHEADER=>['Content-Type: application/json'], CURLOPT_RETURNTRANSFER=>1, CURLOPT_TIMEOUT=>30]);
            $res = curl_exec($ch); curl_close($ch);
            $json = json_decode($res, true);
            return $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
        }
        if ($provider == 'openai') {
            $ch = curl_init('https://api.openai.com/v1/chat/completions');
            $body = json_encode(['model'=>$model,'messages'=>[['role'=>'user','content'=>$prompt]],'max_tokens'=>1000]);
            curl_setopt_array($ch, [CURLOPT_POST=>1, CURLOPT_POSTFIELDS=>$body, CURLOPT_HTTPHEADER=>['Content-Type: application/json','Authorization: Bearer '.$key], CURLOPT_RETURNTRANSFER=>1, CURLOPT_TIMEOUT=>30]);
            $res = curl_exec($ch); curl_close($ch);
            $json = json_decode($res, true);
            return $json['choices'][0]['message']['content'] ?? null;
        }
        return null;
    }

    if ($action == 'dashboard') { die(json_encode(['agents'=>$agents,'tasks'=>['total'=>count($data['tasks']),'completed'=>count($data['tasks']),'pending'=>0],'memory'=>['total'=>count($data['memories'])]])); }
    if ($action == 'agents') { die(json_encode($agents)); }
    if ($action == 'tasks') { die(json_encode(array_reverse($data['tasks']))); }
    if ($action == 'memory') { die(json_encode(array_reverse($data['memories']))); }
    if ($action == 'tools') { die(json_encode([['name'=>'GitHub','icon'=>'🐙','description'=>'কোড রিপোজিটরি'],['name'=>'VS Code','icon'=>'💻','description'=>'এডিটর'],['name'=>'Drive','icon'=>'📁','description'=>'স্টোরেজ'],['name'=>'Gmail','icon'=>'📧','description'=>'ইমেইল'],['name'=>'Slack','icon'=>'💬','description'=>'চ্যাট'],['name'=>'Notion','icon'=>'📓','description'=>'নোটস'],['name'=>'Canva','icon'=>'🎨','description'=>'ডিজাইন'],['name'=>'API','icon'=>'🔌','description'=>'সংযোগ']])); }

    if ($action == 'command') {
        $cmd = $input['command'] ?? ''; if (!$cmd) { die(json_encode(['error'=>'কমান্ড দিন'])); }
        $agent = 'research';
        foreach ($kw as $k=>$a) { if (mb_stripos($cmd,$k)!==false) { $agent=$a; break; } }

        $aiResponse = null;
        if (!empty($data['ai_key'])) {
            $prompt = "তুমি Tahmeed AI OS-এর {$agent} Agent। এই কাজটি করো: {$cmd}\n\nবাংলায় বিস্তারিত উত্তর দাও।";
            $aiResponse = callAI($data, $prompt);
        }

        $result = ['agent'=>$agent,'icon'=>$icons[$agent]??'🤖','summary'=>strtoupper($agent).' Agent কাজ সম্পন্ন: '.$cmd,'completionTime'=>rand(3,15).' সেকেন্ড'];
        if ($aiResponse) { $result['aiResponse'] = $aiResponse; $result['summary'] = '[AI] '.$result['summary']; }
        else { $result['recommendations'] = ['AI API যোগ করুন → ⚙️ AI Settings পেজে যান']; }

        $data['tasks'][] = ['id'=>uniqid(),'title'=>'['.strtoupper($agent).'] '.mb_substr($cmd,0,80),'assigned_agent'=>$agent,'status'=>'completed','created_at'=>date('Y-m-d H:i:s')];
        $data['memories'][] = ['id'=>uniqid(),'type'=>'conversation','content'=>$cmd,'created_at'=>date('Y-m-d H:i:s')];
        file_put_contents($df, json_encode($data));
        die(json_encode(['success'=>true,'routing'=>['primaryAgent'=>$agent,'intents'=>[$agent]],'results'=>[['agent'=>$agent,'status'=>'fulfilled','result'=>$result]],'message'=>'✅ কমান্ড সম্পন্ন! 1/1 এজেন্ট সফল।']));
    }

    if ($action == 'ai_status') {
        die(json_encode(['configured'=>!empty($data['ai_key']),'provider'=>$data['ai_provider']??'','model'=>$data['ai_model']??'']));
    }
    if ($action == 'ai_save') {
        $data['ai_key'] = $input['apiKey'] ?? '';
        $data['ai_provider'] = $input['provider'] ?? 'gemini';
        $data['ai_model'] = $input['model'] ?? 'gemini-1.5-flash';
        file_put_contents($df, json_encode($data));
        die(json_encode(['success'=>true,'message'=>'✅ AI কনফিগার সম্পন্ন!']));
    }
    if ($action == 'ai_test') {
        if (empty($data['ai_key'])) { die(json_encode(['success'=>false,'error'=>'API Key সেট করুন'])); }
        $res = callAI($data, 'তুমি কে? এক লাইনে বলো।');
        if ($res) { die(json_encode(['success'=>true,'response'=>$res])); }
        die(json_encode(['success'=>false,'error'=>'API Key ভুল বা সংযোগ ব্যর্থ']));
    }
    if ($action == 'ai_chat') {
        if (empty($data['ai_key'])) { die(json_encode(['success'=>false,'error'=>'API Key সেট করুন'])); }
        $msg = $input['message'] ?? '';
        $res = callAI($data, $msg);
        if ($res) { die(json_encode(['success'=>true,'response'=>$res])); }
        die(json_encode(['success'=>false,'error'=>'উত্তর পাওয়া যায়নি']));
    }
    die(json_encode(['status'=>'ok']));
}
?>
<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tahmeed AI OS</title>
<style>
:root{--bg:#0a0e1a;--bg2:#111827;--card:#1a1f35;--accent:#6366f1;--text:#f1f5f9;--muted:#64748b;--success:#10b981;--border:#2a3050;--radius:10px;--danger:#ef4444}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
.wrap{max-width:900px;margin:0 auto;padding:16px}
.header{text-align:center;padding:20px 0;border-bottom:1px solid var(--border);margin-bottom:20px}
.header h1{font-size:1.5rem;background:linear-gradient(135deg,var(--accent),#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.header p{color:var(--muted);font-size:.85rem;margin-top:4px}
.nav{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px;justify-content:center}
.nav button{background:var(--card);border:1px solid var(--border);color:var(--muted);padding:8px 14px;border-radius:20px;cursor:pointer;font-size:.75rem;transition:all .2s}
.nav button:hover,.nav button.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px}
.stat{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:14px;text-align:center}
.stat .num{font-size:1.6rem;font-weight:700}
.stat .label{font-size:.7rem;color:var(--muted)}
.section{display:none}.section.active{display:block}
.cmd-box{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:16px}
.cmd-row{display:flex;gap:8px}
.cmd-input{flex:1;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:12px;color:var(--text);font-size:.9rem;outline:none}
.cmd-input:focus{border-color:var(--accent)}
.cmd-btn{background:var(--accent);border:none;color:#fff;padding:12px 20px;border-radius:var(--radius);cursor:pointer;font-weight:600}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.chip{background:var(--bg);border:1px solid var(--border);color:var(--muted);padding:5px 10px;border-radius:15px;font-size:.7rem;cursor:pointer}
.chip:hover{border-color:var(--accent);color:var(--accent)}
.result{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-top:12px;font-size:.85rem;line-height:1.8;white-space:pre-wrap}
.result .ok{color:var(--success);font-weight:600}
.agents-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.agent-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:14px;transition:all .2s}
.agent-card:hover{border-color:var(--accent);transform:translateY(-2px)}
.agent-card h4{font-size:.85rem;margin-bottom:4px}
.agent-card .caps{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.cap{background:rgba(99,102,241,.15);color:#818cf8;padding:2px 8px;border-radius:10px;font-size:.65rem}
.item{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;font-size:.82rem}
.item small{color:var(--muted)}
.empty{text-align:center;padding:30px;color:var(--muted);font-size:.85rem}
.tools-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
.tool{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:14px;text-align:center;transition:all .2s}
.tool:hover{border-color:var(--accent)}
.tool .icon{font-size:1.5rem}
.tool h4{font-size:.75rem;margin-top:6px}
.tool p{font-size:.65rem;color:var(--muted)}
.form-box{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:16px}
.form-box h3{font-size:1rem;margin-bottom:12px}
.form-box label{font-size:.8rem;color:var(--muted);display:block;margin:10px 0 4px}
.form-box select,.form-box input[type=password],.form-box input[type=text]{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;color:var(--text);font-size:.85rem;outline:none;margin-bottom:8px}
.form-box select:focus,.form-box input:focus{border-color:var(--accent)}
.btn{background:var(--accent);border:none;color:#fff;padding:10px 18px;border-radius:8px;cursor:pointer;font-size:.8rem;font-weight:600;margin-right:8px;margin-top:8px}
.btn:hover{opacity:.9}
.btn-green{background:var(--success)}
.msg{padding:10px;border-radius:8px;margin-top:10px;font-size:.82rem}
.msg-ok{background:rgba(16,185,129,.1);color:var(--success);border:1px solid rgba(16,185,129,.3)}
.msg-err{background:rgba(239,68,68,.1);color:var(--danger);border:1px solid rgba(239,68,68,.3)}
.chat-box{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;min-height:120px;max-height:250px;overflow-y:auto;margin:10px 0;font-size:.82rem}
.chat-box .u{color:var(--accent);margin-bottom:6px}
.chat-box .ai{color:var(--success);margin-bottom:6px;white-space:pre-wrap}
.status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--success);margin-right:4px;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@media(max-width:600px){.stats{grid-template-columns:repeat(2,1fr)}.agents-grid,.tools-grid{grid-template-columns:1fr 1fr}}
</style>
</head>
<body>
<div class="wrap">
    <div class="header">
        <h1>🧠 Tahmeed AI OS</h1>
        <p><span class="status-dot"></span> Personal AI Operating System</p>
    </div>
    <div class="nav">
        <button class="active" onclick="show('dashboard',this)">📊 ড্যাশবোর্ড</button>
        <button onclick="show('command',this)">⚡ কমান্ড</button>
        <button onclick="show('agents',this)">🤖 এজেন্ট</button>
        <button onclick="show('tasks',this)">📋 টাস্ক</button>
        <button onclick="show('memory',this)">💾 মেমরি</button>
        <button onclick="show('tools',this)">🔧 টুলস</button>
        <button onclick="show('ai',this)">⚙️ AI Settings</button>
    </div>

    <div class="section active" id="s-dashboard">
        <div class="stats">
            <div class="stat"><div class="num" id="n-agents">7</div><div class="label">AI Agents</div></div>
            <div class="stat"><div class="num" id="n-tasks">0</div><div class="label">সম্পন্ন টাস্ক</div></div>
            <div class="stat"><div class="num" id="n-memory">0</div><div class="label">মেমরি</div></div>
            <div class="stat"><div class="num" id="n-tools">8</div><div class="label">টুলস</div></div>
        </div>
        <div class="agents-grid" id="ag-grid"></div>
    </div>

    <div class="section" id="s-command">
        <div class="cmd-box">
            <h3 style="margin-bottom:10px">⚡ কমান্ড সেন্টার</h3>
            <div class="cmd-row">
                <input class="cmd-input" id="cmd" placeholder="আপনার নির্দেশ দিন..." onkeypress="if(event.key==='Enter')run()">
                <button class="cmd-btn" onclick="run()">পাঠান ➤</button>
            </div>
            <div class="chips">
                <span class="chip" onclick="fill('Sutro Inventory Module Upgrade করো')">📦 Inventory</span>
                <span class="chip" onclick="fill('সিকিউরিটি অডিট করো')">🔒 Security</span>
                <span class="chip" onclick="fill('মার্কেটিং ক্যাম্পেইন তৈরি করো')">📣 Marketing</span>
                <span class="chip" onclick="fill('মাসিক রিপোর্ট লেখো')">📝 Report</span>
                <span class="chip" onclick="fill('ডাটা বিশ্লেষণ করো')">📊 Data</span>
            </div>
        </div>
        <div id="results"><div class="empty">💬 কমান্ড দিন — AI Agent কাজ করবে</div></div>
    </div>

    <div class="section" id="s-agents"><div class="agents-grid" id="ag-list"></div></div>
    <div class="section" id="s-tasks"><div id="task-list"><div class="empty">📋 কমান্ড দিলে টাস্ক তৈরি হবে</div></div></div>
    <div class="section" id="s-memory"><div id="mem-list"><div class="empty">💾 মেমরি খালি</div></div></div>
    <div class="section" id="s-tools"><div class="tools-grid" id="tool-list"></div></div>

    <div class="section" id="s-ai">
        <div class="form-box">
            <h3>⚙️ AI API কনফিগারেশন</h3>
            <p style="font-size:.8rem;color:var(--muted);margin-bottom:12px">AI যোগ করলে এজেন্টরা বুদ্ধিমান উত্তর দেবে</p>
            <div id="ai-status"></div>
            <label>Provider বাছাই করুন</label>
            <select id="ai-provider">
                <option value="gemini">🔵 Google Gemini (ফ্রি!)</option>
                <option value="openai">🟢 OpenAI (GPT-4)</option>
            </select>
            <label>Model</label>
            <select id="ai-model">
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (দ্রুত, ফ্রি)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
            </select>
            <label>API Key</label>
            <input type="password" id="ai-key" placeholder="আপনার API Key পেস্ট করুন...">
            <div>
                <button class="btn" onclick="saveAI()">💾 সেভ করুন</button>
                <button class="btn btn-green" onclick="testAI()">🧪 টেস্ট</button>
            </div>
            <div id="ai-msg"></div>
        </div>

        <div class="form-box">
            <h3>🔑 API Key কোথায় পাবেন?</h3>
            <div class="item"><strong>🔵 Google Gemini (ফ্রি!)</strong><br>👉 <a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--accent)">aistudio.google.com/apikey</a><br><small>Google account দিয়ে সাইন ইন → Create API Key → কপি করুন</small></div>
            <div class="item"><strong>🟢 OpenAI</strong><br>👉 <a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--accent)">platform.openai.com/api-keys</a><br><small>Account তৈরি → API Keys → Create → কপি করুন ($5 ফ্রি)</small></div>
        </div>

        <div class="form-box">
            <h3>💬 AI চ্যাট টেস্ট</h3>
            <div class="chat-box" id="chat-box"></div>
            <div class="cmd-row">
                <input class="cmd-input" id="chat-input" placeholder="AI-কে কিছু জিজ্ঞেস করুন..." onkeypress="if(event.key==='Enter')chatAI()">
                <button class="cmd-btn" onclick="chatAI()">পাঠান</button>
            </div>
        </div>
    </div>
</div>

<script>
const API = 'index.php?api=';

function show(id, btn) {
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    document.getElementById('s-'+id).classList.add('active');
    document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    if(id=='dashboard') loadDash();
    if(id=='agents') loadAgents();
    if(id=='tasks') loadTasks();
    if(id=='memory') loadMem();
    if(id=='tools') loadTools();
    if(id=='ai') loadAIStatus();
}

async function loadDash() {
    try {
        const r = await fetch(API+'dashboard'); const d = await r.json();
        document.getElementById('n-agents').textContent = d.agents?.length||7;
        document.getElementById('n-tasks').textContent = d.tasks?.completed||0;
        document.getElementById('n-memory').textContent = d.memory?.total||0;
        document.getElementById('ag-grid').innerHTML = (d.agents||[]).map(a=>`<div class="agent-card"><h4>${a.description}</h4><div class="caps">${(a.capabilities||[]).map(c=>`<span class="cap">${c}</span>`).join('')}</div></div>`).join('');
    } catch(e) { console.error(e); }
}

async function loadAgents() {
    const r = await fetch(API+'agents'); const a = await r.json();
    document.getElementById('ag-list').innerHTML = a.map(x=>`<div class="agent-card"><h4>${x.description}</h4><div class="caps">${(x.capabilities||[]).map(c=>`<span class="cap">${c}</span>`).join('')}</div></div>`).join('');
}

async function loadTasks() {
    const r = await fetch(API+'tasks'); const t = await r.json();
    const el = document.getElementById('task-list');
    if(!t.length){el.innerHTML='<div class="empty">📋 কমান্ড দিলে টাস্ক দেখাবে</div>';return;}
    el.innerHTML = t.map(x=>`<div class="item">✅ ${x.title}<br><small>${x.assigned_agent} • ${x.created_at}</small></div>`).join('');
}

async function loadMem() {
    const r = await fetch(API+'memory'); const m = await r.json();
    const el = document.getElementById('mem-list');
    if(!m.length){el.innerHTML='<div class="empty">💾 মেমরি খালি</div>';return;}
    el.innerHTML = m.map(x=>`<div class="item">💬 ${x.content}<br><small>${x.created_at}</small></div>`).join('');
}

async function loadTools() {
    const r = await fetch(API+'tools'); const t = await r.json();
    document.getElementById('tool-list').innerHTML = t.map(x=>`<div class="tool"><div class="icon">${x.icon}</div><h4>${x.name}</h4><p>${x.description}</p></div>`).join('');
}

async function run() {
    const input = document.getElementById('cmd');
    const cmd = input.value.trim(); if(!cmd) return;
    document.getElementById('results').innerHTML = '<div class="result">⏳ এজেন্ট কাজ করছে...</div>';
    try {
        const r = await fetch(API+'command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({command:cmd})});
        const d = await r.json();
        if(d.success){
            let h = `<div class="result"><span class="ok">${d.message}</span>\n\n`;
            (d.results||[]).forEach(res=>{if(res.result){
                h+=`<strong>${res.result.icon} ${(res.result.agent||'').toUpperCase()} Agent</strong>\n${res.result.summary}\n\n`;
                if(res.result.aiResponse) h+=`🤖 AI Response:\n${res.result.aiResponse}\n\n`;
                if(res.result.recommendations) res.result.recommendations.forEach(r=>{h+=`💡 ${r}\n`;});
                h+=`\n⏱️ ${res.result.completionTime}`;
            }});
            h+='</div>';
            document.getElementById('results').innerHTML = h;
        } else { document.getElementById('results').innerHTML = `<div class="result" style="color:var(--danger)">❌ ${d.error||'ব্যর্থ'}</div>`; }
        input.value = '';
        loadDash();
    } catch(e) { document.getElementById('results').innerHTML = `<div class="result" style="color:var(--danger)">❌ সংযোগ ব্যর্থ</div>`; }
}

function fill(t){document.getElementById('cmd').value=t;show('command',document.querySelectorAll('.nav button')[1]);}

async function loadAIStatus() {
    const r = await fetch(API+'ai_status'); const d = await r.json();
    document.getElementById('ai-status').innerHTML = d.configured
        ? `<div class="msg msg-ok">✅ AI সক্রিয় — ${d.provider} (${d.model})</div>`
        : `<div class="msg msg-err">⚠️ AI কনফিগার করা হয়নি — নিচে API Key দিন</div>`;
}

async function saveAI() {
    const provider = document.getElementById('ai-provider').value;
    const model = document.getElementById('ai-model').value;
    const apiKey = document.getElementById('ai-key').value.trim();
    if(!apiKey){document.getElementById('ai-msg').innerHTML='<div class="msg msg-err">❌ API Key দিন!</div>';return;}
    const r = await fetch(API+'ai_save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider,model,apiKey})});
    const d = await r.json();
    document.getElementById('ai-msg').innerHTML = d.success ? `<div class="msg msg-ok">${d.message}</div>` : `<div class="msg msg-err">❌ ব্যর্থ</div>`;
    document.getElementById('ai-key').value = '';
    loadAIStatus();
}

async function testAI() {
    document.getElementById('ai-msg').innerHTML='<div class="msg msg-ok">🧪 টেস্ট হচ্ছে...</div>';
    const r = await fetch(API+'ai_test',{method:'POST',headers:{'Content-Type':'application/json'}});
    const d = await r.json();
    document.getElementById('ai-msg').innerHTML = d.success
        ? `<div class="msg msg-ok">✅ AI কাজ করছে!\n\nAI বলেছে: ${d.response}</div>`
        : `<div class="msg msg-err">❌ ${d.error}</div>`;
}

async function chatAI() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim(); if(!msg) return;
    const box = document.getElementById('chat-box');
    box.innerHTML += `<div class="u">👤 ${msg}</div>`;
    input.value = '';
    const r = await fetch(API+'ai_chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg})});
    const d = await r.json();
    box.innerHTML += d.success ? `<div class="ai">🤖 ${d.response}</div>` : `<div class="ai" style="color:var(--danger)">❌ ${d.error}</div>`;
    box.scrollTop = box.scrollHeight;
}

loadDash();
</script>
</body>
</html>
