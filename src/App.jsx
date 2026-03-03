import{useState,useEffect,useRef}from"react";
import{PieChart,Pie,Cell,BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer}from"recharts";
import{createClient}from"@supabase/supabase-js";

const supabase=createClient("https://prlbenrpgujqbdsdedxz.supabase.co","sb_publishable_8s_rzdF1DPk0YF7NTnuG-w_63MWeYBb");

const EMOJI={Bakery:"🥐",Cafe:"☕","Fine Dining":"🍽️",Buffet:"🍱",Meal:"🍛",Dessert:"🧁",default:"🛍️"};
const AREAS=["All","CP","Hauz Khas","GK","Saket","Rajouri"];
const AREA_ICONS={CP:"🏛️","Hauz Khas":"🌳",GK:"🏘️",Saket:"🎬",Rajouri:"🛍️"};
const TYPES=["All","Bakery","Meal","Dessert","Cafe","Fine Dining","Buffet"];
const CO2_PER_BAG=1.2;
const VEG_TYPES=new Set(["Bakery","Dessert","Cafe"]);
const isVeg=b=>VEG_TYPES.has(b.type);
const getDisc=b=>b.original_price>0?Math.round(((b.original_price-b.price)/b.original_price)*100):0;
const FACTS=["🌍 1/3 of all food produced is wasted","🌱 One ReBite bag saves ~1.2kg CO2","💧 A burger takes 2,400L of water","🇮🇳 India wastes ₹92,000cr of food/year","♻️ Food waste produces methane — 25x worse than CO2","🥗 ReBite saves up to 80% vs menu price"];
const MACROS={Bakery:{cal:420,p:8,c:62,f:16},Meal:{cal:580,p:22,c:75,f:14},Dessert:{cal:350,p:5,c:55,f:14},Cafe:{cal:280,p:6,c:38,f:10},"Fine Dining":{cal:650,p:32,c:45,f:28},Buffet:{cal:780,p:28,c:90,f:22}};
const GOALS={cal:2000,p:60,c:250,f:65};
const BADGES=[{id:"b1",icon:"🌱",name:"First Save",req:1},{id:"b2",icon:"🔥",name:"5 Bags",req:5},{id:"b3",icon:"⭐",name:"10 Bags",req:10},{id:"b4",icon:"💫",name:"3-Day Streak",req:3,type:"streak"},{id:"b5",icon:"🏆",name:"Week Legend",req:7,type:"streak"},{id:"b6",icon:"🌍",name:"Eco Warrior",req:5,type:"co2"},{id:"b7",icon:"🤝",name:"Referrer",req:1,type:"ref"}];
const AREA_COORDS={CP:[28.6315,77.2167],"Hauz Khas":[28.5494,77.2001],GK:[28.5391,77.2355],Saket:[28.5244,77.2066],Rajouri:[28.6419,77.1143]};

