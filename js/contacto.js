/* Página de contacto
   1) Envío directo: el mensaje escrito en el formulario se envía al correo del consultor TI (DESTINO) sin abrir Gmail,
      y se muestra una ventana de confirmación. Si el envío falla, se ofrece reintentar o abrirlo en Gmail.
   2) Modo edición (PIN de administrador): textos, logo, mapa y bloques libres, igual que en las demás páginas. */
var DESTINO = "taller.regaliasetups@gmail.com";                    /* cuenta que recibe los mensajes */
var ENDPOINT = "https://formsubmit.co/ajax/" + DESTINO;            /* servicio que entrega el mensaje por correo */

(window.Media&&Media.run||function(f){f()})(function(){
 var $=function(i){return document.getElementById(i)};
 var KEY='contacto-v1',ADMIN=false,fails=0,lockUntil=0;
 /* HASH = SHA-256 de 'regalia:' + PIN (PIN de ejemplo: 2468) */
 var HASH='9d63b52aa93050f668f72e58e24a38448cb7ac05fb77a7d6b572f7a5655abb94';
 var S={txt:{},blocks:{items:[]}};
 try{var r0=JSON.parse(localStorage.getItem(KEY));if(r0&&typeof r0==='object')S=r0}catch(e){}
 S.txt=S.txt||{};if(!S.blocks||!Array.isArray(S.blocks.items))S.blocks={items:[]};
 function ed(){return document.body.classList.contains('edit')}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(S));return true}catch(e){$('ed-msg').textContent='No se pudo guardar: el archivo pesa demasiado para este navegador.';return false}}

 /* ================= ENVÍO DEL MENSAJE ================= */
 var sv=(new URLSearchParams(location.search).get('servicio')||'').trim().slice(0,120);
 if(sv&&!$('msg').value)$('msg').value='Hola, quiero consultar por el servicio: '+sv+'.\n';
 function check(){
  var ok=true,r=[['nombre',$('nombre').value.trim(),'Escribe tu nombre.'],
   ['correo',/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('correo').value.trim()),'Escribe un correo válido.'],
   ['msg',$('msg').value.trim(),'Escribe tu mensaje.']];
  r.forEach(function(x){var bad=!x[1],el=$(x[0]);el.setAttribute('aria-invalid',bad);$('e-'+x[0]).textContent=bad?x[2]:'';if(bad)ok=false});
  var t=$('tel').value.trim(),tb=t&&!/^[+\d][\d\s().-]{6,}$/.test(t);
  $('tel').setAttribute('aria-invalid',!!tb);$('e-tel').textContent=tb?'Revisa el teléfono.':'';
  if(!ok)for(var i=0;i<r.length;i++)if(!r[i][1]){$(r[i][0]).focus();break}
  return ok&&!tb;
 }
 function values(){return{nombre:$('nombre').value.trim(),correo:$('correo').value.trim(),tel:$('tel').value.trim(),msg:$('msg').value.trim()}}
 function subject(v){return 'Consulta de '+v.nombre+' — Taller Regalia & Setups'}
 function gmailUrl(v){
  var body='Nombre: '+v.nombre+'\nCorreo: '+v.correo+'\nTeléfono: '+(v.tel||'(no indicado)')+'\n\n'+v.msg;
  return 'https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(DESTINO)+'&su='+encodeURIComponent(subject(v))+'&body='+encodeURIComponent(body);
 }
 var lastValues=null,opener=null;
 function dlg(kind,title,desc,v,why){
  var box=$('sentbox');box.classList.toggle('err',kind==='err');
  $('sent-ic').innerHTML=kind==='ok'
   ?'<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>'
   :'<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v6M12 17h.01"/></svg>';
  $('sent-t').textContent=title;$('sent-d').textContent=desc;
  var rows=kind==='ok'?[['Nombre',v.nombre],['Correo',v.correo],['Teléfono',v.tel||'(no indicado)'],['Enviado a',DESTINO]]:[];
  var dl=$('sent-sum');dl.innerHTML='';
  rows.forEach(function(x){var dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=x[0];dd.textContent=x[1];dl.appendChild(dt);dl.appendChild(dd)});
  $('sent-retry').hidden=$('sent-gmail').hidden=(kind==='ok');
  opener=$('send');$('sent').classList.add('on');$('sent-ok').focus();
 }
 function closeSent(){$('sent').classList.remove('on');if(opener&&opener.focus)opener.focus()}
 $('sent-ok').onclick=closeSent;
 $('sent').addEventListener('click',function(e){if(e.target===this)closeSent()});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&$('sent').classList.contains('on')){e.stopPropagation();closeSent()}},true);
 $('sent-gmail').onclick=function(){if(lastValues)window.open(gmailUrl(lastValues),'_blank','noopener')};
 $('sent-retry').onclick=function(){closeSent();send()};
 function busy(on){var b=$('send');b.disabled=on;b.textContent=on?'Enviando…':'Enviar mensaje';$('f').setAttribute('aria-busy',on)}
 function sent(v){
  $('f').reset();['nombre','correo','tel','msg'].forEach(function(k){$(k).removeAttribute('aria-invalid');$('e-'+k).textContent=''});
  $('status').textContent='Mensaje enviado al correo del consultor TI.';
  dlg('ok','¡Mensaje enviado!','Tu mensaje fue enviado a la cuenta de correo del consultor TI de Taller Regalia & Setups. Te responderemos al correo que indicaste.',v);
 }
 function failed(v,detail){
  var act=/activ/i.test(detail||'');
  $('status').textContent='No se pudo enviar el mensaje.';
  dlg('err','No se pudo enviar el mensaje',
   act?'El envío automático todavía no está activado en este sitio. Tus datos siguen en el formulario: puedes enviarlo desde tu cuenta de Gmail.'
      :'Hubo un problema al enviar tu mensaje (sin conexión o servicio no disponible). Tus datos siguen en el formulario: puedes reintentar o enviarlo desde tu cuenta de Gmail.',v);
 }
 function send(){
  if(!check())return;
  if($('hp').value){$('f').reset();return}  /* trampa anti-spam: los humanos no ven este campo */
  var v=values();lastValues=v;busy(true);$('status').textContent='Enviando…';
  var payload={name:v.nombre,email:v.correo,phone:v.tel||'(no indicado)',message:v.msg,_subject:subject(v),_template:'table',_captcha:'false'};
  if(sv)payload.servicio=sv;
  var ctl=window.AbortController?new AbortController():null,tm=setTimeout(function(){if(ctl)ctl.abort()},15000);
  fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload),signal:ctl?ctl.signal:undefined})
   .then(function(r){return r.json().catch(function(){return{}}).then(function(j){return{ok:r.ok,j:j}})})
   .then(function(res){var good=res.ok&&res.j&&(res.j.success===true||res.j.success==='true');if(good)sent(v);else failed(v,res.j&&res.j.message)})
   .catch(function(){failed(v)})
   .then(function(){clearTimeout(tm);busy(false)});
 }
 $('f').addEventListener('submit',function(e){e.preventDefault();send()});

 /* ================= TEXTOS, MAPA Y TELÉFONO ================= */
 function setEditable(on){[].forEach.call(document.querySelectorAll('[data-edit]'),function(x){if(on)x.contentEditable='true';else x.removeAttribute('contenteditable')})}
 function mapUrl(raw){
  raw=(raw||'').trim();if(!raw)return '';
  var m=raw.match(/<iframe[^>]*\ssrc\s*=\s*["']([^"']+)["']/i);if(m)raw=m[1];
  if(/^https:\/\/(www\.|maps\.)?google\.[a-z.]+\/maps[^\s"'<>]*$/i.test(raw))return raw;
  if(/^https?:\/\//i.test(raw))return null;
  return 'https://www.google.com/maps?q='+encodeURIComponent(raw)+'&output=embed';
 }
 function applyMap(){
  var addr=($('map-addr')||{}).textContent||'';
  var addrEl=document.querySelector('[data-edit=addr]');addr=addrEl?addrEl.textContent:addr;
  var src=S.mapSrc||('https://www.google.com/maps?q='+encodeURIComponent(addr)+'&output=embed');
  var f=$('map-frame');if(f.getAttribute('src')!==src)f.setAttribute('src',src);
  $('maps-link').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(addr);
 }
 function applyTel(){
  var t=document.querySelector('[data-edit=phone]').textContent,d=t.replace(/[^\d+]/g,''),a=$('tel-link');
  if(!ed()&&d)a.href='tel:'+d;else a.removeAttribute('href');
 }
 function applyLogo(){
  var im=$('logo-img'),df=$('logo-def');
  if(S.logo){im.src=S.logo;im.hidden=false;df.style.display='none'}else{im.hidden=true;df.style.display=''}
  var showName=S.logoText!==false;$('brand-name').hidden=!showName;$('logo-txt').checked=showName;
 }
 function renderTexts(){
  [].forEach.call(document.querySelectorAll('[data-edit]'),function(x){var v=S.txt[x.dataset.edit];if(v!=null)x.textContent=v});
  applyMap();applyTel();applyLogo();setEditable(ed());
 }
 document.addEventListener('input',function(e){
  if(!ADMIN)return;var el=e.target,k=el.dataset&&el.dataset.edit;if(!k)return;
  S.txt[k]=el.textContent;if(k==='phone')applyTel();save();
 });
 document.addEventListener('focusout',function(e){if(e.target.dataset&&e.target.dataset.edit==='addr')applyMap()});
 $('map-set').onclick=function(){
  if(!ADMIN)return;
  var v=prompt('Pega el código «Insertar un mapa» de Google Maps (iframe) o escribe una dirección. Vacío = usar la dirección de arriba:',S.mapSrc||'');
  if(v==null)return;var u=mapUrl(v);
  if(u===null){$('ed-msg').textContent='Enlace no válido. Usa el código iframe de Google Maps o escribe una dirección.';return}
  if(u)S.mapSrc=u;else delete S.mapSrc;
  save();applyMap();$('ed-msg').textContent=u?'Mapa actualizado.':'El mapa sigue la dirección escrita.';
 };
 $('map-rst').onclick=function(){if(!ADMIN)return;delete S.mapSrc;save();applyMap();$('ed-msg').textContent='El mapa sigue la dirección escrita.'};

 /* ================= LOGO ================= */
 $('logo-chg').onclick=function(){if(ADMIN)$('file-logo').click()};
 $('logo-rst').onclick=function(){if(!ADMIN)return;delete S.logo;S.logoText=true;save();applyLogo()};
 $('logo-txt').onchange=function(){if(!ADMIN){applyLogo();return}S.logoText=this.checked;save();applyLogo()};
 $('file-logo').addEventListener('change',function(){
  var f=this.files[0];this.value='';if(!ADMIN||!f)return;
  var u=URL.createObjectURL(f),im=new Image();
  im.onload=function(){
   var k=Math.min(1,480/Math.max(im.width,im.height)),c=document.createElement('canvas');
   c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));
   c.getContext('2d').drawImage(im,0,0,c.width,c.height);
   S.logo=c.toDataURL('image/png');URL.revokeObjectURL(u);save();applyLogo();
  };
  im.onerror=function(){URL.revokeObjectURL(u)};im.src=u;
 });

 /* ================= BLOQUES LIBRES (js/blocks.js) ================= */
 Blocks.create({list:$('blk-list'),bar:$('blk-add'),section:$('blocks'),msg:$('blk-msg'),state:S.blocks,save:save,isEd:ed,isAdmin:function(){return ADMIN},watch:[document.body]});

 /* ================= ACCESO ADMIN (oculto + PIN) ================= */
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
 new MutationObserver(function(){setEditable(ed());applyTel()}).observe(document.body,{attributes:true,attributeFilter:['class']});

 var bg=document.querySelector('.burger'),m=$('menu');
 bg.addEventListener('click',function(){var o=m.classList.toggle('open');bg.setAttribute('aria-expanded',o)});
 renderTexts();
});
