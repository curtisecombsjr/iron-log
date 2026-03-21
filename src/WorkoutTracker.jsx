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

function SetRow({ set, idx, onUpdate, onDelete, T }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${T.borderSubtle}`}}>
      <span style={{fontFamily:T.fontDisplay,fontSize:18,color:T.timerIdle,width:20,textAlign:"center"}}>{idx+1}</span>
      <input type="number" value={set.weight} placeholder="lbs"
        onChange={e=>onUpdate({...set,weight:e.target.value})}
        style={{width:64,padding:"5px 8px",borderRadius:5,background:T.surfaceDeep,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:16,textAlign:"center",fontFamily:"inherit",outline:"none"}}/>
      <span style={{color:T.dimmer,fontSize:15}}>×</span>
      <input type="number" value={set.reps} placeholder="reps"
        onChange={e=>onUpdate({...set,reps:e.target.value})}
        style={{width:54,padding:"5px 8px",borderRadius:5,background:T.surfaceDeep,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:16,textAlign:"center",fontFamily:"inherit",outline:"none"}}/>
      <input value={set.note} placeholder="note"
        onChange={e=>onUpdate({...set,note:e.target.value})}
        style={{flex:1,padding:"5px 8px",borderRadius:5,background:T.surfaceDeep,border:`1px solid ${T.borderSubtle}`,color:T.textSecondary,fontSize:14,fontFamily:"inherit",outline:"none"}}/>
      <button onClick={onDelete}
        style={{background:"none",border:"none",color:T.dimmest,cursor:"pointer",fontSize:19,lineHeight:1,padding:"0 4px",transition:"color 0.15s"}}
        onMouseEnter={e=>e.target.style.color="#ef4444"} onMouseLeave={e=>e.target.style.color=T.dimmest}>×</button>
    </div>
  );
}

function ExerciseBlock({ ex, customExercises, T, onUpdateEx, onDeleteEx }) {
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
        {ex.sets.map((s,i)=>(
          <SetRow key={s.id} set={s} idx={i} T={T} onUpdate={u=>updateSet(s.id,u)} onDelete={()=>deleteSet(s.id)}/>
        ))}
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
  // Build list of all exercises ever logged
  const allExercises = [...new Set(
    sessions.flatMap(s => s.exercises.map(e => e.name))
  )].sort();

  const [selectedEx, setSelectedEx] = useState(allExercises[0] || "");

  // --- Strength chart data: best set (max weight) per session for selected exercise ---
  const strengthData = sessions
    .slice().reverse()
    .flatMap(s => {
      const matches = s.exercises.filter(e => e.name === selectedEx);
      if (!matches.length) return [];
      const bestWeight = Math.max(...matches.flatMap(e => e.sets.map(st => parseFloat(st.weight)||0)));
      if (!bestWeight) return [];
      return [{ date: s.date, label: fmtDate(s.date), value: bestWeight }];
    });

  // --- Volume chart data: total volume (weight*reps) per muscle group across all sessions ---
  const volumeByMuscle = MUSCLE_GROUPS.map(mg => {
    const total = sessions.reduce((sum, s) => {
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

  return (
    <div className="fade" style={{display:"flex",flexDirection:"column",gap:20}}>

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
  const [themeKey, setThemeKey] = useState(()=>localStorage.getItem("wl_theme")||"void");
  const T = THEMES[themeKey]||THEMES.void;
  const [workout, setWorkout] = useState([]);
  const [workoutName, setWorkoutName] = useState("");
  const [sessions, setSessions] = useState(()=>JSON.parse(localStorage.getItem("wl_sessions2")||"[]"));
  const [customExercises, setCustomExercises] = useState(()=>JSON.parse(localStorage.getItem("wl_custom_ex")||"{}"));
  const [saveFlash, setSaveFlash] = useState(null);
  const [driveStatus, setDriveStatus] = useState(null);
  const [driveMsg, setDriveMsg] = useState("");

  const BACKUP_FILENAME = "iron-log-backup.json";

  const driveBackup = async () => {
    setDriveStatus("backing-up");
    setDriveMsg("");
    try {
      const payload = { sessions, customExercises, exportedAt: new Date().toISOString() };
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          mcp_servers: [{ type: "url", url: "https://gdrive.mcp.claude.com/mcp", name: "gdrive" }],
          messages: [{ role: "user", content: `Save this JSON to a file called "${BACKUP_FILENAME}" in the root of Google Drive, overwriting if it already exists. Just do it, no explanation needed. Here is the content:\n\n${JSON.stringify(payload)}` }],
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error?.message || "API error");
      setDriveStatus("success-backup");
      setDriveMsg(`Backed up ${sessions.length} session${sessions.length!==1?"s":""}`);
    } catch (e) {
      setDriveStatus("error");
      setDriveMsg(e.message || "Backup failed");
    }
    setTimeout(() => setDriveStatus(null), 4000);
  };

  const driveRestore = async () => {
    if (!confirm("Restore from Google Drive? This will merge with your current history.")) return;
    setDriveStatus("restoring");
    setDriveMsg("");
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          mcp_servers: [{ type: "url", url: "https://gdrive.mcp.claude.com/mcp", name: "gdrive" }],
          messages: [{ role: "user", content: `Find the file called "${BACKUP_FILENAME}" in Google Drive and return ONLY its raw JSON content, nothing else — no explanation, no markdown, no code fences. Just the raw JSON string.` }],
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error?.message || "API error");
      const text = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
      const clean = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
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
      const newCount = parsed.sessions.length;
      setDriveStatus("success-restore");
      setDriveMsg(`Restored ${newCount} session${newCount!==1?"s":""}`);
    } catch (e) {
      setDriveStatus("error");
      setDriveMsg(e.message || "Restore failed. Is the backup file in Drive?");
    }
    setTimeout(() => setDriveStatus(null), 4000);
  };

  const [timerActive, setTimerActive] = useState(false);
  const [timerInput, setTimerInput] = useState(90);
  const [timerBase, setTimerBase] = useState(90);
  const [timerRem, setTimerRem] = useState(90);
  const intRef = useRef(null);

  useEffect(()=>{localStorage.setItem("wl_sessions2",JSON.stringify(sessions));},[sessions]);
  useEffect(()=>{localStorage.setItem("wl_custom_ex",JSON.stringify(customExercises));},[customExercises]);
  useEffect(()=>{localStorage.setItem("wl_theme",themeKey);},[themeKey]);

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
      [0,0.18,0.36].forEach(t=>{
        const o=ctx.createOscillator(),g=ctx.createGain();
        o.connect(g);g.connect(ctx.destination);
        o.frequency.value=880;
        g.gain.setValueAtTime(0.35,ctx.currentTime+t);
        g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+t+0.14);
        o.start(ctx.currentTime+t);o.stop(ctx.currentTime+t+0.15);
      });
    }catch{}
  };

  const startTimer=()=>{setTimerBase(timerInput);setTimerRem(timerInput);setTimerActive(true);};
  const stopTimer=()=>{setTimerActive(false);setTimerRem(timerInput);setTimerBase(timerInput);};

  const addExercise=()=>setWorkout(prev=>[...prev,{id:uid(),muscleGroup:"Chest",name:PRESETS["Chest"][0],isCustom:false,sets:[]}]);
  const updateExercise=(id,u)=>setWorkout(prev=>prev.map(e=>e.id===id?u:e));
  const deleteExercise=(id)=>setWorkout(prev=>prev.filter(e=>e.id!==id));

  const totalSets=workout.reduce((a,e)=>a+e.sets.length,0);

  const saveSession=()=>{
    const valid=workout.some(e=>e.sets.some(s=>s.weight&&s.reps));
    if(!valid){setSaveFlash("error");setTimeout(()=>setSaveFlash(null),900);return;}
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
    const session={
      id:uid(),date:new Date().toISOString(),
      name:workoutName.trim()||"Workout",
      exercises:workout.map(e=>({...e,sets:e.sets.filter(s=>s.weight||s.reps)})).filter(e=>e.sets.length>0)
    };
    setSessions(prev=>[session,...prev]);
    setWorkout([]); setWorkoutName("");
    setSaveFlash("success"); setTimeout(()=>setSaveFlash(null),800);
    setView("history");
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

      {/* Header */}
      <div style={{borderBottom:`1px solid ${T.borderSubtle}`,padding:"12px 20px 0",position:"sticky",top:0,background:T.bg,zIndex:10}}>
        {/* Row 1: Logo + theme controls */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <span style={{fontFamily:T.fontDisplay,fontSize:30,letterSpacing:"0.08em",color:T.accent}}>IRON LOG</span>
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
              <input value={workoutName} onChange={e=>setWorkoutName(e.target.value)} placeholder="Workout name (e.g. Push Day)..."
                style={{flex:1,padding:"10px 14px",borderRadius:7,background:T.surface,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:16,fontFamily:"inherit",outline:"none"}}/>
              {totalSets>0&&<span style={{fontSize:13,color:T.muted,whiteSpace:"nowrap"}}>{totalSets} SET{totalSets!==1?"S":""}</span>}
            </div>

            {/* Exercise blocks */}
            {workout.length===0&&(
              <div style={{textAlign:"center",padding:"32px 0",color:T.border,fontSize:15,letterSpacing:"0.1em",border:`1px dashed ${T.borderSubtle}`,borderRadius:10}}>
                ADD AN EXERCISE TO GET STARTED
              </div>
            )}
            {workout.map(ex=>(
              <ExerciseBlock key={ex.id} ex={ex}
                customExercises={customExercises}
                T={T}
                onUpdateEx={u=>updateExercise(ex.id,u)}
                onDeleteEx={()=>deleteExercise(ex.id)}/>
            ))}

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
                  {saveFlash==="success"?"✓ Saved!":saveFlash==="error"?"Add weight & reps first":"Save Workout"}
                </button>
              )}
            </div>
          </div>
        )}

        {view==="history"&&(
          <div className="fade">
            {sessions.length===0?(
              <div style={{textAlign:"center",padding:"60px 0",color:T.border,fontSize:15,letterSpacing:"0.1em"}}>NO SESSIONS LOGGED YET</div>
            ):(
              sessions.map(session=>(
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
            {/* Drive backup / restore — always visible */}
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 18px",marginTop:24}}>
              <div style={{fontSize:12,letterSpacing:"0.14em",color:T.dimmer,textTransform:"uppercase",marginBottom:12}}>Google Drive Backup</div>
              <div style={{display:"flex",gap:10,marginBottom:driveMsg?10:0}}>
                <button onClick={driveBackup} disabled={!!driveStatus}
                  style={{flex:1,padding:"11px",borderRadius:7,cursor:driveStatus?"not-allowed":"pointer",fontFamily:"inherit",background:driveStatus==="success-backup"?T.accentDim:`linear-gradient(135deg,${T.accentDim},${T.accentDim2})`,border:"none",color:T.accentText,fontSize:13,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:500,outline:"none",opacity:driveStatus&&driveStatus!=="success-backup"?0.6:1,transition:"all 0.2s"}}>
                  {driveStatus==="backing-up"?"⏳ Saving…":driveStatus==="success-backup"?"✓ Backed Up":"☁ Back Up"}
                </button>
                <button onClick={driveRestore} disabled={!!driveStatus}
                  style={{flex:1,padding:"11px",borderRadius:7,cursor:driveStatus?"not-allowed":"pointer",fontFamily:"inherit",background:"transparent",border:`1px solid ${T.border}`,color:driveStatus==="success-restore"?"#22c55e":T.accent,fontSize:13,letterSpacing:"0.08em",textTransform:"uppercase",outline:"none",opacity:driveStatus&&driveStatus!=="success-restore"?0.6:1,transition:"all 0.2s"}}>
                  {driveStatus==="restoring"?"⏳ Restoring…":driveStatus==="success-restore"?"✓ Restored":"↓ Restore"}
                </button>
              </div>
              {driveMsg&&(
                <div style={{fontSize:13,color:driveStatus==="error"?"#ef4444":"#22c55e",letterSpacing:"0.04em",paddingTop:4}}>
                  {driveStatus==="error"?"⚠ ":""}{driveMsg}
                </div>
              )}
              <div style={{fontSize:12,color:T.dimmer,marginTop:10,lineHeight:1.5}}>
                Saves to <span style={{color:T.muted}}>iron-log-backup.json</span> in your Google Drive. Restore merges with existing history.
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
