/* Página de servicio: servicio.html?s=ID  (una página por cada servicio de Inicio, incluidos los nuevos).
   Todo es editable en «Modo edición» (PIN de administrador): título, textos, video de introducción,
   imagen, características, galería y logo. Los datos se guardan en este navegador (clave 'servicios-v1'). */
(window.Media&&Media.run||function(f){f()})(function(){
 var $=function(i){return document.getElementById(i)};
 var KEY='servicios-v1',INI='inicio-v1',ADMIN=false,fails=0,lockUntil=0;
 /* HASH = SHA-256 de 'regalia:' + PIN (PIN de ejemplo: 2468) */
 var HASH='9d63b52aa93050f668f72e58e24a38448cb7ac05fb77a7d6b572f7a5655abb94';
 function rd(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}
 var id=(new URLSearchParams(location.search).get('s')||'c0').replace(/[^\w-]/g,'').slice(0,40)||'c0';
 var INIS=rd(INI)||{},card=(INIS.cards||[]).filter(function(c){return c.id===id})[0]||null;
 var ALL=rd(KEY);if(!ALL||typeof ALL!=='object')ALL={};
 ALL.meta=ALL.meta||{};ALL.meta.txt=ALL.meta.txt||{};ALL.pages=ALL.pages||{};

 var SEED={c0:'Diagnosticamos los problemas de los dispositivos móviles como videoconsolas, portátiles, y computadores de sobremesa, sometiendo a pruebas de función en cada uno de sus componentes, y reestructurando las partes donde estén posibles imperfectos, restaurándolos a su estado normal.\n\nPor último, se entregará un informe de diagnóstico y modelo del dispositivo, detallando el modelo y marca del fabricante, tipo de trabajos realizados, nombre del usuario que usa el equipo y observaciones del funcionamiento y problemas que presenta tras las pruebas.'};
 function defs(){return{t:null,d:null,ft:'Características',gt:'Galería',asp:'v',video:null,img:null,
  body:SEED[id]||'Describe aquí este servicio en detalle: qué incluye, cómo se realiza y qué resultado puede esperar el cliente.',
  feats:[1,2,3].map(function(i){return{id:'f'+i,t:'Característica '+i,d:'Describe esta característica del servicio.'}}),
  gal:{items:[1,2,3].map(function(i){return{id:'g'+i,c:''}})},blocks:{items:[]}}}
 var D=ALL.pages[id],df=defs();
 if(!D||typeof D!=='object')D=df;
 Object.keys(df).forEach(function(k){if(D[k]===undefined)D[k]=df[k]});
 if(!D.gal||!Array.isArray(D.gal.items))D.gal=df.gal;
 if(!Array.isArray(D.feats))D.feats=df.feats;
 if(!D.blocks||!Array.isArray(D.blocks.items))D.blocks={items:[]};
 ALL.pages[id]=D;

 function ed(){return document.body.classList.contains('edit')}
 function save(){
  try{localStorage.setItem(KEY,JSON.stringify(ALL));return true}
  catch(e){$('ed-msg').textContent='No se pudo guardar: los archivos pesan demasiado para este navegador.';return false}
 }
 function titleNow(){return D.t!=null?D.t:(card?card.t:(id==='c0'?'Reparación de Equipos':'Nuevo servicio'))}
 function leadNow(){return D.d!=null?D.d:(card?card.d:(id==='c0'?'Diagnóstico y restauración de equipos electrónicos.':''))}
 /* mantiene el título y la descripción corta de la tarjeta de Inicio al día */
 function syncCard(){
  try{var r=rd(INI);if(!r||!r.cards)return;
   r.cards.forEach(function(c){if(c.id===id){if(D.t!=null)c.t=D.t;if(D.d!=null)c.d=D.d}});
   localStorage.setItem(INI,JSON.stringify(r));
  }catch(e){}
 }
 function esc(t){return String(t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

 /* ===== video guardado como archivo en este navegador (IndexedDB) ===== */
 function idb(){return new Promise(function(res,rej){var r=indexedDB.open('regalia-media',1);r.onupgradeneeded=function(){r.result.createObjectStore('v')};r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)}})}
 function vOp(mode,fn){return idb().then(function(db){return new Promise(function(res,rej){var t=db.transaction('v',mode),rq=fn(t.objectStore('v'));t.oncomplete=function(){res(rq&&rq.result)};t.onerror=function(){rej(t.error)}})})}
 var vKey='v-'+id,objUrl=null;

 /* enlace de video: YouTube, Vimeo o archivo .mp4/.webm */
 var parseVideo=Embed.parse;
 function renderMedia(){
  var box=$('s-media'),v=D.video,e=ed(),src=D.img||(INIS.imgs&&INIS.imgs[id])||'';
  box.dataset.asp=D.asp||'v';box.innerHTML='';
  if(objUrl){URL.revokeObjectURL(objUrl);objUrl=null}
  var has=false,inf=null,oldAlt=box.parentNode.querySelector('.emb-alt');if(oldAlt)oldAlt.remove();
  if(v&&v.type==='embed'){
   inf=Embed.render(box,v,{title:'Video de introducción: '+titleNow()});has=true;
  } else if(v&&v.type==='file'){
   var vd=document.createElement('video');vd.controls=true;vd.setAttribute('playsinline','');vd.preload='metadata';vd.src=v.src;box.appendChild(vd);has=true;
  } else if(v&&v.type==='local'){
   has=true;var vd2=document.createElement('video');vd2.controls=true;vd2.setAttribute('playsinline','');box.appendChild(vd2);
   vOp('readonly',function(s){return s.get(vKey)}).then(function(b){if(b){objUrl=URL.createObjectURL(b);vd2.src=objUrl}else{box.innerHTML='<div class="ph">El archivo de video ya no está en este navegador.<br>Vuelve a subirlo o usa un enlace.</div>'}}).catch(function(){});
  } else if(src){
   var im=document.createElement('img');im.src=src;im.alt=titleNow();box.appendChild(im);has=true;
  } else if(e){
   box.innerHTML='<div class="ph"><strong>Espacio para video de introducción</strong><span>Usa «Poner enlace» o «Subir archivo»</span></div>';has=true;
  }
  if(inf&&inf.watch&&!inf.facade)box.parentNode.insertBefore(Embed.altLink(inf.watch),box.nextSibling);
  $('mediacol').hidden=!has;$('hero').classList.toggle('solo',!has);
  $('v-asp').value=D.asp||'v';
 }

 /* ===== textos ===== */
 function setEditable(on){[].forEach.call(document.querySelectorAll('[data-edit]'),function(x){if(on)x.contentEditable='true';else x.removeAttribute('contenteditable')})}
 function applyLogo(){
  var logo=ALL.meta.logo||INIS.logo,im=$('logo-img'),dfl=$('logo-def');
  if(logo){im.src=logo;im.hidden=false;dfl.style.display='none'}else{im.hidden=true;dfl.style.display=''}
  var showName=ALL.meta.logoText!==undefined?ALL.meta.logoText!==false:INIS.logoText!==false;
  $('brand-name').hidden=!showName;$('logo-txt').checked=showName;
 }
 function renderTexts(){
  var T={t:titleNow(),d:leadNow(),body:D.body,ft:D.ft,gt:D.gt,hr1:ALL.meta.txt.hr1,hr2:ALL.meta.txt.hr2};
  [].forEach.call(document.querySelectorAll('[data-edit]'),function(x){var v=T[x.dataset.edit];if(v!=null)x.textContent=v});
  document.title=titleNow()+' – Taller Regalia Setups';
  $('s-cta').href='contacto.html?servicio='+encodeURIComponent(titleNow());
  applyLogo();setEditable(ed());
 }
 document.addEventListener('input',function(e){
  if(!ADMIN)return;var el=e.target,k=el.dataset&&el.dataset.edit;
  if(k){
   var v=k==='body'?el.innerText:el.textContent;
   if(k==='hr1'||k==='hr2')ALL.meta.txt[k]=v;else D[k]=v;
   if(k==='t'||k==='d')syncCard();
   if(k==='t'){$('s-cta').href='contacto.html?servicio='+encodeURIComponent(titleNow());document.title=titleNow()+' – Taller Regalia Setups'}
   save();return;
  }
  var f=el.dataset&&el.dataset.ff;
  if(f){var fid=el.closest('.feat').dataset.id;D.feats.forEach(function(x){if(x.id===fid)x[f]=el.textContent});save()}
 });

 /* ===== características ===== */
 function renderFeats(){
  var ce=ed()?' contenteditable="true" spellcheck="false"':'',ul=$('feats');
  ul.innerHTML=D.feats.map(function(f){
   return '<li class="feat" data-id="'+esc(f.id)+'"><span class="chk" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></span><div class="fb"><h3 data-ff="t"'+ce+'>'+esc(f.t)+'</h3><p data-ff="d"'+ce+'>'+esc(f.d)+'</p></div><div class="feat-ed"><button class="btn" type="button" data-fa="left" aria-label="Mover antes">←</button><button class="btn" type="button" data-fa="right" aria-label="Mover después">→</button><button class="btn" type="button" data-fa="del">Eliminar</button></div></li>';
  }).join('');
 }
 $('feats').addEventListener('click',function(e){
  var b=e.target.closest('[data-fa]');if(!b||!ADMIN)return;
  var fid=b.closest('.feat').dataset.id,a=b.dataset.fa,L=D.feats,i=L.map(function(x){return x.id}).indexOf(fid);
  if(a==='del'&&i>-1)L.splice(i,1);
  if(a==='left'&&i>0)L.splice(i-1,0,L.splice(i,1)[0]);
  if(a==='right'&&i>-1&&i<L.length-1)L.splice(i+1,0,L.splice(i,1)[0]);
  save();renderFeats();
 });
 $('f-add').onclick=function(){if(!ADMIN)return;D.feats.push({id:'f'+Date.now().toString(36),t:'Nueva característica',d:'Describe esta característica del servicio.'});save();renderFeats()};

 /* ===== video e imagen (edición) ===== */
 function vmsg(t){$('v-msg').textContent=t}
 $('v-link').onclick=function(){
  if(!ADMIN)return;
  var v=prompt('Pega el enlace de YouTube o Vimeo, o la dirección de un archivo de video (https://… o videos/intro.mp4):');
  if(v==null)return;var p=parseVideo(v);
  if(!p){vmsg('Enlace no válido. Usa YouTube, Vimeo o un archivo .mp4/.webm con https:// o una ruta como videos/intro.mp4.');return}
  if(D.video&&D.video.type==='local')vOp('readwrite',function(s){return s.delete(vKey)}).catch(function(){});
  D.video=p;save();renderMedia();vmsg('Video aplicado.');
 };
 $('v-file').onclick=function(){if(ADMIN)$('file-vid').click()};
 $('file-vid').addEventListener('change',function(){
  var f=this.files[0];this.value='';if(!ADMIN||!f)return;
  if(f.size>300*1048576){vmsg('El archivo pesa más de 300 MB. Súbelo a la carpeta videos/ del sitio y usa «Poner enlace».');return}
  vOp('readwrite',function(s){return s.put(f,vKey)}).then(function(){
   D.video={type:'local'};save();renderMedia();
   vmsg('Video guardado solo en este navegador ('+(f.size/1048576).toFixed(1)+' MB). Para publicarlo, súbelo a videos/ y usa «Poner enlace».');
  }).catch(function(){vmsg('No se pudo guardar el archivo en este navegador.')});
 });
 $('v-rst').onclick=function(){
  if(!ADMIN)return;
  if(D.video&&D.video.type==='local')vOp('readwrite',function(s){return s.delete(vKey)}).catch(function(){});
  D.video=null;save();renderMedia();vmsg('Video quitado.');
 };
 $('v-asp').onchange=function(){if(!ADMIN){this.value=D.asp||'v';return}D.asp=this.value;save();renderMedia()};
 $('i-chg').onclick=function(){if(ADMIN)$('file-img').click()};
 $('file-img').addEventListener('change',function(){
  var f=this.files[0];this.value='';if(!ADMIN||!f)return;
  Gallery.toData(f,1400).then(function(d){if(d){D.img=d;save();renderMedia();vmsg('Imagen aplicada (se muestra cuando no hay video).')}});
 });
 $('i-rst').onclick=function(){if(!ADMIN)return;D.img=null;save();renderMedia()};

 /* ===== logo ===== */
 $('logo-chg').onclick=function(){if(ADMIN)$('file-logo').click()};
 $('logo-rst').onclick=function(){if(!ADMIN)return;delete ALL.meta.logo;delete ALL.meta.logoText;save();applyLogo()};
 $('logo-txt').onchange=function(){if(!ADMIN){applyLogo();return}ALL.meta.logoText=this.checked;save();applyLogo()};
 $('file-logo').addEventListener('change',function(){
  var f=this.files[0];this.value='';if(!ADMIN||!f)return;
  var u=URL.createObjectURL(f),im=new Image();
  im.onload=function(){
   var k=Math.min(1,480/Math.max(im.width,im.height)),c=document.createElement('canvas');
   c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));
   c.getContext('2d').drawImage(im,0,0,c.width,c.height);
   ALL.meta.logo=c.toDataURL('image/png');URL.revokeObjectURL(u);save();applyLogo();
  };
  im.onerror=function(){URL.revokeObjectURL(u)};im.src=u;
 });

 /* ===== galería ===== */
 Gallery.create({grid:$('gal-grid'),state:D.gal,msg:$('gal-msg'),addBtn:$('g-add'),isEd:ed,isAdmin:function(){return ADMIN},save:save,watch:[document.body]});

 /* ===== bloques libres al final de la página: título, texto, imagen o video (js/blocks.js) ===== */
 Blocks.create({list:$('blk-list'),bar:$('blk-add'),section:$('blocks'),msg:$('blk-msg'),state:D.blocks,save:save,isEd:ed,isAdmin:function(){return ADMIN},watch:[document.body]});

 /* ===== acceso admin (oculto + PIN) ===== */
 function sha(s){return crypto.subtle.digest('SHA-256',new TextEncoder().encode('regalia:'+s)).then(function(b){return [].map.call(new Uint8Array(b),function(x){return('0'+x.toString(16)).slice(-2)}).join('')})}
 function reveal(){$('toggle').hidden=false}
 /* Mostrar el botón: #admin en la URL, Ctrl+Mayús+E, o 5 clics rápidos en el logo */
 if(location.hash==='#admin')reveal();
 window.addEventListener('hashchange',function(){if(location.hash==='#admin')reveal()});
 document.addEventListener('keydown',function(e){
  if(e.ctrlKey&&e.shiftKey&&(e.key==='E'||e.key==='e')){e.preventDefault();reveal();$('toggle').focus()}
  if(e.key==='Escape')closePin();
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
  this.textContent=on?'Terminar edición':'Modo edición';
  if(!on){ADMIN=false;this.hidden=true;AdminPin.sessionEnd()}
 };
 new MutationObserver(function(){setEditable(ed());renderFeats();renderMedia()}).observe(document.body,{attributes:true,attributeFilter:['class']});

 var bg=document.querySelector('.burger'),m=$('menu');
 bg.addEventListener('click',function(){var o=m.classList.toggle('open');bg.setAttribute('aria-expanded',o)});
 renderTexts();renderFeats();renderMedia();
});
