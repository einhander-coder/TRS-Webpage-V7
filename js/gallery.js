/* Galería de imágenes reutilizable (Trabajo y páginas de servicio).
   Gallery.create({grid, state:{items:[{id,c,src}]}, save:fn→bool, isEd:fn, isAdmin:fn, addBtn, msg, watch:[elementos]})
   - Visitantes: clic en una imagen = visor ampliado con flechas, teclado y descripción.
   - Modo edición (solo admin): agregar varias imágenes, cambiar/quitar, mover, eliminar y escribir la descripción.
   GIF y WebP animados se guardan tal cual (hasta 25 MB); el resto se reduce a 1200 px. */
(function(){
 'use strict';
 var FULL='No se pudo guardar: las imágenes pesan demasiado para este navegador. Quita alguna o súbelas a la carpeta img/ del sitio.';
 var HELP='Puedes subir varias imágenes a la vez. Se reducen a 1200 px; los GIF y WebP animados se guardan tal cual (hasta 25 MB).';
 function toast(t,err){if(window.Media&&Media.toast)Media.toast(t,err)}
 function afterSaved(f){(window.Media&&Media.saved||function(x){x()})(f)}
 function uid(){return 'g'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
 function ph(n){
  var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#26343a"/><rect y="170" width="400" height="130" fill="#101a18"/><circle cx="200" cy="105" r="40" fill="none" stroke="#f2c200" stroke-width="9" stroke-dasharray="13 8"/><circle cx="200" cy="105" r="15" fill="#f2c200"/><text x="200" y="215" fill="#6fd3c6" font-family="sans-serif" font-size="18" text-anchor="middle">Imagen '+n+'</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
 }
 function toData(f,max){
  return new Promise(function(res){
   if(/^image\/(gif|webp)$/.test(f.type)&&f.size<=25*1048576){var r=new FileReader();r.onload=function(){res(r.result)};r.onerror=function(){res(null)};r.readAsDataURL(f);return}
   var u=URL.createObjectURL(f),im=new Image();
   im.onload=function(){
    var k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));
    c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);
    /* PNG/WebP/SVG con fondo transparente se guardan como PNG (si no, el fondo se vería negro) */
    var png=false;
    if(/^image\/(png|webp|svg\+xml)$/.test(f.type)){try{var dd=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(var p=3;p<dd.length;p+=64){if(dd[p]<250){png=true;break}}}catch(e){}}
    res(png?c.toDataURL('image/png'):c.toDataURL('image/jpeg',.84));
   };
   im.onerror=function(){URL.revokeObjectURL(u);res(null)};im.src=u;
  });
 }
 /* visor ampliado (uno solo por página) */
 var box=null,list=[],cur=0;
 function viewer(){
  if(box)return box;
  box=document.createElement('div');box.className='glb';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Imagen ampliada');
  box.innerHTML='<button class="gbtn solid gclose" type="button">Cerrar</button><button class="gbtn gprev" type="button" aria-label="Imagen anterior">‹</button><img alt=""><button class="gbtn gnext" type="button" aria-label="Imagen siguiente">›</button><p class="gcap"></p>';
  document.body.appendChild(box);
  box.addEventListener('click',function(e){
   if(e.target===box||e.target.classList.contains('gclose'))box.classList.remove('on');
   if(e.target.classList.contains('gprev'))step(-1);
   if(e.target.classList.contains('gnext'))step(1);
  });
  document.addEventListener('keydown',function(e){
   if(!box.classList.contains('on'))return;
   if(e.key==='Escape')box.classList.remove('on');
   if(e.key==='ArrowLeft')step(-1);if(e.key==='ArrowRight')step(1);
  });
  return box;
 }
 function show(){var it=list[cur],b=viewer();b.querySelector('img').src=it.src;b.querySelector('img').alt=it.c||'';b.querySelector('.gcap').textContent=it.c||'';b.classList.add('on');b.querySelector('.gnext').focus()}
 function step(d){if(list.length){cur=(cur+d+list.length)%list.length;show()}}

 function create(cfg){
  var st=cfg.state,grid=cfg.grid,max=cfg.max||1200;
  function ed(){return !!cfg.isEd()}
  function adm(){return !!cfg.isAdmin()}
  function note(t){if(cfg.msg)cfg.msg.textContent=t}
  function persist(){var ok=cfg.save();note(ok?HELP:FULL);if(!ok)toast(FULL,true);return ok}
  function report(good,bad,ok){
   var m=[];
   if(good&&ok)m.push(good+(good===1?' imagen guardada.':' imágenes guardadas.'));
   if(bad.length)m.push('No se pudo leer: '+bad.slice(0,3).join(', ')+(bad.length>3?'…':'')+'. Usa archivos JPG, PNG, WebP o GIF.');
   if(m.length){note(m.join(' '));afterSaved(function(){toast(m.join(' '),!!bad.length&&!good)})}
  }
  function idx(id){for(var i=0;i<st.items.length;i++)if(st.items[i].id===id)return i;return -1}
  var one=document.createElement('input'),many=document.createElement('input'),pend=null;
  [one,many].forEach(function(i){i.type='file';i.accept='image/*';i.hidden=true;document.body.appendChild(i)});
  many.multiple=true;

  function render(){
   var e=ed();grid.classList.toggle('editing',e);grid.innerHTML='';
   if(!st.items.length){grid.innerHTML='<li class="gal-empty">Aún no hay imágenes en la galería.</li>';return}
   st.items.forEach(function(it,i){
    var li=document.createElement('li');li.className='gal-item';li.dataset.id=it.id;
    li.innerHTML='<div class="gal-img"><img alt=""><div class="gtools"><button class="gbtn solid" type="button" data-g="chg">Cambiar imagen</button><button class="gbtn" type="button" data-g="rst">Quitar</button></div></div><p class="gal-cap" data-gc'+(e?' contenteditable="true" spellcheck="false"':'')+'></p><div class="gal-ed"><button class="gbtn" type="button" data-g="left" aria-label="Mover a la izquierda">←</button><button class="gbtn" type="button" data-g="right" aria-label="Mover a la derecha">→</button><button class="gbtn" type="button" data-g="del">Eliminar</button></div>';
    var im=li.querySelector('img');im.src=it.src||ph(i+1);im.alt=it.c||('Imagen '+(i+1));if(!it.src)im.dataset.empty='1';
    li.querySelector('.gal-cap').textContent=it.c||'';
    grid.appendChild(li);
   });
  }
  grid.addEventListener('click',function(ev){
   var li=ev.target.closest('.gal-item');if(!li)return;
   var i=idx(li.dataset.id),b=ev.target.closest('[data-g]');if(i<0)return;
   if(!b){
    if(!ed()&&ev.target.tagName==='IMG'&&st.items[i].src){
     list=st.items.filter(function(x){return x.src});cur=list.indexOf(st.items[i]);show();
    }
    return;
   }
   if(!adm())return;
   var a=b.dataset.g,it=st.items[i];
   if(a==='chg'){pend=it.id;one.click();return}
   if(a==='rst')delete it.src;
   if(a==='del')st.items.splice(i,1);
   if(a==='left'&&i>0)st.items.splice(i-1,0,st.items.splice(i,1)[0]);
   if(a==='right'&&i<st.items.length-1)st.items.splice(i+1,0,st.items.splice(i,1)[0]);
   persist();render();
  });
  grid.addEventListener('input',function(ev){
   if(!adm())return;var el=ev.target;if(!el.hasAttribute||!el.hasAttribute('data-gc'))return;
   var i=idx(el.closest('.gal-item').dataset.id);if(i>-1){st.items[i].c=el.textContent;cfg.save()}
  });
  grid.addEventListener('keydown',function(ev){if(ev.key==='Enter'&&ev.target.hasAttribute&&ev.target.hasAttribute('data-gc')){ev.preventDefault();ev.target.blur()}});
  one.addEventListener('change',function(){
   var f=one.files[0];one.value='';if(!adm()||!f||pend==null)return;
   var id=pend;pend=null;
   toData(f,max).then(function(d){var i=idx(id);if(d&&i>-1){st.items[i].src=d;var ok=persist();render();report(1,[],ok)}else if(!d)report(0,[f.name],true)});
  });
  many.addEventListener('change',function(){
   var fs=[].slice.call(many.files);many.value='';if(!adm()||!fs.length)return;
   var good=0,bad=[];
   fs.reduce(function(p,f){return p.then(function(){return toData(f,max).then(function(d){if(d){st.items.push({id:uid(),c:'',src:d});good++}else bad.push(f.name)})})},Promise.resolve()).then(function(){var ok=good?persist():true;render();report(good,bad,ok)});
  });
  if(cfg.addBtn)cfg.addBtn.addEventListener('click',function(){if(adm())many.click()});
  if(cfg.watch&&window.MutationObserver){
   var mo=new MutationObserver(render);
   cfg.watch.forEach(function(el){if(el)mo.observe(el,{attributes:true,attributeFilter:['class']})});
  }
  note(HELP);render();
  return {render:render};
 }
 window.Gallery={create:create,toData:toData,placeholder:ph};
})();
