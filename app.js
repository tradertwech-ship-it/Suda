/* M SUDAISE – shared logic. Products load live from Supabase, so anything added in the Admin app appears here automatically. */
const CATS={
  office:{label:'Office Furniture',items:['Office Chairs','Office Desks','Reception Chairs','Filing Cabinets']},
  salon:{label:'Salon Furniture',items:['Salon Chairs','Barber Chairs','Wash Basins','Mirrors','Trolleys']},
  acc:{label:'Accessories',items:['Accessories']}
};
const ICON={'Office Chairs':'🪑','Office Desks':'🗄️','Reception Chairs':'🛋️','Filing Cabinets':'🗃️','Salon Chairs':'💺','Barber Chairs':'💈','Wash Basins':'🚿','Mirrors':'🪞','Trolleys':'🛒','Accessories':'✨'};
const groupOf=c=>Object.keys(CATS).find(k=>CATS[k].items.includes(c))||'acc';
const ls={get:(k,d)=>{try{return JSON.parse(localStorage.getItem('ms_'+k))??d}catch(e){return d}},set:(k,v)=>localStorage.setItem('ms_'+k,JSON.stringify(v))};
const fmt=n=>'UGX '+Number(n||0).toLocaleString('en-UG');

/* ===== STORE ===== */
const SEED=[
['Executive Office Chair','Office Chairs',850000,1000000,8,'Black leather, high back, adjustable height and tilt.'],
['Office Desk (Modern)','Office Desks',1200000,1350000,5,'Modern executive desk with drawers and cable hole.'],
['Reception Chair','Reception Chairs',450000,0,12,'Comfortable padded chair for waiting areas.'],
['Filing Cabinet (4 Drawer)','Filing Cabinets',680000,0,6,'Steel 4-drawer cabinet with lock.'],
['Salon Styling Chair','Salon Chairs',750000,940000,7,'Hydraulic salon chair, 360° swivel, easy-clean vinyl.'],
['Hair Washing Basin','Wash Basins',1100000,1300000,4,'Shampoo basin with reclining seat and ceramic bowl.'],
['Barber Chair','Barber Chairs',980000,0,5,'Heavy-duty hydraulic barber chair with footrest.'],
['Salon Trolley','Trolleys',320000,0,9,'3-tier rolling trolley for tools and products.'],
['Wall Mirror (Salon)','Mirrors',280000,0,10,'Large framed mirror for salon stations.'],
['Salon Accessories Set','Accessories',150000,0,20,'Capes, brushes, towels and styling basics.']
].map((p,i)=>({id:'p'+(i+1),name:p[0],category:p[1],price:p[2],oldPrice:p[3],stock:p[4],desc:p[5],image:'',colours:'Black, Brown',featured:i<4||i==6,best:i%2==0}));
const SETTINGS_DEF={whatsapp:'256704710896',phone:'0704 710 896',email:'suddamugisha4@icloud.com',location:'Katwe, before Total',hours:'Mon–Sat: 8:00 AM – 6:00 PM',pin:'1234'};
const Store={
  _p:[],
  products(){return Store._p},
  settings(){return SETTINGS_DEF},
  async load(){
    const c=window.MS_CONFIG||{};
    if(!c.SUPABASE_URL||!c.SUPABASE_KEY){Store._p=SEED;return Store._p}
    try{
      const r=await fetch(c.SUPABASE_URL+'/rest/v1/products?select=*&order=created_at.desc',{headers:{apikey:c.SUPABASE_KEY,Authorization:'Bearer '+c.SUPABASE_KEY}});
      if(!r.ok)throw new Error(r.status);
      Store._p=(await r.json()).map(d=>({id:d.id,name:d.name,category:d.category,price:+d.price,oldPrice:+d.old_price||0,stock:+d.stock,desc:d.description||'',colours:d.colours||'',image:d.image_url||'',featured:!!d.featured,best:!!d.best}));
    }catch(e){console.error(e);Store._p=[];toast('Could not load products. Check your internet.')}
    return Store._p;
  }
};
function img(p){
  if(p.image)return p.image;
  const e=ICON[p.category]||'🪑';
  return 'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#e9efdc"/><text x="150" y="175" font-size="110" text-anchor="middle">${e}</text><text x="150" y="265" font-size="15" text-anchor="middle" fill="#4a5d23" font-family="Arial">Photo coming soon</text></svg>`);
}
/* ===== CART & WISHLIST ===== */
const Cart={get:()=>ls.get('cart',[]),save(c){ls.set('cart',c);updateBadges()},
  add(id,q=1){const p=Store.products().find(x=>x.id===id);if(!p)return;if(p.stock<1){toast('Sorry, out of stock');return}
    const c=Cart.get();const i=c.find(x=>x.id===id);if(i)i.q=Math.min(i.q+q,p.stock);else c.push({id,q:Math.min(q,p.stock)});Cart.save(c);toast('Added to cart ✓')},
  count:()=>Cart.get().reduce((a,b)=>a+b.q,0)};
