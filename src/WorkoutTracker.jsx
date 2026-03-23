import { useState, useEffect, useRef } from "react";

const MUSCLE_GROUPS = ["Chest","Back","Shoulders","Biceps","Triceps","Legs","Glutes","Core","Full Body"];
const PRESETS = {
  Chest:["Bench Press","Incline Press","Dumbbell Flyes","Push-Ups","Cable Crossover"],
  Back:["Deadlift","Pull-Ups","Barbell Row","Lat Pulldown","Seated Cable Row"],
  Shoulders:["Overhead Press","Lateral Raises","Front Raises","Face Pulls","Arnold Press"],
  Biceps:["Barbell Curl","Dumbbell Curl","Hammer Curl","Preacher Curl","Cable Curl"],
  Triceps:["Skull Crushers","Tricep Dips","Cable Pushdown","Close-Grip Bench","Overhead Extension"],
  Legs:["Squat","Leg Press","Romanian Deadlift","Leg Curl","Leg Extension"],
  Glutes:["Hip Thrust","Bulgarian Split Squat","Glute Bridge","Cable Kickback","Sumo Squat"],
  Core:["Plank","Cable Crunch","Hanging Leg Raise","Russian Twist","Ab Rollout"],
  "Full Body":["Clean & Press","Burpees","Kettlebell Swing","Thruster","Turkish Get-Up"],
};
const MC = {Chest:"#ef4444",Back:"#f97316",Shoulders:"#eab308",Biceps:"#22c55e",Triceps:"#06b6d4",Legs:"#3b82f6",Glutes:"#a855f7",Core:"#ec4899","Full Body":"#f43f5e"};
const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
const uid = () => Math.random().toString(36).slice(2,9);

const THEMES = {
  void:    { name:"Void",      bg:"#0a0a0f", surface:"#0e0e1a", surfaceDeep:"#0d0d18", border:"#1e1e2e", borderSubtle:"#111", accent:"#a78bfa", accentDim:"#4c1d95", accentDim2:"#5b21b6", accentText:"#e9d5ff", muted:"#444", dimmer:"#333", dimmest:"#252535", timerIdle:"#3d3d5c", timerActive:"#a78bfa", textPrimary:"#e2e8f0", textSecondary:"#666", scrollThumb:"#2a2a3e", selectBg:"#1a1a2e", inputBg:"#161620",
    fontDisplay:"'Orbitron',sans-serif", fontMono:"'Share Tech Mono',monospace", fontBody:"'Share Tech Mono',monospace", isLight:false },
  ember:   { name:"Ember",     bg:"#0f0a08", surface:"#1a100a", surfaceDeep:"#150d08", border:"#2e1a0e", borderSubtle:"#1a0e08", accent:"#fb923c", accentDim:"#7c2d12", accentDim2:"#9a3412", accentText:"#fed7aa", muted:"#4a3020", dimmer:"#3a2010", dimmest:"#2a1a0e", timerIdle:"#5c3010", timerActive:"#fb923c", textPrimary:"#fde8d0", textSecondary:"#6a4030", scrollThumb:"#3e2010", selectBg:"#1a1008", inputBg:"#180e08",
    fontDisplay:"'Bebas Neue',sans-serif", fontMono:"'DM Mono',monospace", fontBody:"'DM Mono',monospace", isLight:false },
  arctic:  { name:"Arctic",    bg:"#08100f", surface:"#0d1a18", surfaceDeep:"#0a1614", border:"#1a2e2a", borderSubtle:"#111f1d", accent:"#2dd4bf", accentDim:"#0d4a42", accentDim2:"#0f5c52", accentText:"#99f6e4", muted:"#1e3a36", dimmer:"#162e2a", dimmest:"#122420", timerIdle:"#1a4040", timerActive:"#2dd4bf", textPrimary:"#d0f0ec", textSecondary:"#305050", scrollThumb:"#1e3a36", selectBg:"#0d1a18", inputBg:"#0a1614",
    fontDisplay:"'Exo 2',sans-serif", fontMono:"'Fira Code',monospace", fontBody:"'Fira Code',monospace", isLight:false },
  steel:   { name:"Steel",     bg:"#0a0c10", surface:"#10141c", surfaceDeep:"#0d1018", border:"#1e2430", borderSubtle:"#141820", accent:"#60a5fa", accentDim:"#1e3a6e", accentDim2:"#1e4a8a", accentText:"#bfdbfe", muted:"#2a3448", dimmer:"#1e2838", dimmest:"#182030", timerIdle:"#203050", timerActive:"#60a5fa", textPrimary:"#dce8f8", textSecondary:"#3a5070", scrollThumb:"#2a3a54", selectBg:"#10141c", inputBg:"#0d1018",
    fontDisplay:"'Rajdhani',sans-serif", fontMono:"'JetBrains Mono',monospace", fontBody:"'JetBrains Mono',monospace", isLight:false },
  rose:    { name:"Rose",      bg:"#100a0d", surface:"#1a0d12", surfaceDeep:"#160a0f", border:"#2e1220", borderSubtle:"#1a0d14", accent:"#f472b6", accentDim:"#6d1a3a", accentDim2:"#8a1a48", accentText:"#fce7f3", muted:"#3a1828", dimmer:"#2a1020", dimmest:"#201018", timerIdle:"#4a1030", timerActive:"#f472b6", textPrimary:"#f8d8e8", textSecondary:"#5a2a3a", scrollThumb:"#3e1828", selectBg:"#1a0d12", inputBg:"#160a0f",
    fontDisplay:"'Playfair Display',serif", fontMono:"'Courier Prime',monospace", fontBody:"'Courier Prime',monospace", isLight:false },
  light:   { name:"Light",     bg:"#f4f1ec", surface:"#fffefa", surfaceDeep:"#edeae4", border:"#d4cfc7", borderSubtle:"#e8e4dd", accent:"#1a1a2e", accentDim:"#2d2d4a", accentDim2:"#3d3d5c", accentText:"#fffefa", muted:"#8a8478", dimmer:"#6b6560", dimmest:"#c4bfb8", timerIdle:"#9a9490", timerActive:"#1a1a2e", textPrimary:"#1a1714", textSecondary:"#6b6560", scrollThumb:"#c4bfb8", selectBg:"#fffefa", inputBg:"#f4f1ec",
    fontDisplay:"'Bebas Neue',sans-serif", fontMono:"'DM Mono',monospace", fontBody:"'DM Mono',monospace", isLight:true },
};

