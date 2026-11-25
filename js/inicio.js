(window.Media&&Media.run||function(f){f()})(function(){
 var $=function(i){return document.getElementById(i)};
 var KEY='inicio-v1',ADMIN=false,fails=0,lockUntil=0,target=null;
 /* HASH = SHA-256 de 'regalia:' + PIN (PIN de ejemplo: 2468) */
 var HASH='9d63b52aa93050f668f72e58e24a38448cb7ac05fb77a7d6b572f7a5655abb94';
 var DEF=[['Reparación de equipos','Diagnóstico y restauración de videoconsolas, portátiles y computadores de sobremesa.'],
  ['Incorporación de piezas','Pantallas, baterías, discos y memorias para portátiles y escritorio.'],
  ['Armado de equipos','Selección de piezas, ensamblaje y pruebas de estabilidad.'],
  ['Setups y consultoría','Puestos de trabajo ordenados y asesoría técnica.']];
 var S={txt:{},imgs:{},logoText:true,cards:DEF.map(function(c,i){return{id:'c'+i,t:c[0],d:c[1]}})};
 try{var raw=localStorage.getItem(KEY);if(raw){var p=JSON.parse(raw);if(p&&p.cards)S=p}}catch(e){}
 S.txt=S.txt||{};S.imgs=S.imgs||{};
 /* borra los videos que ese servicio guardó en este navegador (IndexedDB) */
 function dropMedia(pg,sid){
  try{var keys=['v-'+sid];((pg.blocks&&pg.blocks.items)||[]).forEach(function(b){if(b.v&&b.v.type==='local')keys.push('blk-'+b.id)});
   var q=indexedDB.open('regalia-media',1);q.onsuccess=function(){try{var tx=q.result.transaction('v','readwrite'),s=tx.objectStore('v');keys.forEach(function(k){s.delete(k)})}catch(x){}};q.onupgradeneeded=function(){q.result.createObjectStore('v')};
  }catch(x){}
 }
 function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){$('toggle').title='No se pudo guardar (imagen muy pesada)';$('hero-msg').textContent='No se pudo guardar: el archivo es muy pesado para este navegador. Usa «Usar enlace» con un archivo de la carpeta img/.'}}
 function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function ph(label){
  var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250"><rect width="400" height="250" fill="#26343a"/><rect y="140" width="400" height="110" fill="#101a18"/><circle cx="200" cy="85" r="38" fill="none" stroke="#f2c200" stroke-width="9" stroke-dasharray="12 7"/><circle cx="200" cy="85" r="14" fill="#f2c200"/><text x="200" y="175" fill="#6fd3c6" font-family="sans-serif" font-size="17" text-anchor="middle">'+esc(label)+'</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
 }
 function fillSlot(el,key,label){
  el.innerHTML='<img alt="" src="'+(S.imgs[key]||ph(label))+'"><div class="tools"><button class="btn solid" type="button" data-act="chg">Cambiar imagen</button><button class="btn" type="button" data-act="rst">Quitar</button></div>';
  el.querySelector('img').alt=label;el.dataset.key=key;
 }
 function applyLogo(){
  var im=$('logo-img'),df=$('logo-def');
  if(S.logo){im.src=S.logo;im.hidden=false;df.style.display='none'}else{im.hidden=true;df.style.display=''}
  $('brand-name').hidden=(S.logoText===false);$('logo-txt').checked=(S.logoText!==false);
 }
 var TMP={};
 function hi(k){return TMP[k]||S.imgs[k]}
 function cssUrl(u){return 'url("'+String(u).replace(/[\\"()\n\r]/g,function(c){return '%'+('0'+c.charCodeAt(0).toString(16).toUpperCase()).slice(-2)})+'")'}
 function applyHero(){
  var h=$('hero'),o=S.heroOpt||{},d=o.dim==null?45:o.dim;
  h.classList.toggle('has-img',!!hi('hero'));h.classList.toggle('has-m',!!hi('heroM'));
  if(hi('hero'))h.style.setProperty('--hero-img',cssUrl(hi('hero')));else h.style.removeProperty('--hero-img');
  if(hi('heroM'))h.style.setProperty('--hero-img-m',cssUrl(hi('heroM')));else h.style.removeProperty('--hero-img-m');
  h.dataset.h=o.h||'m';h.style.setProperty('--hero-pos',o.pos||'center');h.style.setProperty('--dim',d/100);
  $('hero-h').value=o.h||'m';$('hero-pos').value=o.pos||'center';$('hero-dim').value=d;
 }
 function setEditable(on){
  [].forEach.call(document.querySelectorAll('[data-edit],[data-f]'),function(e){if(on)e.contentEditable='true';else e.removeAttribute('contenteditable')});
 }
 function render(){
  [].forEach.call(document.querySelectorAll('[data-edit]'),function(e){var v=S.txt[e.dataset.edit];if(v!=null)e.textContent=v});
  var g=$('grid');g.innerHTML='';
  S.cards.forEach(function(c){
   var a=document.createElement('article');a.className='card';
   a.innerHTML='<div class="mv" role="group" aria-label="Mover este servicio"><button class="btn mvb" type="button" data-mv="left" aria-label="Mover a la izquierda">←</button><button class="btn mvb" type="button" data-mv="up" aria-label="Subir">↑</button><button class="btn mvb" type="button" data-mv="down" aria-label="Bajar">↓</button><button class="btn mvb" type="button" data-mv="right" aria-label="Mover a la derecha">→</button><span class="mvh" draggable="true" title="Arrastra para reordenar" aria-hidden="true">⠿ Mover</span></div><div class="slot"></div><div class="body"><h3 data-f="t">'+esc(c.t)+'</h3><p data-f="d">'+esc(c.d)+'</p><a class="more" href="servicio.html?s='+encodeURIComponent(c.id)+'"><span class="v">Ver detalles →</span><span class="e">Abrir y editar página →</span></a><button class="btn rm" type="button" data-act="del">Eliminar</button></div>';
   a.dataset.id=c.id;g.appendChild(a);fillSlot(a.querySelector('.slot'),c.id,c.t);
  });
  applyLogo();applyHero();setEditable(document.body.classList.contains('edit'));updateMv();
 }

 /* subir imágenes */
 function pick(key){if(!ADMIN)return;target=key;$('file').click()}
 $('file').addEventListener('change',function(){
  var f=this.files[0];this.value='';if(!ADMIN||!f||!target)return;
  if(target!=='logo'&&/^image\/(gif|webp|apng)$/.test(f.type)){
   var k0=target;
   if(f.size>25*1024*1024){
    TMP[k0]=URL.createObjectURL(f);render();
    $('hero-msg').textContent='Este archivo pesa '+(f.size/1048576).toFixed(1)+' MB: se ve ahora, pero no se guarda. Súbelo a la carpeta img/ y usa «Usar enlace».';
    return;
   }
   var rd=new FileReader();rd.onload=function(){delete TMP[k0];S.imgs[k0]=rd.result;save();render();$('hero-msg').textContent='Animación guardada.'};rd.readAsDataURL(f);return;
  }
  var key=target,u=URL.createObjectURL(f),im=new Image();
  im.onload=function(){
   var max=key==='logo'?480:(key==='hero'||key==='heroM')?1600:1200,k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');
   c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));
   c.getContext('2d').drawImage(im,0,0,c.width,c.height);
   var d=key==='logo'?c.toDataURL('image/png'):c.toDataURL('image/jpeg',.82);
   if(key==='logo')S.logo=d;else S.imgs[key]=d;
   URL.revokeObjectURL(u);save();render();
  };
  im.onerror=function(){URL.revokeObjectURL(u)};
  im.src=u;
 });
 $('logo-chg').onclick=function(){pick('logo')};
 $('logo-rst').onclick=function(){if(!ADMIN)return;delete S.logo;S.logoText=true;save();applyLogo()};
 $('logo-txt').onchange=function(){if(!ADMIN){this.checked=!this.checked;return}S.logoText=this.checked;save();applyLogo()};
 $('hero-chg').onclick=function(){pick('hero')};
 $('hero-m').onclick=function(){pick('heroM')};
 $('hero-url').onclick=function(){
  if(!ADMIN)return;
  var u=(prompt('Dirección de la imagen o GIF (https://… o img/banner.gif):')||'').trim();
  if(!u)return;
  if(!/^(https:\/\/|\/|\.\/|img\/)/i.test(u)){$('hero-msg').textContent='Usa una dirección https:// o una ruta como img/banner.gif.';return}
  delete TMP.hero;S.imgs.hero=u;save();applyHero();$('hero-msg').textContent='Enlace aplicado.';
 };
 $('hero-rst').onclick=function(){if(!ADMIN)return;delete S.imgs.hero;delete S.imgs.heroM;delete TMP.hero;delete TMP.heroM;save();applyHero()};
 function heroOpt(){if(!ADMIN)return;S.heroOpt={h:$('hero-h').value,pos:$('hero-pos').value,dim:+$('hero-dim').value};save();applyHero()}
 ['hero-h','hero-pos'].forEach(function(i){$(i).onchange=heroOpt});
 $('hero-dim').oninput=heroOpt;

 /* clics: botones de tarjeta y visor */
 document.addEventListener('click',function(e){
  var b=e.target.closest('[data-act]');
  if(b){
   if(!ADMIN)return;var slot=b.closest('.slot');
   if(b.dataset.act==='chg')pick(slot.dataset.key);
   if(b.dataset.act==='rst'){delete S.imgs[slot.dataset.key];save();render()}
   if(b.dataset.act==='del'){var id=b.closest('.card').dataset.id;S.cards=S.cards.filter(function(c){return c.id!==id});delete S.imgs[id];try{var sv=JSON.parse(localStorage.getItem('servicios-v1'));if(sv&&sv.pages&&sv.pages[id]){dropMedia(sv.pages[id],id);delete sv.pages[id];localStorage.setItem('servicios-v1',JSON.stringify(sv))}}catch(x){}save();render()}
   return;
  }
  var im=e.target.closest('.slot img');
  if(im&&!document.body.classList.contains('edit')){$('lb').querySelector('img').src=im.src;$('lb').classList.add('on')}
 });
 $('lbx').onclick=function(){$('lb').classList.remove('on')};
 $('lb').addEventListener('click',function(e){if(e.target===this)this.classList.remove('on')});

 /* guardar textos */
 document.addEventListener('input',function(e){
  if(!ADMIN)return;var el=e.target;
  if(el.dataset&&el.dataset.edit)S.txt[el.dataset.edit]=el.textContent;
  if(el.dataset&&el.dataset.f){var id=el.closest('.card').dataset.id;S.cards.forEach(function(c){if(c.id===id)c[el.dataset.f]=el.textContent})}
  save();
 });
 $('add').onclick=function(){if(!ADMIN)return;S.cards.push({id:'c'+Date.now(),t:'Nuevo servicio',d:'Escribe aquí la descripción.'});save();render()};

 /* ===== ACCESO ADMIN (oculto + PIN) ===== */
 function sha(s){return crypto.subtle.digest('SHA-256',new TextEncoder().encode('regalia:'+s)).then(function(b){return [].map.call(new Uint8Array(b),function(x){return('0'+x.toString(16)).slice(-2)}).join('')})}
 function reveal(){$('toggle').hidden=false}
 /* Mostrar el botón: #admin en la URL, Ctrl+Mayús+E, o 5 clics rápidos en el logo */
 if(location.hash==='#admin')reveal();
 window.addEventListener('hashchange',function(){if(location.hash==='#admin')reveal()});
 document.addEventListener('keydown',function(e){
  if(e.ctrlKey&&e.shiftKey&&(e.key==='E'||e.key==='e')){e.preventDefault();reveal();$('toggle').focus()}
  if(e.key==='Escape'){closePin();$('lb').classList.remove('on')}
 });
 (function(){var n=0,tm;document.querySelector('.brand').addEventListener('click',function(){n++;clearTimeout(tm);tm=setTimeout(function(){n=0},1500);if(n>=5){n=0;reveal()}})})();
 var pinOk=null;
 function closePin(){$('pin').classList.remove('on');$('pin-i').value='';$('pin-e').textContent=''}
 function askPin(cb){if(window.AdminPin&&AdminPin.sessionActive()){cb();return} /* sesión ya confirmada en esta pestaña */
 pinOk=cb;$('pin').classList.add('on');$('pin-i').focus()}
 $('pin-x').onclick=closePin;
 $('pinf').addEventListener('submit',function(e){
  e.preventDefault();var now=Date.now();
  if(now<lockUntil){$('pin-e').textContent='Demasiados intentos. Espera '+Math.ceil((lockUntil-now)/1000)+' s.';return}
  if(!window.crypto||!crypto.subtle){$('pin-e').textContent='Este navegador no permite verificar el PIN.';return}
  AdminPin.verify($('pin-i').value).then(function(ok){
   if(ok){fails=0;AdminPin.sessionStart();closePin();if(pinOk)pinOk()}
   else{fails++;$('pin-i').value='';if(fails>=3){lockUntil=Date.now()+30000*fails;$('pin-e').textContent='PIN incorrecto. Acceso bloqueado temporalmente.'}else{$('pin-e').textContent='PIN incorrecto.'}}
  });
 });
 $('toggle').onclick=function(){
  if(!ADMIN){askPin(function(){ADMIN=true;$('toggle').onclick.call($('toggle'))});return}
  var on=document.body.classList.toggle('edit');this.setAttribute('aria-pressed',on);
  this.textContent=on?'Terminar edición':'Modo edición';setEditable(on);
  if(!on){ADMIN=false;this.hidden=true;AdminPin.sessionEnd()}
 };

 /* ===== Reordenar los servicios (modo edición): flechas ← ↑ ↓ → o arrastrar desde «⠿ Mover» ===== */
 function colsNow(){
  var cs=[].slice.call($('grid').children);if(!cs.length)return 1;
  var t0=Math.round(cs[0].getBoundingClientRect().top),n=0;
  cs.forEach(function(c){if(Math.abs(Math.round(c.getBoundingClientRect().top)-t0)<3)n++});
  return Math.max(1,n);
 }
 function mvTarget(i,dir,cols,len){
  if(dir==='left')return (cols>1&&i>0)?i-1:null;
  if(dir==='right')return (cols>1&&i<len-1)?i+1:null;
  if(dir==='up')return i-cols>=0?i-cols:null;
  if(dir==='down')return i+cols<len?i+cols:null;
  return null;
 }
 function updateMv(){
  var g=$('grid'),cols=colsNow(),len=S.cards.length;
  g.classList.toggle('one-col',cols===1);
  [].forEach.call(g.children,function(card,i){
   ['left','right','up','down'].forEach(function(d){var b=card.querySelector('[data-mv="'+d+'"]');if(b)b.disabled=mvTarget(i,d,cols,len)==null});
  });
 }
 window.addEventListener('resize',updateMv);
 function idxOf(id){return S.cards.map(function(c){return c.id}).indexOf(id)}
 function moveCard(id,dir){
  if(!ADMIN)return;
  var i=idxOf(id),j=i<0?null:mvTarget(i,dir,colsNow(),S.cards.length);if(j==null)return;
  var t=S.cards[i];S.cards[i]=S.cards[j];S.cards[j]=t; /* intercambia las posiciones */
  save();render();
  var card=[].filter.call($('grid').children,function(c){return c.dataset.id===id})[0];
  if(card){
   var b=card.querySelector('[data-mv="'+dir+'"]');if(!b||b.disabled)b=card.querySelector('.mvb:not([disabled])');
   if(b)b.focus();
   card.scrollIntoView({block:'nearest',behavior:(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches)?'auto':'smooth'});
  }
 }
 $('grid').addEventListener('click',function(e){
  var b=e.target.closest&&e.target.closest('[data-mv]');if(!b||b.disabled)return;
  moveCard(b.closest('.card').dataset.id,b.dataset.mv);
 });
 var dragId=null;
 function dropInfo(card,e){
  var r=card.getBoundingClientRect(),h=colsNow()>1,after=h?(e.clientX>r.left+r.width/2):(e.clientY>r.top+r.height/2);
  return{after:after,cls:h?(after?'drop-r':'drop-l'):(after?'drop-b':'drop-t')};
 }
 function clearDrop(){[].forEach.call($('grid').children,function(c){c.classList.remove('dragging','drop-l','drop-r','drop-t','drop-b')})}
 $('grid').addEventListener('dragstart',function(e){
  var h=e.target.closest&&e.target.closest('.mvh');if(!h||!ADMIN)return;
  var card=h.closest('.card');dragId=card.dataset.id;
  e.dataTransfer.effectAllowed='move';
  try{e.dataTransfer.setData('text/plain',dragId);e.dataTransfer.setDragImage(card,24,24)}catch(x){}
  card.classList.add('dragging');
 });
 $('grid').addEventListener('dragover',function(e){
  if(!dragId)return;var card=e.target.closest('.card');if(!card||card.dataset.id===dragId)return;
  e.preventDefault();e.dataTransfer.dropEffect='move';
  [].forEach.call($('grid').children,function(c){c.classList.remove('drop-l','drop-r','drop-t','drop-b')});
  card.classList.add(dropInfo(card,e).cls);
 });
 $('grid').addEventListener('drop',function(e){
  if(!dragId||!ADMIN)return;var card=e.target.closest('.card');
  if(!card||card.dataset.id===dragId){clearDrop();dragId=null;return}
  e.preventDefault();var d=dropInfo(card,e),from=idxOf(dragId),item=S.cards.splice(from,1)[0],to=idxOf(card.dataset.id);
  S.cards.splice(d.after?to+1:to,0,item);dragId=null;save();render();
 });
 $('grid').addEventListener('dragend',function(){clearDrop();dragId=null});

 var bg=document.querySelector('.burger'),m=$('menu');
 bg.addEventListener('click',function(){var o=m.classList.toggle('open');bg.setAttribute('aria-expanded',o)});
 render();
});
