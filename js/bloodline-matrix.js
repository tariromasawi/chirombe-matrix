/* CHIROMBE MATRIX 3.0 Phase 3 Bloodline Matrix. Symbolic cover only. */
(function (g) {
  "use strict";
  var TIER = {"great-great-grandfather":0,"great-grandfather":1,"grandfather":2,"grandmother":2,"father":3,"mother":3,"self":4,"brother":4,"sister":4,"son":5,"adopted nephew/son":5,"house":6,"future":7};
  var LABEL = ["CHIROMBE LINE","MAKWENGURA","GRANDPARENTS","PARENTS","PRESENT HOUSE","HEIRS","HOUSE SEAL","FUTURE DESCENDANTS"];
  var LINKS = [["Chirombe","Makwengura"],["Makwengura","Masawi"],["Masawi","Sebastian Karumekangu Masawi"],["Masarura","Sebastian Karumekangu Masawi"],["Sebastian Karumekangu Masawi","HRH Saint Tariro Masawi"],["Risto Kasirori Masawi","HRH Saint Tariro Masawi"],["HRH Saint Tariro Masawi","HRH Tarry Kupakwashe Masawi"],["HRH Saint Tariro Masawi","Kenzi Masawi"],["Sebastian Karumekangu Masawi","Tenderayi"],["Sebastian Karumekangu Masawi","Silent"],["Sebastian Karumekangu Masawi","Trymore"],["Sebastian Karumekangu Masawi","Charles"],["Sebastian Karumekangu Masawi","Tatenda"],["Sebastian Karumekangu Masawi","Rhoda"],["Sebastian Karumekangu Masawi","Abigail"],["Sebastian Karumekangu Masawi","Corinna"]];
  var state = {filter:"all", selected:null, nodes:[], layout:[], pulse:0};
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g, function(c){ return "&#"+c.charCodeAt(0)+";"; }); }
  function roster(){
    var fam = (g.ChirombeCore && g.ChirombeCore.family) || [];
    return fam.map(function(m,i){
      var gen = m.generation || m.relation || "";
      return {name:m.name||("NODE "+(i+1)), generation:gen, role:m.role||"NODE", remembrance:!!(m.remembrance||m.status==="remembered"), protect:m.protect!==false, future:!!(m.anonymousUntilNamed||gen==="future"||m.role==="DESCENDANT"), house:m.role==="HOUSE", heir:m.role==="HEIR"||gen==="son"||gen==="adopted nephew/son", core:m.role==="CORE", tier:TIER.hasOwnProperty(gen)?TIER[gen]:4, raw:m};
    });
  }
  function filtered(list){
    var f = state.filter;
    if(f==="ancestors") return list.filter(function(n){ return n.role==="ANCESTOR" || (n.remembrance && n.tier<4); });
    if(f==="living") return list.filter(function(n){ return !n.remembrance && !n.future && !n.house; });
    if(f==="remembered") return list.filter(function(n){ return n.remembrance; });
    if(f==="heirs") return list.filter(function(n){ return n.heir || n.core; });
    if(f==="future") return list.filter(function(n){ return n.future; });
    return list;
  }
  function stats(list){
    return {total:list.length, ancestors:list.filter(function(n){return n.role==="ANCESTOR";}).length, living:list.filter(function(n){return !n.remembrance&&!n.future&&!n.house;}).length, remembered:list.filter(function(n){return n.remembrance;}).length, heirs:list.filter(function(n){return n.heir;}).length, future:list.filter(function(n){return n.future;}).length};
  }
  function paintStats(s){
    if($("blTotal")) $("blTotal").textContent=s.total;
    if($("blAncestors")) $("blAncestors").textContent=s.ancestors;
    if($("blLiving")) $("blLiving").textContent=s.living;
    if($("blRemembered")) $("blRemembered").textContent=s.remembered;
    if($("blHeirs")) $("blHeirs").textContent=s.heirs;
    if($("blFuture")) $("blFuture").textContent=s.future;
    if($("mNodes")) $("mNodes").textContent=s.total;
  }
  function paintGrid(list){
    var host=$("familyGrid"); if(!host) return; host.innerHTML="";
    filtered(list).forEach(function(n){
      var d=document.createElement("button"); d.type="button";
      d.className="family-node"+(n.remembrance?" remembered":"")+(n.core?" core":"")+(n.heir?" heir":"")+(n.future?" future":"");
      d.innerHTML="<b>"+esc(n.name)+"</b><span>"+esc(n.generation||n.role)+(n.remembrance?" REMEMBERED":n.future?" UNNAMED":" COVERED")+"</span>";
      d.onclick=function(){ select(n); };
      host.appendChild(d);
    });
  }
  function select(n){
    state.selected=n;
    var box=$("bloodDetail");
    if(box){
      box.innerHTML="<div class='eyebrow'>SELECTED NODE</div><h3>"+esc(n.name)+"</h3><div class='telemetry'><div><span>GENERATION</span><b>"+esc(n.generation||"-")+"</b></div><div><span>ROLE</span><b>"+esc(n.role)+"</b></div><div><span>TIER</span><b>"+esc(LABEL[n.tier]||n.tier)+"</b></div><div><span>REMEMBRANCE</span><b>"+(n.remembrance?"YES":"LIVING RECORD")+"</b></div><div><span>COVER MODEL</span><b>"+(n.protect?"INCLUDED":"NOT MARKED")+"</b></div></div><p class='honest'>Authorised remembrance record. Cover means integrity, audit, watchdog and ritual language. Not a claim of supernatural causation.</p>";
    }
    if(g.ChirombeAudit&&g.ChirombeAudit.append) g.ChirombeAudit.append("BLOODLINE_SELECT",{name:n.name,role:n.role});
    drawMap();
  }
  function resize(c){
    var r=c.getBoundingClientRect(); var d=Math.min(g.devicePixelRatio||1,2);
    c.width=Math.max(1,r.width*d); c.height=Math.max(1,r.height*d);
    var x=c.getContext("2d"); x.setTransform(d,0,0,d,0,0); return x;
  }
  function layoutNodes(list,w,h){
    var groups={}; list.forEach(function(n){ (groups[n.tier]||(groups[n.tier]=[])).push(n); });
    var tiers=Object.keys(groups).map(Number).sort(function(a,b){return a-b;});
    var out=[]; var rowH=Math.max(58,(h-50)/Math.max(tiers.length,1));
    tiers.forEach(function(tier,ti){
      var row=groups[tier]; var y=36+ti*rowH;
      row.forEach(function(n,i){ out.push({n:n,x:28+((w-56)*(i+1))/(row.length+1),y:y,r:n.core?16:11}); });
    });
    return out;
  }
  function drawMap(){
    var c=$("lineageCanvas"); if(!c) return;
    var x=resize(c); var w=c.clientWidth; var h=c.clientHeight;
    var list=filtered(state.nodes); var lay=layoutNodes(list,w,h); state.layout=lay;
    x.fillStyle="#020806"; x.fillRect(0,0,w,h);
    var armed=!!(g.ZionProtect&&g.ZionProtect.snapshot&&g.ZionProtect.snapshot().armed);
    state.pulse+=0.03; var glow=armed?0.18+Math.sin(state.pulse)*0.08:0.08;
    var byName={}; lay.forEach(function(p){ byName[p.n.name]=p; });
    var edges=(g.ChirombeCore&&g.ChirombeCore.links&&g.ChirombeCore.links.length)?g.ChirombeCore.links:LINKS;
    x.lineWidth=1;
    edges.forEach(function(pair){
      var a=byName[pair[0]]; var b=byName[pair[1]]; if(!a||!b) return;
      x.beginPath(); x.moveTo(a.x,a.y); x.bezierCurveTo(a.x,(a.y+b.y)/2,b.x,(a.y+b.y)/2,b.x,b.y);
      x.strokeStyle="rgba(155,231,189,"+(0.18+glow)+")"; x.stroke();
    });
    var seen={};
    lay.forEach(function(p){
      if(seen[p.n.tier]) return; seen[p.n.tier]=true;
      x.fillStyle="#5f8a76"; x.font="9px monospace"; x.fillText(LABEL[p.n.tier]||("TIER "+p.n.tier),12,p.y-18);
    });
    lay.forEach(function(p){
      var sel=state.selected&&state.selected.name===p.n.name;
      x.beginPath(); x.arc(p.x,p.y,p.r+(sel?5:0),0,Math.PI*2);
      x.fillStyle=p.n.remembrance?"#c9ad61":p.n.future?"#3d6d58":p.n.core?"#ffe6a1":"#8be2b1";
      x.fill(); x.strokeStyle=sel?"#fff4c8":"rgba(2,8,6,0.8)"; x.stroke();
      x.fillStyle="#d7efe4"; x.font=(p.n.core?"11px":"9px")+" monospace";
      x.fillText(p.n.name.length>22?p.n.name.slice(0,20)+"..":p.n.name,p.x+p.r+6,p.y+3);
    });
  }
  function hit(mx,my){
    var found=null;
    state.layout.forEach(function(p){ var dx=mx-p.x, dy=my-p.y; if(dx*dx+dy*dy<=(p.r+10)*(p.r+10)) found=p.n; });
    return found;
  }
  function bindCanvas(){
    var c=$("lineageCanvas"); if(!c||c._bloodBound) return; c._bloodBound=true;
    c.addEventListener("click", function(ev){ var r=c.getBoundingClientRect(); var n=hit(ev.clientX-r.left, ev.clientY-r.top); if(n) select(n); });
    g.addEventListener("resize", drawMap);
  }
  function setFilter(name){
    state.filter=name;
    document.querySelectorAll("[data-blood-filter]").forEach(function(b){ b.classList.toggle("active", b.getAttribute("data-blood-filter")===name); });
    paintGrid(state.nodes); drawMap();
  }
  function coverCircle(){
    if(g.ZCCA&&g.ZCCA.protect) g.ZCCA.protect();
    if(g.ChirombeAudit&&g.ChirombeAudit.append) g.ChirombeAudit.append("BLOODLINE_COVER",{nodes:state.nodes.length});
    render();
  }
  function nameDescendant(){
    var name=prompt("Name a descendant to bring into the authorised circle."); if(!name) return;
    var node={id:"FAM-NAMED-"+Date.now().toString(36), name:name, relation:"named descendant", generation:"future", role:"DESCENDANT", protect:true, anonymousUntilNamed:false};
    if(g.ChirombeCore&&g.ChirombeCore.addNode) g.ChirombeCore.addNode(node);
    if(g.ChirombeAudit&&g.ChirombeAudit.append) g.ChirombeAudit.append("DESCENDANT_NAMED",{name:name});
    render();
    var fresh=state.nodes.filter(function(n){ return n.name===name; })[0];
    if(fresh) select(fresh);
  }
  function rememberSelected(){
    if(!state.selected||!state.selected.raw) return;
    state.selected.raw.remembrance=true; state.selected.raw.status="remembered";
    if(g.ChirombeAudit&&g.ChirombeAudit.append) g.ChirombeAudit.append("REMEMBER",{name:state.selected.name});
    if(g.CHIROMBE_LITURGY_AUDIO) g.CHIROMBE_LITURGY_AUDIO.speak({text:"Mwari ndi Mwari. "+state.selected.name+" is remembered with dignity, love and faith."});
    render();
  }
  function praySelected(){
    var n=state.selected;
    var line=n?"Mwari ndi Mwari. Peace, wisdom and protection over "+n.name+".":"Mwari ndi Mwari. Peace over the House of Masawi.";
    if(g.CHIROMBE_LITURGY_AUDIO) g.CHIROMBE_LITURGY_AUDIO.speak({text:line});
    if(g.ChirombeAudit&&g.ChirombeAudit.append) g.ChirombeAudit.append("BLOODLINE_PRAYER",{name:n&&n.name});
  }
  function render(){
    state.nodes=roster();
    paintStats(stats(state.nodes));
    paintGrid(state.nodes);
    bindCanvas();
    drawMap();
    if(!state.selected && state.nodes.length){
      var core=state.nodes.filter(function(n){ return n.core && n.generation==="self"; })[0] || state.nodes[0];
      select(core);
    }
  }
  function boot(){
    document.querySelectorAll("[data-blood-filter]").forEach(function(b){ b.onclick=function(){ setFilter(b.getAttribute("data-blood-filter")); }; });
    if($("coverCircle")) $("coverCircle").onclick=coverCircle;
    if($("nameDescendant")) $("nameDescendant").onclick=nameDescendant;
    if($("rememberSelected")) $("rememberSelected").onclick=rememberSelected;
    if($("praySelected")) $("praySelected").onclick=praySelected;
    g.addEventListener("chirombe-family-ready", render);
    render();
    setInterval(function(){ if($("panel-bloodline") && $("panel-bloodline").classList.contains("active")) drawMap(); }, 80);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  g.CHIROMBE_BLOODLINE={render:render, select:select, stats:function(){ return stats(roster()); }};
})(typeof window!=="undefined"?window:globalThis);
