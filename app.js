let data=[];
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const validUrl=v=>{try{let u=new URL(v);return ["http:","https:"].includes(u.protocol)}catch{return false}};
function addOptions(id,values){const s=$(id);[...new Set(values.filter(Boolean))].sort().forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;s.appendChild(o)})}
function buildThemes(){
  const box=$("themeTiles"),counts={};
  data.forEach(x=>counts[x.theme]=(counts[x.theme]||0)+1);
  box.innerHTML=Object.keys(counts).sort().map(t=>`<button class="theme-tile" type="button" data-theme="${esc(t)}"><span>${esc(t)}</span><span class="theme-count">${counts[t]} dataset${counts[t]===1?"":"s"}</span></button>`).join("");
  box.querySelectorAll(".theme-tile").forEach(b=>b.onclick=()=>{const selected=b.dataset.theme;$("theme").value=selected;document.querySelectorAll(".theme-tile").forEach(x=>x.classList.toggle("active",x===b));render();$("catalogue").scrollIntoView({behavior:"smooth"})});
}
function render(){
  const q=$("q").value.toLowerCase().trim(),t=$("theme").value,p=$("publisher").value;
  let r=data.filter(x=>(!t||x.theme===t)&&(!p||x.publisher===p)&&(!q||[x.title,x.theme,x.publisher,x.description,x.keywords,x.geography].join(" ").toLowerCase().includes(q)));
  const sort=$("sort").value;r.sort((a,b)=>String(a[sort]||"").localeCompare(String(b[sort]||"")));
  $("count").textContent=`${r.length} of ${data.length} datasets`;
  $("empty").hidden=r.length!==0;
  $("grid").innerHTML=r.map(x=>`<article class="card">
    <span class="tag">${esc(x.theme)}</span>
    <h3>${esc(x.title)}</h3>
    <div class="pub">${esc(x.publisher)}</div>
    <p class="desc">${esc(x.description)}</p>
    <div class="meta">${x.latestAvailable?`<span>Latest: ${esc(x.latestAvailable)}</span>`:""}${x.year?`<span>Year: ${esc(x.year)}</span>`:""}${x.geography?`<span>${esc(x.geography)}</span>`:""}${x.frequency?`<span>${esc(x.frequency)}</span>`:""}</div>
    <div class="actions">${validUrl(x.source)?`<a href="${esc(x.source)}" target="_blank" rel="noopener noreferrer">View data source →</a>`:`<span class="missing" title="${esc(x.sourceDisplay||"")}">Source link unavailable in CSV</span>`}${validUrl(x.dashboard)?`<a class="secondary" href="${esc(x.dashboard)}" target="_blank" rel="noopener noreferrer">Coventry analysis</a>`:""}</div>
  </article>`).join("");
}
function resetAll(){ $("q").value="";$("theme").value="";$("publisher").value="";$("sort").value="title";document.querySelectorAll(".theme-tile").forEach(x=>x.classList.remove("active"));render()}
async function load(){
  const r=await fetch("./catalogue.json",{cache:"no-store"}),j=await r.json();data=j.items||[];
  addOptions("theme",data.map(x=>x.theme));addOptions("publisher",data.map(x=>x.publisher));buildThemes();
  $("status").textContent="Public catalogue published from the Migration Data Repository.";render();
}
$("q").addEventListener("input",render);$("theme").addEventListener("change",()=>{document.querySelectorAll(".theme-tile").forEach(x=>x.classList.toggle("active",x.dataset.theme===$("theme").value));render()});
$("publisher").addEventListener("change",render);$("sort").addEventListener("change",render);
$("searchBtn").onclick=()=>{$("catalogue").scrollIntoView({behavior:"smooth"});render()};
$("reset").onclick=resetAll;$("allThemes").onclick=()=>{$("theme").value="";document.querySelectorAll(".theme-tile").forEach(x=>x.classList.remove("active"));render();$("catalogue").scrollIntoView({behavior:"smooth"})};
load();
