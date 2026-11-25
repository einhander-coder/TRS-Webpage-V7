/* ====== CONFIGURA AQUÍ ======
   Heyzine: en tu panel abre el flipbook → Share → "Web / Embed" y copia el enlace
   (https://heyzine.com/flip-book/XXXXXXXX.html) o el código <iframe ...> completo.
   Puedes pegar cualquiera de los dos entre las comillas.
   También sirven FlippingBook, Issuu, Yumpu o un dominio propio de Heyzine.
   Si lo dejas vacío, se muestra el libro de muestra. */
var FLIPBOOK_EMBED = "";

/* Prueba rápida sin editar el código: plenario.html?flip=https://heyzine.com/flip-book/XXXX.html
   (solo se aceptan estos sitios por seguridad) */
var FLIP_HOSTS = ['heyzine.com','flippingbook.com','issuu.com','yumpu.com','fliphtml5.com'];

function flipSrc(raw, strict){
 raw = (raw || '').trim();
 var m = raw.match(/<iframe[^>]*\ssrc\s*=\s*["']([^"']+)["']/i);
 if (m) raw = m[1];
 if (raw.indexOf('//') === 0) raw = 'https:' + raw;
 try {
  var u = new URL(raw);
  if (u.protocol !== 'https:') return '';
  if (strict && !FLIP_HOSTS.some(function(h){return u.hostname === h || u.hostname.slice(-h.length-1) === '.' + h})) return '';
  return u.href;
 } catch (e) { return ''; }
}

(window.Media&&Media.run||function(f){f()})(function(){
 var $=function(i){return document.getElementById(i)};
 var KEY='plenario-v1',ADMIN=false,fails=0,lockUntil=0,flip=null;
 /* HASH = SHA-256 de 'regalia:' + PIN (PIN de ejemplo: 2468) */
 var HASH='9d63b52aa93050f668f72e58e24a38448cb7ac05fb77a7d6b572f7a5655abb94';
 var S={txt:{},logoText:true};
 try{var raw=localStorage.getItem(KEY);if(raw){var p0=JSON.parse(raw);if(p0&&typeof p0==='object')S=p0}}catch(e){}
 S.txt=S.txt||{};
 var stage=$('stage'),viewer=$('viewer'),note=$('note');
 function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){$('ed-msg').textContent='No se pudo guardar: el archivo es muy pesado para este navegador.'}}

 /* ===== Flipbook: enlace externo (Heyzine…) o libro de muestra ===== */
 function mount(){
  stage.innerHTML='';flip=null;$('thumbs').innerHTML='';$('thumbs').classList.remove('on');
  viewer.classList.remove('zoomed','embedded');$('b-thumbs').setAttribute('aria-pressed','false');
  var SRC=flipSrc(new URLSearchParams(location.search).get('flip'),true)||flipSrc(S.flip,false)||flipSrc(FLIPBOOK_EMBED,false);
  $('tb').hidden=!!SRC; /* con embed, el servicio trae sus propios controles: no se duplican */
  if(SRC){
   viewer.classList.add('embedded');
   var box=document.createElement('div');box.className='embed';box.style.minHeight='440px';
   var fr=document.createElement('iframe');
   fr.src=SRC;fr.title='Listado de valores (flipbook)';fr.loading='lazy';fr.allowFullscreen=true;
   fr.setAttribute('allow','fullscreen; clipboard-write');fr.setAttribute('scrolling','no');
   box.appendChild(fr);stage.appendChild(box);note.textContent='';
   return;
  }
  stage.innerHTML=$('demo').innerHTML;
  var pages=[].slice.call(stage.querySelectorAll('.pg'));
  if(window.St&&St.PageFlip){
   var w=Math.min(stage.clientWidth/2,480);
   flip=new St.PageFlip(stage,{width:Math.round(w),height:Math.round(w*1.35),size:'stretch',minWidth:240,maxWidth:640,minHeight:320,maxHeight:900,
    showCover:true,usePortrait:true,mobileScrollSupport:false,maxShadowOpacity:.4});
   flip.loadFromHTML(pages);
   var t=$('thumbs'),names=['Portada','Reparación','Mantención','Setups','Consultoría','Cierre'];
   names.forEach(function(n,i){var b=document.createElement('button');b.type='button';b.textContent=n;b.onclick=function(){flip.flip(i)};t.appendChild(b)});
   flip.on('flip',function(e){[].forEach.call(t.children,function(b,i){b.setAttribute('aria-current',i===e.data)})});
   note.textContent='Vista de muestra. Arrastra una esquina o toca una página para girarla.';
  } else {
   note.textContent='No se pudo cargar el flipbook de muestra. Usa FLIPBOOK_EMBED.';
  }
 }
 $('b-thumbs').onclick=function(){var on=$('thumbs').classList.toggle('on');this.setAttribute('aria-pressed',on)};
 $('b-zoom').onclick=function(){
  var z=viewer.classList.toggle('zoomed');this.setAttribute('aria-pressed',z);
  if(flip)setTimeout(function(){flip.update()},250);
 };
 $('b-full').onclick=function(){
  if(document.fullscreenElement){document.exitFullscreen()}
  else if(viewer.requestFullscreen){viewer.requestFullscreen()}
 };
 document.addEventListener('fullscreenchange',function(){if(flip)setTimeout(function(){flip.update()},250)});

 /* ===== Textos y logo editables ===== */
 function applyLogo(){
  var im=$('logo-img'),df=$('logo-def');
  if(S.logo){im.src=S.logo;im.hidden=false;df.style.display='none'}else{im.hidden=true;df.style.display=''}
  $('brand-name').hidden=(S.logoText===false);$('logo-txt').checked=(S.logoText!==false);
 }
 function setEditable(on){
  [].forEach.call(document.querySelectorAll('[data-edit]'),function(e){if(on)e.contentEditable='true';else e.removeAttribute('contenteditable')});
 }
 function renderTexts(){
  [].forEach.call(document.querySelectorAll('[data-edit]'),function(e){var v=S.txt[e.dataset.edit];if(v!=null)e.textContent=v});
  applyLogo();setEditable(document.body.classList.contains('edit'));
 }
 document.addEventListener('input',function(e){
  if(!ADMIN)return;var el=e.target;
  if(el.dataset&&el.dataset.edit){S.txt[el.dataset.edit]=el.textContent;save()}
 });
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
  im.onerror=function(){URL.revokeObjectURL(u)};
  im.src=u;
 });
 $('flip-set').onclick=function(){
  if(!ADMIN)return;
  var v=prompt('Pega el enlace de Heyzine (https://heyzine.com/flip-book/…) o el código <iframe>:');
  if(v==null)return;
  var s=flipSrc(v,false);
  if(!s){$('ed-msg').textContent='Enlace no válido. Debe empezar con https://';return}
  S.flip=s;save();mount();$('ed-msg').textContent='Flipbook actualizado.';
 };
 $('flip-rst').onclick=function(){if(!ADMIN)return;delete S.flip;save();mount();$('ed-msg').textContent='Flipbook restaurado.'};

 /* ===== Acceso admin (oculto + PIN) ===== */
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
  this.textContent=on?'Terminar edición':'Modo edición';setEditable(on);
  if(!on){ADMIN=false;this.hidden=true;AdminPin.sessionEnd()}
 };

 /* menú móvil */
 var bg=document.querySelector('.burger'),m=$('menu');
 bg.addEventListener('click',function(){var o=m.classList.toggle('open');bg.setAttribute('aria-expanded',o)});

 renderTexts();mount();
});
