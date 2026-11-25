/* Interfaz corporativa del modo edición (se carga en las páginas con edición).
   La barra de administración es la ÚNICA pestaña con los controles de edición:
   - Acceso (tras mostrar el botón oculto): logo, «Acceso administrador», «Entrar al modo edición» y «Cerrar».
   - Edición activa: logo, «Modo edición», «Ver portada» y «Terminar edición».
   El botón #toggle de cada página sigue existiendo como mecanismo interno, pero ya no se muestra (sin duplicados).
   Diálogo del PIN: mostrar/ocultar PIN y aviso visual cuando el PIN es incorrecto. */
(function(){
 'use strict';
 var LOGO='img/logo-empresa.png';
 function $(i){return document.getElementById(i)}
 function isEd(){var pg=$('page');return document.body.classList.contains('edit')||!!(pg&&pg.classList.contains('edit'))}
 var toggle=$('toggle');
 function revealed(){return !!toggle&&!toggle.hidden}

 function guard(img){
  if(img.complete&&!img.naturalWidth)img.hidden=true;
  img.addEventListener('error',function(){img.hidden=true});
 }
 [].forEach.call(document.querySelectorAll('.pin-logo'),guard);

 var bar=document.createElement('div');
 bar.className='adminbar';bar.id='adminbar';bar.hidden=true;
 bar.setAttribute('role','region');bar.setAttribute('aria-label','Barra de administración');
 bar.innerHTML='<img class="ab-logo" src="'+LOGO+'" alt="Taller Regalia &amp; Setups">'+
  '<span class="ab-badge"><span class="ab-dot" aria-hidden="true"></span><span id="ab-state">Acceso administrador</span></span>'+
  '<span class="ab-hint" id="ab-hint"></span>'+
  '<span class="ab-sp"></span>'+
  '<button class="ab-btn" type="button" data-ab="pin">Cambiar PIN</button>'+
  '<button class="ab-btn on-edit" type="button" data-ab="cover">Ver portada</button>'+
  '<button class="ab-btn on-edit" type="button" data-ab="publish" title="Descargar los cambios para publicarlos en el sitio">Publicar</button>'+
  '<button class="ab-btn primary on-edit" type="button" data-ab="exit">Terminar edición</button>'+
  '<button class="ab-btn primary off-edit" type="button" data-ab="enter">Entrar al modo edición</button>'+
  '<button class="ab-btn off-edit" type="button" data-ab="close" aria-label="Ocultar la barra de administración">Cerrar</button>';
 document.body.insertBefore(bar,document.body.firstChild);
 guard(bar.querySelector('.ab-logo'));
 bar.addEventListener('click',function(e){
  var b=e.target.closest('[data-ab]');if(!b)return;
  var a=b.dataset.ab;
  if((a==='enter'||a==='exit')&&toggle)toggle.click();
  if(a==='close'&&toggle){toggle.hidden=true;sync()}
  if(a==='pin'&&window.AdminPin)AdminPin.openChange();
  if(a==='publish'&&window.Publish)Publish.open();
  if(a==='cover'){
   if(location.hash==='#portada'&&history.replaceState)history.replaceState(null,'',location.pathname+location.search);
   location.hash='portada';
  }
 });
 var HINT_EDIT='Haz clic en un texto para editarlo y usa los botones para cambiar imágenes · los cambios se guardan en este navegador · la sesión sigue activa al cambiar de página',
     HINT_ACCESS='Ingresa tu PIN para activar el modo edición';
 function sync(){
  var on=isEd(),show=on||revealed(),root=document.documentElement;
  bar.hidden=!show;bar.classList.toggle('is-edit',on);
  root.classList.toggle('is-editing',on);root.classList.toggle('has-adminbar',show);
  $('ab-state').textContent=on?'Modo edición':'Acceso administrador';
  $('ab-hint').textContent=on?HINT_EDIT:HINT_ACCESS;
 }
 if(window.MutationObserver){
  var mo=new MutationObserver(sync);
  mo.observe(document.body,{attributes:true,attributeFilter:['class']});
  var pg=$('page');if(pg)mo.observe(pg,{attributes:true,attributeFilter:['class']});
  if(toggle)mo.observe(toggle,{attributes:true,attributeFilter:['hidden']});
 }
 sync();
 /* Sesión confirmada: al abrir otra página de este sitio el modo edición se reactiva solo (sin pedir el PIN).
    Se ejecuta después de que los scripts de la página hayan preparado su botón interno. */
 function autoStart(tries){
  if(!toggle||!window.AdminPin||!AdminPin.sessionActive()||isEd())return;
  /* se espera a que el script de la página haya preparado su botón interno (hasta ~4 s) */
  if(!toggle.onclick){if((tries||0)<80)setTimeout(function(){autoStart((tries||0)+1)},50);return}
  toggle.hidden=false;toggle.click();
 }
 setTimeout(autoStart,0);

 /* Ctrl+Mayús+E muestra la barra: el foco pasa a «Entrar al modo edición» */
 document.addEventListener('keydown',function(e){
  if(e.ctrlKey&&e.shiftKey&&(e.key==='E'||e.key==='e'))setTimeout(function(){var b=bar.querySelector('[data-ab="enter"]');if(!bar.hidden&&b&&b.offsetParent)b.focus()},80);
 });

 /* enlace «Cambiar PIN» dentro del diálogo de acceso */
 var pfoot=document.querySelector('#pinf .pin-foot');
 if(pfoot){
  var lk=document.createElement('button');lk.type='button';lk.className='pin-link';lk.id='pin-chg';lk.textContent='Cambiar PIN';
  pfoot.parentNode.insertBefore(lk,pfoot);
  lk.addEventListener('click',function(){var x=document.getElementById('pin-x');if(x)x.click();if(window.AdminPin)AdminPin.openChange()});
 }

 /* diálogo del PIN */
 var pi=$('pin-i'),eye=$('pin-eye'),pe=$('pin-e'),pf=$('pinf'),dlg=$('pin');
 if(eye&&pi)eye.addEventListener('click',function(){
  var show=pi.type==='password';
  pi.type=show?'text':'password';eye.setAttribute('aria-pressed',String(show));
  eye.setAttribute('aria-label',show?'Ocultar PIN':'Mostrar PIN');pi.focus();
 });
 if(pe&&pf&&window.MutationObserver)new MutationObserver(function(){
  if(pe.textContent){pf.classList.remove('shake');void pf.offsetWidth;pf.classList.add('shake')}
 }).observe(pe,{childList:true,characterData:true,subtree:true});
 if(dlg&&pi&&window.MutationObserver)new MutationObserver(function(){
  if(!dlg.classList.contains('on')){pi.type='password';if(eye)eye.setAttribute('aria-pressed','false')}
 }).observe(dlg,{attributes:true,attributeFilter:['class']});
})();
