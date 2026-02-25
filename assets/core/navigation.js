/* PMS2 unified navigation — idempotent + anti-duplicates
   Injects: top operator nav, bottom nav, 2 floating “↑ Haut” buttons */
(function(){
  const doc=document, body=doc.body;
  if(!body || body.dataset.navInit==="1") return;
  body.dataset.navInit="1";
  body.dataset.navCore = body.dataset.navCore || "1";

  const ensureMain=()=>{ let m=doc.querySelector("main"); if(!m){ m=doc.createElement("main"); doc.body.appendChild(m);} return m; };
  const main=ensureMain();

  // Remove duplicates from broken runs
  ["#pms-op-nav","#pms-bottom-nav","#pms-float-left","#pms-float-right"].forEach(sel=>{
    doc.querySelectorAll(sel).forEach((n,i)=>{ if(i>0) n.remove(); });
  });

  // Top operator nav
  if(!doc.querySelector("#pms-op-nav")){
    const nav=doc.createElement("div");
    nav.id="pms-op-nav";
    nav.className="pms-op-nav";
    nav.innerHTML=`
      <div class="pms-op-wrap">
        <a class="pms-op-btn" href="./index.html">Hub</a>
        <button class="pms-op-btn" type="button" data-nav="prev">Section précédente</button>
        <button class="pms-op-btn primary" type="button" data-nav="next">Section suivante</button>
        <button class="pms-op-btn" type="button" data-nav="top">Haut de page</button>
      </div>`;
    main.prepend(nav);
  }

  // Bottom nav
  if(!doc.querySelector("#pms-bottom-nav")){
    const bottom=doc.createElement("div");
    bottom.id="pms-bottom-nav";
    bottom.className="pms-bottom-nav";
    bottom.innerHTML=`
      <div class="pms-bottom-wrap">
        <a class="pms-op-btn" href="./index.html">Hub</a>
        <button class="pms-op-btn" type="button" data-nav="prev">Section précédente</button>
        <button class="pms-op-btn primary" type="button" data-nav="next">Section suivante</button>
        <button class="pms-op-btn" type="button" data-nav="top">Haut</button>
      </div>`;
    doc.body.appendChild(bottom);
  }

  // Floating “↑ Haut”
  const mkFloat=(id,side)=>{
    if(doc.querySelector("#"+id)) return;
    const b=doc.createElement("button");
    b.id=id; b.type="button";
    b.className="pms-float "+side;
    b.textContent="↑ Haut";
    b.setAttribute("aria-label","Remonter en haut de page");
    b.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
    doc.body.appendChild(b);
  };
  mkFloat("pms-float-left","left");
  mkFloat("pms-float-right","right");

  // Bind nav actions
  const sections=Array.from(doc.querySelectorAll("main h2, main h3")).filter(h=>h.textContent.trim().length>0);
  const currentIndex=()=>{
    const y=window.scrollY+140;
    let idx=0;
    for(let i=0;i<sections.length;i++){
      if(sections[i].getBoundingClientRect().top + window.scrollY <= y) idx=i;
    }
    return idx;
  };
  const go=(dir)=>{
    if(!sections.length) return;
    const i=currentIndex();
    const target = dir==="next" ? sections[Math.min(i+1,sections.length-1)] : sections[Math.max(i-1,0)];
    target.scrollIntoView({behavior:"smooth", block:"start"});
  };
  const onClick=(e)=>{
    const t=e.target;
    if(!(t instanceof HTMLElement)) return;
    const act=t.getAttribute("data-nav");
    if(!act) return;
    if(act==="top") window.scrollTo({top:0,behavior:"smooth"});
    if(act==="next") go("next");
    if(act==="prev") go("prev");
  };
  doc.querySelectorAll("[data-nav]").forEach(el=>el.addEventListener("click",onClick));

  // float visibility
  const floats=[doc.querySelector("#pms-float-left"),doc.querySelector("#pms-float-right")].filter(Boolean);
  const toggle=()=>{
    const show=window.scrollY>320;
    floats.forEach(b=>{ b.style.opacity=show?"1":"0"; b.style.pointerEvents=show?"auto":"none"; });
  };
  window.addEventListener("scroll",toggle,{passive:true});
  toggle();
})();