const Wish={get:()=>ls.get('wish',[]),toggle(id){let w=Wish.get();w=w.includes(id)?w.filter(x=>x!==id):[...w,id];ls.set('wish',w);updateBadges();return w.includes(id)}};
function updateBadges(){const c=document.getElementById('cn'),w=document.getElementById('wn');if(c)c.textContent=Cart.count();if(w)w.textContent=Wish.get().length}
function toast(m){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t)}t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200)}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function waLink(text){return 'https://wa.me/'+Store.settings().whatsapp.replace(/\D/g,'')+'?text='+encodeURIComponent(text)}

/* ===== PRODUCT CARD + DETAIL MODAL ===== */
function card(p){
  const disc=p.oldPrice>p.price?Math.round((1-p.price/p.oldPrice)*100):0;
  const liked=Wish.get().includes(p.id);
  return `<div class="card">${p.stock<1?'<span class="badge out">Out of stock</span>':disc?`<span class="badge">-${disc}%</span>`:''}
  <button class="wish" onclick="wishClick('${p.id}',this)">${liked?'❤️':'🤍'}</button>
  <div class="im" onclick="openProduct('${p.id}')"><img loading="lazy" src="${img(p)}" alt="${esc(p.name)}"></div>
  <div class="b"><span class="cat-l">${esc(p.category)}</span><h3>${esc(p.name)}</h3>
  <div class="row"><div><span class="price">${fmt(p.price)}</span>${disc?`<span class="old">${fmt(p.oldPrice)}</span>`:''}</div>
  <button class="add" title="Add to cart" onclick="Cart.add('${p.id}')">🛒</button></div></div></div>`;
}
function wishClick(id,b){b.textContent=Wish.toggle(id)?'❤️':'🤍'}
function openProduct(id){
  const p=Store.products().find(x=>x.id===id);if(!p)return;
  let m=document.getElementById('pm');if(!m){m=document.createElement('div');m.id='pm';m.className='modal';m.onclick=e=>{if(e.target===m)m.classList.remove('show')};document.body.appendChild(m)}
  const cols=(p.colours||'').split(',').map(s=>s.trim()).filter(Boolean);
  m.innerHTML=`<div class="mbox"><button class="x" onclick="document.getElementById('pm').classList.remove('show')">✕</button>
  <div class="mi"><img src="${img(p)}" alt="${esc(p.name)}"></div>
  <div class="mb"><span class="cat-l">${esc(p.category)}</span><h2>${esc(p.name)}</h2>
  <div><span class="price" style="font-size:22px">${fmt(p.price)}</span>${p.oldPrice>p.price?`<span class="old">${fmt(p.oldPrice)}</span>`:''}</div>
  <p>${esc(p.desc)}</p>
  <div>${p.stock>0?`<b style="color:var(--g)">✔ In stock</b> (${p.stock} available)`:'<b class="low">Out of stock</b>'}</div>
  ${cols.length?`<div><label style="font-size:13px;font-weight:600">Colour</label><select id="pcol" style="width:100%;padding:9px;border-radius:10px;border:1px solid #d6d9d0">${cols.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div>`:''}
  <div class="qty"><button onclick="qchg(-1)">−</button><span id="pq">1</span><button onclick="qchg(1,${p.stock})">+</button></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="Cart.add('${p.id}',+document.getElementById('pq').textContent)" ${p.stock<1?'disabled':''}>🛒 Add to cart</button>
  <a class="btn wa" target="_blank" href="${waLink('Hello M SUDAISE, I want to order: '+p.name+' ('+fmt(p.price)+')')}">WhatsApp order</a></div></div></div>`;
  m.classList.add('show');
}
function qchg(d,max=99){const e=document.getElementById('pq');e.textContent=Math.max(1,Math.min(max,+e.textContent+d))}

/* ===== LAYOUT (header + footer shared by all pages) ===== */
function layout(active){
  if(!document.querySelector('link[rel=icon]'))document.head.insertAdjacentHTML('beforeend','<link rel="icon" href="logo.png">');
  const s=Store.settings();
  const nav=[['index.html','Home'],['shop.html','Shop'],['shop.html?g=office','Office Furniture'],['shop.html?g=salon','Salon Furniture'],['shop.html?g=acc','Accessories'],['about.html','About & Contact']];
  document.body.insertAdjacentHTML('afterbegin',`
  <div class="topbar"><div class="wrap"><span>🚚 Delivery available</span><span>💳 Cash on delivery & Mobile Money</span><span>📞 ${esc(s.phone)}</span></div></div>
  <header class="main"><div class="hrow">
   <a class="logo" href="index.html"><span class="mark"><img src="logo.png" alt="" onerror="this.replaceWith('🪑')"></span><span><b>M SUDAISE</b><small>Office & Saloon Furniture & Accessories Shop</small></span></a>
   <form class="search" onsubmit="event.preventDefault();location='shop.html?q='+encodeURIComponent(this.q.value)"><input name="q" placeholder="Search for products, categories..."><button>🔍</button></form>
   <div class="icons"><a class="ibtn" href="shop.html?wish=1" title="Wishlist">♡<span class="n" id="wn">0</span></a><a class="ibtn" href="cart.html" title="Cart">🛒<span class="n" id="cn">0</span></a></div>
  </div>
  <nav class="menu"><div class="wrap">${nav.map(n=>`<a href="${n[0]}" class="${n[0]===active?'on':''}">${n[1]}</a>`).join('')}</div></nav></header>`);
  document.body.insertAdjacentHTML('beforeend',`
  <a class="wa-float" target="_blank" href="${waLink('Hello M SUDAISE, I need help.')}" title="Chat on WhatsApp">💬</a>
  <footer class="ft"><div class="wrap"><div class="fgrid">
   <div><h4>M SUDAISE</h4><p style="font-size:14px">Office & Saloon Furniture & Accessories Shop.<br>Your comfort, our priority.</p><p style="margin-top:10px;font-size:14px">📍 ${esc(s.location)}<br>📞 ${esc(s.phone)}<br>✉️ ${esc(s.email)}</p></div>
   <div><h4>Shop</h4><ul><li><a href="shop.html?g=office">Office Furniture</a></li><li><a href="shop.html?g=salon">Salon Furniture</a></li><li><a href="shop.html?g=acc">Accessories</a></li></ul></div>
   <div><h4>Help</h4><ul><li><a href="cart.html">Cart & Checkout</a></li><li><a href="about.html#contact">Contact Us</a></li></ul></div>
   <div><h4>Company</h4><ul><li><a href="about.html">About Us</a></li></ul></div>
  </div><div class="fbot"><span>© ${new Date().getFullYear()} M SUDAISE. All rights reserved.</span><span>🇺🇬 Uganda</span></div></div></footer>`);
  updateBadges();
}
