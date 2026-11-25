(window.Media&&Media.run||function(f){f()})(function(){
 var $=function(i){return document.getElementById(i)};
 var KEY='trabajo-v1';
 var S={lead:null,imgs:{}};
 try{var raw=localStorage.getItem(KEY);if(raw){var p=JSON.parse(raw);if(p&&typeof p==='object'){S=p}}}catch(x){}
 S.imgs=S.imgs||{};
 var SUPDEF={t:'Insumos de trabajo',d:'Trabajamos con insumos y repuestos de proveedores de confianza para asegurar la calidad de cada reparación y armado.',items:[1,2,3,4].map(function(i){return{id:'p'+i,n:'Nombre del proveedor'}})};
 if(!S.sup||!Array.isArray(S.sup.items))S.sup=JSON.parse(JSON.stringify(SUPDEF));
 /* galería: reemplaza a «Trabajos y características» */
 var GALDEF={t:'Galería',d:'Algunos de los trabajos realizados en el taller.',items:[1,2,3,4,5,6].map(function(i){return{id:'g'+i,c:''}})};
 if(!S.gal||!Array.isArray(S.gal.items))S.gal=JSON.parse(JSON.stringify(GALDEF));
 delete S.cards;Object.keys(S.imgs).forEach(function(k){if(/^(c\d|g-)/.test(k))delete S.imgs[k]});

 function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){$('toggle').title='No se pudo guardar (imagen muy pesada)'}}
 /* imagen de reemplazo con degradado y engranaje */
 function ph(label){
  var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#26343a"/><rect y="170" width="400" height="130" fill="#101a18"/><circle cx="200" cy="130" r="42" fill="none" stroke="#f2c200" stroke-width="10" stroke-dasharray="14 8"/><circle cx="200" cy="130" r="16" fill="#f2c200"/><text x="200" y="250" fill="#6fd3c6" font-family="sans-serif" font-size="18" text-anchor="middle">'+label+'</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
 }
 function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

 /* espacios de imagen */
 var target=null;
 function fillSlot(el,key,label){
  el.innerHTML='<img alt="" src="'+(S.imgs[key]||ph(label))+'"><div class="tools"><button class="btn solid" type="button" data-act="chg">Cambiar imagen</button><button class="btn" type="button" data-act="rst">Quitar</button></div>';
  el.querySelector('img').alt=label;
  el.dataset.key=key;
 }
 function render(){
  var lead=document.querySelector('[data-edit="lead"]');if(S.lead)lead.textContent=S.lead;
  fillSlot(document.querySelector('[data-slot="main"]'),'main','Foto principal');
  renderSup();galTexts();if(GAL)GAL.render();setEditable($('page').classList.contains('edit'));applyLogo();
 }
 function setEditable(on){
  [].forEach.call(document.querySelectorAll('[data-edit],[data-f]'),function(e){e.contentEditable=on?'true':'false';if(!on)e.removeAttribute('contenteditable')});
 }

 /* eventos */
 document.addEventListener('click',function(e){
  var b=e.target.closest('[data-act]');
  if(b){
   if(!ADMIN)return;var slot=b.closest('.slot');
   if(b.dataset.act==='chg'){target=slot.dataset.key;$('file').click()}
   if(b.dataset.act==='rst'){delete S.imgs[slot.dataset.key];save();render()}
   return;
  }
  var im=e.target.closest('.slot img');
  if(im&&!$('page').classList.contains('edit')){$('lb').querySelector('img').src=im.src;$('lb').classList.add('on')}
 });
 $('lbx').onclick=function(){$('lb').classList.remove('on')};
 $('lb').addEventListener('click',function(e){if(e.target===this)this.classList.remove('on')});
 document.addEventListener('keydown',function(e){if(e.key==='Escape')$('lb').classList.remove('on')});

 /* subir imagen: se reduce a 1200 px para ahorrar espacio */
 $('file').addEventListener('change',function(){
  var f=this.files[0];this.value='';if(!ADMIN||!f||!target)return;
  if(/^image\/(gif|webp)$/.test(f.type)&&f.size<=25*1048576){var gk=target,rd=new FileReader();rd.onload=function(){S.imgs[gk]=rd.result;save();render()};rd.readAsDataURL(f);return} /* GIF/WebP animados se guardan tal cual */
  var key=target,u=URL.createObjectURL(f),im=new Image();
  im.onload=function(){
   var k=Math.min(1,(key.indexOf('sup-')===0?600:1200)/Math.max(im.width,im.height)),c=document.createElement('canvas');
   c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
   c.getContext('2d').drawImage(im,0,0,c.width,c.height);
   S.imgs[key]=key.indexOf('sup-')===0?c.toDataURL('image/png'):c.toDataURL('image/jpeg',.82);URL.revokeObjectURL(u);save();render();
  };
  im.src=u;
 });

 /* guardar textos */
 document.addEventListener('input',function(e){
  if(!ADMIN)return;var el=e.target;
  if(el.dataset&&el.dataset.edit==='lead'){S.lead=el.textContent}
  save();
 });
 $('toggle').onclick=function(){
  if(!ADMIN){askPin(function(){ADMIN=true;$('toggle').onclick.call($('toggle'))});return}
  var on=$('page').classList.toggle('edit');this.setAttribute('aria-pressed',on);this.textContent=on?'Terminar edición':'Modo edición';setEditable(on);if(!on){ADMIN=false;this.hidden=true;AdminPin.sessionEnd()}
 };

 /* ===== ACCESO ADMIN =====
    HASH = SHA-256 de 'regalia:' + PIN (PIN de ejemplo: 2468; cámbialo, ver instrucciones) */
 var ADMIN=false,HASH='9d63b52aa93050f668f72e58e24a38448cb7ac05fb77a7d6b572f7a5655abb94',fails=0,lockUntil=0;
 function sha(s){return crypto.subtle.digest('SHA-256',new TextEncoder().encode('regalia:'+s)).then(function(b){return [].map.call(new Uint8Array(b),function(x){return('0'+x.toString(16)).slice(-2)}).join('')})}
 function reveal(){$('toggle').hidden=false}
 /* Formas ocultas de mostrar el botón: #admin en la URL, Ctrl+Mayús+E, o 5 clics rápidos en el logo */
 if(location.hash==='#admin')reveal();
 window.addEventListener('hashchange',function(){if(location.hash==='#admin')reveal()});
 document.addEventListener('keydown',function(e){if(e.ctrlKey&&e.shiftKey&&(e.key==='E'||e.key==='e')){e.preventDefault();reveal();$('toggle').focus()}});
 (function(){var n=0,tm;document.querySelector('.brand').addEventListener('click',function(){n++;clearTimeout(tm);tm=setTimeout(function(){n=0},1500);if(n>=5){n=0;reveal()}})})();
 var pinOk=null;
 function closePin(){$('pin').classList.remove('on');$('pin-i').value='';$('pin-e').textContent=''}
 function askPin(cb){if(window.AdminPin&&AdminPin.sessionActive()){cb();return} /* sesión ya confirmada en esta pestaña */
 pinOk=cb;$('pin').classList.add('on');$('pin-i').focus()}
 $('pin-x').onclick=closePin;
 document.addEventListener('keydown',function(e){if(e.key==='Escape')closePin()});
 $('pinf').addEventListener('submit',function(e){
  e.preventDefault();var now=Date.now();
  if(now<lockUntil){$('pin-e').textContent='Demasiados intentos. Espera '+Math.ceil((lockUntil-now)/1000)+' s.';return}
  if(!window.crypto||!crypto.subtle){$('pin-e').textContent='Este navegador no permite verificar el PIN.';return}
  AdminPin.verify($('pin-i').value).then(function(ok){
   if(ok){fails=0;AdminPin.sessionStart();closePin();if(pinOk)pinOk()}
   else{fails++;$('pin-i').value='';if(fails>=3){lockUntil=Date.now()+30000*fails;$('pin-e').textContent='PIN incorrecto. Acceso bloqueado temporalmente.'}else{$('pin-e').textContent='PIN incorrecto.'}}
  });
 });

 /* ===== LOGO PERSONALIZADO ===== */
 function applyLogo(){
  var im=$('logo-img'),df=$('logo-def'),nm=$('brand-name');
  if(S.logo){im.src=S.logo;im.hidden=false;df.style.display='none'}else{im.hidden=true;df.style.display=''}
  nm.hidden=(S.logoText===false);
  $('logo-txt').checked=(S.logoText!==false);
 }
 $('logo-chg').onclick=function(){if(ADMIN)$('file-logo').click()};
 $('logo-rst').onclick=function(){if(!ADMIN)return;delete S.logo;S.logoText=true;save();applyLogo()};
 $('logo-txt').onchange=function(){if(!ADMIN){this.checked=!this.checked;return}S.logoText=this.checked;save();applyLogo()};
 $('file-logo').addEventListener('change',function(){
  var f=this.files[0];this.value='';if(!ADMIN||!f)return;
  var u=URL.createObjectURL(f),im=new Image();
  im.onload=function(){
   var k=Math.min(1,480/Math.max(im.width,im.height)),c=document.createElement('canvas');
   c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));
   c.getContext('2d').drawImage(im,0,0,c.width,c.height);
   S.logo=c.toDataURL('image/png');URL.revokeObjectURL(u);save();applyLogo();
  };
  im.onerror=function(){URL.revokeObjectURL(u);$('toggle').title='No se pudo leer la imagen'};
  im.src=u;
 });

 /* ===== Insumos / proveedores (logo + nombre, editable en modo edición) ===== */
 function phSup(){var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f1efe6"/><rect x="130" y="95" width="140" height="110" rx="8" fill="none" stroke="#9a968a" stroke-width="8" stroke-dasharray="14 10"/><text x="200" y="160" fill="#7d7b72" font-family="sans-serif" font-size="30" text-anchor="middle">Logo</text></svg>';return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s)}
 function hostOf(u){try{return new URL(u).hostname.replace(/^www\./,'')}catch(x){return ''}}
 var supShown=false;
 function revealSup(){
  var g=$('sup-grid');
  if(supShown||!('IntersectionObserver' in window)||(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches)){g.classList.add('show');return}
  var io=new IntersectionObserver(function(en){if(en[0].isIntersecting){supShown=true;g.classList.add('show');io.disconnect()}},{threshold:.12});io.observe(g);
 }
 function renderSup(){
  var ed=$('page').classList.contains('edit'),ce=ed?' contenteditable="true" spellcheck="false"':'';
  $('sup-t').textContent=S.sup.t;$('sup-d').textContent=S.sup.d;
  [$('sup-t'),$('sup-d')].forEach(function(e){if(ed)e.contentEditable='true';else e.removeAttribute('contenteditable')});
  var ul=$('sup-grid');ul.innerHTML='';
  S.sup.items.forEach(function(it,i){
   var ok=Blocks.parseLink(it.u||'')||'',go=ok&&!ed;
   var li=document.createElement('li');li.className='sup-item'+(ok?' linked':'');li.dataset.id=it.id;li.style.setProperty('--i',i);
   li.innerHTML='<a class="sup-link"'+(go?' href="'+esc(ok)+'" target="_blank" rel="noopener noreferrer" aria-label="Visitar el sitio de '+esc(it.n)+'"':'')+'><div class="slot r43 sup-slot"></div><p class="sup-name" data-sf="n"'+ce+'>'+esc(it.n)+'</p>'+(go?'<span class="sup-go" aria-hidden="true">Visitar sitio ↗</span>':'')+'</a><div class="sup-ed"><button class="btn" type="button" data-sact="url">'+(ok?'Cambiar enlace':'Poner enlace')+'</button><button class="btn" type="button" data-sact="del">Eliminar</button><span class="sup-host">'+esc(ok?hostOf(ok):'sin enlace')+'</span></div>';
   ul.appendChild(li);
   var sl=li.querySelector('.slot'),k='sup-'+it.id;
   sl.innerHTML='<img alt="" src="'+(S.imgs[k]||phSup())+'"><div class="tools"><button class="btn solid" type="button" data-act="chg">Cambiar imagen</button><button class="btn" type="button" data-act="rst">Quitar</button></div>';
   sl.querySelector('img').alt='Logo de '+it.n;sl.dataset.key=k;
  });
  revealSup();
 }
 $('sup').addEventListener('input',function(e){
  if(!ADMIN)return;var el=e.target,f=el.dataset&&el.dataset.sf;
  if(el.id==='sup-t')S.sup.t=el.textContent;
  else if(el.id==='sup-d')S.sup.d=el.textContent;
  else if(f==='n'){var id=el.closest('.sup-item').dataset.id;S.sup.items.forEach(function(x){if(x.id===id)x.n=el.textContent})}
  else return;
  save();
 });
 $('sup').addEventListener('click',function(e){
  var edit=$('page').classList.contains('edit');
  if(!edit&&e.target.closest('a.sup-link[href]')){e.stopPropagation();return} /* el enlace navega; no abre el visor ampliado */
  var b=e.target.closest('[data-sact]');if(!b||!ADMIN)return;
  var li=b.closest('.sup-item'),id=li&&li.dataset.id,a=b.dataset.sact;
  if(a==='add'){S.sup.items.push({id:'p'+Date.now(),n:'Nombre del proveedor',u:''});save();renderSup()}
  if(a==='del'){S.sup.items=S.sup.items.filter(function(x){return x.id!==id});delete S.imgs['sup-'+id];save();renderSup()}
  if(a==='url'){
   var it=S.sup.items.filter(function(x){return x.id===id})[0];if(!it)return;
   var v=prompt('Dirección (URL) o código embed/enlace <a href=…> del sitio al que llevará este recuadro. Vacío = quitar el enlace:',it.u||'https://');
   if(v==null)return;var p=Blocks.parseLink(v==='https://'?'':v);
   if(p===null){$('sup-msg').textContent='Enlace no válido. Debe empezar con https:// (puedes pegar también el código <a href="…"> o <iframe src="…">).';return}
   it.u=p;$('sup-msg').textContent=p?'Enlace guardado.':'Enlace quitado.';save();renderSup();
  }
 });
 new MutationObserver(function(){renderSup();galTexts()}).observe($('page'),{attributes:true,attributeFilter:['class']});

 /* ===== Galería (js/gallery.js) ===== */
 function trySave(){try{localStorage.setItem(KEY,JSON.stringify(S));return true}catch(x){return false}}
 function galTexts(){var ed=$('page').classList.contains('edit');$('gal-t').textContent=S.gal.t;$('gal-d').textContent=S.gal.d;[$('gal-t'),$('gal-d')].forEach(function(e){if(ed)e.contentEditable='true';else e.removeAttribute('contenteditable')})}
 var GAL=Gallery.create({grid:$('gal-grid'),state:S.gal,msg:$('gal-msg'),addBtn:document.querySelector('#gal [data-gact=add]'),
  isEd:function(){return $('page').classList.contains('edit')},isAdmin:function(){return ADMIN},save:trySave,watch:[$('page')]});
 $('gal').addEventListener('input',function(e){
  if(!ADMIN)return;var t=e.target;
  if(t.id==='gal-t')S.gal.t=t.textContent;else if(t.id==='gal-d')S.gal.d=t.textContent;else return;
  save();
 });
 galTexts();

 /* ===== Bloques libres: título, cuadro de texto e imagen (js/blocks.js) ===== */
 if(!S.blocks||!Array.isArray(S.blocks.items))S.blocks={items:[]};
 var BLK=Blocks.create({list:$('blk-list'),bar:$('blk-add'),section:$('blocks'),msg:$('blk-msg'),state:S.blocks,save:trySave,
  isEd:function(){return $('page').classList.contains('edit')},isAdmin:function(){return ADMIN},watch:[$('page')]});

 var bg=document.querySelector('.burger'),m=$('menu');
 bg.addEventListener('click',function(){var o=m.classList.toggle('open');bg.setAttribute('aria-expanded',o)});
 render();
});
