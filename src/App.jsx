import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

const EMOJI  = { Bakery:"🥐", Cafe:"☕", "Fine Dining":"🍽️", Buffet:"🍱", Meal:"🍛", Dessert:"🧁", default:"🛍️" };
const COLORS = { Bakery:"#FFF8F0", Cafe:"#F5F0FF", "Fine Dining":"#FEF9EE", Buffet:"#F0F7FF", Meal:"#FFF0E8", Dessert:"#FFF0F5", default:"#F7F9F5" };
const AREAS  = ["All","CP","Hauz Khas","GK","Saket","Rajouri"];
const TYPES  = ["All","Bakery","Meal","Dessert","Cafe","Fine Dining","Buffet"];
const AREA_ICONS = { CP:"🏛️", "Hauz Khas":"🌳", GK:"🏘️", Saket:"🎬", Rajouri:"🛍️" };
const CO2_PER_BAG = 1.2;

const DISH_IMAGES = {
  Bakery:["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80","https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80","https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&q=80","https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?w=400&q=80","https://images.unsplash.com/photo-1549931319-a545dcf3bc7c?w=400&q=80"],
  Meal:["https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80","https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=80","https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80","https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&q=80","https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80"],
  Dessert:["https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80","https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80","https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&q=80","https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80","https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&q=80"],
  Cafe:["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80","https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80","https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&q=80","https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&q=80","https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80"],
  "Fine Dining":["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80","https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80","https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80","https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80","https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80"],
  Buffet:["https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80","https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80","https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80","https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80","https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80"],
};

