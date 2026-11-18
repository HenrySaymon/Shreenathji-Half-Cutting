/* Native layer (Capacitor): SQLite database, native share/files, back button.
   In a normal browser this file does nothing and the app uses localStorage. */
(function(){
const P=()=>(window.Capacitor&&Capacitor.Plugins)||{};
const NATIVE=!!(window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform());
const DB='shreenathji_billing',last={};let ready=false,tmr=null,q=Promise.resolve();
const SCHEMA=`CREATE TABLE IF NOT EXISTS invoices(id INTEGER PRIMARY KEY,no TEXT,customer TEXT,date TEXT,total REAL,paid INTEGER,paid_on TEXT,edited TEXT,entries TEXT);
CREATE TABLE IF NOT EXISTS customers(name TEXT PRIMARY KEY,phone TEXT,photo TEXT);
CREATE TABLE IF NOT EXISTS stickers(name TEXT PRIMARY KEY,photo TEXT);
CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY,v TEXT);
CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY,v TEXT);
CREATE INDEX IF NOT EXISTS ix_inv_customer ON invoices(customer);
CREATE INDEX IF NOT EXISTS ix_inv_date ON invoices(date);`;
const OR=s=>s.replace('INSERT','INSERT OR REPLACE');
function tables(){const cs=[...new Set([...Object.keys(db.cust),...Object.keys(db.cdet)])];return{
 invoices:[OR('INSERT INTO invoices VALUES(?,?,?,?,?,?,?,?,?)'),db.inv.map(i=>[i.id,i.no,i.customer,i.date,i.total,i.paid?1:0,i.paidOn||null,i.edited||null,JSON.stringify(i.entries)])],
 customers:[OR('INSERT INTO customers VALUES(?,?,?)'),cs.map(n=>[n,(db.cdet[n]||{}).phone||'',db.cust[n]||null])],
 stickers:[OR('INSERT INTO stickers VALUES(?,?)'),Object.entries(db.stk).map(([n,p])=>[n,p])],
 settings:[OR('INSERT INTO settings VALUES(?,?)'),[['min',String(db.min)],['biz',db.biz||''],['phone',db.phone||''],['adminImg',db.adminImg||'']]],
 meta:[OR('INSERT INTO meta VALUES(?,?)'),[['seq',String(db.seq)],['draft',JSON.stringify(db.draft)]]]}}
async function write(){const S=P().CapacitorSQLite,T=tables();
 for(const t in T){const[ins,rows]=T[t],j=JSON.stringify(rows);if(last[t]===j)continue;
  await S.executeSet({database:DB,set:[{statement:'DELETE FROM '+t,values:[]},...rows.map(r=>({statement:ins,values:r}))],transaction:true,readonly:false});last[t]=j}}
window.sqlSave=function(now){if(!ready)return;clearTimeout(tmr);
 const go=()=>{q=q.then(write).catch(e=>{console.error('SQLite write failed',e);typeof toast==='function'&&toast('Could not save to the database','error')})};
 now?go():(tmr=setTimeout(go,250))};
async function load(){const S=P().CapacitorSQLite;
 try{await S.createConnection({database:DB,version:1,encrypted:false,mode:'no-encryption',readonly:false})}catch(e){}
 await S.open({database:DB,readonly:false});
 await S.execute({database:DB,statements:SCHEMA,transaction:true,readonly:false});
 const rd=async s=>((await S.query({database:DB,statement:s,values:[],readonly:false})).values||[]).filter(r=>r&&!r.ios_columns);
 const inv=await rd('SELECT * FROM invoices ORDER BY id DESC'),cu=await rd('SELECT * FROM customers'),st=await rd('SELECT * FROM stickers'),se=await rd('SELECT * FROM settings'),me=await rd('SELECT * FROM meta');
 if(!(inv.length||cu.length||st.length||se.length||me.length)){ready=true;window.sqlSave(true);return}  // first run: copy what the app already holds
 const s={},m={};se.forEach(r=>s[r.k]=r.v);me.forEach(r=>m[r.k]=r.v);
 const n={...db,seq:+m.seq||0,min:s.min!=null?+s.min:80,biz:s.biz||db.biz,phone:s.phone||'',adminImg:s.adminImg||'',cust:{},cdet:{},stk:{},
  inv:inv.map(r=>{const o={id:r.id,no:r.no,customer:r.customer,date:r.date,total:r.total,paid:!!r.paid,paidOn:r.paid_on||null,entries:JSON.parse(r.entries||'[]')};if(r.edited)o.edited=r.edited;return o}),
  draft:m.draft?JSON.parse(m.draft):{customer:'',entries:[]}};
 cu.forEach(r=>{if(r.photo)n.cust[r.name]=r.photo;n.cdet[r.name]={phone:r.phone||''}});st.forEach(r=>n.stk[r.name]=r.photo);
 db=n;ready=true;try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){}}
function install(){
 window.sendFile=async function(blob,name,title){try{
  const data=await new Promise((res,rej)=>{const f=new FileReader;f.onload=()=>res(String(f.result).split(',')[1]);f.onerror=rej;f.readAsDataURL(blob)});
  const w=await P().Filesystem.writeFile({path:name,data,directory:'CACHE'});
  await P().Share.share({title,dialogTitle:title,files:[w.uri]})}
  catch(e){if(!/cancel/i.test(String((e&&e.message)||e)))toast('Could not share the file','error')}};
 dl=(c,i)=>c.toBlob(b=>sendFile(b,fn(i),'Bill '+i.no));
 saveImg=async()=>{try{dl(await canvasOf(cur),cur)}catch(e){}};
 shareWA=async()=>{const i=cur;let r;$('load').classList.add('on');try{r=await prep(i)}catch(e){pre={};toast('Could not make the image','error');return}finally{$('load').classList.remove('on')}
  await sendFile(r.b,fn(i),'Bill '+i.no)};
 prt=async()=>{const i=cur;let c;try{c=await canvasOf(i)}catch(e){return}
  if(!window.jspdf)return toast('PDF tool did not load','error');
  const p=new window.jspdf.jsPDF({unit:'mm',format:'a4'}),h=c.height*190/c.width,w=h>277?190*277/h:190;
  p.addImage(c.toDataURL('image/jpeg',.92),'JPEG',(210-w)/2,10,w,Math.min(h,277));
  await sendFile(p.output('blob'),i.no+'_'+i.customer.replace(/\W/g,'_')+'.pdf','Bill '+i.no)};
 exp=()=>sendFile(new Blob([JSON.stringify(db)],{type:'application/json'}),'shreenathji-backup-'+nowL().slice(0,10)+'.json','Billing backup');
 remind=()=>{const n=cc,u=cinv(n).filter(i=>!i.paid);let p=((db.cdet[n]||{}).phone||'').replace(/\D/g,'');if(p.length===10)p='91'+p;if(!p)return toast('Add a phone number first');
  const t=`Namaste ${n},\nA gentle reminder from ${db.biz}: ${inr(sum(u))} is pending on ${pl(u.length,'invoice')} (${u.map(i=>i.no).join(', ')}).\nThank you!`;
  P().Browser.open({url:'https://wa.me/'+p+'?text='+encodeURIComponent(t)})};
 try{const A=P().App;A.addListener('backButton',()=>{const o=[...document.querySelectorAll('.ov.on')].pop();if(o){o.classList.remove('on');return}
  const v=document.querySelector('nav button.on').dataset.v;if(v!=='home')go('home');else A.exitApp()})}catch(e){}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)window.sqlSave&&window.sqlSave(true)})}
window.bootDB=async function(){if(!NATIVE)return;
 try{await load()}catch(e){console.error('SQLite unavailable',e);ready=false;setTimeout(()=>typeof toast==='function'&&toast('Database unavailable — using phone storage instead','warn'),1800)}
 install()};
})();
