import { useState, useEffect, useRef, useCallback } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://prlbenrpgujqbdsdedxz.supabase.co',
  'sb_publishable_8s_rzdF1DPk0YF7NTnuG-w_63MWeYBb'
);

/* ─── constants ─── */
const EMOJI = { Bakery:"🥐", Cafe:"☕", "Fine Dining":"🍽️", Buffet:"🍱", Meal:"🍛", Dessert:"🧁", default:"🛍️" };
const AREAS  = ["All","CP","Hauz Khas","GK","Saket","Rajouri"];
const TYPES  = ["All","Bakery","Meal","Dessert","Cafe","Fine Dining","Buffet"];
const AREA_ICONS = { CP:"🏛️","Hauz Khas":"🌳",GK:"🏘️",Saket:"🎬",Rajouri:"🛍️" };
const CO2_PER_BAG = 1.2;
const VEG_TYPES = new Set(["Bakery","Dessert","Cafe"]);
const isVeg = b => VEG_TYPES.has(b.type);
const getDisc = b => b.original_price>0 ? Math.round(((b.original_price-b.price)/b.original_price)*100) : 0;

/* ─── Demo data ─── */
const DEMO_RESTAURANTS = [
  {id:1,name:"The Pastry House",area:"CP",category:"Bakery",rating:4.5,image_url:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=75",description:"Artisan bakery serving fresh croissants and breads daily"},
  {id:2,name:"Spice Garden",area:"Hauz Khas",category:"Meal",rating:4.2,image_url:"https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&q=75",description:"Authentic North Indian cuisine with daily specials"},
  {id:3,name:"Sweet Escape",area:"GK",category:"Dessert",rating:4.7,image_url:"https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400&q=75",description:"Handcrafted sweets and desserts"},
  {id:4,name:"Brew Lab",area:"Saket",category:"Cafe",rating:4.3,image_url:"https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=75",description:"Specialty coffee and artisanal snacks"},
  {id:5,name:"The Royal Table",area:"CP",category:"Fine Dining",rating:4.8,image_url:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75",description:"Fine dining with exquisite presentation"},
  {id:6,name:"Delhi Dawaat",area:"Rajouri",category:"Buffet",rating:4.1,image_url:"https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=75",description:"Extensive buffet with 30+ dishes"},
];
const DEMO_BAGS = [
  {id:"b1",restaurant_id:1,type:"Bakery",price:99,original_price:350,quantity:3,pickup_start:"18:00",pickup_end:"21:00",is_active:true},
  {id:"b2",restaurant_id:2,type:"Meal",price:149,original_price:450,quantity:2,pickup_start:"19:00",pickup_end:"21:00",is_active:true},
  {id:"b3",restaurant_id:3,type:"Dessert",price:79,original_price:280,quantity:5,pickup_start:"20:00",pickup_end:"22:00",is_active:true},
  {id:"b4",restaurant_id:4,type:"Cafe",price:129,original_price:400,quantity:1,pickup_start:"17:00",pickup_end:"20:00",is_active:true},
  {id:"b5",restaurant_id:5,type:"Fine Dining",price:299,original_price:1200,quantity:2,pickup_start:"21:00",pickup_end:"23:00",is_active:true},
  {id:"b6",restaurant_id:6,type:"Buffet",price:199,original_price:800,quantity:0,pickup_start:"20:00",pickup_end:"22:00",is_active:true},
];
const DISH_IMAGES = {
  Bakery:["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=75","https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=75"],
  Meal:["https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=75","https://images.unsplash.com/photo-1567337710282-00832b415979?w=400&q=75"],
  Dessert:["https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=75","https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=75"],
  Cafe:["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=75","https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=75"],
  "Fine Dining":["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75","https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=75"],
  Buffet:["https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=75","https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=75"],
};
const REST_FALLBACK=["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=75","https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&q=75"];
const BAG_HERO={Bakery:{name:"Freshly Baked Assortment",sub:"Croissants · breads · pastries",img:"https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80"},Meal:{name:"Chef's Daily Meal Box",sub:"Dal · sabzi · rice / roti",img:"https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80"},Dessert:{name:"Dessert Surprise Box",sub:"Cakes · mithais · 2-3 pieces",img:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&q=80"},Cafe:{name:"Cafe Combo",sub:"Beverage + snack of the day",img:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&q=80"},"Fine Dining":{name:"Chef's Tasting Portion",sub:"Starter + main course",img:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&q=80"},Buffet:{name:"Buffet Selection Box",sub:"5-7 items from the chef",img:"https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&q=80"}};
const FACTS=["🌍 1/3 of all food produced globally is wasted every year","🌱 Saving one ReBite bag prevents ~1.2 kg of CO2","💧 A single burger takes 2,400 litres of water to produce","🇮🇳 India wastes Rs 92,000 crore worth of food annually","♻️ Food waste in landfills produces methane — 25x worse than CO2","🥗 A ReBite bag saves up to 80% vs menu price"];
const MACRO_PRESETS={Bakery:{calories:420,protein:8,carbs:62,fat:16,fiber:3},Meal:{calories:580,protein:22,carbs:75,fat:14,fiber:6},Dessert:{calories:350,protein:5,carbs:55,fat:14,fiber:1},Cafe:{calories:280,protein:6,carbs:38,fat:10,fiber:2},"Fine Dining":{calories:650,protein:32,carbs:45,fat:28,fiber:5},Buffet:{calories:780,protein:28,carbs:90,fat:22,fiber:8}};
const DAILY_GOALS={calories:2000,protein:60,carbs:250,fat:65,fiber:25};

/* ─── Badges config ─── */
const BADGES=[
  {id:"first",icon:"🌱",name:"First Save",desc:"Saved your first bag",req:1},
  {id:"five",icon:"🔥",name:"Hot Streak",desc:"Saved 5 bags",req:5},
  {id:"ten",icon:"⭐",name:"Star Saver",desc:"Saved 10 bags",req:10},
  {id:"eco",icon:"🌍",name:"Eco Warrior",desc:"Saved 5kg CO2",req:5,type:"co2"},
  {id:"referral",icon:"🤝",name:"Community Hero",desc:"Referred a friend",req:1,type:"referral"},
  {id:"streak3",icon:"💫",name:"3-Day Streak",desc:"3 days in a row",req:3,type:"streak"},
  {id:"streak7",icon:"🏆",name:"Week Warrior",desc:"7 days in a row",req:7,type:"streak"},
];

const getDishImage=bag=>{const p=DISH_IMAGES[bag.type]||DISH_IMAGES.Meal;const seed=((bag.id||"x").charCodeAt(0)||0);return p[seed%p.length];};
const getRestImage=bag=>bag.restaurantImage||REST_FALLBACK[0];
const genSlots=(s,e)=>{if(!s||!e)return["18:00","19:00","20:00","21:00"];const sl=[],[sh]=s.split(":").map(Number),[eh]=e.split(":").map(Number);for(let h=sh;h<=eh;h++)sl.push(`${String(h).padStart(2,"0")}:00`);return sl;};

/* ════════════════════════════════
   FEATURE: Countdown Timer Hook
════════════════════════════════ */
function useCountdown(pickupEnd){
  const [timeLeft,setTimeLeft]=useState("");
  const [urgent,setUrgent]=useState(false);
  useEffect(()=>{
    if(!pickupEnd)return;
    const tick=()=>{
      const now=new Date();
      const[h,m]=pickupEnd.split(":").map(Number);
      const end=new Date();end.setHours(h,m,0,0);
      if(end<now)end.setDate(end.getDate()+1);
      const diff=end-now;
      if(diff<=0){setTimeLeft("Closed");return;}
      const hrs=Math.floor(diff/3600000);
      const mins=Math.floor((diff%3600000)/60000);
      const secs=Math.floor((diff%60000)/1000);
      setUrgent(diff<3600000);
      setTimeLeft(hrs>0?`${hrs}h ${mins}m`:`${mins}m ${secs}s`);
    };
    tick();const iv=setInterval(tick,1000);return()=>clearInterval(iv);
  },[pickupEnd]);
  return{timeLeft,urgent};
}

/* ════════════════════════════════
   FEATURE: Live Social Proof
════════════════════════════════ */
function useSocialProof(bagId){
  const [viewers,setViewers]=useState(()=>Math.floor(Math.random()*8)+2);
  useEffect(()=>{
    const iv=setInterval(()=>{
      setViewers(v=>Math.max(1,v+(Math.random()>0.5?1:-1)));
    },4000+Math.random()*3000);
    return()=>clearInterval(iv);
  },[bagId]);
  return viewers;
}

/* ════════════════════════════════
   FEATURE: Push Notification Manager
════════════════════════════════ */
async function requestNotificationPermission(){
  if(!("Notification" in window))return false;
  if(Notification.permission==="granted")return true;
  const perm=await Notification.requestPermission();
  return perm==="granted";
}
function sendNotification(title,body,icon="♻️"){
  if(Notification.permission==="granted"){
    new Notification(title,{body,icon:"/icon-192.png",badge:"/icon-192.png",tag:"rebite"});
  }
}

/* ════════════════════════════════
   FEATURE: Splash Screen
════════════════════════════════ */
function SplashScreen({onDone}){
  const[phase,setPhase]=useState(0);
  useEffect(()=>{const t1=setTimeout(()=>setPhase(1),400);const t2=setTimeout(()=>setPhase(2),1600);const t3=setTimeout(()=>onDone(),2200);return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3);};},[]);
  return(<div style={{position:"fixed",inset:0,background:"#080e09",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,opacity:phase===2?0:1,transition:phase===2?"opacity 0.5s ease":"none"}}>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,opacity:phase===0?0:1,transform:phase===0?"scale(0.7)":"scale(1)",transition:"all 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}>
      <div style={{width:88,height:88,borderRadius:24,background:"linear-gradient(135deg,#F9C74F,#F4845F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:46,boxShadow:"0 0 80px rgba(249,199,79,0.6)"}}>♻️</div>
      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:42,fontWeight:800,color:"#fff",letterSpacing:"-1.5px"}}>Re<span style={{color:"#52B788"}}>Bite</span></div>
      <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",letterSpacing:"3px",textTransform:"uppercase",opacity:phase===1?1:0,transition:"opacity 0.4s ease 0.3s",fontFamily:"'Nunito',sans-serif"}}>Save Food · Save Delhi</div>
    </div>
  </div>);
}

/* ════════════════════════════════
   FEATURE: Card with countdown
════════════════════════════════ */
function BagCard({bag,disc,veg,bookmarked,onToggleBookmark,onAdd,onOpen}){
  const{timeLeft,urgent}=useCountdown(bag.pickup_end);
  const viewers=useSocialProof(bag.id);
  const[imgIdx,setImgIdx]=useState(0);
  const dishImg=getDishImage(bag),restImg=getRestImage(bag);
  useEffect(()=>{let iv=setInterval(()=>setImgIdx(i=>(i+1)%2),4000);return()=>clearInterval(iv);},[bag.id]);
  return(
    <div style={{background:"var(--card)",borderRadius:18,overflow:"hidden",boxShadow:"0 2px 12px var(--card-shadow)",cursor:"pointer",transition:"transform .18s,box-shadow .18s",border:"1px solid var(--border)"}}
      onClick={onOpen}
      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
      onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
    >
      <div style={{width:"100%",height:120,position:"relative",overflow:"hidden",background:"#ddd"}}>
        {[dishImg,restImg].map((src,i)=>(
          <img key={i} src={src} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:i===imgIdx?1:0,transition:"opacity 0.7s ease"}} loading="lazy"/>
        ))}
        {/* Countdown badge */}
        {timeLeft&&bag.quantity>0&&(
          <div style={{position:"absolute",bottom:6,left:6,background:urgent?"#E23744":"rgba(0,0,0,.65)",color:"#fff",fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:20,fontFamily:"'Plus Jakarta Sans',sans-serif",backdropFilter:"blur(3px)",display:"flex",alignItems:"center",gap:3,animation:urgent?"urgentPulse 1s ease infinite":"none"}}>
            ⏱ {timeLeft}
          </div>
        )}
        {/* Viewers */}
        {viewers>1&&bag.quantity>0&&(
          <div style={{position:"absolute",top:6,left:6,background:"rgba(0,0,0,.55)",color:"#fff",fontSize:8,fontWeight:700,padding:"2px 7px",borderRadius:20,fontFamily:"'Plus Jakarta Sans',sans-serif",backdropFilter:"blur(3px)"}}>
            👁 {viewers} viewing
          </div>
        )}
        {disc>=50&&bag.quantity>0&&<div style={{position:"absolute",top:24,left:6,background:"#E23744",color:"#fff",fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{disc}% off</div>}
        {bag.quantity>0&&bag.quantity<=2&&<div style={{position:"absolute",top:disc>=50?42:24,left:6,background:"#16A34A",color:"#fff",fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Last {bag.quantity}!</div>}
        {veg
          ?<div style={{position:"absolute",top:6,right:24,width:16,height:16,borderRadius:4,border:"2px solid #22C55E",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:8,height:8,borderRadius:"50%",background:"#22C55E"}}/></div>
          :<div style={{position:"absolute",top:6,right:24,width:16,height:16,borderRadius:4,border:"2px solid #EF4444",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:8,height:8,borderRadius:"50%",background:"#EF4444"}}/></div>
        }
        <button onClick={e=>{e.stopPropagation();onToggleBookmark();}} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,.4)",border:"none",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:10,color:bookmarked?"#EF4444":"rgba(255,255,255,.8)",zIndex:4,backdropFilter:"blur(3px)"}}>
          {bookmarked?"♥":"♡"}
        </button>
        {bag.quantity===0&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:800,letterSpacing:.8}}>SOLD OUT</div>}
      </div>
      <div style={{padding:"9px 10px 10px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:4,marginBottom:2}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,color:"var(--dark)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1}}>{bag.restaurantName}</div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,fontWeight:800,color:"#fff",background:"#1BA672",borderRadius:5,padding:"2px 6px",whiteSpace:"nowrap",flexShrink:0}}>★ {bag.restaurantRating}</div>
        </div>
        <div style={{fontSize:10,color:"var(--gray)",marginBottom:7,fontFamily:"Nunito",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{bag.restaurantArea} · {bag.type}</div>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
          <div>
            <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:2}}>
              <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:19,fontWeight:800,color:"var(--dark)",letterSpacing:"-.6px",lineHeight:1}}>₹{bag.price}</span>
              <span style={{fontSize:11,color:"var(--gray)",textDecoration:"line-through",fontFamily:"Nunito"}}>₹{bag.original_price}</span>
              {disc>0&&<span style={{fontSize:9,fontWeight:800,color:"#16A34A",background:"#DCFCE7",borderRadius:5,padding:"1px 5px",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{disc}%</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:9.5,color:urgent?"#E23744":"var(--gray)",fontFamily:"Nunito",fontWeight:urgent?700:400}}>⏱ {timeLeft||bag.pickup_start}</span>
              {bag.quantity>0&&<span style={{fontSize:9.5,color:"#E07B39",fontWeight:700,fontFamily:"Nunito"}}>{bag.quantity} left</span>}
            </div>
          </div>
          <button style={{background:"#fff",color:"#2D6A4F",border:"2px solid #2D6A4F",borderRadius:9,width:29,height:29,fontSize:19,cursor:bag.quantity?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:700,opacity:bag.quantity?1:.4}} disabled={!bag.quantity}
            onClick={e=>{e.stopPropagation();onAdd();}}>+</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════
   FEATURE: Waitlist Modal
════════════════════════════════ */
function WaitlistModal({bag,onClose,showToast}){
  const[phone,setPhone]=useState("");
  const[done,setDone]=useState(false);
  function join(){
    if(!phone.trim())return;
    setDone(true);
    showToast("🔔 You're on the waitlist!");
    setTimeout(onClose,1800);
  }
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"var(--card)",borderRadius:20,padding:22,width:"100%",maxWidth:320,border:"1px solid var(--border)"}} onClick={e=>e.stopPropagation()}>
        {done?(
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{fontSize:48,marginBottom:12}}>🔔</div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:16,color:"var(--dark)"}}>You're on the list!</div>
            <div style={{fontSize:12,color:"var(--gray)",fontFamily:"Nunito",marginTop:6}}>We'll notify you the moment a bag drops</div>
          </div>
        ):(
          <>
            <div style={{fontSize:32,textAlign:"center",marginBottom:8}}>⏰</div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:800,color:"var(--dark)",textAlign:"center",marginBottom:4}}>Join the Waitlist</div>
            <div style={{fontSize:12,color:"var(--gray)",fontFamily:"Nunito",textAlign:"center",marginBottom:16}}>Get notified when <strong>{bag?.restaurantName}</strong> drops a new bag tonight</div>
            <div style={{fontSize:10,fontWeight:800,color:"var(--gray)",textTransform:"uppercase",letterSpacing:.5,marginBottom:5,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Your Mobile Number</div>
            <input style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:10,padding:"10px 12px",fontSize:13,fontFamily:"Nunito",outline:"none",color:"var(--dark)",background:"var(--bg)",marginBottom:12}} placeholder="+91 98765 43210" value={phone} onChange={e=>setPhone(e.target.value)} type="tel"/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={onClose} style={{flex:1,background:"var(--bg)",border:"none",borderRadius:10,padding:11,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",color:"var(--gray)"}}>Cancel</button>
              <button onClick={join} style={{flex:2,background:"#2D6A4F",border:"none",borderRadius:10,padding:11,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",color:"#fff"}}>🔔 Notify Me</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════
   FEATURE: Referral Page
════════════════════════════════ */
function ReferralPage({orders,showToast}){
  const code="REBITE-"+Math.random().toString(36).substr(2,6).toUpperCase();
  const[myCode]=useState(code);
  const[referrals]=useState([
    {name:"Priya S.",date:"2 days ago",status:"Ordered",reward:50},
    {name:"Rahul M.",date:"5 days ago",status:"Ordered",reward:50},
  ]);
  const totalEarned=referrals.reduce((s,r)=>s+r.reward,0);

  function share(){
    const msg=`🌱 I've been saving food & money with ReBite!\n\nGet surprise food bags from Delhi's best restaurants at up to 80% off.\n\nUse my code *${myCode}* to get ₹50 off your first bag!\n\nDownload: https://rebite.vercel.app`;
    if(navigator.share){navigator.share({title:"ReBite - Save Food Save Money",text:msg});}
    else{navigator.clipboard.writeText(msg);showToast("📋 Link copied!");}
  }
  function copyCode(){navigator.clipboard.writeText(myCode);showToast("📋 Code copied!");}

  return(
    <div style={{padding:16,animation:"fu 0.3s ease"}}>
      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,marginBottom:4,color:"var(--dark)"}}>Refer & Earn 🤝</div>
      <div style={{fontSize:12,color:"var(--gray)",marginBottom:14,fontFamily:"Nunito"}}>Share ReBite, earn ₹50 for every friend who orders</div>

      {/* Hero card */}
      <div style={{background:"linear-gradient(135deg,#1B4332,#2D6A4F)",borderRadius:20,padding:20,marginBottom:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",width:150,height:150,background:"rgba(255,255,255,.06)",borderRadius:"50%",top:-50,right:-30}}/>
        <div style={{position:"absolute",width:100,height:100,background:"rgba(255,255,255,.04)",borderRadius:"50%",bottom:-30,left:-20}}/>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:"rgba(255,255,255,.7)",marginBottom:4}}>Your referral code</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:26,fontWeight:800,color:"#F9C74F",letterSpacing:2}}>{myCode}</div>
          <button onClick={copyCode} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:9,padding:"6px 12px",color:"#fff",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,cursor:"pointer"}}>Copy</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0,marginBottom:16}}>
          {[[referrals.length,"Friends","👥"],[`₹${totalEarned}`,"Earned","💰"],[referrals.filter(r=>r.status==="Ordered").length,"Orders","📦"]].map(([v,l,ic])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontSize:18}}>{ic}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:18,color:"#fff"}}>{v}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,.6)",fontWeight:700,textTransform:"uppercase",letterSpacing:.4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{l}</div>
            </div>
          ))}
        </div>
        <button onClick={share} style={{width:"100%",background:"#F9C74F",color:"#1B4332",border:"none",borderRadius:13,padding:13,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <span>📤</span> Share with Friends
        </button>
      </div>

      {/* How it works */}
      <div style={{background:"var(--card)",borderRadius:16,padding:14,marginBottom:14,border:"1px solid var(--border)"}}>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:800,color:"var(--gray)",textTransform:"uppercase",letterSpacing:.7,marginBottom:12}}>How it works</div>
        {[["1️⃣","Share your code","Send your unique code to friends via WhatsApp"],["2️⃣","Friend signs up","They create an account & enter your code"],["3️⃣","They order","When they place their first order"],["4️⃣","You earn","₹50 cashback credited to your wallet instantly"]].map(([n,t,d])=>(
          <div key={t} style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start"}}>
            <div style={{fontSize:18,flexShrink:0}}>{n}</div>
            <div><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,color:"var(--dark)"}}>{t}</div><div style={{fontSize:11,color:"var(--gray)",fontFamily:"Nunito",marginTop:2}}>{d}</div></div>
          </div>
        ))}
      </div>

      {/* Referral history */}
      {referrals.length>0&&<>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:800,color:"var(--gray)",textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>Your Referrals</div>
        {referrals.map((r,i)=>(
          <div key={i} style={{background:"var(--card)",borderRadius:13,padding:"11px 13px",marginBottom:8,display:"flex",alignItems:"center",gap:10,border:"1px solid var(--border)"}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:"var(--gp)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>👤</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:"var(--dark)"}}>{r.name}</div>
              <div style={{fontSize:10,color:"var(--gray)",fontFamily:"Nunito"}}>{r.date} · {r.status}</div>
            </div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:14,color:"#16A34A"}}>+₹{r.reward}</div>
          </div>
        ))}
      </>}
    </div>
  );
}