function SetRow({ set, idx, onUpdate, onDelete, T, onRestartTimer }) {
  const done = !!set.done;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${T.borderSubtle}`,opacity:done?0.5:1,transition:"opacity 0.2s"}}>
      <span style={{fontFamily:T.fontDisplay,fontSize:18,color:T.timerIdle,width:20,textAlign:"center"}}>{idx+1}</span>
      <input type="number" value={set.weight} placeholder="lbs"
        onChange={e=>onUpdate({...set,weight:e.target.value})}
        style={{width:64,padding:"5px 8px",borderRadius:5,background:T.surfaceDeep,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:16,textAlign:"center",fontFamily:"inherit",outline:"none",textDecoration:done?"line-through":"none"}}/>
      <span style={{color:T.dimmer,fontSize:15}}>×</span>
      <input type="number" value={set.reps} placeholder="reps"
        onChange={e=>onUpdate({...set,reps:e.target.value})}
        style={{width:54,padding:"5px 8px",borderRadius:5,background:T.surfaceDeep,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:16,textAlign:"center",fontFamily:"inherit",outline:"none",textDecoration:done?"line-through":"none"}}/>
      <input value={set.note} placeholder="note"
        onChange={e=>onUpdate({...set,note:e.target.value})}
        style={{width:80,minWidth:0,padding:"5px 8px",borderRadius:5,background:T.surfaceDeep,border:`1px solid ${T.borderSubtle}`,color:T.textSecondary,fontSize:14,fontFamily:"inherit",outline:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}/>
      <button onClick={()=>{ const nowDone=!done; onUpdate({...set,done:nowDone}); if(nowDone) onRestartTimer?.(); }}
        style={{width:26,height:26,borderRadius:6,border:`2px solid ${done?T.accent:T.border}`,background:done?T.accent:"transparent",cursor:"pointer",outline:"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s",padding:0}}
        title={done?"Mark incomplete":"Mark complete"}>
        {done&&<span style={{color:T.isLight?"#fff":T.accentText,fontSize:14,lineHeight:1,fontWeight:"bold"}}>✓</span>}
      </button>
      <button onClick={onDelete}
        style={{background:"none",border:"none",color:T.dimmest,cursor:"pointer",fontSize:19,lineHeight:1,padding:"0 4px",transition:"color 0.15s"}}
        onMouseEnter={e=>e.target.style.color="#ef4444"} onMouseLeave={e=>e.target.style.color=T.dimmest}>×</button>
    </div>
  );
}

function ExerciseBlock({ ex, customExercises, T, onUpdateEx, onDeleteEx, onAddSet, prevSets }) {
  const [mg, setMg] = useState(ex.muscleGroup);
  const [exName, setExName] = useState(ex.name);
  const [custom, setCustom] = useState(ex.isCustom||false);
  const [customName, setCustomName] = useState(ex.isCustom?ex.name:"");

  const sync = (patch) => onUpdateEx({...ex,...patch});

  const handleMG = (g) => {
    setMg(g); const n=PRESETS[g][0]; setExName(n); setCustom(false); setCustomName("");
    sync({muscleGroup:g,name:n,isCustom:false});
  };
  const handleEx = (n) => { setExName(n); sync({name:n}); };
  const handleCustom = (n) => { setCustomName(n); sync({name:n}); };
  const toggleCustom = () => {
    const nc=!custom; setCustom(nc);
    if(!nc){setExName(PRESETS[mg][0]);sync({name:PRESETS[mg][0],isCustom:false});}
    else sync({isCustom:true,name:""});
  };

  const addSet = () => {
    const last = ex.sets[ex.sets.length - 1];
    sync({sets:[...ex.sets,{id:uid(),weight:last?.weight||"",reps:last?.reps||"",note:""}]});
  };
  const updateSet = (id,u) => sync({sets:ex.sets.map(s=>s.id===id?u:s)});
  const deleteSet = (id) => sync({sets:ex.sets.filter(s=>s.id!==id)});

  return (
    <div style={{background:T.surface,border:`1px solid ${MC[mg]}33`,borderRadius:10,overflow:"hidden",marginBottom:12}}>
      <div style={{padding:"12px 14px",borderBottom:`1px solid ${T.borderSubtle}`,display:"flex",flexDirection:"column",gap:10}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {MUSCLE_GROUPS.map(g=>(
            <button key={g} onClick={()=>handleMG(g)}
              style={{padding:"3px 9px",borderRadius:3,fontSize:13,cursor:"pointer",border:`1px solid ${mg===g?MC[g]+"88":T.border}`,background:mg===g?T.surface:"transparent",color:mg===g?MC[g]:T.muted,letterSpacing:"0.05em",fontFamily:"inherit",outline:"none"}}>
              {g}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {!custom?(
            <select value={exName} onChange={e=>handleEx(e.target.value)}
              style={{flex:1,padding:"8px 10px",borderRadius:6,background:T.inputBg,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:15,fontFamily:"inherit",outline:"none"}}>
              <optgroup label="Presets">
                {PRESETS[mg].map(p=><option key={p}>{p}</option>)}
              </optgroup>
              {customExercises[mg]?.length>0&&(
                <optgroup label="My Exercises">
                  {customExercises[mg].map(p=><option key={p}>{p}</option>)}
                </optgroup>
              )}
            </select>
          ):(
            <input value={customName} onChange={e=>handleCustom(e.target.value)} placeholder="Exercise name..."
              style={{flex:1,padding:"8px 10px",borderRadius:6,background:T.inputBg,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:15,fontFamily:"inherit",outline:"none"}}/>
          )}
          <button onClick={toggleCustom}
            style={{padding:"8px 10px",borderRadius:6,background:custom?T.surface:"transparent",border:`1px solid ${T.border}`,color:custom?T.accent:T.muted,fontSize:13,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",outline:"none"}}>
            {custom?"preset":"+ custom"}
          </button>
          <button onClick={onDeleteEx}
            style={{padding:"8px 10px",borderRadius:6,background:"transparent",border:`1px solid ${T.isLight?"#d4b8b8":"#2a1a1a"}`,color:T.isLight?"#b04040":"#6b2424",fontSize:15,cursor:"pointer",transition:"all 0.15s",outline:"none"}}
            onMouseEnter={e=>{e.currentTarget.style.background=T.isLight?"#fde8e8":"#2a1a1a";e.currentTarget.style.color="#ef4444"}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.isLight?"#b04040":"#6b2424"}}>
            ✕
          </button>
        </div>
      </div>
      <div style={{padding:"8px 14px 4px"}}>
        <div style={{display:"flex",gap:8,marginBottom:4}}>
          <span style={{fontSize:12,color:T.dimmest,width:20}}>#</span>
          <span style={{fontSize:12,color:T.dimmest,width:64,textAlign:"center",letterSpacing:"0.08em"}}>WEIGHT</span>
          <span style={{fontSize:12,color:T.dimmest,width:12}}></span>
          <span style={{fontSize:12,color:T.dimmest,width:54,textAlign:"center",letterSpacing:"0.08em"}}>REPS</span>
          <span style={{fontSize:12,color:T.dimmest,flex:1,letterSpacing:"0.08em"}}>NOTE</span>
        </div>
        {ex.sets.length===0&&<div style={{padding:"10px 0",color:T.dimmest,fontSize:14,textAlign:"center",letterSpacing:"0.06em"}}>NO SETS — ADD ONE BELOW</div>}
        {ex.sets.map((s,i)=>{
          const ghost = prevSets?.[i];
          return (
            <div key={s.id}>
              <SetRow set={s} idx={i} T={T} onUpdate={u=>updateSet(s.id,u)} onDelete={()=>deleteSet(s.id)} onRestartTimer={onAddSet}/>
              {ghost&&(ghost.weight||ghost.reps)&&(
                <div style={{display:"flex",gap:8,paddingLeft:28,paddingBottom:4,marginTop:-2}}>
                  <span style={{fontSize:11,color:T.dimmest,fontStyle:"italic",letterSpacing:"0.03em"}}>
                    last: {ghost.weight?`${ghost.weight} lbs`:"—"} × {ghost.reps?`${ghost.reps} reps`:"—"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        <button onClick={addSet}
          style={{width:"100%",margin:"8px 0",padding:"7px",borderRadius:5,background:"transparent",border:`1px dashed ${T.border}`,color:T.timerIdle,fontSize:14,cursor:"pointer",letterSpacing:"0.08em",fontFamily:"inherit",transition:"all 0.15s",outline:"none"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.timerIdle;}}>
          + ADD SET
        </button>
      </div>
    </div>
  );
}

function TrendsView({ sessions, T }) {
  // --- Date range (default: last 7 days) ---
  const toDateStr = (d) => d.toISOString().slice(0, 10);
  const todayStr = toDateStr(new Date());
  const weekAgoStr = toDateStr(new Date(Date.now() - 6 * 86400000));

  const [rangeStart, setRangeStart] = useState(weekAgoStr);
  const [rangeEnd, setRangeEnd] = useState(todayStr);
  const [activePreset, setActivePreset] = useState("7d");

  const applyPreset = (key) => {
    setActivePreset(key);
    const now = new Date();
    const end = toDateStr(now);
    const starts = { "7d": 6, "30d": 29, "90d": 89, "1y": 364 };
    if (key === "all") {
      const oldest = sessions.length
        ? toDateStr(new Date(Math.min(...sessions.map(s => new Date(s.date)))))
        : toDateStr(new Date(Date.now() - 6 * 86400000));
      setRangeStart(oldest);
    } else {
      setRangeStart(toDateStr(new Date(Date.now() - starts[key] * 86400000)));
    }
    setRangeEnd(end);
  };

  const handleStartChange = (v) => { setRangeStart(v); setActivePreset(null); };
  const handleEndChange   = (v) => { setRangeEnd(v);   setActivePreset(null); };

  // Filter sessions to date range (inclusive)
  const filteredSessions = sessions.filter(s => {
    const d = s.date.slice(0, 10);
    return d >= rangeStart && d <= rangeEnd;
  });

  // Build list of all exercises ever logged (from ALL sessions for the picker)
  const allExercises = [...new Set(
    sessions.flatMap(s => s.exercises.map(e => e.name))
  )].sort();

  const [selectedEx, setSelectedEx] = useState(allExercises[0] || "");

  // --- Strength chart data: best set (max weight) per session for selected exercise ---
  const strengthData = filteredSessions
    .slice().reverse()
    .flatMap(s => {
      const matches = s.exercises.filter(e => e.name === selectedEx);
      if (!matches.length) return [];
      const bestWeight = Math.max(...matches.flatMap(e => e.sets.map(st => parseFloat(st.weight)||0)));
      if (!bestWeight) return [];
      return [{ date: s.date, label: fmtDate(s.date), value: bestWeight }];
    });

  // --- Volume chart data: total volume (weight*reps) per muscle group ---
  const volumeByMuscle = MUSCLE_GROUPS.map(mg => {
    const total = filteredSessions.reduce((sum, s) => {
      return sum + s.exercises
        .filter(e => e.muscleGroup === mg)
        .reduce((eSum, e) => eSum + e.sets.reduce((sSum, st) => {
          return sSum + ((parseFloat(st.weight)||0) * (parseInt(st.reps)||0));
        }, 0), 0);
    }, 0);
    return { mg, total };
  }).filter(d => d.total > 0);

  // Generic SVG line chart
  function LineChart({ data, color, yLabel }) {
    if (!data.length) return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:160,color:T.dimmest,fontSize:14,letterSpacing:"0.08em"}}>
        NO DATA FOR THIS EXERCISE
      </div>
    );
    const W = 560, H = 160, PL = 52, PR = 16, PT = 16, PB = 36;
    const cW = W - PL - PR, cH = H - PT - PB;
    const vals = data.map(d => d.value);
    const minV = Math.min(...vals), maxV = Math.max(...vals);
    const range = maxV - minV || 1;
    const padded = { min: minV - range * 0.1, max: maxV + range * 0.1 };
    const xOf = i => PL + (i / Math.max(data.length - 1, 1)) * cW;
    const yOf = v => PT + cH - ((v - padded.min) / (padded.max - padded.min)) * cH;

    // Y axis ticks
    const yTicks = 4;
    const yTickVals = Array.from({length: yTicks + 1}, (_, i) => padded.min + (padded.max - padded.min) * (i / yTicks));

    // Build path
    const pts = data.map((d, i) => `${xOf(i)},${yOf(d.value)}`);
    const linePath = `M ${pts.join(" L ")}`;
    const areaPath = `M ${xOf(0)},${PT + cH} L ${pts.join(" L ")} L ${xOf(data.length-1)},${PT+cH} Z`;

    // X labels: show up to 6
    const step = Math.max(1, Math.ceil(data.length / 6));
    const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1);

    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
        <defs>
          <linearGradient id={`ag-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {yTickVals.map((v, i) => (
          <g key={i}>
            <line x1={PL} y1={yOf(v)} x2={W-PR} y2={yOf(v)} stroke={T.border} strokeWidth="1" strokeDasharray="3,4"/>
            <text x={PL-6} y={yOf(v)+4} textAnchor="end" fill={T.dimmer} fontSize="12" fontFamily={T.fontMono}>
              {Math.round(v)}
            </text>
          </g>
        ))}
        {/* Y label */}
        <text x={10} y={H/2} textAnchor="middle" fill={T.muted} fontSize="12" fontFamily={T.fontMono}
          transform={`rotate(-90,10,${H/2})`}>{yLabel}</text>
        {/* Area fill */}
        <path d={areaPath} fill={`url(#ag-${color.replace('#','')})`}/>
        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        {/* Dots + tooltips */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xOf(i)} cy={yOf(d.value)} r="4" fill={color} stroke={T.bg} strokeWidth="2"/>
            <title>{d.label}: {d.value} lbs</title>
          </g>
        ))}
        {/* X axis labels */}
        {xLabels.map((d, i) => {
          const idx = data.indexOf(d);
          return (
            <text key={i} x={xOf(idx)} y={H - 4} textAnchor="middle" fill={T.dimmer} fontSize="12" fontFamily={T.fontMono}>
              {new Date(d.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
            </text>
          );
        })}
      </svg>
    );
  }

  // Bar chart for volume
  function BarChart({ data }) {
    if (!data.length) return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:160,color:T.dimmest,fontSize:14,letterSpacing:"0.08em"}}>
        NO WORKOUT DATA YET
      </div>
    );
    const W = 560, H = 180, PL = 58, PR = 16, PT = 16, PB = 48;
    const cW = W - PL - PR, cH = H - PT - PB;
    const maxV = Math.max(...data.map(d => d.total));
    const barW = Math.min(36, (cW / data.length) * 0.6);
    const gap = cW / data.length;
    const yTicks = 4;
    const yTickVals = Array.from({length: yTicks + 1}, (_, i) => (maxV * i / yTicks));
    const yOf = v => PT + cH - (v / maxV) * cH;
    const xOf = i => PL + gap * i + gap / 2;

    const fmtK = v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : Math.round(v).toString();

    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
        <defs>
          {data.map(d => (
            <linearGradient key={d.mg} id={`bg-${d.mg.replace(/\s/g,'')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MC[d.mg]} stopOpacity="0.9"/>
              <stop offset="100%" stopColor={MC[d.mg]} stopOpacity="0.4"/>
            </linearGradient>
          ))}
        </defs>
        {/* Grid */}
        {yTickVals.map((v, i) => (
          <g key={i}>
            <line x1={PL} y1={yOf(v)} x2={W-PR} y2={yOf(v)} stroke={T.border} strokeWidth="1" strokeDasharray="3,4"/>
            <text x={PL-6} y={yOf(v)+4} textAnchor="end" fill={T.dimmer} fontSize="12" fontFamily={T.fontMono}>
              {fmtK(v)}
            </text>
          </g>
        ))}
        {/* Y label */}
        <text x={10} y={H/2} textAnchor="middle" fill={T.muted} fontSize="12" fontFamily={T.fontMono}
          transform={`rotate(-90,10,${H/2})`}>LBS × REPS</text>
        {/* Bars */}
        {data.map((d, i) => {
          const bH = cH - (yOf(d.total) - PT);
          const by = yOf(d.total);
          return (
            <g key={d.mg}>
              <rect x={xOf(i) - barW/2} y={by} width={barW} height={bH}
                fill={`url(#bg-${d.mg.replace(/\s/g,'')})`} rx="3"/>
              <rect x={xOf(i) - barW/2} y={by} width={barW} height={3}
                fill={MC[d.mg]} rx="2"/>
              {/* Value label on top */}
              <text x={xOf(i)} y={by - 5} textAnchor="middle" fill={MC[d.mg]} fontSize="12" fontFamily={T.fontMono}>
                {fmtK(d.total)}
              </text>
              {/* X label */}
              <text x={xOf(i)} y={H - 4} textAnchor="middle" fill={T.dimmer} fontSize="11" fontFamily={T.fontMono}
                transform={`rotate(-30,${xOf(i)},${H-4})`}>
                {d.mg}
              </text>
              <title>{d.mg}: {Math.round(d.total).toLocaleString()} lbs×reps</title>
            </g>
          );
        })}
      </svg>
    );
  }

  // Stats for selected exercise
  const prWeight = strengthData.length ? Math.max(...strengthData.map(d => d.value)) : null;
  const firstWeight = strengthData.length ? strengthData[0].value : null;
  const lastWeight = strengthData.length ? strengthData[strengthData.length-1].value : null;
  const delta = (firstWeight && lastWeight) ? lastWeight - firstWeight : null;

  const PRESETS = [
    { key:"7d",  label:"7D"  },
    { key:"30d", label:"30D" },
    { key:"90d", label:"90D" },
    { key:"1y",  label:"1Y"  },
    { key:"all", label:"ALL" },
  ];

  const inputStyle = {
    padding:"8px 10px", borderRadius:6, background:T.inputBg,
    border:`1px solid ${T.border}`, color:T.textPrimary,
    fontSize:13, fontFamily:"inherit", outline:"none",
    colorScheme: T.isLight ? "light" : "dark",
  };

  // --- Heatmap: last 52 weeks ---
  const heatmapDays = (() => {
    const workoutDays = new Set(sessions.map(s=>s.date.slice(0,10)));
    const days = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    // Go back 364 days (52 weeks) from today, starting on Sunday
    const start = new Date(today);
    start.setDate(start.getDate() - 363);
    // Pad to previous Sunday
    start.setDate(start.getDate() - start.getDay());
    const cur = new Date(start);
    while(cur <= today) {
      const str = cur.toISOString().slice(0,10);
      days.push({ date: str, active: workoutDays.has(str), future: cur > today });
      cur.setDate(cur.getDate()+1);
    }
    return days;
  })();

  // Group into weeks (columns of 7)
  const heatmapWeeks = [];
  for(let i=0;i<heatmapDays.length;i+=7) heatmapWeeks.push(heatmapDays.slice(i,i+7));

  // Month labels: find first week where month changes
  const monthLabels = [];
  heatmapWeeks.forEach((week,wi)=>{
    const firstDay = week[0];
    const d = new Date(firstDay.date);
    if(wi===0 || new Date(heatmapWeeks[wi-1][0].date).getMonth()!==d.getMonth()) {
      monthLabels.push({wi, label: d.toLocaleDateString("en-US",{month:"short"})});
    }
  });

  const totalWorkouts = sessions.length;
  const workoutsThisYear = sessions.filter(s=>{
    const d = new Date(s.date);
    return d >= new Date(new Date().getFullYear(),0,1);
  }).length;

  return (
    <div className="fade" style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* Frequency Heatmap */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 16px 14px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontSize:12,letterSpacing:"0.16em",color:T.dimmer,textTransform:"uppercase",marginBottom:2}}>Workout Frequency</div>
            <div style={{fontSize:13,color:T.muted}}>Last 52 weeks</div>
          </div>
          <div style={{display:"flex",gap:12}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:9,color:T.dimmer,letterSpacing:"0.1em",marginBottom:2}}>THIS YEAR</div>
              <div style={{fontSize:18,color:T.accent,fontFamily:T.fontDisplay}}>{workoutsThisYear}</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:9,color:T.dimmer,letterSpacing:"0.1em",marginBottom:2}}>ALL TIME</div>
              <div style={{fontSize:18,color:T.textPrimary,fontFamily:T.fontDisplay}}>{totalWorkouts}</div>
            </div>
          </div>
        </div>
        <div style={{overflowX:"auto"}}>
          <div style={{display:"inline-block",minWidth:"100%"}}>
            {/* Month labels */}
            <div style={{display:"flex",marginBottom:4,paddingLeft:18}}>
              {heatmapWeeks.map((_,wi)=>{
                const ml = monthLabels.find(m=>m.wi===wi);
                return <div key={wi} style={{width:12,marginRight:2,fontSize:9,color:T.dimmer,flexShrink:0}}>{ml?ml.label:""}</div>;
              })}
            </div>
            {/* Day rows (Sun=0 ... Sat=6) */}
            <div style={{display:"flex",gap:0}}>
              {/* Day labels */}
              <div style={{display:"flex",flexDirection:"column",gap:2,marginRight:4}}>
                {["S","M","T","W","T","F","S"].map((d,i)=>(
                  <div key={i} style={{height:12,fontSize:9,color:T.dimmer,lineHeight:"12px",width:14,textAlign:"right"}}>{i%2===1?d:""}</div>
                ))}
              </div>
              {/* Week columns */}
              {heatmapWeeks.map((week,wi)=>(
                <div key={wi} style={{display:"flex",flexDirection:"column",gap:2,marginRight:2}}>
                  {week.map((day,di)=>(
                    <div key={di}
                      title={`${day.date}${day.active?" — workout":""}`}
                      style={{
                        width:12,height:12,borderRadius:2,flexShrink:0,
                        background: day.future ? "transparent"
                          : day.active ? T.accent
                          : T.isLight ? "#e8e4dd" : T.dimmest,
                        opacity: day.future ? 0 : 1,
                        transition:"background 0.1s",
                        cursor: day.active?"default":"default",
                      }}/>
                  ))}
                </div>
              ))}
            </div>
            {/* Legend */}
            <div style={{display:"flex",alignItems:"center",gap:5,marginTop:8,justifyContent:"flex-end"}}>
              <span style={{fontSize:10,color:T.dimmer}}>Less</span>
              {[T.isLight?"#e8e4dd":T.dimmest, T.accent].map((c,i)=>(
                <div key={i} style={{width:12,height:12,borderRadius:2,background:c}}/>
              ))}
              <span style={{fontSize:10,color:T.dimmer}}>More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date range picker */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px"}}>
        <div style={{fontSize:12,letterSpacing:"0.14em",color:T.dimmer,textTransform:"uppercase",marginBottom:10}}>Date Range</div>
        {/* Preset buttons */}
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          {PRESETS.map(p=>(
            <button key={p.key} onClick={()=>applyPreset(p.key)}
              style={{flex:1,padding:"8px 4px",borderRadius:5,cursor:"pointer",fontFamily:"inherit",
                border:`1px solid ${activePreset===p.key?T.accent:T.border}`,
                background:activePreset===p.key?T.accentDim:"transparent",
                color:activePreset===p.key?T.accentText:T.muted,
                fontSize:13,letterSpacing:"0.08em",outline:"none",transition:"all 0.15s"}}>
              {p.label}
            </button>
          ))}
        </div>
        {/* Custom date inputs */}
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input type="date" value={rangeStart} onChange={e=>handleStartChange(e.target.value)}
            style={{...inputStyle, flex:1}}/>
          <span style={{color:T.dimmer,fontSize:14}}>→</span>
          <input type="date" value={rangeEnd} onChange={e=>handleEndChange(e.target.value)}
            style={{...inputStyle, flex:1}}/>
        </div>
        {filteredSessions.length === 0 && sessions.length > 0 && (
          <div style={{marginTop:10,fontSize:13,color:T.muted,letterSpacing:"0.04em"}}>
            No sessions in this range — try widening it.
          </div>
        )}
      </div>

      {/* Strength Progress */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:12,letterSpacing:"0.16em",color:T.dimmer,textTransform:"uppercase",marginBottom:4}}>STRENGTH PROGRESS</div>
            <div style={{fontSize:14,color:T.muted}}>Best set weight per session</div>
          </div>
          <select value={selectedEx} onChange={e=>setSelectedEx(e.target.value)}
            style={{padding:"7px 12px",borderRadius:6,background:T.inputBg,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:14,fontFamily:"inherit",outline:"none",maxWidth:220}}>
            {allExercises.length === 0
              ? <option>No exercises yet</option>
              : allExercises.map(ex => <option key={ex}>{ex}</option>)
            }
          </select>
        </div>

        {/* Stat pills */}
        {strengthData.length > 0 && (
          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
            {[
              { label:"PR", value:`${prWeight} lbs`, color:T.accent },
              { label:"LAST", value:`${lastWeight} lbs`, color:T.textPrimary },
              { label:"CHANGE", value: delta !== null ? `${delta >= 0 ? "+" : ""}${delta} lbs` : "—", color: delta > 0 ? "#22c55e" : delta < 0 ? "#ef4444" : T.muted },
              { label:"SESSIONS", value: strengthData.length, color:T.muted },
            ].map(s => (
              <div key={s.label} style={{background:T.surfaceDeep,border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 12px",textAlign:"center"}}>
                <div style={{fontSize:11,color:T.dimmer,letterSpacing:"0.12em",marginBottom:2}}>{s.label}</div>
                <div style={{fontSize:16,color:s.color,fontFamily:T.fontDisplay,letterSpacing:"0.05em"}}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{overflowX:"auto"}}>
          <LineChart data={strengthData} color={T.accent} yLabel="LBS"/>
        </div>
      </div>

      {/* Volume by Muscle Group */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,letterSpacing:"0.16em",color:T.dimmer,textTransform:"uppercase",marginBottom:4}}>TOTAL VOLUME</div>
          <div style={{fontSize:14,color:T.muted}}>Cumulative weight × reps by muscle group</div>
        </div>
        {/* Legend */}
        {volumeByMuscle.length > 0 && (
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
            {volumeByMuscle.map(d=>(
              <div key={d.mg} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:MC[d.mg]}}/>
                <span style={{fontSize:12,color:T.muted,letterSpacing:"0.06em"}}>{d.mg}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{overflowX:"auto"}}>
          <BarChart data={volumeByMuscle}/>
        </div>
      </div>

    </div>
  );
}


export default function WorkoutTracker() {
  const [view, setView] = useState("log");
  const [themeKey, setThemeKey] = useState(()=>localStorage.getItem("wl_theme")||"light");
  const T = THEMES[themeKey]||THEMES.void;
  const [workout, setWorkout] = useState([]);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [sessions, setSessions] = useState(()=>JSON.parse(localStorage.getItem("wl_sessions2")||"[]"));
  const [customExercises, setCustomExercises] = useState(()=>JSON.parse(localStorage.getItem("wl_custom_ex")||"{}"));
  const [templates, setTemplates] = useState(()=>JSON.parse(localStorage.getItem("wl_templates")||"[]"));
  const [templateFlash, setTemplateFlash] = useState(null); // 'saved' | 'deleted'
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [saveFlash, setSaveFlash] = useState(null);
  const [restoreMsg, setRestoreMsg] = useState(null);
  const fileInputRef = useRef(null);
  const [prBanner, setPrBanner] = useState(null); // {exerciseName, weight}
  const [milestoneBanner, setMilestoneBanner] = useState(null); // {days, message}
  const [summary, setSummary] = useState(null); // saved session object + prs

  const toDateStr = (d) => d.toISOString().slice(0,10);
  const [histRangeStart, setHistRangeStart] = useState(()=>toDateStr(new Date(Date.now()-6*86400000)));
  const [histRangeEnd,   setHistRangeEnd]   = useState(()=>toDateStr(new Date()));
  const [histPreset,     setHistPreset]      = useState("7d");

  const applyHistPreset = (key) => {
    setHistPreset(key);
    const end = toDateStr(new Date());
    const starts = {"7d":6,"30d":29,"90d":89,"1y":364};
    if(key==="all"){
      const oldest = sessions.length
        ? toDateStr(new Date(Math.min(...sessions.map(s=>new Date(s.date)))))
        : toDateStr(new Date(Date.now()-6*86400000));
      setHistRangeStart(oldest);
    } else {
      setHistRangeStart(toDateStr(new Date(Date.now()-starts[key]*86400000)));
    }
    setHistRangeEnd(end);
  };

  const filteredSessions = sessions.filter(s=>{
    const d = s.date.slice(0,10);
    return d >= histRangeStart && d <= histRangeEnd;
  });

  const saveBackup = () => {
    const payload = { sessions, customExercises, templates, exportedAt: new Date().toISOString(), version: 1 };
    const json = JSON.stringify(payload);
    // Encode as base64 for a minimal "zip-like" container
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const blob = new Blob([b64], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `iron-log-backup-${dateStr}.ilbak`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const b64 = ev.target.result;
        const json = decodeURIComponent(escape(atob(b64)));
        const parsed = JSON.parse(json);
        if (!parsed.sessions || !Array.isArray(parsed.sessions)) throw new Error("Invalid backup file");
        setSessions(prev => {
          const existingIds = new Set(prev.map(s=>s.id));
          const newSessions = parsed.sessions.filter(s=>!existingIds.has(s.id));
          return [...prev, ...newSessions].sort((a,b)=>new Date(b.date)-new Date(a.date));
        });
        if (parsed.customExercises) {
          setCustomExercises(prev => {
            const merged = {...prev};
            Object.entries(parsed.customExercises).forEach(([mg, exs]) => {
              merged[mg] = [...new Set([...(merged[mg]||[]), ...exs])];
            });
            return merged;
          });
        }
        if (parsed.templates && Array.isArray(parsed.templates)) {
          setTemplates(prev => {
            const existingIds = new Set(prev.map(t=>t.id));
            const newTemplates = parsed.templates.filter(t=>!existingIds.has(t.id));
            return [...prev, ...newTemplates];
          });
        }
        const n = parsed.sessions.length;
        setRestoreMsg({type:"success", text:`Restored ${n} session${n!==1?"s":""}`});
      } catch(err) {
        setRestoreMsg({type:"error", text: err.message || "Could not read backup file"});
      }
      e.target.value = "";
      setTimeout(() => setRestoreMsg(null), 4000);
    };
    reader.readAsText(file);
  };

  const [timerActive, setTimerActive] = useState(false);
  const [timerInput, setTimerInput] = useState(60);
  const [timerBase, setTimerBase] = useState(60);
  const [timerRem, setTimerRem] = useState(60);
  const intRef = useRef(null);

  useEffect(()=>{localStorage.setItem("wl_sessions2",JSON.stringify(sessions));},[sessions]);
  useEffect(()=>{localStorage.setItem("wl_custom_ex",JSON.stringify(customExercises));},[customExercises]);
  useEffect(()=>{localStorage.setItem("wl_theme",themeKey);},[themeKey]);
  useEffect(()=>{localStorage.setItem("wl_templates",JSON.stringify(templates));},[templates]);

  // Auto-save snapshot on close/hide
  useEffect(()=>{
    const snapshot = () => {
      const data = {
        sessions: JSON.parse(localStorage.getItem("wl_sessions2")||"[]"),
        customExercises: JSON.parse(localStorage.getItem("wl_custom_ex")||"{}"),
        templates: JSON.parse(localStorage.getItem("wl_templates")||"[]"),
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem("wl_autosave", JSON.stringify(data));
    };
    window.addEventListener("beforeunload", snapshot);
    document.addEventListener("visibilitychange", ()=>{ if(document.visibilityState==="hidden") snapshot(); });
    return ()=>{ window.removeEventListener("beforeunload", snapshot); };
  }, []);

  // Auto-restore on mount: merge anything in autosave that isn't in current data
  useEffect(()=>{
    try {
      const raw = localStorage.getItem("wl_autosave");
      if(!raw) return;
      const saved = JSON.parse(raw);

      // Merge sessions
      if(saved.sessions?.length) {
        setSessions(prev=>{
          const existingIds = new Set(prev.map(s=>s.id));
          const missing = saved.sessions.filter(s=>!existingIds.has(s.id));
          if(!missing.length) return prev;
          return [...prev, ...missing].sort((a,b)=>new Date(b.date)-new Date(a.date));
        });
      }
      // Merge custom exercises
      if(saved.customExercises) {
        setCustomExercises(prev=>{
          const merged = {...prev};
          let changed = false;
          Object.entries(saved.customExercises).forEach(([mg,exs])=>{
            const combined = [...new Set([...(merged[mg]||[]),...exs])];
            if(combined.length!==(merged[mg]||[]).length){ merged[mg]=combined; changed=true; }
          });
          return changed ? merged : prev;
        });
      }
      // Merge templates
      if(saved.templates?.length) {
        setTemplates(prev=>{
          const existingIds = new Set(prev.map(t=>t.id));
          const missing = saved.templates.filter(t=>!existingIds.has(t.id));
          if(!missing.length) return prev;
          return [...prev, ...missing];
        });
      }
    } catch(e) { /* silently ignore corrupt autosave */ }
  }, []);

  const saveTemplate = () => {
    if(!templateName.trim()||!workout.length) return;
    const tmpl = {
      id: uid(),
      name: templateName.trim(),
      exercises: workout.map(e=>({
        muscleGroup:e.muscleGroup,
        name:e.name,
        isCustom:e.isCustom,
        setCount:Math.max(e.sets.length, 1)
      }))
    };
    setTemplates(prev=>[...prev,tmpl]);
    setTemplateName("");
    setShowSaveTemplate(false);
    setTemplateFlash("saved");
    setTimeout(()=>setTemplateFlash(null),1800);
  };

  const loadTemplate = (tmplId) => {
    const tmpl = templates.find(t=>t.id===tmplId);
    if(!tmpl) return;
    setWorkout(tmpl.exercises.map(e=>({
      ...e,
      id:uid(),
      sets:Array.from({length:e.setCount||1},()=>({id:uid(),weight:"",reps:"",note:""}))
    })));
    setWorkoutName("");
    setWorkoutNotes("");
  };

  const deleteTemplate = (tmplId) => {
    setTemplates(prev=>prev.filter(t=>t.id!==tmplId));
    setTemplateFlash("deleted");
    setTimeout(()=>setTemplateFlash(null),1800);
  };

  useEffect(()=>{
    if(timerActive){
      intRef.current=setInterval(()=>{
        setTimerRem(r=>{
          if(r<=1){clearInterval(intRef.current);setTimerActive(false);beep();return 0;}
          return r-1;
        });
      },1000);
    } else clearInterval(intRef.current);
    return ()=>clearInterval(intRef.current);
  },[timerActive]);

  const beep=()=>{
    try{
      const ctx=new(window.AudioContext||window.webkitAudioContext)();
      // Bell sound: sine wave with slow decay
      const bell=(freq,time,dur,vol)=>{
        const o=ctx.createOscillator(),g=ctx.createGain();
        o.connect(g);g.connect(ctx.destination);
        o.type="sine";
        o.frequency.value=freq;
        g.gain.setValueAtTime(vol,ctx.currentTime+time);
        g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+time+dur);
        o.start(ctx.currentTime+time);
        o.stop(ctx.currentTime+time+dur);
      };
      // Two-tone bell: fundamental + overtone
      bell(880, 0,    1.2, 0.5);
      bell(1320,0,    0.8, 0.25);
      bell(880, 0.08, 1.0, 0.2);
    }catch{}
  };

  const startTimer=()=>{setTimerBase(timerInput);setTimerRem(timerInput);setTimerActive(true);};
  const stopTimer=()=>{setTimerActive(false);setTimerRem(timerInput);setTimerBase(timerInput);};
  const restartTimer=()=>{
    // Clear any existing interval directly
    clearInterval(intRef.current);
    // Reset time
    setTimerBase(timerInput);
    setTimerRem(timerInput);
    // If already active, restart interval manually since setTimerActive(true) won't re-trigger useEffect
    if(timerActive){
      intRef.current=setInterval(()=>{
        setTimerRem(r=>{
          if(r<=1){clearInterval(intRef.current);setTimerActive(false);beep();return 0;}
          return r-1;
        });
      },1000);
    } else {
      setTimerActive(true);
    }
  };

  const addExercise=()=>setWorkout(prev=>[...prev,{id:uid(),muscleGroup:"Chest",name:PRESETS["Chest"][0],isCustom:false,sets:[]}]);
  const updateExercise=(id,u)=>setWorkout(prev=>prev.map(e=>e.id===id?u:e));
  const deleteExercise=(id)=>setWorkout(prev=>prev.filter(e=>e.id!==id));

  const totalSets=workout.reduce((a,e)=>a+e.sets.length,0);

  // --- Streak calculation (36hr grace period) ---
  const calcStreak = (sessionList) => {
    if(!sessionList.length) return 0;
    const tds = d => new Date(d).toLocaleDateString("en-US");
    const days = [...new Set(sessionList.map(s=>tds(s.date)))];
    // Sort descending
    days.sort((a,b)=>new Date(b)-new Date(a));
    // Check if most recent session is within 36 hours
    const lastDate = new Date(sessionList[0].date);
    if(Date.now()-lastDate.getTime() > 36*3600*1000) return 0;
    let streak=1;
    for(let i=0;i<days.length-1;i++){
      const diff=(new Date(days[i])-new Date(days[i+1]))/864e5;
      if(diff<=2) streak++; else break;
    }
    return streak;
  };
  const streak = calcStreak(sessions);

  const MILESTONES = [
    {days:3,   msg:"3 days strong! You're building a habit. 💪"},
    {days:7,   msg:"One full week! You showed up every day. 🔥"},
    {days:14,  msg:"Two weeks straight! You're unstoppable. ⚡"},
    {days:30,  msg:"30 days! A month of dedication. 🏆"},
    {days:60,  msg:"60 days! This is who you are now. 🥇"},
    {days:100, msg:"100 days! Absolute legend. 🎖️"},
  ];

  const saveSession=()=>{
    const valid=workout.some(e=>e.sets.some(s=>s.weight&&s.reps));
    if(!valid){setSaveFlash("error");setTimeout(()=>setSaveFlash(null),900);return;}
    if(!workoutName){setSaveFlash("noname");setTimeout(()=>setSaveFlash(null),900);return;}
    // Persist any new custom exercise names per muscle group
    const newCustom={...customExercises};
    workout.forEach(e=>{
      if(e.isCustom&&e.name.trim()){
        if(!newCustom[e.muscleGroup]) newCustom[e.muscleGroup]=[];
        if(!newCustom[e.muscleGroup].includes(e.name.trim()))
          newCustom[e.muscleGroup]=[...newCustom[e.muscleGroup],e.name.trim()];
      }
    });
    setCustomExercises(newCustom);

    // --- PR detection (collect all PRs) ---
    const prsFound = [];
    workout.forEach(ex=>{
      const bestNow = Math.max(...ex.sets.map(s=>parseFloat(s.weight)||0));
      if(!bestNow) return;
      const prevBest = sessions.flatMap(s=>s.exercises.filter(e=>e.name===ex.name).flatMap(e=>e.sets.map(st=>parseFloat(st.weight)||0)));
      const prevMax = prevBest.length ? Math.max(...prevBest) : 0;
      if(bestNow > prevMax) prsFound.push({exerciseName: ex.name, weight: bestNow});
    });

    const session={
      id:uid(),date:new Date().toISOString(),
      name:workoutName,
      notes:workoutNotes.trim(),
      exercises:workout.map(e=>({...e,sets:e.sets.filter(s=>s.weight||s.reps).map(({done,...s})=>s)})).filter(e=>e.sets.length>0)
    };

    setSessions(prev=>{
      const updated=[session,...prev];
      const newStreak = calcStreak(updated);
      const hit = MILESTONES.find(m=>m.days===newStreak);
      if(hit){
        const seenKey=`wl_milestone_${hit.days}`;
        if(!localStorage.getItem(seenKey)){
          localStorage.setItem(seenKey,"1");
          setTimeout(()=>{ setMilestoneBanner(hit); setTimeout(()=>setMilestoneBanner(null),5000); },600);
        }
      }
      return updated;
    });

    setWorkout([]); setWorkoutName(""); setWorkoutNotes("");
    setSaveFlash("success"); setTimeout(()=>setSaveFlash(null),800);
    // Show summary overlay instead of navigating away
    setSummary({session, prs: prsFound});
  };

  const deleteSession=(id)=>setSessions(prev=>prev.filter(s=>s.id!==id));
  const timerPct=(timerActive||timerRem<timerBase)?((timerRem/timerBase)*100):100;

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:T.fontBody,color:T.textPrimary}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Share+Tech+Mono&family=Bebas+Neue&family=DM+Mono:wght@300;400;500&family=Exo+2:wght@300;400;600&family=Fira+Code:wght@300;400;500&family=Rajdhani:wght@400;500;600&family=JetBrains+Mono:wght@300;400;500&family=Playfair+Display:wght@400;700&family=Courier+Prime:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${T.bg}}::-webkit-scrollbar-thumb{background:${T.scrollThumb};border-radius:2px}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        .fade{animation:fi 0.25s ease}
        @keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fok{0%,100%{box-shadow:none}50%{box-shadow:0 0 0 2px #22c55e}}
        @keyframes ferr{0%,100%{box-shadow:none}50%{box-shadow:0 0 0 2px #ef4444}}
        .fok{animation:fok 0.5s ease}.ferr{animation:ferr 0.5s ease}
        .timer-ring{transition:stroke-dashoffset 1s linear}
        select option{background:${T.selectBg}}
        optgroup{background:${T.selectBg}}
      `}</style>

      {/* PR Banner */}
      {prBanner&&(
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:100,background:"linear-gradient(135deg,#f59e0b,#d97706)",borderRadius:10,padding:"12px 20px",boxShadow:"0 4px 20px rgba(0,0,0,0.3)",textAlign:"center",animation:"fi 0.3s ease",minWidth:260}}>
          <div style={{fontSize:18,marginBottom:2}}>🏆 New Personal Record!</div>
          <div style={{fontSize:14,opacity:0.9,fontFamily:"inherit"}}>{prBanner.exerciseName} — {prBanner.weight} lbs</div>
        </div>
      )}
      {/* Milestone Banner */}
      {milestoneBanner&&(
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:100,background:`linear-gradient(135deg,${T.accentDim},${T.accentDim2})`,border:`1px solid ${T.accent}`,borderRadius:10,padding:"14px 22px",boxShadow:"0 4px 20px rgba(0,0,0,0.3)",textAlign:"center",animation:"fi 0.3s ease",minWidth:280}}>
          <div style={{fontSize:22,marginBottom:4}}>🔥 {milestoneBanner.days} Day Streak!</div>
          <div style={{fontSize:13,color:T.accentText,opacity:0.9,fontFamily:"inherit"}}>{milestoneBanner.msg}</div>
        </div>
      )}
      {/* Workout Summary Overlay */}
      {summary&&(
        <div style={{position:"fixed",inset:0,zIndex:200,background:T.bg+"ee",display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto",padding:"24px 16px 40px"}}>
          <div className="fade" style={{width:"100%",maxWidth:580,background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
            {/* Header */}
            <div style={{padding:"20px 20px 16px",borderBottom:`1px solid ${T.borderSubtle}`,background:T.surfaceDeep}}>
              <div style={{fontFamily:T.fontDisplay,fontSize:26,color:T.accent,letterSpacing:"0.06em",marginBottom:4}}>{summary.session.name}</div>
              <div style={{fontSize:13,color:T.muted}}>{fmtDate(summary.session.date)}</div>
            </div>

            {/* Stats row */}
            {(()=>{
              const totalSets = summary.session.exercises.reduce((a,e)=>a+e.sets.length,0);
              const totalVol  = summary.session.exercises.reduce((a,e)=>a+e.sets.reduce((b,s)=>(parseFloat(s.weight)||0)*(parseInt(s.reps)||0)+b,0),0);
              const fmtVol = v => v>=1000?`${(v/1000).toFixed(1)}k`:Math.round(v)+"";
              return (
                <div style={{display:"flex",padding:"14px 20px",gap:12,borderBottom:`1px solid ${T.borderSubtle}`}}>
                  {[
                    {label:"EXERCISES", value: summary.session.exercises.length},
                    {label:"TOTAL SETS",  value: totalSets},
                    {label:"VOLUME",      value: totalVol>0?`${fmtVol(totalVol)} lbs`:"—"},
                  ].map(s=>(
                    <div key={s.label} style={{flex:1,background:T.surfaceDeep,borderRadius:8,padding:"10px 8px",textAlign:"center",border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:10,color:T.dimmer,letterSpacing:"0.12em",marginBottom:3}}>{s.label}</div>
                      <div style={{fontSize:18,color:T.textPrimary,fontFamily:T.fontDisplay}}>{s.value}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* PRs */}
            {summary.prs.length>0&&(
              <div style={{padding:"12px 20px",borderBottom:`1px solid ${T.borderSubtle}`,background:"#f59e0b18"}}>
                <div style={{fontSize:11,letterSpacing:"0.14em",color:"#d97706",textTransform:"uppercase",marginBottom:8}}>🏆 Personal Records</div>
                {summary.prs.map((pr,i)=>(
                  <div key={i} style={{fontSize:14,color:T.textPrimary,marginBottom:4}}>
                    <span style={{color:"#f59e0b",fontWeight:500}}>{pr.exerciseName}</span>
                    <span style={{color:T.muted}}> — </span>
                    <span>{pr.weight} lbs</span>
                  </div>
                ))}
              </div>
            )}

            {/* Exercise breakdown */}
            <div style={{padding:"12px 20px",borderBottom:`1px solid ${T.borderSubtle}`}}>
              <div style={{fontSize:11,letterSpacing:"0.14em",color:T.dimmer,textTransform:"uppercase",marginBottom:10}}>Exercises</div>
              {summary.session.exercises.map(ex=>(
                <div key={ex.id} style={{marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontSize:10,padding:"1px 7px",borderRadius:3,background:MC[ex.muscleGroup]+"22",color:MC[ex.muscleGroup],textTransform:"uppercase",letterSpacing:"0.06em"}}>{ex.muscleGroup}</span>
                    <span style={{fontSize:14,color:T.textPrimary,fontWeight:500}}>{ex.name}</span>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,paddingLeft:4}}>
                    {ex.sets.map((s,i)=>{
                      const isPR = summary.prs.some(p=>p.exerciseName===ex.name&&parseFloat(s.weight)>=p.weight);
                      return (
                        <span key={i} style={{fontSize:12,padding:"3px 9px",borderRadius:5,background:isPR?"#f59e0b22":T.surfaceDeep,border:`1px solid ${isPR?"#f59e0b44":T.border}`,color:isPR?"#f59e0b":T.muted}}>
                          {s.weight||"—"} × {s.reps||"—"}{isPR?" 🏆":""}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            {summary.session.notes&&(
              <div style={{padding:"12px 20px",borderBottom:`1px solid ${T.borderSubtle}`}}>
                <div style={{fontSize:11,letterSpacing:"0.14em",color:T.dimmer,textTransform:"uppercase",marginBottom:6}}>Notes</div>
                <div style={{fontSize:13,color:T.textSecondary,fontStyle:"italic",lineHeight:1.6}}>{summary.session.notes}</div>
              </div>
            )}

            {/* Done button */}
            <div style={{padding:"16px 20px",display:"flex",gap:10}}>
              <button onClick={()=>{setSummary(null);setView("log");}}
                style={{flex:1,padding:"12px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",background:"transparent",border:`1px solid ${T.border}`,color:T.muted,fontSize:14,letterSpacing:"0.08em",textTransform:"uppercase",outline:"none"}}>
                New Workout
              </button>
              <button onClick={()=>{setSummary(null);setView("history");}}
                style={{flex:2,padding:"12px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",background:`linear-gradient(135deg,${T.accentDim},${T.accentDim2})`,border:"none",color:T.accentText,fontSize:14,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:500,outline:"none"}}>
                Done ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{borderBottom:`1px solid ${T.borderSubtle}`,padding:"12px 20px 0",position:"sticky",top:0,background:T.bg,zIndex:10}}>
        {/* Row 1: Logo + theme controls */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <span style={{fontFamily:T.fontDisplay,fontSize:30,letterSpacing:"0.08em",color:T.accent}}>IRON LOG</span>
          {streak>0&&(
            <span style={{fontSize:14,color:T.accent,letterSpacing:"0.04em",fontFamily:T.fontBody}}>
              🔥 {streak} day{streak!==1?"s":""}
            </span>
          )}
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {/* Light mode toggle */}
            <button
              title={T.isLight ? "Switch to dark" : "Switch to light"}
              onClick={() => setThemeKey(T.isLight ? "void" : "light")}
              style={{width:28,height:28,borderRadius:"50%",background:T.surface,border:`1px solid ${T.border}`,color:T.textPrimary,cursor:"pointer",outline:"none",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
              {T.isLight ? "🌙" : "☀️"}
            </button>
            {/* Theme dots */}
            <div style={{display:"flex",gap:5}}>
              {Object.entries(THEMES).filter(([key])=>key!=="light").map(([key,th])=>(
                <button key={key} title={th.name} onClick={()=>setThemeKey(key)}
                  style={{width:14,height:14,borderRadius:"50%",background:th.accent,border:themeKey===key?`2px solid ${T.textPrimary}`:"2px solid transparent",cursor:"pointer",outline:"none",transition:"transform 0.15s",transform:themeKey===key?"scale(1.25)":"scale(1)",padding:0}}/>
              ))}
            </div>
          </div>
        </div>
        {/* Row 2: Nav buttons */}
        <div style={{display:"flex"}}>
          {[["log","⊕ Workout"],["history",`◫ History (${sessions.length})`],["trends","↗ Trends"]].map(([v,label])=>(
            <button key={v} onClick={()=>setView(v)}
              style={{flex:1,padding:"8px 4px",borderRadius:0,fontSize:13,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",fontFamily:"inherit",border:"none",borderBottom:`2px solid ${view===v?T.accent:"transparent"}`,background:"transparent",color:view===v?T.accent:T.muted,transition:"all 0.15s",outline:"none"}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:660,margin:"0 auto",padding:"20px 16px 80px"}}>

        {view==="log"&&(
          <div className="fade" style={{display:"flex",flexDirection:"column",gap:14}}>

            {/* Rest Timer */}
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
              <div style={{fontSize:12,letterSpacing:"0.16em",color:T.dimmer,textTransform:"uppercase",marginBottom:12}}>REST TIMER</div>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <div style={{position:"relative",width:72,height:72,flexShrink:0}}>
                  <svg width="72" height="72" style={{transform:"rotate(-90deg)"}}>
                    <circle cx="36" cy="36" r="30" fill="none" stroke={T.border} strokeWidth="5"/>
                    <circle className="timer-ring" cx="36" cy="36" r="30" fill="none"
                      stroke={timerRem===0?"#ef4444":timerActive?T.timerActive:T.timerIdle}
                      strokeWidth="5" strokeLinecap="round"
                      strokeDasharray={`${2*Math.PI*30}`}
                      strokeDashoffset={`${2*Math.PI*30*(1-timerPct/100)}`}/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:T.fontDisplay,fontSize:22,color:timerRem===0?"#ef4444":T.textPrimary}}>
                    {fmt(timerActive||timerRem<timerBase?timerRem:timerInput)}
                  </div>
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {[45,60,90,120,180].map(s=>(
                      <button key={s} onClick={()=>{setTimerInput(s);if(!timerActive)setTimerRem(s);}}
                        style={{padding:"4px 9px",borderRadius:4,fontSize:13,cursor:"pointer",fontFamily:"inherit",border:`1px solid ${timerInput===s?T.timerIdle:T.border}`,background:timerInput===s?T.dimmest:"transparent",color:timerInput===s?T.accent:T.muted,outline:"none"}}>
                        {s}s
                      </button>
                    ))}
                    <input type="number" value={timerInput} onChange={e=>{const v=Math.max(1,parseInt(e.target.value)||1);setTimerInput(v);if(!timerActive)setTimerRem(v);}}
                      style={{width:52,padding:"4px 6px",borderRadius:4,background:T.inputBg,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:14,textAlign:"center",fontFamily:"inherit",outline:"none"}}/>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={timerActive?stopTimer:startTimer}
                      style={{flex:1,padding:"7px",borderRadius:5,cursor:"pointer",fontFamily:"inherit",border:`1px solid ${timerActive?(T.isLight?"#d4b8b8":"#6b2424"):T.timerIdle}`,background:timerActive?(T.isLight?"#fde8e8":"#2a1a1a"):T.surface,color:timerActive?"#ef4444":T.accent,fontSize:14,letterSpacing:"0.1em",textTransform:"uppercase",outline:"none"}}>
                      {timerActive?"⏹ Stop":timerRem<timerBase&&timerRem>0?"▶ Resume":"▶ Start"}
                    </button>
                    {!timerActive&&<button onClick={()=>{setTimerRem(timerInput);setTimerBase(timerInput);}}
                      style={{padding:"7px 12px",borderRadius:5,cursor:"pointer",background:"transparent",border:`1px solid ${T.border}`,color:T.muted,fontSize:15,outline:"none"}}>↺</button>}
                  </div>
                </div>
              </div>
            </div>

            {/* Workout name */}
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <select value={workoutName} onChange={e=>setWorkoutName(e.target.value)}
                style={{flex:1,padding:"10px 14px",borderRadius:7,background:T.surface,border:`1px solid ${T.border}`,color:workoutName?T.textPrimary:T.muted,fontSize:16,fontFamily:"inherit",outline:"none"}}>
                <option value="" disabled>Select workout type...</option>
                {["Arm Day","Leg Day","Back Day","Chest Day","Push Day","Pull Day"].map(n=>(
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              {totalSets>0&&<span style={{fontSize:13,color:T.muted,whiteSpace:"nowrap"}}>{totalSets} SET{totalSets!==1?"S":""}</span>}
            </div>

            {/* Workout notes */}
            <textarea value={workoutNotes} onChange={e=>setWorkoutNotes(e.target.value)}
              placeholder="Session notes (how you felt, PRs, anything worth remembering...)"
              rows={3}
              style={{width:"100%",padding:"10px 14px",borderRadius:7,background:T.surface,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:14,fontFamily:"inherit",outline:"none",resize:"vertical",lineHeight:1.5}}/>

            {/* Exercise blocks */}
            {workout.length===0&&(
              <div style={{textAlign:"center",padding:"32px 0",color:T.border,fontSize:15,letterSpacing:"0.1em",border:`1px dashed ${T.borderSubtle}`,borderRadius:10}}>
                ADD AN EXERCISE TO GET STARTED
              </div>
            )}
            {workout.map(ex=>{
              // Find the sets from the most recent session that included this exercise
              const prevSession = sessions.find(s=>s.exercises.some(e=>e.name===ex.name));
              const prevSets = prevSession?.exercises.find(e=>e.name===ex.name)?.sets || [];
              return (
                <ExerciseBlock key={ex.id} ex={ex}
                  customExercises={customExercises}
                  T={T}
                  prevSets={prevSets}
                  onUpdateEx={u=>updateExercise(ex.id,u)}
                  onDeleteEx={()=>deleteExercise(ex.id)}
                  onAddSet={restartTimer}/>
              );
            })}

            {/* Templates */}
            {templates.length>0&&(
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:12,letterSpacing:"0.14em",color:T.dimmer,textTransform:"uppercase",marginBottom:10}}>Load Template</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {templates.map(tmpl=>(
                    <div key={tmpl.id} style={{display:"flex",alignItems:"center",gap:8}}>
                      <button onClick={()=>loadTemplate(tmpl.id)}
                        style={{flex:1,padding:"9px 12px",borderRadius:6,cursor:"pointer",fontFamily:"inherit",background:T.surfaceDeep,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:14,textAlign:"left",outline:"none",transition:"all 0.15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent;}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textPrimary;}}>
                        <span style={{marginRight:8,color:T.accent}}>▶</span>{tmpl.name}
                        <span style={{marginLeft:8,fontSize:11,color:T.muted}}>{tmpl.exercises.length} exercise{tmpl.exercises.length!==1?"s":""}</span>
                      </button>
                      <button onClick={()=>deleteTemplate(tmpl.id)}
                        style={{background:"none",border:"none",color:T.dimmest,cursor:"pointer",fontSize:16,outline:"none",padding:"4px 6px",flexShrink:0}}
                        onMouseEnter={e=>e.target.style.color="#ef4444"} onMouseLeave={e=>e.target.style.color=T.dimmest}>✕</button>
                    </div>
                  ))}
                </div>
                {templateFlash&&(
                  <div style={{marginTop:8,fontSize:12,color:templateFlash==="saved"?"#22c55e":"#ef4444",letterSpacing:"0.04em"}}>
                    {templateFlash==="saved"?"✓ Template saved!":"Template deleted."}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{display:"flex",gap:10}}>
              <button onClick={addExercise}
                style={{flex:1,padding:"11px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",background:"transparent",border:`1px solid ${T.border}`,color:T.accent,fontSize:14,letterSpacing:"0.1em",textTransform:"uppercase",transition:"all 0.15s",outline:"none"}}
                onMouseEnter={e=>e.currentTarget.style.background=T.surface}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                + Add Exercise
              </button>
              {workout.length>0&&(
                <button onClick={saveSession}
                  className={saveFlash==="success"?"fok":saveFlash==="error"?"ferr":""}
                  style={{flex:1,padding:"11px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",background:`linear-gradient(135deg,${T.accentDim},${T.accentDim2})`,border:"none",color:T.accentText,fontSize:14,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:500,outline:"none"}}>
                  {saveFlash==="success"?"✓ Saved!":saveFlash==="error"?"Add weight & reps first":saveFlash==="noname"?"Select a workout type":"Save Workout"}
                </button>
              )}
            </div>

            {/* Save as Template */}
            {workout.length>0&&(
              <div>
                {!showSaveTemplate?(
                  <button onClick={()=>setShowSaveTemplate(true)}
                    style={{width:"100%",padding:"9px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",background:"transparent",border:`1px dashed ${T.border}`,color:T.dimmer,fontSize:12,letterSpacing:"0.1em",textTransform:"uppercase",outline:"none",transition:"all 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.dimmer;}}>
                    ☆ Save as Template
                  </button>
                ):(
                  <div style={{display:"flex",gap:8}}>
                    <input
                      value={templateName}
                      onChange={e=>setTemplateName(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter")saveTemplate();if(e.key==="Escape"){setShowSaveTemplate(false);setTemplateName("");}}}
                      placeholder="Template name (e.g. My Push Day)..."
                      autoFocus
                      style={{flex:1,padding:"10px 14px",borderRadius:7,background:T.surface,border:`1px solid ${T.accent}`,color:T.textPrimary,fontSize:14,fontFamily:"inherit",outline:"none"}}/>
                    <button onClick={saveTemplate} disabled={!templateName.trim()}
                      style={{padding:"10px 16px",borderRadius:7,cursor:templateName.trim()?"pointer":"not-allowed",fontFamily:"inherit",background:templateName.trim()?T.accentDim:"transparent",border:`1px solid ${T.border}`,color:templateName.trim()?T.accentText:T.dimmer,fontSize:13,outline:"none",transition:"all 0.15s"}}>
                      Save
                    </button>
                    <button onClick={()=>{setShowSaveTemplate(false);setTemplateName("");}}
                      style={{padding:"10px 12px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",background:"transparent",border:`1px solid ${T.border}`,color:T.muted,fontSize:13,outline:"none"}}>
                      ✕
                    </button>
                  </div>
                )}
                {templateFlash&&!showSaveTemplate&&(
                  <div style={{marginTop:6,fontSize:12,color:templateFlash==="saved"?"#22c55e":"#ef4444",letterSpacing:"0.04em",textAlign:"center"}}>
                    {templateFlash==="saved"?"✓ Template saved!":"Template deleted."}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {view==="history"&&(
          <div className="fade">
            {/* Date range picker */}
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
              <div style={{fontSize:12,letterSpacing:"0.14em",color:T.dimmer,textTransform:"uppercase",marginBottom:10}}>Date Range</div>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {[{key:"7d",label:"7D"},{key:"30d",label:"30D"},{key:"90d",label:"90D"},{key:"1y",label:"1Y"},{key:"all",label:"ALL"}].map(p=>(
                  <button key={p.key} onClick={()=>applyHistPreset(p.key)}
                    style={{flex:1,padding:"8px 4px",borderRadius:5,cursor:"pointer",fontFamily:"inherit",
                      border:`1px solid ${histPreset===p.key?T.accent:T.border}`,
                      background:histPreset===p.key?T.accentDim:"transparent",
                      color:histPreset===p.key?T.accentText:T.muted,
                      fontSize:13,letterSpacing:"0.08em",outline:"none",transition:"all 0.15s"}}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input type="date" value={histRangeStart} onChange={e=>{setHistRangeStart(e.target.value);setHistPreset(null);}}
                  style={{flex:1,padding:"8px 10px",borderRadius:6,background:T.inputBg,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:13,fontFamily:"inherit",outline:"none",colorScheme:T.isLight?"light":"dark"}}/>
                <span style={{color:T.dimmer,fontSize:14}}>→</span>
                <input type="date" value={histRangeEnd} onChange={e=>{setHistRangeEnd(e.target.value);setHistPreset(null);}}
                  style={{flex:1,padding:"8px 10px",borderRadius:6,background:T.inputBg,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:13,fontFamily:"inherit",outline:"none",colorScheme:T.isLight?"light":"dark"}}/>
              </div>
              {filteredSessions.length===0&&sessions.length>0&&(
                <div style={{marginTop:10,fontSize:13,color:T.muted}}>No sessions in this range — try widening it.</div>
              )}
            </div>

            {sessions.length===0?(
              <div style={{textAlign:"center",padding:"60px 0",color:T.border,fontSize:15,letterSpacing:"0.1em"}}>NO SESSIONS LOGGED YET</div>
            ):filteredSessions.length===0?null:(
              filteredSessions.map(session=>(
                <div key={session.id} style={{marginBottom:28}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <span style={{fontFamily:T.fontDisplay,fontSize:24,letterSpacing:"0.06em",color:T.accent}}>{session.name}</span>
                    <span style={{fontSize:13,color:T.muted}}>{fmtDate(session.date)}</span>
                    <div style={{flex:1,height:1,background:T.border}}/>
                    <span style={{fontSize:12,color:T.dimmer,letterSpacing:"0.1em"}}>{session.exercises.reduce((a,e)=>a+e.sets.length,0)} SETS</span>
                    <button onClick={()=>deleteSession(session.id)}
                      style={{background:"none",border:"none",color:T.dimmest,cursor:"pointer",fontSize:17,transition:"color 0.15s",outline:"none"}}
                      onMouseEnter={e=>e.target.style.color="#ef4444"} onMouseLeave={e=>e.target.style.color=T.dimmest}>✕</button>
                  </div>
                  {session.notes&&(
                    <div style={{padding:"8px 12px",marginBottom:8,borderRadius:7,background:T.surface,border:`1px solid ${T.borderSubtle}`,fontSize:13,color:T.textSecondary,lineHeight:1.6,fontStyle:"italic"}}>
                      {session.notes}
                    </div>
                  )}
                  {session.exercises.map(ex=>(
                    <div key={ex.id} style={{background:T.surface,border:`1px solid ${MC[ex.muscleGroup]}22`,borderRadius:8,marginBottom:8,overflow:"hidden"}}>
                      <div style={{padding:"8px 14px",background:T.surfaceDeep,display:"flex",alignItems:"center",gap:10,borderBottom:`1px solid ${T.borderSubtle}`}}>
                        <span style={{fontSize:12,padding:"2px 8px",borderRadius:3,background:MC[ex.muscleGroup]+"22",color:MC[ex.muscleGroup],letterSpacing:"0.08em",textTransform:"uppercase"}}>{ex.muscleGroup}</span>
                        <span style={{fontSize:16,color:T.textPrimary}}>{ex.name}</span>
                        <span style={{fontSize:13,color:T.dimmer,marginLeft:"auto"}}>{ex.sets.length} set{ex.sets.length!==1?"s":""}</span>
                      </div>
                      <div style={{padding:"4px 14px 8px"}}>
                        {ex.sets.map((s,i)=>(
                          <div key={s.id} style={{display:"flex",alignItems:"center",gap:12,padding:"5px 0",borderBottom:i<ex.sets.length-1?`1px solid ${T.borderSubtle}`:"none"}}>
                            <span style={{fontFamily:T.fontDisplay,fontSize:17,color:T.dimmest,width:18}}>{i+1}</span>
                            <span style={{fontSize:16,color:T.accent,minWidth:70}}>{s.weight?`${s.weight} lbs`:"—"}</span>
                            <span style={{fontSize:14,color:T.dimmer}}>×</span>
                            <span style={{fontSize:16,color:T.textPrimary}}>{s.reps?`${s.reps} reps`:"—"}</span>
                            {s.note&&<span style={{fontSize:13,color:T.muted,flex:1}}>{s.note}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
            {/* File backup / restore */}
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 18px",marginTop:24}}>
              <div style={{fontSize:12,letterSpacing:"0.14em",color:T.dimmer,textTransform:"uppercase",marginBottom:12}}>Backup & Restore</div>
              <div style={{display:"flex",gap:10,marginBottom:restoreMsg?10:0}}>
                <button onClick={saveBackup}
                  style={{flex:1,padding:"11px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",background:`linear-gradient(135deg,${T.accentDim},${T.accentDim2})`,border:"none",color:T.accentText,fontSize:13,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:500,outline:"none",transition:"all 0.2s"}}>
                  ↓ Save Backup
                </button>
                <button onClick={()=>fileInputRef.current?.click()}
                  style={{flex:1,padding:"11px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",background:"transparent",border:`1px solid ${T.border}`,color:T.accent,fontSize:13,letterSpacing:"0.08em",textTransform:"uppercase",outline:"none",transition:"all 0.2s"}}>
                  ↑ Restore
                </button>
                <input ref={fileInputRef} type="file" accept=".ilbak" onChange={restoreBackup} style={{display:"none"}}/>
              </div>
              {restoreMsg&&(
                <div style={{fontSize:13,color:restoreMsg.type==="error"?"#ef4444":"#22c55e",letterSpacing:"0.04em",paddingTop:4}}>
                  {restoreMsg.type==="error"?"⚠ ":""}{restoreMsg.text}
                </div>
              )}
              <div style={{fontSize:12,color:T.dimmer,marginTop:10,lineHeight:1.5}}>
                Downloads an <span style={{color:T.muted}}>.ilbak</span> file. Restore merges with existing history — no duplicates.
              </div>
            </div>
            {sessions.length>0&&(
              <div style={{textAlign:"center",marginTop:16}}>
                <button onClick={()=>{if(confirm("Clear all history?"))setSessions([]);}}
                  style={{padding:"8px 20px",borderRadius:6,background:"transparent",border:`1px solid ${T.isLight?"#d4b8b8":"#2a1a1a"}`,color:T.isLight?"#b04040":"#4a1a1a",fontSize:13,letterSpacing:"0.1em",fontFamily:"inherit",cursor:"pointer",transition:"all 0.15s",outline:"none"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="#ef4444";e.currentTarget.style.borderColor="#ef4444"}}
                  onMouseLeave={e=>{e.currentTarget.style.color=T.isLight?"#b04040":"#4a1a1a";e.currentTarget.style.borderColor=T.isLight?"#d4b8b8":"#2a1a1a"}}>
                  CLEAR ALL HISTORY
                </button>
              </div>
            )}
          </div>
        )}

        {view==="trends"&&(
          <TrendsView sessions={sessions} T={T}/>
        )}
      </div>
    </div>
  );
}
