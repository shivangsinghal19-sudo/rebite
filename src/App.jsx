import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";

/* ─── constants ─── */
const EMOJI = { Bakery:"🥐", Cafe:"☕", "Fine Dining":"🍽️", Buffet:"🍱", Meal:"🍛", Dessert:"🧁", default:"🛍️" };
const AREAS  = ["All","CP","Hauz Khas","GK","Saket","Rajouri"];
const TYPES  = ["All","Bakery","Meal","Dessert","Cafe","Fine Dining","Buffet"];
const AREA_ICONS = { CP:"🏛️","Hauz Khas":"🌳",GK:"🏘️",Saket:"🎬",Rajouri:"🛍️" };
const CO2_PER_BAG = 1.2;
const VEG_TYPES = new Set(["Bakery","Dessert","Cafe"]);
const isVeg = b => VEG_TYPES.has(b.type);
const getDisc = b => b.original_price>0 ? Math.round(((b.original_price-b.price)/b.original_price)*100) : 0;

const DISH_IMAGES = {
  Bakery:["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=75","https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=75","https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&q=75","https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?w=400&q=75"],
  Meal:["https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=75","https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=75","https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=75","https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=75"],
  Dessert:["https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=75","https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=75","https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=75"],
  Cafe:["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75","https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=75","https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&q=75"],
  "Fine Dining":["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75","https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=75","https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=75"],
  Buffet:["https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=75","https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=75","https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=75"],
};
const REST_FALLBACK = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=75",
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&q=75",
  "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400&q=75",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=75",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75",
];
const BAG_HERO = {
  Bakery:{name:"Freshly Baked Assortment",sub:"Croissants · breads · pastries",img:"https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80"},
  Meal:{name:"Chef's Daily Meal Box",sub:"Dal · sabzi · rice / roti",img:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80"},
  Dessert:{name:"Dessert Surprise Box",sub:"Cakes · mithais · 2-3 pieces",img:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&q=80"},
  Cafe:{name:"Cafe Combo",sub:"Beverage + snack of the day",img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&q=80"},
  "Fine Dining":{name:"Chef's Tasting Portion",sub:"Starter + main course",img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&q=80"},
  Buffet:{name:"Buffet Selection Box",sub:"5-7 items from the chef",img:"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&q=80"},
};
const FACTS = [
  "🌍  1/3 of all food produced globally is wasted every year",
  "🌱  Saving one ReBite bag prevents ~1.2 kg of CO2",
  "💧  A single burger takes 2,400 litres of water to produce",
  "🇮🇳  India wastes Rs 92,000 crore worth of food annually",
  "♻️  Food waste in landfills produces methane — 25x worse than CO2",
  "🥗  A ReBite bag saves up to 80% vs menu price",
  "🌾  40% of India's fruits and vegetables are lost post-harvest",
  "🏙️  Delhi restaurants discard thousands of meals every night",
  "🤝  Each bag you save helps a restaurant stay sustainable",
  "⚡  Food production uses 70% of all fresh water on Earth",
  "🍱  The average Indian family wastes food worth Rs 30,000/year",
  "🐄  Livestock for food produces 14.5% of global greenhouse gases",
];

const getDishImage = bag => {
  const p = DISH_IMAGES[bag.type] || DISH_IMAGES.Meal;
  const seed = ((bag.id||"x").charCodeAt(0)||0) + ((bag.id||"x").charCodeAt(1)||0);
  return p[seed % p.length];
};
const getRestImage = bag => bag.restaurantImage || REST_FALLBACK[((bag.id||"x").charCodeAt(1)||0) % REST_FALLBACK.length];
const genSlots = (s,e) => {
  if(!s||!e) return ["18:00","19:00","20:00","21:00"];
  const sl=[], [sh]=s.split(":").map(Number), [eh]=e.split(":").map(Number);
  for(let h=sh;h<=eh;h++) sl.push(`${String(h).padStart(2,"0")}:00`);
  return sl;
};

/* ── SPLASH (Netflix-style) ── */
function SplashScreen({onDone}){
  const [phase, setPhase] = useState(0);
  useEffect(()=>{
    const t1=setTimeout(()=>setPhase(1),500);
    const t2=setTimeout(()=>setPhase(2),1800);
    const t3=setTimeout(()=>onDone(),2400);
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};
  },[]);
  return(
    <div style={{
      position:"fixed",inset:0,background:"#080e09",
      display:"flex",alignItems:"center",justifyContent:"center",
      zIndex:9999,pointerEvents:"none",
      opacity:phase===2?0:1,
      transition:phase===2?"opacity 0.55s ease":"none",
    }}>
      <div style={{
        display:"flex",flexDirection:"column",alignItems:"center",gap:14,
        opacity:phase===0?0:1,
        transform:phase===0?"scale(0.65)":phase===1?"scale(1)":"scale(1.1)",
        transition:phase===1?"transform 0.55s cubic-bezier(0.34,1.56,0.64,1),opacity 0.4s ease"
                  :phase===2?"transform 0.55s ease":"none",
        filter:phase===1?"drop-shadow(0 0 50px rgba(82,183,136,0.9))":"none",
      }}>
        <div style={{
          width:88,height:88,borderRadius:24,
          background:"linear-gradient(135deg,#F9C74F,#F4845F)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:46,
          boxShadow:phase===1?"0 0 80px rgba(249,199,79,0.7),0 0 150px rgba(82,183,136,0.35)":"none",
        }}>
          ♻️
        </div>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:42,fontWeight:800,color:"#fff",letterSpacing:"-1.5px"}}>
          Re<span style={{color:"#52B788"}}>Bite</span>
        </div>
        <div style={{
          fontFamily:"'Nunito',sans-serif",fontSize:12,color:"rgba(255,255,255,0.45)",
          letterSpacing:"3px",textTransform:"uppercase",
          opacity:phase===1?1:0,transition:"opacity 0.4s ease 0.3s",
        }}>
          Save Food · Save Delhi
        </div>
      </div>
    </div>
  );
}

/* ── Theme vars ── */
function ThemeVars({dark}){
  const L={"--bg":"#F4F5F2","--card":"#ffffff","--border":"#E8E8E8","--dark":"#111111","--gray":"#7A7A7A","--sbg":"#ffffff","--sh":"#F7F7F5","--gp":"#E6F4EC","--mdiv-c":"#BFE0CD","--mode-bg":"#EFEFEF","--card-shadow":"rgba(0,0,0,.05)","--card-shadow-hover":"rgba(0,0,0,.11)","--nav-shadow":"rgba(0,0,0,.06)","--toast-bg":"#111111","--toast-fg":"#fff","--header-sub":"#1e4d38"};
  const D={"--bg":"#0E1410","--card":"#182018","--border":"#263028","--dark":"#E6F0E8","--gray":"#7A967C","--sbg":"#182018","--sh":"rgba(255,255,255,.03)","--gp":"#152A19","--mdiv-c":"#2A4030","--mode-bg":"#182018","--card-shadow":"rgba(0,0,0,.28)","--card-shadow-hover":"rgba(0,0,0,.38)","--nav-shadow":"rgba(0,0,0,.35)","--toast-bg":"#E6F0E8","--toast-fg":"#0E1410","--header-sub":"#0f2a1c"};
  const v=dark?D:L, bg=dark?"#070C08":"#D8DDD4";
  return <style>{`:root{${Object.entries(v).map(([k,val])=>`${k}:${val}`).join(";")}}html,body{background:${bg}}.shell{background:${bg}}`}</style>;
}

/* ── Leaflet Map ── */
function LeafletMap({bags}){
  const mr=useRef(null),inst=useRef(null);
  useEffect(()=>{
    if(inst.current)return;
    const C={CP:[28.6315,77.2167],"Hauz Khas":[28.5494,77.2001],GK:[28.5391,77.2355],Saket:[28.5244,77.2066],Rajouri:[28.6419,77.1143]};
    const init=()=>{
      if(!mr.current||inst.current)return;
      const L=window.L,m=L.map(mr.current).setView([28.585,77.19],11);
      inst.current=m;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OSM"}).addTo(m);
      const g={};
      bags.forEach(b=>{if(!g[b.restaurantArea])g[b.restaurantArea]=[];g[b.restaurantArea].push(b);});
      Object.entries(g).forEach(([a,ab])=>{
        const c=C[a];if(!c)return;
        const icon=L.divIcon({html:`<div style="background:#2D6A4F;color:#fff;font-family:sans-serif;font-weight:700;font-size:11px;padding:4px 8px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.3);">${AREA_ICONS[a]||"📍"} ${a} · ${ab.length}</div>`,className:"",iconAnchor:[40,14]});
        L.marker(c,{icon}).addTo(m).bindPopup(`<b>${a}</b><br>${ab.length} bags`);
      });
    };
    if(!document.getElementById("lf-css")){const l=document.createElement("link");l.id="lf-css";l.rel="stylesheet";l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(l);}
    window.L?init():(()=>{const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.onload=init;document.body.appendChild(s);})();
    return()=>{if(inst.current){inst.current.remove();inst.current=null;}};
  },[bags.length]);
  return <div ref={mr} style={{width:"100%",height:"230px"}} />;
}

/* ── Card Slider ── */
function CardSlider({bag,disc,veg}){
  const dishImg=getDishImage(bag), restImg=getRestImage(bag);
  const [idx,setIdx]=useState(0);
  useEffect(()=>{
    const delay=((bag.id||"x").charCodeAt(0)||0)%20*200;
    let iv;
    const t=setTimeout(()=>{iv=setInterval(()=>setIdx(i=>(i+1)%2),4200);},delay);
    return()=>{clearTimeout(t);clearInterval(iv);};
  },[bag.id]);
  return(
    <div className="cimg-wrap">
      {[dishImg,restImg].map((src,i)=>(
        <img key={i} className={`cimg-slide ${i===idx?"visible":"hidden"}`} src={src} alt={i===0?"food":"restaurant"} loading="lazy"/>
      ))}
      <div className="img-label">{idx===0?"🍴 Food":"🏪 Place"}</div>
      {disc>=50&&bag.quantity>0&&<div className="cbadge-wrap"><span className="cbadge">{disc}% off</span></div>}
      {bag.quantity>0&&bag.quantity<=2&&<div className="cbadge-wrap2"><span className="cbadge grn">Last {bag.quantity}!</span></div>}
      {veg?<div className="veg-dot"><div className="veg-dot-inner"/></div>:<div className="nveg-dot"><div className="nveg-dot-inner"/></div>}
      {bag.quantity===0&&<div className="sold-over">SOLD OUT</div>}
      <div className="img-dots">{[0,1].map(i=><div key={i} className={`img-dot${i===idx?" active":""}`}/>)}</div>
    </div>
  );
}

/* ══ CSS ══ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
:root{--green:#2D6A4F;--gl:#52B788;--orange:#E23744;--yellow:#F9C74F;--w:430px;--fh:'Plus Jakarta Sans',sans-serif;--fb:'Nunito',sans-serif;}
html,body{height:100%;}
body{font-family:var(--fb);-webkit-font-smoothing:antialiased;}
.shell{width:100vw;height:100vh;display:flex;justify-content:center;overflow:hidden;}
.app{width:var(--w);height:100vh;background:var(--bg);display:flex;flex-direction:column;box-shadow:0 0 80px rgba(0,0,0,.3);overflow:hidden;position:relative;}
@media(max-width:460px){:root{--w:100vw;}.shell,.app{height:100dvh;}.app{box-shadow:none;}.bnav,.fab,.drawer,.pwa-banner{width:100vw!important;left:0!important;transform:none!important;}}
.sticky-top{flex-shrink:0;z-index:60;}
.header{background:var(--green);padding:10px 14px 10px;overflow:hidden;position:relative;}
.header::before{content:'';position:absolute;width:180px;height:180px;background:var(--gl);border-radius:50%;top:-80px;right:-40px;opacity:.15;pointer-events:none;}
.header::after{content:'';position:absolute;width:100px;height:100px;background:var(--yellow);border-radius:50%;bottom:-50px;left:-20px;opacity:.08;pointer-events:none;}
.hrow{display:flex;justify-content:space-between;align-items:center;}
.logo-wrap{display:flex;align-items:center;gap:8px;}
.logo-icon{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#F9C74F,#F4845F);display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 2px 8px rgba(0,0,0,.2);}
.logo-text{font-family:var(--fh);font-size:22px;font-weight:800;color:#fff;letter-spacing:-.6px;}
.logo-text span{color:#95D5B2;}
.hright{display:flex;align-items:center;gap:8px;}
.prof-avatar{width:33px;height:33px;border-radius:50%;background:linear-gradient(135deg,#F9C74F,#F4845F);display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;border:2px solid rgba(255,255,255,.3);transition:border-color .2s;flex-shrink:0;}
.prof-avatar:hover,.prof-avatar.active{border-color:#fff;}
.dm-toggle{width:34px;height:19px;border-radius:10px;background:rgba(255,255,255,.18);position:relative;cursor:pointer;border:none;transition:background .2s;flex-shrink:0;}
.dm-toggle.on{background:rgba(255,255,255,.28);}
.dm-knob{position:absolute;top:2.5px;left:2.5px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .2s;font-size:8px;display:flex;align-items:center;justify-content:center;}
.dm-toggle.on .dm-knob{transform:translateX(15px);}
.hloc{display:flex;align-items:center;gap:5px;color:rgba(255,255,255,.72);font-size:11px;margin-top:6px;}
.loc-dot{width:6px;height:6px;background:var(--yellow);border-radius:50%;flex-shrink:0;}
.htitle{font-family:var(--fh);font-size:13px;font-weight:700;color:rgba(255,255,255,.88);margin-top:1px;}
.htitle span{color:#A7E8C3;font-weight:800;}
.veg-banner{background:linear-gradient(90deg,#16A34A,#15803D);padding:7px 14px;display:flex;align-items:center;gap:8px;animation:slideDown .2s ease;}
@keyframes slideDown{from{opacity:0;max-height:0;padding:0 14px}to{opacity:1;max-height:40px;}}
.veg-banner-txt{font-family:var(--fh);font-size:11px;font-weight:700;color:#fff;flex:1;}
.veg-banner-x{background:none;border:none;color:rgba(255,255,255,.7);font-size:16px;cursor:pointer;line-height:1;padding:0;}
.ticker-wrap{background:var(--header-sub);padding:5px 0;overflow:hidden;border-top:1px solid rgba(255,255,255,.07);}
.ticker-track{display:flex;animation:tickScroll 60s linear infinite;width:max-content;}
.ticker-track:hover{animation-play-state:paused;}
.ticker-item{white-space:nowrap;font-size:10.5px;font-family:var(--fb);font-weight:600;color:rgba(255,255,255,.82);padding:0 30px;letter-spacing:.1px;}
@keyframes tickScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.sw{padding:8px 12px 0;background:var(--bg);}
.sb{background:var(--sbg);border-radius:12px;display:flex;align-items:center;gap:8px;padding:10px 13px;border:1.5px solid var(--border);transition:border-color .2s,box-shadow .2s;}
.sb:focus-within{border-color:var(--green);box-shadow:0 0 0 3px rgba(45,106,79,.1);}
.sb input{border:none;outline:none;flex:1;font-family:var(--fb);font-size:13px;color:var(--dark);background:transparent;font-weight:500;}
.sb input::placeholder{color:var(--gray);}
.filter-bar{display:flex;align-items:center;gap:5px;padding:7px 12px 0;overflow-x:auto;scrollbar-width:none;background:var(--bg);}
.filter-bar::-webkit-scrollbar{display:none;}
.fdiv{width:1px;height:16px;background:var(--border);flex-shrink:0;margin:0 1px;}
.fpill{display:inline-flex;align-items:center;gap:3px;padding:6px 11px;border-radius:20px;border:1.5px solid var(--border);background:var(--card);font-family:var(--fh);font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all .15s;color:var(--gray);flex-shrink:0;}
.fpill:hover{border-color:#aaa;}
.fpill.on{background:var(--green);color:#fff;border-color:var(--green);box-shadow:0 2px 8px rgba(45,106,79,.3);}
.qchips{display:flex;align-items:center;gap:5px;padding:6px 12px 4px;overflow-x:auto;scrollbar-width:none;background:var(--bg);}
.qchips::-webkit-scrollbar{display:none;}
.qchip{display:inline-flex;align-items:center;gap:3px;padding:5px 11px;border-radius:20px;border:1.5px solid var(--border);background:var(--card);font-family:var(--fh);font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all .15s;color:var(--dark);flex-shrink:0;}
.qchip.on{border-color:var(--orange);background:var(--orange);color:#fff;}
.qchip.star.on{border-color:#F59E0B;background:#F59E0B;color:#fff;}
.qchip.deal.on{border-color:#7C3AED;background:#7C3AED;color:#fff;}
.qchip.veg-q.on{border-color:#16A34A;background:#16A34A;color:#fff;}
.results-row{display:flex;align-items:center;justify-content:space-between;padding:3px 12px 5px;}
.results-count{font-family:var(--fh);font-size:11px;font-weight:600;color:var(--gray);}
.clear-all{font-size:11px;color:var(--orange);font-weight:700;cursor:pointer;font-family:var(--fh);}
.dropdown{position:fixed;background:var(--card);border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.22);z-index:9999;overflow:hidden;animation:ddIn .15s ease;border:1px solid var(--border);}
@keyframes ddIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.dd-hd{padding:10px 14px 7px;font-family:var(--fh);font-size:10px;font-weight:800;color:var(--gray);text-transform:uppercase;letter-spacing:.9px;border-bottom:1px solid var(--border);}
.dd-opt{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;cursor:pointer;transition:background .1s;font-size:13px;color:var(--dark);font-family:var(--fb);font-weight:500;}
.dd-opt:hover{background:var(--sh);}
.dd-opt.on{color:var(--green);font-weight:700;}
.chk{width:18px;height:18px;border-radius:50%;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;color:transparent;}
.dd-opt.on .chk{background:var(--green);border-color:var(--green);color:#fff;}
.dd-footer{padding:7px 14px 10px;border-top:1px solid var(--border);}
.dd-clr{background:none;border:none;color:var(--gray);font-size:11px;cursor:pointer;font-family:var(--fh);font-weight:700;}
.range-wrap{padding:10px 14px 12px;}
.range-lbls{display:flex;justify-content:space-between;font-size:11px;color:var(--gray);margin-bottom:8px;font-family:var(--fb);font-weight:600;}
.range-val{color:var(--green);font-size:14px;font-weight:800;}
input[type=range]{width:100%;accent-color:var(--green);cursor:pointer;}
.scroll-body{flex:1;overflow-y:auto;padding-bottom:130px;-webkit-overflow-scrolling:touch;}
.urgency{margin:8px 12px 6px;background:linear-gradient(135deg,#F4845F,#E23744);border-radius:14px;padding:10px 13px;display:flex;align-items:center;gap:10px;color:#fff;box-shadow:0 4px 16px rgba(226,55,68,.25);}
.urgency strong{display:block;font-family:var(--fh);font-size:12px;font-weight:800;}
.urgency span{font-size:10px;opacity:.9;}
.stats-band{margin:0 12px 8px;border-radius:14px;overflow:hidden;}
.stats-band-inner{background:linear-gradient(135deg,#1B4332,#2D6A4F);padding:13px 16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;}
.sb-item{text-align:center;}
.sb-item+.sb-item{border-left:1px solid rgba(255,255,255,.15);}
.sb-val{font-family:var(--fh);font-size:18px;font-weight:800;color:#fff;letter-spacing:-.3px;}
.sb-lbl{font-size:9px;color:rgba(255,255,255,.6);font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-top:1px;font-family:var(--fh);}
.impact-bar{margin:0 12px 8px;background:var(--gp);border-radius:12px;padding:10px 14px;display:flex;align-items:center;border:1px solid rgba(45,106,79,.15);}
.ib-item{flex:1;text-align:center;}
.ib-val{font-family:var(--fh);font-size:14px;font-weight:800;color:var(--green);}
.ib-lbl{font-size:9px;color:#52B788;font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-top:1px;font-family:var(--fh);}
.ib-div{width:1px;height:28px;background:rgba(45,106,79,.2);}
.sec-hd{display:flex;align-items:center;justify-content:space-between;padding:10px 12px 6px;}
.sec-title{font-family:var(--fh);font-size:14px;font-weight:800;color:var(--dark);}
.sec-link{font-family:var(--fh);font-size:11px;font-weight:700;color:var(--green);cursor:pointer;}
.loading{text-align:center;padding:50px 16px;}
.spin{font-size:34px;animation:spin 1s linear infinite;display:inline-block;}
@keyframes spin{to{transform:rotate(360deg)}}
.loading-txt{font-family:var(--fh);font-weight:700;font-size:13px;color:var(--dark);margin-top:12px;}
.empty{text-align:center;padding:40px 16px;color:var(--gray);}
.empty .big{font-size:44px;margin-bottom:10px;}
.empty p{font-family:var(--fh);font-size:15px;font-weight:700;color:var(--dark);}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:11px;padding:0 12px;}
.card{background:var(--card);border-radius:18px;overflow:hidden;box-shadow:0 2px 12px var(--card-shadow);cursor:pointer;transition:transform .18s,box-shadow .18s;animation:fu .35s ease both;border:1px solid var(--border);}
.card:active{transform:scale(0.97);}
.card:hover{transform:translateY(-3px);box-shadow:0 8px 28px var(--card-shadow-hover);}
@keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.card:nth-child(1){animation-delay:0s}.card:nth-child(2){animation-delay:.05s}.card:nth-child(3){animation-delay:.1s}.card:nth-child(4){animation-delay:.15s}.card:nth-child(5){animation-delay:.18s}.card:nth-child(6){animation-delay:.21s}
.cimg-wrap{width:100%;height:120px;position:relative;overflow:hidden;background:#ddd;}
.cimg-slide{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .7s ease;}
.cimg-slide.hidden{opacity:0;}
.cimg-slide.visible{opacity:1;}
.img-label{position:absolute;bottom:6px;left:6px;background:rgba(0,0,0,.58);color:#fff;font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;font-family:var(--fh);z-index:2;pointer-events:none;backdrop-filter:blur(3px);}
.img-dots{position:absolute;bottom:7px;right:8px;display:flex;gap:3px;z-index:2;}
.img-dot{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.4);}
.img-dot.active{background:#fff;width:9px;border-radius:4px;}
.cbadge-wrap{position:absolute;top:6px;left:6px;z-index:3;}
.cbadge-wrap2{position:absolute;top:24px;left:6px;z-index:3;}
.cbadge{display:inline-flex;align-items:center;background:var(--orange);color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:20px;font-family:var(--fh);}
.cbadge.grn{background:#16A34A;}
.sold-over{position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--fh);font-size:12px;font-weight:800;z-index:2;letter-spacing:.8px;}
.veg-dot{position:absolute;top:6px;right:6px;width:16px;height:16px;border-radius:4px;border:2px solid #22C55E;background:#fff;display:flex;align-items:center;justify-content:center;z-index:3;}
.veg-dot-inner{width:8px;height:8px;border-radius:50%;background:#22C55E;}
.nveg-dot{position:absolute;top:6px;right:6px;width:16px;height:16px;border-radius:4px;border:2px solid #EF4444;background:#fff;display:flex;align-items:center;justify-content:center;z-index:3;}
.nveg-dot-inner{width:8px;height:8px;border-radius:50%;background:#EF4444;}
.cbody{padding:9px 10px 10px;}
.ctop{display:flex;justify-content:space-between;align-items:flex-start;gap:4px;margin-bottom:2px;}
.cname{font-family:var(--fh);font-size:12px;font-weight:700;color:var(--dark);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;}
.crating{font-family:var(--fh);font-size:10px;font-weight:800;color:#fff;background:#1BA672;border-radius:5px;padding:2px 6px;display:inline-flex;align-items:center;gap:2px;white-space:nowrap;flex-shrink:0;}
.ccat{font-size:10px;color:var(--gray);margin-bottom:7px;font-family:var(--fb);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cbot{display:flex;align-items:flex-end;justify-content:space-between;}
.price-row{display:flex;align-items:baseline;gap:4px;margin-bottom:2px;}
.price-new{font-family:var(--fh);font-size:19px;font-weight:800;color:var(--dark);letter-spacing:-.6px;line-height:1;}
.price-old{font-size:11px;color:var(--gray);text-decoration:line-through;font-family:var(--fb);line-height:1;}
.price-save-tag{font-size:9px;font-weight:800;color:#16A34A;background:#DCFCE7;border-radius:5px;padding:1px 5px;font-family:var(--fh);}
.cmeta{display:flex;align-items:center;gap:4px;}
.cmeta span{font-size:9.5px;color:var(--gray);font-family:var(--fb);font-weight:500;}
.cmeta .qty{color:#E07B39;font-weight:700;}
.add-btn{background:#fff;color:var(--green);border:2px solid var(--green);border-radius:9px;width:29px;height:29px;font-size:19px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700;transition:all .15s;}
.add-btn:hover{background:var(--green);color:#fff;}
.add-btn:disabled{background:var(--border);color:var(--gray);border-color:var(--border);cursor:default;}
.scroll-top{position:fixed;bottom:135px;right:calc(50% - var(--w)/2 + 14px);z-index:89;width:38px;height:38px;border-radius:50%;background:var(--green);border:none;box-shadow:0 3px 16px rgba(45,106,79,.45);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;animation:popIn .2s ease;color:#fff;font-weight:800;}
@media(max-width:460px){.scroll-top{right:14px;}}
.fab{position:fixed;bottom:68px;left:50%;transform:translateX(-50%);width:var(--w);pointer-events:none;z-index:90;display:flex;justify-content:flex-end;padding:0 12px;}
.fab-btn{pointer-events:all;background:var(--orange);color:#fff;border:none;border-radius:26px;padding:11px 18px;display:flex;align-items:center;gap:8px;cursor:pointer;font-family:var(--fh);font-weight:800;font-size:13px;box-shadow:0 5px 20px rgba(226,55,68,.45);animation:popIn .25s ease;}
@keyframes popIn{from{opacity:0;transform:scale(.82)}to{opacity:1;transform:scale(1)}}
.fab-badge{background:#fff;color:var(--orange);font-size:10px;font-weight:900;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:var(--w);background:var(--card);border-top:1px solid var(--border);display:flex;justify-content:space-around;padding:8px 0 max(10px,env(safe-area-inset-bottom));z-index:100;box-shadow:0 -3px 16px var(--nav-shadow);}
.nitem{display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;font-size:9px;color:var(--gray);font-family:var(--fh);font-weight:600;letter-spacing:.2px;padding:0 16px;transition:color .15s;}
.nitem.on{color:var(--green);}
.nicon{font-size:20px;}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:300;backdrop-filter:blur(4px);}
.drawer{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:var(--w);background:var(--card);border-radius:24px 24px 0 0;z-index:400;padding:20px 16px 24px;max-height:85vh;overflow-y:auto;animation:su .25s ease;}
@keyframes su{from{transform:translateX(-50%) translateY(100%)}to{transform:translateX(-50%) translateY(0)}}
.dhandle{width:36px;height:4px;background:var(--border);border-radius:4px;margin:0 auto 16px;}
.dtitle{font-family:var(--fh);font-size:18px;font-weight:800;margin-bottom:14px;color:var(--dark);}
.ci{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);}
.ci-img{width:46px;height:46px;border-radius:11px;object-fit:cover;flex-shrink:0;}
.ci-em{width:46px;height:46px;background:var(--gp);border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}
.ci-info{flex:1;}
.ci-name{font-family:var(--fh);font-size:12px;font-weight:700;color:var(--dark);}
.ci-price{font-size:14px;color:var(--green);font-weight:800;margin:2px 0;font-family:var(--fh);}
.ci-meta{font-size:10px;color:var(--gray);font-family:var(--fb);}
.rm-btn{background:none;border:1.5px solid var(--border);border-radius:8px;width:26px;height:26px;cursor:pointer;font-size:11px;color:var(--gray);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;}
.rm-btn:hover{border-color:#EF4444;color:#EF4444;}
.co-btn{width:100%;background:var(--orange);color:#fff;border:none;border-radius:14px;padding:14px;font-family:var(--fh);font-size:14px;font-weight:800;cursor:pointer;margin-top:12px;box-shadow:0 4px 16px rgba(226,55,68,.3);}
.detail{position:fixed;top:0;bottom:0;left:50%;transform:translateX(-50%);width:var(--w);background:var(--bg);z-index:450;overflow-y:auto;animation:si .25s ease;}
@keyframes si{from{transform:translateX(calc(-50% + var(--w)))}to{transform:translateX(-50%)}}
@media(max-width:460px){.detail{left:0;transform:none;}@keyframes si{from{transform:translateX(100%)}to{transform:translateX(0)}}}
.dimg{width:100%;height:220px;position:relative;overflow:hidden;}
.dimg img{width:100%;height:100%;object-fit:cover;}
.dimg-ov{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.3),transparent 60%);}
.back-btn{position:absolute;top:14px;left:14px;background:#fff;border:none;border-radius:12px;width:38px;height:38px;cursor:pointer;font-size:16px;box-shadow:0 2px 10px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;z-index:2;color:#333;}
.rest-strip{display:flex;align-items:center;gap:11px;padding:12px 14px;background:var(--card);border-bottom:1px solid var(--border);}
.rest-strip-img{width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0;}
.rest-name{font-family:var(--fh);font-size:14px;font-weight:800;color:var(--dark);}
.rest-meta{font-size:10px;color:var(--gray);margin-top:2px;line-height:1.5;font-family:var(--fb);}
.dbody{padding:14px;}
.dname{font-family:var(--fh);font-size:20px;font-weight:800;margin-bottom:4px;color:var(--dark);}
.dcat{font-size:11px;color:var(--gray);margin-bottom:12px;display:flex;align-items:center;gap:7px;flex-wrap:wrap;font-family:var(--fb);}
.mode-tog{display:flex;background:var(--mode-bg);border-radius:12px;padding:3px;margin-bottom:12px;}
.mbtn{flex:1;padding:8px 6px;border:none;border-radius:10px;font-family:var(--fh);font-size:11px;font-weight:700;cursor:pointer;transition:all .18s;background:transparent;color:var(--gray);}
.mbtn.on{background:var(--card);color:var(--green);box-shadow:0 1px 6px rgba(0,0,0,.1);}
.addr-wrap{background:var(--sh);border-radius:13px;padding:12px;margin-bottom:12px;border:1.5px solid var(--border);}
.addr-label{font-family:var(--fh);font-size:11px;font-weight:800;color:var(--dark);display:block;margin-bottom:7px;}
.addr-input{width:100%;background:var(--card);border:1.5px solid var(--border);border-radius:9px;padding:9px 11px;font-family:var(--fb);font-size:13px;color:var(--dark);outline:none;resize:none;transition:border-color .18s;}
.addr-input:focus{border-color:var(--green);}
.addr-shortcuts{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;}
.addr-chip{background:var(--gp);color:var(--green);border:none;border-radius:14px;padding:4px 10px;font-size:10px;font-weight:700;cursor:pointer;font-family:var(--fh);}
.ichips{display:flex;gap:6px;margin-bottom:12px;}
.ichip{flex:1;background:var(--card);border-radius:11px;padding:10px 8px;text-align:center;border:1px solid var(--border);}
.ichip .ico{font-size:16px;margin-bottom:3px;}
.ichip .ilabel{font-size:9px;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;font-weight:700;font-family:var(--fh);}
.ichip .ival{font-family:var(--fh);font-size:13px;font-weight:800;color:var(--dark);margin-top:2px;}
.dsect{font-family:var(--fh);font-size:10px;font-weight:800;color:var(--gray);text-transform:uppercase;letter-spacing:.7px;margin-bottom:9px;}
.ddesc{font-size:12px;line-height:1.85;color:var(--gray);margin-bottom:12px;white-space:pre-line;font-family:var(--fb);}
.bag-contents{background:var(--card);border-radius:13px;padding:10px 13px;margin-bottom:12px;border:1px solid var(--border);}
.bag-item{display:flex;align-items:center;gap:11px;padding:8px 0;border-bottom:1px solid var(--border);}
.bag-item:last-child{border-bottom:none;padding-bottom:0;}
.bag-item-img{width:50px;height:50px;border-radius:10px;object-fit:cover;flex-shrink:0;}
.bag-item-name{font-size:12px;font-weight:700;color:var(--dark);font-family:var(--fh);}
.bag-item-sub{font-size:10px;color:var(--gray);margin-top:2px;font-family:var(--fb);}
.time-wrap{margin-bottom:12px;}
.time-label{font-family:var(--fh);font-size:11px;font-weight:800;color:var(--dark);margin-bottom:6px;display:block;}
.time-sel{width:100%;background:var(--card);border:1.5px solid var(--border);border-radius:10px;padding:10px 12px;font-family:var(--fb);font-size:13px;color:var(--dark);outline:none;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;}
.dfooter{display:flex;align-items:center;gap:12px;background:var(--card);padding:12px 14px;border-top:1px solid var(--border);position:sticky;bottom:0;}
.dprice .old{font-size:11px;color:var(--gray);text-decoration:line-through;font-family:var(--fb);}
.dprice .new{font-family:var(--fh);font-size:24px;font-weight:800;color:var(--dark);letter-spacing:-.6px;}
.dadd-btn{flex:2;background:var(--orange);color:#fff;border:none;border-radius:13px;padding:13px;font-family:var(--fh);font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 3px 12px rgba(226,55,68,.3);transition:transform .15s;}
.dadd-btn:hover{transform:scale(1.02);}
.page{padding:16px;animation:fu .3s ease;}
.ptitle{font-family:var(--fh);font-size:20px;font-weight:800;margin-bottom:4px;color:var(--dark);}
.psub{font-size:12px;color:var(--gray);margin-bottom:16px;font-family:var(--fb);}
.map-wrap{border-radius:16px;overflow:hidden;margin-bottom:16px;box-shadow:0 3px 16px rgba(0,0,0,.12);}
.area-list{display:flex;flex-direction:column;gap:8px;}
.acard{background:var(--card);border-radius:14px;padding:12px 13px;display:flex;align-items:center;gap:11px;cursor:pointer;transition:transform .15s,box-shadow .15s;border:1px solid var(--border);}
.acard:hover{transform:translateX(4px);box-shadow:0 4px 16px var(--card-shadow-hover);}
.aicon{width:42px;height:42px;border-radius:12px;background:var(--gp);display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;}
.aname{font-family:var(--fh);font-size:14px;font-weight:700;color:var(--dark);}
.acount{font-size:10px;color:var(--gray);font-family:var(--fb);margin-top:2px;}
.ocard{background:var(--card);border-radius:14px;padding:13px;margin-bottom:9px;border:1px solid var(--border);box-shadow:0 1px 8px var(--card-shadow);}
.otop{display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;}
.oname{font-family:var(--fh);font-size:13px;font-weight:700;color:var(--dark);}
.ostatus{font-size:10px;font-weight:700;padding:3px 9px;border-radius:14px;background:var(--gp);color:var(--green);font-family:var(--fh);}
.ometa{font-size:10px;color:var(--gray);font-family:var(--fb);}
.odiv{height:1px;background:var(--border);margin:9px 0;}
.obot{display:flex;justify-content:space-between;align-items:center;}
.oprice{font-family:var(--fh);font-size:15px;font-weight:800;color:var(--dark);}
.rero{background:var(--gp);color:var(--green);border:none;border-radius:9px;padding:6px 11px;font-family:var(--fh);font-size:10px;font-weight:700;cursor:pointer;}
.phero{background:linear-gradient(135deg,var(--green),#1e4d38);border-radius:16px;padding:18px;margin-bottom:14px;display:flex;align-items:center;gap:13px;position:relative;overflow:hidden;}
.phero::after{content:'';position:absolute;width:120px;height:120px;background:rgba(255,255,255,.07);border-radius:50%;top:-30px;right:-20px;}
.pav{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#F9C74F,#F4845F);display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;box-shadow:0 4px 12px rgba(0,0,0,.2);}
.pn{font-family:var(--fh);font-size:17px;font-weight:800;color:#fff;}
.pe{font-size:11px;color:rgba(255,255,255,.72);margin-top:2px;font-family:var(--fb);}
.ps{font-size:10px;color:rgba(255,255,255,.5);margin-top:2px;font-family:var(--fb);}
.srow{display:flex;gap:7px;margin-bottom:16px;}
.sc{flex:1;background:var(--card);border-radius:13px;padding:10px 6px;text-align:center;border:1px solid var(--border);}
.sv{font-family:var(--fh);font-size:16px;font-weight:800;color:var(--green);}
.sl{font-size:9px;color:var(--gray);font-weight:700;text-transform:uppercase;letter-spacing:.4px;margin-top:2px;font-family:var(--fh);}
.msect{font-family:var(--fh);font-size:10px;font-weight:800;color:var(--gray);text-transform:uppercase;letter-spacing:.9px;margin-bottom:8px;}
.mlist{background:var(--card);border-radius:14px;overflow:hidden;margin-bottom:14px;border:1px solid var(--border);}
.mitem{display:flex;align-items:center;gap:11px;padding:12px 13px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s;}
.mitem:last-child{border-bottom:none;}
.mitem:hover{background:var(--sh);}
.mico{font-size:16px;width:34px;height:34px;background:var(--bg);border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mlbl{flex:1;font-size:13px;font-weight:600;color:var(--dark);font-family:var(--fb);}
.marr{color:var(--gray);font-size:14px;}
.lo-btn{width:100%;background:var(--card);border:1.5px solid #FECACA;color:#EF4444;border-radius:13px;padding:13px;font-family:var(--fh);font-size:13px;font-weight:700;cursor:pointer;}
.login-shell{width:100vw;height:100vh;background:linear-gradient(160deg,#1e4d38,#2D6A4F 40%,#1a3d2a);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;}
.login-shell::before{content:'';position:absolute;width:350px;height:350px;background:var(--gl);border-radius:50%;top:-130px;right:-80px;opacity:.18;}
.login-shell::after{content:'';position:absolute;width:250px;height:250px;background:var(--gl);border-radius:50%;bottom:-80px;left:-60px;opacity:.12;}
.login-card{background:#fff;border-radius:24px;padding:32px 24px;width:88%;max-width:360px;box-shadow:0 24px 80px rgba(0,0,0,.3);position:relative;z-index:1;animation:popIn .35s ease;}
.l-logo{display:flex;align-items:center;gap:10px;margin-bottom:24px;}
.l-logo-icon{width:44px;height:44px;border-radius:13px;background:linear-gradient(135deg,#F9C74F,#F4845F);display:flex;align-items:center;justify-content:center;font-size:22px;}
.l-logo-text{font-family:var(--fh);font-size:26px;font-weight:800;color:#1B1B1B;}
.l-logo-text span{color:var(--green);}
.l-h{font-family:var(--fh);font-size:21px;font-weight:800;color:#1B1B1B;margin-bottom:4px;}
.l-sub{font-size:13px;color:#6B7280;margin-bottom:20px;font-family:var(--fb);}
.lf{margin-bottom:13px;}
.lf label{display:block;font-size:11px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;font-family:var(--fh);}
.lf input{width:100%;border:1.5px solid #E5E7EB;border-radius:11px;padding:11px 13px;font-size:14px;font-family:var(--fb);outline:none;color:#1B1B1B;transition:border-color .18s;}
.lf input:focus{border-color:var(--green);}
.l-btn{width:100%;background:linear-gradient(135deg,var(--green),#1e5c3a);color:#fff;border:none;border-radius:12px;padding:14px;font-family:var(--fh);font-size:14px;font-weight:800;cursor:pointer;margin-top:6px;box-shadow:0 4px 16px rgba(45,106,79,.35);}
.l-btn:disabled{background:#C4C4C4;cursor:default;box-shadow:none;}
.l-err{background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:10px 13px;font-size:13px;color:#EF4444;margin-top:10px;font-family:var(--fb);}
.l-stats{display:flex;justify-content:center;gap:24px;margin-top:16px;}
.l-stat{text-align:center;}
.l-stat-v{font-family:var(--fh);font-size:16px;font-weight:800;color:var(--green);}
.l-stat-l{font-size:9px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:.4px;}
.l-note{font-size:11px;color:#6B7280;text-align:center;margin-top:12px;line-height:1.7;font-family:var(--fb);}
.pwa-banner{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);width:calc(var(--w) - 24px);background:var(--card);border-radius:16px;padding:13px 14px;box-shadow:0 8px 32px rgba(0,0,0,.22);z-index:500;display:flex;align-items:center;gap:11px;animation:slideUp .3s ease;border:1px solid var(--border);}
@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(18px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.pwa-icon{width:42px;height:42px;border-radius:11px;background:linear-gradient(135deg,#F9C74F,#F4845F);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}
.pwa-title{font-family:var(--fh);font-size:12px;font-weight:700;color:var(--dark);}
.pwa-sub{font-size:10px;color:var(--gray);margin-top:1px;font-family:var(--fb);}
.pwa-add{background:var(--green);color:#fff;border:none;border-radius:9px;padding:7px 13px;font-family:var(--fh);font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0;}
.pwa-x{background:none;border:none;color:var(--gray);font-size:17px;cursor:pointer;flex-shrink:0;padding:0;}
.modal-ov{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px;}
.modal{background:var(--card);border-radius:18px;padding:22px;width:100%;max-width:320px;animation:pi .18s ease;border:1px solid var(--border);}
@keyframes pi{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
.modal h3{font-family:var(--fh);font-size:17px;font-weight:800;margin-bottom:14px;color:var(--dark);}
.modal .mlabel{font-size:10px;font-weight:800;color:var(--gray);display:block;margin-bottom:4px;font-family:var(--fh);text-transform:uppercase;letter-spacing:.5px;}
.modal .minput,.modal .mselect{width:100%;border:1.5px solid var(--border);border-radius:9px;padding:9px 11px;font-size:13px;font-family:var(--fb);outline:none;margin-bottom:10px;color:var(--dark);background:var(--bg);}
.modal .minput:focus,.modal .mselect:focus{border-color:var(--green);}
.modal-desc{font-size:12px;color:var(--gray);line-height:1.75;margin-bottom:12px;font-family:var(--fb);}
.mbtns{display:flex;gap:8px;margin-top:2px;}
.mcancel{flex:1;background:var(--bg);border:none;border-radius:9px;padding:11px;font-family:var(--fh);font-size:12px;font-weight:700;cursor:pointer;color:var(--gray);}
.msave{flex:2;background:var(--green);border:none;border-radius:9px;padding:11px;font-family:var(--fh);font-size:12px;font-weight:700;cursor:pointer;color:#fff;}
.toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:var(--toast-bg);color:var(--toast-fg);padding:9px 18px;border-radius:22px;font-size:12px;font-weight:700;z-index:999;animation:ta 2.2s ease forwards;white-space:nowrap;max-width:88vw;text-align:center;font-family:var(--fh);box-shadow:0 4px 20px rgba(0,0,0,.2);}
@keyframes ta{0%{opacity:0;transform:translateX(-50%) translateY(8px)}15%{opacity:1;transform:translateX(-50%) translateY(0)}78%{opacity:1}100%{opacity:0}}
`;

/* ═══════════ MAIN APP ═══════════ */
export default function App(){
  const [splashDone,setSplashDone] = useState(false);
  const [authed,setAuthed]   = useState(()=>localStorage.getItem("rb_auth")==="1");
  const [phone,setPhone]     = useState("");
  const [pw,setPw]           = useState("");
  const [loginErr,setLoginErr] = useState("");
  const [loggingIn,setLoggingIn] = useState(false);
  const [dark,setDark]       = useState(()=>localStorage.getItem("rb_dark")==="1");
  const [tab,setTab]         = useState("home");
  const [restaurants,setRestaurants] = useState([]);
  const [bags,setBags]       = useState([]);
  const [loading,setLoading] = useState(true);

  /* ── filters (fully independent state variables) ── */
  const [search,setSearch]         = useState("");
  const [areaFilter,setAreaFilter] = useState("All");
  const [typeFilter,setTypeFilter] = useState("All");
  const [vegOnly,setVegOnly]       = useState(false);
  const [sortBy,setSortBy]         = useState("default");
  const [maxPrice,setMaxPrice]     = useState(500);
  const [chip4plus,setChip4plus]   = useState(false);
  const [chipGreat,setChipGreat]   = useState(false);

  const [openDD,setOpenDD]   = useState(null);
  const [ddPos,setDdPos]     = useState({top:0,left:0,width:210});
  const ddRef                = useRef(null);

  const [cart,setCart]             = useState([]);
  const [showCart,setShowCart]     = useState(false);
  const [selectedBag,setSelectedBag] = useState(null);
  const [selectedTime,setSelectedTime] = useState("");
  const [detailMode,setDetailMode] = useState("pickup");
  const [deliveryAddr,setDeliveryAddr] = useState("");
  const [orders,setOrders]         = useState([]);

  const [toast,setToast]       = useState(null);
  const [toastKey,setToastKey] = useState(0);
  const [modal,setModal]       = useState(null);
  const [profile,setProfile]   = useState({name:"Delhi Food Saver",email:"foodsaver@gmail.com"});
  const [profileEdit,setProfileEdit] = useState({name:"",email:""});
  const [vegBanner,setVegBanner] = useState(false);
  const [pwaBanner,setPwaBanner] = useState(false);
  const [deferredPrompt,setDeferredPrompt] = useState(null);
  const [showScrollTop,setShowScrollTop] = useState(false);
  const scrollRef = useRef(null);

  useEffect(()=>{localStorage.setItem("rb_auth",authed?"1":"0");},[authed]);
  useEffect(()=>{localStorage.setItem("rb_dark",dark?"1":"0");},[dark]);
  useEffect(()=>{
    const h=e=>{e.preventDefault();setDeferredPrompt(e);if(!sessionStorage.getItem("pwa-d"))setTimeout(()=>setPwaBanner(true),5000);};
    window.addEventListener("beforeinstallprompt",h);
    return()=>window.removeEventListener("beforeinstallprompt",h);
  },[]);
  useEffect(()=>{if(authed)fetchData();},[authed]);
  async function fetchData(){
    setLoading(true);
    const [{data:r},{data:b}]=await Promise.all([
      supabase.from("restaurants").select("*"),
      supabase.from("bags").select("*").eq("is_active",true),
    ]);
    setRestaurants(r||[]);setBags(b||[]);setLoading(false);
  }
  useEffect(()=>{
    const h=e=>{if(openDD&&ddRef.current&&!ddRef.current.contains(e.target))setOpenDD(null);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[openDD]);
  const handleScroll=useCallback(()=>{
    if(scrollRef.current)setShowScrollTop(scrollRef.current.scrollTop>300);
  },[]);

  function handleLogin(){
    setLoggingIn(true);setLoginErr("");
    setTimeout(()=>{
      if(phone.replace(/\D/g,"")==="9557349786"&&pw==="test123")setAuthed(true);
      else setLoginErr("Incorrect number or password.");
      setLoggingIn(false);
    },700);
  }

  const enriched=bags.map(b=>{
    const r=restaurants.find(r=>String(r.id)===String(b.restaurant_id))||{};
    return{...b,restaurantName:r.name||"Unknown",restaurantArea:r.area||"",restaurantCategory:r.category||"",restaurantRating:Number(r.rating)||4.0,restaurantImage:r.image_url||"",restaurantDesc:r.description||""};
  });

  /* ══════════════════════════════
     FILTERS — completely rebuilt
     Separate handler functions per filter
     so React state is always fresh.
  ══════════════════════════════ */
  const filtered=enriched.filter(b=>{
    const q=search.toLowerCase().trim();
    if(q){
      const hay=[b.restaurantName,b.restaurantArea,b.type||"",b.restaurantCategory].join(" ").toLowerCase();
      if(!hay.includes(q))return false;
    }
    // area: strict trim + equality
    if(areaFilter!=="All"&&(b.restaurantArea||"").trim()!==areaFilter.trim())return false;
    // type: strict trim + equality
    if(typeFilter!=="All"&&(b.type||"").trim()!==typeFilter.trim())return false;
    if(vegOnly&&!isVeg(b))return false;
    if(Number(b.price)>maxPrice)return false;
    if(chip4plus&&Number(b.restaurantRating)<4)return false;
    if(chipGreat&&getDisc(b)<=60)return false;
    return true;
  }).sort((a,b)=>{
    if(sortBy==="price_asc")return Number(a.price)-Number(b.price);
    if(sortBy==="price_desc")return Number(b.price)-Number(a.price);
    if(sortBy==="discount")return getDisc(b)-getDisc(a);
    if(sortBy==="rating")return Number(b.restaurantRating)-Number(a.restaurantRating);
    return 0;
  });

  const hasFilters=areaFilter!=="All"||typeFilter!=="All"||vegOnly||maxPrice<500||sortBy!=="default"||chip4plus||chipGreat||!!search.trim();

  function clearAll(){
    setSearch("");setAreaFilter("All");setTypeFilter("All");setVegOnly(false);
    setMaxPrice(500);setSortBy("default");setChip4plus(false);setChipGreat(false);setOpenDD(null);
  }

  function openDropdown(name,e){
    e.stopPropagation();
    const btn=e.currentTarget.getBoundingClientRect();
    const appEl=document.querySelector(".app");
    const ar=appEl?appEl.getBoundingClientRect():{left:0,width:430};
    const w=name==="price"?240:210;
    let l=btn.left-ar.left;
    if(l+w>ar.width-8)l=ar.width-w-8;
    if(l<4)l=4;
    setDdPos({top:btn.bottom+6,left:ar.left+l,width:w});
    setOpenDD(prev=>prev===name?null:name);
  }

  /* Separate select handlers so state updates are guaranteed before re-render */
  function selectArea(a){setAreaFilter(a);setOpenDD(null);}
  function selectType(t){setTypeFilter(t);setOpenDD(null);}
  function selectSort(s){setSortBy(s);setOpenDD(null);}

  function toggleVeg(){
    const next=!vegOnly;setVegOnly(next);
    if(next){setVegBanner(true);setTimeout(()=>setVegBanner(false),3000);}
    else setVegBanner(false);
  }

  const showToast=m=>{setToast(m);setToastKey(k=>k+1);setTimeout(()=>setToast(null),2200);};

  function addToCart(bag,mode,time,addr){
    if(!bag.quantity)return;
    setCart(p=>{
      if(p.find(i=>i.id===bag.id)){showToast("Already in bag!");return p;}
      return[...p,{...bag,mode,pickedTime:time||bag.pickup_start,deliveryAddr:addr||"",dishImage:getDishImage(bag)}];
    });
    showToast("🛍️ Added to bag!");
  }

  const removeFromCart=id=>setCart(p=>p.filter(i=>i.id!==id));
  const cartTotal=cart.reduce((s,i)=>s+Number(i.price),0);
  const cartSavings=cart.reduce((s,i)=>s+(Number(i.original_price)-Number(i.price)),0);
  const cartCO2=(cart.length*CO2_PER_BAG).toFixed(1);

  function handleCheckout(){
    if(!cart.length)return;
    setOrders(p=>[...cart.map(i=>({id:`RB${Math.floor(Math.random()*9000)+1000}`,name:i.restaurantName,emoji:EMOJI[i.type]||EMOJI.default,dishImage:i.dishImage,date:"Just now",mode:i.mode==="delivery"?"Delivery":"Pickup",deliveryAddr:i.deliveryAddr,price:Number(i.price),savings:Number(i.original_price)-Number(i.price),co2:CO2_PER_BAG})),...p]);
    showToast("🎉 Order placed!");setCart([]);setShowCart(false);
  }

  const tBags=orders.length;
  const tSavings=orders.reduce((s,o)=>s+o.savings,0);
  const tCO2=orders.reduce((s,o)=>s+o.co2,0).toFixed(1);
  const tSpent=orders.reduce((s,o)=>s+o.price,0);
  const areaCounts=AREAS.filter(a=>a!=="All").map(a=>({name:a,icon:AREA_ICONS[a]||"📍",count:enriched.filter(b=>b.restaurantArea===a).length}));
  const sortLabels={default:"Sort",price_asc:"Price ↑",price_desc:"Price ↓",discount:"Discount",rating:"Rating"};

  /* ── SPLASH ── */
  if(!splashDone)return(
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&family=Nunito:wght@600&display=swap');*{margin:0;padding:0;box-sizing:border-box;}`}</style>
      <SplashScreen onDone={()=>setSplashDone(true)}/>
    </>
  );

  /* ── LOGIN ── */
  if(!authed)return(<><style>{CSS}</style><ThemeVars dark={false}/>
    <div className="login-shell"><div className="login-card">
      <div className="l-logo"><div className="l-logo-icon">♻️</div><div className="l-logo-text">Re<span>Bite</span></div></div>
      <div className="l-h">Welcome back 👋</div>
      <div className="l-sub">Sign in to save food and money across Delhi</div>
      <div className="lf"><label>Mobile Number</label><input placeholder="9557349786" value={phone} onChange={e=>setPhone(e.target.value)} type="tel" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
      <div className="lf"><label>Password</label><input placeholder="••••••••" value={pw} onChange={e=>setPw(e.target.value)} type="password" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
      <button className="l-btn" onClick={handleLogin} disabled={loggingIn}>{loggingIn?"Signing in...":"Sign In →"}</button>
      {loginErr&&<div className="l-err">⚠️ {loginErr}</div>}
      <div className="l-stats">
        <div className="l-stat"><div className="l-stat-v">12K+</div><div className="l-stat-l">Users</div></div>
        <div className="l-stat"><div className="l-stat-v">500+</div><div className="l-stat-l">Partners</div></div>
        <div className="l-stat"><div className="l-stat-v">80%</div><div className="l-stat-l">You Save</div></div>
      </div>
      <div className="l-note">🌱 Joining 12,000+ Delhi residents saving food every night</div>
    </div></div>
  </>);

  /* ── MAIN APP ── */
  return(<><style>{CSS}</style><ThemeVars dark={dark}/>
  <div className="shell"><div className="app">

    <div className="sticky-top" ref={ddRef}>
      <div className="header">
        <div className="hrow">
          <div className="logo-wrap">
            <div className="logo-icon">♻️</div>
            <div className="logo-text">Re<span>Bite</span></div>
          </div>
          {/* Profile top-right (Zomato style), dark toggle, NO veg toggle */}
          <div className="hright">
            <button className={`dm-toggle ${dark?"on":""}`} onClick={()=>setDark(d=>!d)}>
              <div className="dm-knob">{dark?"🌙":"☀️"}</div>
            </button>
            <div className={`prof-avatar ${tab==="profile"?"active":""}`} onClick={()=>setTab("profile")}>🧑</div>
          </div>
        </div>
        <div className="hloc"><div className="loc-dot"/>New Delhi, Delhi</div>
        <div className="htitle">Save food, <span>save money 🌱</span></div>
      </div>

      <div className="ticker-wrap">
        <div className="ticker-track">
          {[...FACTS,...FACTS].map((f,i)=><span key={i} className="ticker-item">{f}</span>)}
        </div>
      </div>

      {vegBanner&&<div className="veg-banner">
        <span style={{fontSize:14}}>🌿</span>
        <span className="veg-banner-txt">Veg Mode on — showing vegetarian bags only</span>
        <button className="veg-banner-x" onClick={()=>setVegBanner(false)}>✕</button>
      </div>}

      {/* Search + Filters — HOME ONLY */}
      {tab==="home"&&<>
        <div className="sw">
          <div className="sb">
            <span style={{fontSize:13,color:"var(--gray)"}}>🔍</span>
            <input placeholder="Search restaurants, areas, cuisines..." value={search} onChange={e=>setSearch(e.target.value)}/>
            {search&&<span style={{cursor:"pointer",color:"var(--gray)",fontSize:13,flexShrink:0}} onClick={()=>setSearch("")}>✕</span>}
          </div>
        </div>

        <div className="filter-bar">
          <button className={`fpill ${areaFilter!=="All"?"on":""}`} onClick={e=>openDropdown("area",e)}>
            📍 {areaFilter==="All"?"Area":areaFilter} ▾
          </button>
          <div className="fdiv"/>
          <button className={`fpill ${typeFilter!=="All"?"on":""}`} onClick={e=>openDropdown("type",e)}>
            🍽 {typeFilter==="All"?"Type":typeFilter} ▾
          </button>
          <div className="fdiv"/>
          <button className={`fpill ${sortBy!=="default"?"on":""}`} onClick={e=>openDropdown("sort",e)}>
            ⇅ {sortLabels[sortBy]} ▾
          </button>
          <div className="fdiv"/>
          <button className={`fpill ${maxPrice<500?"on":""}`} onClick={e=>openDropdown("price",e)}>
            💰 {maxPrice<500?`≤₹${maxPrice}`:"Price"} ▾
          </button>
        </div>

        <div className="qchips">
          <button className={`qchip star ${chip4plus?"on":""}`} onClick={()=>setChip4plus(v=>!v)}>⭐ 4+ Rating</button>
          <button className={`qchip deal ${chipGreat?"on":""}`} onClick={()=>setChipGreat(v=>!v)}>🔥 Great Offers</button>
          <button className={`qchip veg-q ${vegOnly?"on":""}`} onClick={toggleVeg}>🌿 Veg Only</button>
          {AREAS.filter(a=>a!=="All").map(a=>(
            <button key={a} className={`qchip ${areaFilter===a?"on":""}`} onClick={()=>setAreaFilter(v=>v===a?"All":a)}>
              {AREA_ICONS[a]} {a}
            </button>
          ))}
          <button className={`qchip ${sortBy==="discount"?"on":""}`}
            style={sortBy==="discount"?{borderColor:"#7C3AED",background:"#7C3AED",color:"#fff"}:{}}
            onClick={()=>setSortBy(v=>v==="discount"?"default":"discount")}>
            💸 Best Deal
          </button>
        </div>

        <div className="results-row">
          <span className="results-count">{loading?"Loading...":`${filtered.length} bags available`}</span>
          {hasFilters&&<span className="clear-all" onClick={clearAll}>Clear all ✕</span>}
        </div>
      </>}
    </div>

    {/* DROPDOWN */}
    {openDD&&(
      <div className="dropdown" style={{top:ddPos.top,left:ddPos.left,width:ddPos.width}} onClick={e=>e.stopPropagation()}>
        {openDD==="area"&&<>
          <div className="dd-hd">Select Area</div>
          {AREAS.map(a=>(
            <div key={a} className={`dd-opt ${areaFilter===a?"on":""}`} onClick={()=>selectArea(a)}>
              <span>{a==="All"?"🗺 All Areas":`${AREA_ICONS[a]||"📍"} ${a}`}</span>
              <div className="chk">{areaFilter===a?"✓":""}</div>
            </div>
          ))}
        </>}
        {openDD==="type"&&<>
          <div className="dd-hd">Bag Type</div>
          {TYPES.map(t=>(
            <div key={t} className={`dd-opt ${typeFilter===t?"on":""}`} onClick={()=>selectType(t)}>
              <span>{t==="All"?"🛍 All Types":`${EMOJI[t]||""} ${t}`}</span>
              <div className="chk">{typeFilter===t?"✓":""}</div>
            </div>
          ))}
        </>}
        {openDD==="sort"&&<>
          <div className="dd-hd">Sort By</div>
          {[["default","✨ Recommended"],["price_asc","Price: Low to High"],["price_desc","Price: High to Low"],["discount","Biggest Discount 🔥"],["rating","Highest Rated ⭐"]].map(([v,l])=>(
            <div key={v} className={`dd-opt ${sortBy===v?"on":""}`} onClick={()=>selectSort(v)}>
              <span>{l}</span><div className="chk">{sortBy===v?"✓":""}</div>
            </div>
          ))}
        </>}
        {openDD==="price"&&<>
          <div className="dd-hd">Max Price</div>
          <div className="range-wrap">
            <div className="range-lbls"><span>₹50</span><span className="range-val">₹{maxPrice}</span><span>₹500</span></div>
            <input type="range" min={50} max={500} step={25} value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value))}/>
          </div>
          <div className="dd-footer"><button className="dd-clr" onClick={()=>{setMaxPrice(500);setOpenDD(null);}}>Reset to ₹500</button></div>
        </>}
      </div>
    )}

    <div className="scroll-body" ref={scrollRef} onScroll={handleScroll} onClick={()=>openDD&&setOpenDD(null)}>

      {/* HOME */}
      {tab==="home"&&<>
        <div className="urgency">
          <span style={{fontSize:20}}>⏰</span>
          <div><strong>Bags filling fast tonight!</strong><span>Pickup 6 PM – 9 PM · Across Delhi</span></div>
        </div>

        {/* Investor stats band */}
        <div className="stats-band">
          <div className="stats-band-inner">
            <div className="sb-item"><div className="sb-val">12K+</div><div className="sb-lbl">Users</div></div>
            <div className="sb-item"><div className="sb-val">4.2T</div><div className="sb-lbl">CO2 Saved</div></div>
            <div className="sb-item"><div className="sb-val">₹2Cr+</div><div className="sb-lbl">Food Saved</div></div>
          </div>
        </div>

        {cart.length>0&&<div className="impact-bar">
          <div className="ib-item"><div className="ib-val">₹{cartSavings}</div><div className="ib-lbl">Saved</div></div>
          <div className="ib-div"/>
          <div className="ib-item"><div className="ib-val">{cartCO2}kg</div><div className="ib-lbl">CO2</div></div>
          <div className="ib-div"/>
          <div className="ib-item"><div className="ib-val">{cart.length}</div><div className="ib-lbl">In Bag</div></div>
        </div>}

        {loading
          ?<div className="loading"><span className="spin">🌿</span><div className="loading-txt">Loading today's bags...</div></div>
          :filtered.length===0
            ?<div className="empty">
                <div className="big">😔</div>
                <p>No bags match your filters</p>
                <span style={{fontSize:12,fontFamily:"Nunito",color:"var(--gray)"}}>Try relaxing your filters</span>
                {hasFilters&&<div onClick={clearAll} style={{marginTop:12,color:"var(--green)",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"Plus Jakarta Sans"}}>Clear all filters →</div>}
              </div>
            :<>
              <div className="sec-hd">
                <span className="sec-title">Tonight's Bags 🛍️</span>
                <span className="sec-link" onClick={clearAll}>See all</span>
              </div>
              <div className="grid">
                {filtered.map(bag=>{
                  const d=getDisc(bag),veg=isVeg(bag);
                  return(
                    <div key={bag.id} className="card"
                      onClick={()=>{setSelectedBag(bag);setDetailMode("pickup");setSelectedTime(bag.pickup_start||"18:00");setDeliveryAddr("");}}
                    >
                      <CardSlider bag={bag} disc={d} veg={veg}/>
                      <div className="cbody">
                        <div className="ctop">
                          <div className="cname">{bag.restaurantName}</div>
                          <div className="crating">★ {bag.restaurantRating}</div>
                        </div>
                        <div className="ccat">{bag.restaurantArea} · {bag.type}</div>
                        <div className="cbot">
                          <div>
                            <div className="price-row">
                              <span className="price-new">₹{bag.price}</span>
                              <span className="price-old">₹{bag.original_price}</span>
                              {d>0&&<span className="price-save-tag">{d}% off</span>}
                            </div>
                            <div className="cmeta">
                              <span>🕐 {bag.pickup_start}</span>
                              {bag.quantity>0&&<span className="qty">{bag.quantity} left</span>}
                            </div>
                          </div>
                          <button className="add-btn" disabled={!bag.quantity}
                            onClick={e=>{e.stopPropagation();addToCart(bag,"pickup",bag.pickup_start,"");}}
                          >+</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
        }
        <div style={{height:12}}/>
      </>}

      {/* EXPLORE */}
      {tab==="explore"&&<div className="page">
        <div className="ptitle">Explore Delhi 🗺️</div>
        <div className="psub">Tap an area to browse bags</div>
        <div className="map-wrap"><LeafletMap bags={enriched}/></div>
        <p style={{fontFamily:"Plus Jakarta Sans",fontSize:10,fontWeight:800,color:"var(--gray)",letterSpacing:.9,textTransform:"uppercase",marginBottom:9}}>Areas</p>
        <div className="area-list">
          {areaCounts.map(a=>(
            <div key={a.name} className="acard" onClick={()=>{setAreaFilter(a.name);setTab("home");}}>
              <div className="aicon">{a.icon}</div>
              <div style={{flex:1}}><div className="aname">{a.name}</div><div className="acount">{a.count} bags tonight</div></div>
              <div style={{color:"var(--gray)",fontSize:16}}>›</div>
            </div>
          ))}
        </div>
      </div>}

      {/* ORDERS */}
      {tab==="orders"&&<div className="page">
        <div className="ptitle">Your Orders 📦</div>
        <div className="psub">Your ReBite history</div>
        {orders.length===0
          ?<div className="empty"><div className="big">📦</div><p>No orders yet</p><span style={{fontSize:12,fontFamily:"Nunito"}}>Reserve a bag to get started!</span></div>
          :orders.map(o=>(
            <div key={o.id} className="ocard">
              <div className="otop">
                <div style={{display:"flex",alignItems:"center",gap:9}}>
                  {o.dishImage?<img src={o.dishImage} style={{width:36,height:36,borderRadius:8,objectFit:"cover"}} alt=""/>:<span style={{fontSize:22}}>{o.emoji}</span>}
                  <div className="oname">{o.name}</div>
                </div>
                <div className="ostatus">✅ Done</div>
              </div>
              <div className="ometa">{o.date} · {o.mode}{o.deliveryAddr?" → "+o.deliveryAddr:""} · #{o.id}</div>
              <div className="odiv"/>
              <div className="obot">
                <div><span className="oprice">₹{o.price}</span><span style={{fontSize:10,color:"#16A34A",fontWeight:700,marginLeft:7,fontFamily:"Plus Jakarta Sans"}}>saved ₹{o.savings}</span></div>
                <button className="rero" onClick={()=>showToast("🔄 Added!")}>Reorder</button>
              </div>
            </div>
          ))
        }
      </div>}

      {/* PROFILE (full page, accessed via avatar) */}
      {tab==="profile"&&<div className="page">
        <div className="ptitle">My Profile 👤</div>
        <div className="phero">
          <div className="pav">🧑</div>
          <div><div className="pn">{profile.name}</div><div className="pe">{profile.email}</div><div className="ps">🌱 Member since Feb 2026</div></div>
        </div>
        <div className="srow">
          <div className="sc"><div className="sv">{tBags}</div><div className="sl">Bags</div></div>
          <div className="sc"><div className="sv">₹{tSavings}</div><div className="sl">Saved</div></div>
          <div className="sc"><div className="sv">{tCO2}kg</div><div className="sl">CO2</div></div>
          <div className="sc"><div className="sv">₹{tSpent}</div><div className="sl">Spent</div></div>
        </div>
        <p className="msect">Account</p>
        <div className="mlist">
          {[["👤","Edit Profile","editProfile"],["📍","Saved Addresses","address"],["💳","Payment Methods","payment"],["🔔","Notifications","notifications"]].map(([ic,lb,md])=>(
            <div key={lb} className="mitem" onClick={()=>{setProfileEdit({name:profile.name,email:profile.email});setModal({type:md});}}>
              <div className="mico">{ic}</div><div className="mlbl">{lb}</div><div className="marr">›</div>
            </div>
          ))}
        </div>
        <p className="msect">More</p>
        <div className="mlist">
          {[["❓","Help & Support","help"],["📄","Terms & Privacy","terms"],["⭐","Rate the App",null],["🤝","Partner with ReBite","partner"]].map(([ic,lb,md])=>(
            <div key={lb} className="mitem" onClick={()=>md?setModal({type:md}):showToast("⭐ Thanks for rating!")}>
              <div className="mico">{ic}</div><div className="mlbl">{lb}</div><div className="marr">›</div>
            </div>
          ))}
        </div>
        <button className="lo-btn" onClick={()=>{setAuthed(false);setPhone("");setPw("");}}>Log Out</button>
      </div>}

    </div>

    {showScrollTop&&(
      <button className="scroll-top" onClick={()=>scrollRef.current?.scrollTo({top:0,behavior:"smooth"})}>↑</button>
    )}

    {cart.length>0&&<div className="fab">
      <button className="fab-btn" onClick={()=>setShowCart(true)}>
        <span className="fab-badge">{cart.length}</span>
        <span>View Bag · ₹{cartTotal}</span>
      </button>
    </div>}

    {/* Bottom nav — 3 items, profile moved to top-right avatar */}
    <div className="bnav">
      {[{id:"home",icon:"🏠",label:"Home"},{id:"explore",icon:"🗺️",label:"Explore"},{id:"orders",icon:"📦",label:"Orders"}].map(n=>(
        <div key={n.id} className={`nitem ${tab===n.id?"on":""}`} onClick={()=>setTab(n.id)}>
          <span className="nicon">{n.icon}</span>{n.label}
        </div>
      ))}
    </div>

    {/* CART */}
    {showCart&&<><div className="overlay" onClick={()=>setShowCart(false)}/>
      <div className="drawer">
        <div className="dhandle"/>
        <div className="dtitle">Your Bag 🛍️</div>
        {cart.length===0
          ?<div className="empty"><div className="big">🛍️</div><p>Empty bag</p></div>
          :<>
            {cart.map(i=>(
              <div key={i.id} className="ci">
                {i.dishImage?<img className="ci-img" src={i.dishImage} alt=""/>:<div className="ci-em">{EMOJI[i.type]||EMOJI.default}</div>}
                <div className="ci-info">
                  <div className="ci-name">{i.restaurantName}</div>
                  <div className="ci-price">₹{i.price} <span style={{color:"var(--gray)",fontSize:10,textDecoration:"line-through"}}>₹{i.original_price}</span></div>
                  <div className="ci-meta">{i.mode==="delivery"?"🛵 Delivery":"🏃 Pickup"} · {i.pickedTime} · {i.type}{i.deliveryAddr?" · "+i.deliveryAddr:""}</div>
                </div>
                <button className="rm-btn" onClick={()=>removeFromCart(i.id)}>✕</button>
              </div>
            ))}
            <div style={{background:"var(--gp)",borderRadius:12,padding:"10px 14px",margin:"12px 0 6px",display:"flex"}}>
              <div style={{flex:1,textAlign:"center"}}><div style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:15,color:"var(--green)"}}>₹{cartSavings}</div><div style={{fontSize:9,color:"#52B788",fontWeight:700,textTransform:"uppercase",letterSpacing:.4,fontFamily:"Plus Jakarta Sans"}}>Saved</div></div>
              <div style={{width:1,background:"rgba(45,106,79,.2)"}}/>
              <div style={{flex:1,textAlign:"center"}}><div style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:15,color:"var(--green)"}}>{cartCO2}kg</div><div style={{fontSize:9,color:"#52B788",fontWeight:700,textTransform:"uppercase",letterSpacing:.4,fontFamily:"Plus Jakarta Sans"}}>CO2 saved</div></div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"7px 0 4px"}}>
              <span style={{color:"var(--gray)",fontSize:13,fontFamily:"Nunito"}}>Total</span>
              <span style={{fontFamily:"Plus Jakarta Sans",fontWeight:800,fontSize:21,color:"var(--dark)"}}>₹{cartTotal}</span>
            </div>
            <button className="co-btn" onClick={handleCheckout}>Proceed to Pay · ₹{cartTotal}</button>
          </>
        }
      </div>
    </>}

    {/* DETAIL */}
    {selectedBag&&(()=>{
      const di=getDishImage(selectedBag),d=getDisc(selectedBag),slots=genSlots(selectedBag.pickup_start,selectedBag.pickup_end),hero=BAG_HERO[selectedBag.type]||BAG_HERO.Meal,veg=isVeg(selectedBag),restImg=getRestImage(selectedBag);
      return(
        <div className="detail">
          <div className="dimg">
            <img src={di} alt={selectedBag.type}/>
            <div className="dimg-ov"/>
            <button className="back-btn" onClick={()=>setSelectedBag(null)}>←</button>
            <div style={{position:"absolute",top:14,right:14,zIndex:2,background:"#fff",borderRadius:4,border:`2px solid ${veg?"#22C55E":"#EF4444"}`,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:9,height:9,borderRadius:"50%",background:veg?"#22C55E":"#EF4444"}}/>
            </div>
          </div>
          <div className="rest-strip">
            <img className="rest-strip-img" src={restImg} alt={selectedBag.restaurantName} onError={e=>{e.target.style.display="none";}}/>
            <div><div className="rest-name">{selectedBag.restaurantName}</div><div className="rest-meta">{selectedBag.restaurantCategory} · {selectedBag.restaurantArea} · ⭐ {selectedBag.restaurantRating}<br/>{(selectedBag.restaurantDesc||"").slice(0,70)}{(selectedBag.restaurantDesc||"").length>70?"...":""}</div></div>
          </div>
          <div className="dbody">
            <div className="dname">{selectedBag.type} Surprise Bag</div>
            <div className="dcat">
              {veg?<span style={{color:"#16A34A",fontWeight:700}}>🌿 Pure Veg</span>:<span style={{color:"#EF4444",fontWeight:700}}>🍗 Non-Veg</span>}
              <span>·</span><span>{d}% off · saves ₹{Number(selectedBag.original_price)-Number(selectedBag.price)}</span>
            </div>
            <div className="mode-tog">
              <button className={`mbtn ${detailMode==="pickup"?"on":""}`} onClick={()=>setDetailMode("pickup")}>🏃 Pickup</button>
              <button className={`mbtn ${detailMode==="delivery"?"on":""}`} onClick={()=>setDetailMode("delivery")}>🛵 Delivery +₹20</button>
            </div>
            {detailMode==="delivery"&&<div className="addr-wrap">
              <span className="addr-label">📍 Delivery Address</span>
              <textarea className="addr-input" rows={2} placeholder="e.g. 42 Defence Colony, near main market, New Delhi 110024..." value={deliveryAddr} onChange={e=>setDeliveryAddr(e.target.value)}/>
              <div className="addr-shortcuts">
                {["🏠 Home","🏢 Work","📍 Other"].map(s=>(
                  <button key={s} className="addr-chip" onClick={()=>setDeliveryAddr(v=>v||s.split(" ")[1]+" — ")}>{s}</button>
                ))}
              </div>
            </div>}
            <div className="ichips">
              <div className="ichip"><div className="ico">📦</div><div className="ilabel">Left</div><div className="ival">{selectedBag.quantity||"None"}</div></div>
              <div className="ichip"><div className="ico">💰</div><div className="ilabel">Saving</div><div className="ival">{d}%</div></div>
              <div className="ichip"><div className="ico">🌱</div><div className="ilabel">CO2</div><div className="ival">{CO2_PER_BAG}kg</div></div>
            </div>
            <div className="dsect">What's inside 🎁</div>
            <div className="bag-contents">
              <div className="bag-item"><img className="bag-item-img" src={hero.img} alt={hero.name} loading="lazy"/><div><div className="bag-item-name">{hero.name}</div><div className="bag-item-sub">{hero.sub}</div></div></div>
              <div className="bag-item"><div style={{width:50,height:50,borderRadius:10,background:"var(--gp)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🎲</div><div><div className="bag-item-name">Surprise Extra</div><div className="bag-item-sub">A little extra from the kitchen — changes daily</div></div></div>
            </div>
            <div className="time-wrap">
              <span className="time-label">🕐 Select pickup time</span>
              <select className="time-sel" value={selectedTime} onChange={e=>setSelectedTime(e.target.value)}>
                {slots.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="dsect">How it works</div>
            <div className="ddesc">{detailMode==="pickup"?"1. Reserve your bag\n2. Show order at counter\n3. Collect at selected time\n4. Enjoy! 🌱":"1. Reserve your bag\n2. Add delivery address above\n3. Delivery partner picks up\n4. Arrives in 30-45 mins · Enjoy! 🌱"}</div>
          </div>
          <div className="dfooter">
            <div className="dprice">
              <div className="old">₹{selectedBag.original_price}</div>
              <div className="new">₹{detailMode==="delivery"?Number(selectedBag.price)+20:selectedBag.price}</div>
            </div>
            <button className="dadd-btn"
              disabled={!selectedBag.quantity||(detailMode==="delivery"&&!deliveryAddr.trim())}
              style={(!selectedBag.quantity||(detailMode==="delivery"&&!deliveryAddr.trim()))?{background:"var(--border)",color:"var(--gray)",cursor:"default",boxShadow:"none",transform:"none"}:{}}
              onClick={()=>{addToCart(selectedBag,detailMode,selectedTime,deliveryAddr);setSelectedBag(null);}}
            >
              {!selectedBag.quantity?"Sold Out":detailMode==="delivery"&&!deliveryAddr.trim()?"Enter address above 📍":detailMode==="delivery"?"Reserve · Delivery 🛵":`Reserve · ${selectedTime} 🏃`}
            </button>
          </div>
        </div>
      );
    })()}

    {pwaBanner&&<div className="pwa-banner">
      <div className="pwa-icon">♻️</div>
      <div style={{flex:1}}><div className="pwa-title">Add ReBite to Home Screen</div><div className="pwa-sub">Quick access · feels native · works offline</div></div>
      <button className="pwa-add" onClick={()=>{if(deferredPrompt){deferredPrompt.prompt();deferredPrompt.userChoice.then(()=>{setDeferredPrompt(null);setPwaBanner(false);});}else{setPwaBanner(false);showToast("Tap Share → Add to Home Screen");}}}>Add</button>
      <button className="pwa-x" onClick={()=>{setPwaBanner(false);sessionStorage.setItem("pwa-d","1");}}>✕</button>
    </div>}

    {modal&&<div className="modal-ov" onClick={()=>setModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
      {modal.type==="editProfile"&&<><h3>✏️ Edit Profile</h3><label className="mlabel">Name</label><input className="minput" value={profileEdit.name} onChange={e=>setProfileEdit(p=>({...p,name:e.target.value}))} placeholder="Your name"/><label className="mlabel">Email</label><input className="minput" value={profileEdit.email} onChange={e=>setProfileEdit(p=>({...p,email:e.target.value}))} placeholder="Email"/><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setProfile({name:profileEdit.name||profile.name,email:profileEdit.email||profile.email});setModal(null);showToast("✅ Saved!");}}>Save</button></div></>}
      {modal.type==="address"&&<><h3>📍 Saved Addresses</h3><label className="mlabel">Home</label><input className="minput" placeholder="e.g. 42, Defence Colony"/><label className="mlabel">Work</label><input className="minput" placeholder="e.g. Cyber Hub, Gurugram"/><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setModal(null);showToast("✅ Saved!");}}>Save</button></div></>}
      {modal.type==="payment"&&<><h3>💳 Payment Methods</h3><label className="mlabel">UPI ID</label><input className="minput" placeholder="yourname@upi"/><label className="mlabel">Preferred</label><select className="mselect"><option>UPI</option><option>Card</option><option>Net Banking</option><option>Cash on Pickup</option></select><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setModal(null);showToast("✅ Updated!");}}>Save</button></div></>}
      {modal.type==="notifications"&&<><h3>🔔 Notifications</h3><label className="mlabel">Email</label><select className="mselect"><option>All</option><option>Orders only</option><option>Off</option></select><label className="mlabel">Push</label><select className="mselect"><option>Enabled</option><option>Disabled</option></select><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setModal(null);showToast("✅ Saved!");}}>Save</button></div></>}
      {modal.type==="help"&&<><h3>❓ Help & Support</h3><p className="modal-desc">Having an issue? We'll get back to you within 24 hours.</p><label className="mlabel">Message</label><input className="minput" placeholder="Describe your issue..."/><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setModal(null);showToast("✅ Sent!");}}>Send</button></div></>}
      {modal.type==="terms"&&<><h3>📄 Terms & Privacy</h3><p className="modal-desc">By using ReBite you agree to our Terms of Service and Privacy Policy. We collect minimal data and never sell it to third parties.</p><div className="mbtns"><button className="msave" style={{flex:1}} onClick={()=>setModal(null)}>Got it</button></div></>}
      {modal.type==="partner"&&<><h3>🤝 Partner with ReBite</h3><p className="modal-desc">Restaurant, cafe or bakery? Start listing your surplus bags!</p><label className="mlabel">Restaurant name</label><input className="minput" placeholder="e.g. My Cafe, CP"/><label className="mlabel">Phone</label><input className="minput" placeholder="+91 XXXXX XXXXX" type="tel"/><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setModal(null);showToast("🎉 We'll be in touch!");}}>Submit</button></div></>}
    </div></div>}

    {toast&&<div key={toastKey} className="toast">{toast}</div>}

  </div></div></>);
}