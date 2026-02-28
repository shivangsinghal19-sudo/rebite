/**
 * ReBite Partner Dashboard
 * ─────────────────────────
 * Drop this file as src/PartnerDashboard.jsx
 * Then in src/main.jsx or src/index.jsx, you can route to it OR
 * just temporarily swap App import to PartnerDashboard for testing.
 *
 * Uses same supabaseClient.js as the customer app.
 * Tables used: restaurants, bags
 *
 * Flow:
 *  1. Partner enters their restaurant name → system finds their record
 *  2. Dashboard shows: today's bags, stats, add bag form, toggle active/sold out
 */

import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const TYPES = ["Bakery","Meal","Dessert","Cafe","Buffet"];
const AREAS = ["CP","Hauz Khas","GK","Saket","Rajouri"];

/* ─── styles ─── */
const S = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
:root{
  --green:#2D6A4F;--gl:#52B788;--gp:#D8F3DC;
  --orange:#F4845F;--yellow:#F9C74F;--red:#EF4444;
  --dark:#1B1B1B;--gray:#6B7280;--bg:#F4F7F4;
  --white:#fff;--border:#E5E9E5;
}
html,body{height:100%;background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--dark);}

/* ── layout ── */
.dash{min-height:100vh;display:flex;flex-direction:column;}

