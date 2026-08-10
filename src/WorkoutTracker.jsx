import { useState, useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { LocalNotifications } from "@capacitor/local-notifications";

const MUSCLE_GROUPS = ["Chest","Back","Shoulders","Biceps","Triceps","Legs","Glutes","Core"];
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

// --- "Unsaved workout" reminder (separate id/channel from the rest timer, which uses id 1) ---
const SAVE_REMINDER_ID = 2;
async function scheduleSaveReminder(workout){
  if(!Capacitor.isNativePlatform()) return;
  try{
    await LocalNotifications.requestPermissions();
    await LocalNotifications.createChannel({
      id:"save-reminder", name:"Unsaved Workout",
      description:"Reminds you to save a workout you're still logging.",
      importance:4, vibration:true, visibility:1,
    });
    // Smart body: call out a half-entered set (weight but no reps) if there is one.
    const missing = workout
      .flatMap(e=>e.sets.map(s=>({name:e.name,weight:s.weight,reps:s.reps})))
      .find(x=>x.weight&&!x.reps);
    const validCount = workout.reduce((n,e)=>n+e.sets.filter(s=>s.weight&&s.reps).length,0);
    const body = missing
      ? `Last set is missing reps — ${missing.name} ${missing.weight} × ?`
      : `Unsaved workout — ${validCount} set${validCount!==1?"s":""} logged. Tap to save.`;
    // allowWhileIdle so it fires during Doze instead of being deferred until foreground.
    await LocalNotifications.cancel({notifications:[{id:SAVE_REMINDER_ID}]});
    await LocalNotifications.schedule({notifications:[{
      id:SAVE_REMINDER_ID, title:"Iron Log", body,
      schedule:{ at:new Date(Date.now()+10*60*1000), allowWhileIdle:true },
      channelId:"save-reminder",
    }]});
  }catch{}
}
function cancelSaveReminder(){
  if(!Capacitor.isNativePlatform()) return;
  LocalNotifications.cancel({notifications:[{id:SAVE_REMINDER_ID}]}).catch(()=>{});
}

const THEMES = {
  light: { name:"Light", bg:"#f4f1ec", surface:"#fffefa", surfaceDeep:"#edeae4", border:"#d4cfc7", borderSubtle:"#e8e4dd", accent:"#1a1a2e", accentDim:"#2d2d4a", accentDim2:"#3d3d5c", accentText:"#fffefa", muted:"#8a8478", dimmer:"#6b6560", dimmest:"#c4bfb8", timerIdle:"#9a9490", timerActive:"#1a1a2e", textPrimary:"#1a1714", textSecondary:"#6b6560", scrollThumb:"#c4bfb8", selectBg:"#fffefa", inputBg:"#f4f1ec",
    fontDisplay:"'Bebas Neue',sans-serif", fontMono:"'DM Mono',monospace", fontBody:"'Inter',-apple-system,system-ui,sans-serif", isLight:true },
};

function SetRow({ set, idx, onUpdate, onDelete, T, onRestartTimer }) {
  const done = !!set.done;
  // Inline two-tap delete: first tap on a set with data arms a "Delete?" pill for 3s;
  // second tap confirms. Empty rows delete on the first tap. Replaces the native confirm().
  const [confirmDel, setConfirmDel] = useState(false);
  const delTimer = useRef(null);
  useEffect(()=>()=>clearTimeout(delTimer.current), []);
  const handleDel = () => {
    const hasData = !!(set.weight || set.reps);
    if(!hasData){ onDelete(); return; }
    if(confirmDel){ clearTimeout(delTimer.current); onDelete(); return; }
    setConfirmDel(true);
    try{navigator.vibrate&&navigator.vibrate(20);}catch{}
    clearTimeout(delTimer.current);
    delTimer.current = setTimeout(()=>setConfirmDel(false), 3000);
  };
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,padding:"6px 0",borderBottom:`1px solid ${T.borderSubtle}`,opacity:done?0.5:1,transition:"opacity 0.2s"}}>
      <span style={{fontFamily:T.fontDisplay,fontSize:18,color:T.timerIdle,width:20,textAlign:"center",flexShrink:0}}>{idx+1}</span>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <input type="number" value={set.weight} placeholder="lbs"
          onChange={e=>onUpdate({...set,weight:e.target.value})}
          disabled={done}
          style={{width:74,padding:"6px 10px",borderRadius:5,background:T.surfaceDeep,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:16,textAlign:"center",fontFamily:T.fontMono,outline:"none",textDecoration:done?"line-through":"none",cursor:done?"not-allowed":"text"}}/>
        <span style={{color:T.dimmer,fontSize:15}}>×</span>
        <input type="number" value={set.reps} placeholder="reps"
          onChange={e=>onUpdate({...set,reps:e.target.value})}
          disabled={done}
          style={{width:64,padding:"6px 10px",borderRadius:5,background:T.surfaceDeep,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:16,textAlign:"center",fontFamily:T.fontMono,outline:"none",textDecoration:done?"line-through":"none",cursor:done?"not-allowed":"text"}}/>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
        <button onClick={()=>{ const nowDone=!done; onUpdate({...set,done:nowDone}); if(nowDone){ onRestartTimer?.(); try{navigator.vibrate&&navigator.vibrate(40);}catch{} } }}
          style={{width:26,height:26,borderRadius:6,border:`2px solid ${done?T.accent:T.border}`,background:done?T.accent:"transparent",cursor:"pointer",outline:"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s",padding:0}}
          title={done?"Mark incomplete":"Mark complete"}>
          {done&&<span style={{color:T.isLight?"#fff":T.accentText,fontSize:14,lineHeight:1,fontWeight:"bold"}}>✓</span>}
        </button>
        <button onClick={handleDel}
          style={confirmDel
            ? {background:"#ef4444",border:"none",color:"#fff",cursor:"pointer",fontSize:12,lineHeight:1,padding:"5px 9px",borderRadius:5,letterSpacing:"0.04em",fontFamily:"inherit",outline:"none",whiteSpace:"nowrap"}
            : {background:"none",border:"none",color:T.dimmest,cursor:"pointer",fontSize:19,lineHeight:1,padding:"0 4px",transition:"color 0.15s",outline:"none"}}
          title={confirmDel?"Tap again to remove":"Remove set"}>
          {confirmDel?"Delete?":"×"}
        </button>
      </div>
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
    sync({sets:[...ex.sets,{id:uid(),weight:last?.weight||"",reps:last?.reps||""}]});
  };

  const best1RM = ex.sets.reduce((max, s) => {
    const w = parseFloat(s.weight) || 0;
    const r = parseInt(s.reps) || 0;
    if (!w || !r) return max;
    const e = w * (1 + r / 30);
    return e > max ? e : max;
  }, 0);
  const updateSet = (id,u) => sync({sets:ex.sets.map(s=>s.id===id?u:s)});
  const deleteSet = (id) => sync({sets:ex.sets.filter(s=>s.id!==id)});

  // Heaviest set from the most recent session with this exercise — shown up top so you
  // know last time's top set without pre-adding placeholder rows to reveal the ghosts.
  const lastTop = (prevSets||[]).reduce((best,s)=>{
    const w=parseFloat(s.weight)||0;
    if(!w) return best;
    return (!best || w>(parseFloat(best.weight)||0)) ? s : best;
  }, null);

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
        {lastTop&&(
          <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:8,padding:"4px 10px",borderRadius:6,background:MC[mg]+"14",border:`1px solid ${MC[mg]}33`}}>
            <span style={{fontSize:10,letterSpacing:"0.12em",color:T.dimmer,textTransform:"uppercase"}}>Last max</span>
            <span style={{fontSize:14,fontFamily:T.fontMono,color:MC[mg]}}>{lastTop.weight} lbs × {lastTop.reps||"—"}</span>
          </div>
        )}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:6}}>
          <span style={{fontSize:12,color:T.dimmest,width:20,flexShrink:0}}>#</span>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:T.dimmest,width:74,textAlign:"center",letterSpacing:"0.08em"}}>WEIGHT</span>
            <span style={{width:12}}/>
            <span style={{fontSize:12,color:T.dimmest,width:64,textAlign:"center",letterSpacing:"0.08em"}}>REPS</span>
          </div>
          <span style={{fontSize:11,color:T.dimmer,letterSpacing:"0.08em",padding:"3px 8px",borderRadius:5,background:T.surfaceDeep,border:`1px solid ${T.borderSubtle}`,whiteSpace:"nowrap",flexShrink:0}}>
            1RM <span style={{color:best1RM>0?T.accent:T.dimmest,marginLeft:4}}>{best1RM>0?`${Math.round(best1RM)} lbs`:"—"}</span>
          </span>
        </div>
        {ex.sets.length===0&&<div style={{padding:"10px 0",color:T.dimmest,fontSize:14,textAlign:"center",letterSpacing:"0.06em"}}>NO SETS — ADD ONE BELOW</div>}
        {ex.sets.map((s,i)=>{
          const ghost = prevSets?.[i];
          return (
            <div key={s.id}>
              <SetRow set={s} idx={i} T={T} onUpdate={u=>updateSet(s.id,u)} onDelete={()=>deleteSet(s.id)} onRestartTimer={onAddSet}/>
              {ghost&&(ghost.weight||ghost.reps)&&(
                <div style={{display:"flex",gap:8,paddingLeft:28,paddingBottom:4,marginTop:-2}}>
                  <span style={{fontSize:11,color:T.dimmer,fontStyle:"italic",letterSpacing:"0.03em"}}>
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

function TrendsView({ sessions, T, restDays, toggleRestDay, streak }) {
  // --- Date range (default: last 1 year) ---
  const toDateStr = (d) => { const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; };
  const todayStr = toDateStr(new Date());
  const yearAgoStr = toDateStr(new Date(Date.now() - 364 * 86400000));

  const [rangeStart, setRangeStart] = useState(yearAgoStr);
  const [rangeEnd, setRangeEnd] = useState(todayStr);
  const [activePreset, setActivePreset] = useState("1y");

  const applyPreset = (key) => {
    setActivePreset(key);
    const now = new Date();
    const end = toDateStr(now);
    const starts = { "14d": 13, "30d": 29, "90d": 89, "1y": 364 };
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
    const d = toDateStr(new Date(s.date));
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

  // --- Volume trend: volume per muscle group within range ---
  // Bin width adapts to the range: weekly for short spans, monthly for long ones.
  // Weekly bins over a full year read as a sawtooth (a group trained every 8-9 days
  // lands zero volume in some calendar weeks), so long ranges aggregate by month.
  const volumeTrend = (() => {
    const start = new Date(rangeStart + "T00:00:00");
    const end   = new Date(rangeEnd   + "T00:00:00");
    if (isNaN(start) || isNaN(end) || start > end) return { bins: [], byMg: {}, activeMgs: [], unit: "week" };
    const spanDays = Math.round((end - start) / 86400000);
    const unit = spanDays > 140 ? "month" : "week";
    const bins = [];
    if (unit === "month") {
      const cur = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cur <= end) {
        const bs = new Date(cur);
        const be = new Date(cur.getFullYear(), cur.getMonth() + 1, 0); // last day of month
        bins.push({
          start: toDateStr(bs),
          end: toDateStr(be),
          label: bs.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          title: bs.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        });
        cur.setMonth(cur.getMonth() + 1);
      }
    } else {
      const cur = new Date(start);
      cur.setDate(cur.getDate() - cur.getDay()); // snap to Sunday
      while (cur <= end) {
        const bs = new Date(cur);
        const be = new Date(cur); be.setDate(be.getDate() + 6);
        const lbl = bs.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        bins.push({
          start: toDateStr(bs),
          end: toDateStr(be),
          label: lbl,
          title: `week of ${lbl}`,
        });
        cur.setDate(cur.getDate() + 7);
      }
    }
    const byMg = {};
    MUSCLE_GROUPS.forEach(mg => { byMg[mg] = bins.map(() => 0); });
    filteredSessions.forEach(s => {
      const sd = toDateStr(new Date(s.date));
      const idx = bins.findIndex(b => sd >= b.start && sd <= b.end);
      if (idx < 0) return;
      s.exercises.forEach(e => {
        if (!byMg[e.muscleGroup]) return;
        const vol = e.sets.reduce((sum, st) =>
          sum + ((parseFloat(st.weight)||0) * (parseInt(st.reps)||0)), 0);
        byMg[e.muscleGroup][idx] += vol;
      });
    });
    const activeMgs = MUSCLE_GROUPS.filter(mg => byMg[mg].some(v => v > 0));
    return { bins, byMg, activeMgs, unit };
  })();

  // Default to a single muscle group selected — hide every active group except the first.
  const [hiddenMgs, setHiddenMgs] = useState(() => new Set(volumeTrend.activeMgs.slice(1)));
  const toggleMg = mg => setHiddenMgs(prev => {
    const next = new Set(prev);
    next.has(mg) ? next.delete(mg) : next.add(mg);
    return next;
  });

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

  // Multi-line chart for volume trend (one line per muscle group)
  function MultiLineChart({ bins, byMg, activeMgs, hidden }) {
    const visibleMgs = activeMgs.filter(mg => !hidden.has(mg));
    if (!bins.length || !activeMgs.length) return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:200,color:T.dimmest,fontSize:14,letterSpacing:"0.08em"}}>
        NO VOLUME DATA IN RANGE
      </div>
    );
    const W = 560, H = 200, PL = 56, PR = 16, PT = 16, PB = 36;
    const cW = W - PL - PR, cH = H - PT - PB;
    const allVals = visibleMgs.flatMap(mg => byMg[mg]);
    const maxV = visibleMgs.length ? Math.max(...allVals, 1) : 1;
    const xOf = i => PL + (bins.length === 1 ? cW/2 : (i / (bins.length - 1)) * cW);
    const yOf = v => PT + cH - (v / maxV) * cH;
    const yTicks = 4;
    const yTickVals = Array.from({length: yTicks+1}, (_, i) => maxV * i / yTicks);
    const fmtK = v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : Math.round(v).toString();
    const step = Math.max(1, Math.ceil(bins.length / 6));
    const xLabelIdxs = bins.map((_,i)=>i).filter(i => i % step === 0 || i === bins.length - 1);

    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
        {yTickVals.map((v,i) => (
          <g key={i}>
            <line x1={PL} y1={yOf(v)} x2={W-PR} y2={yOf(v)} stroke={T.border} strokeWidth="1" strokeDasharray="3,4"/>
            <text x={PL-6} y={yOf(v)+4} textAnchor="end" fill={T.dimmer} fontSize="12" fontFamily={T.fontMono}>
              {fmtK(v)}
            </text>
          </g>
        ))}
        <text x={10} y={H/2} textAnchor="middle" fill={T.muted} fontSize="12" fontFamily={T.fontMono}
          transform={`rotate(-90,10,${H/2})`}>VOLUME</text>
        {visibleMgs.map(mg => {
          const series = byMg[mg];
          const pts = series.map((v,i) => `${xOf(i)},${yOf(v)}`);
          return (
            <g key={mg}>
              <path d={`M ${pts.join(" L ")}`} fill="none" stroke={MC[mg]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.85"/>
              {series.map((v,i) => v > 0 ? (
                <circle key={i} cx={xOf(i)} cy={yOf(v)} r="3" fill={MC[mg]} stroke={T.bg} strokeWidth="1.5">
                  <title>{mg} — {bins[i].title}: {Math.round(v).toLocaleString()}</title>
                </circle>
              ) : null)}
            </g>
          );
        })}
        {xLabelIdxs.map(i => (
          <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fill={T.dimmer} fontSize="11" fontFamily={T.fontMono}>
            {bins[i].label}
          </text>
        ))}
      </svg>
    );
  }

  // Stats for selected exercise
  const prWeight = strengthData.length ? Math.max(...strengthData.map(d => d.value)) : null;
  const firstWeight = strengthData.length ? strengthData[0].value : null;
  const lastWeight = strengthData.length ? strengthData[strengthData.length-1].value : null;
  const delta = (firstWeight && lastWeight) ? lastWeight - firstWeight : null;

  const PRESETS = [
    { key:"14d", label:"14D" },
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
    const workoutDays = new Set(sessions.map(s=>toDateStr(new Date(s.date))));
    const restDaySet  = new Set(restDays);
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
      const str = toDateStr(cur);
      days.push({ date: str, active: workoutDays.has(str), rest: restDaySet.has(str) && !workoutDays.has(str), future: cur > today });
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

  const fmtVol = v => v>=1000 ? `${(v/1000).toFixed(1)}k` : `${Math.round(v)}`;

  // ---- Dashboard tiles (selected range) ----
  const setsOf = s => s.exercises.reduce((b,e)=>b+e.sets.length,0);
  const volOf  = s => s.exercises.reduce((b,e)=>b+e.sets.reduce((c,st)=>c+((parseFloat(st.weight)||0)*(parseInt(st.reps)||0)),0),0);
  const rangeWorkouts = filteredSessions.length;
  const rangeSets   = filteredSessions.reduce((a,s)=>a+setsOf(s),0);
  const rangeVolume = filteredSessions.reduce((a,s)=>a+volOf(s),0);
  const rangeSpanDays = Math.max(1, Math.round((new Date(rangeEnd)-new Date(rangeStart))/864e5)+1);
  const avgPerWeek = rangeWorkouts>0 ? rangeWorkouts/(rangeSpanDays/7) : 0;

  // Longest streak — same "gap ≤ 2 days continues" rule as the current-streak calc.
  const longestStreak = (()=>{
    const tds = d => new Date(d).toLocaleDateString("en-US");
    const daySet = new Set([...sessions.map(s=>tds(s.date)), ...restDays.map(d=>tds(d+"T00:00:00"))]);
    const days = [...daySet].map(d=>new Date(d)).sort((a,b)=>a-b);
    if(!days.length) return 0;
    let best=1, run=1;
    for(let i=1;i<days.length;i++){
      const diff=(days[i]-days[i-1])/864e5;
      run = diff<=2 ? run+1 : 1;
      if(run>best) best=run;
    }
    return best;
  })();

  // ---- Workouts per week (consistency, selected range) ----
  const weeklyCounts = (()=>{
    const start=new Date(rangeStart+"T00:00:00"), end=new Date(rangeEnd+"T00:00:00");
    if(isNaN(start)||isNaN(end)||start>end) return [];
    const cur=new Date(start); cur.setDate(cur.getDate()-cur.getDay());
    const weeks=[];
    while(cur<=end){
      const bs=toDateStr(cur); const be=new Date(cur); be.setDate(be.getDate()+6);
      weeks.push({start:bs,end:toDateStr(be),label:new Date(bs).toLocaleDateString("en-US",{month:"short",day:"numeric"}),count:0});
      cur.setDate(cur.getDate()+7);
    }
    filteredSessions.forEach(s=>{
      const sd=toDateStr(new Date(s.date));
      const w=weeks.find(b=>sd>=b.start&&sd<=b.end);
      if(w) w.count++;
    });
    return weeks;
  })();
  const maxWeekCount = weeklyCounts.reduce((m,w)=>Math.max(m,w.count),0);

  // ---- Muscle-group balance (share of sets, selected range) ----
  const mgSets = {};
  MUSCLE_GROUPS.forEach(mg=>{ mgSets[mg]=0; });
  filteredSessions.forEach(s=>s.exercises.forEach(e=>{ if(mgSets[e.muscleGroup]!=null) mgSets[e.muscleGroup]+=e.sets.length; }));
  const mgTotal = Object.values(mgSets).reduce((a,b)=>a+b,0);
  const mgBalance = MUSCLE_GROUPS
    .map(mg=>({mg, sets:mgSets[mg], pct: mgTotal?mgSets[mg]/mgTotal:0}))
    .filter(x=>x.sets>0)
    .sort((a,b)=>b.sets-a.sets);

  // ---- Days since last trained, per group (all-time, relative to today) ----
  const today0 = new Date(); today0.setHours(0,0,0,0);
  const lastTrained = {};
  sessions.forEach(s=>{
    const d=new Date(s.date); d.setHours(0,0,0,0);
    s.exercises.forEach(e=>{
      const t=d.getTime();
      if(lastTrained[e.muscleGroup]==null || t>lastTrained[e.muscleGroup]) lastTrained[e.muscleGroup]=t;
    });
  });
  const daysSince = MUSCLE_GROUPS
    .filter(mg=>lastTrained[mg]!=null)
    .map(mg=>({mg, days: Math.round((today0-lastTrained[mg])/864e5)}))
    .sort((a,b)=>b.days-a.days);

  // ---- Records board (all-time PR weight + estimated 1RM per exercise) ----
  const records = (()=>{
    const rec={};
    sessions.forEach(s=>s.exercises.forEach(e=>{
      e.sets.forEach(st=>{
        const w=parseFloat(st.weight)||0, r=parseInt(st.reps)||0;
        if(!w) return;
        const e1rm = r ? w*(1+r/30) : w;
        if(!rec[e.name]) rec[e.name]={name:e.name, mg:e.muscleGroup, pr:w, prReps:r, e1rm};
        else {
          if(w>rec[e.name].pr){ rec[e.name].pr=w; rec[e.name].prReps=r; }
          if(e1rm>rec[e.name].e1rm) rec[e.name].e1rm=e1rm;
        }
      });
    }));
    return Object.values(rec).sort((a,b)=>b.e1rm-a.e1rm);
  })();

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
        <div style={{overflowX:"auto"}} ref={el=>{ if(el) el.scrollLeft = el.scrollWidth; }}>
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
                  {week.map((day,di)=>{
                    const tappable = !day.future && !day.active && toggleRestDay;
                    const titleSuffix = day.active ? " — workout"
                      : day.rest ? " — rest day (tap to remove)"
                      : tappable ? " — tap to mark rest" : "";
                    return (
                      <div key={di}
                        title={`${day.date}${titleSuffix}`}
                        onClick={tappable ? ()=>toggleRestDay(day.date) : undefined}
                        style={{
                          width:12,height:12,borderRadius:2,flexShrink:0,
                          background: day.future ? "transparent"
                            : day.active ? T.accent
                            : day.rest ? (T.isLight?"#bfd9f7":"#1e3a6e")
                            : T.isLight ? "#e8e4dd" : T.dimmest,
                          opacity: day.future ? 0 : 1,
                          transition:"background 0.1s",
                          cursor: tappable ? "pointer" : "default",
                        }}/>
                    );
                  })}
                </div>
              ))}
            </div>
            {/* Legend */}
            <div style={{display:"flex",alignItems:"center",gap:5,marginTop:8,justifyContent:"flex-end"}}>
              <span style={{fontSize:10,color:T.dimmer}}>No workout</span>
              {[T.isLight?"#e8e4dd":T.dimmest, T.isLight?"#bfd9f7":"#1e3a6e", T.accent].map((c,i)=>(
                <div key={i} style={{width:12,height:12,borderRadius:2,background:c}}/>
              ))}
              <span style={{fontSize:10,color:T.dimmer}}>Workout</span>
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

      {/* Overview tiles (range totals + all-time streaks) */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 16px 14px"}}>
        <div style={{fontSize:12,letterSpacing:"0.16em",color:T.dimmer,textTransform:"uppercase",marginBottom:12}}>Overview</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(88px,1fr))",gap:8}}>
          {[
            {label:"WORKOUTS", value:rangeWorkouts, color:T.accent},
            {label:"SETS",     value:rangeSets, color:T.textPrimary},
            {label:"VOLUME",   value:rangeVolume>0?`${fmtVol(rangeVolume)} lbs`:"—", color:T.textPrimary},
            {label:"PER WEEK", value:avgPerWeek>0?avgPerWeek.toFixed(1):"—", color:T.textPrimary},
            {label:"STREAK",   value:streak>0?`🔥 ${streak}`:"0", color:T.accent},
            {label:"LONGEST",  value:longestStreak, color:T.muted},
          ].map(t=>(
            <div key={t.label} style={{background:T.surfaceDeep,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:9,color:T.dimmer,letterSpacing:"0.12em",marginBottom:3}}>{t.label}</div>
              <div style={{fontSize:20,color:t.color,fontFamily:T.fontDisplay,letterSpacing:"0.03em"}}>{t.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Workouts per week (consistency) */}
      {weeklyCounts.length>0 && (
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 16px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:12,gap:8,flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:12,letterSpacing:"0.16em",color:T.dimmer,textTransform:"uppercase",marginBottom:2}}>Workouts / Week</div>
              <div style={{fontSize:13,color:T.muted}}>Consistency over the range</div>
            </div>
            <div style={{fontSize:13,color:T.muted}}>avg <span style={{color:T.accent,fontFamily:T.fontDisplay,fontSize:18}}>{avgPerWeek.toFixed(1)}</span>/wk</div>
          </div>
          <div style={{overflowX:"auto"}} ref={el=>{ if(el) el.scrollLeft = el.scrollWidth; }}>
            <div style={{display:"flex",alignItems:"flex-end",gap:3,height:80,minWidth:"100%"}}>
              {weeklyCounts.map((w,i)=>{
                const h = maxWeekCount ? Math.round((w.count/maxWeekCount)*72) : 0;
                return (
                  <div key={i} title={`Week of ${w.label}: ${w.count} workout${w.count!==1?"s":""}`}
                    style={{flex:"1 0 7px",minWidth:7,display:"flex",flexDirection:"column",justifyContent:"flex-end",height:"100%"}}>
                    <div style={{height:Math.max(h, w.count>0?3:0),background:w.count>0?T.accent:"transparent",borderRadius:"3px 3px 0 0",transition:"height 0.2s"}}/>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Muscle-group balance */}
      {mgBalance.length>0 && (
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 16px 14px"}}>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,letterSpacing:"0.16em",color:T.dimmer,textTransform:"uppercase",marginBottom:2}}>Muscle Balance</div>
            <div style={{fontSize:13,color:T.muted}}>Share of sets in range</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {mgBalance.map(({mg,sets,pct})=>(
              <div key={mg}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:3}}>
                  <span style={{fontSize:13,color:T.textPrimary}}>{mg}</span>
                  <span style={{fontSize:12,color:T.muted,fontFamily:T.fontMono}}>{Math.round(pct*100)}% · {sets} set{sets!==1?"s":""}</span>
                </div>
                <div style={{height:8,background:T.surfaceDeep,borderRadius:4,overflow:"hidden"}}>
                  <div style={{width:`${Math.max(pct*100,2)}%`,height:"100%",background:MC[mg],borderRadius:4}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Days since last trained */}
      {daysSince.length>0 && (
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 16px 14px"}}>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,letterSpacing:"0.16em",color:T.dimmer,textTransform:"uppercase",marginBottom:2}}>Last Trained</div>
            <div style={{fontSize:13,color:T.muted}}>Most neglected first</div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {daysSince.map(({mg,days})=>{
              const col = days>=7?"#ef4444":days>=4?"#f59e0b":T.muted;
              return (
                <div key={mg} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 11px",borderRadius:8,background:T.surfaceDeep,border:`1px solid ${T.border}`}}>
                  <div style={{width:9,height:9,borderRadius:"50%",background:MC[mg],flexShrink:0}}/>
                  <span style={{fontSize:13,color:T.textPrimary}}>{mg}</span>
                  <span style={{fontSize:13,color:col,fontFamily:T.fontMono}}>{days===0?"today":`${days}d`}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Volume Trend by Muscle Group */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:20}}>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:12,letterSpacing:"0.16em",color:T.dimmer,textTransform:"uppercase",marginBottom:4}}>VOLUME TREND</div>
          <div style={{fontSize:14,color:T.muted}}>Weekly weight × reps — tap a muscle group to toggle</div>
        </div>
        {/* Toggle chips */}
        {volumeTrend.activeMgs.length > 0 && (
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
            {volumeTrend.activeMgs.map(mg => {
              const off = hiddenMgs.has(mg);
              return (
                <button key={mg} onClick={()=>toggleMg(mg)}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:14,
                    background:off?"transparent":MC[mg]+"22",
                    border:`1px solid ${off?T.border:MC[mg]+"66"}`,
                    color:off?T.muted:T.textPrimary,
                    fontSize:12,letterSpacing:"0.04em",cursor:"pointer",fontFamily:"inherit",outline:"none",transition:"all 0.15s"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:off?T.dimmest:MC[mg]}}/>
                  {mg}
                </button>
              );
            })}
          </div>
        )}
        <div style={{overflowX:"auto"}}>
          <MultiLineChart bins={volumeTrend.bins} byMg={volumeTrend.byMg} activeMgs={volumeTrend.activeMgs} hidden={hiddenMgs}/>
        </div>
      </div>

      {/* Records board */}
      {records.length>0 && (
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 16px 14px"}}>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,letterSpacing:"0.16em",color:T.dimmer,textTransform:"uppercase",marginBottom:2}}>Records</div>
            <div style={{fontSize:13,color:T.muted}}>All-time best per exercise · sorted by est. 1RM</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {records.map(r=>(
              <div key={r.name} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,background:T.surfaceDeep,border:`1px solid ${T.border}`}}>
                <span style={{fontSize:10,padding:"2px 7px",borderRadius:3,background:MC[r.mg]+"22",color:MC[r.mg],textTransform:"uppercase",letterSpacing:"0.06em",flexShrink:0}}>{r.mg}</span>
                <span style={{fontSize:14,color:T.textPrimary,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</span>
                <span style={{fontSize:13,color:T.muted,fontFamily:T.fontMono,whiteSpace:"nowrap"}}>{r.pr} × {r.prReps||"—"}</span>
                <span style={{fontSize:14,color:T.accent,fontFamily:T.fontDisplay,whiteSpace:"nowrap",minWidth:58,textAlign:"right"}}>{Math.round(r.e1rm)} <span style={{fontSize:9,color:T.dimmer,fontFamily:T.fontBody}}>1RM</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}


export default function WorkoutTracker() {
  const [view, setView] = useState("log");
  const T = THEMES.light;
  // Restore an in-progress workout the moment we mount, so Android killing the
  // backgrounded app (the Spotify-switch bug) never wipes it. Synchronous lazy
  // init avoids any flash of an empty log.
  const [workout, setWorkout] = useState(()=>{
    try{ const d=JSON.parse(localStorage.getItem("wl_draft")||"null"); return Array.isArray(d?.workout)?d.workout:[]; }
    catch{ return []; }
  });
  const [workoutName, setWorkoutName] = useState(()=>{
    try{ const d=JSON.parse(localStorage.getItem("wl_draft")||"null"); return d?.workoutName||""; }
    catch{ return ""; }
  });
  const [sessions, setSessions] = useState(()=>JSON.parse(localStorage.getItem("wl_sessions2")||"[]"));
  const [restDays, setRestDays] = useState(()=>JSON.parse(localStorage.getItem("wl_rest_days")||"[]"));
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
  const [confirmClear, setConfirmClear] = useState(false); // two-tap guard for "Clear" (discard current workout)
  const clearConfirmTimer = useRef(null);

  const toDateStr = (d) => { const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; };
  const sessionDateStr = (s) => toDateStr(new Date(s.date));
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

  useEffect(()=>{ if(view==="history"&&histPreset) applyHistPreset(histPreset); },[view]);

  const filteredSessions = sessions.filter(s=>{
    const d = sessionDateStr(s);
    return d >= histRangeStart && d <= histRangeEnd;
  });

  const buildBackupB64 = () => {
    const payload = { sessions, customExercises, templates, exportedAt: new Date().toISOString(), version: 1 };
    const json = JSON.stringify(payload);
    return btoa(unescape(encodeURIComponent(json)));
  };

  const backupFileName = () => `iron-log-backup-${new Date().toISOString().slice(0,10)}.ilbak`;

  const saveBackup = async () => {
    const b64 = buildBackupB64();
    const fileName = backupFileName();
    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.writeFile({ path: fileName, data: b64, directory: Directory.External, encoding: Encoding.UTF8 });
        setRestoreMsg({ type: "success", text: `Saved: ${fileName}` });
        setTimeout(() => setRestoreMsg(null), 4000);
      } catch (err) {
        setRestoreMsg({ type: "error", text: "Could not save backup" });
        setTimeout(() => setRestoreMsg(null), 4000);
      }
    } else {
      const blob = new Blob([b64], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const shareBackup = async () => {
    const b64 = buildBackupB64();
    const fileName = backupFileName();
    if (Capacitor.isNativePlatform()) {
      try {
        const { uri } = await Filesystem.writeFile({ path: fileName, data: b64, directory: Directory.Cache, encoding: Encoding.UTF8 });
        await Share.share({ title: "Iron Log Backup", files: [uri] });
      } catch (err) {
        if (err?.message !== "Share canceled") setRestoreMsg({ type: "error", text: "Could not share backup" });
        setTimeout(() => setRestoreMsg(null), 4000);
      }
    } else {
      const blob = new Blob([b64], { type: "application/octet-stream" });
      const file = new File([blob], fileName, { type: "application/octet-stream" });
      try {
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: "Iron Log Backup" });
        } else { throw new Error("unsupported"); }
      } catch (err) {
        if (err.name !== "AbortError") {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = fileName; a.click();
          URL.revokeObjectURL(url);
        }
      }
    }
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
  const timerEndAtRef = useRef(null);

  useEffect(()=>{localStorage.setItem("wl_sessions2",JSON.stringify(sessions));},[sessions]);
  useEffect(()=>{localStorage.setItem("wl_custom_ex",JSON.stringify(customExercises));},[customExercises]);
  useEffect(()=>{localStorage.setItem("wl_templates",JSON.stringify(templates));},[templates]);
  useEffect(()=>{localStorage.setItem("wl_rest_days",JSON.stringify(restDays));},[restDays]);

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

  // Persist the in-progress workout on every edit + (re)arm the "unsaved workout"
  // reminder. The 1.5s debounce collapses rapid keystrokes into one reschedule,
  // which resets the 10-min countdown — steady lifting keeps pushing it out.
  useEffect(()=>{
    if(workout.length===0){
      localStorage.removeItem("wl_draft");
      cancelSaveReminder();
      return;
    }
    localStorage.setItem("wl_draft", JSON.stringify({ workout, workoutName, savedAt:new Date().toISOString() }));
    const hasValid = workout.some(e=>e.sets.some(s=>s.weight&&s.reps));
    if(!hasValid) return;
    const t = setTimeout(()=>scheduleSaveReminder(workout), 1500);
    return ()=>clearTimeout(t);
  }, [workout, workoutName]);

  // Tapping the reminder opens straight to the log screen.
  useEffect(()=>{
    if(!Capacitor.isNativePlatform()) return;
    let handle;
    LocalNotifications.addListener("localNotificationActionPerformed", (action)=>{
      if(action?.notification?.id===SAVE_REMINDER_ID) setView("log");
    }).then(h=>{ handle=h; }).catch(()=>{});
    return ()=>{ handle?.remove?.(); };
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
  };

  const deleteTemplate = (tmplId) => {
    const tmpl = templates.find(t=>t.id===tmplId);
    if(!confirm(`Delete template "${tmpl?.name ?? ""}"? This can't be undone.`)) return;
    setTemplates(prev=>prev.filter(t=>t.id!==tmplId));
    setTemplateFlash("deleted");
    setTimeout(()=>setTemplateFlash(null),1800);
  };

  useEffect(()=>{
    if(timerActive){
      intRef.current=setInterval(()=>{
        const remaining=Math.ceil((timerEndAtRef.current-Date.now())/1000);
        if(remaining<=0){
          clearInterval(intRef.current);setTimerActive(false);setTimerRem(0);
          if(Capacitor.isNativePlatform()) LocalNotifications.cancel({notifications:[{id:1}]}).catch(()=>{});
          beep();return;
        }
        setTimerRem(remaining);
      },500);
    } else clearInterval(intRef.current);
    return ()=>clearInterval(intRef.current);
  },[timerActive]);

  // Catch-up handler: fire bell immediately if timer expired while app was backgrounded
  useEffect(()=>{
    const onVisible=()=>{
      if(document.visibilityState!=="visible"||!timerActive||!timerEndAtRef.current) return;
      const remaining=Math.ceil((timerEndAtRef.current-Date.now())/1000);
      if(remaining<=0){
        clearInterval(intRef.current);
        setTimerActive(false);
        setTimerRem(0);
        // On native the scheduled notification has ALREADY rung bell.wav while we were
        // backgrounded, so beeping here rings a second time the moment you look at the phone
        // -- the "double-bing". The catch-up beep only exists for web, where there is no
        // notification to ring. Kept as a Doze fallback until 2026-08-09, when a week of real
        // workouts confirmed the background bell fires reliably.
        if(!Capacitor.isNativePlatform()) beep();
      } else {
        setTimerRem(remaining);
      }
    };
    document.addEventListener("visibilitychange",onVisible);
    return ()=>document.removeEventListener("visibilitychange",onVisible);
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
    // Vibration fallback (works even when audio is blocked in background)
    try{navigator.vibrate?.([300,150,300,150,300]);}catch{}
    // Native notification via SW (fires even while app is backgrounded)
    if(Notification.permission==="granted"&&"serviceWorker" in navigator){
      navigator.serviceWorker.ready.then(reg=>{
        reg.showNotification("Rest Complete!",{
          body:"Time to get back to lifting.",
          icon:"/icon-192.png",
          vibrate:[300,150,300],
          tag:"rest-timer",
          renotify:false,
        });
      }).catch(()=>{});
    }
  };

  const startTimer=async()=>{
    timerEndAtRef.current=Date.now()+timerInput*1000;
    setTimerBase(timerInput);setTimerRem(timerInput);setTimerActive(true);
    if(Capacitor.isNativePlatform()){
      try{
        await LocalNotifications.requestPermissions();
        await LocalNotifications.createChannel({
          id:"rest-timer",name:"Rest Timer",
          description:"Plays a bell when your rest period is over.",
          importance:4,sound:"bell.wav",vibration:true,visibility:1,
        });
        await LocalNotifications.schedule({notifications:[{
          id:1,title:"Rest Complete!",body:"Time to get back to lifting.",
          schedule:{at:new Date(Date.now()+timerInput*1000),allowWhileIdle:true},
          channelId:"rest-timer",sound:"bell.wav",
        }]});
      }catch{}
    } else {
      if(Notification.permission==="default") Notification.requestPermission();
    }
  };
  const stopTimer=()=>{
    timerEndAtRef.current=null;setTimerActive(false);setTimerRem(timerInput);setTimerBase(timerInput);
    if(Capacitor.isNativePlatform()) LocalNotifications.cancel({notifications:[{id:1}]}).catch(()=>{});
  };
  const restartTimer=()=>{
    clearInterval(intRef.current);
    timerEndAtRef.current=Date.now()+timerInput*1000;
    setTimerBase(timerInput);
    setTimerRem(timerInput);
    if(Capacitor.isNativePlatform()){
      LocalNotifications.cancel({notifications:[{id:1}]}).catch(()=>{});
      LocalNotifications.schedule({notifications:[{
        id:1,title:"Rest Complete!",body:"Time to get back to lifting.",
        schedule:{at:new Date(Date.now()+timerInput*1000),allowWhileIdle:true},
        channelId:"rest-timer",sound:"bell.wav",
      }]}).catch(()=>{});
    }
    if(timerActive){
      intRef.current=setInterval(()=>{
        const remaining=Math.ceil((timerEndAtRef.current-Date.now())/1000);
        if(remaining<=0){
          clearInterval(intRef.current);setTimerActive(false);setTimerRem(0);
          if(Capacitor.isNativePlatform()) LocalNotifications.cancel({notifications:[{id:1}]}).catch(()=>{});
          beep();return;
        }
        setTimerRem(remaining);
      },500);
    } else {
      setTimerActive(true);
    }
  };

  const addExercise=()=>setWorkout(prev=>[...prev,{id:uid(),muscleGroup:"Chest",name:PRESETS["Chest"][0],isCustom:false,sets:[]}]);
  const updateExercise=(id,u)=>setWorkout(prev=>prev.map(e=>e.id===id?u:e));
  const deleteExercise=(id)=>setWorkout(prev=>prev.filter(e=>e.id!==id));

  const totalSets=workout.reduce((a,e)=>a+e.sets.length,0);

  // Auto-name a workout from the muscle groups actually trained (by set count),
  // so there's no "select workout type" step. "Chest Day" / "Chest & Back" / "Chest, Back & more".
  const autoWorkoutName=(w)=>{
    const count={};
    w.forEach(e=>{
      const n=e.sets.filter(s=>s.weight||s.reps).length;
      if(n) count[e.muscleGroup]=(count[e.muscleGroup]||0)+n;
    });
    const groups=Object.keys(count).sort((a,b)=>count[b]-count[a]);
    if(groups.length===0) return "Workout";
    if(groups.length===1) return `${groups[0]} Day`;
    if(groups.length===2) return `${groups[0]} & ${groups[1]}`;
    return `${groups[0]}, ${groups[1]} & more`;
  };

  // --- Streak calculation (36hr grace period) ---
  const calcStreak = (sessionList) => {
    if(!sessionList.length && !restDays.length) return 0;
    const tds = d => new Date(d).toLocaleDateString("en-US");
    const workoutDaySet = new Set(sessionList.map(s=>tds(s.date)));
    const restDaySet = new Set(restDays.map(d=>tds(d+"T00:00:00")));
    const days = [...new Set([...workoutDaySet, ...restDaySet])];
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

  // Discard the current in-progress workout (two-tap). Routes through the same
  // teardown as save, so the draft + unsaved-workout reminder are cleared too.
  useEffect(()=>()=>clearTimeout(clearConfirmTimer.current), []);
  const handleClearWorkout=()=>{
    if(!confirmClear){
      setConfirmClear(true);
      try{navigator.vibrate&&navigator.vibrate(20);}catch{}
      clearTimeout(clearConfirmTimer.current);
      clearConfirmTimer.current=setTimeout(()=>setConfirmClear(false),3000);
      return;
    }
    clearTimeout(clearConfirmTimer.current);
    setConfirmClear(false);
    setWorkout([]); setWorkoutName("");
    localStorage.removeItem("wl_draft"); cancelSaveReminder();
    try{navigator.vibrate&&navigator.vibrate([20,40,20]);}catch{}
  };

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
      name:workoutName||autoWorkoutName(workout),
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

    setWorkout([]); setWorkoutName("");
    localStorage.removeItem("wl_draft"); cancelSaveReminder();
    setSaveFlash("success"); setTimeout(()=>setSaveFlash(null),800);
    // Show summary overlay instead of navigating away
    setSummary({session, prs: prsFound});
  };

  const deleteSession=(id)=>setSessions(prev=>prev.filter(s=>s.id!==id));

  const logRestDay=()=>{
    const today = toDateStr(new Date());
    if(!restDays.includes(today)){
      setRestDays(prev=>[...prev, today]);
      setRestoreMsg({type:"success",text:"Rest day logged"});
    } else {
      setRestoreMsg({type:"success",text:"Already logged for today"});
    }
    setTimeout(()=>setRestoreMsg(null),3000);
  };
  const toggleRestDay=(dateStr)=>{
    const hasWorkout = sessions.some(s=>toDateStr(new Date(s.date))===dateStr);
    if(hasWorkout) return;
    setRestDays(prev => prev.includes(dateStr)
      ? prev.filter(d=>d!==dateStr)
      : [...prev, dateStr]);
    try{navigator.vibrate&&navigator.vibrate(20);}catch{}
  };
  const timerPct=(timerActive||timerRem<timerBase)?((timerRem/timerBase)*100):100;

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:T.fontBody,color:T.textPrimary}}>
      <style>{`
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
                      style={{width:52,padding:"4px 6px",borderRadius:4,background:T.inputBg,border:`1px solid ${T.border}`,color:T.textPrimary,fontSize:14,textAlign:"center",fontFamily:T.fontMono,outline:"none"}}/>
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

            {/* Auto-named title + discard-current-workout control (replaces the old workout-type dropdown) */}
            {workout.length>0&&(
              <div style={{display:"flex",gap:10,alignItems:"center",justifyContent:"space-between",padding:"2px 4px"}}>
                <span style={{fontFamily:T.fontDisplay,fontSize:22,letterSpacing:"0.05em",color:T.accent,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{autoWorkoutName(workout)}</span>
                {totalSets>0&&<span style={{fontSize:13,color:T.muted,whiteSpace:"nowrap"}}>{totalSets} SET{totalSets!==1?"S":""}</span>}
                <button onClick={handleClearWorkout}
                  style={confirmClear
                    ? {background:"#ef4444",border:"none",color:"#fff",cursor:"pointer",fontSize:12,padding:"6px 11px",borderRadius:6,letterSpacing:"0.04em",fontFamily:"inherit",outline:"none",whiteSpace:"nowrap"}
                    : {background:"transparent",border:`1px solid ${T.border}`,color:T.muted,cursor:"pointer",fontSize:12,padding:"6px 11px",borderRadius:6,letterSpacing:"0.04em",fontFamily:"inherit",outline:"none",whiteSpace:"nowrap",transition:"all 0.15s"}}
                  title={confirmClear?"Tap again to discard this workout":"Discard current workout without saving"}>
                  {confirmClear?"Clear all?":"Clear"}
                </button>
              </div>
            )}

            {/* Log Rest Day — shown when no exercises added yet */}
            {workout.length===0&&(
              <button onClick={()=>{
                logRestDay();
                try{navigator.vibrate&&navigator.vibrate(30);}catch{}
              }}
                style={{width:"100%",padding:"10px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",background:"transparent",border:`1px dashed ${T.border}`,color:T.dimmer,fontSize:13,letterSpacing:"0.08em",textTransform:"uppercase",outline:"none",transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.muted;e.currentTarget.style.color=T.muted;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.dimmer;}}>
                😴 Log Rest Day
              </button>
            )}

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

            {/* Load Template */}
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
                    <span style={{fontFamily:T.fontDisplay,fontSize:24,letterSpacing:"0.06em",color:T.accent}}>{session.name==="Rest Day"?"😴 Rest Day":session.name}</span>
                    <span style={{fontSize:13,color:T.muted}}>{fmtDate(session.date)}</span>
                    <div style={{flex:1,height:1,background:T.border}}/>
                    {session.name!=="Rest Day"&&<span style={{fontSize:12,color:T.dimmer,letterSpacing:"0.1em"}}>{session.exercises.reduce((a,e)=>a+e.sets.length,0)} SETS</span>}
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
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:restoreMsg?10:0}}>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={saveBackup}
                    style={{flex:1,padding:"11px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",background:`linear-gradient(135deg,${T.accentDim},${T.accentDim2})`,border:"none",color:T.accentText,fontSize:13,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:500,outline:"none",transition:"all 0.2s"}}>
                    ↓ Save Backup
                  </button>
                  <button onClick={shareBackup}
                    style={{flex:1,padding:"11px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",background:`linear-gradient(135deg,${T.accentDim},${T.accentDim2})`,border:"none",color:T.accentText,fontSize:13,letterSpacing:"0.08em",textTransform:"uppercase",fontWeight:500,outline:"none",transition:"all 0.2s"}}>
                    ↑ Share Backup
                  </button>
                </div>
                <button onClick={()=>fileInputRef.current?.click()}
                  style={{padding:"11px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",background:"transparent",border:`1px solid ${T.border}`,color:T.accent,fontSize:13,letterSpacing:"0.08em",textTransform:"uppercase",outline:"none",transition:"all 0.2s"}}>
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
          <TrendsView sessions={sessions} T={T} restDays={restDays} toggleRestDay={toggleRestDay} streak={streak}/>
        )}
      </div>
    </div>
  );
}
