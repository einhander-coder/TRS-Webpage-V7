/* PIN de administrador: verificación y cambio (se carga antes que los scripts de las páginas).
   AdminPin.verify(pin) → Promise<boolean> · AdminPin.openChange() abre el cuadro «Cambiar PIN».
   El PIN se guarda como huella SHA-256 (nunca en texto). Un PIN cambiado desde el modo edición se guarda en ESTE
   navegador. Para que valga también en el sitio publicado y en otros dispositivos hay que copiar la huella nueva
   (el cuadro la muestra al terminar) en DEFAULT_HASH, aquí abajo, y volver a publicar. */
(function(){
 'use strict';
 var KEY='admin-pin-v1',LOGO='img/logo-empresa.png';
 /* PIN de ejemplo: 2468. Para cambiarlo para todo el sitio: pega aquí la huella que muestra «Cambiar PIN». */
 var DEFAULT_HASH='9d63b52aa93050f668f72e58e24a38448cb7ac05fb77a7d6b572f7a5655abb94';
 function hex(buf){return [].map.call(new Uint8Array(buf),function(x){return('0'+x.toString(16)).slice(-2)}).join('')}
 function sha(s){return crypto.subtle.digest('SHA-256',new TextEncoder().encode('regalia:'+s)).then(hex)}
 function stored(){try{var r=JSON.parse(localStorage.getItem(KEY));if(r&&/^[a-f0-9]{64}$/.test(r.h))return r.h}catch(e){}return null}
 function current(){return stored()||DEFAULT_HASH}
 function verify(pin){
  if(!window.crypto||!crypto.subtle)return Promise.resolve(false);
  return sha(String(pin)).then(function(h){return h===current()});
 }


 /* ----- sesión de administrador -----
    Tras ingresar el PIN una vez, la sesión queda activa en ESTA pestaña del navegador (sessionStorage): al cambiar de
    página o de servicio el modo edición continúa sin pedir el PIN otra vez. Termina con «Terminar edición», al cerrar la
    pestaña, a las 4 horas sin actividad, o si el PIN se cambia en otra parte. */
 var SKEY='admin-session-v1',TTL=4*3600*1000;
 function tag(){return current().slice(0,16)}
 function sessionStart(){try{sessionStorage.setItem(SKEY,JSON.stringify({h:tag(),exp:Date.now()+TTL}))}catch(e){}}
 function sessionEnd(){try{sessionStorage.removeItem(SKEY)}catch(e){}}
 function sessionActive(){
  try{
   var r=JSON.parse(sessionStorage.getItem(SKEY));
   if(!r||r.h!==tag()||!(r.exp>Date.now())){if(r)sessionEnd();return false}
   sessionStart();return true; /* renueva el plazo mientras se usa */
  }catch(e){return false}
 }

 /* ----- cuadro «Cambiar PIN» ----- */
 var box=null,fails=0,lockUntil=0,opener=null;
 function $(i){return document.getElementById(i)}
 function build(){
  if(box)return;
  box=document.createElement('div');box.className='dlg';box.id='pinchg';
  box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-labelledby','pc-t');box.setAttribute('aria-describedby','pc-d');
  box.innerHTML='<form class="pinbox" id="pcf" autocomplete="off">'+
   '<img class="pin-logo" src="'+LOGO+'" alt="Taller Regalia &amp; Setups">'+
   '<h3 id="pc-t">Cambiar PIN de administrador</h3>'+
   '<p class="pin-d" id="pc-d">Ingresa tu PIN actual y elige uno nuevo de 4 dígitos.</p>'+
   '<div class="pc-fields" id="pc-fields" style="width:100%;display:grid;gap:.7rem">'+
   '<label class="pin-l">PIN actual<span class="pin-f"><input id="pc-old" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="••••"></span></label>'+
   '<label class="pin-l">Nuevo PIN (4 dígitos)<span class="pin-f"><input id="pc-new" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="••••"></span></label>'+
   '<label class="pin-l">Repite el nuevo PIN<span class="pin-f"><input id="pc-rep" type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="••••"></span></label>'+
   '<label class="pc-show"><input type="checkbox" id="pc-eye"> Mostrar los PIN</label></div>'+
   '<p id="pc-e" role="alert"></p>'+
   '<div class="pc-done" id="pc-done" hidden></div>'+
   '<div class="bar" id="pc-bar"><button class="pin-btn primary" type="submit" id="pc-save">Guardar PIN</button><button class="pin-btn" type="button" id="pc-x">Cancelar</button></div>'+
   '<p class="pin-foot">Acceso restringido · Taller Regalia &amp; Setups</p></form>';
  document.body.appendChild(box);
  var img=box.querySelector('.pin-logo');img.addEventListener('error',function(){img.hidden=true});
  ['pc-old','pc-new','pc-rep'].forEach(function(id){$(id).addEventListener('input',function(){this.value=this.value.replace(/\D/g,'').slice(0,4)})});
  $('pc-eye').addEventListener('change',function(){['pc-old','pc-new','pc-rep'].forEach(function(id){$(id).type=$('pc-eye').checked?'text':'password'})});
  $('pc-x').addEventListener('click',close);
  box.addEventListener('click',function(e){if(e.target===box)close()});
  $('pcf').addEventListener('submit',submit);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&box.classList.contains('on')){e.stopPropagation();close()}},true);
 }
 function err(t){var e=$('pc-e');e.textContent=t;var f=$('pcf');f.classList.remove('shake');void f.offsetWidth;f.classList.add('shake')}
 function reset(){
  ['pc-old','pc-new','pc-rep'].forEach(function(id){var i=$(id);i.value='';i.type='password'});
  $('pc-eye').checked=false;$('pc-e').textContent='';
  $('pc-fields').hidden=false;$('pc-bar').hidden=false;$('pc-done').hidden=true;$('pc-done').innerHTML='';
  $('pc-t').textContent='Cambiar PIN de administrador';
  $('pc-d').textContent='Ingresa tu PIN actual y elige uno nuevo de 4 dígitos.';
 }
 function open(){
  build();reset();opener=document.activeElement;box.classList.add('on');$('pc-old').focus();
 }
 function close(){if(!box)return;box.classList.remove('on');reset();if(opener&&opener.focus)opener.focus()}
 function done(hash){
  $('pc-t').textContent='PIN actualizado';
  $('pc-d').textContent='Desde ahora, en este navegador, el acceso de administrador usa tu PIN nuevo.';
  $('pc-fields').hidden=true;$('pc-bar').hidden=true;$('pc-e').textContent='';
  var d=$('pc-done');d.hidden=false;
  d.innerHTML='<p class="pc-note">Para que el PIN nuevo también valga en el sitio publicado y en otros dispositivos, copia esta huella en <b>DEFAULT_HASH</b> del archivo <b>js/pin.js</b> y vuelve a publicar:</p>'+
   '<code class="pc-hash" id="pc-hash"></code>'+
   '<div class="bar" style="justify-content:center"><button class="pin-btn" type="button" id="pc-copy">Copiar huella</button><button class="pin-btn primary" type="button" id="pc-ok">Listo</button></div>';
  $('pc-hash').textContent=hash;
  $('pc-ok').addEventListener('click',close);$('pc-ok').focus();
  $('pc-copy').addEventListener('click',function(){
   var b=this;function ok(){b.textContent='Copiada ✓'}
   function manual(){b.textContent='Selecciona el texto y cópialo';var r=document.createRange();r.selectNodeContents($('pc-hash'));var sel=getSelection();sel.removeAllRanges();sel.addRange(r)}
   if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(hash).then(ok,manual);else manual();
  });
 }
 function submit(e){
  e.preventDefault();
  var o=$('pc-old').value,n=$('pc-new').value,r=$('pc-rep').value,now=Date.now();
  if(!/^\d{4}$/.test(o))return err('Escribe tu PIN actual de 4 dígitos.');
  if(!/^\d{4}$/.test(n))return err('El PIN nuevo debe tener exactamente 4 dígitos.');
  if(n!==r)return err('Los dos PIN nuevos no coinciden.');
  if(n===o)return err('El PIN nuevo debe ser distinto del actual.');
  if(now<lockUntil)return err('Demasiados intentos. Espera '+Math.ceil((lockUntil-now)/1000)+' s.');
  if(!window.crypto||!crypto.subtle)return err('Este navegador no permite verificar el PIN.');
  verify(o).then(function(ok){
   if(!ok){
    fails++;$('pc-old').value='';$('pc-old').focus();
    if(fails>=3){lockUntil=Date.now()+30000*fails;return err('PIN actual incorrecto. Acceso bloqueado temporalmente.')}
    return err('El PIN actual es incorrecto.');
   }
   fails=0;
   var had=sessionActive(); /* ¿había sesión con el PIN actual? */
   return sha(n).then(function(h){
    try{localStorage.setItem(KEY,JSON.stringify({h:h,t:Date.now()}))}catch(x){return err('No se pudo guardar el PIN en este navegador.')}
    if(had)sessionStart(); /* la sesión actual sigue valiendo con el PIN nuevo */
    done(h);
   });
  });
 }
 window.AdminPin={verify:verify,openChange:open,hash:current,sessionStart:sessionStart,sessionEnd:sessionEnd,sessionActive:sessionActive};
})();