/* ── topbar ── */
.topbar{
  background:var(--green);
  padding:0 32px;
  height:60px;
  display:flex;align-items:center;justify-content:space-between;
  box-shadow:0 2px 12px rgba(0,0,0,.15);
  position:sticky;top:0;z-index:100;
}
.tb-left{display:flex;align-items:center;gap:12px;}
.tb-logo{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#F9C74F,#F4845F);display:flex;align-items:center;justify-content:center;font-size:16px;}
.tb-brand{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#fff;letter-spacing:-.3px;}
.tb-brand span{color:var(--yellow);}
.tb-badge{background:rgba(255,255,255,.18);color:#fff;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;border:1px solid rgba(255,255,255,.25);}
.tb-right{display:flex;align-items:center;gap:12px;}
.tb-rest{font-size:13px;color:rgba(255,255,255,.85);font-weight:500;}
.tb-logout{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);color:#fff;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;font-family:'Syne',sans-serif;font-weight:700;}
.tb-logout:hover{background:rgba(255,255,255,.25);}

/* ── main content ── */
.main{flex:1;padding:28px 32px;max-width:1100px;width:100%;margin:0 auto;}

/* ── login screen ── */
.login-wrap{
  min-height:100vh;background:var(--green);
  display:flex;align-items:center;justify-content:center;
  position:relative;overflow:hidden;
}
.login-wrap::before{content:'';position:absolute;width:400px;height:400px;background:var(--gl);border-radius:50%;top:-150px;right:-100px;opacity:.2;}
.login-wrap::after{content:'';position:absolute;width:300px;height:300px;background:var(--gl);border-radius:50%;bottom:-100px;left:-80px;opacity:.15;}
.login-card{
  background:#fff;border-radius:24px;padding:40px;width:100%;max-width:420px;
  box-shadow:0 24px 80px rgba(0,0,0,.25);
  position:relative;z-index:1;
  animation:popIn .3s ease;
}
@keyframes popIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.login-logo{display:flex;align-items:center;gap:10px;margin-bottom:28px;}
.login-logo-icon{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#F9C74F,#F4845F);display:flex;align-items:center;justify-content:center;font-size:22px;}
.login-logo-text{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:var(--dark);}
.login-logo-text span{color:var(--green);}
.login-title{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--dark);margin-bottom:6px;}
.login-sub{font-size:13px;color:var(--gray);margin-bottom:28px;line-height:1.5;}
.field{margin-bottom:16px;}
.field label{display:block;font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;font-family:'Syne',sans-serif;}
.field input,.field select{
  width:100%;border:1.5px solid var(--border);border-radius:11px;
  padding:11px 14px;font-size:14px;font-family:'DM Sans',sans-serif;
  outline:none;color:var(--dark);background:#fff;transition:border-color .2s;
}
.field input:focus,.field select:focus{border-color:var(--green);}
.login-btn{
  width:100%;background:var(--green);color:#fff;border:none;
  border-radius:12px;padding:14px;font-family:'Syne',sans-serif;
  font-size:15px;font-weight:700;cursor:pointer;margin-top:8px;
  transition:background .2s;
}
.login-btn:hover{background:var(--gl);}
.login-btn:disabled{background:#C4C4C4;cursor:default;}
.login-err{background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:10px 14px;font-size:13px;color:var(--red);margin-top:12px;}
.login-note{font-size:11px;color:var(--gray);text-align:center;margin-top:16px;line-height:1.6;}

/* ── stat cards ── */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px;}
@media(max-width:768px){.stats{grid-template-columns:1fr 1fr;}}
.stat{background:#fff;border-radius:16px;padding:18px 20px;box-shadow:0 1px 8px rgba(0,0,0,.06);border:1px solid var(--border);}
.stat-ico{font-size:22px;margin-bottom:8px;}
.stat-val{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:var(--green);}
.stat-lbl{font-size:11px;color:var(--gray);font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-top:2px;}

/* ── section headers ── */
.sec-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
.sec-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;}
.sec-sub{font-size:12px;color:var(--gray);margin-top:1px;}

/* ── add bag card ── */
.add-card{background:#fff;border-radius:18px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.07);border:1.5px solid var(--border);margin-bottom:28px;}
.add-card-title{font-family:'Syne',sans-serif;font-size:16px;font-weight:800;margin-bottom:18px;display:flex;align-items:center;gap:8px;}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
@media(max-width:600px){.form-grid{grid-template-columns:1fr;}}
.form-grid .field{margin-bottom:0;}
.add-submit{
  background:var(--green);color:#fff;border:none;border-radius:12px;
  padding:13px 28px;font-family:'Syne',sans-serif;font-size:14px;font-weight:700;
  cursor:pointer;margin-top:16px;transition:background .2s;display:flex;align-items:center;gap:8px;
}
.add-submit:hover{background:var(--gl);}
.add-submit:disabled{background:#C4C4C4;cursor:default;}

/* ── bags table ── */
.bags-wrap{background:#fff;border-radius:18px;box-shadow:0 2px 12px rgba(0,0,0,.07);border:1px solid var(--border);overflow:hidden;margin-bottom:28px;}
.bag-row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr 90px;align-items:center;padding:13px 20px;border-bottom:1px solid #F0F4F0;transition:background .15s;}
.bag-row:last-child{border-bottom:none;}
.bag-row:hover{background:#FAFCFA;}
.bag-row.header{background:#F7FBF7;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.5px;padding:10px 20px;}
.bag-name{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;display:flex;align-items:center;gap:7px;}
.bag-type-badge{font-size:10px;background:var(--gp);color:var(--green);padding:2px 7px;border-radius:20px;font-weight:600;}
.bag-cell{font-size:13px;color:var(--dark);}
.bag-price{font-family:'Syne',sans-serif;font-weight:700;color:var(--green);}
.bag-orig{font-size:11px;color:#C4C4C4;text-decoration:line-through;margin-left:3px;}
.bag-qty{display:flex;align-items:center;gap:6px;}
.qty-btn{background:var(--bg);border:1px solid var(--border);border-radius:6px;width:24px;height:24px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:background .15s;}
.qty-btn:hover{background:var(--gp);}
.qty-num{font-family:'Syne',sans-serif;font-weight:700;font-size:14px;min-width:20px;text-align:center;}
.toggle-btn{padding:5px 12px;border-radius:20px;border:none;font-family:'Syne',sans-serif;font-size:11px;font-weight:700;cursor:pointer;transition:all .2s;}
.toggle-btn.on{background:var(--gp);color:var(--green);}
.toggle-btn.off{background:#FEF2F2;color:var(--red);}
.del-btn{background:none;border:1px solid #FECACA;border-radius:8px;width:30px;height:30px;color:#EF4444;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;transition:background .15s;}
.del-btn:hover{background:#FEF2F2;}

/* ── empty state ── */
.empty-bags{text-align:center;padding:48px 24px;color:var(--gray);}
.empty-bags .big{font-size:48px;margin-bottom:12px;}
.empty-bags p{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:var(--dark);margin-bottom:6px;}

/* ── loading ── */
.loading-wrap{display:flex;align-items:center;justify-content:center;padding:60px;gap:12px;color:var(--gray);}
.spin{font-size:28px;animation:spin 1s linear infinite;display:inline-block;}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── toast ── */
.toast{position:fixed;bottom:28px;right:28px;background:var(--dark);color:#fff;padding:10px 20px;border-radius:40px;font-size:13px;font-weight:500;z-index:999;animation:ta 2.5s ease forwards;display:flex;align-items:center;gap:8px;}
@keyframes ta{0%{opacity:0;transform:translateY(8px)}10%{opacity:1;transform:translateY(0)}75%{opacity:1}100%{opacity:0}}

/* ── restaurant info card ── */
.rest-card{background:linear-gradient(135deg,var(--green),#1a4a33);border-radius:18px;padding:22px 24px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
.rest-card-left{display:flex;align-items:center;gap:14px;}
.rest-avatar{width:54px;height:54px;border-radius:14px;background:var(--yellow);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;}
.rest-name{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#fff;}
.rest-meta{font-size:12px;color:rgba(255,255,255,.7);margin-top:3px;}
.rest-card-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px;}
.rest-status{background:rgba(255,255,255,.2);color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;border:1px solid rgba(255,255,255,.3);}

/* ── responsive ── */
@media(max-width:900px){
  .bag-row{grid-template-columns:2fr 1fr 1fr 1fr 80px;}
  .bag-row .hide-sm{display:none;}
}
@media(max-width:600px){
  .main{padding:16px;}
  .topbar{padding:0 16px;}
  .stats{grid-template-columns:1fr 1fr;}
  .bag-row{grid-template-columns:1fr 1fr 80px;}
}
`;

const EMOJI_MAP = { Bakery:"🥐", Meal:"🍛", Dessert:"🧁", Cafe:"☕", Buffet:"🍱" };

/* ─────────────────── MAIN COMPONENT ─────────────────── */
export default function PartnerDashboard() {
  const [screen, setScreen] = useState("login"); // login | dashboard
  const [restaurant, setRestaurant] = useState(null);
  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastKey, setToastKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Login form
  const [loginName, setLoginName] = useState("");
  const [loginArea, setLoginArea] = useState("");
  const [loginErr, setLoginErr] = useState("");

  // Add bag form
  const [form, setForm] = useState({
    type: "Meal",
    price: "",
    original_price: "",
    quantity: "5",
    pickup_start: "18:00",
    pickup_end: "21:00",
  });

  const showToast = (msg) => {
    setToast(msg); setToastKey(k => k+1);
    setTimeout(() => setToast(null), 2500);
  };

  /* ── LOGIN: find restaurant by name + area ── */
  async function handleLogin() {
    if (!loginName.trim() || !loginArea) { setLoginErr("Please fill in both fields."); return; }
    setLoading(true); setLoginErr("");
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .ilike("name", `%${loginName.trim()}%`)
      .eq("area", loginArea)
      .limit(1);

    if (error || !data || data.length === 0) {
      setLoginErr("Restaurant not found. Check the name and area, or contact ReBite support.");
      setLoading(false); return;
    }
    setRestaurant(data[0]);
    await fetchBags(data[0].id);
    setScreen("dashboard");
    setLoading(false);
  }

  async function fetchBags(restId) {
    const { data } = await supabase
      .from("bags")
      .select("*")
      .eq("restaurant_id", restId)
      .order("created_at", { ascending: false });
    setBags(data || []);
  }

  /* ── ADD BAG ── */
  async function handleAddBag() {
    if (!form.price || !form.original_price || !form.quantity) {
      showToast("⚠️ Fill all fields"); return;
    }
    if (Number(form.price) >= Number(form.original_price)) {
      showToast("⚠️ Sale price must be less than original"); return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("bags").insert({
      restaurant_id: restaurant.id,
      type: form.type,
      price: Number(form.price),
      original_price: Number(form.original_price),
      quantity: Number(form.quantity),
      pickup_start: form.pickup_start,
      pickup_end: form.pickup_end,
      is_active: true,
    });
    if (error) { showToast("❌ Error adding bag. Try again."); setSubmitting(false); return; }
    showToast("✅ Bag added! Customers can now see it.");
    setForm({ type:"Meal", price:"", original_price:"", quantity:"5", pickup_start:"18:00", pickup_end:"21:00" });
    await fetchBags(restaurant.id);
    setSubmitting(false);
  }

  /* ── TOGGLE ACTIVE ── */
  async function toggleActive(bag) {
    await supabase.from("bags").update({ is_active: !bag.is_active }).eq("id", bag.id);
    setBags(prev => prev.map(b => b.id === bag.id ? { ...b, is_active: !b.is_active } : b));
    showToast(bag.is_active ? "🔴 Bag hidden from customers" : "🟢 Bag now visible to customers");
  }

  /* ── UPDATE QUANTITY ── */
  async function updateQty(bag, delta) {
    const newQty = Math.max(0, bag.quantity + delta);
    await supabase.from("bags").update({ quantity: newQty }).eq("id", bag.id);
    setBags(prev => prev.map(b => b.id === bag.id ? { ...b, quantity: newQty } : b));
  }

  /* ── DELETE BAG ── */
  async function deleteBag(id) {
    if (!window.confirm("Remove this bag from ReBite?")) return;
    await supabase.from("bags").delete().eq("id", id);
    setBags(prev => prev.filter(b => b.id !== id));
    showToast("🗑️ Bag removed");
  }

  // Stats
  const activeBags = bags.filter(b => b.is_active);
  const totalQty = activeBags.reduce((s, b) => s + b.quantity, 0);
  const avgDiscount = bags.length === 0 ? 0 : Math.round(
    bags.reduce((s, b) => s + ((b.original_price - b.price) / b.original_price * 100), 0) / bags.length
  );
  const potentialRevenue = activeBags.reduce((s, b) => s + b.price * b.quantity, 0);

  /* ════════════════ LOGIN SCREEN ════════════════ */
  if (screen === "login") {
    return (
      <>
        <style>{S}</style>
        <div className="login-wrap">
          <div className="login-card">
            <div className="login-logo">
              <div className="login-logo-icon">♻️</div>
              <div className="login-logo-text">Re<span>Bite</span></div>
            </div>
            <div className="login-title">Partner Portal</div>
            <div className="login-sub">Welcome! Enter your restaurant details to manage your surplus bags and reach more customers.</div>

            <div className="field">
              <label>Restaurant Name</label>
              <input
                placeholder="e.g. My Café"
                value={loginName}
                onChange={e => setLoginName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div className="field">
              <label>Area</label>
              <select value={loginArea} onChange={e => setLoginArea(e.target.value)}>
                <option value="">Select your area…</option>
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>

            <button className="login-btn" onClick={handleLogin} disabled={loading}>
              {loading ? "Finding your restaurant…" : "Access Dashboard →"}
            </button>

            {loginErr && <div className="login-err">⚠️ {loginErr}</div>}

            <div className="login-note">
              Not listed yet? Contact us at <strong>partners@rebite.in</strong> to get onboarded — it's free!
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ════════════════ DASHBOARD ════════════════ */
  const categoryEmoji = { Bakery:"🥐", Cafe:"☕", "Fine Dining":"🍽️", Buffet:"🍱", default:"🏪" };

  return (
    <>
      <style>{S}</style>
      <div className="dash">

        {/* ── TOP BAR ── */}
        <div className="topbar">
          <div className="tb-left">
            <div className="tb-logo">♻️</div>
            <div className="tb-brand">Re<span>Bite</span></div>
            <div className="tb-badge">Partner Portal</div>
          </div>
          <div className="tb-right">
            <span className="tb-rest">🏪 {restaurant.name}</span>
            <button className="tb-logout" onClick={() => { setScreen("login"); setRestaurant(null); setBags([]); }}>
              Log Out
            </button>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div className="main">

          {/* Restaurant card */}
          <div className="rest-card">
            <div className="rest-card-left">
              <div className="rest-avatar">{categoryEmoji[restaurant.category] || categoryEmoji.default}</div>
              <div>
                <div className="rest-name">{restaurant.name}</div>
                <div className="rest-meta">{restaurant.category} · {restaurant.area} · ⭐ {restaurant.rating}</div>
              </div>
            </div>
            <div className="rest-card-right">
              <div className="rest-status">🟢 Live on ReBite</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.6)"}}>ID: {restaurant.id.slice(0,8)}…</div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats">
            <div className="stat">
              <div className="stat-ico">🛍️</div>
              <div className="stat-val">{bags.length}</div>
              <div className="stat-lbl">Total bags listed</div>
            </div>
            <div className="stat">
              <div className="stat-ico">✅</div>
              <div className="stat-val">{activeBags.length}</div>
              <div className="stat-lbl">Active right now</div>
            </div>
            <div className="stat">
              <div className="stat-ico">📦</div>
              <div className="stat-val">{totalQty}</div>
              <div className="stat-lbl">Units available</div>
            </div>
            <div className="stat">
              <div className="stat-ico">💰</div>
              <div className="stat-val">₹{potentialRevenue}</div>
              <div className="stat-lbl">Potential revenue</div>
            </div>
          </div>

          {/* ── ADD BAG FORM ── */}
          <div className="add-card">
            <div className="add-card-title">
              <span style={{fontSize:20}}>➕</span> Add a Surprise Bag
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Bag Type</label>
                <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Quantity available</label>
                <input type="number" min="1" max="50" placeholder="e.g. 5"
                  value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} />
              </div>
              <div className="field">
                <label>Sale price (₹) — what customer pays</label>
                <input type="number" placeholder="e.g. 149"
                  value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} />
              </div>
              <div className="field">
                <label>Original value (₹) — full price</label>
                <input type="number" placeholder="e.g. 450"
                  value={form.original_price} onChange={e => setForm(f => ({...f, original_price: e.target.value}))} />
              </div>
              <div className="field">
                <label>Pickup window starts</label>
                <select value={form.pickup_start} onChange={e => setForm(f => ({...f, pickup_start: e.target.value}))}>
                  {["15:00","16:00","17:00","18:00","19:00","20:00","21:00"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Pickup window ends</label>
                <select value={form.pickup_end} onChange={e => setForm(f => ({...f, pickup_end: e.target.value}))}>
                  {["17:00","18:00","19:00","20:00","21:00","22:00","23:00"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Preview */}
            {form.price && form.original_price && Number(form.price) < Number(form.original_price) && (
              <div style={{background:"var(--gp)",borderRadius:12,padding:"10px 16px",marginTop:14,display:"flex",gap:24,alignItems:"center",flexWrap:"wrap"}}>
                <div><span style={{fontFamily:"Syne",fontWeight:800,fontSize:15,color:"var(--green)"}}>
                  {EMOJI_MAP[form.type]||"🛍️"} {form.type} bag · ₹{form.price}
                </span><span style={{fontSize:12,color:"#999",textDecoration:"line-through",marginLeft:6}}>₹{form.original_price}</span></div>
                <div style={{fontSize:12,color:"var(--green)",fontWeight:600}}>
                  🔥 {Math.round((1 - form.price/form.original_price)*100)}% off · saves ₹{form.original_price - form.price}
                </div>
                <div style={{fontSize:12,color:"var(--green)",fontWeight:600}}>🌱 1.2kg CO₂ saved per bag</div>
              </div>
            )}

            <button className="add-submit" onClick={handleAddBag} disabled={submitting}>
              {submitting ? <><span className="spin" style={{fontSize:16}}>🌿</span> Adding…</> : <><span>➕</span> Add Bag to ReBite</>}
            </button>
          </div>

          {/* ── BAGS LIST ── */}
          <div className="sec-head">
            <div>
              <div className="sec-title">Your Bags</div>
              <div className="sec-sub">{bags.length} bags · {activeBags.length} active · click toggles to show/hide</div>
            </div>
            <button onClick={() => fetchBags(restaurant.id)}
              style={{background:"var(--bg)",border:"1.5px solid var(--border)",borderRadius:9,padding:"7px 14px",cursor:"pointer",fontSize:12,fontFamily:"Syne",fontWeight:700,color:"var(--gray)"}}>
              🔄 Refresh
            </button>
          </div>

          <div className="bags-wrap">
            {/* Header row */}
            <div className="bag-row header">
              <div>Bag</div>
              <div>Price</div>
              <div className="hide-sm">Pickup</div>
              <div>Qty</div>
              <div className="hide-sm">Discount</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {bags.length === 0 ? (
              <div className="empty-bags">
                <div className="big">🛍️</div>
                <p>No bags listed yet</p>
                <span style={{fontSize:13}}>Add your first surplus bag above ↑</span>
              </div>
            ) : bags.map(bag => {
              const disc = Math.round((1 - bag.price/bag.original_price)*100);
              return (
                <div key={bag.id} className="bag-row">
                  {/* Name + type */}
                  <div className="bag-name">
                    <span style={{fontSize:18}}>{EMOJI_MAP[bag.type]||"🛍️"}</span>
                    <span>{bag.type}</span>
                    <span className="bag-type-badge">{bag.type}</span>
                  </div>
                  {/* Price */}
                  <div className="bag-cell">
                    <span className="bag-price">₹{bag.price}</span>
                    <span className="bag-orig">₹{bag.original_price}</span>
                  </div>
                  {/* Pickup */}
                  <div className="bag-cell hide-sm" style={{fontSize:12,color:"var(--gray)"}}>
                    🕐 {bag.pickup_start}–{bag.pickup_end}
                  </div>
                  {/* Quantity */}
                  <div className="bag-cell">
                    <div className="bag-qty">
                      <button className="qty-btn" onClick={() => updateQty(bag, -1)}>−</button>
                      <span className="qty-num">{bag.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQty(bag, +1)}>+</button>
                    </div>
                  </div>
                  {/* Discount */}
                  <div className="bag-cell hide-sm" style={{fontFamily:"Syne",fontWeight:700,color:"var(--orange)"}}>
                    {disc}% off
                  </div>
                  {/* Toggle */}
                  <div className="bag-cell">
                    <button className={`toggle-btn ${bag.is_active ? "on" : "off"}`} onClick={() => toggleActive(bag)}>
                      {bag.is_active ? "🟢 Live" : "🔴 Hidden"}
                    </button>
                  </div>
                  {/* Delete */}
                  <div className="bag-cell">
                    <button className="del-btn" onClick={() => deleteBag(bag.id)} title="Remove bag">🗑</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tips */}
          <div style={{background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:14,padding:"16px 20px",marginBottom:24}}>
            <div style={{fontFamily:"Syne",fontWeight:700,fontSize:13,marginBottom:8}}>💡 Tips for more sales</div>
            <div style={{fontSize:12,color:"var(--gray)",lineHeight:1.8}}>
              • Bags with <strong>50%+ discount</strong> get a 🔥 badge and appear at the top<br/>
              • Keep quantities <strong>accurate</strong> — customers trust bags that don't say "sold out" last minute<br/>
              • <strong>6–9 PM pickup</strong> is peak time for Delhi customers<br/>
              • Lower prices = more orders = less food waste = happier planet 🌱
            </div>
          </div>

        </div>
      </div>

      {toast && <div key={toastKey} className="toast">{toast}</div>}
    </>
  );
}