const DEMO_R=[
  {id:1,name:"The Pastry House",area:"CP",category:"Bakery",rating:4.5,image_url:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=75"},
  {id:2,name:"Spice Garden",area:"Hauz Khas",category:"Meal",rating:4.2,image_url:"https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&q=75"},
  {id:3,name:"Sweet Escape",area:"GK",category:"Dessert",rating:4.7,image_url:"https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400&q=75"},
  {id:4,name:"Brew Lab",area:"Saket",category:"Cafe",rating:4.3,image_url:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=75"},
  {id:5,name:"The Royal Table",area:"CP",category:"Fine Dining",rating:4.8,image_url:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75"},
  {id:6,name:"Delhi Dawaat",area:"Rajouri",category:"Buffet",rating:4.1,image_url:"https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=75"},
];
const DEMO_B=[
  {id:"b1",restaurant_id:1,type:"Bakery",price:99,original_price:350,quantity:3,pickup_start:"18:00",pickup_end:"21:00",is_active:true},
  {id:"b2",restaurant_id:2,type:"Meal",price:149,original_price:450,quantity:2,pickup_start:"19:00",pickup_end:"21:00",is_active:true},
  {id:"b3",restaurant_id:3,type:"Dessert",price:79,original_price:280,quantity:5,pickup_start:"20:00",pickup_end:"22:00",is_active:true},
  {id:"b4",restaurant_id:4,type:"Cafe",price:129,original_price:400,quantity:1,pickup_start:"17:00",pickup_end:"20:00",is_active:true},
  {id:"b5",restaurant_id:5,type:"Fine Dining",price:299,original_price:1200,quantity:2,pickup_start:"21:00",pickup_end:"23:00",is_active:true},
  {id:"b6",restaurant_id:6,type:"Buffet",price:199,original_price:800,quantity:0,pickup_start:"20:00",pickup_end:"22:00",is_active:true},
];
const DISH_IMG={Bakery:"https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=75",Meal:"https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=75",Dessert:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=75",Cafe:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75","Fine Dining":"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75",Buffet:"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=75"};
const getDImg=b=>DISH_IMG[b.type]||DISH_IMG.Meal;
const getRImg=b=>b.restaurantImage||DEMO_R[0].image_url;
const gSlots=(s,e)=>{if(!s||!e)return["18:00","19:00","20:00","21:00"];const sl=[];const sh=parseInt(s);const eh=parseInt(e);for(let h=sh;h<=eh;h++)sl.push(`${String(h).padStart(2,"0")}:00`);return sl;};

/* ── Hooks ── */
function useCountdown(end){
  const[t,setT]=useState("");const[u,setU]=useState(false);
  useEffect(()=>{
    if(!end)return;
    const tick=()=>{
      const now=new Date();const[h,m]=end.split(":").map(Number);
      const e=new Date();e.setHours(h,m,0,0);
      if(e<now)e.setDate(e.getDate()+1);
      const d=e-now;if(d<=0){setT("Closed");return;}
      const hrs=Math.floor(d/3600000);const mins=Math.floor((d%3600000)/60000);const secs=Math.floor((d%60000)/1000);
      setU(d<3600000);setT(hrs>0?`${hrs}h ${mins}m`:`${mins}m ${secs}s`);
    };
    tick();const iv=setInterval(tick,1000);return()=>clearInterval(iv);
  },[end]);
  return{t,u};
}
function useSocial(id){
  const[v,setV]=useState(()=>Math.floor(Math.random()*8)+2);
  useEffect(()=>{const iv=setInterval(()=>setV(x=>Math.max(1,x+(Math.random()>0.5?1:-1))),5000);return()=>clearInterval(iv);},[id]);
  return v;
}

/* ── Splash ── */
function Splash({onDone}){
  const[ph,setPh]=useState(0);
  useEffect(()=>{const t1=setTimeout(()=>setPh(1),300);const t2=setTimeout(()=>setPh(2),1500);const t3=setTimeout(()=>onDone(),2100);return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};},[]);
  return(
    <div style={{position:"fixed",inset:0,background:"#060d07",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,opacity:ph===2?0:1,transition:ph===2?"opacity 0.5s":"none"}}>
      <div style={{textAlign:"center",opacity:ph===0?0:1,transform:ph===0?"scale(0.7)":"scale(1)",transition:"all 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}>
        <div style={{width:90,height:90,borderRadius:24,background:"linear-gradient(135deg,#F9C74F,#F4845F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,margin:"0 auto 16px",boxShadow:"0 0 80px rgba(249,199,79,0.5)"}}>♻️</div>
        <div style={{fontSize:44,fontWeight:800,color:"#fff",fontFamily:"system-ui,sans-serif",letterSpacing:-2}}>Re<span style={{color:"#52B788"}}>Bite</span></div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",letterSpacing:3,marginTop:8,opacity:ph>=1?1:0,transition:"opacity 0.4s 0.4s",fontFamily:"system-ui"}}>SAVE FOOD · SAVE DELHI</div>
      </div>
    </div>
  );
}

/* ── BagCard ── */
function BagCard({bag,bookmarked,onBm,onAdd,onOpen}){
  const{t,u}=useCountdown(bag.pickup_end);
  const v=useSocial(bag.id);
  const d=getDisc(bag);
  return(
    <div onClick={onOpen} style={{background:"var(--card)",borderRadius:18,overflow:"hidden",border:"1px solid var(--border)",cursor:"pointer",transition:"transform 0.15s",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
      <div style={{height:118,position:"relative",overflow:"hidden"}}>
        <img src={getDImg(bag)} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} loading="lazy"/>
        {t&&bag.quantity>0&&<div style={{position:"absolute",bottom:6,left:6,background:u?"#E23744":"rgba(0,0,0,0.65)",color:"#fff",fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:20,fontFamily:"system-ui",backdropFilter:"blur(4px)"}}>⏱ {t}</div>}
        {v>1&&bag.quantity>0&&<div style={{position:"absolute",top:6,left:6,background:"rgba(0,0,0,0.55)",color:"#fff",fontSize:8,fontWeight:700,padding:"2px 7px",borderRadius:20,backdropFilter:"blur(4px)"}}>👁 {v} viewing</div>}
        {d>=50&&bag.quantity>0&&<div style={{position:"absolute",top:u?28:6,left:6,background:"#E23744",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20}}>{d}% off</div>}
        {bag.quantity>0&&bag.quantity<=2&&<div style={{position:"absolute",top:d>=50?(u?48:28):(u?28:6),left:6,background:"#16A34A",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20}}>Last {bag.quantity}!</div>}
        <button onClick={e=>{e.stopPropagation();onBm();}} style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,0.4)",border:"none",borderRadius:"50%",width:26,height:26,cursor:"pointer",fontSize:13,color:bookmarked?"#EF4444":"rgba(255,255,255,0.8)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>{bookmarked?"♥":"♡"}</button>
        {bag.quantity===0&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:12,fontFamily:"system-ui",letterSpacing:1}}>SOLD OUT</div>}
      </div>
      <div style={{padding:"9px 10px 10px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:2,gap:4}}>
          <div style={{fontWeight:700,fontSize:12,color:"var(--dark)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,fontFamily:"system-ui"}}>{bag.restaurantName}</div>
          <div style={{fontSize:10,fontWeight:700,color:"#fff",background:"#1BA672",borderRadius:5,padding:"2px 6px",flexShrink:0,fontFamily:"system-ui"}}>★{bag.restaurantRating}</div>
        </div>
        <div style={{fontSize:10,color:"var(--gray)",marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{bag.restaurantArea} · {bag.type}</div>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
          <div>
            <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:2}}>
              <span style={{fontWeight:800,fontSize:20,color:"var(--dark)",letterSpacing:-0.6,fontFamily:"system-ui"}}>₹{bag.price}</span>
              <span style={{fontSize:11,color:"var(--gray)",textDecoration:"line-through"}}>₹{bag.original_price}</span>
            </div>
            <div style={{fontSize:9,color:u?"#E23744":"var(--gray)",fontWeight:u?700:400}}>⏱ {t||bag.pickup_start} · {bag.quantity>0?`${bag.quantity} left`:"sold out"}</div>
          </div>
          <button disabled={!bag.quantity} onClick={e=>{e.stopPropagation();onAdd();}} style={{background:"var(--card)",color:"#2D6A4F",border:"2px solid #2D6A4F",borderRadius:9,width:30,height:30,fontSize:20,cursor:bag.quantity?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,opacity:bag.quantity?1:0.4}}>+</button>
        </div>
      </div>
    </div>
  );
}

/* ── Waitlist ── */
function WaitlistModal({bag,onClose,toast}){
  const[ph,setPh]=useState(0);const[num,setNum]=useState("");
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:800,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"var(--card)",borderRadius:"24px 24px 0 0",padding:"20px 18px 36px",width:"100%",maxWidth:430}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:"var(--border)",borderRadius:4,margin:"0 auto 16px"}}/>
        {ph===1?(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:52,marginBottom:12}}>🔔</div>
            <div style={{fontWeight:800,fontSize:17,color:"var(--dark)",fontFamily:"system-ui"}}>You're on the waitlist!</div>
            <div style={{fontSize:13,color:"var(--gray)",marginTop:6}}>We'll text you the moment a bag drops from <b>{bag?.restaurantName}</b></div>
          </div>
        ):(
          <>
            <div style={{fontSize:36,textAlign:"center",marginBottom:8}}>⏰</div>
            <div style={{fontWeight:800,fontSize:17,color:"var(--dark)",textAlign:"center",marginBottom:4,fontFamily:"system-ui"}}>Join Waitlist</div>
            <div style={{fontSize:13,color:"var(--gray)",textAlign:"center",marginBottom:16}}>Get notified when <b>{bag?.restaurantName}</b> drops a new bag</div>
            <input style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:12,padding:"12px 14px",fontSize:14,outline:"none",color:"var(--dark)",background:"var(--bg)",marginBottom:12}} placeholder="+91 98765 43210" value={num} onChange={e=>setNum(e.target.value)} type="tel"/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={onClose} style={{flex:1,background:"var(--bg)",border:"none",borderRadius:12,padding:13,fontWeight:700,cursor:"pointer",color:"var(--gray)",fontFamily:"system-ui"}}>Cancel</button>
              <button onClick={()=>{if(!num.trim())return;setPh(1);toast("🔔 You're on the waitlist!");setTimeout(onClose,2000);}} style={{flex:2,background:"#2D6A4F",border:"none",borderRadius:12,padding:13,fontWeight:700,cursor:"pointer",color:"#fff",fontFamily:"system-ui"}}>🔔 Notify Me</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Blind Bag Modal ── */
function BlindBagModal({bags,onClose,onOrder,toast}){
  const[spin,setSpin]=useState(false);const[chosen,setChosen]=useState(null);const[done,setDone]=useState(false);
  const available=bags.filter(b=>b.quantity>0);
  function doSpin(){
    if(spin||!available.length)return;
    setSpin(true);setChosen(null);
    setTimeout(()=>{
      const pick=available[Math.floor(Math.random()*available.length)];
      setChosen(pick);setSpin(false);
    },2200);
  }
  function confirm(){
    if(!chosen)return;
    onOrder(chosen);setDone(true);
    toast("🎰 Blind Bag ordered! The adventure begins!");
    setTimeout(onClose,2000);
  }
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:900,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"var(--card)",borderRadius:"24px 24px 0 0",padding:"20px 18px 40px",width:"100%",maxWidth:430}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:"var(--border)",borderRadius:4,margin:"0 auto 16px"}}/>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontWeight:800,fontSize:20,color:"var(--dark)",fontFamily:"system-ui"}}>🎰 Blind Bag Mode</div>
          <div style={{fontSize:13,color:"var(--gray)",marginTop:4}}>Pay ₹49 — we pick a mystery bag anywhere in Delhi. Pure food adventure.</div>
        </div>
        {done?(
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{fontSize:56,marginBottom:12}}>🎁</div>
            <div style={{fontWeight:800,fontSize:17,color:"var(--dark)",fontFamily:"system-ui"}}>Adventure unlocked!</div>
            <div style={{fontSize:13,color:"var(--gray)",marginTop:6}}>Check your orders for pickup details</div>
          </div>
        ):(
          <>
            <div style={{height:120,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
              {spin?(
                <div style={{fontSize:64,animation:"spinY 0.15s linear infinite"}}>🎲</div>
              ):chosen?(
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:52,marginBottom:8}}>{EMOJI[chosen.type]||"🛍️"}</div>
                  <div style={{fontWeight:800,fontSize:16,color:"var(--dark)",fontFamily:"system-ui"}}>{chosen.restaurantName}</div>
                  <div style={{fontSize:12,color:"var(--gray)",marginTop:2}}>{chosen.restaurantArea} · {chosen.type}</div>
                  <div style={{fontSize:11,color:"#E23744",fontWeight:700,marginTop:4}}>Originally ₹{chosen.original_price} — yours for ₹49 🤫</div>
                </div>
              ):(
                <div style={{textAlign:"center",color:"var(--gray)"}}>
                  <div style={{fontSize:56,marginBottom:8}}>❓</div>
                  <div style={{fontSize:13}}>Tap spin to reveal your fate</div>
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={doSpin} disabled={spin} style={{flex:1,background:"linear-gradient(135deg,#7C3AED,#4C1D95)",color:"#fff",border:"none",borderRadius:14,padding:14,fontWeight:800,cursor:spin?"default":"pointer",fontFamily:"system-ui",fontSize:14}}>{spin?"Spinning...":"🎰 Spin"}</button>
              {chosen&&<button onClick={confirm} style={{flex:1,background:"#E23744",color:"#fff",border:"none",borderRadius:14,padding:14,fontWeight:800,cursor:"pointer",fontFamily:"system-ui",fontSize:14}}>Order · ₹49 🎁</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Delhi Map Page ── */
function MapPage({bags,enriched,onAreaSelect}){
  const mr=useRef(null);const inst=useRef(null);
  const[area,setArea]=useState("All");
  const filtered=area==="All"?enriched:enriched.filter(b=>b.restaurantArea===area);
  const areaCounts=AREAS.filter(a=>a!=="All").map(a=>({
    name:a,icon:AREA_ICONS[a]||"📍",
    total:enriched.filter(b=>b.restaurantArea===a).length,
    avail:enriched.filter(b=>b.restaurantArea===a&&b.quantity>0).length,
    hot:enriched.filter(b=>b.restaurantArea===a&&b.quantity>0).length>2
  }));

  useEffect(()=>{
    if(inst.current){inst.current.remove();inst.current=null;}
    const init=()=>{
      if(!mr.current)return;
      const L=window.L;
      const m=L.map(mr.current,{zoomControl:false}).setView([28.585,77.19],11);
      inst.current=m;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OSM"}).addTo(m);
      const groups={};
      filtered.forEach(b=>{
        if(!groups[b.restaurantArea])groups[b.restaurantArea]=[];
        groups[b.restaurantArea].push(b);
      });
      Object.entries(groups).forEach(([a,ab])=>{
        const c=AREA_COORDS[a];if(!c)return;
        const avail=ab.filter(b=>b.quantity>0).length;
        const hot=avail>2;
        const ic=L.divIcon({
          html:`<div style="background:${hot?"#E23744":avail>0?"#2D6A4F":"#666"};color:#fff;font-family:system-ui;font-weight:800;font-size:11px;padding:6px 12px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 10px rgba(0,0,0,0.3);border:2px solid rgba(255,255,255,0.3)">${AREA_ICONS[a]||"📍"} ${a} · ${avail} 🛍</div>`,
          className:"",iconAnchor:[50,14]
        });
        L.marker(c,{icon:ic}).addTo(m).on("click",()=>{onAreaSelect(a);});
      });
    };
    if(!document.getElementById("lf-css")){const l=document.createElement("link");l.id="lf-css";l.rel="stylesheet";l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(l);}
    if(window.L)init();else{const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.onload=()=>setTimeout(init,100);document.body.appendChild(s);}
    return()=>{if(inst.current){inst.current.remove();inst.current=null;}};
  },[filtered.length,area]);

  return(
    <div style={{padding:"16px 14px",animation:"fu 0.3s ease"}}>
      <div style={{fontWeight:800,fontSize:20,marginBottom:4,color:"var(--dark)",fontFamily:"system-ui"}}>Delhi Food Map 🗺️</div>
      <div style={{fontSize:12,color:"var(--gray)",marginBottom:12}}>Live bag availability across Delhi</div>
      <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",marginBottom:12,paddingBottom:2}}>
        {["All",...AREAS.filter(a=>a!=="All")].map(a=>(
          <button key={a} onClick={()=>setArea(a)} style={{padding:"6px 13px",borderRadius:20,border:`1.5px solid ${area===a?"#2D6A4F":"var(--border)"}`,background:area===a?"#2D6A4F":"var(--card)",color:area===a?"#fff":"var(--dark)",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"system-ui"}}>
            {a==="All"?"🗺 All":`${AREA_ICONS[a]} ${a}`}
          </button>
        ))}
      </div>
      <div style={{borderRadius:18,overflow:"hidden",marginBottom:14,border:"1px solid var(--border)",boxShadow:"0 4px 20px rgba(0,0,0,0.1)"}}>
        <div ref={mr} style={{width:"100%",height:230}}/>
      </div>
      {/* Heatmap legend */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[["#E23744","🔥 Hot Zone"],["#2D6A4F","✅ Available"],["#666","Sold Out"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"var(--gray)"}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:c}}/>
            {l}
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
        {[[filtered.filter(b=>b.quantity>0).length,"Available","#2D6A4F"],[filtered.length,"Total","var(--dark)"],[filtered.filter(b=>b.quantity===0).length,"Sold Out","#F4845F"]].map(([v,l,c])=>(
          <div key={l} style={{background:"var(--card)",borderRadius:13,padding:"10px 8px",textAlign:"center",border:"1px solid var(--border)"}}>
            <div style={{fontWeight:800,fontSize:20,color:c,fontFamily:"system-ui"}}>{v}</div>
            <div style={{fontSize:9,color:"var(--gray)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{fontWeight:800,fontSize:11,color:"var(--gray)",textTransform:"uppercase",letterSpacing:0.9,marginBottom:10}}>Areas</div>
      {areaCounts.map(a=>(
        <div key={a.name} onClick={()=>onAreaSelect(a.name)} style={{background:"var(--card)",borderRadius:14,padding:"13px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12,cursor:"pointer",border:"1px solid var(--border)"}}>
          <div style={{width:44,height:44,borderRadius:12,background:a.hot?"#FEF2F2":"var(--gp)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{a.hot?"🔥":a.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:14,color:"var(--dark)",fontFamily:"system-ui"}}>{a.name}{a.hot&&<span style={{marginLeft:6,fontSize:9,background:"#E23744",color:"#fff",borderRadius:8,padding:"2px 6px",fontWeight:700}}>HOT</span>}</div>
            <div style={{fontSize:10,color:"var(--gray)",marginTop:2}}>{a.avail} available · {a.total-a.avail} sold out</div>
          </div>
          <div style={{width:10,height:10,borderRadius:"50%",background:a.avail>0?(a.hot?"#E23744":"#22C55E"):"#EF4444",flexShrink:0}}/>
        </div>
      ))}
    </div>
  );
}

/* ── Nutrition Page (from orders only) ── */
function NutritionPage({orders}){
  const bags=orders.filter(o=>o.type&&MACROS[o.type]);
  const today=bags.filter(o=>o.isToday);
  const totals={cal:today.reduce((s,o)=>s+(MACROS[o.type]?.cal||0),0),p:today.reduce((s,o)=>s+(MACROS[o.type]?.p||0),0),c:today.reduce((s,o)=>s+(MACROS[o.type]?.c||0),0),f:today.reduce((s,o)=>s+(MACROS[o.type]?.f||0),0)};
  const pct=k=>Math.min(100,Math.round((totals[k]/GOALS[k])*100));
  const pieData=[{name:"Protein",value:totals.p*4,color:"#52B788"},{name:"Carbs",value:totals.c*4,color:"#F9C74F"},{name:"Fat",value:totals.f*9,color:"#F4845F"}].filter(d=>d.value>0);
  const last7=Array.from({length:7},(_,i)=>{
    const d=new Date();d.setDate(d.getDate()-i);
    const label=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
    const dayOrders=orders.filter(o=>{if(!o.orderedAt)return i===0&&o.isToday;return new Date(o.orderedAt).toDateString()===d.toDateString();});
    return{day:label,cal:dayOrders.reduce((s,o)=>s+(MACROS[o.type]?.cal||0),0)};
  }).reverse();

  return(
    <div style={{padding:"16px 14px",animation:"fu 0.3s ease"}}>
      <div style={{fontWeight:800,fontSize:20,marginBottom:4,color:"var(--dark)",fontFamily:"system-ui"}}>Nutrition from Bags 🥗</div>
      <div style={{fontSize:12,color:"var(--gray)",marginBottom:14}}>Auto-tracked from your ReBite orders</div>

      {today.length===0?(
        <div style={{textAlign:"center",padding:"40px 16px",background:"var(--card)",borderRadius:18,border:"1px solid var(--border)",marginBottom:14}}>
          <div style={{fontSize:48,marginBottom:12}}>🛍️</div>
          <div style={{fontWeight:800,fontSize:15,color:"var(--dark)",fontFamily:"system-ui",marginBottom:6}}>No bags ordered today yet</div>
          <div style={{fontSize:12,color:"var(--gray)"}}>Order a ReBite bag and your nutrition will be tracked automatically here</div>
        </div>
      ):(
        <>
          <div style={{background:"linear-gradient(135deg,#1B4332,#2D6A4F)",borderRadius:20,padding:18,marginBottom:14,display:"flex",alignItems:"center",gap:16}}>
            <div style={{position:"relative",width:88,height:88,flexShrink:0}}>
              <svg viewBox="0 0 88 88" style={{width:88,height:88,transform:"rotate(-90deg)"}}>
                <circle cx={44} cy={44} r={38} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={8}/>
                <circle cx={44} cy={44} r={38} fill="none" stroke="#A7E8C3" strokeWidth={8} strokeDasharray={`${2*Math.PI*38}`} strokeDashoffset={`${2*Math.PI*38*(1-pct("cal")/100)}`} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s ease"}}/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontWeight:800,fontSize:18,color:"#fff",fontFamily:"system-ui"}}>{pct("cal")}</div>
                <div style={{fontSize:8,color:"rgba(255,255,255,0.6)"}}>%</div>
              </div>
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:24,color:"#fff",fontFamily:"system-ui"}}>{totals.cal} kcal</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginBottom:4}}>of {GOALS.cal} daily goal</div>
              <div style={{fontSize:12,color:"#A7E8C3",fontWeight:700}}>{GOALS.cal-totals.cal>0?`${GOALS.cal-totals.cal} kcal remaining`:"Goal reached! 🎉"}</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div style={{background:"var(--card)",borderRadius:16,padding:12,border:"1px solid var(--border)"}}>
              <div style={{fontWeight:800,fontSize:10,color:"var(--gray)",textTransform:"uppercase",letterSpacing:0.7,marginBottom:8}}>Macro Split</div>
              <ResponsiveContainer width="100%" height={90}><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={26} outerRadius={42} paddingAngle={3} dataKey="value">{pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie></PieChart></ResponsiveContainer>
            </div>
            <div style={{background:"var(--card)",borderRadius:16,padding:12,border:"1px solid var(--border)"}}>
              <div style={{fontWeight:800,fontSize:10,color:"var(--gray)",textTransform:"uppercase",letterSpacing:0.7,marginBottom:8}}>7-Day Calories</div>
              <ResponsiveContainer width="100%" height={90}><BarChart data={last7} barSize={7}><XAxis dataKey="day" tick={{fontSize:7,fill:"var(--gray)"}} axisLine={false} tickLine={false}/><YAxis hide/><Bar dataKey="cal" fill="#52B788" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Macro bars */}
      <div style={{background:"var(--card)",borderRadius:16,padding:14,marginBottom:14,border:"1px solid var(--border)"}}>
        {[{k:"p",label:"Protein",color:"#52B788",unit:"g"},{k:"c",label:"Carbs",color:"#F9C74F",unit:"g"},{k:"f",label:"Fat",color:"#F4845F",unit:"g"}].map(m=>(
          <div key={m.k} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontWeight:700,fontSize:12,color:"var(--dark)",fontFamily:"system-ui"}}>{m.label}</span>
              <span style={{fontSize:12,color:"var(--gray)"}}>{totals[m.k]}{m.unit} / {GOALS[m.k]}{m.unit}</span>
            </div>
            <div style={{height:8,background:"var(--bg)",borderRadius:6}}><div style={{height:"100%",width:`${pct(m.k)}%`,background:m.color,borderRadius:6,transition:"width 1s ease"}}/></div>
          </div>
        ))}
      </div>

      {/* Today's bags */}
      {today.length>0&&<>
        <div style={{fontWeight:800,fontSize:11,color:"var(--gray)",textTransform:"uppercase",letterSpacing:0.7,marginBottom:10}}>Bags Consumed Today</div>
        {today.map((o,i)=>(
          <div key={i} style={{background:"var(--card)",borderRadius:13,padding:"11px 13px",marginBottom:8,display:"flex",alignItems:"center",gap:12,border:"1px solid var(--border)"}}>
            <div style={{fontSize:26,flexShrink:0}}>{EMOJI[o.type]||EMOJI.default}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:13,color:"var(--dark)",fontFamily:"system-ui"}}>{o.name}</div>
              <div style={{fontSize:10,color:"var(--gray)",marginTop:2}}>P:{MACROS[o.type]?.p||0}g · C:{MACROS[o.type]?.c||0}g · F:{MACROS[o.type]?.f||0}g</div>
            </div>
            <div style={{fontWeight:800,fontSize:15,color:"var(--dark)",fontFamily:"system-ui"}}>{MACROS[o.type]?.cal||0}<span style={{fontSize:9,color:"var(--gray)",fontWeight:400}}> kcal</span></div>
          </div>
        ))}
      </>}

      {/* All-time stats */}
      <div style={{fontWeight:800,fontSize:11,color:"var(--gray)",textTransform:"uppercase",letterSpacing:0.7,marginBottom:10,marginTop:6}}>All-Time Nutrition Stats</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[
          ["🔥",orders.reduce((s,o)=>s+(MACROS[o.type]?.cal||0),0).toLocaleString(),"Total kcal from bags"],
          ["💪",orders.reduce((s,o)=>s+(MACROS[o.type]?.p||0),0)+"g","Total Protein"],
          ["📦",orders.length,"Bags ordered"],
          ["🌱",(orders.length*CO2_PER_BAG).toFixed(1)+"kg","CO2 Saved"],
        ].map(([ic,v,l])=>(
          <div key={l} style={{background:"var(--card)",borderRadius:14,padding:"12px 14px",border:"1px solid var(--border)"}}>
            <div style={{fontSize:22,marginBottom:4}}>{ic}</div>
            <div style={{fontWeight:800,fontSize:18,color:"var(--dark)",fontFamily:"system-ui"}}>{v}</div>
            <div style={{fontSize:10,color:"var(--gray)",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── You Page (Profile + Rewards + Refer) ── */
function YouPage({orders,streak,dark,setDark,showToast,notifPerm,onEnableNotif,addresses,activeAddr,setActiveAddr,setAddresses}){
  const[sub,setSub]=useState("home");
  const tBags=orders.length;

  const tSavings=orders.reduce((s,o)=>s+o.savings,0);
  const tCO2=(orders.length*CO2_PER_BAG).toFixed(1);
  const points=tBags*100+Math.floor(tSavings/10)*5;
  const level=points<500?"Sprout 🌱":points<1500?"Saver 🌿":points<3000?"Hero 🌳":"Legend 🏆";
  const nextLv=points<500?500:points<1500?1500:points<3000?3000:9999;
  const pct=Math.min(100,Math.round((points/nextLv)*100));
  const referralCode="REBITE-"+["K7X2","M3Z9","P5Q1","R8W4"][Math.floor(Math.random()*4)];
  const[myCode]=useState(referralCode);
  const earned=["b1","b2","b4"].filter((_,i)=>tBags>=([1,5,3][i])||(i===2&&streak>=3));

  if(sub!=="home")return(
    <div style={{padding:"16px 14px",animation:"fu 0.3s ease"}}>
      <button onClick={()=>setSub("home")} style={{background:"none",border:"none",color:"#2D6A4F",fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:14,display:"flex",alignItems:"center",gap:6,padding:0,fontFamily:"system-ui"}}>← Back</button>
      {sub==="rewards"&&<>
        <div style={{fontWeight:800,fontSize:20,marginBottom:4,color:"var(--dark)",fontFamily:"system-ui"}}>Rewards 🏆</div>
        <div style={{background:"linear-gradient(135deg,#7C3AED,#4C1D95)",borderRadius:20,padding:18,marginBottom:14,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",width:180,height:180,background:"rgba(255,255,255,0.05)",borderRadius:"50%",top:-60,right:-40}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div><div style={{fontSize:11,color:"rgba(255,255,255,0.6)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.7}}>Level</div><div style={{fontWeight:800,fontSize:22,color:"#fff",fontFamily:"system-ui"}}>{level}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontWeight:800,fontSize:30,color:"#F9C74F",fontFamily:"system-ui",lineHeight:1}}>{points}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.6)"}}>ReBite Points</div></div>
          </div>
          <div style={{height:8,background:"rgba(255,255,255,0.2)",borderRadius:6,marginBottom:6}}><div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#F9C74F,#F4845F)",borderRadius:6,transition:"width 1s ease"}}/></div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>+100 pts per bag · +5 pts per ₹10 saved</div>
        </div>
        <div style={{background:"var(--card)",borderRadius:16,padding:14,marginBottom:14,border:"1px solid var(--border)"}}>
          <div style={{fontWeight:800,fontSize:11,color:"var(--gray)",textTransform:"uppercase",letterSpacing:0.7,marginBottom:12}}>Daily Streak 🔥 {streak}</div>
          <div style={{display:"flex",gap:6,justifyContent:"space-between"}}>
            {["M","T","W","T","F","S","S"].map((d,i)=>(
              <div key={i} style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:9,color:"var(--gray)",marginBottom:4}}>{d}</div>
                <div style={{width:"100%",aspectRatio:"1",borderRadius:"50%",background:i<streak?"#2D6A4F":i===streak?"transparent":"var(--bg)",border:`2px solid ${i<streak?"#2D6A4F":i===streak?"#2D6A4F":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff"}}>{i<streak?"✓":""}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{fontWeight:800,fontSize:11,color:"var(--gray)",textTransform:"uppercase",letterSpacing:0.7,marginBottom:10}}>Badges</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
          {[{icon:"🌱",name:"First Save"},{icon:"🔥",name:"5 Bags"},{icon:"⭐",name:"10 Bags"},{icon:"💫",name:"3-Day"},{icon:"🏆",name:"Week"},{icon:"🌍",name:"Eco"},{icon:"🤝",name:"Referrer"},{icon:"🎰",name:"Blind Bag"}].map((b,i)=>(
            <div key={b.name} style={{background:i<earned.length?"var(--gp)":"var(--card)",borderRadius:14,padding:"10px 6px",textAlign:"center",border:`1px solid ${i<earned.length?"#2D6A4F":"var(--border)"}`,opacity:i<earned.length?1:0.45}}>
              <div style={{fontSize:22,marginBottom:4,filter:i<earned.length?"none":"grayscale(1)"}}>{b.icon}</div>
              <div style={{fontWeight:700,fontSize:8,color:i<earned.length?"#2D6A4F":"var(--gray)",lineHeight:1.3,fontFamily:"system-ui"}}>{b.name}</div>
            </div>
          ))}
        </div>
        <div style={{fontWeight:800,fontSize:11,color:"var(--gray)",textTransform:"uppercase",letterSpacing:0.7,marginBottom:10}}>Redeem Points</div>
        {[[500,"₹25 off next bag","🎁"],[1000,"Free delivery","🛵"],[2000,"₹100 + priority access","👑"]].map(([req,desc,ic])=>(
          <div key={req} style={{background:"var(--card)",borderRadius:13,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12,border:"1px solid var(--border)",opacity:points>=req?1:0.5}}>
            <div style={{fontSize:22}}>{ic}</div>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:"var(--dark)",fontFamily:"system-ui"}}>{desc}</div><div style={{fontSize:10,color:"var(--gray)"}}>{req} points needed</div></div>
            <button disabled={points<req} onClick={()=>showToast(points>=req?"🎉 Redeemed!":"Need more points")} style={{background:points>=req?"#2D6A4F":"var(--border)",color:points>=req?"#fff":"var(--gray)",border:"none",borderRadius:10,padding:"7px 12px",fontWeight:700,fontSize:10,cursor:points>=req?"pointer":"default",fontFamily:"system-ui"}}>{points>=req?"Redeem":"Locked"}</button>
          </div>
        ))}
      </>}
      {sub==="refer"&&<>
        <div style={{fontWeight:800,fontSize:20,marginBottom:4,color:"var(--dark)",fontFamily:"system-ui"}}>Refer & Earn 🤝</div>
        <div style={{background:"linear-gradient(135deg,#1B4332,#2D6A4F)",borderRadius:20,padding:20,marginBottom:14,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",width:150,height:150,background:"rgba(255,255,255,0.06)",borderRadius:"50%",top:-50,right:-30}}/>
          <div style={{fontWeight:700,fontSize:13,color:"rgba(255,255,255,0.7)",marginBottom:4}}>Your referral code</div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{fontWeight:800,fontSize:26,color:"#F9C74F",letterSpacing:2,fontFamily:"system-ui"}}>{myCode}</div>
            <button onClick={()=>{navigator.clipboard.writeText(myCode);showToast("📋 Code copied!");}} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:9,padding:"6px 12px",color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"system-ui"}}>Copy</button>
          </div>
          <button onClick={()=>{const msg=`🌱 Save food & money with ReBite!\n\nSurprise bags from Delhi's best restaurants at 80% off.\n\nUse code *${myCode}* for ₹50 off!\n\nrebite.vercel.app`;if(navigator.share)navigator.share({title:"ReBite",text:msg});else{navigator.clipboard.writeText(msg);showToast("📋 Copied!");}}} style={{width:"100%",background:"#F9C74F",color:"#1B4332",border:"none",borderRadius:13,padding:13,fontWeight:800,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"system-ui"}}>📤 Share with Friends · Earn ₹50</button>
        </div>
        <div style={{background:"var(--card)",borderRadius:16,padding:14,border:"1px solid var(--border)"}}>
          {[["1️⃣","Share your code","Send to friends via WhatsApp"],["2️⃣","Friend signs up","They use your code"],["3️⃣","They order","Their first bag"],["4️⃣","You earn","₹50 credited instantly"]].map(([n,t,d])=>(
            <div key={t} style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start"}}>
              <div style={{fontSize:18,flexShrink:0}}>{n}</div>
              <div><div style={{fontWeight:700,fontSize:12,color:"var(--dark)",fontFamily:"system-ui"}}>{t}</div><div style={{fontSize:11,color:"var(--gray)",marginTop:2}}>{d}</div></div>
            </div>
          ))}
        </div>
      </>}
      {sub==="notifs"&&<>
        <div style={{fontWeight:800,fontSize:20,marginBottom:4,color:"var(--dark)",fontFamily:"system-ui"}}>Notifications 🔔</div>
        {notifPerm!=="granted"?(
          <div style={{background:"linear-gradient(135deg,#2D6A4F,#1B4332)",borderRadius:16,padding:16,marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:28}}>🔔</div>
            <div style={{flex:1}}><div style={{fontWeight:800,fontSize:13,color:"#fff",fontFamily:"system-ui"}}>Enable Push Notifications</div><div style={{fontSize:11,color:"rgba(255,255,255,0.7)"}}>Get alerted when bags drop near you</div></div>
            <button onClick={onEnableNotif} style={{background:"#F9C74F",color:"#1B4332",border:"none",borderRadius:10,padding:"8px 12px",fontWeight:800,fontSize:11,cursor:"pointer",fontFamily:"system-ui"}}>Enable</button>
          </div>
        ):(
          <div style={{background:"var(--gp)",borderRadius:13,padding:"12px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8,border:"1px solid rgba(45,106,79,0.2)"}}><span style={{fontSize:14}}>✅</span><span style={{fontWeight:700,fontSize:12,color:"#2D6A4F",fontFamily:"system-ui"}}>Push notifications are enabled!</span></div>
        )}
        <div style={{background:"var(--card)",borderRadius:16,padding:14,border:"1px solid var(--border)"}}>
          <div style={{fontWeight:800,fontSize:11,color:"var(--gray)",textTransform:"uppercase",letterSpacing:0.7,marginBottom:12}}>What you'll get notified about</div>
          {[["🛍️","New bag drops","Whenever a restaurant adds bags in your area"],["🔥","Flash deals","Limited-time 90% off alerts"],["⏰","Last-minute","When bags are about to close with low stock"],["🏆","Badges","When you unlock new achievements"]].map(([ic,t,d])=>(
            <div key={t} style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start"}}>
              <div style={{fontSize:20}}>{ic}</div>
              <div><div style={{fontWeight:700,fontSize:12,color:"var(--dark)",fontFamily:"system-ui"}}>{t}</div><div style={{fontSize:11,color:"var(--gray)",marginTop:2}}>{d}</div></div>
            </div>
          ))}
        </div>
      </>}
      {sub==="addrmgmt"&&<>
        <div style={{fontWeight:800,fontSize:20,marginBottom:4,color:"var(--dark)",fontFamily:"system-ui"}}>My Addresses 📍</div>
        <div style={{fontSize:12,color:"var(--gray)",marginBottom:16}}>Manage your delivery addresses</div>
        <AddrPicker addresses={addresses} activeAddr={activeAddr} setActiveAddr={idx=>{setActiveAddr(idx);showToast("📍 Default address updated!");}} setAddresses={setAddresses} onClose={()=>{}} toast={showToast} inline={true}/>
      </>}
      {sub==="orders"&&<>
        <div style={{fontWeight:800,fontSize:20,marginBottom:4,color:"var(--dark)",fontFamily:"system-ui"}}>My Orders 📦</div>
        {orders.length===0?(
          <div style={{textAlign:"center",padding:"40px 16px",color:"var(--gray)"}}><div style={{fontSize:48,marginBottom:12}}>📦</div><div style={{fontWeight:700,fontSize:15,color:"var(--dark)",fontFamily:"system-ui"}}>No orders yet</div></div>
        ):orders.map(o=>(
          <div key={o.id} style={{background:"var(--card)",borderRadius:14,padding:13,marginBottom:9,border:"1px solid var(--border)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:24}}>{EMOJI[o.type]||EMOJI.default}</span>
                <div style={{fontWeight:700,fontSize:13,color:"var(--dark)",fontFamily:"system-ui"}}>{o.name}</div>
              </div>
              <div style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:14,background:"var(--gp)",color:"#2D6A4F",fontFamily:"system-ui"}}>✅ Done</div>
            </div>
            <div style={{fontSize:10,color:"var(--gray)"}}>#{o.id} · {o.mode} · {o.date}</div>
            <div style={{height:1,background:"var(--border)",margin:"9px 0"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><span style={{fontWeight:800,fontSize:16,color:"var(--dark)",fontFamily:"system-ui"}}>₹{o.price}</span><span style={{fontSize:10,color:"#16A34A",fontWeight:700,marginLeft:8}}>saved ₹{o.savings}</span></div>
              <button onClick={()=>showToast("♻️ Reordered!")} style={{background:"var(--gp)",color:"#2D6A4F",border:"none",borderRadius:9,padding:"6px 11px",fontWeight:700,fontSize:10,cursor:"pointer",fontFamily:"system-ui"}}>Reorder</button>
            </div>
          </div>
        ))}
      </>}
    </div>
  );

  return(
    <div style={{padding:"16px 14px",animation:"fu 0.3s ease"}}>
      <div style={{background:"linear-gradient(135deg,#2D6A4F,#1e4d38)",borderRadius:20,padding:18,marginBottom:14,display:"flex",alignItems:"center",gap:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",width:120,height:120,background:"rgba(255,255,255,0.07)",borderRadius:"50%",top:-30,right:-20}}/>
        <div style={{width:58,height:58,borderRadius:18,background:"linear-gradient(135deg,#F9C74F,#F4845F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>🧑</div>
        <div>
          <div style={{fontWeight:800,fontSize:18,color:"#fff",fontFamily:"system-ui"}}>Delhi Food Saver</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:2}}>foodsaver@gmail.com</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:2}}>🔥 {streak} day streak · Level: {level}</div>
        </div>
      </div>
      <div style={{display:"flex",gap:7,marginBottom:16}}>
        {[[tBags,"Bags","📦"],[`₹${tSavings}`,"Saved","💰"],[`${tCO2}kg`,"CO2","🌱"]].map(([v,l,ic])=>(
          <div key={l} style={{flex:1,background:"var(--card)",borderRadius:13,padding:"10px 6px",textAlign:"center",border:"1px solid var(--border)"}}>
            <div style={{fontSize:16,marginBottom:2}}>{ic}</div>
            <div style={{fontWeight:800,fontSize:15,color:"#2D6A4F",fontFamily:"system-ui"}}>{v}</div>
            <div style={{fontSize:9,color:"var(--gray)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.4}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{background:"var(--card)",borderRadius:16,overflow:"hidden",marginBottom:14,border:"1px solid var(--border)"}}>
        {[["🏆","Rewards & Streaks","rewards"],["🤝","Refer & Earn ₹50","refer"],["🔔","Notifications","notifs"],["📦","My Orders","orders"],["📍","My Addresses","addrmgmt"]].map(([ic,lb,id])=>(
          <div key={lb} onClick={()=>setSub(id)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderBottom:"1px solid var(--border)",cursor:"pointer"}}>
            <div style={{fontSize:17,width:36,height:36,background:"var(--bg)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{ic}</div>
            <div style={{flex:1,fontSize:13,fontWeight:600,color:"var(--dark)"}}>{lb}</div>
            <div style={{color:"var(--gray)",fontSize:16}}>›</div>
          </div>
        ))}
      </div>
      <div style={{background:"var(--card)",borderRadius:16,padding:14,marginBottom:14,border:"1px solid var(--border)"}}>
        <div style={{fontWeight:800,fontSize:11,color:"var(--gray)",textTransform:"uppercase",letterSpacing:0.7,marginBottom:12}}>Preferences</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:600,color:"var(--dark)"}}>🌙 Dark Mode</span>
          <button onClick={()=>setDark(d=>!d)} style={{width:46,height:24,borderRadius:12,background:dark?"#2D6A4F":"var(--border)",position:"relative",cursor:"pointer",border:"none",transition:"background 0.2s"}}>
            <div style={{position:"absolute",top:3,left:dark?24:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Reviews ── */
function Reviews({bagId}){
  const[reviews,setReviews]=useState([{id:1,user:"Priya S.",rating:5,text:"Amazing value! 4 croissants and a loaf of bread.",time:"2 days ago",helpful:12},{id:2,user:"Rahul M.",rating:4,text:"Fresh food, great quantity. Will order again!",time:"5 days ago",helpful:7}]);
  const[showForm,setShowForm]=useState(false);const[nr,setNr]=useState({rating:5,text:""});
  const avg=(reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1);
  return(
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div>
          <div style={{fontWeight:800,fontSize:10,color:"var(--gray)",textTransform:"uppercase",letterSpacing:0.7}}>Reviews</div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
            <span style={{fontWeight:800,fontSize:18,color:"var(--dark)",fontFamily:"system-ui"}}>{avg}</span>
            {"★★★★★".split("").map((s,i)=><span key={i} style={{color:i<Math.round(avg)?"#F59E0B":"var(--border)",fontSize:13}}>{s}</span>)}
            <span style={{fontSize:10,color:"var(--gray)"}}>({reviews.length})</span>
          </div>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} style={{background:"var(--gp)",color:"#2D6A4F",border:"none",borderRadius:10,padding:"7px 12px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"system-ui"}}>{showForm?"Cancel":"✏️ Review"}</button>
      </div>
      {showForm&&(
        <div style={{background:"var(--sh)",borderRadius:14,padding:12,marginBottom:12,border:"1.5px solid var(--border)"}}>
          <div style={{display:"flex",gap:6,marginBottom:10}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setNr(p=>({...p,rating:n}))} style={{background:"none",border:"none",fontSize:26,cursor:"pointer",filter:n<=nr.rating?"none":"grayscale(1)"}}>{n<=nr.rating?"⭐":"☆"}</button>)}</div>
          <textarea style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:9,padding:"9px 11px",fontSize:12,color:"var(--dark)",background:"var(--card)",outline:"none",resize:"none",fontFamily:"system-ui"}} rows={3} placeholder="Share your experience..." value={nr.text} onChange={e=>setNr(p=>({...p,text:e.target.value}))}/>
          <button onClick={()=>{if(!nr.text.trim())return;setReviews(p=>[{id:Date.now(),user:"You",rating:nr.rating,text:nr.text,time:"Just now",helpful:0},...p]);setNr({rating:5,text:""});setShowForm(false);}} style={{marginTop:8,width:"100%",background:"#2D6A4F",color:"#fff",border:"none",borderRadius:10,padding:"11px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"system-ui"}}>Submit Review</button>
        </div>
      )}
      {reviews.map(r=>(
        <div key={r.id} style={{background:"var(--card)",borderRadius:13,padding:"11px 13px",marginBottom:8,border:"1px solid var(--border)"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <div><div style={{fontWeight:700,fontSize:12,color:"var(--dark)",fontFamily:"system-ui"}}>{r.user}</div><div style={{display:"flex",gap:1,marginTop:2}}>{"★★★★★".split("").map((s,i)=><span key={i} style={{color:i<r.rating?"#F59E0B":"var(--border)",fontSize:10}}>{s}</span>)}</div></div>
            <span style={{fontSize:9,color:"var(--gray)"}}>{r.time}</span>
          </div>
          <div style={{fontSize:12,color:"var(--gray)",lineHeight:1.7,marginBottom:6}}>{r.text}</div>
          <button onClick={()=>setReviews(p=>p.map(rev=>rev.id===r.id?{...rev,helpful:rev.helpful+1}:rev))} style={{background:"none",border:"1px solid var(--border)",borderRadius:8,padding:"3px 9px",fontSize:9,color:"var(--gray)",cursor:"pointer",fontWeight:700}}>👍 Helpful ({r.helpful})</button>
        </div>
      ))}
    </div>
  );
}



/* ── Address Picker Modal ── */
function AddrPicker({addresses,activeAddr,setActiveAddr,setAddresses,onClose,toast,inline=false}){
  const[addMode,setAddMode]=useState(false);
  const[form,setForm]=useState({label:"",icon:"🏠",line1:"",line2:""});
  const labelOpts=[["🏠","Home"],["🏢","Work"],["❤️","Partner"],["👨‍👩‍👧","Family"],["🏋️","Gym"],["📍","Other"]];
  function save(){
    if(!form.label||!form.line1)return;
    const newA={id:Date.now(),...form,isDefault:false};
    setAddresses(p=>[...p,newA]);
    toast("📍 Address saved!");
    setAddMode(false);setForm({label:"",icon:"🏠",line1:"",line2:""});
  }
  function setDefault(idx){setActiveAddr(idx);toast("📍 Delivery address updated!");onClose();}
  function removeAddr(idx){setAddresses(p=>p.filter((_,i)=>i!==idx));if(activeAddr>=idx&&activeAddr>0)setActiveAddr(activeAddr-1);}
  if(inline){
    return(
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          {!addMode&&<button onClick={()=>setAddMode(true)} style={{background:"#2D6A4F",color:"#fff",border:"none",borderRadius:10,padding:"7px 13px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"system-ui"}}>+ Add New</button>}
          {addMode&&<button onClick={()=>setAddMode(false)} style={{background:"none",border:"1px solid var(--border)",borderRadius:10,padding:"7px 13px",fontWeight:700,fontSize:12,cursor:"pointer",color:"var(--gray)",fontFamily:"system-ui"}}>← Back</button>}
        </div>
        {addMode?(
          <div>
            <div style={{marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:11,color:"var(--gray)",textTransform:"uppercase",letterSpacing:0.7,marginBottom:8}}>Type</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {labelOpts.map(([ic,lb])=>(
                  <button key={lb} onClick={()=>setForm(p=>({...p,icon:ic,label:lb}))} style={{padding:"7px 13px",borderRadius:20,border:`1.5px solid ${form.label===lb?"#2D6A4F":"var(--border)"}`,background:form.label===lb?"#2D6A4F":"var(--card)",color:form.label===lb?"#fff":"var(--dark)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"system-ui",display:"flex",alignItems:"center",gap:5}}>{ic} {lb}</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:10}}>
              <input value={form.line1} onChange={e=>setForm(p=>({...p,line1:e.target.value}))} style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:12,padding:"12px 14px",fontSize:13,outline:"none",color:"var(--dark)",background:"var(--bg)",fontFamily:"system-ui",marginBottom:8}} placeholder="Street / Building (e.g. B-42, Vasant Kunj)"/>
              <input value={form.line2} onChange={e=>setForm(p=>({...p,line2:e.target.value}))} style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:12,padding:"12px 14px",fontSize:13,outline:"none",color:"var(--dark)",background:"var(--bg)",fontFamily:"system-ui"}} placeholder="Area / Pincode (e.g. New Delhi - 110070)"/>
            </div>
            <button onClick={save} style={{width:"100%",background:"#2D6A4F",color:"#fff",border:"none",borderRadius:12,padding:13,fontWeight:800,cursor:"pointer",fontFamily:"system-ui",marginTop:4}}>💾 Save Address</button>
          </div>
        ):(
          addresses.map((a,i)=>(
            <div key={a.id||i} style={{background:i===activeAddr?"var(--gp)":"var(--card)",borderRadius:14,padding:"13px 14px",marginBottom:10,border:`1.5px solid ${i===activeAddr?"#2D6A4F":"var(--border)"}`,cursor:"pointer"}} onClick={()=>setActiveAddr(i)}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:40,height:40,borderRadius:12,background:i===activeAddr?"#2D6A4F":"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{a.icon}</div>
                <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}><span style={{fontWeight:800,fontSize:14,color:"var(--dark)",fontFamily:"system-ui"}}>{a.label}</span>{i===activeAddr&&<span style={{fontSize:9,background:"#2D6A4F",color:"#fff",borderRadius:8,padding:"2px 7px",fontWeight:700}}>DEFAULT</span>}</div><div style={{fontSize:11,color:"var(--gray)"}}>{a.line1} · {a.line2}</div></div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>{i===activeAddr&&<span style={{fontSize:18,color:"#2D6A4F"}}>✓</span>}{addresses.length>1&&<button onClick={e=>{e.stopPropagation();removeAddr(i);}} style={{background:"none",border:"1px solid var(--border)",borderRadius:8,width:26,height:26,cursor:"pointer",fontSize:12,color:"var(--gray)",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}</div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }
  return(
    <div style={{position:"fixed",inset:0,zIndex:850,display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={onClose}>
      <div style={{background:"rgba(0,0,0,0.5)",position:"absolute",inset:0,backdropFilter:"blur(4px)"}}/>
      <div style={{background:"var(--card)",borderRadius:"24px 24px 0 0",padding:"20px 16px 36px",maxHeight:"85vh",overflowY:"auto",position:"relative",zIndex:1}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:"var(--border)",borderRadius:4,margin:"0 auto 18px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontWeight:800,fontSize:18,color:"var(--dark)",fontFamily:"system-ui"}}>{addMode?"Add New Address":"Delivery Address 📍"}</div>
          {!addMode&&<button onClick={()=>setAddMode(true)} style={{background:"#2D6A4F",color:"#fff",border:"none",borderRadius:10,padding:"7px 13px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"system-ui"}}>+ Add</button>}
        </div>
        {addMode?(
          <div>
            <div style={{marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:11,color:"var(--gray)",textTransform:"uppercase",letterSpacing:0.7,marginBottom:8}}>Type</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {labelOpts.map(([ic,lb])=>(
                  <button key={lb} onClick={()=>setForm(p=>({...p,icon:ic,label:lb}))} style={{padding:"7px 13px",borderRadius:20,border:`1.5px solid ${form.label===lb?"#2D6A4F":"var(--border)"}`,background:form.label===lb?"#2D6A4F":"var(--card)",color:form.label===lb?"#fff":"var(--dark)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"system-ui",display:"flex",alignItems:"center",gap:5}}>{ic} {lb}</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:10}}>
              <div style={{fontWeight:700,fontSize:11,color:"var(--gray)",textTransform:"uppercase",letterSpacing:0.7,marginBottom:6}}>Street / Building</div>
              <input value={form.line1} onChange={e=>setForm(p=>({...p,line1:e.target.value}))} style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:12,padding:"12px 14px",fontSize:13,outline:"none",color:"var(--dark)",background:"var(--bg)",fontFamily:"system-ui"}} placeholder="e.g. B-42, Vasant Kunj"/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:11,color:"var(--gray)",textTransform:"uppercase",letterSpacing:0.7,marginBottom:6}}>Area / Pincode</div>
              <input value={form.line2} onChange={e=>setForm(p=>({...p,line2:e.target.value}))} style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:12,padding:"12px 14px",fontSize:13,outline:"none",color:"var(--dark)",background:"var(--bg)",fontFamily:"system-ui"}} placeholder="e.g. New Delhi - 110070"/>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setAddMode(false)} style={{flex:1,background:"var(--bg)",border:"none",borderRadius:12,padding:13,fontWeight:700,cursor:"pointer",color:"var(--gray)",fontFamily:"system-ui"}}>Cancel</button>
              <button onClick={save} style={{flex:2,background:"#2D6A4F",color:"#fff",border:"none",borderRadius:12,padding:13,fontWeight:800,cursor:"pointer",fontFamily:"system-ui"}}>💾 Save Address</button>
            </div>
          </div>
        ):(
          addresses.map((a,i)=>(
            <div key={a.id||i} style={{background:i===activeAddr?"var(--gp)":"var(--card)",borderRadius:14,padding:"13px 14px",marginBottom:10,border:`1.5px solid ${i===activeAddr?"#2D6A4F":"var(--border)"}`,cursor:"pointer"}} onClick={()=>setDefault(i)}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:40,height:40,borderRadius:12,background:i===activeAddr?"#2D6A4F":"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{a.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                    <span style={{fontWeight:800,fontSize:14,color:"var(--dark)",fontFamily:"system-ui"}}>{a.label}</span>
                    {i===activeAddr&&<span style={{fontSize:9,background:"#2D6A4F",color:"#fff",borderRadius:8,padding:"2px 7px",fontWeight:700}}>DEFAULT</span>}
                  </div>
                  <div style={{fontSize:12,color:"var(--gray)"}}>{a.line1}</div>
                  <div style={{fontSize:11,color:"var(--gray)"}}>{a.line2}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {i===activeAddr&&<span style={{fontSize:18,color:"#2D6A4F"}}>✓</span>}
                  {addresses.length>1&&<button onClick={e=>{e.stopPropagation();removeAddr(i);}} style={{background:"none",border:"1px solid var(--border)",borderRadius:8,width:26,height:26,cursor:"pointer",fontSize:12,color:"var(--gray)",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


/* ── Live Order Tracker ── */
function LiveTracker({order,step,onDismiss}){
  const steps=["Order Confirmed","Restaurant Preparing","Ready for Pickup!"];
  const colors=["#F9C74F","#F4845F","#2D6A4F"];
  const icons=["✅","👨‍🍳","🎉"];
  return(
    <div style={{position:"absolute",bottom:90,left:14,right:14,background:"var(--card)",borderRadius:20,padding:16,border:`2px solid ${colors[step]||"#2D6A4F"}`,boxShadow:"0 8px 32px rgba(0,0,0,0.18)",zIndex:300,animation:"fu 0.3s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <div style={{fontWeight:800,fontSize:13,color:"var(--dark)",fontFamily:"system-ui"}}>🛍️ {order.name}</div>
          <div style={{fontSize:11,color:"var(--gray)",marginTop:2}}>Order #{order.id}</div>
        </div>
        <button onClick={onDismiss} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"var(--gray)",padding:0}}>✕</button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:10}}>
        {steps.map((s,i)=>(
          <div key={s} style={{display:"flex",alignItems:"center",flex:i<steps.length-1?1:"none"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:i<=step?colors[i]:"var(--border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,transition:"all 0.4s"}}>{i<=step?icons[i]:"·"}</div>
              <div style={{fontSize:8,fontWeight:700,color:i<=step?colors[i]:"var(--gray)",textAlign:"center",width:50,lineHeight:1.2}}>{s}</div>
            </div>
            {i<steps.length-1&&<div style={{flex:1,height:2,background:i<step?colors[i]:"var(--border)",margin:"0 2px 16px",transition:"all 0.4s"}}/>}
          </div>
        ))}
      </div>
      <div style={{background:`${colors[step]||"#2D6A4F"}20`,borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>{icons[step]||"🎉"}</span>
        <span style={{fontSize:12,fontWeight:700,color:colors[step]||"#2D6A4F",fontFamily:"system-ui"}}>{step<steps.length?steps[step]:"Enjoy your meal! 😋"}</span>
      </div>
    </div>
  );
}


/* ════════════════════════════════
   FEATURE: Group Order Mode
════════════════════════════════ */
function GroupOrderModal({bag,onClose,toast}){
  const[link]=useState("rebite.app/g/"+Math.random().toString(36).slice(2,8).toUpperCase());
  const[members]=useState([{name:"You",avatar:"🧑",paid:true},{name:"Priya",avatar:"👩",paid:false},{name:"Rahul",avatar:"👨",paid:false}]);
  const[copied,setCopied]=useState(false);
  function copyLink(){navigator.clipboard?.writeText("https://"+link);setCopied(true);toast("🔗 Group link copied!");setTimeout(()=>setCopied(false),2000);}
  return(
    <div style={{position:"fixed",inset:0,zIndex:900,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div style={{background:"rgba(0,0,0,0.55)",position:"absolute",inset:0,backdropFilter:"blur(4px)"}}/>
      <div style={{background:"var(--card)",borderRadius:"24px 24px 0 0",padding:"20px 16px 36px",width:"100%",maxWidth:430,position:"relative",zIndex:1,margin:"0 auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:"var(--border)",borderRadius:4,margin:"0 auto 16px"}}/>
        <div style={{fontWeight:800,fontSize:18,color:"var(--dark)",fontFamily:"system-ui",marginBottom:4}}>👥 Group Order</div>
        <div style={{fontSize:12,color:"var(--gray)",marginBottom:16}}>Split a bag with friends — each pays their share</div>
        <div style={{background:"var(--gp)",borderRadius:14,padding:"12px 14px",marginBottom:14,border:"1px solid rgba(45,106,79,0.2)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontWeight:700,fontSize:13,color:"var(--dark)"}}>{bag?.restaurantName}</div>
            <span style={{fontWeight:800,fontSize:14,color:"#2D6A4F",fontFamily:"system-ui"}}>₹{bag?.price}</span>
          </div>
          <div style={{fontSize:11,color:"var(--gray)",marginTop:2}}>{bag?.type} bag · Split 3 ways = ₹{Math.ceil((bag?.price||0)/3)}/person</div>
        </div>
        <div style={{marginBottom:14}}>
          {members.map((m,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{m.avatar}</div>
              <div style={{flex:1}}><span style={{fontWeight:700,fontSize:13,color:"var(--dark)"}}>{m.name}</span>{i===0&&<span style={{fontSize:9,color:"var(--gray)"}}> (you)</span>}</div>
              <div style={{fontSize:10,fontWeight:800,padding:"3px 10px",borderRadius:20,background:m.paid?"#DCFCE7":"#FEF2F2",color:m.paid?"#16A34A":"#E23744"}}>{m.paid?"Paid":"Pending"}</div>
            </div>
          ))}
        </div>
        <div style={{background:"var(--bg)",borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1,fontSize:11,color:"var(--gray)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{link}</div>
          <button onClick={copyLink} style={{background:"#2D6A4F",color:"#fff",border:"none",borderRadius:9,padding:"7px 13px",fontWeight:700,fontSize:11,cursor:"pointer",flexShrink:0,fontFamily:"system-ui"}}>{copied?"Copied!":"Copy"}</button>
        </div>
        <button onClick={onClose} style={{width:"100%",background:"#E23744",color:"#fff",border:"none",borderRadius:14,padding:13,fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"system-ui"}}>🚀 Launch Group Order</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   FEATURE: AI Chef suggestions
════════════════════════════════ */
function AIChefModal({bag,onClose}){
  const[loading,setLoading]=useState(true);
  const[recipes,setRecipes]=useState([]);
  const items={Bakery:"croissants, bread, pastries",Meal:"dal, sabzi, rice, roti",Dessert:"cake, mithai, cookies",Cafe:"sandwich, muffin, coffee",Fine_Dining:"starter, main course",Buffet:"mixed veg, paneer, rice"}[bag?.type?.replace(" ","_")]||"assorted food";
  const mock=[
    {name:"French Toast Twist",time:"15 min",emoji:"🍞",steps:["Dip bread in egg+milk","Pan-fry golden","Drizzle honey & serve"]},
    {name:"Leftover Khichdi Bowl",time:"20 min",emoji:"🍚",steps:["Mix rice & dal together","Jeera tadka on top","Add pickle & ghee"]},
    {name:"Stuffed Paratha Roll",time:"25 min",emoji:"🫓",steps:["Mash leftover sabzi","Stuff into roti","Pan-fry with butter"]},
  ];
  useState(()=>{const t=setTimeout(()=>{setRecipes(mock);setLoading(false);},1800);return()=>clearTimeout(t);});
  return(
    <div style={{position:"fixed",inset:0,zIndex:900,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div style={{background:"rgba(0,0,0,0.55)",position:"absolute",inset:0,backdropFilter:"blur(4px)"}}/>
      <div style={{background:"var(--card)",borderRadius:"24px 24px 0 0",padding:"20px 16px 36px",width:"100%",maxWidth:430,position:"relative",zIndex:1,margin:"0 auto",maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:"var(--border)",borderRadius:4,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
          <div style={{width:42,height:42,borderRadius:13,background:"linear-gradient(135deg,#F9C74F,#F4845F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🤖</div>
          <div><div style={{fontWeight:800,fontSize:17,color:"var(--dark)",fontFamily:"system-ui"}}>AI Chef</div><div style={{fontSize:11,color:"var(--gray)"}}>Based on your {bag?.type} bag</div></div>
        </div>
        <div style={{background:"var(--gp)",borderRadius:11,padding:"8px 12px",marginBottom:14,border:"1px solid rgba(45,106,79,0.15)"}}>
          <span style={{fontSize:11,color:"#2D6A4F",fontWeight:700}}>📦 Bag contents: </span><span style={{fontSize:11,color:"var(--gray)"}}>{items}</span>
        </div>
        {loading?(
          <div style={{textAlign:"center",padding:"30px 0"}}>
            <div style={{fontSize:40,marginBottom:10,display:"inline-block",animation:"spinY 1.2s linear infinite"}}>🤖</div>
            <div style={{fontSize:13,color:"var(--gray)",fontWeight:700}}>Cooking up ideas...</div>
          </div>
        ):recipes.map((r,i)=>(
          <div key={i} style={{background:"var(--card)",borderRadius:14,padding:13,marginBottom:10,border:"1px solid var(--border)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{fontSize:26}}>{r.emoji}</div>
              <div><div style={{fontWeight:800,fontSize:14,color:"var(--dark)",fontFamily:"system-ui"}}>{r.name}</div><div style={{fontSize:10,color:"var(--gray)"}}>{r.time}</div></div>
            </div>
            {r.steps.map((s,j)=>(
              <div key={j} style={{display:"flex",gap:8,marginBottom:5,alignItems:"flex-start"}}>
                <div style={{width:17,height:17,borderRadius:"50%",background:"#2D6A4F",color:"#fff",fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>{j+1}</div>
                <div style={{fontSize:12,color:"var(--gray)",lineHeight:1.5}}>{s}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════
   FEATURE: Delhi Leaderboard
════════════════════════════════ */
function LeaderboardPage({orders,streak}){
  const myScore=orders.length*100+streak*50;
  const board=[
    {name:"Aditi K.",area:"Hauz Khas",score:2840,bags:28,isYou:false},
    {name:"Vikram S.",area:"CP",score:2210,bags:22,isYou:false},
    {name:"Meera P.",area:"GK",score:1950,bags:19,isYou:false},
    {name:"You",area:"Saket",score:myScore,bags:orders.length,isYou:true},
    {name:"Rohan T.",area:"Rajouri",score:890,bags:9,isYou:false},
    {name:"Sneha M.",area:"Saket",score:750,bags:7,isYou:false},
  ].sort((a,b)=>b.score-a.score).map((e,i)=>({...e,rank:i+1}));
  const myRank=board.find(b=>b.isYou)?.rank||4;
  const medal=i=>i===0?"🥇":i===1?"🥈":i===2?"🥉":"";
  return(
    <div style={{padding:"16px 14px",animation:"fu 0.3s ease"}}>
      <div style={{fontWeight:800,fontSize:20,marginBottom:4,color:"var(--dark)",fontFamily:"system-ui"}}>Delhi Leaderboard 🏆</div>
      <div style={{fontSize:12,color:"var(--gray)",marginBottom:14}}>Top food savers this week</div>
      <div style={{background:"linear-gradient(135deg,#7C3AED,#4C1D95)",borderRadius:18,padding:16,marginBottom:14,display:"flex",gap:14,alignItems:"center"}}>
        <div style={{width:52,height:52,borderRadius:16,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🧑</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:15,color:"#fff",fontFamily:"system-ui"}}>Your Rank: #{myRank}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:2}}>{myScore} pts · {orders.length} bags</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.5)"}}>to climb next</div>
          <div style={{fontWeight:800,fontSize:18,color:"#F9C74F",fontFamily:"system-ui"}}>{Math.max(0,(board[myRank-2]?.score||0)-myScore)} pts</div>
        </div>
      </div>
      {board.map((p,i)=>(
        <div key={i} style={{background:p.isYou?"var(--gp)":"var(--card)",borderRadius:14,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12,border:p.isYou?"1.5px solid #2D6A4F":"1px solid var(--border)"}}>
          <div style={{width:30,height:30,borderRadius:10,background:i<3?"linear-gradient(135deg,#F9C74F,#F4845F)":"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:i<3?18:12,fontWeight:700,color:i<3?"":"var(--gray)",flexShrink:0}}>{i<3?medal(i):p.rank}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontWeight:800,fontSize:14,color:"var(--dark)",fontFamily:"system-ui"}}>{p.name}</span>
              {p.isYou&&<span style={{fontSize:8,background:"#2D6A4F",color:"#fff",borderRadius:8,padding:"2px 6px",fontWeight:700}}>YOU</span>}
            </div>
            <div style={{fontSize:10,color:"var(--gray)",marginTop:1}}>{p.area} · {p.bags} bags</div>
          </div>
          <div style={{fontWeight:800,fontSize:16,color:p.isYou?"#2D6A4F":"var(--dark)",fontFamily:"system-ui"}}>{p.score}<span style={{fontSize:9,fontWeight:400,color:"var(--gray)"}}>pts</span></div>
        </div>
      ))}
      <div style={{textAlign:"center",padding:"10px 0 4px",fontSize:11,color:"var(--gray)"}}>Resets every Monday 🗓</div>
    </div>
  );
}

/* ════════════════════════════════
   FEATURE: ReBite for Offices (B2B)
════════════════════════════════ */
function OfficesPage({onClose,toast}){
  const[done,setDone]=useState(false);
  const[form,setForm]=useState({company:"",size:"",email:""});
  const plans=[
    {name:"Starter",price:"₹4,999/mo",bags:20,color:"#2D6A4F",perks:["20 bags/month","2 locations","WhatsApp alerts"]},
    {name:"Growth",price:"₹9,999/mo",bags:50,color:"#7C3AED",perks:["50 bags/month","5 locations","Priority picks","ESG report"]},
    {name:"Enterprise",price:"Custom",bags:"∞",color:"#E23744",perks:["Unlimited bags","All Delhi offices","Account manager","Carbon credits"]},
  ];
  return(
    <div style={{position:"fixed",inset:0,zIndex:800,background:"var(--bg)",overflowY:"auto"}}>
      <div style={{background:"linear-gradient(135deg,#1B4332,#2D6A4F)",padding:"14px 14px 22px"}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.18)",border:"none",borderRadius:10,padding:"6px 12px",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",marginBottom:12,fontFamily:"system-ui"}}>← Back</button>
        <div style={{fontWeight:800,fontSize:22,color:"#fff",fontFamily:"system-ui"}}>ReBite for Offices 🏢</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.7)",marginTop:4}}>Feed your team. Save food. Earn ESG credits.</div>
      </div>
      <div style={{padding:14}}>
        {plans.map(p=>(
          <div key={p.name} style={{background:"var(--card)",borderRadius:16,padding:15,marginBottom:10,border:`2px solid ${p.color}22`,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",width:60,height:60,background:p.color,borderRadius:"50%",top:-20,right:-10,opacity:0.08}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div><div style={{fontWeight:800,fontSize:15,color:"var(--dark)",fontFamily:"system-ui"}}>{p.name}</div><div style={{fontWeight:800,fontSize:18,color:p.color,fontFamily:"system-ui"}}>{p.price}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:22,fontWeight:800,color:p.color,fontFamily:"system-ui"}}>{p.bags}</div><div style={{fontSize:9,color:"var(--gray)"}}>bags/mo</div></div>
            </div>
            {p.perks.map(pk=>(
              <div key={pk} style={{display:"flex",gap:7,alignItems:"center",marginBottom:4}}>
                <div style={{width:14,height:14,borderRadius:"50%",background:p.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",flexShrink:0}}>✓</div>
                <span style={{fontSize:11,color:"var(--gray)"}}>{pk}</span>
              </div>
            ))}
          </div>
        ))}
        {done?(
          <div style={{textAlign:"center",padding:"28px 16px",background:"var(--card)",borderRadius:18,border:"1px solid var(--border)"}}>
            <div style={{fontSize:48,marginBottom:12}}>🎉</div>
            <div style={{fontWeight:800,fontSize:16,color:"var(--dark)",fontFamily:"system-ui"}}>We'll be in touch!</div>
            <div style={{fontSize:12,color:"var(--gray)",marginTop:6}}>Our team will reach out within 24 hours</div>
          </div>
        ):(
          <div style={{background:"var(--card)",borderRadius:16,padding:16,border:"1px solid var(--border)"}}>
            <div style={{fontWeight:800,fontSize:14,color:"var(--dark)",marginBottom:12,fontFamily:"system-ui"}}>Request a Demo</div>
            <input value={form.company} onChange={e=>setForm(p=>({...p,company:e.target.value}))} style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:12,padding:"11px 13px",fontSize:13,color:"var(--dark)",background:"var(--bg)",outline:"none",marginBottom:8,fontFamily:"system-ui"}} placeholder="Company name"/>
            <input value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} type="email" style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:12,padding:"11px 13px",fontSize:13,color:"var(--dark)",background:"var(--bg)",outline:"none",marginBottom:8,fontFamily:"system-ui"}} placeholder="Work email"/>
            <select value={form.size} onChange={e=>setForm(p=>({...p,size:e.target.value}))} style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:12,padding:"11px 13px",fontSize:13,color:"var(--dark)",background:"var(--bg)",outline:"none",marginBottom:12,fontFamily:"system-ui"}}>
              <option value="">Team size</option>
              {["1-10","11-50","51-200","200+"].map(s=><option key={s}>{s} employees</option>)}
            </select>
            <button onClick={()=>{if(!form.company||!form.email)return;setDone(true);toast("🏢 Demo requested! We'll call soon");}} style={{width:"100%",background:"#2D6A4F",color:"#fff",border:"none",borderRadius:13,padding:14,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"system-ui"}}>Request Demo →</button>
          </div>
        )}
      </div>
    </div>
  );
}


/* ── SavedCard (extracted to avoid hook-in-map) ── */
function SavedCard({bag,onRemove,onOpen}){
  const{t,u}=useCountdown(bag.pickup_end);
  const d=getDisc(bag);
  return(
    <div onClick={onOpen} style={{background:"var(--card)",borderRadius:16,overflow:"hidden",border:"1px solid var(--border)",marginBottom:10,cursor:"pointer",display:"flex",height:86}}>
      <img src={getDImg(bag)} alt="" style={{width:86,height:86,objectFit:"cover",flexShrink:0}}/>
      <div style={{padding:"10px 12px",flex:1,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:700,fontSize:13,color:"var(--dark)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"system-ui",flex:1}}>{bag.restaurantName}</div>
          <button onClick={e=>{e.stopPropagation();onRemove();}} style={{background:"none",border:"none",color:"#EF4444",fontSize:16,cursor:"pointer",flexShrink:0,padding:0}}>♥</button>
        </div>
        <div style={{fontSize:10,color:"var(--gray)"}}>{bag.restaurantArea} · {bag.type}</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontWeight:800,fontSize:16,color:"var(--dark)",fontFamily:"system-ui"}}>₹{bag.price}</span>
          <span style={{fontSize:10,color:"var(--gray)",textDecoration:"line-through"}}>₹{bag.original_price}</span>
          {d>0&&<span style={{fontSize:9,fontWeight:800,color:"#16A34A",background:"#DCFCE7",borderRadius:5,padding:"1px 5px"}}>{d}%</span>}
          {t&&<span style={{marginLeft:"auto",fontSize:9,color:u?"#E23744":"var(--gray)",fontWeight:u?700:400}}>⏱ {t}</span>}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   MAIN APP
════════════════════════════════ */
export default function App(){
  const[splashDone,setSplashDone]=useState(false);
  const[dark,setDark]=useState(false);
  const[tab,setTab]=useState("home");
  const[restaurants,setRestaurants]=useState(DEMO_R);
  const[bags,setBags]=useState(DEMO_B);
  const[bookmarks,setBookmarks]=useState(new Set(["b1","b3"]));
  const[orders,setOrders]=useState([]);
  const[streak,setStreak]=useState(3);
  const[cart,setCart]=useState([]);
  const[showCart,setShowCart]=useState(false);
  const[selBag,setSelBag]=useState(null);
  const[selTime,setSelTime]=useState("");
  const[mode,setMode]=useState("pickup");
  const[addr,setAddr]=useState("");
  const[toast,setToast]=useState(null);const[toastK,setToastK]=useState(0);
  const[search,setSearch]=useState("");
  const[areaFilter,setAreaFilter]=useState("All");
  const[typeFilter,setTypeFilter]=useState("All");
  const[vegOnly,setVegOnly]=useState(false);
  const[sortBy,setSortBy]=useState("default");
  const[maxPrice,setMaxPrice]=useState(500);
  const[openDD,setOpenDD]=useState(null);
  const[ddPos,setDdPos]=useState({top:0,left:0,width:200});
  const[waitBag,setWaitBag]=useState(null);
  const[showBlind,setShowBlind]=useState(false);
  const[notifPerm,setNotifPerm]=useState(typeof Notification!=="undefined"?Notification.permission:"default");
  const[flashSale,setFlashSale]=useState(null);
  const[flashTimer,setFlashTimer]=useState(0);
  const[showAddrPicker,setShowAddrPicker]=useState(false);
  const[liveOrder,setLiveOrder]=useState(null);
  const[liveStep,setLiveStep]=useState(0);
  const[showGroup,setShowGroup]=useState(false);
  const[showAIChef,setShowAIChef]=useState(false);
  const[showOffices,setShowOffices]=useState(false);
  const[addresses,setAddresses]=useState([
    {id:1,label:"Home",icon:"🏠",line1:"B-42, Vasant Kunj",line2:"New Delhi - 110070",isDefault:true},
    {id:2,label:"Work",icon:"🏢",line1:"Connaught Place, Block A",line2:"New Delhi - 110001",isDefault:false},
  ]);
  const[activeAddr,setActiveAddr]=useState(0);
  const ddRef=useRef(null);
  const scrollRef=useRef(null);
  const[showScrollTop,setShowScrollTop]=useState(false);

  useEffect(()=>{
    (async()=>{
      try{
        const[{data:r},{data:b}]=await Promise.all([supabase.from("restaurants").select("*"),supabase.from("bags").select("*").eq("is_active",true)]);
        if(r&&r.length>0)setRestaurants(r);
        if(b&&b.length>0)setBags(b);
      }catch(e){console.log("Demo mode");}
    })();
  },[]);

  // Flash sale every 3 mins
  useEffect(()=>{
    const iv=setInterval(()=>{
      const pick=DEMO_B.filter(b=>b.quantity>0)[Math.floor(Math.random()*4)];
      if(pick){setFlashSale(pick);setFlashTimer(600);}
    },180000);
    return()=>clearInterval(iv);
  },[]);
  useEffect(()=>{
    if(!flashSale||flashTimer<=0)return;
    const iv=setInterval(()=>setFlashTimer(t=>{if(t<=1){setFlashSale(null);return 0;}return t-1;}),1000);
    return()=>clearInterval(iv);
  },[flashSale]);

  const showToast=m=>{setToast(m);setToastK(k=>k+1);setTimeout(()=>setToast(null),2400);};
  const toggleBm=bagId=>{setBookmarks(p=>{const n=new Set(p);if(n.has(bagId)){n.delete(bagId);showToast("🔖 Removed");}else{n.add(bagId);showToast("🔖 Saved!");}return n;});};

  async function handleNotif(){
    if(typeof Notification==="undefined")return;
    const p=await Notification.requestPermission();
    setNotifPerm(p);
    if(p==="granted"){showToast("🔔 Notifications enabled!");new Notification("Welcome to ReBite! 🌱",{body:"You'll get alerts when bags drop near you"});}
    else showToast("Permission denied");
  }

  const enriched=bags.map(b=>{
    const r=restaurants.find(r=>String(r.id)===String(b.restaurant_id))||{};
    return{...b,restaurantName:r.name||"Unknown",restaurantArea:r.area||"",restaurantCategory:r.category||"",restaurantRating:Number(r.rating)||4.0,restaurantImage:r.image_url||""};
  });

  const filtered=enriched.filter(b=>{
    if(search.trim()){const h=[b.restaurantName,b.restaurantArea,b.type].join(" ").toLowerCase();if(!h.includes(search.toLowerCase()))return false;}
    if(areaFilter!=="All"&&b.restaurantArea!==areaFilter)return false;
    if(typeFilter!=="All"&&b.type!==typeFilter)return false;
    if(vegOnly&&!isVeg(b))return false;
    if(Number(b.price)>maxPrice)return false;
    return true;
  }).sort((a,b)=>{
    if(sortBy==="price_asc")return a.price-b.price;
    if(sortBy==="price_desc")return b.price-a.price;
    if(sortBy==="discount")return getDisc(b)-getDisc(a);
    if(sortBy==="rating")return b.restaurantRating-a.restaurantRating;
    return 0;
  });

  const hasFilters=areaFilter!=="All"||typeFilter!=="All"||vegOnly||maxPrice<500||sortBy!=="default"||!!search;
  function clearAll(){setSearch("");setAreaFilter("All");setTypeFilter("All");setVegOnly(false);setMaxPrice(500);setSortBy("default");setOpenDD(null);}
  function openDropdown(name,e){
    e.stopPropagation();
    const btn=e.currentTarget.getBoundingClientRect();
    const app=document.querySelector(".rapp");
    const ar=app?app.getBoundingClientRect():{left:0,width:window.innerWidth};
    const w=name==="price"?220:200;
    let l=btn.left-ar.left;
    if(l+w>ar.width-8)l=ar.width-w-8;
    if(l<4)l=4;
    setDdPos({top:btn.bottom+4,left:ar.left+l,width:w});
    setOpenDD(prev=>prev===name?null:name);
  }

  function addToCart(bag,m,time,a){
    if(!bag.quantity)return;
    if(cart.find(i=>i.id===bag.id)){showToast("Already in bag!");return;}
    setCart(p=>[...p,{...bag,mode:m,pickedTime:time,deliveryAddr:a,dishImg:getDImg(bag)}]);
    showToast("🛍️ Added to bag!");
  }
  const removeFromCart=id=>setCart(p=>p.filter(i=>i.id!==id));
  const cartTotal=cart.reduce((s,i)=>s+Number(i.price),0);
  const cartSavings=cart.reduce((s,i)=>s+(Number(i.original_price)-Number(i.price)),0);

  function checkout(){
    if(!cart.length)return;
    const newOrders=cart.map(i=>({
      id:`RB${Math.floor(Math.random()*9000)+1000}`,
      name:i.restaurantName,type:i.type,
      date:"Today",isToday:true,
      mode:i.mode==="delivery"?"Delivery":"Pickup",
      price:Number(i.price),savings:Number(i.original_price)-Number(i.price),
      co2:CO2_PER_BAG,orderedAt:new Date().toISOString()
    }));
    setOrders(p=>[...newOrders,...p]);
    setStreak(s=>s+1);
    showToast("🎉 Order placed! (+100 pts)");
    setLiveOrder(newOrders[0]);setLiveStep(0);
    setCart([]);setShowCart(false);
    // Simulate order progress
    [1000,4000,8000].forEach((ms,i)=>setTimeout(()=>setLiveStep(i+1),ms));
    setTimeout(()=>setLiveOrder(null),12000);
  }


  const tSavings=orders.reduce((s,o)=>s+o.savings,0);
  const tCO2=(orders.length*CO2_PER_BAG).toFixed(1);

  if(!splashDone)return(
    <div style={{fontFamily:"system-ui,sans-serif"}}>
      <Splash onDone={()=>setSplashDone(true)}/>
    </div>
  );

  const D=dark;
  const CSS=`
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html,body,#root{height:100%;height:100dvh;overflow:hidden;}
body{font-family:system-ui,-apple-system,sans-serif;background:${D?"#060d07":"#E8EDE5"};}
:root{
  --bg:${D?"#0E1410":"#F2F5EF"};
  --card:${D?"#16201A":"#FFFFFF"};
  --border:${D?"#243028":"#E4E8E0"};
  --dark:${D?"#E8F0EA":"#111"};
  --gray:${D?"#6A8C72":"#7A7A7A"};
  --gp:${D?"#142A1A":"#E8F5EE"};
  --sh:${D?"rgba(255,255,255,0.03)":"#F7FAF5"};
}
.rshell{width:100vw;height:100vh;height:100dvh;display:flex;justify-content:center;overflow:hidden;background:${D?"#060d07":"#c8d4c2"};}
.rapp{width:430px;max-width:100vw;height:100%;display:flex;flex-direction:column;background:var(--bg);overflow:hidden;position:relative;}
.rscroll{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding-bottom:80px;}
.rscroll::-webkit-scrollbar{display:none;}
.rnav{position:absolute;bottom:0;left:0;right:0;background:var(--card);border-top:1px solid var(--border);display:flex;justify-content:space-around;padding:8px 0;padding-bottom:max(10px,env(safe-area-inset-bottom));z-index:100;}
.rni{display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:4px 10px;border-radius:12px;transition:all 0.15s;position:relative;}
.rni.on{background:var(--gp);}
.rni-icon{font-size:22px;line-height:1;}
.rni-label{font-size:9px;font-weight:700;color:var(--gray);letter-spacing:0.2px;text-transform:uppercase;}
.rni.on .rni-label{color:#2D6A4F;}
.rnibadge{position:absolute;top:2px;right:4px;background:#E23744;color:#fff;font-size:8px;font-weight:700;width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.rfab{position:absolute;bottom:72px;right:14px;z-index:90;}
.rfab-btn{background:#E23744;color:#fff;border:none;border-radius:26px;padding:12px 18px;display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:800;font-size:13px;box-shadow:0 6px 24px rgba(226,55,68,0.45);font-family:system-ui;}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:400;backdrop-filter:blur(4px);}
.drawer{position:absolute;bottom:0;left:0;right:0;background:var(--card);border-radius:24px 24px 0 0;z-index:500;padding:20px 16px 24px;max-height:85%;overflow-y:auto;}
.detail{position:absolute;inset:0;background:var(--bg);z-index:600;overflow-y:auto;}
.toast{position:absolute;bottom:86px;left:50%;transform:translateX(-50%);background:${D?"#E8F0EA":"#111"};color:${D?"#0E1410":"#fff"};padding:10px 20px;border-radius:24px;font-size:12px;font-weight:700;z-index:999;white-space:nowrap;max-width:90%;text-align:center;font-family:system-ui;animation:toastA 2.4s ease forwards;box-shadow:0 4px 20px rgba(0,0,0,0.2);}
.ticker{background:#1e4d38;padding:5px 0;overflow:hidden;}
.ticker-inner{display:flex;animation:tick 50s linear infinite;width:max-content;}
.ticker-item{white-space:nowrap;font-size:10.5px;font-weight:600;color:rgba(255,255,255,0.8);padding:0 28px;}
@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes toastA{0%{opacity:0;transform:translateX(-50%) translateY(8px)}15%{opacity:1;transform:translateX(-50%) translateY(0)}78%{opacity:1}100%{opacity:0}}
@keyframes tick{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes spinY{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
@media(max-width:430px){.rapp{width:100vw;}}
`;

  return(
    <>
    <style>{CSS}</style>
    <div className="rshell">
    <div className="rapp" onClick={()=>openDD&&setOpenDD(null)}>

      {/* HEADER */}
      <div style={{background:"#2D6A4F",flexShrink:0,zIndex:60}}>
        <div style={{padding:"10px 14px 8px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",width:180,height:180,background:"#52B788",borderRadius:"50%",top:-80,right:-40,opacity:0.12,pointerEvents:"none"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#F9C74F,#F4845F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>♻️</div>
              <div style={{fontSize:24,fontWeight:800,color:"#fff",letterSpacing:-1.5,fontFamily:"system-ui"}}>Re<span style={{color:"#95D5B2"}}>Bite</span></div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {/* Dark/Light toggle — Zomato style */}
              <button onClick={()=>setDark(d=>!d)} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:20,padding:"6px 11px",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6,backdropFilter:"blur(4px)"}}>
                <span style={{fontSize:14}}>{dark?"☀️":"🌙"}</span>
                <span style={{fontFamily:"system-ui"}}>{dark?"Light":"Dark"}</span>
              </button>
              <div onClick={()=>setTab("you")} style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#F9C74F,#F4845F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,cursor:"pointer",border:`2px solid ${tab==="you"?"#fff":"rgba(255,255,255,0.3)"}`,transition:"border-color 0.2s"}}>🧑</div>
            </div>
          </div>
          {/* Address bar — Zomato style */}
          <div onClick={()=>setShowAddrPicker(true)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",marginTop:2}}>
            <span style={{fontSize:14}}>📍</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontWeight:800,fontSize:14,color:"#fff",fontFamily:"system-ui"}}>{addresses[activeAddr]?.label||"Home"}</span>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>▾</span>
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.65)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{addresses[activeAddr]?.line1||"New Delhi"} · {streak}🔥 streak</div>
            </div>
          </div>
        </div>
        <div className="ticker"><div className="ticker-inner">{[...FACTS,...FACTS].map((f,i)=><span key={i} className="ticker-item">{f}</span>)}</div></div>

        {/* Flash sale banner */}
        {flashSale&&(
          <div style={{background:"linear-gradient(90deg,#E23744,#7C3AED)",padding:"8px 14px",display:"flex",alignItems:"center",gap:10,animation:"pulse 1s ease infinite"}}>
            <span style={{fontSize:16}}>⚡</span>
            <div style={{flex:1}}>
              <span style={{fontWeight:800,fontSize:12,color:"#fff",fontFamily:"system-ui"}}>FLASH SALE · {Math.floor(flashTimer/60)}:{String(flashTimer%60).padStart(2,"0")} left!</span>
              <span style={{fontSize:11,color:"rgba(255,255,255,0.8)",marginLeft:8}}>{enriched.find(b=>b.id===flashSale.id)?.restaurantName||""} · {flashSale.type} · 90% off</span>
            </div>
            <button onClick={()=>{const eb=enriched.find(b=>b.id===flashSale.id);if(eb){setSelBag(eb);setSelTime(eb.pickup_start);setMode("pickup");}setFlashSale(null);}} style={{background:"#fff",color:"#E23744",border:"none",borderRadius:10,padding:"5px 10px",fontWeight:800,fontSize:11,cursor:"pointer",fontFamily:"system-ui",flexShrink:0}}>Grab!</button>
          </div>
        )}

        {/* Search + filters — only on home */}
        {tab==="home"&&<div style={{background:"var(--bg)",paddingBottom:4}}>
          <div style={{padding:"8px 12px 0"}}>
            <div style={{background:"var(--card)",borderRadius:13,display:"flex",alignItems:"center",gap:8,padding:"10px 13px",border:"1.5px solid var(--border)"}}>
              <span style={{fontSize:13,color:"var(--gray)"}}>🔍</span>
              <input style={{border:"none",outline:"none",flex:1,fontSize:13,color:"var(--dark)",background:"transparent"}} placeholder="Search bags, areas..." value={search} onChange={e=>setSearch(e.target.value)}/>
              {search&&<span style={{cursor:"pointer",color:"var(--gray)"}} onClick={()=>setSearch("")}>✕</span>}
            </div>
          </div>
          <div style={{display:"flex",gap:5,padding:"7px 12px 0",overflowX:"auto",scrollbarWidth:"none"}}>
            {[["area","📍",areaFilter!=="All"?areaFilter:"Area"],["type","🍽",typeFilter!=="All"?typeFilter:"Type"],["sort","⇅",sortBy==="default"?"Sort":sortBy==="price_asc"?"Price↑":sortBy==="price_desc"?"Price↓":sortBy==="discount"?"Disc":"Rating"],["price","₹",maxPrice<500?`≤₹${maxPrice}`:"Price"]].map(([name,ic,label],i)=>{
              const active=[areaFilter!=="All",typeFilter!=="All",sortBy!=="default",maxPrice<500][i];
              return(<button key={name} onClick={e=>{e.stopPropagation();openDropdown(name,e);}} style={{padding:"6px 11px",borderRadius:20,border:`1.5px solid ${active?"#2D6A4F":"var(--border)"}`,background:active?"#2D6A4F":"var(--card)",color:active?"#fff":"var(--gray)",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"system-ui",flexShrink:0}}>{ic} {label} ▾</button>);
            })}
            {[[vegOnly,()=>setVegOnly(v=>!v),"🌿 Veg"]].map(([on,fn,lb])=>(
              <button key={lb} onClick={fn} style={{padding:"6px 11px",borderRadius:20,border:`1.5px solid ${on?"#16A34A":"var(--border)"}`,background:on?"#16A34A":"var(--card)",color:on?"#fff":"var(--dark)",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"system-ui",flexShrink:0}}>{lb}</button>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"4px 12px 6px"}}>
            <span style={{fontSize:11,color:"var(--gray)"}}>{filtered.length} bags available</span>
            {hasFilters&&<span onClick={clearAll} style={{fontSize:11,color:"#E23744",fontWeight:700,cursor:"pointer"}}>Clear ✕</span>}
          </div>
        </div>}
      </div>

      {/* DROPDOWN */}
      {openDD&&(
        <div style={{position:"fixed",top:ddPos.top,left:ddPos.left,width:ddPos.width,background:"var(--card)",borderRadius:16,boxShadow:"0 8px 40px rgba(0,0,0,0.22)",zIndex:9999,border:"1px solid var(--border)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
          {openDD==="area"&&["All",...AREAS.filter(a=>a!=="All")].map(a=><div key={a} onClick={()=>{setAreaFilter(a);setOpenDD(null);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 14px",cursor:"pointer",fontSize:13,color:areaFilter===a?"#2D6A4F":"var(--dark)",fontWeight:areaFilter===a?700:500}}><span>{a==="All"?"🗺 All":`${AREA_ICONS[a]||"📍"} ${a}`}</span>{areaFilter===a&&<span style={{color:"#2D6A4F"}}>✓</span>}</div>)}
          {openDD==="type"&&TYPES.map(t=><div key={t} onClick={()=>{setTypeFilter(t);setOpenDD(null);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 14px",cursor:"pointer",fontSize:13,color:typeFilter===t?"#2D6A4F":"var(--dark)",fontWeight:typeFilter===t?700:500}}><span>{t==="All"?"🛍 All":`${EMOJI[t]||""} ${t}`}</span>{typeFilter===t&&<span style={{color:"#2D6A4F"}}>✓</span>}</div>)}
          {openDD==="sort"&&[["default","✨ Recommended"],["price_asc","Price: Low→High"],["price_desc","Price: High→Low"],["discount","Biggest Discount 🔥"],["rating","Highest Rated ⭐"]].map(([v,l])=><div key={v} onClick={()=>{setSortBy(v);setOpenDD(null);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 14px",cursor:"pointer",fontSize:13,color:sortBy===v?"#2D6A4F":"var(--dark)",fontWeight:sortBy===v?700:500}}><span>{l}</span>{sortBy===v&&<span style={{color:"#2D6A4F"}}>✓</span>}</div>)}
          {openDD==="price"&&<div style={{padding:"14px"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--gray)",marginBottom:10}}><span>₹50</span><span style={{color:"#2D6A4F",fontWeight:800,fontSize:15}}>₹{maxPrice}</span><span>₹500</span></div><input type="range" min={50} max={500} step={25} value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value))} style={{width:"100%",accentColor:"#2D6A4F"}}/><button onClick={()=>{setMaxPrice(500);setOpenDD(null);}} style={{marginTop:10,background:"none",border:"none",color:"var(--gray)",fontSize:11,cursor:"pointer",fontWeight:700}}>Reset</button></div>}
        </div>
      )}

      {/* SCROLL BODY */}
      <div className="rscroll" ref={scrollRef}>

        {/* HOME */}
        {tab==="home"&&<>
          {/* Stats bar */}
          <div style={{margin:"10px 14px 8px",background:"linear-gradient(135deg,#1B4332,#2D6A4F)",borderRadius:16,padding:"12px 16px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
            {[["12K+","Users"],["4.2T","CO2 Saved"],["₹2Cr+","Food Saved"]].map(([v,l],i)=>(
              <div key={l} style={{textAlign:"center",borderLeft:i>0?"1px solid rgba(255,255,255,0.15)":"none"}}>
                <div style={{fontWeight:800,fontSize:18,color:"#fff",fontFamily:"system-ui"}}>{v}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.55)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>{l}</div>
              </div>
            ))}
          </div>

          {/* Blind bag promo */}
          <div onClick={()=>setShowBlind(true)} style={{margin:"0 14px 8px",background:"linear-gradient(135deg,#7C3AED,#4C1D95)",borderRadius:14,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
            <div style={{fontSize:26}}>🎰</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:13,color:"#fff",fontFamily:"system-ui"}}>Blind Bag Mode · ₹49</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.7)"}}>Mystery bag from anywhere in Delhi. Spin to find out!</div>
            </div>
            <span style={{color:"rgba(255,255,255,0.6)",fontSize:18}}>›</span>
          </div>

          {/* Referral banner */}
          <div onClick={()=>{setTab("you");}} style={{margin:"0 14px 10px",background:"linear-gradient(135deg,#1B4332,#2D6A4F)",borderRadius:14,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
            <div style={{fontSize:20}}>🤝</div>
            <div style={{flex:1}}><div style={{fontWeight:800,fontSize:12,color:"#fff",fontFamily:"system-ui"}}>Refer a friend, earn ₹50!</div><div style={{fontSize:10,color:"rgba(255,255,255,0.7)"}}>Share ReBite and get rewarded</div></div>
            <span style={{color:"rgba(255,255,255,0.5)",fontSize:16}}>›</span>
          </div>

          {/* B2B Offices Banner */}
          <div onClick={()=>setShowOffices(true)} style={{margin:"0 14px 8px",background:"linear-gradient(135deg,#1a1a2e,#16213e)",borderRadius:14,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>&#x1F3E2;</div>
            <div style={{flex:1}}><div style={{fontWeight:800,fontSize:12,color:"#fff",fontFamily:"system-ui"}}>ReBite for Offices</div><div style={{fontSize:10,color:"rgba(255,255,255,0.6)"}}>Feed your team · ESG credits · From ₹4,999/mo</div></div>
            <span style={{color:"rgba(255,255,255,0.4)",fontSize:16}}>›</span>
          </div>

          {/* Cart savings */}
          {cart.length>0&&(
            <div style={{margin:"0 14px 10px",background:"var(--gp)",borderRadius:12,padding:"10px 14px",display:"flex",border:"1px solid rgba(45,106,79,0.15)"}}>
              {[["₹"+cartSavings,"Saved"],[`${(cart.length*CO2_PER_BAG).toFixed(1)}kg`,"CO2"],[cart.length,"In Bag"]].map(([v,l],i)=>(
                <div key={l} style={{flex:1,textAlign:"center",borderLeft:i>0?"1px solid rgba(45,106,79,0.2)":"none"}}>
                  <div style={{fontWeight:800,fontSize:14,color:"#2D6A4F",fontFamily:"system-ui"}}>{v}</div>
                  <div style={{fontSize:9,color:"#52B788",fontWeight:700,textTransform:"uppercase"}}>{l}</div>
                </div>
              ))}
            </div>
          )}

          {/* Today's picks personalization */}
          {orders.length>0&&(
            <div style={{margin:"0 14px 8px",background:"var(--gp)",borderRadius:14,padding:"10px 13px",border:"1px solid rgba(45,106,79,0.15)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:18}}>🌱</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:12,color:"#2D6A4F",fontFamily:"system-ui"}}>Your eco impact this week</div>
                  <div style={{fontSize:11,color:"#52B788",marginTop:1}}>Saved {orders.length} bags · {(orders.length*CO2_PER_BAG).toFixed(1)}kg CO2 prevented · ₹{orders.reduce((s,o)=>s+o.savings,0)} saved</div>
                </div>
                <div style={{width:36,height:36,borderRadius:"50%",background:"#2D6A4F",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff",fontWeight:800,fontFamily:"system-ui"}}>{Math.min(99,orders.length*10)}</div>
              </div>
            </div>
          )}
          {/* Trending / Category quick picks */}
          <div style={{padding:"0 14px 8px"}}>
            <div style={{fontWeight:800,fontSize:14,color:"var(--dark)",fontFamily:"system-ui",marginBottom:10}}>Quick Pick 🎯</div>
            <div style={{display:"flex",gap:8,overflowX:"auto",scrollbarWidth:"none"}}>
              {[{icon:"🥐",label:"Bakery",color:"#F9C74F"},{icon:"🍛",label:"Meal",color:"#F4845F"},{icon:"🧁",label:"Dessert",color:"#EC4899"},{icon:"☕",label:"Cafe",color:"#8B5CF6"},{icon:"🍽️",label:"Fine Dining",color:"#2D6A4F"},{icon:"🍱",label:"Buffet",color:"#E23744"}].map(t=>(
                <div key={t.label} onClick={()=>setTypeFilter(f=>f===t.label?"All":t.label)} style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer"}}>
                  <div style={{width:52,height:52,borderRadius:16,background:typeFilter===t.label?t.color:"var(--card)",border:`2px solid ${typeFilter===t.label?t.color:"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,transition:"all 0.15s",transform:typeFilter===t.label?"scale(1.08)":"scale(1)"}}>{t.icon}</div>
                  <div style={{fontSize:9,fontWeight:700,color:typeFilter===t.label?"#2D6A4F":"var(--gray)",textTransform:"uppercase",letterSpacing:0.3}}>{t.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{padding:"0 14px",marginBottom:8}}>
            <div style={{fontWeight:800,fontSize:15,color:"var(--dark)",fontFamily:"system-ui"}}>Tonight's Bags 🛍️</div>
          </div>

          {filtered.length===0?(
            <div style={{textAlign:"center",padding:"40px 16px",color:"var(--gray)"}}>
              <div style={{fontSize:44,marginBottom:10}}>😔</div>
              <div style={{fontWeight:700,fontSize:15,color:"var(--dark)",fontFamily:"system-ui"}}>No bags match</div>
              {hasFilters&&<div onClick={clearAll} style={{marginTop:12,color:"#2D6A4F",fontWeight:800,fontSize:13,cursor:"pointer"}}>Clear filters →</div>}
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,padding:"0 14px"}}>
              {filtered.map(bag=>(
                <BagCard key={bag.id} bag={bag}
                  bookmarked={bookmarks.has(bag.id)}
                  onBm={()=>toggleBm(bag.id)}
                  onAdd={()=>addToCart(bag,"pickup",bag.pickup_start,"")}
                  onOpen={()=>{
                    if(bag.quantity===0){setWaitBag(bag);return;}
                    setSelBag(bag);setSelTime(bag.pickup_start||"18:00");setMode("pickup");setAddr("");
                  }}
                />
              ))}
            </div>
          )}
          <div style={{height:16}}/>
        </>}

        {tab==="map"&&<MapPage bags={bags} enriched={enriched} onAreaSelect={a=>{setAreaFilter(a);setTab("home");}}/>}
        {tab==="nutrition"&&<NutritionPage orders={orders}/>}
        {tab==="leaderboard"&&<LeaderboardPage orders={orders} streak={streak}/>}
        {tab==="you"&&<YouPage orders={orders} streak={streak} dark={dark} setDark={setDark} showToast={showToast} notifPerm={notifPerm} onEnableNotif={handleNotif} addresses={addresses} activeAddr={activeAddr} setActiveAddr={setActiveAddr} setAddresses={setAddresses}/>}

        {/* SAVED — inline */}
        {tab==="saved"&&<div style={{padding:"16px 14px",animation:"fu 0.3s ease"}}>
          <div style={{fontWeight:800,fontSize:20,marginBottom:4,color:"var(--dark)",fontFamily:"system-ui"}}>Saved Places 🔖</div>
          <div style={{fontSize:12,color:"var(--gray)",marginBottom:16}}>{enriched.filter(b=>bookmarks.has(b.id)).length} saved</div>
          {enriched.filter(b=>bookmarks.has(b.id)).length===0?(
            <div style={{textAlign:"center",padding:"50px 16px",color:"var(--gray)"}}>
              <div style={{fontSize:48,marginBottom:12}}>🔖</div>
              <div style={{fontWeight:700,fontSize:15,color:"var(--dark)",fontFamily:"system-ui",marginBottom:6}}>Nothing saved yet</div>
              <div style={{fontSize:12}}>Tap ♡ on any card to save it</div>
            </div>
          ):enriched.filter(b=>bookmarks.has(b.id)).map(bag=>(
            <SavedCard key={bag.id} bag={bag} onRemove={()=>toggleBm(bag.id)} onOpen={()=>{if(bag.quantity===0){setWaitBag(bag);return;}setSelBag(bag);setSelTime(bag.pickup_start||"18:00");setMode("pickup");setAddr("");}}/>
          ))}
        </div>}
      </div>

      {showScrollTop&&(
        <button onClick={()=>scrollRef.current?.scrollTo({top:0,behavior:"smooth"})} style={{position:"absolute",bottom:cart.length>0?136:82,right:14,zIndex:95,width:42,height:42,borderRadius:"50%",background:"var(--card)",border:"1.5px solid var(--border)",cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(0,0,0,0.12)",color:"var(--dark)",fontWeight:700}}>&#8679;</button>
      )}
            {/* FAB */}
      {cart.length>0&&(
        <div className="rfab">
          <button className="rfab-btn" onClick={()=>setShowCart(true)}>
            <span style={{background:"rgba(255,255,255,0.3)",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900}}>{cart.length}</span>
            View Bag · ₹{cartTotal}
          </button>
        </div>
      )}

      {/* BOTTOM NAV — 5 items, clean */}
      <div className="rnav">
        {[
          {id:"home",icon:"🏠",label:"Home"},
          {id:"map",icon:"🗺️",label:"Map"},
          {id:"nutrition",icon:"📊",label:"Nutrition"},
          {id:"saved",icon:"🔖",label:"Saved"},
          {id:"leaderboard",icon:"🏆",label:"Ranks"},
        ].map(n=>(
          <div key={n.id} className={`rni${tab===n.id?" on":""}`} onClick={()=>setTab(n.id)}>
            <span className="rni-icon">{n.icon}</span>
            <span className="rni-label">{n.label}</span>
          </div>
        ))}
      </div>

      {/* CART */}
      {showCart&&<>
        <div className="overlay" onClick={()=>setShowCart(false)}/>
        <div className="drawer">
          <div style={{width:36,height:4,background:"var(--border)",borderRadius:4,margin:"0 auto 16px"}}/>
          <div style={{fontWeight:800,fontSize:18,marginBottom:14,color:"var(--dark)",fontFamily:"system-ui"}}>Your Bag 🛍️</div>
          {cart.map(i=>(
            <div key={i.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
              <img src={i.dishImg} style={{width:48,height:48,borderRadius:12,objectFit:"cover",flexShrink:0}} alt=""/>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13,color:"var(--dark)",fontFamily:"system-ui"}}>{i.restaurantName}</div>
                <div style={{fontWeight:800,fontSize:14,color:"#2D6A4F",margin:"2px 0",fontFamily:"system-ui"}}>₹{i.price}</div>
                <div style={{fontSize:10,color:"var(--gray)"}}>{i.mode==="delivery"?"🛵 Delivery":"🏃 Pickup"} · {i.pickedTime}</div>
              </div>
              <button onClick={()=>removeFromCart(i.id)} style={{background:"none",border:"1.5px solid var(--border)",borderRadius:8,width:27,height:27,cursor:"pointer",fontSize:11,color:"var(--gray)",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
          ))}
          <div style={{background:"var(--gp)",borderRadius:12,padding:"10px 14px",margin:"12px 0 6px",display:"flex"}}>
            {[["₹"+cartSavings,"Saved","#2D6A4F"],[`${(cart.length*CO2_PER_BAG).toFixed(1)}kg`,"CO2","#2D6A4F"],[`+${cart.length*100}`,"Points","#7C3AED"]].map(([v,l,c],i)=>(
              <div key={l} style={{flex:1,textAlign:"center",borderLeft:i>0?"1px solid rgba(45,106,79,0.2)":"none"}}>
                <div style={{fontWeight:800,fontSize:15,color:c,fontFamily:"system-ui"}}>{v}</div>
                <div style={{fontSize:9,color:"#52B788",fontWeight:700,textTransform:"uppercase"}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"8px 0 4px"}}>
            <span style={{color:"var(--gray)",fontSize:13}}>Total</span>
            <span style={{fontWeight:800,fontSize:22,color:"var(--dark)",fontFamily:"system-ui"}}>₹{cartTotal}</span>
          </div>
          <button onClick={checkout} style={{width:"100%",background:"#E23744",color:"#fff",border:"none",borderRadius:14,padding:14,fontWeight:800,fontSize:14,cursor:"pointer",marginTop:12,boxShadow:"0 4px 16px rgba(226,55,68,0.3)",fontFamily:"system-ui"}}>
            💳 Pay ₹{cartTotal} · Earn {cart.length*100} pts
          </button>
          <div style={{fontSize:10,color:"var(--gray)",textAlign:"center",marginTop:8}}>🔒 Secured by Razorpay · UPI · Cards · Wallets</div>
        </div>
      </>}

      {/* DETAIL VIEW */}
      {selBag&&(()=>{
        const d=getDisc(selBag);const slots=gSlots(selBag.pickup_start,selBag.pickup_end);const bm=bookmarks.has(selBag.id);
        return(
          <div className="detail">
            <div style={{height:220,position:"relative",overflow:"hidden"}}>
              <img src={getDImg(selBag)} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,0.3),transparent 60%)"}}/>
              <button onClick={()=>setSelBag(null)} style={{position:"absolute",top:14,left:14,background:"#fff",border:"none",borderRadius:12,width:40,height:40,cursor:"pointer",fontSize:18,boxShadow:"0 2px 10px rgba(0,0,0,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#333"}}>←</button>
              <button onClick={()=>toggleBm(selBag.id)} style={{position:"absolute",top:14,right:14,background:"rgba(0,0,0,0.4)",border:"none",borderRadius:"50%",width:40,height:40,cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",color:bm?"#EF4444":"rgba(255,255,255,0.8)",backdropFilter:"blur(4px)"}}>{bm?"♥":"♡"}</button>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"var(--card)",borderBottom:"1px solid var(--border)"}}>
              <img src={getRImg(selBag)} style={{width:46,height:46,borderRadius:11,objectFit:"cover",flexShrink:0}} alt=""/>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:15,color:"var(--dark)",fontFamily:"system-ui"}}>{selBag.restaurantName}</div>
                <div style={{fontSize:10,color:"var(--gray)",marginTop:2}}>{selBag.restaurantCategory} · {selBag.restaurantArea} · ⭐ {selBag.restaurantRating}</div>
              </div>
            </div>
            <div style={{padding:14}}>
              <div style={{fontWeight:800,fontSize:20,marginBottom:4,color:"var(--dark)",fontFamily:"system-ui"}}>{selBag.type} Surprise Bag</div>
              <div style={{fontSize:11,color:"var(--gray)",marginBottom:12}}>{isVeg(selBag)?"🌿 Veg":"🍗 Non-Veg"} · {d}% off · saves ₹{Number(selBag.original_price)-Number(selBag.price)}</div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <button onClick={()=>setShowGroup(true)} style={{flex:1,background:"rgba(249,199,79,0.1)",border:"1.5px solid #F9C74F",borderRadius:12,padding:"9px 4px",fontWeight:700,fontSize:11,cursor:"pointer",color:"var(--dark)",fontFamily:"system-ui"}}>&#x1F465; Group</button>
                <button onClick={()=>setShowAIChef(true)} style={{flex:1,background:"rgba(124,58,237,0.1)",border:"1.5px solid #7C3AED",borderRadius:12,padding:"9px 4px",fontWeight:700,fontSize:11,cursor:"pointer",color:"var(--dark)",fontFamily:"system-ui"}}>&#x1F916; AI Chef</button>
              </div>
              <div style={{display:"flex",background:"var(--bg)",borderRadius:12,padding:3,marginBottom:12}}>
                {[["pickup","🏃 Pickup"],["delivery","🛵 Delivery +₹20"]].map(([m,l])=>(
                  <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"9px 6px",border:"none",borderRadius:10,fontWeight:700,fontSize:11,cursor:"pointer",background:mode===m?"var(--card)":"transparent",color:mode===m?"#2D6A4F":"var(--gray)",transition:"all 0.15s",fontFamily:"system-ui"}}>{l}</button>
                ))}
              </div>
              {mode==="delivery"&&<div style={{background:"var(--sh)",borderRadius:13,padding:12,marginBottom:12,border:"1.5px solid var(--border)"}}>
                <span style={{fontWeight:800,fontSize:11,color:"var(--dark)",display:"block",marginBottom:7}}>📍 Delivery Address</span>
                <textarea style={{width:"100%",background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:9,padding:"9px 11px",fontSize:13,color:"var(--dark)",outline:"none",resize:"none",fontFamily:"system-ui"}} rows={2} placeholder="Enter your delivery address..." value={addr} onChange={e=>setAddr(e.target.value)}/>
              </div>}
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {[["📦","Left",selBag.quantity||"None"],["💰","Saving",d+"%"],["🌱","CO2",CO2_PER_BAG+"kg"],["💜","Points","+100"]].map(([ic,lb,val])=>(
                  <div key={lb} style={{flex:1,background:"var(--card)",borderRadius:11,padding:"8px 4px",textAlign:"center",border:"1px solid var(--border)"}}>
                    <div style={{fontSize:15,marginBottom:3}}>{ic}</div>
                    <div style={{fontSize:9,color:"var(--gray)",textTransform:"uppercase",letterSpacing:0.4,fontWeight:700}}>{lb}</div>
                    <div style={{fontWeight:800,fontSize:12,color:"var(--dark)",marginTop:1,fontFamily:"system-ui"}}>{val}</div>
                  </div>
                ))}
              </div>
              {/* Nutrition preview */}
              {MACROS[selBag.type]&&(
                <div style={{background:"var(--gp)",borderRadius:14,padding:"12px 14px",marginBottom:12,border:"1px solid rgba(45,106,79,0.2)"}}>
                  <div style={{fontWeight:800,fontSize:10,color:"#2D6A4F",textTransform:"uppercase",letterSpacing:0.7,marginBottom:8}}>🥗 Nutrition (auto-tracked on order)</div>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    {[["Calories",MACROS[selBag.type].cal,"kcal"],["Protein",MACROS[selBag.type].p,"g"],["Carbs",MACROS[selBag.type].c,"g"],["Fat",MACROS[selBag.type].f,"g"]].map(([l,v,u])=>(
                      <div key={l} style={{textAlign:"center"}}>
                        <div style={{fontWeight:800,fontSize:15,color:"#2D6A4F",fontFamily:"system-ui"}}>{v}<span style={{fontSize:9,fontWeight:400}}>{u}</span></div>
                        <div style={{fontSize:9,color:"#52B788",fontWeight:700,textTransform:"uppercase"}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{marginBottom:12}}>
                <span style={{fontWeight:800,fontSize:11,color:"var(--dark)",marginBottom:6,display:"block"}}>🕐 Select pickup time</span>
                <select style={{width:"100%",background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:10,padding:"11px 12px",fontSize:13,color:"var(--dark)",outline:"none",cursor:"pointer",fontFamily:"system-ui"}} value={selTime} onChange={e=>setSelTime(e.target.value)}>
                  {slots.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <Reviews bagId={selBag.id}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,background:"var(--card)",padding:"12px 14px",borderTop:"1px solid var(--border)",position:"sticky",bottom:0}}>
              <div>
                <div style={{fontSize:11,color:"var(--gray)",textDecoration:"line-through"}}>₹{selBag.original_price}</div>
                <div style={{fontWeight:800,fontSize:26,color:"var(--dark)",letterSpacing:-0.8,fontFamily:"system-ui",lineHeight:1}}>₹{mode==="delivery"?Number(selBag.price)+20:selBag.price}</div>
              </div>
              <button disabled={!selBag.quantity||(mode==="delivery"&&!addr.trim())}
                onClick={()=>{addToCart(selBag,mode,selTime,addr);setSelBag(null);}}
                style={{flex:2,background:!selBag.quantity||(mode==="delivery"&&!addr.trim())?"var(--border)":"#E23744",color:!selBag.quantity||(mode==="delivery"&&!addr.trim())?"var(--gray)":"#fff",border:"none",borderRadius:14,padding:14,fontWeight:800,fontSize:13,cursor:!selBag.quantity?"default":"pointer",boxShadow:selBag.quantity?"0 3px 12px rgba(226,55,68,0.3)":"none",fontFamily:"system-ui"}}>
                {!selBag.quantity?"Sold Out":mode==="delivery"&&!addr.trim()?"Enter address":"Reserve · "+selTime+" 🏃"}
              </button>
            </div>
          </div>
        );
      })()}

      {/* WAITLIST */}
      {waitBag&&<WaitlistModal bag={waitBag} onClose={()=>setWaitBag(null)} toast={showToast}/>}

      {/* ADDRESS PICKER */}
      {showAddrPicker&&<AddrPicker addresses={addresses} activeAddr={activeAddr} setActiveAddr={setActiveAddr} setAddresses={setAddresses} onClose={()=>setShowAddrPicker(false)} toast={showToast}/>}

      {/* BLIND BAG */}
      {showBlind&&<BlindBagModal bags={enriched} onClose={()=>setShowBlind(false)} toast={showToast}
        onOrder={(bag)=>{addToCart({...bag,price:49},"pickup",bag.pickup_start,"");}}/>}

      {/* TOAST */}
      {showGroup&&selBag&&<GroupOrderModal bag={selBag} onClose={()=>setShowGroup(false)} toast={showToast}/>}
      {showAIChef&&selBag&&<AIChefModal bag={selBag} onClose={()=>setShowAIChef(false)}/>}
      {showOffices&&<OfficesPage onClose={()=>setShowOffices(false)} toast={showToast}/>}
      {/* LIVE ORDER TRACKER */}
      {liveOrder&&<LiveTracker order={liveOrder} step={liveStep} onDismiss={()=>setLiveOrder(null)}/>}

      {toast&&<div key={toastK} className="toast">{toast}</div>}

    </div>
    </div>
    </>
  );
}