const BAG_CONTENTS = {
  Bakery:[{name:"Assorted Croissants",sub:"2–3 pcs · freshly baked",img:"https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&q=80"},{name:"Sourdough Loaf",sub:"Half loaf · day's end",img:"https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=200&q=80"},{name:"Pastries & Cakes",sub:"Surprise selection",img:"https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=200&q=80"}],
  Meal:[{name:"Dal & Rice",sub:"Chef's daily special",img:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&q=80"},{name:"Curry + Roti",sub:"2 rotis · seasonal vegetable",img:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&q=80"},{name:"Raita / Salad",sub:"Complimentary side",img:"https://images.unsplash.com/photo-1567337710282-00832b415979?w=200&q=80"}],
  Cafe:[{name:"Signature Drink",sub:"Hot or cold · surprise flavour",img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=80"},{name:"Snack Plate",sub:"Sandwich / Wrap / Toast",img:"https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&q=80"},{name:"House Baked Item",sub:"Cookie / Muffin / Scone",img:"https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&q=80"}],
  Dessert:[{name:"Dessert Surprise Box",sub:"3–4 pieces · assorted",img:"https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=200&q=80"},{name:"Cake Slice",sub:"Chef's flavour of the day",img:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80"}],
  "Fine Dining":[{name:"Starter Course",sub:"Chef's signature appetiser",img:"https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80"},{name:"Main Course",sub:"One premium main + bread",img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=80"},{name:"Dessert",sub:"Petit four or mousse",img:"https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&q=80"}],
  Buffet:[{name:"Buffet Selection Box",sub:"5–7 items · chef curated",img:"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&q=80"},{name:"Live Counter Item",sub:"Tandoor / Wok",img:"https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=200&q=80"}],
};

const VEG_TYPES = new Set(["Bakery","Dessert","Cafe"]);
const isVeg = b => VEG_TYPES.has(b.type);
const getDishImage = bag => { const pool=DISH_IMAGES[bag.type]||DISH_IMAGES.Meal; return pool[bag.id?bag.id.charCodeAt(0)%pool.length:0]; };

function generateTimeSlots(start,end){const slots=[];const[sh]=start.split(":").map(Number);const[eh]=end.split(":").map(Number);for(let h=sh;h<=eh;h++)slots.push(`${String(h).padStart(2,"0")}:00`);return slots;}

const S=`
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
:root{--green:#2D6A4F;--gl:#52B788;--gp:#D8F3DC;--orange:#F4845F;--yellow:#F9C74F;--red:#EF4444;--dark:#1B1B1B;--gray:#6B7280;--bg:#F7F9F5;--w:430px;}
html,body{height:100%;background:#c8d8c8;}
body{font-family:'DM Sans',sans-serif;color:var(--dark);}
.shell{width:100vw;height:100vh;display:flex;justify-content:center;background:#c8d8c8;overflow:hidden;}
.app{width:var(--w);height:100vh;background:var(--bg);display:flex;flex-direction:column;box-shadow:0 0 80px rgba(0,0,0,.22);overflow:hidden;}
@media(max-width:460px){:root{--w:100vw;}.shell{height:100dvh;}.app{box-shadow:none;height:100dvh;}.bnav,.fab,.drawer{width:100vw!important;left:0!important;transform:none!important;}}
.sticky-top{flex-shrink:0;z-index:60;}
.header{background:var(--green);padding:14px 18px 16px;overflow:hidden;position:relative;}
.header::before{content:'';position:absolute;width:180px;height:180px;background:var(--gl);border-radius:50%;top:-70px;right:-50px;opacity:.25;pointer-events:none;}
.hrow{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.logo-wrap{display:flex;align-items:center;gap:8px;}
.logo-icon{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#F9C74F,#F4845F);display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 2px 8px rgba(0,0,0,.2);}
.logo-text{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#fff;letter-spacing:-.5px;}
.logo-text span{color:var(--yellow);}
.hright{display:flex;align-items:center;gap:8px;}
.veg-toggle{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.15);border:1.5px solid rgba(255,255,255,.3);border-radius:20px;padding:5px 11px;cursor:pointer;transition:all .25s;}
.veg-toggle.on{background:#fff;border-color:#fff;}
.veg-dot{width:10px;height:10px;border-radius:50%;border:2px solid #22C55E;background:transparent;transition:background .25s;}
.veg-toggle.on .veg-dot{background:#22C55E;}
.veg-label{font-family:'Syne',sans-serif;font-size:10px;font-weight:800;color:rgba(255,255,255,.9);letter-spacing:.3px;}
.veg-toggle.on .veg-label{color:#15803D;}
.loc{display:flex;align-items:center;gap:5px;color:rgba(255,255,255,.8);font-size:11px;margin-bottom:5px;}
.loc-dot{width:6px;height:6px;background:var(--yellow);border-radius:50%;}
.htitle{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:#fff;line-height:1.3;}
.htitle span{color:#95D5B2;}
.dtoggle{display:flex;background:rgba(255,255,255,.15);border-radius:11px;padding:3px;margin-top:9px;}
.dtbtn{flex:1;padding:7px;border:none;border-radius:9px;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;background:transparent;color:rgba(255,255,255,.7);}
.dtbtn.active{background:#fff;color:var(--green);box-shadow:0 2px 8px rgba(0,0,0,.12);}
.sw{padding:10px 14px 0;background:var(--bg);}
.sb{background:#fff;border-radius:13px;display:flex;align-items:center;gap:8px;padding:10px 13px;box-shadow:0 3px 16px rgba(0,0,0,.08);}
.sb input{border:none;outline:none;flex:1;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--dark);background:transparent;}
.sb input::placeholder{color:#C4C4C4;}
.filter-bar{display:flex;align-items:center;gap:6px;padding:8px 14px 6px;overflow-x:auto;scrollbar-width:none;background:var(--bg);}
.filter-bar::-webkit-scrollbar{display:none;}
.filter-pill{display:flex;align-items:center;gap:4px;padding:6px 11px;border-radius:20px;border:1.5px solid #E5E7EB;background:#fff;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .2s;color:var(--gray);flex-shrink:0;font-family:'DM Sans',sans-serif;}
.filter-pill.active{background:var(--green);color:#fff;border-color:var(--green);}
.filter-divider{width:1px;height:20px;background:#E5E7EB;flex-shrink:0;}
.results-row{display:flex;align-items:center;justify-content:space-between;padding:4px 14px 4px;}
.results-count{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;color:var(--gray);letter-spacing:.5px;text-transform:uppercase;}
.clear-all{font-size:11px;color:var(--orange);font-weight:700;cursor:pointer;font-family:'Syne',sans-serif;}
.dropdown{position:fixed;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.18);z-index:500;min-width:200px;overflow:hidden;animation:ddIn .15s ease;}
@keyframes ddIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.dd-header{padding:12px 16px 8px;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.8px;border-bottom:1px solid #F5F5F5;}
.dd-opt{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;cursor:pointer;transition:background .15s;font-size:13px;}
.dd-opt:hover{background:#F7FBF7;}
.dd-opt.active{color:var(--green);font-weight:700;}
.chk{width:18px;height:18px;border-radius:50%;border:2px solid #E5E7EB;display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;}
.dd-opt.active .chk{background:var(--green);border-color:var(--green);color:#fff;}
.dd-footer{padding:8px 16px 10px;border-top:1px solid #F0F0F0;}
.dd-clear{background:none;border:none;color:var(--gray);font-size:12px;cursor:pointer;font-family:'Syne',sans-serif;font-weight:700;}
.range-wrap{padding:8px 16px 12px;}
.range-labels{display:flex;justify-content:space-between;font-size:11px;color:var(--gray);margin-bottom:8px;font-family:'Syne',sans-serif;font-weight:700;}
.range-input{width:100%;accent-color:var(--green);cursor:pointer;height:4px;}
.scroll-body{flex:1;overflow-y:auto;padding-bottom:130px;-webkit-overflow-scrolling:touch;}
.urgency{margin:8px 14px 8px;background:linear-gradient(135deg,var(--orange),#E85D3A);border-radius:13px;padding:10px 13px;display:flex;align-items:center;gap:9px;color:#fff;}
.urgency strong{display:block;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;}
.urgency span{font-size:10px;opacity:.9;}
.mbar{margin:0 14px 8px;background:var(--gp);border-radius:13px;padding:9px 13px;display:flex;align-items:center;gap:6px;}
.mi2{display:flex;align-items:center;gap:5px;flex:1;}
.mi2-ico{font-size:14px;}
.mi2-t{font-size:10px;color:var(--green);font-weight:600;line-height:1.2;}
.mi2-t strong{display:block;font-family:'Syne',sans-serif;font-size:13px;}
.mdiv{width:1px;height:24px;background:#B7DFC6;flex-shrink:0;}
.loading{text-align:center;padding:40px 16px;}
.spin{font-size:36px;animation:spin 1s linear infinite;display:inline-block;}
@keyframes spin{to{transform:rotate(360deg)}}
.empty{text-align:center;padding:40px 16px;color:var(--gray);}
.empty .big{font-size:44px;margin-bottom:10px;}
.empty p{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--dark);}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 14px;}
.card{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.07);cursor:pointer;transition:transform .18s,box-shadow .18s;animation:fu .3s ease both;}
.card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.12);}
@keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.card:nth-child(2){animation-delay:.04s}.card:nth-child(3){animation-delay:.08s}.card:nth-child(4){animation-delay:.12s}
.cimg-wrap{width:100%;height:120px;position:relative;overflow:hidden;}
.cimg-wrap img{width:100%;height:100%;object-fit:cover;transition:transform .3s;}
.card:hover .cimg-wrap img{transform:scale(1.06);}
.cbadges{position:absolute;top:6px;left:6px;display:flex;flex-direction:column;gap:3px;}
.cbadge{display:inline-flex;align-items:center;gap:2px;background:var(--orange);color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:20px;font-family:'Syne',sans-serif;width:fit-content;}
.cbadge.grn{background:var(--gl);}
.sold-over{position:absolute;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;color:#fff;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;}
.veg-ind{position:absolute;top:6px;right:6px;width:16px;height:16px;border-radius:3px;border:2px solid #22C55E;background:#fff;display:flex;align-items:center;justify-content:center;}
.veg-ind-dot{width:7px;height:7px;border-radius:50%;background:#22C55E;}
.nveg-ind{position:absolute;top:6px;right:6px;width:16px;height:16px;border-radius:3px;border:2px solid #EF4444;background:#fff;display:flex;align-items:center;justify-content:center;}
.nveg-ind-dot{width:7px;height:7px;border-radius:50%;background:#EF4444;}
.cbody{padding:9px 10px 10px;}
.ctop{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1px;}
.cname{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;flex:1;padding-right:3px;line-height:1.25;}
.crating{font-size:9px;color:var(--gray);white-space:nowrap;}
.ccat{font-size:9px;color:var(--gray);margin-bottom:5px;}
.cbot{display:flex;align-items:center;justify-content:space-between;}
.pnew{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:var(--green);}
.pold{font-size:9px;color:#C4C4C4;text-decoration:line-through;margin-left:2px;}
.cmeta{display:flex;align-items:center;gap:4px;margin-top:2px;flex-wrap:wrap;}
.cmeta span{font-size:8px;color:var(--gray);}
.cmeta .qty{color:var(--orange);font-weight:700;}
.add-btn{background:var(--green);color:#fff;border:none;border-radius:8px;width:28px;height:28px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .2s;}
.add-btn:hover{background:var(--gl);}
.add-btn:disabled{background:#E5E7EB;color:#C4C4C4;cursor:default;}
.fab{position:fixed;bottom:72px;left:50%;transform:translateX(-50%);width:var(--w);pointer-events:none;z-index:90;display:flex;justify-content:flex-end;padding:0 14px;}
.fab-btn{pointer-events:all;background:var(--green);color:#fff;border:none;border-radius:50px;padding:10px 18px;display:flex;align-items:center;gap:8px;cursor:pointer;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;box-shadow:0 4px 20px rgba(45,106,79,.45);animation:popIn .25s ease;}
@keyframes popIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
.fab-badge{background:var(--orange);color:#fff;font-size:10px;font-weight:800;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:var(--w);background:#fff;border-top:1px solid #F0F0F0;display:flex;justify-content:space-around;padding:9px 0 max(12px,env(safe-area-inset-bottom));z-index:100;box-shadow:0 -4px 20px rgba(0,0,0,.06);}
.nitem{display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;font-size:9px;color:var(--gray);font-family:'Syne',sans-serif;font-weight:700;letter-spacing:.5px;transition:color .2s;padding:0 10px;}
.nitem.active{color:var(--green);}
.nicon{font-size:20px;}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:300;backdrop-filter:blur(3px);}
.drawer{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:var(--w);background:#fff;border-radius:22px 22px 0 0;z-index:400;padding:20px;max-height:82vh;overflow-y:auto;animation:su .25s ease;}
@keyframes su{from{transform:translateX(-50%) translateY(100%)}to{transform:translateX(-50%) translateY(0)}}
.dhandle{width:38px;height:4px;background:#E5E7EB;border-radius:4px;margin:0 auto 16px;}
.dtitle{font-family:'Syne',sans-serif;font-size:19px;font-weight:800;margin-bottom:14px;}
.ci{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #F5F5F5;}
.ci-img{width:46px;height:46px;border-radius:11px;object-fit:cover;flex-shrink:0;}
.ci-em{font-size:24px;width:46px;height:46px;background:var(--gp);border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.ci-info{flex:1;}
.ci-name{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;}
.ci-price{font-size:11px;color:var(--green);font-weight:600;margin:2px 0;}
.ci-meta{font-size:10px;color:var(--gray);}
.rm-btn{background:none;border:1.5px solid #E5E7EB;border-radius:8px;width:26px;height:26px;cursor:pointer;font-size:12px;color:var(--gray);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.co-btn{width:100%;background:var(--green);color:#fff;border:none;border-radius:14px;padding:14px;font-family:'Syne',sans-serif;font-size:15px;font-weight:700;cursor:pointer;margin-top:10px;}
.detail{position:fixed;top:0;bottom:0;left:50%;transform:translateX(-50%);width:var(--w);background:var(--bg);z-index:450;overflow-y:auto;animation:si .25s ease;}
@keyframes si{from{transform:translateX(calc(-50% + var(--w)))}to{transform:translateX(-50%)}}
@media(max-width:460px){.detail{left:0;transform:none;}@keyframes si{from{transform:translateX(100%)}to{transform:translateX(0)}}}
.dimg{width:100%;height:220px;position:relative;overflow:hidden;}
.dimg img{width:100%;height:100%;object-fit:cover;}
.dimg-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.3) 0%,transparent 60%);}
.back-btn{position:absolute;top:14px;left:14px;background:#fff;border:none;border-radius:11px;width:38px;height:38px;cursor:pointer;font-size:17px;box-shadow:0 2px 10px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;z-index:2;}
.rest-strip{display:flex;align-items:center;gap:10px;padding:12px 16px;background:#fff;border-bottom:1px solid #F0F0F0;}
.rest-strip-img{width:42px;height:42px;border-radius:10px;object-fit:cover;flex-shrink:0;}
.rest-strip-em{width:42px;height:42px;border-radius:10px;background:var(--gp);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}
.rest-strip-name{font-family:'Syne',sans-serif;font-size:13px;font-weight:800;}
.rest-strip-meta{font-size:10px;color:var(--gray);margin-top:2px;line-height:1.4;}
.dbody{padding:16px;}
.dname{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;margin-bottom:4px;}
.dcat{font-size:11px;color:var(--gray);margin-bottom:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.mode-tog{display:flex;background:#F0F4F8;border-radius:12px;padding:3px;margin-bottom:13px;}
.mbtn{flex:1;padding:8px;border:none;border-radius:10px;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;cursor:pointer;transition:all .2s;background:transparent;color:var(--gray);}
.mbtn.active{background:#fff;color:var(--green);box-shadow:0 2px 8px rgba(0,0,0,.08);}
.ichips{display:flex;gap:7px;margin-bottom:13px;}
.ichip{flex:1;background:#fff;border-radius:12px;padding:10px;text-align:center;box-shadow:0 1px 6px rgba(0,0,0,.06);}
.ichip .ico{font-size:16px;margin-bottom:3px;}
.ichip .ilabel{font-size:9px;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;font-weight:600;}
.ichip .ival{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;}
.dsect{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;}
.ddesc{font-size:13px;line-height:1.7;color:#555;margin-bottom:14px;white-space:pre-line;}
.bag-contents{background:#fff;border-radius:14px;padding:12px 14px;margin-bottom:14px;box-shadow:0 1px 6px rgba(0,0,0,.06);}
.bag-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F8F8F8;}
.bag-item:last-child{border-bottom:none;padding-bottom:0;}
.bag-item-img{width:44px;height:44px;border-radius:9px;object-fit:cover;flex-shrink:0;}
.bag-item-name{font-size:12px;font-weight:600;}
.bag-item-sub{font-size:10px;color:var(--gray);margin-top:1px;}
.time-wrap{margin-bottom:13px;}
.time-label{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;}
.time-sel{width:100%;background:#fff;border:1.5px solid #E5E7EB;border-radius:11px;padding:10px 13px;font-family:'DM Sans',sans-serif;font-size:14px;color:var(--dark);outline:none;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 13px center;}
.time-sel:focus{border-color:var(--green);}
.dfooter{display:flex;align-items:center;gap:12px;background:#fff;padding:14px 16px;border-top:1px solid #F0F0F0;position:sticky;bottom:0;}
.dprice .old{font-size:11px;color:#C4C4C4;text-decoration:line-through;}
.dprice .new{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--green);}
.dadd-btn{flex:2;background:var(--green);color:#fff;border:none;border-radius:13px;padding:13px;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;cursor:pointer;}
.dadd-btn:hover{background:var(--gl);}
.page{padding:18px;animation:fu .3s ease;}
.ptitle{font-family:'Syne',sans-serif;font-size:21px;font-weight:800;margin-bottom:3px;}
.psub{font-size:12px;color:var(--gray);margin-bottom:16px;}
.map-wrap{border-radius:16px;overflow:hidden;margin-bottom:16px;box-shadow:0 2px 14px rgba(0,0,0,.1);}
.map-wrap>div{width:100%;height:230px;display:block;}
.area-list{display:flex;flex-direction:column;gap:9px;}
.acard{background:#fff;border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:11px;box-shadow:0 1px 6px rgba(0,0,0,.06);cursor:pointer;transition:transform .18s;}
.acard:hover{transform:translateX(4px);}
.aicon{width:42px;height:42px;border-radius:11px;background:var(--gp);display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;}
.aname{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;}
.acount{font-size:10px;color:var(--gray);}
.ocard{background:#fff;border-radius:14px;padding:14px;margin-bottom:10px;box-shadow:0 2px 10px rgba(0,0,0,.06);}
.otop{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;}
.oname{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;}
.ostatus{font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;background:var(--gp);color:var(--green);}
.ometa{font-size:10px;color:var(--gray);}
.odiv{height:1px;background:#F5F5F5;margin:9px 0;}
.obot{display:flex;justify-content:space-between;align-items:center;}
.oprice{font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:var(--green);}
.rero{background:var(--gp);color:var(--green);border:none;border-radius:9px;padding:6px 12px;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;cursor:pointer;}
.phero{background:var(--green);border-radius:16px;padding:18px;margin-bottom:15px;display:flex;align-items:center;gap:13px;}
.pav{width:56px;height:56px;border-radius:16px;background:var(--yellow);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;}
.pn{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:#fff;}
.pe{font-size:11px;color:rgba(255,255,255,.7);margin-top:2px;}
.ps{font-size:10px;color:rgba(255,255,255,.6);margin-top:2px;}
.srow{display:flex;gap:7px;margin-bottom:15px;}
.sc{flex:1;background:#fff;border-radius:13px;padding:10px 7px;text-align:center;box-shadow:0 1px 6px rgba(0,0,0,.06);}
.sv{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;color:var(--green);}
.sl{font-size:9px;color:var(--gray);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-top:2px;}
.msect{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;}
.mlist{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,.06);margin-bottom:14px;}
.mitem{display:flex;align-items:center;gap:11px;padding:12px 14px;border-bottom:1px solid #F5F5F5;cursor:pointer;transition:background .15s;}
.mitem:last-child{border-bottom:none;}
.mitem:hover{background:#F9FBFA;}
.mico{font-size:17px;width:34px;height:34px;background:var(--bg);border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mlbl{flex:1;font-size:13px;font-weight:500;}
.marr{color:#C4C4C4;font-size:13px;}
.lo-btn{width:100%;background:#fff;border:1.5px solid #FECACA;color:#EF4444;border-radius:13px;padding:13px;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;}
.modal-ov{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:600;display:flex;align-items:center;justify-content:center;padding:20px;}
.modal{background:#fff;border-radius:18px;padding:22px;width:100%;max-width:340px;animation:pi .18s ease;}
@keyframes pi{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
.modal h3{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;margin-bottom:13px;}
.modal .mlabel{font-size:10px;font-weight:700;color:var(--gray);display:block;margin-bottom:4px;font-family:'Syne',sans-serif;text-transform:uppercase;letter-spacing:.5px;}
.modal .minput,.modal .mselect{width:100%;border:1.5px solid #E5E7EB;border-radius:9px;padding:9px 11px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;margin-bottom:10px;color:var(--dark);}
.modal .minput:focus,.modal .mselect:focus{border-color:var(--green);}
.modal-desc{font-size:12px;color:#555;line-height:1.6;margin-bottom:12px;}
.mbtns{display:flex;gap:8px;margin-top:2px;}
.mcancel{flex:1;background:#F5F5F5;border:none;border-radius:9px;padding:11px;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;cursor:pointer;color:var(--gray);}
.msave{flex:2;background:var(--green);border:none;border-radius:9px;padding:11px;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;cursor:pointer;color:#fff;}
.toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:var(--dark);color:#fff;padding:9px 18px;border-radius:40px;font-size:12px;font-weight:500;z-index:999;animation:ta 2.2s ease forwards;white-space:nowrap;max-width:90vw;text-align:center;}
@keyframes ta{0%{opacity:0;transform:translateX(-50%) translateY(8px)}15%{opacity:1;transform:translateX(-50%) translateY(0)}75%{opacity:1}100%{opacity:0}}
`;

function LeafletMap({bags}){const mapRef=useRef(null);const inst=useRef(null);useEffect(()=>{if(inst.current)return;const COORDS={CP:[28.6315,77.2167],"Hauz Khas":[28.5494,77.2001],GK:[28.5391,77.2355],Saket:[28.5244,77.2066],Rajouri:[28.6419,77.1143]};const init=()=>{if(!mapRef.current||inst.current)return;const L=window.L,map=L.map(mapRef.current).setView([28.585,77.19],11);inst.current=map;L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap"}).addTo(map);const grouped={};bags.forEach(b=>{if(!grouped[b.restaurantArea])grouped[b.restaurantArea]=[];grouped[b.restaurantArea].push(b);});Object.entries(grouped).forEach(([area,ab])=>{const c=COORDS[area];if(!c)return;const icon=L.divIcon({html:`<div style="background:#2D6A4F;color:#fff;font-family:sans-serif;font-weight:700;font-size:11px;padding:5px 9px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.3);">${AREA_ICONS[area]||"📍"} ${area} · ${ab.length}</div>`,className:"",iconAnchor:[40,14]});L.marker(c,{icon}).addTo(map).bindPopup(`<b>${area}</b><br>${ab.length} bags tonight`);});};if(!document.getElementById("lf-css")){const l=document.createElement("link");l.id="lf-css";l.rel="stylesheet";l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(l);}window.L?init():(()=>{const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.onload=init;document.body.appendChild(s);})();return()=>{if(inst.current){inst.current.remove();inst.current=null;}};},[bags.length]);return <div ref={mapRef} style={{width:"100%",height:"230px"}} />;}

export default function App(){
  const[tab,setTab]=useState("home");
  const[restaurants,setRestaurants]=useState([]);
  const[bags,setBags]=useState([]);
  const[loading,setLoading]=useState(true);
  const[search,setSearch]=useState("");
  const[areaFilter,setAreaFilter]=useState("All");
  const[typeFilter,setTypeFilter]=useState("All");
  const[vegOnly,setVegOnly]=useState(false);
  const[sortBy,setSortBy]=useState("default");
  const[maxPrice,setMaxPrice]=useState(500);
  const[openDD,setOpenDD]=useState(null);
  const[ddPos,setDdPos]=useState({top:0,left:0});
  const ddRef=useRef(null);
  const[deliveryMode,setDeliveryMode]=useState("pickup");
  const[cart,setCart]=useState([]);
  const[showCart,setShowCart]=useState(false);
  const[selectedBag,setSelectedBag]=useState(null);
  const[selectedTime,setSelectedTime]=useState("");
  const[detailMode,setDetailMode]=useState("pickup");
  const[toast,setToast]=useState(null);
  const[toastKey,setToastKey]=useState(0);
  const[orders,setOrders]=useState([]);
  const[modal,setModal]=useState(null);
  const[profile,setProfile]=useState({name:"Delhi Food Saver",email:"foodsaver@gmail.com"});
  const[profileEdit,setProfileEdit]=useState({name:"",email:""});

  useEffect(()=>{fetchData();},[]);
  useEffect(()=>{const h=e=>{if(ddRef.current&&!ddRef.current.contains(e.target))setOpenDD(null);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);

  async function fetchData(){setLoading(true);const[{data:rests},{data:bagsData}]=await Promise.all([supabase.from("restaurants").select("*"),supabase.from("bags").select("*").eq("is_active",true)]);setRestaurants(rests||[]);setBags(bagsData||[]);setLoading(false);}

  const enriched=bags.map(b=>{const r=restaurants.find(r=>String(r.id)===String(b.restaurant_id))||{};return{...b,restaurantName:r.name||"Unknown",restaurantArea:r.area||"",restaurantCategory:r.category||"",restaurantRating:r.rating||4.0,restaurantImage:r.image_url||"",restaurantDesc:r.description||""};});

  const filtered=enriched.filter(b=>{const q=search.toLowerCase().trim();const ms=q===""||b.restaurantName.toLowerCase().includes(q)||b.restaurantArea.toLowerCase().includes(q)||(b.type||"").toLowerCase().includes(q)||b.restaurantCategory.toLowerCase().includes(q);return ms&&(areaFilter==="All"||b.restaurantArea===areaFilter)&&(typeFilter==="All"||b.type===typeFilter||b.restaurantCategory===typeFilter)&&(!vegOnly||isVeg(b))&&(b.price<=maxPrice);}).sort((a,b)=>{if(sortBy==="price_asc")return a.price-b.price;if(sortBy==="price_desc")return b.price-a.price;if(sortBy==="discount")return((b.original_price-b.price)/b.original_price)-((a.original_price-a.price)/a.original_price);if(sortBy==="rating")return b.restaurantRating-a.restaurantRating;return 0;});

  const hasActiveFilters=areaFilter!=="All"||typeFilter!=="All"||vegOnly||maxPrice<500||sortBy!=="default";
  function clearAll(){setAreaFilter("All");setTypeFilter("All");setVegOnly(false);setMaxPrice(500);setSortBy("default");setSearch("");}

  function openDropdown(name,e){const btn=e.currentTarget.getBoundingClientRect();const appEl=document.querySelector(".app");const ar=appEl?appEl.getBoundingClientRect():{left:0,width:430};let left=btn.left-ar.left;const ddW=name==="price"?240:210;if(left+ddW>ar.width-8)left=ar.width-ddW-8;if(left<8)left=8;setDdPos({top:btn.bottom+6,left:ar.left+left});setOpenDD(openDD===name?null:name);}

  const showToast=msg=>{setToast(msg);setToastKey(k=>k+1);setTimeout(()=>setToast(null),2200);};

  const addToCart=(bag,mode,time)=>{if(bag.quantity===0)return;setCart(prev=>{if(prev.find(i=>i.id===bag.id)){showToast("Already in bag!");return prev;}return[...prev,{...bag,mode:mode||deliveryMode,pickedTime:time||bag.pickup_start,dishImage:getDishImage(bag)}];});showToast("🛍️ Added to bag!");};
  const removeFromCart=id=>setCart(p=>p.filter(i=>i.id!==id));
  const cartTotal=cart.reduce((s,i)=>s+i.price,0);
  const cartSavings=cart.reduce((s,i)=>s+(i.original_price-i.price),0);
  const cartCO2=(cart.length*CO2_PER_BAG).toFixed(1);

  const handleCheckout=()=>{if(!cart.length)return;setOrders(prev=>[...cart.map(item=>({id:`RB${Math.floor(Math.random()*9000)+1000}`,name:item.restaurantName,emoji:EMOJI[item.type]||EMOJI.default,dishImage:item.dishImage,date:"Just now",mode:item.mode==="delivery"?"Delivery":"Pickup",price:item.price,savings:item.original_price-item.price,co2:CO2_PER_BAG})),...prev]);showToast("🎉 Order placed!");setCart([]);setShowCart(false);};

  const totalBags=orders.length,totalSavings=orders.reduce((s,o)=>s+o.savings,0),totalCO2=orders.reduce((s,o)=>s+o.co2,0).toFixed(1),totalSpent=orders.reduce((s,o)=>s+o.price,0);
  const areaCounts=AREAS.filter(a=>a!=="All").map(a=>({name:a,count:enriched.filter(b=>b.restaurantArea===a).length,icon:AREA_ICONS[a]||"📍"}));
  const sortLabels={default:"Sort",price_asc:"Price ↑",price_desc:"Price ↓",discount:"Discount",rating:"Rating"};

  return(<><style>{S}</style>
  <div className="shell"><div className="app">

    {/* STICKY TOP */}
    <div className="sticky-top">
      <div className="header">
        <div className="hrow">
          <div className="logo-wrap"><div className="logo-icon">♻️</div><div className="logo-text">Re<span>Bite</span></div></div>
          <div className="hright">
            <div className={`veg-toggle ${vegOnly?"on":""}`} onClick={()=>setVegOnly(v=>!v)}>
              <div className="veg-dot"/><span className="veg-label">VEG</span>
            </div>
          </div>
        </div>
        <div className="loc"><div className="loc-dot"/>New Delhi, Delhi</div>
        <div className="htitle">Save food, <span>Save money 🌱</span></div>
        <div className="dtoggle">
          <button className={`dtbtn ${deliveryMode==="pickup"?"active":""}`} onClick={()=>setDeliveryMode("pickup")}>🏃 Pickup</button>
          <button className={`dtbtn ${deliveryMode==="delivery"?"active":""}`} onClick={()=>setDeliveryMode("delivery")}>🛵 Delivery</button>
        </div>
      </div>

      <div className="sw">
        <div className="sb">
          <span style={{fontSize:14,color:"#C4C4C4"}}>🔍</span>
          <input placeholder="Search restaurants, cuisines..." value={search} onChange={e=>setSearch(e.target.value)}/>
          {search&&<span style={{cursor:"pointer",color:"#C4C4C4",fontSize:13}} onClick={()=>setSearch("")}>✕</span>}
        </div>
      </div>

      <div className="filter-bar" ref={ddRef}>
        <button className={`filter-pill ${areaFilter!=="All"?"active":""}`} onClick={e=>openDropdown("area",e)}>
          {areaFilter==="All"?"📍 Area":AREA_ICONS[areaFilter]+" "+areaFilter} ▾
        </button>
        <div className="filter-divider"/>
        <button className={`filter-pill ${typeFilter!=="All"?"active":""}`} onClick={e=>openDropdown("type",e)}>
          {typeFilter==="All"?"🍽 Type":EMOJI[typeFilter]+" "+typeFilter} ▾
        </button>
        <div className="filter-divider"/>
        <button className={`filter-pill ${sortBy!=="default"?"active":""}`} onClick={e=>openDropdown("sort",e)}>
          ⇅ {sortLabels[sortBy]} ▾
        </button>
        <div className="filter-divider"/>
        <button className={`filter-pill ${maxPrice<500?"active":""}`} onClick={e=>openDropdown("price",e)}>
          💰 {maxPrice<500?`≤₹${maxPrice}`:"Price"} ▾
        </button>
      </div>

      {tab==="home"&&(
        <div className="results-row">
          <span className="results-count">{loading?"Loading…":`${filtered.length} bags · Delhi`}</span>
          {hasActiveFilters&&<span className="clear-all" onClick={clearAll}>Clear all ✕</span>}
        </div>
      )}
    </div>

    {/* DROPDOWN */}
    {openDD&&(
      <div className="dropdown" style={{top:ddPos.top,left:ddPos.left,width:openDD==="price"?240:210}} onClick={e=>e.stopPropagation()}>
        {openDD==="area"&&(<>
          <div className="dd-header">Select Area</div>
          {AREAS.map(a=><div key={a} className={`dd-opt ${areaFilter===a?"active":""}`} onClick={()=>{setAreaFilter(a);setOpenDD(null);}}>
            <span>{a==="All"?"🗺 All Areas":AREA_ICONS[a]+" "+a}</span><div className="chk">{areaFilter===a&&"✓"}</div>
          </div>)}
        </>)}
        {openDD==="type"&&(<>
          <div className="dd-header">Bag Type</div>
          {TYPES.map(t=><div key={t} className={`dd-opt ${typeFilter===t?"active":""}`} onClick={()=>{setTypeFilter(t);setOpenDD(null);}}>
            <span>{t==="All"?"🛍 All Types":EMOJI[t]+" "+t}</span><div className="chk">{typeFilter===t&&"✓"}</div>
          </div>)}
        </>)}
        {openDD==="sort"&&(<>
          <div className="dd-header">Sort By</div>
          {[["default","✨ Recommended"],["price_asc","Price: Low to High ↑"],["price_desc","Price: High to Low ↓"],["discount","Biggest Discount 🔥"],["rating","Highest Rated ⭐"]].map(([val,label])=>(
            <div key={val} className={`dd-opt ${sortBy===val?"active":""}`} onClick={()=>{setSortBy(val);setOpenDD(null);}}>
              <span>{label}</span>{sortBy===val&&<span>✓</span>}
            </div>
          ))}
        </>)}
        {openDD==="price"&&(<>
          <div className="dd-header">Max Price</div>
          <div className="range-wrap">
            <div className="range-labels"><span>₹50</span><span style={{color:"var(--green)",fontSize:15}}>₹{maxPrice}</span><span>₹500</span></div>
            <input type="range" className="range-input" min={50} max={500} step={25} value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value))}/>
          </div>
          <div className="dd-footer"><button className="dd-clear" onClick={()=>{setMaxPrice(500);setOpenDD(null);}}>Reset</button></div>
        </>)}
      </div>
    )}

    {/* SCROLL BODY */}
    <div className="scroll-body" onClick={()=>openDD&&setOpenDD(null)}>
      {tab==="home"&&(<>
        <div className="urgency"><span style={{fontSize:22}}>⏰</span><div><strong>Tonight's bags filling fast!</strong><span>Pickup 6 PM – 9 PM · Delhi</span></div></div>

        {cart.length>0&&<div className="mbar">
          <div className="mi2"><span className="mi2-ico">♻️</span><div className="mi2-t"><strong>₹{cartSavings}</strong>saved</div></div>
          <div className="mdiv"/>
          <div className="mi2"><span className="mi2-ico">🌱</span><div className="mi2-t"><strong>{cartCO2}kg</strong>CO₂</div></div>
          <div className="mdiv"/>
          <div className="mi2"><span className="mi2-ico">🛍️</span><div className="mi2-t"><strong>{cart.length}</strong>in bag</div></div>
        </div>}

        {loading?(
          <div className="loading"><span className="spin">🌿</span><p style={{marginTop:10,fontFamily:"Syne",fontWeight:700,fontSize:14}}>Loading today's bags...</p></div>
        ):filtered.length===0?(
          <div className="empty"><div className="big">😔</div><p>No bags found</p><span style={{fontSize:12}}>Try different filters</span>{hasActiveFilters&&<div onClick={clearAll} style={{marginTop:12,color:"var(--green)",fontWeight:700,fontSize:13,cursor:"pointer"}}>Clear all filters →</div>}</div>
        ):(
          <div className="grid">
            {filtered.map(bag=>{
              const dishImg=getDishImage(bag);
              const disc=Math.round(((bag.original_price-bag.price)/bag.original_price)*100);
              const veg=isVeg(bag);
              return(
                <div key={bag.id} className="card" onClick={()=>{setSelectedBag(bag);setDetailMode(deliveryMode);setSelectedTime(bag.pickup_start);}}>
                  <div className="cimg-wrap">
                    <img src={dishImg} alt={bag.type} loading="lazy"/>
                    <div className="cbadges">
                      {disc>=50&&bag.quantity>0&&<span className="cbadge">🔥 {disc}%</span>}
                      {bag.quantity<=2&&bag.quantity>0&&<span className="cbadge grn">Last {bag.quantity}</span>}
                    </div>
                    {veg?<div className="veg-ind"><div className="veg-ind-dot"/></div>:<div className="nveg-ind"><div className="nveg-ind-dot"/></div>}
                    {bag.quantity===0&&<div className="sold-over">SOLD OUT</div>}
                  </div>
                  <div className="cbody">
                    <div className="ctop"><div className="cname">{bag.restaurantName}</div><div className="crating">⭐{bag.restaurantRating}</div></div>
                    <div className="ccat">{bag.restaurantArea} · {bag.type}</div>
                    <div className="cbot">
                      <div>
                        <div><span className="pnew">₹{bag.price}</span><span className="pold">₹{bag.original_price}</span></div>
                        <div className="cmeta"><span>🕐{bag.pickup_start}</span>{bag.quantity>0&&<span className="qty">{bag.quantity} left</span>}</div>
                      </div>
                      <button className="add-btn" disabled={bag.quantity===0} onClick={e=>{e.stopPropagation();addToCart(bag,deliveryMode,bag.pickup_start);}}>+</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{height:10}}/>
      </>)}

      {tab==="explore"&&(<div className="page">
        <div className="ptitle">Explore Delhi 🗺️</div>
        <div className="psub">Tap a marker · tap area to filter</div>
        <div className="map-wrap"><LeafletMap bags={enriched}/></div>
        <p style={{fontFamily:"Syne",fontSize:10,fontWeight:700,color:"var(--gray)",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Areas</p>
        <div className="area-list">{areaCounts.map(a=>(
          <div key={a.name} className="acard" onClick={()=>{setAreaFilter(a.name);setTab("home");}}>
            <div className="aicon">{a.icon}</div>
            <div style={{flex:1}}><div className="aname">{a.name}</div><div className="acount">{a.count} bags tonight</div></div>
            <div style={{color:"#C4C4C4",fontSize:14}}>›</div>
          </div>
        ))}</div>
      </div>)}

      {tab==="orders"&&(<div className="page">
        <div className="ptitle">Your Orders 📦</div>
        <div className="psub">Your ReBite history</div>
        {orders.length===0?(<div className="empty"><div className="big">📦</div><p>No orders yet</p><span style={{fontSize:12}}>Reserve a bag!</span></div>)
        :orders.map(o=>(
          <div key={o.id} className="ocard">
            <div className="otop">
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {o.dishImage?<img src={o.dishImage} style={{width:36,height:36,borderRadius:8,objectFit:"cover"}} alt=""/>:<span style={{fontSize:22}}>{o.emoji}</span>}
                <div className="oname">{o.name}</div>
              </div>
              <div className="ostatus">✅ Done</div>
            </div>
            <div className="ometa">{o.date} · {o.mode} · #{o.id} · 🌱{o.co2}kg CO₂</div>
            <div className="odiv"/>
            <div className="obot"><div className="oprice">₹{o.price} <span style={{fontSize:10,color:"var(--gl)",fontWeight:600}}>saved ₹{o.savings}</span></div><button className="rero" onClick={()=>showToast("🔄 Added!")}>Reorder</button></div>
          </div>
        ))}
      </div>)}

      {tab==="profile"&&(<div className="page">
        <div className="phero"><div className="pav">🧑</div><div><div className="pn">{profile.name}</div><div className="pe">{profile.email}</div><div className="ps">🌱 Member since Feb 2026</div></div></div>
        <div className="srow">
          <div className="sc"><div className="sv">{totalBags}</div><div className="sl">Bags</div></div>
          <div className="sc"><div className="sv">₹{totalSavings}</div><div className="sl">Saved</div></div>
          <div className="sc"><div className="sv">{totalCO2}kg</div><div className="sl">CO₂</div></div>
          <div className="sc"><div className="sv">₹{totalSpent}</div><div className="sl">Spent</div></div>
        </div>
        <p className="msect">Account</p>
        <div className="mlist">{[["👤","Edit Profile","editProfile"],["📍","Saved Addresses","address"],["💳","Payment Methods","payment"],["🔔","Notifications","notifications"]].map(([ic,lb,md])=>(
          <div key={lb} className="mitem" onClick={()=>{setProfileEdit({name:profile.name,email:profile.email});setModal({type:md});}}><div className="mico">{ic}</div><div className="mlbl">{lb}</div><div className="marr">›</div></div>
        ))}</div>
        <p className="msect">More</p>
        <div className="mlist">{[["❓","Help & Support","help"],["📄","Terms & Privacy","terms"],["⭐","Rate the App",null],["🤝","Partner with ReBite","partner"]].map(([ic,lb,md])=>(
          <div key={lb} className="mitem" onClick={()=>md?setModal({type:md}):showToast("⭐ Thanks for rating!")}><div className="mico">{ic}</div><div className="mlbl">{lb}</div><div className="marr">›</div></div>
        ))}</div>
        <button className="lo-btn" onClick={()=>showToast("Logged out!")}>Log Out</button>
      </div>)}
    </div>

    {/* FAB */}
    {cart.length>0&&<div className="fab"><button className="fab-btn" onClick={()=>setShowCart(true)}><span style={{fontSize:16}}>🛍️</span><span className="fab-badge">{cart.length}</span><span>View Bag</span><span style={{opacity:.8,fontWeight:500,fontSize:12}}>· ₹{cartTotal}</span></button></div>}

    {/* BOTTOM NAV */}
    <div className="bnav">{[{id:"home",icon:"🏠",label:"Home"},{id:"explore",icon:"🗺️",label:"Explore"},{id:"orders",icon:"📦",label:"Orders"},{id:"profile",icon:"👤",label:"Profile"}].map(n=>(
      <div key={n.id} className={`nitem ${tab===n.id?"active":""}`} onClick={()=>setTab(n.id)}><span className="nicon">{n.icon}</span>{n.label}</div>
    ))}</div>

    {/* CART DRAWER */}
    {showCart&&(<><div className="overlay" onClick={()=>setShowCart(false)}/>
      <div className="drawer">
        <div className="dhandle"/><div className="dtitle">Your Bag 🛍️</div>
        {cart.length===0?(<div className="empty"><div className="big">🛍️</div><p>Empty bag</p></div>):(<>
          {cart.map(item=>(
            <div key={item.id} className="ci">
              {item.dishImage?<img className="ci-img" src={item.dishImage} alt=""/>:<div className="ci-em">{EMOJI[item.type]||EMOJI.default}</div>}
              <div className="ci-info">
                <div className="ci-name">{item.restaurantName}</div>
                <div className="ci-price">₹{item.price} <span style={{color:"#C4C4C4",fontWeight:400,fontSize:10,textDecoration:"line-through"}}>₹{item.original_price}</span></div>
                <div className="ci-meta">{item.mode==="delivery"?"🛵":"🏃"} {item.pickedTime} · {item.type}</div>
              </div>
              <button className="rm-btn" onClick={()=>removeFromCart(item.id)}>✕</button>
            </div>
          ))}
          <div style={{background:"var(--gp)",borderRadius:12,padding:"10px 14px",margin:"12px 0 8px",display:"flex",gap:16}}>
            <div style={{flex:1,textAlign:"center"}}><div style={{fontFamily:"Syne",fontWeight:800,fontSize:15,color:"var(--green)"}}>₹{cartSavings}</div><div style={{fontSize:9,color:"var(--green)",fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>Saved</div></div>
            <div style={{width:1,background:"#B7DFC6"}}/>
            <div style={{flex:1,textAlign:"center"}}><div style={{fontFamily:"Syne",fontWeight:800,fontSize:15,color:"var(--green)"}}>{cartCO2}kg</div><div style={{fontSize:9,color:"var(--green)",fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>CO₂ avoided</div></div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"8px 0 4px"}}><span style={{color:"#6B7280",fontSize:13}}>Total</span><span style={{fontFamily:"Syne",fontWeight:800,fontSize:21,color:"var(--green)"}}>₹{cartTotal}</span></div>
          <button className="co-btn" onClick={handleCheckout}>Proceed to Pay · ₹{cartTotal}</button>
        </>)}
      </div>
    </>)}

    {/* DETAIL VIEW */}
    {selectedBag&&(()=>{
      const dishImg=getDishImage(selectedBag);
      const disc=Math.round(((selectedBag.original_price-selectedBag.price)/selectedBag.original_price)*100);
      const slots=generateTimeSlots(selectedBag.pickup_start,selectedBag.pickup_end);
      const contents=BAG_CONTENTS[selectedBag.type]||BAG_CONTENTS.Meal;
      const veg=isVeg(selectedBag);
      return(
        <div className="detail">
          <div className="dimg">
            <img src={dishImg} alt={selectedBag.type}/>
            <div className="dimg-overlay"/>
            <button className="back-btn" onClick={()=>setSelectedBag(null)}>←</button>
            <div style={{position:"absolute",top:14,right:14,zIndex:2,background:"#fff",borderRadius:4,border:`2px solid ${veg?"#22C55E":"#EF4444"}`,width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:veg?"#22C55E":"#EF4444"}}/>
            </div>
          </div>

          <div className="rest-strip">
            {selectedBag.restaurantImage?<img className="rest-strip-img" src={selectedBag.restaurantImage} alt=""/>:<div className="rest-strip-em">{EMOJI[selectedBag.restaurantCategory]||"🏪"}</div>}
            <div>
              <div className="rest-strip-name">{selectedBag.restaurantName}</div>
              <div className="rest-strip-meta">{selectedBag.restaurantCategory} · {selectedBag.restaurantArea} · ⭐{selectedBag.restaurantRating}<br/>{selectedBag.restaurantDesc?.slice(0,60)}…</div>
            </div>
          </div>

          <div className="dbody">
            <div className="dname">{selectedBag.type} Surprise Bag</div>
            <div className="dcat">
              {veg?<span style={{color:"#22C55E",fontWeight:700}}>🌿 Pure Veg</span>:<span style={{color:"#EF4444",fontWeight:700}}>🍗 Non-Veg</span>}
              <span>·</span><span>{disc}% off · saves ₹{selectedBag.original_price-selectedBag.price}</span>
            </div>
            <div className="mode-tog">
              <button className={`mbtn ${detailMode==="pickup"?"active":""}`} onClick={()=>setDetailMode("pickup")}>🏃 Pickup</button>
              <button className={`mbtn ${detailMode==="delivery"?"active":""}`} onClick={()=>setDetailMode("delivery")}>🛵 Delivery</button>
            </div>
            <div className="ichips">
              <div className="ichip"><div className="ico">📦</div><div className="ilabel">Left</div><div className="ival">{selectedBag.quantity===0?"None":selectedBag.quantity}</div></div>
              <div className="ichip"><div className="ico">💰</div><div className="ilabel">Saving</div><div className="ival">{disc}%</div></div>
              <div className="ichip"><div className="ico">🌱</div><div className="ilabel">CO₂</div><div className="ival">{CO2_PER_BAG}kg</div></div>
            </div>

            <div className="dsect">What's inside this bag 🎁</div>
            <div className="bag-contents">
              {contents.map((item,i)=>(
                <div key={i} className="bag-item">
                  <img className="bag-item-img" src={item.img} alt={item.name} loading="lazy"/>
                  <div><div className="bag-item-name">{item.name}</div><div className="bag-item-sub">{item.sub}</div></div>
                </div>
              ))}
              <div className="bag-item">
                <div style={{width:44,height:44,borderRadius:9,background:"var(--gp)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🎲</div>
                <div><div className="bag-item-name">Surprise Item</div><div className="bag-item-sub">Something extra from the kitchen!</div></div>
              </div>
            </div>

            <div className="time-wrap">
              <div className="time-label">🕐 Select pickup time</div>
              <select className="time-sel" value={selectedTime} onChange={e=>setSelectedTime(e.target.value)}>
                {slots.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="dsect">How it works</div>
            <div className="ddesc">{detailMode==="pickup"?"1. Reserve your bag.\n2. Show order at counter.\n3. Collect at your selected time.\n4. Enjoy! 🌱":"1. Reserve your bag.\n2. Delivery partner picks up.\n3. Arrives in 30–45 mins.\n4. Enjoy! 🌱"}</div>
          </div>

          <div className="dfooter">
            <div className="dprice"><div className="old">₹{selectedBag.original_price}</div><div className="new">₹{selectedBag.price}{detailMode==="delivery"&&<span style={{fontSize:11,fontWeight:500,color:"#888"}}> +₹20</span>}</div></div>
            <button className="dadd-btn" disabled={selectedBag.quantity===0} style={selectedBag.quantity===0?{background:"#E5E7EB",color:"#999",cursor:"default"}:{}} onClick={()=>{addToCart(selectedBag,detailMode,selectedTime);setSelectedBag(null);}}>
              {selectedBag.quantity===0?"Sold Out":detailMode==="delivery"?"Reserve · Delivery 🛵":`Reserve · ${selectedTime} 🏃`}
            </button>
          </div>
        </div>
      );
    })()}

    {/* MODALS */}
    {modal&&(<div className="modal-ov" onClick={()=>setModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
      {modal.type==="editProfile"&&(<><h3>✏️ Edit Profile</h3><label className="mlabel">Name</label><input className="minput" value={profileEdit.name} onChange={e=>setProfileEdit(p=>({...p,name:e.target.value}))} placeholder="Your name"/><label className="mlabel">Email</label><input className="minput" value={profileEdit.email} onChange={e=>setProfileEdit(p=>({...p,email:e.target.value}))} placeholder="Email"/><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setProfile({name:profileEdit.name||profile.name,email:profileEdit.email||profile.email});setModal(null);showToast("✅ Updated!");}}>Save</button></div></>)}
      {modal.type==="address"&&(<><h3>📍 Saved Addresses</h3><label className="mlabel">Home</label><input className="minput" placeholder="e.g. 42, Defence Colony"/><label className="mlabel">Work</label><input className="minput" placeholder="e.g. Cyber Hub, Gurugram"/><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setModal(null);showToast("✅ Saved!");}}>Save</button></div></>)}
      {modal.type==="payment"&&(<><h3>💳 Payment Methods</h3><label className="mlabel">UPI ID</label><input className="minput" placeholder="yourname@upi"/><label className="mlabel">Preferred</label><select className="mselect"><option>UPI</option><option>Card</option><option>Net Banking</option><option>Cash on Pickup</option></select><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setModal(null);showToast("✅ Updated!");}}>Save</button></div></>)}
      {modal.type==="notifications"&&(<><h3>🔔 Notifications</h3><label className="mlabel">Email</label><select className="mselect"><option>All</option><option>Orders only</option><option>Off</option></select><label className="mlabel">Push</label><select className="mselect"><option>Enabled</option><option>Disabled</option></select><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setModal(null);showToast("✅ Updated!");}}>Save</button></div></>)}
      {modal.type==="help"&&(<><h3>❓ Help & Support</h3><p className="modal-desc">Having an issue? We'll respond within 24 hours.</p><label className="mlabel">Message</label><input className="minput" placeholder="Describe your issue..."/><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setModal(null);showToast("✅ Sent!");}}>Send</button></div></>)}
      {modal.type==="terms"&&(<><h3>📄 Terms & Privacy</h3><p className="modal-desc">By using ReBite you agree to our Terms of Service and Privacy Policy. We collect minimal data and never sell it.</p><div className="mbtns"><button className="msave" style={{flex:1}} onClick={()=>setModal(null)}>Got it</button></div></>)}
      {modal.type==="partner"&&(<><h3>🤝 Partner with ReBite</h3><p className="modal-desc">Restaurant, café or bakery in Delhi? Start selling your surplus food!</p><label className="mlabel">Restaurant name</label><input className="minput" placeholder="e.g. My Café, CP"/><label className="mlabel">Phone</label><input className="minput" placeholder="+91 XXXXX XXXXX" type="tel"/><div className="mbtns"><button className="mcancel" onClick={()=>setModal(null)}>Cancel</button><button className="msave" onClick={()=>{setModal(null);showToast("🎉 We'll be in touch!");}}>Submit</button></div></>)}
    </div></div>)}

    {toast&&<div key={toastKey} className="toast">{toast}</div>}
  </div></div></>);
}