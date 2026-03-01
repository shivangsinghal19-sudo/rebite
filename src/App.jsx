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

/* ─── images ─── */
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
  Dessert:{name:"Dessert Surprise Box",sub:"Cakes · mithais · 2–3 pieces",img:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&q=80"},
  Cafe:{name:"Café Combo",sub:"Beverage + snack of the day",img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&q=80"},
  "Fine Dining":{name:"Chef's Tasting Portion",sub:"Starter + main course",img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&q=80"},
  Buffet:{name:"Buffet Selection Box",sub:"5–7 items from the chef",img:"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&q=80"},
};
const FACTS = [
  "🌍  1/3 of all food produced globally is wasted every year",
  "🌱  Saving one bag prevents ~1.2 kg of CO₂",
  "💧  A single burger takes 2,400 litres of water to produce",
  "🇮🇳  India wastes ₹92,000 crore worth of food annually",
  "♻️  Food waste in landfills produces methane — 25× worse than CO₂",
  "🥗  A ReBite bag saves up to 80% vs menu price",
  "🌾  40% of India's fruits & vegetables are lost post-harvest",
  "🏙️  Delhi restaurants discard thousands of meals every night",
  "🤝  Each bag you save helps a restaurant stay sustainable",
  "⚡  Food production uses 70% of all fresh water on Earth",
];

const getDishImage = bag => { const p=DISH_IMAGES[bag.type]||DISH_IMAGES.Meal; return p[(bag.id||"").charCodeAt(0)%p.length||0]; };
const getRestImage = bag => bag.restaurantImage || REST_FALLBACK[(bag.id||"").charCodeAt(1)%REST_FALLBACK.length||0];
const genSlots = (s,e) => { const sl=[], [sh]=s.split(":").map(Number), [eh]=e.split(":").map(Number); for(let h=sh;h<=eh;h++)sl.push(`${String(h).padStart(2,"0")}:00`); return sl; };

/* ══════════════════════════════════════════
   STATIC CSS  — zero JS interpolation (Vite-safe)
══════════════════════════════════════════ */
const STATIC_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
:root{--green:#2D6A4F;--gl:#52B788;--orange:#E23744;--orange2:#F4845F;--yellow:#F9C74F;--w:430px;}
html,body{height:100%;}
body{font-family:'DM Sans',sans-serif;color:var(--dark);-webkit-font-smoothing:antialiased;}
.shell{width:100vw;height:100vh;display:flex;justify-content:center;overflow:hidden;}
.app{width:var(--w);height:100vh;background:var(--bg);display:flex;flex-direction:column;box-shadow:0 0 60px rgba(0,0,0,.25);overflow:hidden;position:relative;}
@media(max-width:460px){:root{--w:100vw;}.shell,.app{height:100dvh;}.app{box-shadow:none;}.bnav,.fab,.drawer,.pwa-banner{width:100vw!important;left:0!important;transform:none!important;}}
/* HEADER */
.sticky-top{flex-shrink:0;z-index:60;}
.header{background:var(--green);padding:12px 16px 12px;overflow:hidden;position:relative;}
.header::before{content:'';position:absolute;width:140px;height:140px;background:var(--gl);border-radius:50%;top:-50px;right:-30px;opacity:.2;pointer-events:none;}
.hrow{display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;}
.logo-wrap{display:flex;align-items:center;gap:8px;}
.logo-icon{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#F9C74F,#F4845F);display:flex;align-items:center;justify-content:center;font-size:15px;}
.logo-text{font-family:'Inter',sans-serif;font-size:20px;font-weight:700;color:#fff;letter-spacing:-.3px;}
.logo-text span{color:#95D5B2;}
.hright{display:flex;align-items:center;gap:10px;}
/* VEG PILL */
.veg-pill{display:flex;align-items:center;gap:4px;border-radius:20px;padding:4px 10px;cursor:pointer;border:1.5px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);transition:all .2s;}
.veg-pill.on{background:rgba(255,255,255,.9);border-color:#fff;}
.veg-box{width:12px;height:12px;border-radius:3px;border:2px solid #22C55E;display:flex;align-items:center;justify-content:center;transition:background .2s;}
.veg-pill.on .veg-box{background:#22C55E;}
.veg-check{color:#fff;font-size:8px;font-weight:900;}
.veg-txt{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;color:rgba(255,255,255,.9);letter-spacing:.3px;}
.veg-pill.on .veg-txt{color:#15803D;}
/* DARK TOGGLE */
.dm-wrap{display:flex;flex-direction:column;align-items:center;gap:1px;}
.dm-toggle{width:34px;height:19px;border-radius:10px;background:rgba(255,255,255,.18);position:relative;cursor:pointer;border:none;transition:background .2s;}
.dm-toggle.on{background:rgba(255,255,255,.28);}
.dm-knob{position:absolute;top:2.5px;left:2.5px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .2s;font-size:8px;display:flex;align-items:center;justify-content:center;}
.dm-toggle.on .dm-knob{transform:translateX(15px);}
.dm-lbl{font-size:8px;color:rgba(255,255,255,.6);font-family:'Inter',sans-serif;font-weight:600;}
.loc{display:flex;align-items:center;gap:5px;color:rgba(255,255,255,.75);font-size:11px;margin-bottom:2px;}
.loc-dot{width:5px;height:5px;background:var(--yellow);border-radius:50%;}
.htitle{font-family:'Inter',sans-serif;font-size:14px;font-weight:600;color:rgba(255,255,255,.9);}
.htitle span{color:#95D5B2;font-weight:700;}
/* VEG BANNER */
.veg-banner{background:linear-gradient(90deg,#16A34A,#15803D);padding:6px 14px;display:flex;align-items:center;gap:8px;animation:slideDown .2s ease;}
@keyframes slideDown{from{opacity:0;max-height:0;padding:0 14px}to{opacity:1;max-height:40px;}}
.veg-banner-txt{font-family:'Inter',sans-serif;font-size:11px;font-weight:600;color:#fff;flex:1;}
.veg-banner-x{background:none;border:none;color:rgba(255,255,255,.7);font-size:16px;cursor:pointer;line-height:1;padding:0;}
/* FACTS TICKER */
.ticker-wrap{background:#235740;border-top:1px solid rgba(255,255,255,.1);padding:4px 0;overflow:hidden;}
.ticker-track{display:flex;animation:tickScroll 45s linear infinite;width:max-content;}
.ticker-track:hover{animation-play-state:paused;}
.ticker-item{white-space:nowrap;font-size:10px;font-family:'DM Sans',sans-serif;color:rgba(255,255,255,.85);padding:0 32px;letter-spacing:.1px;}
@keyframes tickScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
/* SEARCH */
.sw{padding:8px 12px 0;background:var(--bg);}
.sb{background:var(--sbg);border-radius:10px;display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid var(--border);transition:border-color .2s;}
.sb:focus-within{border-color:var(--green);}
.sb input{border:none;outline:none;flex:1;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--dark);background:transparent;}
.sb input::placeholder{color:var(--gray);font-size:13px;}
/* FILTER PILLS ROW */
.filter-bar{display:flex;align-items:center;gap:6px;padding:6px 12px 4px;overflow-x:auto;scrollbar-width:none;background:var(--bg);}
.filter-bar::-webkit-scrollbar{display:none;}
.fpill{display:inline-flex;align-items:center;gap:3px;padding:5px 10px;border-radius:20px;border:1px solid var(--border);background:var(--card);font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .18s;color:var(--gray);flex-shrink:0;}
.fpill.on{background:var(--green);color:#fff;border-color:var(--green);}
.fpill svg{width:10px;height:10px;opacity:.7;}
.fdiv{width:1px;height:16px;background:var(--border);flex-shrink:0;}
/* QUICK CHIPS */
.qchips{display:flex;align-items:center;gap:5px;padding:2px 12px 6px;overflow-x:auto;scrollbar-width:none;background:var(--bg);}
.qchips::-webkit-scrollbar{display:none;}
.qchip{display:inline-flex;align-items:center;gap:3px;padding:5px 10px;border-radius:20px;border:1px solid var(--border);background:var(--card);font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .18s;color:var(--dark);flex-shrink:0;}
.qchip.on{border-color:var(--orange);background:var(--orange);color:#fff;}
/* RESULTS ROW */
.results-row{display:flex;align-items:center;justify-content:space-between;padding:1px 12px 3px;}
.results-count{font-family:'Inter',sans-serif;font-size:11px;font-weight:500;color:var(--gray);}
.clear-all{font-size:11px;color:var(--orange);font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;}
/* DROPDOWN */
.dropdown{position:fixed;background:var(--card);border-radius:14px;box-shadow:0 6px 30px rgba(0,0,0,.2);z-index:9999;overflow:hidden;animation:ddIn .15s ease;border:1px solid var(--border);}
@keyframes ddIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
.dd-hd{padding:9px 14px 6px;font-family:'Inter',sans-serif;font-size:10px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.7px;border-bottom:1px solid var(--border);}
.dd-opt{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;cursor:pointer;transition:background .12s;font-size:13px;color:var(--dark);font-family:'DM Sans',sans-serif;}
.dd-opt:hover{background:var(--sh);}
.dd-opt.on{color:var(--green);font-weight:600;}
.chk{width:17px;height:17px;border-radius:50%;border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;color:transparent;}
.dd-opt.on .chk{background:var(--green);border-color:var(--green);color:#fff;}
.dd-footer{padding:6px 14px 8px;border-top:1px solid var(--border);}
.dd-clr{background:none;border:none;color:var(--gray);font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;}
.range-wrap{padding:8px 14px 12px;}
.range-lbls{display:flex;justify-content:space-between;font-size:11px;color:var(--gray);margin-bottom:6px;font-family:'DM Sans',sans-serif;font-weight:600;}
.range-val{color:var(--green);font-size:13px;font-weight:700;}
input[type=range]{width:100%;accent-color:var(--green);cursor:pointer;}
/* SCROLL BODY */
.scroll-body{flex:1;overflow-y:auto;padding-bottom:130px;-webkit-overflow-scrolling:touch;}
/* URGENCY BAR */
.urgency{margin:8px 12px 6px;background:linear-gradient(135deg,#F4845F,#E85D3A);border-radius:12px;padding:9px 12px;display:flex;align-items:center;gap:9px;color:#fff;}
.urgency strong{display:block;font-family:'Inter',sans-serif;font-size:12px;font-weight:700;}
.urgency span{font-size:10px;opacity:.9;}
/* CART MINI BAR */
.mbar{margin:0 12px 8px;background:var(--gp);border-radius:12px;padding:8px 12px;display:flex;align-items:center;gap:6px;}
.mi2{display:flex;align-items:center;gap:5px;flex:1;}
.mi2-ico{font-size:13px;}
.mi2-t{font-size:10px;color:var(--green);font-weight:500;line-height:1.2;}
.mi2-t strong{display:block;font-family:'Inter',sans-serif;font-size:13px;font-weight:700;}
.mdiv{width:1px;height:22px;background:var(--mdiv-c);flex-shrink:0;}
/* CARDS GRID */
.loading{text-align:center;padding:40px;}
.spin{font-size:32px;animation:spin 1s linear infinite;display:inline-block;}
@keyframes spin{to{transform:rotate(360deg)}}
.empty{text-align:center;padding:40px 16px;color:var(--gray);}
.empty .big{font-size:40px;margin-bottom:8px;}
.empty p{font-family:'Inter',sans-serif;font-size:14px;font-weight:600;color:var(--dark);}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 12px;}
/* CARD — single clean block */
.card{background:var(--card);border-radius:16px;overflow:hidden;box-shadow:0 1px 8px var(--card-shadow);cursor:pointer;transition:transform .15s,box-shadow .15s;animation:fu .3s ease both;border:1px solid var(--border);}
.card:hover{transform:translateY(-2px);box-shadow:0 6px 20px var(--card-shadow-hover);}
@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.card:nth-child(2){animation-delay:.04s}.card:nth-child(3){animation-delay:.08s}.card:nth-child(4){animation-delay:.12s}
/* Card image slider */
.cimg-wrap{width:100%;height:118px;position:relative;overflow:hidden;}
.cimg-slide{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .6s ease;}
.cimg-slide.hidden{opacity:0;}
.cimg-slide.visible{opacity:1;}
.card:hover .cimg-slide.visible{transform:scale(1.04);transition:opacity .6s ease,transform .35s ease;}
/* food/place label */
.img-label{position:absolute;bottom:6px;left:6px;background:rgba(0,0,0,.52);color:#fff;font-size:9px;font-weight:600;padding:2px 7px;border-radius:20px;font-family:'Inter',sans-serif;z-index:2;pointer-events:none;backdrop-filter:blur(2px);}
/* Badge wrappers — stacked top-left */
.cbadge-wrap{position:absolute;top:5px;left:5px;z-index:3;}
.cbadge-wrap2{position:absolute;top:22px;left:5px;z-index:3;}
.cbadge{display:inline-flex;align-items:center;background:var(--orange);color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:20px;font-family:'Inter',sans-serif;letter-spacing:.2px;}
.cbadge.grn{background:#22C55E;}
.sold-over{position:absolute;inset:0;background:rgba(0,0,0,.52);display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Inter',sans-serif;font-size:12px;font-weight:700;z-index:2;letter-spacing:.5px;}
.veg-dot{position:absolute;top:5px;right:5px;width:15px;height:15px;border-radius:3px;border:2px solid #22C55E;background:#fff;display:flex;align-items:center;justify-content:center;z-index:3;}
.veg-dot-inner{width:7px;height:7px;border-radius:50%;background:#22C55E;}
.nveg-dot{position:absolute;top:5px;right:5px;width:15px;height:15px;border-radius:3px;border:2px solid #EF4444;background:#fff;display:flex;align-items:center;justify-content:center;z-index:3;}
.nveg-dot-inner{width:7px;height:7px;border-radius:50%;background:#EF4444;}
/* Image dots */
.img-dots{position:absolute;bottom:6px;right:8px;display:flex;gap:3px;z-index:2;}
.img-dot{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.45);}
.img-dot.active{background:#fff;width:8px;border-radius:4px;}
/* Card body — Zomato-style clean typography */
.cbody{padding:8px 9px 9px;}
.ctop{display:flex;justify-content:space-between;align-items:flex-start;gap:4px;margin-bottom:1px;}
.cname{font-family:'Inter',sans-serif;font-size:12px;font-weight:600;color:var(--dark);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;}
/* Zomato-style rating: green pill */
.crating{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;color:#fff;background:#1BA672;border-radius:4px;padding:1px 5px;display:inline-flex;align-items:center;gap:2px;white-space:nowrap;flex-shrink:0;}
.ccat{font-size:10px;color:var(--gray);margin-bottom:6px;font-family:'DM Sans',sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cbot{display:flex;align-items:flex-end;justify-content:space-between;}
/* Price block — Zomato style */
.price-row{display:flex;align-items:baseline;gap:5px;margin-bottom:2px;}
.price-new{font-family:'Inter',sans-serif;font-size:16px;font-weight:700;color:var(--dark);letter-spacing:-.4px;line-height:1;}
.price-old{font-size:10px;color:var(--gray);text-decoration:line-through;font-family:'DM Sans',sans-serif;line-height:1;}
.price-save-tag{font-size:9px;font-weight:700;color:#22A362;background:#E6F7EE;border-radius:4px;padding:1px 4px;font-family:'Inter',sans-serif;white-space:nowrap;}
.cmeta{display:flex;align-items:center;gap:4px;flex-wrap:wrap;}
.cmeta span{font-size:9px;color:var(--gray);font-family:'DM Sans',sans-serif;}
.cmeta .qty{color:#E07B39;font-weight:600;}
.add-btn{background:white;color:var(--green);border:1.5px solid var(--green);border-radius:8px;width:28px;height:28px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:600;line-height:1;}
.add-btn:disabled{background:var(--border);color:var(--gray);border-color:var(--border);cursor:default;}
/* SCROLL-TO-TOP */
.scroll-top{position:fixed;bottom:132px;right:calc(50% - var(--w)/2 + 12px);z-index:89;width:34px;height:34px;border-radius:50%;background:var(--card);border:1px solid var(--border);box-shadow:0 2px 10px rgba(0,0,0,.14);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;animation:popIn .2s ease;color:var(--dark);}
@media(max-width:460px){.scroll-top{right:12px;}}
/* FAB */
.fab{position:fixed;bottom:70px;left:50%;transform:translateX(-50%);width:var(--w);pointer-events:none;z-index:90;display:flex;justify-content:flex-end;padding:0 12px;}
.fab-btn{pointer-events:all;background:var(--orange);color:#fff;border:none;border-radius:24px;padding:10px 16px;display:flex;align-items:center;gap:7px;cursor:pointer;font-family:'Inter',sans-serif;font-weight:600;font-size:13px;box-shadow:0 4px 16px rgba(226,55,68,.4);animation:popIn .25s ease;}
@keyframes popIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
.fab-badge{background:#fff;color:var(--orange);font-size:10px;font-weight:800;width:17px;height:17px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
/* BOTTOM NAV */
.bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:var(--w);background:var(--card);border-top:1px solid var(--border);display:flex;justify-content:space-around;padding:8px 0 max(10px,env(safe-area-inset-bottom));z-index:100;box-shadow:0 -2px 12px var(--nav-shadow);}
.nitem{display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;font-size:9px;color:var(--gray);font-family:'Inter',sans-serif;font-weight:500;letter-spacing:.3px;padding:0 8px;}
.nitem.on{color:var(--green);}
.nicon{font-size:19px;}
/* OVERLAY / DRAWER */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:300;backdrop-filter:blur(3px);}
.drawer{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:var(--w);background:var(--card);border-radius:20px 20px 0 0;z-index:400;padding:18px 16px 20px;max-height:82vh;overflow-y:auto;animation:su .25s ease;}
@keyframes su{from{transform:translateX(-50%) translateY(100%)}to{transform:translateX(-50%) translateY(0)}}
.dhandle{width:36px;height:4px;background:var(--border);border-radius:4px;margin:0 auto 14px;}
.dtitle{font-family:'Inter',sans-serif;font-size:17px;font-weight:700;margin-bottom:14px;color:var(--dark);}
.ci{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);}
.ci-img{width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0;}
.ci-em{width:44px;height:44px;background:var(--gp);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}
.ci-info{flex:1;}
.ci-name{font-family:'Inter',sans-serif;font-size:12px;font-weight:600;color:var(--dark);}
.ci-price{font-size:12px;color:var(--green);font-weight:700;margin:2px 0;font-family:'Inter',sans-serif;}
.ci-meta{font-size:10px;color:var(--gray);font-family:'DM Sans',sans-serif;}
.rm-btn{background:none;border:1px solid var(--border);border-radius:7px;width:25px;height:25px;cursor:pointer;font-size:11px;color:var(--gray);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.co-btn{width:100%;background:var(--orange);color:#fff;border:none;border-radius:12px;padding:13px;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;cursor:pointer;margin-top:10px;}
/* DETAIL VIEW */
.detail{position:fixed;top:0;bottom:0;left:50%;transform:translateX(-50%);width:var(--w);background:var(--bg);z-index:450;overflow-y:auto;animation:si .25s ease;}
@keyframes si{from{transform:translateX(calc(-50% + var(--w)))}to{transform:translateX(-50%)}}
@media(max-width:460px){.detail{left:0;transform:none;}@keyframes si{from{transform:translateX(100%)}to{transform:translateX(0)}}}
.dimg{width:100%;height:210px;position:relative;overflow:hidden;}
.dimg img{width:100%;height:100%;object-fit:cover;}
.dimg-ov{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.28),transparent 55%);}
.back-btn{position:absolute;top:12px;left:12px;background:#fff;border:none;border-radius:10px;width:36px;height:36px;cursor:pointer;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;z-index:2;color:#333;}
.rest-strip{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--card);border-bottom:1px solid var(--border);}
.rest-strip-img{width:42px;height:42px;border-radius:9px;object-fit:cover;flex-shrink:0;}
.rest-strip-em{width:42px;height:42px;border-radius:9px;background:var(--gp);display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;}
.rest-name{font-family:'Inter',sans-serif;font-size:13px;font-weight:700;color:var(--dark);}
.rest-meta{font-size:10px;color:var(--gray);margin-top:2px;line-height:1.4;font-family:'DM Sans',sans-serif;}
.dbody{padding:14px;}
.dname{font-family:'Inter',sans-serif;font-size:18px;font-weight:700;margin-bottom:3px;color:var(--dark);}
.dcat{font-size:11px;color:var(--gray);margin-bottom:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-family:'DM Sans',sans-serif;}
/* Pickup/Delivery toggle */
.mode-tog{display:flex;background:var(--mode-bg);border-radius:10px;padding:3px;margin-bottom:12px;}
.mbtn{flex:1;padding:7px 6px;border:none;border-radius:8px;font-family:'Inter',sans-serif;font-size:11px;font-weight:600;cursor:pointer;transition:all .18s;background:transparent;color:var(--gray);}
.mbtn.on{background:var(--card);color:var(--green);box-shadow:0 1px 6px rgba(0,0,0,.08);}
/* Delivery address */
.addr-wrap{background:var(--sh);border-radius:12px;padding:12px;margin-bottom:12px;border:1px solid var(--border);}
.addr-label{font-family:'Inter',sans-serif;font-size:11px;font-weight:700;color:var(--dark);display:block;margin-bottom:6px;}
.addr-input{width:100%;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--dark);outline:none;resize:none;transition:border-color .18s;}
.addr-input:focus{border-color:var(--green);}
.addr-shortcuts{display:flex;gap:5px;margin-top:7px;flex-wrap:wrap;}
.addr-chip{background:var(--gp);color:var(--green);border:none;border-radius:14px;padding:3px 9px;font-size:10px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;}
/* Info chips */
.ichips{display:flex;gap:6px;margin-bottom:12px;}
.ichip{flex:1;background:var(--card);border-radius:10px;padding:9px 8px;text-align:center;border:1px solid var(--border);}
.ichip .ico{font-size:15px;margin-bottom:2px;}
.ichip .ilabel{font-size:9px;color:var(--gray);text-transform:uppercase;letter-spacing:.4px;font-weight:600;font-family:'DM Sans',sans-serif;}
.ichip .ival{font-family:'Inter',sans-serif;font-size:12px;font-weight:700;color:var(--dark);margin-top:1px;}
.dsect{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;}
.ddesc{font-size:12px;line-height:1.7;color:var(--gray);margin-bottom:12px;white-space:pre-line;font-family:'DM Sans',sans-serif;}
.bag-contents{background:var(--card);border-radius:12px;padding:10px 12px;margin-bottom:12px;border:1px solid var(--border);}
.bag-item{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);}
.bag-item:last-child{border-bottom:none;padding-bottom:0;}
.bag-item-img{width:48px;height:48px;border-radius:9px;object-fit:cover;flex-shrink:0;}
.bag-item-name{font-size:12px;font-weight:600;color:var(--dark);font-family:'Inter',sans-serif;}
.bag-item-sub{font-size:10px;color:var(--gray);margin-top:2px;font-family:'DM Sans',sans-serif;}
.time-wrap{margin-bottom:12px;}
.time-label{font-family:'Inter',sans-serif;font-size:11px;font-weight:600;color:var(--dark);margin-bottom:5px;display:block;}
.time-sel{width:100%;background:var(--card);border:1px solid var(--border);border-radius:9px;padding:9px 11px;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--dark);outline:none;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 11px center;}
.dfooter{display:flex;align-items:center;gap:10px;background:var(--card);padding:12px 14px;border-top:1px solid var(--border);position:sticky;bottom:0;}
.dprice .old{font-size:11px;color:var(--gray);text-decoration:line-through;font-family:'DM Sans',sans-serif;}
.dprice .new{font-family:'Inter',sans-serif;font-size:22px;font-weight:700;color:var(--dark);letter-spacing:-.5px;}
.dadd-btn{flex:2;background:var(--orange);color:#fff;border:none;border-radius:12px;padding:12px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;}
/* PAGES */
.page{padding:16px;animation:fu .3s ease;}
.ptitle{font-family:'Inter',sans-serif;font-size:19px;font-weight:700;margin-bottom:3px;color:var(--dark);}
.psub{font-size:12px;color:var(--gray);margin-bottom:14px;font-family:'DM Sans',sans-serif;}
.map-wrap{border-radius:14px;overflow:hidden;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.1);}
.area-list{display:flex;flex-direction:column;gap:8px;}
.acard{background:var(--card);border-radius:12px;padding:11px 12px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:transform .15s;border:1px solid var(--border);}
.acard:hover{transform:translateX(3px);}
.aicon{width:40px;height:40px;border-radius:10px;background:var(--gp);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.aname{font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:var(--dark);}
.acount{font-size:10px;color:var(--gray);font-family:'DM Sans',sans-serif;}
/* ORDERS */
.ocard{background:var(--card);border-radius:12px;padding:12px;margin-bottom:8px;border:1px solid var(--border);}
.otop{display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;}
.oname{font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:var(--dark);}
.ostatus{font-size:10px;font-weight:600;padding:2px 8px;border-radius:12px;background:var(--gp);color:var(--green);font-family:'DM Sans',sans-serif;}
.ometa{font-size:10px;color:var(--gray);font-family:'DM Sans',sans-serif;}
.odiv{height:1px;background:var(--border);margin:8px 0;}
.obot{display:flex;justify-content:space-between;align-items:center;}
.oprice{font-family:'Inter',sans-serif;font-size:14px;font-weight:700;color:var(--dark);}
.rero{background:var(--gp);color:var(--green);border:none;border-radius:8px;padding:5px 10px;font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;cursor:pointer;}
/* PROFILE */
.phero{background:var(--green);border-radius:14px;padding:16px;margin-bottom:14px;display:flex;align-items:center;gap:12px;}
.pav{width:52px;height:52px;border-radius:14px;background:var(--yellow);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;}
.pn{font-family:'Inter',sans-serif;font-size:16px;font-weight:700;color:#fff;}
.pe{font-size:11px;color:rgba(255,255,255,.7);margin-top:2px;font-family:'DM Sans',sans-serif;}
.ps{font-size:10px;color:rgba(255,255,255,.55);margin-top:2px;font-family:'DM Sans',sans-serif;}
.srow{display:flex;gap:6px;margin-bottom:14px;}
.sc{flex:1;background:var(--card);border-radius:12px;padding:9px 6px;text-align:center;border:1px solid var(--border);}
.sv{font-family:'Inter',sans-serif;font-size:15px;font-weight:700;color:var(--green);}
.sl{font-size:9px;color:var(--gray);font-weight:500;text-transform:uppercase;letter-spacing:.4px;margin-top:1px;font-family:'DM Sans',sans-serif;}
.msect{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.8px;margin-bottom:7px;}
.mlist{background:var(--card);border-radius:12px;overflow:hidden;margin-bottom:12px;border:1px solid var(--border);}
.mitem{display:flex;align-items:center;gap:10px;padding:11px 12px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s;}
.mitem:last-child{border-bottom:none;}
.mitem:hover{background:var(--sh);}
.mico{font-size:16px;width:32px;height:32px;background:var(--bg);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mlbl{flex:1;font-size:13px;font-weight:500;color:var(--dark);font-family:'DM Sans',sans-serif;}
.marr{color:var(--gray);font-size:13px;}
.lo-btn{width:100%;background:var(--card);border:1px solid #FECACA;color:#EF4444;border-radius:12px;padding:12px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;}
/* LOGIN */
.login-shell{width:100vw;height:100vh;background:var(--green);display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;}
.login-shell::before{content:'';position:absolute;width:320px;height:320px;background:var(--gl);border-radius:50%;top:-110px;right:-70px;opacity:.2;}
.login-shell::after{content:'';position:absolute;width:220px;height:220px;background:var(--gl);border-radius:50%;bottom:-70px;left:-50px;opacity:.15;}
.login-card{background:#fff;border-radius:20px;padding:32px 24px;width:88%;max-width:360px;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative;z-index:1;animation:popIn .3s ease;}
.l-logo{display:flex;align-items:center;gap:9px;margin-bottom:22px;}
.l-logo-icon{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#F9C74F,#F4845F);display:flex;align-items:center;justify-content:center;font-size:20px;}
.l-logo-text{font-family:'Inter',sans-serif;font-size:24px;font-weight:700;color:#1B1B1B;}
.l-logo-text span{color:var(--green);}
.l-h{font-family:'Inter',sans-serif;font-size:19px;font-weight:700;color:#1B1B1B;margin-bottom:3px;}
.l-sub{font-size:13px;color:#6B7280;margin-bottom:22px;font-family:'DM Sans',sans-serif;}
.lf{margin-bottom:12px;}
.lf label{display:block;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;font-family:'Inter',sans-serif;}
.lf input{width:100%;border:1.5px solid #E5E7EB;border-radius:10px;padding:10px 12px;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;color:#1B1B1B;transition:border-color .18s;}
.lf input:focus{border-color:var(--green);}
.l-btn{width:100%;background:var(--green);color:#fff;border:none;border-radius:11px;padding:13px;font-family:'Inter',sans-serif;font-size:14px;font-weight:600;cursor:pointer;margin-top:6px;}
.l-btn:disabled{background:#C4C4C4;cursor:default;}
.l-err{background:#FEF2F2;border:1px solid #FECACA;border-radius:9px;padding:9px 12px;font-size:13px;color:#EF4444;margin-top:10px;font-family:'DM Sans',sans-serif;}
.l-note{font-size:11px;color:#6B7280;text-align:center;margin-top:12px;line-height:1.6;font-family:'DM Sans',sans-serif;}
/* PWA BANNER */
.pwa-banner{position:fixed;bottom:78px;left:50%;transform:translateX(-50%);width:calc(var(--w) - 24px);background:var(--card);border-radius:14px;padding:12px 14px;box-shadow:0 6px 28px rgba(0,0,0,.2);z-index:500;display:flex;align-items:center;gap:10px;animation:slideUp .3s ease;border:1px solid var(--border);}
@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.pwa-icon{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#F9C74F,#F4845F);display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;}
.pwa-title{font-family:'Inter',sans-serif;font-size:12px;font-weight:700;color:var(--dark);}
.pwa-sub{font-size:10px;color:var(--gray);margin-top:1px;font-family:'DM Sans',sans-serif;}
.pwa-add{background:var(--green);color:#fff;border:none;border-radius:8px;padding:6px 12px;font-family:'Inter',sans-serif;font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0;}
.pwa-x{background:none;border:none;color:var(--gray);font-size:16px;cursor:pointer;flex-shrink:0;padding:0;}
/* MODAL */
.modal-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px;}
.modal{background:var(--card);border-radius:16px;padding:20px;width:100%;max-width:320px;animation:pi .18s ease;border:1px solid var(--border);}
@keyframes pi{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}
.modal h3{font-family:'Inter',sans-serif;font-size:16px;font-weight:700;margin-bottom:12px;color:var(--dark);}
.modal .mlabel{font-size:10px;font-weight:700;color:var(--gray);display:block;margin-bottom:3px;font-family:'Inter',sans-serif;text-transform:uppercase;letter-spacing:.4px;}
.modal .minput,.modal .mselect{width:100%;border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;margin-bottom:9px;color:var(--dark);background:var(--bg);}
.modal .minput:focus,.modal .mselect:focus{border-color:var(--green);}
.modal-desc{font-size:12px;color:var(--gray);line-height:1.6;margin-bottom:11px;font-family:'DM Sans',sans-serif;}
.mbtns{display:flex;gap:7px;margin-top:2px;}
.mcancel{flex:1;background:var(--bg);border:none;border-radius:8px;padding:10px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;color:var(--gray);}
.msave{flex:2;background:var(--green);border:none;border-radius:8px;padding:10px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;color:#fff;}
/* TOAST */
.toast{position:fixed;bottom:88px;left:50%;transform:translateX(-50%);background:var(--toast-bg);color:var(--toast-fg);padding:8px 16px;border-radius:20px;font-size:12px;font-weight:500;z-index:999;animation:ta 2.2s ease forwards;white-space:nowrap;max-width:88vw;text-align:center;font-family:'DM Sans',sans-serif;}
@keyframes ta{0%{opacity:0;transform:translateX(-50%) translateY(6px)}15%{opacity:1;transform:translateX(-50%) translateY(0)}75%{opacity:1}100%{opacity:0}}
`;

/* ── Theme vars (runtime only — never touched by Vite CSS minifier) ── */
function ThemeVars({dark}){
  const L={
    "--bg":"#F6F7F5","--card":"#ffffff","--border":"#EBEBEB",
    "--dark":"#1C1C1C","--gray":"#7A7A7A","--sbg":"#ffffff","--sh":"#F8F8F8",
    "--gp":"#E8F5EE","--mdiv-c":"#BFE0CD","--mode-bg":"#F0F0F0",
    "--card-shadow":"rgba(0,0,0,.06)","--card-shadow-hover":"rgba(0,0,0,.12)",
    "--nav-shadow":"rgba(0,0,0,.05)","--toast-bg":"#1C1C1C","--toast-fg":"#fff",
  };
  const D={
    "--bg":"#111612","--card":"#1C221D","--border":"#2A342C",
    "--dark":"#E8F0EA","--gray":"#8A9E8C","--sbg":"#1C221D","--sh":"rgba(255,255,255,.03)",
    "--gp":"#1A2E1E","--mdiv-c":"#2D4A30","--mode-bg":"#1A2118",
    "--card-shadow":"rgba(0,0,0,.22)","--card-shadow-hover":"rgba(0,0,0,.32)",
    "--nav-shadow":"rgba(0,0,0,.3)","--toast-bg":"#E8F0EA","--toast-fg":"#111612",
  };
  const v=dark?D:L, bg=dark?"#0A0E0B":"#DEE4D9";
  return <style>{`:root{${Object.entries(v).map(([k,v])=>`${k}:${v}`).join(";")}}html,body{background:${bg}}.shell{background:${bg}}`}</style>;
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

/* ── Card image slider — dish ↔ restaurant crossfade, with all overlays inside ── */
function CardSlider({bag, disc, veg}){
  const dishImg = getDishImage(bag);
  const restImg = getRestImage(bag);
  const imgs    = [dishImg, restImg];
  const [idx, setIdx] = useState(0);

  useEffect(()=>{
    const delay = ((bag.id||"x").charCodeAt(0) % 30) * 120;
    const t = setTimeout(()=>{
      const iv = setInterval(()=>setIdx(i=>(i+1)%2), 4200);
      return ()=>clearInterval(iv);
    }, delay);
    return ()=>clearTimeout(t);
  },[]);

  return(
    <div className="cimg-wrap">
      {/* two images, crossfade */}
      {imgs.map((src,i)=>(
        <img key={src} className={`cimg-slide ${i===idx?"visible":"hidden"}`}
          src={src} alt={i===0?"food":"restaurant"} loading="lazy"/>
      ))}
      {/* label pill: shows what's currently shown */}
      <div className="img-label">{idx===0?"🍴 Food":"🏪 Place"}</div>
      {/* discount badge top-left */}
      {disc>=50&&bag.quantity>0&&<div className="cbadge-wrap"><span className="cbadge">{disc}% off</span></div>}
      {bag.quantity>0&&bag.quantity<=2&&<div className="cbadge-wrap2"><span className="cbadge grn">Last {bag.quantity}!</span></div>}
      {/* veg indicator top-right */}
      {veg
        ?<div className="veg-dot"><div className="veg-dot-inner"/></div>
        :<div className="nveg-dot"><div className="nveg-dot-inner"/></div>
      }
      {/* sold out */}
      {bag.quantity===0&&<div className="sold-over">SOLD OUT</div>}
      {/* dot indicators */}
      <div className="img-dots">
        {imgs.map((_,i)=><div key={i} className={`img-dot${i===idx?" active":""}`}/>)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════ */
export default function App(){
  /* auth — persisted */
  const [authed,setAuthed]   = useState(()=>localStorage.getItem("rb_auth")==="1");
  const [phone,setPhone]     = useState("");
  const [pw,setPw]           = useState("");
  const [loginErr,setLoginErr] = useState("");
  const [loggingIn,setLoggingIn] = useState(false);

  /* theme — persisted */
  const [dark,setDark] = useState(()=>localStorage.getItem("rb_dark")==="1");

  /* data */
  const [tab,setTab]           = useState("home");
  const [restaurants,setRestaurants] = useState([]);
  const [bags,setBags]         = useState([]);
  const [loading,setLoading]   = useState(true);

  /* ── filters ── */
  const [search,setSearch]     = useState("");
  const [areaFilter,setAreaFilter] = useState("All");
  const [typeFilter,setTypeFilter] = useState("All");
  const [vegOnly,setVegOnly]   = useState(false);
  const [sortBy,setSortBy]     = useState("default");
  const [maxPrice,setMaxPrice] = useState(500);
  /* quick chips */
  const [chip4plus,setChip4plus]   = useState(false);
  const [chipGreat,setChipGreat]   = useState(false);

  /* dropdown */
  const [openDD,setOpenDD]   = useState(null);
  const [ddPos,setDdPos]     = useState({top:0,left:0,width:210});
  const ddRef                = useRef(null);

  /* cart / orders */
  const [cart,setCart]         = useState([]);
  const [showCart,setShowCart] = useState(false);
  const [selectedBag,setSelectedBag] = useState(null);
  const [selectedTime,setSelectedTime] = useState("");
  const [detailMode,setDetailMode] = useState("pickup");
  const [deliveryAddr,setDeliveryAddr] = useState("");
  const [orders,setOrders]     = useState([]);

  /* ui */
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

  /* persist */
  useEffect(()=>{localStorage.setItem("rb_auth",authed?"1":"0");},[authed]);
  useEffect(()=>{localStorage.setItem("rb_dark",dark?"1":"0");},[dark]);

  /* PWA */
  useEffect(()=>{
    const h=e=>{e.preventDefault();setDeferredPrompt(e);if(!sessionStorage.getItem("pwa-d"))setTimeout(()=>setPwaBanner(true),4000);};
    window.addEventListener("beforeinstallprompt",h);
    return()=>window.removeEventListener("beforeinstallprompt",h);
  },[]);

  /* fetch data */
  useEffect(()=>{if(authed)fetchData();},[authed]);
  async function fetchData(){
    setLoading(true);
    const [{data:r},{data:b}] = await Promise.all([
      supabase.from("restaurants").select("*"),
      supabase.from("bags").select("*").eq("is_active",true),
    ]);
    setRestaurants(r||[]);
    setBags(b||[]);
    setLoading(false);
  }

  /* close dropdown on outside click */
  useEffect(()=>{
    const h=e=>{if(openDD&&ddRef.current&&!ddRef.current.contains(e.target))setOpenDD(null);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[openDD]);

  /* scroll-to-top visibility */
  const handleScroll = useCallback(()=>{
    if(scrollRef.current) setShowScrollTop(scrollRef.current.scrollTop>300);
  },[]);

  /* login */
  function handleLogin(){
    setLoggingIn(true);setLoginErr("");
    setTimeout(()=>{
      if(phone.replace(/\D/g,"")==="9557349786"&&pw==="test123") setAuthed(true);
      else setLoginErr("Incorrect number or password.");
      setLoggingIn(false);
    },700);
  }

  /* enrich bags */
  const enriched = bags.map(b=>{
    const r = restaurants.find(r=>String(r.id)===String(b.restaurant_id))||{};
    return{
      ...b,
      restaurantName:    r.name||"Unknown",
      restaurantArea:    r.area||"",
      restaurantCategory:r.category||"",
      restaurantRating:  Number(r.rating)||4.0,
      restaurantImage:   r.image_url||"",
      restaurantDesc:    r.description||"",
    };
  });

  /* ════════════════════════════
     FILTERS  — bulletproof logic
     Each condition is an independent early-return guard.
  ════════════════════════════ */
  const filtered = enriched.filter(b=>{
    // 1. search
    const q = search.toLowerCase().trim();
    if(q){
      const inName = b.restaurantName.toLowerCase().includes(q);
      const inArea = b.restaurantArea.toLowerCase().includes(q);
      const inType = (b.type||"").toLowerCase().includes(q);
      const inCat  = b.restaurantCategory.toLowerCase().includes(q);
      if(!inName&&!inArea&&!inType&&!inCat) return false;
    }
    // 2. area dropdown
    if(areaFilter!=="All" && b.restaurantArea!==areaFilter) return false;
    // 3. type dropdown — match bag type exactly
    if(typeFilter!=="All" && b.type!==typeFilter) return false;
    // 4. veg toggle
    if(vegOnly && !isVeg(b)) return false;
    // 5. max price slider
    if(b.price > maxPrice) return false;
    // 6. quick chip — 4+ rating
    if(chip4plus && b.restaurantRating < 4) return false;
    // 7. quick chip — great offers (>60% discount)
    if(chipGreat && getDisc(b) <= 60) return false;
    return true;
  }).sort((a,b)=>{
    if(sortBy==="price_asc")  return a.price - b.price;
    if(sortBy==="price_desc") return b.price - a.price;
    if(sortBy==="discount")   return getDisc(b) - getDisc(a);
    if(sortBy==="rating")     return b.restaurantRating - a.restaurantRating;
    return 0;
  });

  const hasFilters = areaFilter!=="All"||typeFilter!=="All"||vegOnly||maxPrice<500||sortBy!=="default"||chip4plus||chipGreat||!!search;

  function clearAll(){
    setAreaFilter("All");setTypeFilter("All");setVegOnly(false);
    setMaxPrice(500);setSortBy("default");
    setChip4plus(false);setChipGreat(false);setSearch("");
  }

  function openDropdown(name,e){
    e.stopPropagation();
    const btn = e.currentTarget.getBoundingClientRect();
    const appEl = document.querySelector(".app");
    const ar = appEl?appEl.getBoundingClientRect():{left:0,width:430};
    const w = name==="price"?230:200;
    let l = btn.left - ar.left;
    if(l+w > ar.width-8) l = ar.width-w-8;
    if(l<8) l=8;
    setDdPos({top:btn.bottom+5, left:ar.left+l, width:w});
    setOpenDD(openDD===name?null:name);
  }

  function toggleVeg(){
    const next=!vegOnly;
    setVegOnly(next);
    if(next){setVegBanner(true);setTimeout(()=>setVegBanner(false),3000);}
    else setVegBanner(false);
  }

  /* cart helpers */
  const showToast = m=>{setToast(m);setToastKey(k=>k+1);setTimeout(()=>setToast(null),2200);};

  function addToCart(bag,mode,time,addr){
    if(!bag.quantity)return;
    setCart(p=>{
      if(p.find(i=>i.id===bag.id)){showToast("Already in bag!");return p;}
      return [...p,{...bag,mode,pickedTime:time||bag.pickup_start,deliveryAddr:addr||"",dishImage:getDishImage(bag)}];
    });
    showToast("🛍️ Added to bag!");
  }

  const removeFromCart = id=>setCart(p=>p.filter(i=>i.id!==id));
  const cartTotal    = cart.reduce((s,i)=>s+i.price,0);
  const cartSavings  = cart.reduce((s,i)=>s+(i.original_price-i.price),0);
  const cartCO2      = (cart.length*CO2_PER_BAG).toFixed(1);

  function handleCheckout(){
    if(!cart.length)return;
    setOrders(p=>[...cart.map(i=>({
      id:`RB${Math.floor(Math.random()*9000)+1000}`,
      name:i.restaurantName, emoji:EMOJI[i.type]||EMOJI.default,
      dishImage:i.dishImage, date:"Just now",
      mode:i.mode==="delivery"?"Delivery":"Pickup",
      deliveryAddr:i.deliveryAddr,
      price:i.price, savings:i.original_price-i.price, co2:CO2_PER_BAG,
    })),...p]);
    showToast("🎉 Order placed!");setCart([]);setShowCart(false);
  }

  const tBags    = orders.length;
  const tSavings = orders.reduce((s,o)=>s+o.savings,0);
  const tCO2     = orders.reduce((s,o)=>s+o.co2,0).toFixed(1);
  const tSpent   = orders.reduce((s,o)=>s+o.price,0);
  const areaCounts = AREAS.filter(a=>a!=="All").map(a=>({
    name:a, icon:AREA_ICONS[a]||"📍",
    count:enriched.filter(b=>b.restaurantArea===a).length,
  }));
  const sortLabels = {default:"Sort",price_asc:"Price ↑",price_desc:"Price ↓",discount:"Discount",rating:"Rating"};

  /* ════════════════
     LOGIN SCREEN
  ════════════════ */
  if(!authed) return(<><><style>{STATIC_CSS}</style><ThemeVars dark={false}/>
    <div className="login-shell">
      <div className="login-card">
        <div className="l-logo"><div className="l-logo-icon">♻️</div><div className="l-logo-text">Re<span>Bite</span></div></div>
        <div className="l-h">Welcome back 👋</div>
        <div className="l-sub">Sign in to save food &amp; money across Delhi</div>
        <div className="lf"><label>Mobile Number</label><input placeholder="9557349786" value={phone} onChange={e=>setPhone(e.target.value)} type="tel" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
        <div className="lf"><label>Password</label><input placeholder="••••••••" value={pw} onChange={e=>setPw(e.target.value)} type="password" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/></div>
        <button className="l-btn" onClick={handleLogin} disabled={loggingIn}>{loggingIn?"Signing in…":"Sign In →"}</button>
        {loginErr&&<div className="l-err">⚠️ {loginErr}</div>}
        <div className="l-note">🌱 Joining 12,000+ Delhi residents<br/>saving food every night</div>
      </div>
    </div>
  </></>);

  /* ════════════════
     MAIN APP
  ════════════════ */
  return(<><><style>{STATIC_CSS}</style><ThemeVars dark={dark}/>
  <div className="shell"><div className="app">

    {/* ── STICKY HEADER AREA ── */}
    <div className="sticky-top" ref={ddRef}>

      {/* header always visible */}
      <div className="header">
        <div className="hrow">
          <div className="logo-wrap">
            <div className="logo-icon">♻️</div>
            <div className="logo-text">Re<span>Bite</span></div>
          </div>
          <div className="hright">
            <div className={`veg-pill ${vegOnly?"on":""}`} onClick={toggleVeg}>
              <div className="veg-box">{vegOnly&&<span className="veg-check">✓</span>}</div>
              <span className="veg-txt">VEG</span>
            </div>
            <div className="dm-wrap">
              <button className={`dm-toggle ${dark?"on":""}`} onClick={()=>setDark(d=>!d)}>
                <div className="dm-knob">{dark?"🌙":"☀️"}</div>
              </button>
              <span className="dm-lbl">{dark?"Dark":"Light"}</span>
            </div>
          </div>
        </div>
        <div className="loc"><div className="loc-dot"/>New Delhi, Delhi</div>
        <div className="htitle">Save food, <span>save money 🌱</span></div>
      </div>

      {/* ticker always visible */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {[...FACTS,...FACTS].map((f,i)=><span key={i} className="ticker-item">{f}</span>)}
        </div>
      </div>

      {/* veg mode banner */}
      {vegBanner&&<div className="veg-banner">
        <span style={{fontSize:15}}>🌿</span>
        <span className="veg-banner-txt">Veg Mode on — showing vegetarian bags only</span>
        <button className="veg-banner-x" onClick={()=>setVegBanner(false)}>✕</button>
      </div>}

      {/* ── Search + Filters — HOME TAB ONLY ── */}
      {tab==="home"&&<>
        <div className="sw">
          <div className="sb">
            <span style={{fontSize:13,color:"var(--gray)"}}>🔍</span>
            <input
              placeholder="Search restaurants, areas, cuisines…"
              value={search}
              onChange={e=>setSearch(e.target.value)}
            />
            {search&&<span style={{cursor:"pointer",color:"var(--gray)",fontSize:12,flexShrink:0}} onClick={()=>setSearch("")}>✕</span>}
          </div>
        </div>

        {/* dropdown filter pills */}
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

        {/* quick CTA chips */}
        <div className="qchips">
          <button className={`qchip ${chip4plus?"on":""}`} onClick={()=>setChip4plus(v=>!v)}>⭐ 4+ Rating</button>
          <button className={`qchip ${chipGreat?"on":""}`} onClick={()=>setChipGreat(v=>!v)}>🔥 Great Offers</button>
          <button
            className={`qchip ${vegOnly?"on":""}`}
            style={vegOnly?{borderColor:"#22C55E",background:"#22C55E",color:"#fff"}:{}}
            onClick={toggleVeg}
          >🌿 Veg Only</button>
          {AREAS.filter(a=>a!=="All").map(a=>(
            <button
              key={a}
              className={`qchip ${areaFilter===a?"on":""}`}
              onClick={()=>setAreaFilter(v=>v===a?"All":a)}
            >{AREA_ICONS[a]} {a}</button>
          ))}
          <button className={`qchip ${sortBy==="discount"?"on":""}`} onClick={()=>setSortBy(v=>v==="discount"?"default":"discount")}>💸 Best Deal</button>
        </div>

        <div className="results-row">
          <span className="results-count">{loading?"Loading…":`${filtered.length} bags available`}</span>
          {hasFilters&&<span className="clear-all" onClick={clearAll}>Clear all ✕</span>}
        </div>
      </>}
    </div>

    {/* ── DROPDOWN (fixed, z-index 9999) ── */}
    {openDD&&<div
      className="dropdown"
      style={{top:ddPos.top, left:ddPos.left, width:ddPos.width}}
      onClick={e=>e.stopPropagation()}
    >
      {openDD==="area"&&<>
        <div className="dd-hd">Select Area</div>
        {AREAS.map(a=><div key={a} className={`dd-opt ${areaFilter===a?"on":""}`} onClick={()=>{setAreaFilter(a);setOpenDD(null);}}>
          <span>{a==="All"?"🗺 All Areas":AREA_ICONS[a]+" "+a}</span>
          <div className="chk">{areaFilter===a?"✓":""}</div>
        </div>)}
      </>}
      {openDD==="type"&&<>
        <div className="dd-hd">Bag Type</div>
        {TYPES.map(t=><div key={t} className={`dd-opt ${typeFilter===t?"on":""}`} onClick={()=>{setTypeFilter(t);setOpenDD(null);}}>
          <span>{t==="All"?"🛍 All Types":(EMOJI[t]||"")+" "+t}</span>
          <div className="chk">{typeFilter===t?"✓":""}</div>
        </div>)}
      </>}
      {openDD==="sort"&&<>
        <div className="dd-hd">Sort By</div>
        {[["default","✨ Recommended"],["price_asc","Price: Low → High"],["price_desc","Price: High → Low"],["discount","Biggest Discount 🔥"],["rating","Highest Rated ⭐"]].map(([v,l])=>
          <div key={v} className={`dd-opt ${sortBy===v?"on":""}`} onClick={()=>{setSortBy(v);setOpenDD(null);}}>
            <span>{l}</span><div className="chk">{sortBy===v?"✓":""}</div>
          </div>
        )}
      </>}
      {openDD==="price"&&<>
        <div className="dd-hd">Max Price</div>
        <div className="range-wrap">
          <div className="range-lbls"><span>₹50</span><span className="range-val">₹{maxPrice}</span><span>₹500</span></div>
          <input type="range" min={50} max={500} step={25} value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value))}/>
        </div>
        <div className="dd-footer"><button className="dd-clr" onClick={()=>{setMaxPrice(500);setOpenDD(null);}}>Reset to ₹500</button></div>
      </>}
    </div>}

    {/* ── SCROLL BODY ── */}
    <div
      className="scroll-body"
      ref={scrollRef}
      onScroll={handleScroll}
      onClick={()=>openDD&&setOpenDD(null)}
    >
      {/* ─── HOME TAB ─── */}
      {tab==="home"&&<>
        <div className="urgency">
          <span style={{fontSize:18}}>⏰</span>
          <div><strong>Bags filling fast tonight!</strong><span>Pickup 6 PM – 9 PM · Delhi</span></div>
        </div>

        {cart.length>0&&<div className="mbar">
          <div className="mi2"><span className="mi2-ico">♻️</span><div className="mi2-t"><strong>₹{cartSavings}</strong>saved</div></div>
          <div className="mdiv"/>
          <div className="mi2"><span className="mi2-ico">🌱</span><div className="mi2-t"><strong>{cartCO2}kg</strong>CO₂</div></div>
          <div className="mdiv"/>
          <div className="mi2"><span className="mi2-ico">🛍️</span><div className="mi2-t"><strong>{cart.length}</strong>in bag</div></div>
        </div>}

        {loading
          ?<div className="loading"><span className="spin">🌿</span><p style={{marginTop:10,fontFamily:"Inter",fontWeight:600,fontSize:13,color:"var(--dark)"}}>Loading today's bags…</p></div>
          :filtered.length===0
            ?<div className="empty">
                <div className="big">😔</div>
                <p>No bags match your filters</p>
                <span style={{fontSize:12,fontFamily:"DM Sans"}}>Try relaxing your filters</span>
                {hasFilters&&<div onClick={clearAll} style={{marginTop:10,color:"var(--green)",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"Inter"}}>Clear all filters →</div>}
              </div>
            :<div className="grid">
              {filtered.map(bag=>{
                const d   = getDisc(bag);
                const veg = isVeg(bag);
                return(
                  <div
                    key={bag.id}
                    className="card"
                    onClick={()=>{setSelectedBag(bag);setDetailMode("pickup");setSelectedTime(bag.pickup_start);setDeliveryAddr("");}}
                  >
                    {/* slider handles all overlays internally */}
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
                        <button
                          className="add-btn"
                          disabled={!bag.quantity}
                          onClick={e=>{e.stopPropagation();addToCart(bag,"pickup",bag.pickup_start,"");}}
                        >+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        }
        <div style={{height:10}}/>
      </>}

      {/* ─── EXPLORE TAB (no search/filters) ─── */}
      {tab==="explore"&&<div className="page">
        <div className="ptitle">Explore Delhi 🗺️</div>
        <div className="psub">Tap an area to browse bags there</div>
        <div className="map-wrap"><LeafletMap bags={enriched}/></div>
        <p style={{fontFamily:"Inter",fontSize:10,fontWeight:700,color:"var(--gray)",letterSpacing:.8,textTransform:"uppercase",marginBottom:8}}>Areas</p>
        <div className="area-list">
          {areaCounts.map(a=>(
            <div key={a.name} className="acard" onClick={()=>{setAreaFilter(a.name);setTab("home");}}>
              <div className="aicon">{a.icon}</div>
              <div style={{flex:1}}>
                <div className="aname">{a.name}</div>
                <div className="acount">{a.count} bags tonight</div>
              </div>
              <div style={{color:"var(--gray)",fontSize:14}}>›</div>
            </div>
          ))}
        </div>
      </div>}

      {/* ─── ORDERS TAB (no search/filters) ─── */}
      {tab==="orders"&&<div className="page">
        <div className="ptitle">Your Orders 📦</div>
        <div className="psub">Your ReBite history</div>
        {orders.length===0
          ?<div className="empty"><div className="big">📦</div><p>No orders yet</p><span style={{fontSize:12,fontFamily:"DM Sans"}}>Reserve a bag to get started!</span></div>
          :orders.map(o=>(
            <div key={o.id} className="ocard">
              <div className="otop">
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {o.dishImage
                    ?<img src={o.dishImage} style={{width:34,height:34,borderRadius:7,objectFit:"cover"}} alt=""/>
                    :<span style={{fontSize:20}}>{o.emoji}</span>
                  }
                  <div className="oname">{o.name}</div>
                </div>
                <div className="ostatus">✅ Done</div>
              </div>
              <div className="ometa">{o.date} · {o.mode}{o.deliveryAddr?" → "+o.deliveryAddr:""} · #{o.id}</div>
              <div className="odiv"/>
              <div className="obot">
                <div>
                  <span className="oprice">₹{o.price}</span>
                  <span style={{fontSize:10,color:"#22C55E",fontWeight:600,marginLeft:6,fontFamily:"DM Sans"}}>saved ₹{o.savings}</span>
                </div>
                <button className="rero" onClick={()=>showToast("🔄 Added!")}>Reorder</button>
              </div>
            </div>
          ))
        }
      </div>}

      {/* ─── PROFILE TAB (no search/filters) ─── */}
      {tab==="profile"&&<div className="page">
        <div className="phero">
          <div className="pav">🧑</div>
          <div>
            <div className="pn">{profile.name}</div>
            <div className="pe">{profile.email}</div>
            <div className="ps">🌱 Member since Feb 2026</div>
          </div>
        </div>
        <div className="srow">
          <div className="sc"><div className="sv">{tBags}</div><div className="sl">Bags</div></div>
          <div className="sc"><div className="sv">₹{tSavings}</div><div className="sl">Saved</div></div>
          <div className="sc"><div className="sv">{tCO2}kg</div><div className="sl">CO₂</div></div>
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

    {/* ── SCROLL TO TOP ── */}
    {showScrollTop&&(
      <button className="scroll-top" onClick={()=>scrollRef.current?.scrollTo({top:0,behavior:"smooth"})}>↑</button>
    )}

    {/* ── FAB ── */}
    {cart.length>0&&<div className="fab">
      <button className="fab-btn" onClick={()=>setShowCart(true)}>
        <span className="fab-badge">{cart.length}</span>
        <span>View Bag · ₹{cartTotal}</span>
      </button>
    </div>}

    {/* ── BOTTOM NAV ── */}
    <div className="bnav">
      {[{id:"home",icon:"🏠",label:"Home"},{id:"explore",icon:"🗺️",label:"Explore"},{id:"orders",icon:"📦",label:"Orders"},{id:"profile",icon:"👤",label:"Profile"}].map(n=>(
        <div key={n.id} className={`nitem ${tab===n.id?"on":""}`} onClick={()=>setTab(n.id)}>
          <span className="nicon">{n.icon}</span>{n.label}
        </div>
      ))}
    </div>

    {/* ── CART DRAWER ── */}
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
                  <div className="ci-price">₹{i.price} <span style={{color:"var(--gray)",fontWeight:400,fontSize:10,textDecoration:"line-through"}}>₹{i.original_price}</span></div>
                  <div className="ci-meta">{i.mode==="delivery"?"🛵 Delivery":"🏃 Pickup"} · {i.pickedTime} · {i.type}{i.deliveryAddr?" · "+i.deliveryAddr:""}</div>
                </div>
                <button className="rm-btn" onClick={()=>removeFromCart(i.id)}>✕</button>
              </div>
            ))}
            <div style={{background:"var(--gp)",borderRadius:10,padding:"9px 12px",margin:"12px 0 6px",display:"flex",gap:14}}>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontFamily:"Inter",fontWeight:700,fontSize:14,color:"var(--green)"}}>₹{cartSavings}</div>
                <div style={{fontSize:9,color:"var(--green)",fontWeight:600,textTransform:"uppercase",letterSpacing:.4,fontFamily:"DM Sans"}}>Saved</div>
              </div>
              <div style={{width:1,background:"var(--border)"}}/>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontFamily:"Inter",fontWeight:700,fontSize:14,color:"var(--green)"}}>{cartCO2}kg</div>
                <div style={{fontSize:9,color:"var(--green)",fontWeight:600,textTransform:"uppercase",letterSpacing:.4,fontFamily:"DM Sans"}}>CO₂ saved</div>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"6px 0 4px"}}>
              <span style={{color:"var(--gray)",fontSize:13,fontFamily:"DM Sans"}}>Total</span>
              <span style={{fontFamily:"Inter",fontWeight:700,fontSize:19,color:"var(--dark)"}}>₹{cartTotal}</span>
            </div>
            <button className="co-btn" onClick={handleCheckout}>Proceed to Pay · ₹{cartTotal}</button>
          </>
        }
      </div>
    </>}

    {/* ── DETAIL VIEW ── */}
    {selectedBag&&(()=>{
      const di   = getDishImage(selectedBag);
      const d    = getDisc(selectedBag);
      const slots= genSlots(selectedBag.pickup_start,selectedBag.pickup_end);
      const hero = BAG_HERO[selectedBag.type]||BAG_HERO.Meal;
      const veg  = isVeg(selectedBag);
      const restImg = getRestImage(selectedBag);
      return(
        <div className="detail">
          <div className="dimg">
            <img src={di} alt={selectedBag.type}/>
            <div className="dimg-ov"/>
            <button className="back-btn" onClick={()=>setSelectedBag(null)}>←</button>
            <div style={{position:"absolute",top:12,right:12,zIndex:2,background:"#fff",borderRadius:4,border:`2px solid ${veg?"#22C55E":"#EF4444"}`,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:9,height:9,borderRadius:"50%",background:veg?"#22C55E":"#EF4444"}}/>
            </div>
          </div>

          <div className="rest-strip">
            <img className="rest-strip-img" src={restImg} alt={selectedBag.restaurantName} onError={e=>{e.target.style.display="none";}}/>
            <div>
              <div className="rest-name">{selectedBag.restaurantName}</div>
              <div className="rest-meta">{selectedBag.restaurantCategory} · {selectedBag.restaurantArea} · ⭐ {selectedBag.restaurantRating}<br/>{selectedBag.restaurantDesc?.slice(0,68)}…</div>
            </div>
          </div>

          <div className="dbody">
            <div className="dname">{selectedBag.type} Surprise Bag</div>
            <div className="dcat">
              {veg?<span style={{color:"#22C55E",fontWeight:600}}>🌿 Pure Veg</span>:<span style={{color:"#EF4444",fontWeight:600}}>🍗 Non-Veg</span>}
              <span>·</span>
              <span>{d}% off · saves ₹{selectedBag.original_price-selectedBag.price}</span>
            </div>

            {/* pickup / delivery toggle */}
            <div className="mode-tog">
              <button className={`mbtn ${detailMode==="pickup"?"on":""}`} onClick={()=>setDetailMode("pickup")}>🏃 Pickup</button>
              <button className={`mbtn ${detailMode==="delivery"?"on":""}`} onClick={()=>setDetailMode("delivery")}>🛵 Delivery +₹20</button>
            </div>

            {/* delivery address — only when delivery selected */}
            {detailMode==="delivery"&&<div className="addr-wrap">
              <span className="addr-label">📍 Delivery Address</span>
              <textarea
                className="addr-input"
                rows={2}
                placeholder="e.g. 42 Defence Colony, near main market…"
                value={deliveryAddr}
                onChange={e=>setDeliveryAddr(e.target.value)}
              />
              <div className="addr-shortcuts">
                {["🏠 Home","🏢 Work","📍 Other"].map(s=>(
                  <button key={s} className="addr-chip" onClick={()=>setDeliveryAddr(v=>v||s.split(" ")[1]+" — ")}>{s}</button>
                ))}
              </div>
            </div>}

            <div className="ichips">
              <div className="ichip"><div className="ico">📦</div><div className="ilabel">Left</div><div className="ival">{selectedBag.quantity||"None"}</div></div>
              <div className="ichip"><div className="ico">💰</div><div className="ilabel">Saving</div><div className="ival">{d}%</div></div>
              <div className="ichip"><div className="ico">🌱</div><div className="ilabel">CO₂</div><div className="ival">{CO2_PER_BAG}kg</div></div>
            </div>

            <div className="dsect">What's inside 🎁</div>
            <div className="bag-contents">
              <div className="bag-item">
                <img className="bag-item-img" src={hero.img} alt={hero.name} loading="lazy"/>
                <div><div className="bag-item-name">{hero.name}</div><div className="bag-item-sub">{hero.sub}</div></div>
              </div>
              <div className="bag-item">
                <div style={{width:48,height:48,borderRadius:9,background:"var(--gp)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🎲</div>
                <div><div className="bag-item-name">Surprise Extra</div><div className="bag-item-sub">A little extra from the kitchen — changes daily</div></div>
              </div>
            </div>

            <div className="time-wrap">
              <span className="time-label">🕐 Select pickup time</span>
              <select className="time-sel" value={selectedTime} onChange={e=>setSelectedTime(e.target.value)}>
                {slots.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="dsect">How it works</div>
            <div className="ddesc">{detailMode==="pickup"
              ?"1. Reserve your bag\n2. Show order at counter\n3. Collect at selected time\n4. Enjoy! 🌱"
              :"1. Reserve your bag\n2. Add delivery address above\n3. Delivery partner picks up\n4. Arrives in 30–45 mins · Enjoy! 🌱"
            }</div>
          </div>

          <div className="dfooter">
            <div className="dprice">
              <div className="old">₹{selectedBag.original_price}</div>
              <div className="new">₹{detailMode==="delivery"?selectedBag.price+20:selectedBag.price}</div>
            </div>
            <button
              className="dadd-btn"
              disabled={!selectedBag.quantity||(detailMode==="delivery"&&!deliveryAddr.trim())}
              style={(!selectedBag.quantity||(detailMode==="delivery"&&!deliveryAddr.trim()))?{background:"var(--border)",color:"var(--gray)",cursor:"default"}:{}}
              onClick={()=>{addToCart(selectedBag,detailMode,selectedTime,deliveryAddr);setSelectedBag(null);}}
            >
              {!selectedBag.quantity
                ?"Sold Out"
                :detailMode==="delivery"&&!deliveryAddr.trim()
                  ?"Enter address above 📍"
                  :detailMode==="delivery"
                    ?"Reserve · Delivery 🛵"
                    :`Reserve · ${selectedTime} 🏃`
              }
            </button>
          </div>
        </div>
      );
    })()}

    {/* ── PWA BANNER ── */}
    {pwaBanner&&<div className="pwa-banner">
      <div className="pwa-icon">♻️</div>
      <div style={{flex:1}}>
        <div className="pwa-title">Add ReBite to Home Screen</div>
        <div className="pwa-sub">Quick access · feels native · works offline</div>
      </div>
      <button className="pwa-add" onClick={()=>{
        if(deferredPrompt){deferredPrompt.prompt();deferredPrompt.userChoice.then(()=>{setDeferredPrompt(null);setPwaBanner(false);});}
        else{setPwaBanner(false);showToast("Tap Share → Add to Home Screen");}
      }}>Add</button>
      <button className="pwa-x" onClick={()=>{setPwaBanner(false);sessionStorage.setItem("pwa-d","1");}}>✕</button>
    </div>}

    {/* ── MODALS ── */}
    {modal&&<div className="modal-ov" onClick={()=>setModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
      {modal.type==="editProfile"&&<><h3>✏️ Edit Profile</h3><label className="mlabel">Name</label><input className="minput" value={profileEdit.name} onChange={e=>setProfileEdit(p=>({...p,name:e.target.value}))} placeholder="Your name"/><label className="mlabel">Email</label><input className="minput" value={profileEdit.email} onChange={e=>setProfileEdit(p=>({...p,email:e.target.value}))} placeholder="Email"/><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setProfile({name:profileEdit.name||profile.name,email:profileEdit.email||profile.email});setModal(null);showToast("✅ Saved!");}}>Save</button></div></>}
      {modal.type==="address"&&<><h3>📍 Saved Addresses</h3><label className="mlabel">Home</label><input className="minput" placeholder="e.g. 42, Defence Colony"/><label className="mlabel">Work</label><input className="minput" placeholder="e.g. Cyber Hub, Gurugram"/><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setModal(null);showToast("✅ Saved!");}}>Save</button></div></>}
      {modal.type==="payment"&&<><h3>💳 Payment Methods</h3><label className="mlabel">UPI ID</label><input className="minput" placeholder="yourname@upi"/><label className="mlabel">Preferred</label><select className="mselect"><option>UPI</option><option>Card</option><option>Net Banking</option><option>Cash on Pickup</option></select><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setModal(null);showToast("✅ Updated!");}}>Save</button></div></>}
      {modal.type==="notifications"&&<><h3>🔔 Notifications</h3><label className="mlabel">Email</label><select className="mselect"><option>All</option><option>Orders only</option><option>Off</option></select><label className="mlabel">Push</label><select className="mselect"><option>Enabled</option><option>Disabled</option></select><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setModal(null);showToast("✅ Saved!");}}>Save</button></div></>}
      {modal.type==="help"&&<><h3>❓ Help & Support</h3><p className="modal-desc">Having an issue? We'll get back to you within 24 hours.</p><label className="mlabel">Message</label><input className="minput" placeholder="Describe your issue…"/><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setModal(null);showToast("✅ Sent!");}}>Send</button></div></>}
      {modal.type==="terms"&&<><h3>📄 Terms & Privacy</h3><p className="modal-desc">By using ReBite you agree to our Terms of Service and Privacy Policy. We collect minimal data and never sell it to third parties.</p><div className="mbtns"><button className="msave" style={{flex:1}} onClick={()=>setModal(null)}>Got it</button></div></>}
      {modal.type==="partner"&&<><h3>🤝 Partner with ReBite</h3><p className="modal-desc">Restaurant, café or bakery? Start listing your surplus bags!</p><label className="mlabel">Restaurant name</label><input className="minput" placeholder="e.g. My Café, CP"/><label className="mlabel">Phone</label><input className="minput" placeholder="+91 XXXXX XXXXX" type="tel"/><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setModal(null);showToast("🎉 We'll be in touch!");}}>Submit</button></div></>}
    </div></div>}

    {toast&&<div key={toastKey} className="toast">{toast}</div>}

  </div></div></></>);
}