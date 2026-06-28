<?php
// ═══════════════════════════════════════════════════════
// 🧠 TAHMEED AI OS - Single File Version
// এই একটি ফাইলেই সব আছে! শুধু upload করুন।
// ═══════════════════════════════════════════════════════

// API Handler
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
        ['name'=>'data_analysis','description'=>'📊 Data Analysis Agent - ডাটা','capabilities'=>['চার্ট','KPI','ট্রেন্ড'],'status'=>'idle'],
    ];

    $icons = ['coding'=>'💻','research'=>'🔬','accounting'=>'💰','marketing'=>'📣','security'=>'🔒','content'=>'📝','data_analysis'=>'📊'];
    $kw = ['code'=>'coding','কোড'=>'coding','বানাও'=>'coding','module'=>'coding','upgrade'=>'coding','ফিচার'=>'coding','security'=>'security','সিকিউরিটি'=>'security','অডিট'=>'security','marketing'=>'marketing','মার্কেটিং'=>'marketing','ক্যাম্পেইন'=>'marketing','হিসাব'=>'accounting','বাজেট'=>'accounting','লেখো'=>'content','রিপোর্ট'=>'content','ডাটা'=>'data_analysis','বিশ্লেষণ'=>'data_analysis'];

    $df = __DIR__.'/tahmeed_data.json';
    if (!file_exists($df)) file_put_contents($df, '{"tasks":[],"memories":[]}');
    $data = json_decode(file_get_contents($df), true) ?: ['tasks'=>[],'memories'=>[]];

    if ($action == 'dashboard') {
        die(json_encode(['agents'=>$agents,'tasks'=>['total'=>count($data['tasks']),'completed'=>count($data['tasks']),'pending'=>0],'memory'=>['total'=>count($data['memories'])]]));
    }
    if ($action == 'agents') { die(json_encode($agents)); }
    if ($action == 'tasks') { die(json_encode(array_reverse($data['tasks']))); }
    if ($action == 'memory') { die(json_encode(array_reverse($data['memories']))); }
    if ($action == 'tools') { die(json_encode([['name'=>'GitHub','icon'=>'🐙','description'=>'কোড'],['name'=>'VS Code','icon'=>'💻','description'=>'এডিটর'],['name'=>'Drive','icon'=>'📁','description'=>'স্টোরেজ'],['name'=>'Gmail','icon'=>'📧','description'=>'ইমেইল'],['name'=>'Slack','icon'=>'💬','description'=>'চ্যাট'],['name'=>'Notion','icon'=>'📓','description'=>'নোটস'],['name'=>'Canva','icon'=>'🎨','description'=>'ডিজাইন'],['name'=>'API','icon'=>'🔌','description'=>'সংযোগ']])); }
    if ($action == 'command') {
        $cmd = $input['command'] ?? ''; if (!$cmd) { die(json_encode(['error'=>'কমান্ড দিন'])); }
        $agent = 'research';
        foreach ($kw as $k=>$a) { if (mb_stripos($cmd,$k)!==false) { $agent=$a; break; } }
        $data['tasks'][] = ['id'=>uniqid(),'title'=>'['.strtoupper($agent).'] '.mb_substr($cmd,0,80),'assigned_agent'=>$agent,'status'=>'completed','created_at'=>date('Y-m-d H:i:s')];
        $data['memories'][] = ['id'=>uniqid(),'type'=>'conversation','content'=>$cmd,'created_at'=>date('Y-m-d H:i:s')];
        file_put_contents($df, json_encode($data));
        die(json_encode(['success'=>true,'routing'=>['primaryAgent'=>$agent,'intents'=>[$agent]],'results'=>[['agent'=>$agent,'status'=>'fulfilled','result'=>['agent'=>$agent,'icon'=>$icons[$agent]??'🤖','summary'=>strtoupper($agent).' Agent কাজ সম্পন্ন: '.$cmd,'recommendations'=>['AI API যোগ করলে বুদ্ধিমান response পাবেন'],'completionTime'=>rand(3,15).' সেকেন্ড']]],'message'=>'✅ কমান্ড সম্পন্ন! 1/1 এজেন্ট সফল।']));
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
:root{--bg:#0a0e1a;--bg2:#111827;--card:#1a1f35;--accent:#6366f1;--text:#f1f5f9;--muted:#64748b;--success:#10b981;--border:#2a3050;--radius:10px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
.wrap{max-width:900px;margin:0 auto;padding:16px}
.header{text-align:center;padding:20px 0;border-bottom:1px solid var(--border);margin-bottom:20px}
.header h1{font-size:1.5rem;background:linear-gradient(135deg,var(--accent),#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.header p{color:var(--muted);font-size:.85rem;margin-top:4px}
.nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;justify-content:center}
.nav button{background:var(--card);border:1px solid var(--border);color:var(--muted);padding:8px 16px;border-radius:20px;cursor:pointer;font-size:.8rem;transition:all .2s}
.nav button:hover,.nav button.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px}
.stat{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;text-align:center}
.stat .num{font-size:1.8rem;font-weight:700}
.stat .label{font-size:.75rem;color:var(--muted)}
.section{display:none}.section.active{display:block}
.cmd-box{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:16px}
.cmd-row{display:flex;gap:8px}
.cmd-input{flex:1;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:12px;color:var(--text);font-size:.9rem}
.cmd-input:focus{outline:none;border-color:var(--accent)}
.cmd-btn{background:var(--accent);border:none;color:#fff;padding:12px 20px;border-radius:var(--radius);cursor:pointer;font-weight:600}
.cmd-btn:hover{opacity:.9}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.chip{background:var(--bg);border:1px solid var(--border);color:var(--muted);padding:5px 10px;border-radius:15px;font-size:.7rem;cursor:pointer}
.chip:hover{border-color:var(--accent);color:var(--accent)}
.result{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-top:12px;font-size:.85rem;line-height:1.6}
.result .ok{color:var(--success);font-weight:600}
.agents-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.agent-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;transition:all .2s}
.agent-card:hover{border-color:var(--accent);transform:translateY(-2px)}
.agent-card h4{font-size:.9rem;margin-bottom:6px}
.agent-card .caps{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}
.agent-card .cap{background:rgba(99,102,241,.15);color:#818cf8;padding:2px 8px;border-radius:10px;font-size:.65rem}
.task-item{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;font-size:.85rem}
.task-item small{color:var(--muted)}
.empty{text-align:center;padding:40px;color:var(--muted)}
.tools-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.tool{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:14px;text-align:center}
.tool .icon{font-size:1.5rem}
.tool h4{font-size:.8rem;margin-top:6px}
.tool p{font-size:.7rem;color:var(--muted)}
.status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--success);margin-right:4px;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@media(max-width:600px){.stats{grid-template-columns:repeat(2,1fr)}.agents-grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
    <div class="header">
        <h1>🧠 Tahmeed AI OS</h1>
        <p><span class="status-dot"></span> Personal AI Operating System - সিস্টেম সক্রিয়</p>
    </div>

    <div class="nav">
        <button class="active" onclick="show('dashboard')">📊 ড্যাশবোর্ড</button>
        <button onclick="show('command')">⚡ কমান্ড</button>
        <button onclick="show('agents')">🤖 এজেন্ট</button>
        <button onclick="show('tasks')">📋 টাস্ক</button>
        <button onclick="show('memory')">💾 মেমরি</button>
        <button onclick="show('tools')">🔧 টুলস</button>
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
            <div class="cmd-row">
                <input class="cmd-input" id="cmd" placeholder="আপনার কমান্ড লিখুন..." onkeypress="if(event.key==='Enter')run()">
                <button class="cmd-btn" onclick="run()">পাঠান ➤</button>
            </div>
            <div class="chips">
                <span class="chip" onclick="fill('Sutro Inventory Module Upgrade করো')">📦 Inventory</span>
                <span class="chip" onclick="fill('সিকিউরিটি অডিট করো')">🔒 Security</span>
                <span class="chip" onclick="fill('মার্কেটিং ক্যাম্পেইন তৈরি করো')">📣 Marketing</span>
                <span class="chip" onclick="fill('ডাটা বিশ্লেষণ করো')">📊 Data</span>
            </div>
        </div>
        <div id="results"></div>
    </div>

    <div class="section" id="s-agents"><div class="agents-grid" id="ag-list"></div></div>
    <div class="section" id="s-tasks" ><div id="task-list"><div class="empty">📋 কমান্ড দিলে টাস্ক দেখাবে</div></div></div>
    <div class="section" id="s-memory"><div id="mem-list"><div class="empty">💾 মেমরি খালি</div></div></div>
    <div class="section" id="s-tools"><div class="tools-grid" id="tool-list"></div></div>
</div>

<script>
const API = '?api=';

function show(id) {
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    document.getElementById('s-'+id).classList.add('active');
    document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));
    event.target.classList.add('active');
    if(id=='dashboard') loadDash();
    if(id=='agents') loadAgents();
    if(id=='tasks') loadTasks();
    if(id=='memory') loadMem();
    if(id=='tools') loadTools();
}

async function loadDash() {
    const r = await fetch(API+'dashboard'); const d = await r.json();
    document.getElementById('n-agents').textContent = d.agents?.length||7;
    document.getElementById('n-tasks').textContent = d.tasks?.completed||0;
    document.getElementById('n-memory').textContent = d.memory?.total||0;
    const g = document.getElementById('ag-grid');
    g.innerHTML = (d.agents||[]).map(a=>`<div class="agent-card"><h4>${a.description}</h4><div class="caps">${(a.capabilities||[]).map(c=>`<span class="cap">${c}</span>`).join('')}</div></div>`).join('');
}

async function loadAgents() {
    const r = await fetch(API+'agents'); const agents = await r.json();
    document.getElementById('ag-list').innerHTML = agents.map(a=>`<div class="agent-card"><h4>${a.description}</h4><div class="caps">${(a.capabilities||[]).map(c=>`<span class="cap">${c}</span>`).join('')}</div></div>`).join('');
}

async function loadTasks() {
    const r = await fetch(API+'tasks'); const tasks = await r.json();
    const el = document.getElementById('task-list');
    if(!tasks.length){el.innerHTML='<div class="empty">📋 কমান্ড দিলে টাস্ক দেখাবে</div>';return;}
    el.innerHTML = tasks.map(t=>`<div class="task-item">✅ ${t.title}<br><small>${t.assigned_agent} • ${t.created_at}</small></div>`).join('');
}

async function loadMem() {
    const r = await fetch(API+'memory'); const mems = await r.json();
    const el = document.getElementById('mem-list');
    if(!mems.length){el.innerHTML='<div class="empty">💾 মেমরি খালি</div>';return;}
    el.innerHTML = mems.map(m=>`<div class="task-item">💬 ${m.content}<br><small>${m.created_at}</small></div>`).join('');
}

async function loadTools() {
    const r = await fetch(API+'tools'); const tools = await r.json();
    document.getElementById('tool-list').innerHTML = tools.map(t=>`<div class="tool"><div class="icon">${t.icon}</div><h4>${t.name}</h4><p>${t.description}</p></div>`).join('');
}

async function run() {
    const input = document.getElementById('cmd');
    const cmd = input.value.trim(); if(!cmd) return;
    document.getElementById('results').innerHTML = '<div class="result">⏳ এজেন্ট কাজ করছে...</div>';
    const r = await fetch(API+'command',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({command:cmd})});
    const d = await r.json();
    if(d.success){
        let h = `<div class="result"><div class="ok">${d.message}</div><br>`;
        (d.results||[]).forEach(res=>{if(res.result){h+=`<strong>${res.result.icon} ${res.result.agent?.toUpperCase()} Agent</strong><br>${res.result.summary}<br><br>`;if(res.result.recommendations){h+='💡 সুপারিশ:<br>';res.result.recommendations.forEach(r=>{h+=`→ ${r}<br>`;});}h+=`<br><small>⏱️ ${res.result.completionTime}</small>`;}});
        h+='</div>';
        document.getElementById('results').innerHTML = h;
    } else { document.getElementById('results').innerHTML = `<div class="result">❌ ${d.error||'ব্যর্থ'}</div>`; }
    input.value = '';
    loadDash();
}

function fill(t){document.getElementById('cmd').value=t;show('command');}

loadDash();
</script>
</body>
</html>
