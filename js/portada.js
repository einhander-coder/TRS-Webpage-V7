/* Portada (cover): se abre con UN clic en el logo del menú, en cualquier página.
   Izquierda: video de introducción · Derecha: logo de marketing y un texto corto.
   - Un solo clic abre la portada tras una breve espera; varios clics rápidos NO la abren, así que los
     5 clics rápidos que muestran el botón «Modo edición» siguen funcionando igual.
   - En «Modo edición» (PIN de administrador) la portada se puede editar: textos, video y logo.
   - También se abre con la dirección …#portada. Datos guardados en este navegador (clave 'portada-v1'). */
(window.Media&&Media.run||function(f){f()})(function(){
 'use strict';
 var KEY='portada-v1',IMG='img/logo-marketing.png',WAIT=650;
 var DEF={lines:{name:'Taller Regalia & Setups',tag:'Servicio Técnico de Mantenimiento y Ensamblaje de Equipos',addr:'Villa del Rey Ocho 1442',tel:'+56939591449',city:'Valdivia, Chile'}};
 var S;try{var r=JSON.parse(localStorage.getItem(KEY));S=(r&&typeof r==='object')?r:{}}catch(e){S={}}
 S.lines=Object.assign({},DEF.lines,S.lines||{});if(S.auto==null)S.auto=true;if(S.video===undefined)S.video=null;if(S.logo===undefined)S.logo=null;
 var FALLBACK='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#1c171b"/><circle cx="24" cy="24" r="19" fill="none" stroke="#f2c200" stroke-width="3" stroke-dasharray="3 2"/><circle cx="24" cy="24" r="11" fill="#f2c200"/><circle cx="24" cy="24" r="4" fill="#141012"/></svg>');
 function $(i){return document.getElementById(i)}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(S));return true}catch(e){msg('No se pudo guardar: el archivo pesa demasiado para este navegador.');return false}}
 function isEd(){var pg=document.getElementById('page');return document.body.classList.contains('edit')||!!(pg&&pg.classList.contains('edit'))}
 function esc(t){return String(t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

 /* ----- video guardado como archivo en este navegador (IndexedDB) ----- */
 function idb(){return new Promise(function(res,rej){var q=indexedDB.open('regalia-media',1);q.onupgradeneeded=function(){q.result.createObjectStore('v')};q.onsuccess=function(){res(q.result)};q.onerror=function(){rej(q.error)}})}
 function vOp(mode,fn){return idb().then(function(db){return new Promise(function(res,rej){var t=db.transaction('v',mode),rq=fn(t.objectStore('v'));t.oncomplete=function(){res(rq&&rq.result)};t.onerror=function(){rej(t.error)}})})}
 var VK='portada-video',objUrl=null;
 var parseVideo=Embed.parse;

 /* ----- estructura (se crea una vez) ----- */
 var cv=document.createElement('div');cv.className='portada';cv.id='portada';cv.setAttribute('role','dialog');cv.setAttribute('aria-modal','true');cv.setAttribute('aria-label','Portada de Taller Regalia & Setups');
 cv.innerHTML='<button class="gbtn solid cv-close" type="button">Cerrar ✕</button>'+
  '<div class="cv-grid"><div class="cv-video" id="cv-video"></div>'+
  '<div class="cv-info"><img class="cv-logo" id="cv-logo" alt="Logo de Taller Regalia &amp; Setups">'+
  '<div class="cv-text"><p class="cv-name" data-cv="name"></p><p class="cv-tag" data-cv="tag"></p><p data-cv="addr"></p><p><a class="cv-tel" id="cv-tel" data-cv="tel"></a></p><p data-cv="city"></p></div>'+
  '<button class="gbtn solid cv-enter" type="button">Entrar al sitio</button></div></div>'+
  '<div class="cv-ed" role="group" aria-label="Edición de la portada"><strong>Portada:</strong>'+
  '<button class="gbtn solid" type="button" data-cva="vlink">Video: poner enlace</button><button class="gbtn" type="button" data-cva="vfile">Subir archivo</button><button class="gbtn" type="button" data-cva="vrst">Quitar video</button>'+
  '<label><input type="checkbox" id="cv-auto"> Reproducir sin sonido al abrir</label>'+
  '<button class="gbtn solid" type="button" data-cva="lchg">Cambiar logo</button><button class="gbtn" type="button" data-cva="lrst">Restaurar logo</button>'+
  '<span class="cv-msg" id="cv-msg" role="status"></span></div>';
 document.body.appendChild(cv);
 var fv=document.createElement('input'),fl=document.createElement('input');
 fv.type='file';fv.accept='video/*';fl.type='file';fl.accept='image/*';fv.hidden=fl.hidden=true;document.body.appendChild(fv);document.body.appendChild(fl);
 function msg(t){var m=$('cv-msg');if(m)m.textContent=t}

 var openState=false,lastFocus=null;
 function renderText(){
  var ed=isEd();cv.classList.toggle('editing',ed);
  [].forEach.call(cv.querySelectorAll('[data-cv]'),function(el){
   var k=el.dataset.cv;el.textContent=S.lines[k]||'';
   if(ed)el.contentEditable='true';else el.removeAttribute('contenteditable');
  });
  var tel=$('cv-tel'),d=String(S.lines.tel||'').replace(/[^\d+]/g,'');
  if(!ed&&d)tel.href='tel:'+d;else tel.removeAttribute('href');
  var lg=$('cv-logo');lg.onerror=function(){lg.onerror=null;lg.src=FALLBACK};lg.src=S.logo||IMG;
  $('cv-auto').checked=!!S.auto;
 }
 function renderVideo(){
  var box=$('cv-video'),v=S.video,ed=isEd();
  if(objUrl){URL.revokeObjectURL(objUrl);objUrl=null}
  box.innerHTML='';if(!openState)return;
  function media(el){box.appendChild(el)}
  if(v&&v.type==='embed'){
   var inf=Embed.render(box,v,{title:'Video de introducción',auto:!!S.auto});
   if(inf.watch&&!inf.facade){var al=Embed.altLink(inf.watch);al.className+=' emb-alt-cv';box.appendChild(al)}
  } else if(v&&(v.type==='file'||v.type==='local')){
   var vd=document.createElement('video');vd.controls=true;vd.setAttribute('playsinline','');vd.preload='metadata';
   if(S.auto){vd.muted=true;vd.autoplay=true;vd.loop=true}
   media(vd);
   if(v.type==='file')vd.src=v.src;
   else vOp('readonly',function(s){return s.get(VK)}).then(function(b){if(b){objUrl=URL.createObjectURL(b);vd.src=objUrl}else{box.innerHTML='<div class="cv-ph"><strong>El archivo de video ya no está en este navegador.</strong><span>Vuelve a subirlo o usa un enlace.</span></div>'}}).catch(function(){});
  } else {
   box.innerHTML='<div class="cv-ph"><svg viewBox="0 0 24 24" width="56" height="56" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg><strong>Video de introducción</strong><span>'+(ed?'Usa «Video: poner enlace» o «Subir archivo»':'Próximamente')+'</span></div>';
  }
 }
 function openCover(){
  if(openState)return;openState=true;lastFocus=document.activeElement;
  renderText();renderVideo();cv.classList.add('on');document.body.style.overflow='hidden';
  cv.querySelector('.cv-close').focus();
 }
 function closeCover(){
  if(!openState)return;openState=false;cv.classList.remove('on');renderVideo();document.body.style.overflow='';
  if(location.hash==='#portada'&&history.replaceState)history.replaceState(null,'',location.pathname+location.search);
  if(lastFocus&&lastFocus.focus)lastFocus.focus();
 }
 cv.addEventListener('click',function(e){
  if(e.target.closest('.cv-close')||e.target.closest('.cv-enter'))closeCover();
  var b=e.target.closest('[data-cva]');if(!b||!isEd())return;
  var a=b.dataset.cva;
  if(a==='vlink'){
   var v=prompt('Pega el enlace de YouTube o Vimeo, o la dirección de un archivo de video (https://… o videos/intro.mp4):');
   if(v==null)return;var p=parseVideo(v);
   if(!p){msg('Enlace no válido. Usa YouTube, Vimeo o un archivo .mp4/.webm con https:// o una ruta como videos/intro.mp4.');return}
   if(S.video&&S.video.type==='local')vOp('readwrite',function(s){return s.delete(VK)}).catch(function(){});
   S.video=p;save();renderVideo();msg('Video aplicado.');
  }
  if(a==='vfile')fv.click();
  if(a==='vrst'){if(S.video&&S.video.type==='local')vOp('readwrite',function(s){return s.delete(VK)}).catch(function(){});S.video=null;save();renderVideo();msg('Video quitado.')}
  if(a==='lchg')fl.click();
  if(a==='lrst'){S.logo=null;save();renderText();msg('Logo restaurado.')}
 });
 cv.addEventListener('input',function(e){
  if(!isEd())return;var el=e.target;
  if(el.dataset&&el.dataset.cv){S.lines[el.dataset.cv]=el.textContent;save()}
 });
 cv.addEventListener('change',function(e){if(e.target.id==='cv-auto'){if(!isEd()){e.target.checked=!!S.auto;return}S.auto=e.target.checked;save();renderVideo()}});
 fv.addEventListener('change',function(){
  var f=fv.files[0];fv.value='';if(!isEd()||!f)return;
  if(f.size>300*1048576){msg('El archivo pesa más de 300 MB. Súbelo a la carpeta videos/ del sitio y usa «Poner enlace».');return}
  vOp('readwrite',function(s){return s.put(f,VK)}).then(function(){S.video={type:'local'};save();renderVideo();msg('Video guardado solo en este navegador ('+(f.size/1048576).toFixed(1)+' MB). Para publicarlo, súbelo a videos/ y usa «Poner enlace».')}).catch(function(){msg('No se pudo guardar el archivo en este navegador.')});
 });
 fl.addEventListener('change',function(){
  var f=fl.files[0];fl.value='';if(!isEd()||!f)return;
  var u=URL.createObjectURL(f),im=new Image();
  im.onload=function(){
   var k=Math.min(1,800/Math.max(im.width,im.height)),c=document.createElement('canvas');
   c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));
   c.getContext('2d').drawImage(im,0,0,c.width,c.height);
   S.logo=c.toDataURL('image/png');URL.revokeObjectURL(u);if(save()){renderText();msg('Logo actualizado.')}
  };
  im.onerror=function(){URL.revokeObjectURL(u)};im.src=u;
 });
 document.addEventListener('keydown',function(e){
  if(!openState)return;
  if(e.key==='Escape'){e.stopPropagation();closeCover();return}
  if(e.key==='Tab'){ /* mantiene el foco dentro de la portada */
   var f=[].filter.call(cv.querySelectorAll('button,a[href],input:not([hidden]),[contenteditable="true"]'),function(x){return x.offsetParent!==null});
   if(!f.length)return;var a=f[0],z=f[f.length-1];
   if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}
   else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}
  }
 },true);
 cv.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.cv){e.preventDefault();e.target.blur()}});

 /* ----- un clic en el logo = abrir; varios clics rápidos = no abrir (modo admin intacto) ----- */
 var brand=document.querySelector('.brand'),n=0,tm;
 if(brand)brand.addEventListener('click',function(e){
  e.preventDefault();n++;clearTimeout(tm);
  tm=setTimeout(function(){var single=(n===1);n=0;if(single)openCover()},WAIT);
 });
 function hash(){if(location.hash==='#portada')openCover()}
 window.addEventListener('hashchange',hash);hash();
 /* si cambia el modo edición con la portada abierta, se actualizan las herramientas */
 if(window.MutationObserver){
  var mo=new MutationObserver(function(){if(openState){renderText();renderVideo()}});
  mo.observe(document.body,{attributes:true,attributeFilter:['class']});
  var pg=document.getElementById('page');if(pg)mo.observe(pg,{attributes:true,attributeFilter:['class']});
 }
});