/* ════════════════════════════════
   FEATURE: Loyalty & Streaks Page
════════════════════════════════ */
function LoyaltyPage({orders,streak,showToast}){
  const tBags=orders.length;
  const tCO2=orders.reduce((s,o)=>s+o.co2,0);
  const tSavings=orders.reduce((s,o)=>s+o.savings,0);

  const earnedBadges=BADGES.filter(b=>{
    if(b.type==="co2")return tCO2>=b.req;
    if(b.type==="streak")return streak>=b.req;
    if(b.type==="referral")return false;
    return tBags>=b.req;
  });

  const points=tBags*100+Math.floor(tSavings/10)*5;
  const level=points<500?"Sprout 🌱":points<1500?"Saver 🌿":points<3000?"Hero 🌳":"Legend 🏆";
  const nextLevel=points<500?500:points<1500?1500:points<3000?3000:9999;
  const pct=Math.min(100,Math.round((points/(nextLevel))*100));

  const weekDays=["M","T","W","T","F","S","S"];
  const today=new Date().getDay();
  const activeDays=Array.from({length:7},(_, i)=>i<streak);

  return(
    <div style={{padding:16,animation:"fu 0.3s ease"}}>
      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,marginBottom:4,color:"var(--dark)"}}>Rewards & Streaks 🏆</div>
      <div style={{fontSize:12,color:"var(--gray)",marginBottom:14,fontFamily:"Nunito"}}>Save food daily, level up fast</div>

      {/* Level card */}
      <div style={{background:"linear-gradient(135deg,#7C3AED,#4C1D95)",borderRadius:20,padding:18,marginBottom:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",width:180,height:180,background:"rgba(255,255,255,.05)",borderRadius:"50%",top:-60,right:-40}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.6)",fontWeight:700,textTransform:"uppercase",letterSpacing:.7,fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:2}}>Current Level</div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:22,color:"#fff"}}>{level}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:28,color:"#F9C74F",lineHeight:1}}>{points}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.6)",fontFamily:"Nunito"}}>ReBite Points</div>
          </div>
        </div>
        <div style={{marginBottom:6}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:10,color:"rgba(255,255,255,.7)",fontFamily:"Nunito"}}>Progress to next level</span>
            <span style={{fontSize:10,color:"rgba(255,255,255,.7)",fontFamily:"Nunito"}}>{points}/{nextLevel}</span>
          </div>
          <div style={{height:8,background:"rgba(255,255,255,.2)",borderRadius:6}}>
            <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#F9C74F,#F4845F)",borderRadius:6,transition:"width 1s ease"}}/>
          </div>
        </div>
        <div style={{fontSize:11,color:"rgba(255,255,255,.6)",fontFamily:"Nunito"}}>+100 pts per bag · +5 pts per ₹10 saved</div>
      </div>

      {/* Streak tracker */}
      <div style={{background:"var(--card)",borderRadius:16,padding:14,marginBottom:14,border:"1px solid var(--border)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:800,color:"var(--gray)",textTransform:"uppercase",letterSpacing:.7}}>Daily Streak</div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:24,color:"var(--dark)",marginTop:2}}>{streak} <span style={{fontSize:16}}>🔥</span></div>
          </div>
          <div style={{background:streak>=7?"linear-gradient(135deg,#F9C74F,#F4845F)":"var(--gp)",borderRadius:12,padding:"8px 14px",textAlign:"center"}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:800,color:streak>=7?"#fff":"#2D6A4F"}}>{streak>=7?"Week done! 🏆":`${7-streak} days to go`}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"space-between"}}>
          {weekDays.map((d,i)=>(
            <div key={i} style={{flex:1,textAlign:"center"}}>
              <div style={{fontSize:9,color:"var(--gray)",fontFamily:"Nunito",marginBottom:4}}>{d}</div>
              <div style={{width:"100%",aspectRatio:"1",borderRadius:"50%",background:activeDays[i]?"#2D6A4F":i===streak?"var(--border)":"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",border:`2px solid ${activeDays[i]?"#2D6A4F":i===streak?"#2D6A4F":"var(--border)"}`,fontSize:10,transition:"all .3s"}}>
                {activeDays[i]?"✓":i===streak?"·":""}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[[tBags,"Bags Saved","📦","var(--dark)"],[`₹${tSavings}`,"Total Saved","💰","#16A34A"],[`${tCO2.toFixed(1)}kg`,"CO2 Prevented","🌱","#2D6A4F"],[streak,"Day Streak","🔥","#E23744"]].map(([v,l,ic,c])=>(
          <div key={l} style={{background:"var(--card)",borderRadius:14,padding:"12px 10px",border:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:22,flexShrink:0}}>{ic}</div>
            <div><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:16,color:c}}>{v}</div><div style={{fontSize:9,color:"var(--gray)",textTransform:"uppercase",letterSpacing:.4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{l}</div></div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:800,color:"var(--gray)",textTransform:"uppercase",letterSpacing:.7,marginBottom:10}}>Badges</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
        {BADGES.map(b=>{
          const earned=earnedBadges.find(e=>e.id===b.id);
          return(
            <div key={b.id} style={{background:earned?"var(--gp)":"var(--card)",borderRadius:14,padding:"10px 6px",textAlign:"center",border:`1px solid ${earned?"#2D6A4F":"var(--border)"}`,opacity:earned?1:.5,transition:"all .3s"}}>
              <div style={{fontSize:22,marginBottom:4,filter:earned?"none":"grayscale(1)"}}>{b.icon}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:8,fontWeight:700,color:earned?"#2D6A4F":"var(--gray)",lineHeight:1.3}}>{b.name}</div>
            </div>
          );
        })}
      </div>

      {/* Rewards to redeem */}
      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:800,color:"var(--gray)",textTransform:"uppercase",letterSpacing:.7,marginBottom:10}}>Redeem Points</div>
      {[[500,"₹25 off your next bag","🎁"],[1000,"Free delivery voucher","🛵"],[2000,"₹100 off + priority access","👑"]].map(([req,desc,ic])=>(
        <div key={req} style={{background:"var(--card)",borderRadius:13,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12,border:"1px solid var(--border)",opacity:points>=req?1:.5}}>
          <div style={{fontSize:22,flexShrink:0}}>{ic}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,color:"var(--dark)"}}>{desc}</div>
            <div style={{fontSize:10,color:"var(--gray)",fontFamily:"Nunito"}}>{req} points required</div>
          </div>
          <button disabled={points<req} onClick={()=>showToast(points>=req?"🎉 Redeemed!":"Need more points")} style={{background:points>=req?"#2D6A4F":"var(--border)",color:points>=req?"#fff":"var(--gray)",border:"none",borderRadius:10,padding:"7px 12px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,fontWeight:700,cursor:points>=req?"pointer":"default"}}>
            {points>=req?"Redeem":"Locked"}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════
   FEATURE: Notification Centre
════════════════════════════════ */
function NotificationCentre({notifPermission,onRequestPermission,notifications,onClear}){
  return(
    <div style={{padding:16,animation:"fu 0.3s ease"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,color:"var(--dark)"}}>Notifications 🔔</div>
        {notifications.length>0&&<button onClick={onClear} style={{background:"none",border:"none",color:"var(--gray)",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Clear all</button>}
      </div>
      <div style={{fontSize:12,color:"var(--gray)",marginBottom:14,fontFamily:"Nunito"}}>Stay updated on new bags & deals</div>

      {notifPermission!=="granted"&&(
        <div style={{background:"linear-gradient(135deg,#2D6A4F,#1B4332)",borderRadius:16,padding:16,marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:28,flexShrink:0}}>🔔</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:13,color:"#fff",marginBottom:3}}>Enable Notifications</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.7)",fontFamily:"Nunito"}}>Get alerted when bags drop near you</div>
          </div>
          <button onClick={onRequestPermission} style={{background:"#F9C74F",color:"#1B4332",border:"none",borderRadius:10,padding:"8px 12px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:800,cursor:"pointer",flexShrink:0}}>Enable</button>
        </div>
      )}

      {notifPermission==="granted"&&(
        <div style={{background:"var(--gp)",borderRadius:13,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8,border:"1px solid rgba(45,106,79,.2)"}}>
          <span style={{fontSize:14}}>✅</span>
          <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,color:"#2D6A4F"}}>Push notifications are enabled</span>
        </div>
      )}

      {notifications.length===0?(
        <div style={{textAlign:"center",padding:"40px 16px",color:"var(--gray)"}}>
          <div style={{fontSize:44,marginBottom:10}}>🔔</div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:15,color:"var(--dark)",marginBottom:6}}>All quiet for now</div>
          <div style={{fontSize:12,fontFamily:"Nunito"}}>We'll notify you when bags drop in your saved areas</div>
        </div>
      ):(
        notifications.map((n,i)=>(
          <div key={i} style={{background:"var(--card)",borderRadius:13,padding:"12px 14px",marginBottom:8,display:"flex",gap:10,alignItems:"flex-start",border:"1px solid var(--border)",borderLeft:`3px solid ${n.color||"#2D6A4F"}`}}>
            <div style={{fontSize:22,flexShrink:0}}>{n.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,color:"var(--dark)",marginBottom:2}}>{n.title}</div>
              <div style={{fontSize:11,color:"var(--gray)",fontFamily:"Nunito",lineHeight:1.5}}>{n.body}</div>
              <div style={{fontSize:9,color:"var(--gray)",marginTop:4,fontFamily:"Nunito"}}>{n.time}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ════════════════════════════════
   FEATURE: AI Meal Suggestions
════════════════════════════════ */
function AIMealSuggestionsPage({bags}){
  const[prefs,setPrefs]=useState({diet:"any",budget:"any",mood:""});
  const[suggestions,setSuggestions]=useState(null);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const moodOptions=["🌿 Light","🔥 Hearty","☕ Cozy","🎉 Treat","⚡ Quick"];

  async function getSuggestions(){
    setLoading(true);setError("");setSuggestions(null);
    const bagSummary=bags.slice(0,8).map(b=>`${b.restaurantName} (${b.type}, ₹${b.price}, ${b.restaurantArea})`).join(", ");
    const prompt=`You are ReBite AI in Delhi. Available bags: ${bagSummary}. User: diet=${prefs.diet}, budget=${prefs.budget==="any"?"flexible":"under ₹"+prefs.budget}, mood=${prefs.mood||"open"}. Give 3 recommendations as JSON only (no markdown): {"recommendations":[{"bag":"name","why":"...","pair":"...","calories":N,"fact":"..."}]}`;
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY||"","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      const text=data.content?.map(i=>i.text||"").join("");
      setSuggestions(JSON.parse(text.replace(/```json|```/g,"").trim()).recommendations);
    }catch(e){setError("Couldn't load suggestions. Check API key.");}
    setLoading(false);
  }

  return(
    <div style={{padding:16,animation:"fu 0.3s ease"}}>
      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,marginBottom:4,color:"var(--dark)"}}>AI Meal Planner 🤖</div>
      <div style={{fontSize:12,color:"var(--gray)",marginBottom:14,fontFamily:"Nunito"}}>Claude picks the best bags for you tonight</div>
      <div style={{background:"var(--card)",borderRadius:16,padding:14,marginBottom:12,border:"1px solid var(--border)"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          {[{label:"Diet",key:"diet",opts:[["any","🍽 Any"],["vegetarian","🌿 Veg"],["vegan","🌱 Vegan"],["high-protein","💪 Protein"]]},{label:"Budget",key:"budget",opts:[["any","Any"],["100","≤₹100"],["150","≤₹150"],["200","≤₹200"]]}].map(f=>(
            <div key={f.key}>
              <div style={{fontSize:10,fontWeight:800,color:"var(--gray)",textTransform:"uppercase",letterSpacing:.7,marginBottom:5,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{f.label}</div>
              <select style={{width:"100%",background:"var(--bg)",border:"1.5px solid var(--border)",borderRadius:9,padding:"8px 10px",fontSize:12,fontFamily:"Nunito",color:"var(--dark)",outline:"none"}} value={prefs[f.key]} onChange={e=>setPrefs(p=>({...p,[f.key]:e.target.value}))}>
                {f.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:800,color:"var(--gray)",textTransform:"uppercase",letterSpacing:.7,marginBottom:6,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Mood</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {moodOptions.map(m=>(
              <button key={m} onClick={()=>setPrefs(p=>({...p,mood:p.mood===m?"":m}))} style={{padding:"5px 10px",borderRadius:20,border:`1.5px solid ${prefs.mood===m?"#2D6A4F":"var(--border)"}`,background:prefs.mood===m?"#2D6A4F":"var(--bg)",color:prefs.mood===m?"#fff":"var(--dark)",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{m}</button>
            ))}
          </div>
        </div>
        <button onClick={getSuggestions} disabled={loading} style={{width:"100%",background:loading?"var(--border)":"linear-gradient(135deg,#2D6A4F,#1e4d38)",color:loading?"var(--gray)":"#fff",border:"none",borderRadius:12,padding:13,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:800,cursor:loading?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {loading?<><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>🌿</span> Thinking...</>:<><span>✨</span> Get AI Suggestions</>}
        </button>
      </div>
      {error&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:12,padding:12,fontSize:13,color:"#EF4444",fontFamily:"Nunito",marginBottom:12}}>⚠️ {error}</div>}
      {suggestions&&suggestions.map((s,i)=>(
        <div key={i} style={{background:"var(--card)",borderRadius:16,padding:14,marginBottom:10,border:"1px solid var(--border)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#2D6A4F,#52B788)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:13,flexShrink:0}}>#{i+1}</div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:14,color:"var(--dark)"}}>{s.bag}</div>
          </div>
          <div style={{fontSize:12,color:"var(--gray)",lineHeight:1.7,marginBottom:8,fontFamily:"Nunito"}}>{s.why}</div>
          <div style={{background:"var(--gp)",borderRadius:10,padding:"8px 12px",marginBottom:8,display:"flex",gap:8}}>
            <span style={{fontSize:14}}>🍽</span>
            <div><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,fontWeight:800,color:"#2D6A4F",textTransform:"uppercase",marginBottom:2}}>Pair at home</div><div style={{fontSize:12,color:"#2D6A4F",fontFamily:"Nunito"}}>{s.pair}</div></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1,background:"var(--bg)",borderRadius:9,padding:"6px 10px",textAlign:"center",border:"1px solid var(--border)"}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:14,color:"var(--dark)"}}>{s.calories}</div>
              <div style={{fontSize:9,color:"var(--gray)",textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Calories</div>
            </div>
            <div style={{flex:2,background:"var(--bg)",borderRadius:9,padding:"6px 10px",border:"1px solid var(--border)"}}>
              <div style={{fontSize:9,color:"#52B788",fontWeight:800,textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:2}}>🌱 Eco fact</div>
              <div style={{fontSize:11,color:"var(--gray)",fontFamily:"Nunito"}}>{s.fact}</div>
            </div>
          </div>
        </div>
      ))}
      {!suggestions&&!loading&&<div style={{textAlign:"center",padding:"30px 16px",color:"var(--gray)"}}><div style={{fontSize:44,marginBottom:10}}>🤖</div><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:15,color:"var(--dark)",marginBottom:6}}>Claude knows what's good</div><div style={{fontSize:12,fontFamily:"Nunito"}}>Set your preferences above to get personalized picks</div></div>}
    </div>
  );
}

/* ════════════════════════════════
   FEATURE: Nutrition Tracker
════════════════════════════════ */
function NutritionPage(){
  const[logs,setLogs]=useState([{id:1,name:"Morning Chai",calories:45,protein:1,carbs:8,fat:1,fiber:0,time:"08:00",emoji:"☕"},{id:2,name:"Spice Garden Meal Bag",calories:580,protein:22,carbs:75,fat:14,fiber:6,time:"13:30",emoji:"🍛"}]);
  const[showAdd,setShowAdd]=useState(false);
  const[form,setForm]=useState({name:"",calories:"",protein:"",carbs:"",fat:"",time:"18:00",emoji:"🍽"});
  const totals={calories:logs.reduce((s,l)=>s+l.calories,0),protein:logs.reduce((s,l)=>s+l.protein,0),carbs:logs.reduce((s,l)=>s+l.carbs,0),fat:logs.reduce((s,l)=>s+l.fat,0),fiber:logs.reduce((s,l)=>s+(l.fiber||0),0)};
  const pct=k=>Math.min(100,Math.round((totals[k]/DAILY_GOALS[k])*100));
  const pieData=[{name:"Protein",value:totals.protein*4,color:"#52B788"},{name:"Carbs",value:totals.carbs*4,color:"#F9C74F"},{name:"Fat",value:totals.fat*9,color:"#F4845F"}].filter(d=>d.value>0);
  const weekData=[{day:"Mon",calories:1650},{day:"Tue",calories:1820},{day:"Wed",calories:2100},{day:"Thu",calories:1750},{day:"Fri",calories:1900},{day:"Sat",calories:2200},{day:"Sun",calories:totals.calories}];

  return(
    <div style={{padding:16,animation:"fu 0.3s ease"}}>
      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,marginBottom:4,color:"var(--dark)"}}>Nutrition Tracker 🥗</div>
      <div style={{fontSize:12,color:"var(--gray)",marginBottom:14,fontFamily:"Nunito"}}>Track what you eat today</div>
      <div style={{background:"linear-gradient(135deg,#1B4332,#2D6A4F)",borderRadius:20,padding:16,marginBottom:12,display:"flex",alignItems:"center",gap:16}}>
        <div style={{position:"relative",width:90,height:90,flexShrink:0}}>
          <svg viewBox="0 0 90 90" style={{width:90,height:90,transform:"rotate(-90deg)"}}>
            <circle cx={45} cy={45} r={38} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={8}/>
            <circle cx={45} cy={45} r={38} fill="none" stroke="#A7E8C3" strokeWidth={8} strokeDasharray={`${2*Math.PI*38}`} strokeDashoffset={`${2*Math.PI*38*(1-pct("calories")/100)}`} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s ease"}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:18,color:"#fff"}}>{pct("calories")}</div>
            <div style={{fontSize:8,color:"rgba(255,255,255,.6)",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>%</div>
          </div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:22,color:"#fff"}}>{totals.calories} kcal</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.6)",fontFamily:"Nunito",marginBottom:4}}>of {DAILY_GOALS.calories} goal</div>
          <div style={{fontSize:12,color:"#A7E8C3",fontWeight:700,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{DAILY_GOALS.calories-totals.calories>0?`${DAILY_GOALS.calories-totals.calories} remaining`:"Goal reached! 🎉"}</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div style={{background:"var(--card)",borderRadius:16,padding:12,border:"1px solid var(--border)"}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,fontWeight:800,color:"var(--gray)",textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>Macro Split</div>
          <ResponsiveContainer width="100%" height={90}><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={26} outerRadius={44} paddingAngle={3} dataKey="value">{pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie></PieChart></ResponsiveContainer>
        </div>
        <div style={{background:"var(--card)",borderRadius:16,padding:12,border:"1px solid var(--border)"}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,fontWeight:800,color:"var(--gray)",textTransform:"uppercase",letterSpacing:.7,marginBottom:8}}>This Week</div>
          <ResponsiveContainer width="100%" height={90}><BarChart data={weekData} barSize={8}><XAxis dataKey="day" tick={{fontSize:7,fill:"var(--gray)"}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip contentStyle={{fontSize:10,borderRadius:8}} formatter={v=>[`${v} kcal`,""]} /><Bar dataKey="calories" fill="#52B788" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
        </div>
      </div>
      <div style={{background:"var(--card)",borderRadius:16,padding:14,marginBottom:12,border:"1px solid var(--border)"}}>
        {[{k:"protein",label:"Protein",color:"#52B788",unit:"g"},{k:"carbs",label:"Carbs",color:"#F9C74F",unit:"g"},{k:"fat",label:"Fat",color:"#F4845F",unit:"g"}].map(m=>(
          <div key={m.k} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,color:"var(--dark)"}}>{m.label}</span><span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,color:"var(--gray)"}}>{totals[m.k]}{m.unit}/{DAILY_GOALS[m.k]}{m.unit}</span></div>
            <div style={{height:8,background:"var(--bg)",borderRadius:6,overflow:"hidden"}}><div style={{height:"100%",width:`${pct(m.k)}%`,background:m.color,borderRadius:6,transition:"width 1s ease"}}/></div>
          </div>
        ))}
      </div>
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:800,color:"var(--gray)",textTransform:"uppercase",letterSpacing:.7}}>Today's Log</div>
          <button onClick={()=>setShowAdd(true)} style={{background:"#2D6A4F",color:"#fff",border:"none",borderRadius:9,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>+ Add</button>
        </div>
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--gray)",fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:6}}>Quick add ReBite bag:</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {Object.keys(MACRO_PRESETS).map(t=>(
              <button key={t} onClick={()=>setLogs(p=>[...p,{id:Date.now(),name:`ReBite ${t} Bag`,time:new Date().getHours()+":00",emoji:EMOJI[t]||"🛍",...MACRO_PRESETS[t]}])} style={{padding:"4px 9px",borderRadius:20,border:"1.5px solid var(--border)",background:"var(--card)",fontSize:10,fontWeight:700,cursor:"pointer",color:"var(--dark)",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{EMOJI[t]||"🛍"} {t}</button>
            ))}
          </div>
        </div>
        {logs.map(l=>(
          <div key={l.id} style={{background:"var(--card)",borderRadius:12,padding:"10px 12px",marginBottom:7,display:"flex",alignItems:"center",gap:10,border:"1px solid var(--border)"}}>
            <div style={{fontSize:22,flexShrink:0}}>{l.emoji}</div>
            <div style={{flex:1}}><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,color:"var(--dark)"}}>{l.name}</div><div style={{fontSize:10,color:"var(--gray)",fontFamily:"Nunito"}}>{l.time} · P:{l.protein}g C:{l.carbs}g</div></div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:14,color:"var(--dark)",flexShrink:0}}>{l.calories}<span style={{fontSize:9,color:"var(--gray)"}}> kcal</span></div>
            <button onClick={()=>setLogs(p=>p.filter(i=>i.id!==l.id))} style={{background:"none",border:"none",color:"var(--gray)",fontSize:14,cursor:"pointer",padding:0,flexShrink:0}}>✕</button>
          </div>
        ))}
      </div>
      {showAdd&&(<>
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:600}} onClick={()=>setShowAdd(false)}/>
        <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"min(430px,100vw)",background:"var(--card)",borderRadius:"24px 24px 0 0",padding:"20px 16px 32px",zIndex:700}}>
          <div style={{width:36,height:4,background:"var(--border)",borderRadius:4,margin:"0 auto 16px"}}/>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:800,marginBottom:14,color:"var(--dark)"}}>Log Food Item</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div style={{gridColumn:"span 2"}}><input style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:9,padding:"9px 11px",fontSize:13,fontFamily:"Nunito",outline:"none",color:"var(--dark)",background:"var(--bg)"}} placeholder="Food name e.g. Chai" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
            {[{k:"calories",placeholder:"Calories"},{k:"protein",placeholder:"Protein g"},{k:"carbs",placeholder:"Carbs g"},{k:"fat",placeholder:"Fat g"}].map(f=>(
              <input key={f.k} type="number" style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:9,padding:"9px 11px",fontSize:13,fontFamily:"Nunito",outline:"none",color:"var(--dark)",background:"var(--bg)"}} placeholder={f.placeholder} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}/>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowAdd(false)} style={{flex:1,background:"var(--bg)",border:"none",borderRadius:9,padding:11,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",color:"var(--gray)"}}>Cancel</button>
            <button onClick={()=>{if(!form.name||!form.calories)return;setLogs(p=>[...p,{id:Date.now(),...form,calories:+form.calories,protein:+form.protein||0,carbs:+form.carbs||0,fat:+form.fat||0,fiber:0}]);setForm({name:"",calories:"",protein:"",carbs:"",fat:"",time:"18:00",emoji:"🍽"});setShowAdd(false);}} style={{flex:2,background:"#2D6A4F",border:"none",borderRadius:9,padding:11,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",color:"#fff"}}>Add</button>
          </div>
        </div>
      </>)}
    </div>
  );
}

