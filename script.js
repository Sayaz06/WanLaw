// Constants
const DAYS = ['Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu','Ahad'];
const STORAGE_KEYS = { library:'weekly_library', schedule:'weekly_schedule', scheduleDone:'weekly_done' };

// State
let currentDay = 'Isnin';
let weeklyLibrary = {};
let currentSchedule = {};
let currentScheduleDone = {};
let selectedActivity = null;
let clickCounters = {};

// Utils
function save(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function load(key, fallback){ return JSON.parse(localStorage.getItem(key)) || fallback; }
function showMessage(msg, error=false){ const m=document.getElementById('message'); m.textContent=msg; m.className=error?'error':'success'; m.style.display='block'; setTimeout(()=> m.style.display='none',1200); }

// Tabs
function renderTabs(){
 const wrap = document.getElementById('dayTabs'); wrap.innerHTML='';
 DAYS.forEach(day=>{
  const tab = document.createElement('div'); tab.textContent = day;
  tab.className='tab'+(day===currentDay?' active':'');
  tab.addEventListener('click',()=>{ currentDay=day; renderTabs(); renderLibrary(); document.getElementById('activityEditor').value = weeklyLibrary[day].join('\n'); });
  wrap.appendChild(tab);
 });
}

// Library
function renderLibrary(){
 const wrap = document.getElementById('activityLibrary'); wrap.innerHTML='';
 weeklyLibrary[currentDay].forEach(act=>{
  const item = document.createElement('div'); item.className='library-item'+(selectedActivity===act?' selected':'');
  item.textContent = act;
  item.addEventListener('click',()=>{ selectedActivity=act; renderLibrary(); });
  wrap.appendChild(item);
 });
}

// Schedule
function createSlot(num){
 const wrap=document.createElement('div');
 function update(){
  const act=currentSchedule[num]; const done=currentScheduleDone[num];
  wrap.className='slot'+(done?' done':''); wrap.innerHTML='';
  const numDiv=document.createElement('div'); numDiv.className='slot-number'; numDiv.textContent=num+'.';
  const textDiv=document.createElement('div'); textDiv.className='slot-text'; textDiv.textContent=act||'— kosong —';
  const tick=document.createElement('input'); tick.type='checkbox'; tick.className='done-tick'; tick.checked=done||false;
  wrap.appendChild(numDiv); wrap.appendChild(textDiv); if(act) wrap.appendChild(tick);
 }
 update();
 wrap.addEventListener('click',(e)=>{
  if(e.target.classList.contains('done-tick')){ currentScheduleDone[num]=e.target.checked; save(STORAGE_KEYS.scheduleDone,currentScheduleDone); update(); showMessage(e.target.checked?`Slot ${num} selesai`:`Tanda selesai dibuang`); return; }
  if(!clickCounters[num]) clickCounters[num]=0; clickCounters[num]++;
  setTimeout(()=> clickCounters[num]=0,1000);
  if(clickCounters[num]===3){ delete currentSchedule[num]; delete currentScheduleDone[num]; save(STORAGE_KEYS.schedule,currentSchedule); save(STORAGE_KEYS.scheduleDone,currentScheduleDone); clickCounters[num]=0; showMessage(`Slot ${num} dikosongkan`); renderSlots(); renderLibrary(); return; }
  if(!currentSchedule[num]){ if(!selectedActivity){ showMessage('Pilih aktiviti dahulu', true); return; }
   currentSchedule[num]=selectedActivity; currentScheduleDone[num]=false; save(STORAGE_KEYS.schedule,currentSchedule); save(STORAGE_KEYS.scheduleDone,currentScheduleDone); showMessage(`Aktiviti dimasukkan ke slot ${num}`); renderSlots(); renderLibrary(); }
 });
 return wrap;
}
function renderSlots(){
 const wrap=document.getElementById('scheduleSlots'); wrap.innerHTML='';
 for(let i=1;i<=100;i++) wrap.appendChild(createSlot(i));
}

// Buttons
document.getElementById('saveLibrary').addEventListener('click',()=>{
 const lines=document.getElementById('activityEditor').value.split('\n').map(s=>s.trim()).filter(s=>s);
 weeklyLibrary[currentDay]=lines;
 save(STORAGE_KEYS.library,weeklyLibrary);
 renderLibrary(); showMessage('Aktiviti dikemaskini');
});
document.getElementById('resetLibrary').addEventListener('click',()=>{
 if(confirm('Reset hari ini ke default?')){
  weeklyLibrary[currentDay]=['Baca Buku','Senaman','Solat','Rehat','Makan'];
  save(STORAGE_KEYS.library,weeklyLibrary);
  document.getElementById('activityEditor').value = weeklyLibrary[currentDay].join('\n');
  renderLibrary();
 }
});

// EXPORT / IMPORT
document.getElementById('exportBtn').addEventListener('click', ()=>{
 const dataStr = JSON.stringify({library:weeklyLibrary,schedule:currentSchedule,scheduleDone:currentScheduleDone}, null, 2);
 const blob = new Blob([dataStr], {type:'application/json'});
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a'); a.href=url; a.download='planner_backup.json'; a.click(); URL.revokeObjectURL(url);
});
document.getElementById('importBtn').addEventListener('click',()=>{ document.getElementById('importFile').click(); });
document.getElementById('importFile').addEventListener('change',(e)=>{
 const file = e.target.files[0]; if(!file) return;
 const reader = new FileReader();
 reader.onload = (ev)=>{
  try{
    const data = JSON.parse(ev.target.result);
    if(data.library && data.schedule && data.scheduleDone){
        weeklyLibrary=data.library;
        currentSchedule=data.schedule;
        currentScheduleDone=data.scheduleDone;
        save(STORAGE_KEYS.library,weeklyLibrary);
        save(STORAGE_KEYS.schedule,currentSchedule);
        save(STORAGE_KEYS.scheduleDone,currentScheduleDone);
        renderLibrary(); renderSlots();
        showMessage('Planner berjaya diimport!');
    }else{ showMessage('Fail tidak sah!',true); }
  }catch(err){ showMessage('Error semasa import!',true); }
 };
 reader.readAsText(file);
});

// Init
function boot(){
 weeklyLibrary=load(STORAGE_KEYS.library,{});
 DAYS.forEach(day=>{ if(!weeklyLibrary[day]) weeklyLibrary[day]=['Baca Buku','Senaman','Solat','Rehat','Makan']; });
 currentSchedule=load(STORAGE_KEYS.schedule,{});
 currentScheduleDone=load(STORAGE_KEYS.scheduleDone,{});
 document.getElementById('activityEditor').value = weeklyLibrary[currentDay].join('\n');
 renderTabs(); renderLibrary(); renderSlots();
}
boot();