/* ════════════════════════════════
   FEATURE: Reviews Section
════════════════════════════════ */
function ReviewsSection({bagId}){
  const[reviews,setReviews]=useState([{id:1,user:"Priya S.",rating:5,text:"Amazing value! The bag had 4 croissants and a loaf of bread.",time:"2 days ago",helpful:12},{id:2,user:"Rahul M.",rating:4,text:"Good quantity, fresh food. Will order again!",time:"5 days ago",helpful:7}]);
  const[showForm,setShowForm]=useState(false);
  const[newRev,setNewRev]=useState({rating:5,text:""});
  const avg=(reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1);
  return(
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div><span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,fontWeight:800,color:"var(--gray)",textTransform:"uppercase",letterSpacing:.7}}>Reviews</span><div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}><span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:18,color:"var(--dark)"}}>{avg}</span><div style={{display:"flex",gap:2}}>{"★★★★★".split("").map((s,i)=><span key={i} style={{color:i<Math.round(avg)?"#F59E0B":"var(--border)",fontSize:13}}>{s}</span>)}</div><span style={{fontSize:10,color:"var(--gray)",fontFamily:"Nunito"}}>({reviews.length})</span></div></div>
        <button onClick={()=>setShowForm(v=>!v)} style={{background:"var(--gp)",color:"#2D6A4F",border:"none",borderRadius:10,padding:"7px 12px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,cursor:"pointer"}}>{showForm?"Cancel":"✏️ Review"}</button>
      </div>
      {showForm&&(<div style={{background:"var(--sh)",borderRadius:14,padding:12,marginBottom:12,border:"1.5px solid var(--border)"}}>
        <div style={{display:"flex",gap:6,marginBottom:10}}>{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setNewRev(p=>({...p,rating:n}))} style={{background:"none",border:"none",fontSize:24,cursor:"pointer",filter:n<=newRev.rating?"none":"grayscale(1)"}}>⭐</button>)}</div>
        <textarea style={{width:"100%",border:"1.5px solid var(--border)",borderRadius:9,padding:"9px 11px",fontSize:12,fontFamily:"Nunito",color:"var(--dark)",background:"var(--card)",outline:"none",resize:"none"}} rows={3} placeholder="Share your experience..." value={newRev.text} onChange={e=>setNewRev(p=>({...p,text:e.target.value}))}/>
        <button onClick={()=>{if(!newRev.text.trim())return;setReviews(p=>[{id:Date.now(),user:"You",rating:newRev.rating,text:newRev.text,time:"Just now",helpful:0},...p]);setNewRev({rating:5,text:""});setShowForm(false);}} style={{marginTop:8,width:"100%",background:"#2D6A4F",color:"#fff",border:"none",borderRadius:10,padding:"10px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>Submit</button>
      </div>)}
      {reviews.map(r=>(
        <div key={r.id} style={{background:"var(--card)",borderRadius:13,padding:"11px 13px",marginBottom:8,border:"1px solid var(--border)"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><div><span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,color:"var(--dark)"}}>{r.user}</span><div style={{display:"flex",gap:1,marginTop:2}}>{"★★★★★".split("").map((s,i)=><span key={i} style={{color:i<r.rating?"#F59E0B":"var(--border)",fontSize:10}}>{s}</span>)}</div></div><span style={{fontSize:9,color:"var(--gray)",fontFamily:"Nunito"}}>{r.time}</span></div>
          <div style={{fontSize:12,color:"var(--gray)",lineHeight:1.7,fontFamily:"Nunito",marginBottom:6}}>{r.text}</div>
          <button style={{background:"none",border:"1px solid var(--border)",borderRadius:8,padding:"3px 9px",fontSize:9,color:"var(--gray)",cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700}} onClick={()=>setReviews(p=>p.map(rev=>rev.id===r.id?{...rev,helpful:rev.helpful+1}:rev))}>👍 Helpful ({r.helpful})</button>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════
   FEATURE: Bookmarks Page
════════════════════════════════ */
function BookmarksPage({bookmarks,bags,onRemove,onOpenBag}){
  const bookmarkedBags=bags.filter(b=>bookmarks.has(b.restaurantName));
  return(
    <div style={{padding:16,animation:"fu 0.3s ease"}}>
      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,marginBottom:4,color:"var(--dark)"}}>Saved Places 🔖</div>
      <div style={{fontSize:12,color:"var(--gray)",marginBottom:16,fontFamily:"Nunito"}}>{bookmarks.size} saved restaurants</div>
      {bookmarkedBags.length===0?(<div style={{textAlign:"center",padding:"50px 16px",color:"var(--gray)"}}><div style={{fontSize:48,marginBottom:12}}>🔖</div><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:15,color:"var(--dark)",marginBottom:6}}>No saved yet</div><div style={{fontSize:12,fontFamily:"Nunito"}}>Tap ♡ on any card to save it</div></div>):(
        bookmarkedBags.map(bag=>{
          const d=getDisc(bag);const{timeLeft,urgent}=useCountdown(bag.pickup_end);
          return(
            <div key={bag.id} style={{background:"var(--card)",borderRadius:16,overflow:"hidden",border:"1px solid var(--border)",boxShadow:"0 2px 12px var(--card-shadow)",cursor:"pointer",marginBottom:10}} onClick={()=>onOpenBag(bag)}>
              <div style={{display:"flex",height:80}}>
                <img src={getDishImage(bag)} alt="" style={{width:90,height:80,objectFit:"cover",flexShrink:0}}/>
                <div style={{padding:"10px 12px",flex:1,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:4}}>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:"var(--dark)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{bag.restaurantName}</div>
                    <button onClick={e=>{e.stopPropagation();onRemove(bag.restaurantName);}} style={{background:"none",border:"none",color:"#EF4444",fontSize:16,cursor:"pointer",flexShrink:0,padding:0}}>♥</button>
                  </div>
                  <div style={{fontSize:10,color:"var(--gray)",fontFamily:"Nunito"}}>{bag.restaurantArea} · {bag.type}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:16,color:"var(--dark)"}}>₹{bag.price}</span>
                    <span style={{fontSize:10,color:"var(--gray)",textDecoration:"line-through",fontFamily:"Nunito"}}>₹{bag.original_price}</span>
                    {d>0&&<span style={{fontSize:9,fontWeight:800,color:"#16A34A",background:"#DCFCE7",borderRadius:5,padding:"1px 5px",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{d}%</span>}
                    {timeLeft&&<span style={{marginLeft:"auto",fontSize:9,color:urgent?"#E23744":"var(--gray)",fontWeight:urgent?700:400,fontFamily:"Nunito"}}>⏱ {timeLeft}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ════════════════════════════════
   FEATURE: Explore Map
════════════════════════════════ */
function ExplorePage({bags,onAreaSelect}){
  const mr=useRef(null),inst=useRef(null);
  const[mapArea,setMapArea]=useState("All");
  const COORDS={CP:[28.6315,77.2167],"Hauz Khas":[28.5494,77.2001],GK:[28.5391,77.2355],Saket:[28.5244,77.2066],Rajouri:[28.6419,77.1143]};
  const filteredBags=mapArea==="All"?bags:bags.filter(b=>b.restaurantArea===mapArea);
  const areaCounts=AREAS.filter(a=>a!=="All").map(a=>({name:a,icon:AREA_ICONS[a]||"📍",count:bags.filter(b=>b.restaurantArea===a).length,available:bags.filter(b=>b.restaurantArea===a&&b.quantity>0).length}));
  useEffect(()=>{
    if(inst.current){inst.current.remove();inst.current=null;}
    const init=()=>{if(!mr.current)return;const L=window.L,m=L.map(mr.current).setView([28.585,77.19],11);inst.current=m;L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OSM"}).addTo(m);const g={};filteredBags.forEach(b=>{if(!g[b.restaurantArea])g[b.restaurantArea]=[];g[b.restaurantArea].push(b);});Object.entries(g).forEach(([a,ab])=>{const c=COORDS[a];if(!c)return;const avail=ab.filter(b=>b.quantity>0).length;const icon=L.divIcon({html:`<div style="background:${avail>0?"#2D6A4F":"#666"};color:#fff;font-family:sans-serif;font-weight:700;font-size:11px;padding:5px 10px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.3)">${AREA_ICONS[a]||"📍"} ${a} · ${avail}</div>`,className:"",iconAnchor:[46,14]});L.marker(c,{icon}).addTo(m).bindPopup(`<b>${a}</b><br>${avail} available`);});};
    if(!document.getElementById("lf-css")){const l=document.createElement("link");l.id="lf-css";l.rel="stylesheet";l.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(l);}
    if(window.L)init();else{const s=document.createElement("script");s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";s.onload=init;document.body.appendChild(s);}
    return()=>{if(inst.current){inst.current.remove();inst.current=null;}};
  },[filteredBags.length,mapArea]);
  return(
    <div style={{padding:16,animation:"fu 0.3s ease"}}>
      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,marginBottom:4,color:"var(--dark)"}}>Explore Delhi 🗺️</div>
      <div style={{fontSize:12,color:"var(--gray)",marginBottom:10,fontFamily:"Nunito"}}>Live bag availability across Delhi</div>
      <div style={{display:"flex",gap:6,marginBottom:10,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
        {["All",...AREAS.filter(a=>a!=="All")].map(a=>(
          <button key={a} onClick={()=>setMapArea(a)} style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${mapArea===a?"#2D6A4F":"var(--border)"}`,background:mapArea===a?"#2D6A4F":"var(--card)",color:mapArea===a?"#fff":"var(--dark)",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            {a==="All"?"🗺 All":AREA_ICONS[a]+" "+a}
          </button>
        ))}
      </div>
      <div style={{borderRadius:16,overflow:"hidden",marginBottom:14,boxShadow:"0 3px 16px rgba(0,0,0,.12)",border:"1px solid var(--border)"}}>
        <div ref={mr} style={{width:"100%",height:220}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
        {[[filteredBags.filter(b=>b.quantity>0).length,"Available","#2D6A4F"],[filteredBags.length,"Total","var(--dark)"],[filteredBags.filter(b=>b.quantity===0).length,"Sold Out","#F4845F"]].map(([v,l,c])=>(
          <div key={l} style={{background:"var(--card)",borderRadius:13,padding:"10px 8px",textAlign:"center",border:"1px solid var(--border)"}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:18,color:c}}>{v}</div>
            <div style={{fontSize:9,color:"var(--gray)",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {areaCounts.map(a=>(
          <div key={a.name} style={{background:"var(--card)",borderRadius:14,padding:"12px 13px",display:"flex",alignItems:"center",gap:11,cursor:"pointer",border:"1px solid var(--border)"}} onClick={()=>onAreaSelect(a.name)}>
            <div style={{width:42,height:42,borderRadius:12,background:"var(--gp)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,flexShrink:0}}>{a.icon}</div>
            <div style={{flex:1}}><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:700,color:"var(--dark)"}}>{a.name}</div><div style={{fontSize:10,color:"var(--gray)",fontFamily:"Nunito",marginTop:2}}>{a.available} available · {a.count-a.available} sold out</div></div>
            <div style={{width:10,height:10,borderRadius:"50%",background:a.available>0?"#22C55E":"#EF4444"}}/>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════
   MAIN APP
════════════════════════════════ */
export default function App(){
  const[splashDone,setSplashDone]=useState(false);
  const[authed,setAuthed]=useState(true);
  const[dark,setDark]=useState(false);
  const[tab,setTab]=useState("home");
  const[restaurants,setRestaurants]=useState(DEMO_RESTAURANTS);
  const[bags,setBags]=useState(DEMO_BAGS);
  const[loading,setLoading]=useState(false);
  const[bookmarks,setBookmarks]=useState(new Set(["The Pastry House","Sweet Escape"]));

  // New feature state
  const[streak,setStreak]=useState(3);
  const[waitlistBag,setWaitlistBag]=useState(null);
  const[notifPermission,setNotifPermission]=useState(Notification?.permission||"default");
  const[notifications,setNotifications]=useState([
    {icon:"🛍️",title:"New Bag Available!",body:"The Pastry House just dropped a Bakery bag in CP — only 3 left!",time:"5 min ago",color:"#2D6A4F"},
    {icon:"🔥",title:"Flash Deal Alert",body:"Sweet Escape Dessert bag now 70% off. Pickup closes in 45 mins!",time:"12 min ago",color:"#E23744"},
    {icon:"🏆",title:"Badge Unlocked!",body:"You've earned the '3-Day Streak' badge. Keep it up!",time:"1 hour ago",color:"#7C3AED"},
  ]);
  const[notifBadge,setNotifBadge]=useState(3);

  const[search,setSearch]=useState("");
  const[areaFilter,setAreaFilter]=useState("All");
  const[typeFilter,setTypeFilter]=useState("All");
  const[vegOnly,setVegOnly]=useState(false);
  const[sortBy,setSortBy]=useState("default");
  const[maxPrice,setMaxPrice]=useState(500);
  const[chip4plus,setChip4plus]=useState(false);
  const[chipGreat,setChipGreat]=useState(false);
  const[openDD,setOpenDD]=useState(null);
  const[ddPos,setDdPos]=useState({top:0,left:0,width:210});
  const ddRef=useRef(null);
  const[cart,setCart]=useState([]);
  const[showCart,setShowCart]=useState(false);
  const[selectedBag,setSelectedBag]=useState(null);
  const[selectedTime,setSelectedTime]=useState("");
  const[detailMode,setDetailMode]=useState("pickup");
  const[deliveryAddr,setDeliveryAddr]=useState("");
  const[orders,setOrders]=useState([]);
  const[toast,setToast]=useState(null);
  const[toastKey,setToastKey]=useState(0);
  const[modal,setModal]=useState(null);
  const[profile,setProfile]=useState({name:"Delhi Food Saver",email:"foodsaver@gmail.com"});
  const[vegBanner,setVegBanner]=useState(false);
  const scrollRef=useRef(null);

  useEffect(()=>{fetchData();},[]);
  async function fetchData(){
    setLoading(true);
    try{
      const[{data:r},{data:b}]=await Promise.all([supabase.from("restaurants").select("*"),supabase.from("bags").select("*").eq("is_active",true)]);
      if(r&&r.length>0)setRestaurants(r);
      if(b&&b.length>0)setBags(b);
    }catch(e){console.log("Using demo data",e);}
    setLoading(false);
  }

  // Simulate new bag notifications every ~2 mins
  useEffect(()=>{
    const iv=setInterval(()=>{
      const newNotif={icon:"🆕",title:"New bag just dropped!",body:"Brew Lab added a Cafe surprise bag in Saket — grab it fast!",time:"Just now",color:"#2D6A4F"};
      setNotifications(p=>[newNotif,...p]);
      setNotifBadge(v=>v+1);
      sendNotification("🆕 New bag dropped!","Brew Lab added a Cafe bag in Saket");
    },120000);
    return()=>clearInterval(iv);
  },[]);

  const showToast=m=>{setToast(m);setToastKey(k=>k+1);setTimeout(()=>setToast(null),2200);};
  const toggleBookmark=name=>{setBookmarks(p=>{const n=new Set(p);if(n.has(name)){n.delete(name);showToast("🔖 Removed");}else{n.add(name);showToast("🔖 Saved!");}return n;});};

  async function handleRequestNotification(){
    const granted=await requestNotificationPermission();
    setNotifPermission(granted?"granted":"denied");
    if(granted){showToast("🔔 Notifications enabled!");sendNotification("Welcome to ReBite! 🌱","You'll get alerts when new bags drop near you");}
    else showToast("⚠️ Permission denied");
  }

  const enriched=bags.map(b=>{const r=restaurants.find(r=>String(r.id)===String(b.restaurant_id))||{};return{...b,restaurantName:r.name||"Unknown",restaurantArea:r.area||"",restaurantCategory:r.category||"",restaurantRating:Number(r.rating)||4.0,restaurantImage:r.image_url||"",restaurantDesc:r.description||""};});
  const filtered=enriched.filter(b=>{
    const q=search.toLowerCase().trim();
    if(q){const hay=[b.restaurantName,b.restaurantArea,b.type||"",b.restaurantCategory].join(" ").toLowerCase();if(!hay.includes(q))return false;}
    if(areaFilter!=="All"&&(b.restaurantArea||"").trim()!==areaFilter.trim())return false;
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
  function clearAll(){setSearch("");setAreaFilter("All");setTypeFilter("All");setVegOnly(false);setMaxPrice(500);setSortBy("default");setChip4plus(false);setChipGreat(false);setOpenDD(null);}
  function openDropdown(name,e){e.stopPropagation();const btn=e.currentTarget.getBoundingClientRect();const appEl=document.querySelector(".app");const ar=appEl?appEl.getBoundingClientRect():{left:0,width:430};const w=name==="price"?240:210;let l=btn.left-ar.left;if(l+w>ar.width-8)l=ar.width-w-8;if(l<4)l=4;setDdPos({top:btn.bottom+6,left:ar.left+l,width:w});setOpenDD(prev=>prev===name?null:name);}
  function addToCart(bag,mode,time,addr){if(!bag.quantity)return;setCart(p=>{if(p.find(i=>i.id===bag.id)){showToast("Already in bag!");return p;}return[...p,{...bag,mode,pickedTime:time||bag.pickup_start,deliveryAddr:addr||"",dishImage:getDishImage(bag)}];});showToast("🛍️ Added to bag!");}
  const removeFromCart=id=>setCart(p=>p.filter(i=>i.id!==id));
  const cartTotal=cart.reduce((s,i)=>s+Number(i.price),0);
  const cartSavings=cart.reduce((s,i)=>s+(Number(i.original_price)-Number(i.price)),0);

  function handleCheckout(){
    if(!cart.length)return;
    const newOrders=cart.map(i=>({id:`RB${Math.floor(Math.random()*9000)+1000}`,name:i.restaurantName,emoji:EMOJI[i.type]||EMOJI.default,dishImage:i.dishImage,date:"Just now",mode:i.mode==="delivery"?"Delivery":"Pickup",deliveryAddr:i.deliveryAddr,price:Number(i.price),savings:Number(i.original_price)-Number(i.price),co2:CO2_PER_BAG,type:i.type}));
    setOrders(p=>[...newOrders,...p]);
    setStreak(s=>s+1);
    // Razorpay stub - in production: window.Razorpay({...}).open()
    showToast("🎉 Order placed! (+100 pts)");
    setCart([]);setShowCart(false);
    // Unlock badge notification
    if(orders.length+1===1){setNotifications(p=>[{icon:"🌱",title:"Badge Unlocked!",body:"You earned the 'First Save' badge!",time:"Just now",color:"#2D6A4F"},...p]);setNotifBadge(v=>v+1);}
  }

  const tBags=orders.length;const tSavings=orders.reduce((s,o)=>s+o.savings,0);const tCO2=orders.reduce((s,o)=>s+o.co2,0).toFixed(1);
  const sortLabels={default:"Sort",price_asc:"Price ↑",price_desc:"Price ↓",discount:"Discount",rating:"Rating"};

  if(!splashDone)return(<><style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&family=Nunito:wght@600&display=swap');*{margin:0;padding:0;box-sizing:border-box;}`}</style><SplashScreen onDone={()=>setSplashDone(true)}/></>);

  const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
:root{--green:#2D6A4F;--gl:#52B788;--orange:#E23744;--yellow:#F9C74F;--w:430px;--fh:'Plus Jakarta Sans',sans-serif;--fb:'Nunito',sans-serif;
--bg:${dark?"#0E1410":"#F4F5F2"};--card:${dark?"#182018":"#ffffff"};--border:${dark?"#263028":"#E8E8E8"};--dark:${dark?"#E6F0E8":"#111111"};
--gray:${dark?"#7A967C":"#7A7A7A"};--sbg:${dark?"#182018":"#ffffff"};--sh:${dark?"rgba(255,255,255,.03)":"#F7F7F5"};
--gp:${dark?"#152A19":"#E6F4EC"};--card-shadow:${dark?"rgba(0,0,0,.28)":"rgba(0,0,0,.05)"};--card-shadow-hover:${dark?"rgba(0,0,0,.38)":"rgba(0,0,0,.11)"};}
html,body{height:100%;background:${dark?"#070C08":"#D8DDD4"};}
body{font-family:var(--fb);-webkit-font-smoothing:antialiased;}
.shell{width:100vw;height:100vh;display:flex;justify-content:center;overflow:hidden;}
.app{width:var(--w);height:100vh;background:var(--bg);display:flex;flex-direction:column;box-shadow:0 0 80px rgba(0,0,0,.3);overflow:hidden;position:relative;}
@media(max-width:460px){:root{--w:100vw;}.shell,.app{height:100dvh;}.app{box-shadow:none;}}
.sticky-top{flex-shrink:0;z-index:60;}
.scroll-body{flex:1;overflow-y:auto;padding-bottom:130px;-webkit-overflow-scrolling:touch;}
@keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes su{from{transform:translateX(-50%) translateY(100%)}to{transform:translateX(-50%) translateY(0)}}
@keyframes popIn{from{opacity:0;transform:scale(.82)}to{opacity:1;transform:scale(1)}}
@keyframes urgentPulse{0%,100%{opacity:1}50%{opacity:.7}}
@keyframes ta{0%{opacity:0;transform:translateX(-50%) translateY(8px)}15%{opacity:1;transform:translateX(-50%) translateY(0)}78%{opacity:1}100%{opacity:0}}
@keyframes tickScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.fab{position:fixed;bottom:68px;left:50%;transform:translateX(-50%);width:var(--w);pointer-events:none;z-index:90;display:flex;justify-content:flex-end;padding:0 12px;}
.fab-btn{pointer-events:all;background:var(--orange);color:#fff;border:none;border-radius:26px;padding:11px 18px;display:flex;align-items:center;gap:8px;cursor:pointer;font-family:var(--fh);font-weight:800;font-size:13px;box-shadow:0 5px 20px rgba(226,55,68,.45);animation:popIn .25s ease;}
.fab-badge{background:#fff;color:var(--orange);font-size:10px;font-weight:900;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:var(--w);background:var(--card);border-top:1px solid var(--border);display:flex;justify-content:space-around;padding:8px 0 max(10px,env(safe-area-inset-bottom));z-index:100;box-shadow:0 -3px 16px rgba(0,0,0,.06);}
.nitem{display:flex;flex-direction:column;align-items:center;gap:1px;cursor:pointer;font-size:8px;color:var(--gray);font-family:var(--fh);font-weight:600;letter-spacing:.2px;padding:0 6px;transition:color .15s;position:relative;}
.nitem.on{color:var(--green);}
.nicon{font-size:19px;}
.nbadge{position:absolute;top:-2px;right:2px;background:#E23744;color:#fff;font-size:8px;font-weight:900;width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:300;backdrop-filter:blur(4px);}
.drawer{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:var(--w);background:var(--card);border-radius:24px 24px 0 0;z-index:400;padding:20px 16px 24px;max-height:85vh;overflow-y:auto;animation:su .25s ease;}
.detail{position:fixed;top:0;bottom:0;left:50%;transform:translateX(-50%);width:var(--w);background:var(--bg);z-index:450;overflow-y:auto;}
.toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:${dark?"#E6F0E8":"#111111"};color:${dark?"#0E1410":"#fff"};padding:9px 18px;border-radius:22px;font-size:12px;font-weight:700;z-index:999;animation:ta 2.2s ease forwards;white-space:nowrap;max-width:88vw;text-align:center;font-family:var(--fh);box-shadow:0 4px 20px rgba(0,0,0,.2);}
.ticker-wrap{background:#1e4d38;padding:5px 0;overflow:hidden;}
.ticker-track{display:flex;animation:tickScroll 60s linear infinite;width:max-content;}
.ticker-item{white-space:nowrap;font-size:10.5px;font-family:var(--fb);font-weight:600;color:rgba(255,255,255,.82);padding:0 30px;}
@media(max-width:460px){.bnav,.fab{width:100vw;left:0;transform:none;}.detail{left:0;transform:none;}}
`;

  return(<>
    <style>{CSS}</style>
    <div className="shell"><div className="app">

      {/* HEADER */}
      <div className="sticky-top" ref={ddRef}>
        <div style={{background:"#2D6A4F",padding:"10px 14px",overflow:"hidden",position:"relative"}}>
          <div style={{position:"absolute",width:180,height:180,background:"#52B788",borderRadius:"50%",top:-80,right:-40,opacity:.15,pointerEvents:"none"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#F9C74F,#F4845F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>♻️</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:22,fontWeight:800,color:"#fff",letterSpacing:"-.6px"}}>Re<span style={{color:"#95D5B2"}}>Bite</span></div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button style={{width:34,height:19,borderRadius:10,background:dark?"rgba(255,255,255,.28)":"rgba(255,255,255,.18)",position:"relative",cursor:"pointer",border:"none"}} onClick={()=>setDark(d=>!d)}>
                <div style={{position:"absolute",top:2.5,left:dark?17.5:2.5,width:14,height:14,borderRadius:"50%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,transition:"left .2s"}}>{dark?"🌙":"☀️"}</div>
              </button>
              <div style={{width:33,height:33,borderRadius:"50%",background:"linear-gradient(135deg,#F9C74F,#F4845F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",border:`2px solid ${tab==="profile"?"#fff":"rgba(255,255,255,.3)"}`,transition:"border-color .2s"}} onClick={()=>setTab("profile")}>🧑</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,color:"rgba(255,255,255,.72)",fontSize:11,marginTop:6,fontFamily:"Nunito"}}>
            <div style={{width:6,height:6,background:"#F9C74F",borderRadius:"50%"}}/>New Delhi · {streak}🔥 streak
          </div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:"rgba(255,255,255,.88)",marginTop:1}}>
            Save food, <span style={{color:"#A7E8C3"}}>save money 🌱</span>
          </div>
        </div>
        <div className="ticker-wrap">
          <div className="ticker-track">{[...FACTS,...FACTS].map((f,i)=><span key={i} className="ticker-item">{f}</span>)}</div>
        </div>
        {vegBanner&&(<div style={{background:"linear-gradient(90deg,#16A34A,#15803D)",padding:"7px 14px",display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>🌿</span>
          <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,color:"#fff",flex:1}}>Veg Mode on</span>
          <button style={{background:"none",border:"none",color:"rgba(255,255,255,.7)",fontSize:16,cursor:"pointer"}} onClick={()=>setVegBanner(false)}>✕</button>
        </div>)}
        {tab==="home"&&<>
          <div style={{padding:"8px 12px 0",background:"var(--bg)"}}>
            <div style={{background:"var(--sbg)",borderRadius:12,display:"flex",alignItems:"center",gap:8,padding:"10px 13px",border:"1.5px solid var(--border)"}}>
              <span style={{fontSize:13,color:"var(--gray)"}}>🔍</span>
              <input style={{border:"none",outline:"none",flex:1,fontFamily:"Nunito",fontSize:13,color:"var(--dark)",background:"transparent",fontWeight:500}} placeholder="Search restaurants, areas..." value={search} onChange={e=>setSearch(e.target.value)}/>
              {search&&<span style={{cursor:"pointer",color:"var(--gray)",fontSize:13}} onClick={()=>setSearch("")}>✕</span>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px 0",overflowX:"auto",scrollbarWidth:"none",background:"var(--bg)"}}>
            {[["area","📍",areaFilter!=="All"?areaFilter:"Area"],["type","🍽",typeFilter!=="All"?typeFilter:"Type"],["sort","⇅",{default:"Sort",price_asc:"Price↑",price_desc:"Price↓",discount:"Disc",rating:"Rating"}[sortBy]],["price","💰",maxPrice<500?`≤₹${maxPrice}`:"Price"]].map(([name,icon,label],i)=>(
              <span key={name} style={{display:"inline-flex",alignItems:"center",gap:3}}>
                {i>0&&<span style={{width:1,height:16,background:"var(--border)",display:"inline-block",margin:"0 1px",verticalAlign:"middle"}}/>}
                <button onClick={e=>openDropdown(name,e)} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"6px 11px",borderRadius:20,border:`1.5px solid ${[areaFilter!=="All",typeFilter!=="All",sortBy!=="default",maxPrice<500][i]?"#2D6A4F":"var(--border)"}`,background:[areaFilter!=="All",typeFilter!=="All",sortBy!=="default",maxPrice<500][i]?"#2D6A4F":"var(--card)",color:[areaFilter!=="All",typeFilter!=="All",sortBy!=="default",maxPrice<500][i]?"#fff":"var(--gray)",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                  {icon} {label} ▾
                </button>
              </span>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px 4px",overflowX:"auto",scrollbarWidth:"none",background:"var(--bg)"}}>
            {[[chip4plus,()=>setChip4plus(v=>!v),"⭐ 4+","#F59E0B"],[chipGreat,()=>setChipGreat(v=>!v),"🔥 Deals","#7C3AED"],[vegOnly,()=>{const n=!vegOnly;setVegOnly(n);if(n){setVegBanner(true);setTimeout(()=>setVegBanner(false),3000);}},"🌿 Veg","#16A34A"]].map(([on,fn,label,color])=>(
              <button key={label} onClick={fn} style={{display:"inline-flex",alignItems:"center",gap:3,padding:"5px 11px",borderRadius:20,border:`1.5px solid ${on?color:"var(--border)"}`,background:on?color:"var(--card)",color:on?"#fff":"var(--dark)",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{label}</button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"3px 12px 5px"}}>
            <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:600,color:"var(--gray)"}}>{loading?"Loading...":`${filtered.length} bags available`}</span>
            {hasFilters&&<span style={{fontSize:11,color:"#E23744",fontWeight:700,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}} onClick={clearAll}>Clear all ✕</span>}
          </div>
        </>}
      </div>

      {/* DROPDOWN */}
      {openDD&&(
        <div style={{position:"fixed",top:ddPos.top,left:ddPos.left,width:ddPos.width,background:"var(--card)",borderRadius:16,boxShadow:"0 8px 40px rgba(0,0,0,.22)",zIndex:9999,overflow:"hidden",border:"1px solid var(--border)"}} onClick={e=>e.stopPropagation()}>
          {openDD==="area"&&<>{["All",...AREAS.filter(a=>a!=="All")].map(a=><div key={a} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",cursor:"pointer",fontSize:13,color:areaFilter===a?"#2D6A4F":"var(--dark)",fontFamily:"Nunito",fontWeight:areaFilter===a?700:500}} onClick={()=>{setAreaFilter(a);setOpenDD(null);}}><span>{a==="All"?"🗺 All":`${AREA_ICONS[a]||"📍"} ${a}`}</span><div style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${areaFilter===a?"#2D6A4F":"var(--border)"}`,background:areaFilter===a?"#2D6A4F":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff"}}>{areaFilter===a?"✓":""}</div></div>)}</>}
          {openDD==="type"&&<>{TYPES.map(t=><div key={t} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",cursor:"pointer",fontSize:13,color:typeFilter===t?"#2D6A4F":"var(--dark)",fontFamily:"Nunito",fontWeight:typeFilter===t?700:500}} onClick={()=>{setTypeFilter(t);setOpenDD(null);}}><span>{t==="All"?"🛍 All":`${EMOJI[t]||""} ${t}`}</span><div style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${typeFilter===t?"#2D6A4F":"var(--border)"}`,background:typeFilter===t?"#2D6A4F":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff"}}>{typeFilter===t?"✓":""}</div></div>)}</>}
          {openDD==="sort"&&<>{[["default","✨ Recommended"],["price_asc","Price: Low→High"],["price_desc","Price: High→Low"],["discount","Biggest Discount 🔥"],["rating","Highest Rated ⭐"]].map(([v,l])=><div key={v} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",cursor:"pointer",fontSize:13,color:sortBy===v?"#2D6A4F":"var(--dark)",fontFamily:"Nunito",fontWeight:sortBy===v?700:500}} onClick={()=>{setSortBy(v);setOpenDD(null);}}><span>{l}</span><div style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${sortBy===v?"#2D6A4F":"var(--border)"}`,background:sortBy===v?"#2D6A4F":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff"}}>{sortBy===v?"✓":""}</div></div>)}</>}
          {openDD==="price"&&<><div style={{padding:"10px 14px 12px"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--gray)",marginBottom:8,fontFamily:"Nunito"}}><span>₹50</span><span style={{color:"#2D6A4F",fontSize:14,fontWeight:800}}>₹{maxPrice}</span><span>₹500</span></div><input type="range" min={50} max={500} step={25} value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value))} style={{width:"100%",accentColor:"#2D6A4F",cursor:"pointer"}}/></div><div style={{padding:"7px 14px 10px",borderTop:"1px solid var(--border)"}}><button style={{background:"none",border:"none",color:"var(--gray)",fontSize:11,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700}} onClick={()=>{setMaxPrice(500);setOpenDD(null);}}>Reset</button></div></>}
        </div>
      )}

      {/* SCROLL BODY */}
      <div className="scroll-body" ref={scrollRef} onClick={()=>openDD&&setOpenDD(null)}>

        {/* HOME */}
        {tab==="home"&&<>
          <div style={{margin:"8px 12px 6px",background:"linear-gradient(135deg,#F4845F,#E23744)",borderRadius:14,padding:"10px 13px",display:"flex",alignItems:"center",gap:10,color:"#fff",boxShadow:"0 4px 16px rgba(226,55,68,.25)"}}>
            <span style={{fontSize:20}}>⏰</span>
            <div><strong style={{display:"block",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:800}}>Bags filling fast tonight!</strong><span style={{fontSize:10,opacity:.9}}>Pickup 6 PM – 9 PM · Live countdown on each card</span></div>
          </div>
          <div style={{margin:"0 12px 8px",borderRadius:14,overflow:"hidden"}}>
            <div style={{background:"linear-gradient(135deg,#1B4332,#2D6A4F)",padding:"13px 16px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
              {[["12K+","Users"],["4.2T","CO2 Saved"],["₹2Cr+","Food Saved"]].map(([v,l])=>(
                <div key={l} style={{textAlign:"center",borderLeft:l!=="Users"?"1px solid rgba(255,255,255,.15)":"none"}}>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:"#fff"}}>{v}</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,.6)",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Referral banner */}
          <div style={{margin:"0 12px 8px",background:"linear-gradient(135deg,#7C3AED,#4C1D95)",borderRadius:14,padding:"10px 13px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setTab("referral")}>
            <span style={{fontSize:20}}>🤝</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:800,color:"#fff"}}>Refer a friend, earn ₹50!</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.7)"}}>Share ReBite and get rewarded</div>
            </div>
            <span style={{color:"rgba(255,255,255,.7)",fontSize:16}}>›</span>
          </div>
          {cart.length>0&&<div style={{margin:"0 12px 8px",background:"var(--gp)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",border:"1px solid rgba(45,106,79,.15)"}}>
            {[["₹"+cartSavings,"Saved"],[(cart.length*CO2_PER_BAG).toFixed(1)+"kg","CO2"],[cart.length,"In Bag"]].map(([v,l],i)=>(
              <div key={l} style={{flex:1,textAlign:"center",borderLeft:i>0?"1px solid rgba(45,106,79,.2)":"none"}}>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:800,color:"#2D6A4F"}}>{v}</div>
                <div style={{fontSize:9,color:"#52B788",fontWeight:700,textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{l}</div>
              </div>
            ))}
          </div>}
          {loading
            ?<div style={{textAlign:"center",padding:"50px 16px"}}><span style={{fontSize:34,animation:"spin 1s linear infinite",display:"inline-block"}}>🌿</span><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13,color:"var(--dark)",marginTop:12}}>Loading today's bags...</div></div>
            :filtered.length===0
              ?<div style={{textAlign:"center",padding:"40px 16px",color:"var(--gray)"}}><div style={{fontSize:44,marginBottom:10}}>😔</div><p style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:15,color:"var(--dark)"}}>No bags match your filters</p>{hasFilters&&<div onClick={clearAll} style={{marginTop:12,color:"#2D6A4F",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Clear all →</div>}</div>
              :<>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px 6px"}}>
                  <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:800,color:"var(--dark)"}}>Tonight's Bags 🛍️</span>
                  <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,color:"#2D6A4F",cursor:"pointer"}} onClick={clearAll}>See all</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11,padding:"0 12px"}}>
                  {filtered.map(bag=>(
                    <BagCard key={bag.id} bag={bag} disc={getDisc(bag)} veg={isVeg(bag)} bookmarked={bookmarks.has(bag.restaurantName)}
                      onToggleBookmark={()=>toggleBookmark(bag.restaurantName)}
                      onAdd={()=>addToCart(bag,"pickup",bag.pickup_start,"")}
                      onOpen={()=>{
                        if(bag.quantity===0){setWaitlistBag(bag);return;}
                        setSelectedBag(bag);setDetailMode("pickup");setSelectedTime(bag.pickup_start||"18:00");setDeliveryAddr("");
                      }}
                    />
                  ))}
                </div>
              </>
          }
          <div style={{height:12}}/>
        </>}

        {tab==="explore"&&<ExplorePage bags={enriched} onAreaSelect={a=>{setAreaFilter(a);setTab("home");}}/>}
        {tab==="ai"&&<AIMealSuggestionsPage bags={enriched}/>}
        {tab==="nutrition"&&<NutritionPage/>}
        {tab==="saved"&&<BookmarksPage bookmarks={bookmarks} bags={enriched} onRemove={toggleBookmark} onOpenBag={bag=>{setSelectedBag(bag);setDetailMode("pickup");setSelectedTime(bag.pickup_start||"18:00");setDeliveryAddr("");}}/>}
        {tab==="loyalty"&&<LoyaltyPage orders={orders} streak={streak} showToast={showToast}/>}
        {tab==="referral"&&<ReferralPage orders={orders} showToast={showToast}/>}
        {tab==="notifications"&&<NotificationCentre notifPermission={notifPermission} onRequestPermission={handleRequestNotification} notifications={notifications} onClear={()=>{setNotifications([]);setNotifBadge(0);}}/>}

        {/* ORDERS */}
        {tab==="orders"&&<div style={{padding:16,animation:"fu .3s ease"}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,marginBottom:4,color:"var(--dark)"}}>Your Orders 📦</div>
          <div style={{fontSize:12,color:"var(--gray)",marginBottom:16,fontFamily:"Nunito"}}>Your ReBite history</div>
          {orders.length===0
            ?<div style={{textAlign:"center",padding:"40px 16px",color:"var(--gray)"}}><div style={{fontSize:44,marginBottom:10}}>📦</div><p style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:15,color:"var(--dark)"}}>No orders yet</p></div>
            :orders.map(o=>(
              <div key={o.id} style={{background:"var(--card)",borderRadius:14,padding:13,marginBottom:9,border:"1px solid var(--border)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>{o.dishImage?<img src={o.dishImage} style={{width:36,height:36,borderRadius:8,objectFit:"cover"}} alt=""/>:<span style={{fontSize:22}}>{o.emoji}</span>}<div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,color:"var(--dark)"}}>{o.name}</div></div>
                  <div style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:14,background:"var(--gp)",color:"#2D6A4F",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>✅ Done</div>
                </div>
                <div style={{fontSize:10,color:"var(--gray)",fontFamily:"Nunito"}}>{o.date} · {o.mode} · #{o.id}</div>
                <div style={{height:1,background:"var(--border)",margin:"9px 0"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:"var(--dark)"}}>₹{o.price}</span><span style={{fontSize:10,color:"#16A34A",fontWeight:700,marginLeft:7,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>saved ₹{o.savings}</span></div>
                  <button style={{background:"var(--gp)",color:"#2D6A4F",border:"none",borderRadius:9,padding:"6px 11px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,fontWeight:700,cursor:"pointer"}} onClick={()=>showToast("🔄 Added!")}>Reorder</button>
                </div>
              </div>
            ))
          }
        </div>}

        {/* PROFILE */}
        {tab==="profile"&&<div style={{padding:16,animation:"fu .3s ease"}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,marginBottom:4,color:"var(--dark)"}}>My Profile 👤</div>
          <div style={{background:"linear-gradient(135deg,#2D6A4F,#1e4d38)",borderRadius:16,padding:18,marginBottom:14,display:"flex",alignItems:"center",gap:13,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",width:120,height:120,background:"rgba(255,255,255,.07)",borderRadius:"50%",top:-30,right:-20}}/>
            <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,#F9C74F,#F4845F)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>🧑</div>
            <div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:17,fontWeight:800,color:"#fff"}}>{profile.name}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.72)",marginTop:2,fontFamily:"Nunito"}}>{profile.email}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.5)",marginTop:2,fontFamily:"Nunito"}}>🔥 {streak} day streak · 🌱 Member since Feb 2026</div>
            </div>
          </div>
          <div style={{display:"flex",gap:7,marginBottom:16}}>
            {[[tBags,"Bags"],[`₹${tSavings}`,"Saved"],[`${tCO2}kg`,"CO2"]].map(([v,l])=>(
              <div key={l} style={{flex:1,background:"var(--card)",borderRadius:13,padding:"10px 6px",textAlign:"center",border:"1px solid var(--border)"}}>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:800,color:"#2D6A4F"}}>{v}</div>
                <div style={{fontSize:9,color:"var(--gray)",fontWeight:700,textTransform:"uppercase",letterSpacing:.4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{background:"var(--card)",borderRadius:14,overflow:"hidden",marginBottom:14,border:"1px solid var(--border)"}}>
            {[["🏆","Rewards & Streaks","loyalty"],["🤝","Refer & Earn","referral"],["🔔","Notifications","notifications"],["🔖","Saved Places","saved"],["📦","My Orders","orders"]].map(([ic,lb,tb])=>(
              <div key={lb} style={{display:"flex",alignItems:"center",gap:11,padding:"12px 13px",borderBottom:"1px solid var(--border)",cursor:"pointer"}} onClick={()=>setTab(tb)}>
                <div style={{fontSize:16,width:34,height:34,background:"var(--bg)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{ic}</div>
                <div style={{flex:1,fontSize:13,fontWeight:600,color:"var(--dark)",fontFamily:"Nunito"}}>{lb}</div>
                <div style={{color:"var(--gray)",fontSize:14}}>›</div>
              </div>
            ))}
          </div>
          <button style={{width:"100%",background:"var(--card)",border:"1.5px solid #FECACA",color:"#EF4444",borderRadius:13,padding:13,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}} onClick={()=>setAuthed(false)}>Log Out</button>
        </div>}
      </div>

      {/* FAB */}
      {cart.length>0&&<div className="fab">
        <button className="fab-btn" onClick={()=>setShowCart(true)}>
          <span className="fab-badge">{cart.length}</span>
          <span>View Bag · ₹{cartTotal}</span>
        </button>
      </div>}

      {/* BOTTOM NAV */}
      <div className="bnav">
        {[{id:"home",icon:"🏠",label:"Home"},{id:"explore",icon:"🗺️",label:"Explore"},{id:"ai",icon:"✨",label:"AI"},{id:"nutrition",icon:"🥗",label:"Track"},{id:"loyalty",icon:"🏆",label:"Rewards"},{id:"notifications",icon:"🔔",label:"Alerts",badge:notifBadge}].map(n=>(
          <div key={n.id} className={`nitem ${tab===n.id?"on":""}`} onClick={()=>{setTab(n.id);if(n.id==="notifications")setNotifBadge(0);}}>
            <span className="nicon">{n.icon}</span>
            {n.label}
            {n.badge>0&&<div className="nbadge">{n.badge>9?"9+":n.badge}</div>}
          </div>
        ))}
      </div>

      {/* CART DRAWER */}
      {showCart&&<><div className="overlay" onClick={()=>setShowCart(false)}/>
        <div className="drawer">
          <div style={{width:36,height:4,background:"var(--border)",borderRadius:4,margin:"0 auto 16px"}}/>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,marginBottom:14,color:"var(--dark)"}}>Your Bag 🛍️</div>
          {cart.length===0?<div style={{textAlign:"center",padding:"40px 16px",color:"var(--gray)"}}><div style={{fontSize:44,marginBottom:10}}>🛍️</div></div>:<>
            {cart.map(i=>(
              <div key={i.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                {i.dishImage?<img src={i.dishImage} style={{width:46,height:46,borderRadius:11,objectFit:"cover",flexShrink:0}} alt=""/>:<div style={{width:46,height:46,background:"var(--gp)",borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{EMOJI[i.type]||EMOJI.default}</div>}
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,color:"var(--dark)"}}>{i.restaurantName}</div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,color:"#2D6A4F",fontWeight:800,margin:"2px 0"}}>₹{i.price}</div>
                  <div style={{fontSize:10,color:"var(--gray)",fontFamily:"Nunito"}}>{i.mode==="delivery"?"🛵 Delivery":"🏃 Pickup"} · {i.pickedTime}</div>
                </div>
                <button onClick={()=>removeFromCart(i.id)} style={{background:"none",border:"1.5px solid var(--border)",borderRadius:8,width:26,height:26,cursor:"pointer",fontSize:11,color:"var(--gray)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
              </div>
            ))}
            <div style={{background:"var(--gp)",borderRadius:12,padding:"10px 14px",margin:"12px 0 6px",display:"flex"}}>
              <div style={{flex:1,textAlign:"center"}}><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:15,color:"#2D6A4F"}}>₹{cartSavings}</div><div style={{fontSize:9,color:"#52B788",fontWeight:700,textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Saved</div></div>
              <div style={{width:1,background:"rgba(45,106,79,.2)"}}/>
              <div style={{flex:1,textAlign:"center"}}><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:15,color:"#2D6A4F"}}>{(cart.length*CO2_PER_BAG).toFixed(1)}kg</div><div style={{fontSize:9,color:"#52B788",fontWeight:700,textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>CO2</div></div>
              <div style={{width:1,background:"rgba(45,106,79,.2)"}}/>
              <div style={{flex:1,textAlign:"center"}}><div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:15,color:"#7C3AED"}}>+{cart.length*100}</div><div style={{fontSize:9,color:"#7C3AED",fontWeight:700,textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Points</div></div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"7px 0 4px"}}>
              <span style={{color:"var(--gray)",fontSize:13,fontFamily:"Nunito"}}>Total</span>
              <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:21,color:"var(--dark)"}}>₹{cartTotal}</span>
            </div>
            {/* Razorpay payment button */}
            <button style={{width:"100%",background:"#E23744",color:"#fff",border:"none",borderRadius:14,padding:14,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:800,cursor:"pointer",marginTop:12,boxShadow:"0 4px 16px rgba(226,55,68,.3)"}} onClick={handleCheckout}>
              💳 Pay ₹{cartTotal} · Earn {cart.length*100} pts
            </button>
            <div style={{fontSize:10,color:"var(--gray)",textAlign:"center",marginTop:8,fontFamily:"Nunito"}}>🔒 Secured by Razorpay · UPI · Cards · Wallets</div>
          </>}
        </div>
      </>}

      {/* DETAIL VIEW */}
      {selectedBag&&(()=>{
        const di=getDishImage(selectedBag),d=getDisc(selectedBag),slots=genSlots(selectedBag.pickup_start,selectedBag.pickup_end),hero=BAG_HERO[selectedBag.type]||BAG_HERO.Meal,veg=isVeg(selectedBag),restImg=getRestImage(selectedBag),bookmarked=bookmarks.has(selectedBag.restaurantName);
        return(
          <div className="detail">
            <div style={{width:"100%",height:220,position:"relative",overflow:"hidden"}}>
              <img src={di} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,rgba(0,0,0,.3),transparent 60%)"}}/>
              <button style={{position:"absolute",top:14,left:14,background:"#fff",border:"none",borderRadius:12,width:38,height:38,cursor:"pointer",fontSize:16,boxShadow:"0 2px 10px rgba(0,0,0,.18)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2,color:"#333"}} onClick={()=>setSelectedBag(null)}>←</button>
              <button style={{position:"absolute",top:14,right:14,background:"rgba(0,0,0,.45)",border:"none",borderRadius:"50%",width:38,height:38,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",zIndex:2,color:bookmarked?"#EF4444":"rgba(255,255,255,.8)",backdropFilter:"blur(3px)"}} onClick={()=>toggleBookmark(selectedBag.restaurantName)}>{bookmarked?"♥":"♡"}</button>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:11,padding:"12px 14px",background:"var(--card)",borderBottom:"1px solid var(--border)"}}>
              <img src={restImg} style={{width:44,height:44,borderRadius:10,objectFit:"cover",flexShrink:0}} alt="" onError={e=>{e.target.style.display="none";}}/>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:800,color:"var(--dark)"}}>{selectedBag.restaurantName}</div>
                <div style={{fontSize:10,color:"var(--gray)",marginTop:2,fontFamily:"Nunito"}}>{selectedBag.restaurantCategory} · {selectedBag.restaurantArea} · ⭐ {selectedBag.restaurantRating}</div>
              </div>
            </div>
            <div style={{padding:14}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,marginBottom:4,color:"var(--dark)"}}>{selectedBag.type} Surprise Bag</div>
              <div style={{fontSize:11,color:"var(--gray)",marginBottom:12,fontFamily:"Nunito"}}>{veg?"🌿 Veg":"🍗 Non-Veg"} · {d}% off · saves ₹{Number(selectedBag.original_price)-Number(selectedBag.price)}</div>
              <div style={{display:"flex",background:"var(--bg)",borderRadius:12,padding:3,marginBottom:12}}>
                {[["pickup","🏃 Pickup"],["delivery","🛵 Delivery +₹20"]].map(([m,l])=>(
                  <button key={m} onClick={()=>setDetailMode(m)} style={{flex:1,padding:"8px 6px",border:"none",borderRadius:10,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,cursor:"pointer",background:detailMode===m?"var(--card)":"transparent",color:detailMode===m?"#2D6A4F":"var(--gray)",transition:"all .18s"}}>{l}</button>
                ))}
              </div>
              {detailMode==="delivery"&&<div style={{background:"var(--sh)",borderRadius:13,padding:12,marginBottom:12,border:"1.5px solid var(--border)"}}>
                <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:800,color:"var(--dark)",display:"block",marginBottom:7}}>📍 Delivery Address</span>
                <textarea style={{width:"100%",background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:9,padding:"9px 11px",fontFamily:"Nunito",fontSize:13,color:"var(--dark)",outline:"none",resize:"none"}} rows={2} placeholder="Enter delivery address..." value={deliveryAddr} onChange={e=>setDeliveryAddr(e.target.value)}/>
              </div>}
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {[["📦","Left",selectedBag.quantity||"None"],["💰","Saving",d+"%"],["🌱","CO2",CO2_PER_BAG+"kg"],["💜","Points","+100"]].map(([ico,lb,val])=>(
                  <div key={lb} style={{flex:1,background:"var(--card)",borderRadius:11,padding:"8px 4px",textAlign:"center",border:"1px solid var(--border)"}}>
                    <div style={{fontSize:14,marginBottom:3}}>{ico}</div>
                    <div style={{fontSize:9,color:"var(--gray)",textTransform:"uppercase",letterSpacing:.4,fontWeight:700,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{lb}</div>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:800,color:"var(--dark)",marginTop:1}}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,fontWeight:800,color:"var(--gray)",textTransform:"uppercase",letterSpacing:.7,marginBottom:9}}>What's inside 🎁</div>
              <div style={{background:"var(--card)",borderRadius:13,padding:"10px 13px",marginBottom:12,border:"1px solid var(--border)"}}>
                {[{img:hero.img,name:hero.name,sub:hero.sub},{img:null,name:"Surprise Extra",sub:"Changes daily · from the chef"}].map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:11,padding:"8px 0",borderBottom:i===0?"1px solid var(--border)":"none"}}>
                    {item.img?<img src={item.img} style={{width:50,height:50,borderRadius:10,objectFit:"cover",flexShrink:0}} alt="" loading="lazy"/>:<div style={{width:50,height:50,borderRadius:10,background:"var(--gp)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🎲</div>}
                    <div><div style={{fontSize:12,fontWeight:700,color:"var(--dark)",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{item.name}</div><div style={{fontSize:10,color:"var(--gray)",marginTop:2,fontFamily:"Nunito"}}>{item.sub}</div></div>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:12}}>
                <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:800,color:"var(--dark)",marginBottom:6,display:"block"}}>🕐 Select pickup time</span>
                <select style={{width:"100%",background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:10,padding:"10px 12px",fontFamily:"Nunito",fontSize:13,color:"var(--dark)",outline:"none",cursor:"pointer"}} value={selectedTime} onChange={e=>setSelectedTime(e.target.value)}>
                  {slots.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <ReviewsSection bagId={selectedBag.id}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,background:"var(--card)",padding:"12px 14px",borderTop:"1px solid var(--border)",position:"sticky",bottom:0}}>
              <div>
                <div style={{fontSize:11,color:"var(--gray)",textDecoration:"line-through",fontFamily:"Nunito"}}>₹{selectedBag.original_price}</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:24,fontWeight:800,color:"var(--dark)",letterSpacing:"-.6px"}}>₹{detailMode==="delivery"?Number(selectedBag.price)+20:selectedBag.price}</div>
              </div>
              <button style={{flex:2,background:!selectedBag.quantity||(detailMode==="delivery"&&!deliveryAddr.trim())?"var(--border)":"#E23744",color:!selectedBag.quantity||(detailMode==="delivery"&&!deliveryAddr.trim())?"var(--gray)":"#fff",border:"none",borderRadius:13,padding:13,fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:800,cursor:!selectedBag.quantity?"default":"pointer",boxShadow:selectedBag.quantity?"0 3px 12px rgba(226,55,68,.3)":"none"}}
                disabled={!selectedBag.quantity||(detailMode==="delivery"&&!deliveryAddr.trim())}
                onClick={()=>{addToCart(selectedBag,detailMode,selectedTime,deliveryAddr);setSelectedBag(null);}}
              >
                {!selectedBag.quantity?"Sold Out":detailMode==="delivery"&&!deliveryAddr.trim()?"Enter address 📍":`Reserve · ${selectedTime} 🏃`}
              </button>
            </div>
          </div>
        );
      })()}

      {/* WAITLIST MODAL */}
      {waitlistBag&&<WaitlistModal bag={waitlistBag} onClose={()=>setWaitlistBag(null)} showToast={showToast}/>}

      {toast&&<div key={toastKey} className="toast">{toast}</div>}
    </div></div>
  </>);
}