/* Bloques libres (título, cuadro de texto, imagen y video) reutilizables.
   Blocks.create({list, bar, section, msg, state:{items:[…]}, save:fn→bool, isEd:fn, isAdmin:fn, watch:[el]})
   Blocks.parseLink(texto)  → URL https válida, '' (vacío) o null (no válido). Acepta una URL o un código embed/enlace
                              (<a href="…">, <iframe src="…">) del que se extrae la dirección.
   Blocks.parseVideo(texto) → {type:'embed'|'file', src} (YouTube, Vimeo o archivo .mp4/.webm) o null.
   Los visitantes solo ven el contenido; en «Modo edición» (PIN de administrador) se agregan, mueven y editan los bloques.
   Los videos subidos como archivo se guardan en este navegador (IndexedDB, clave 'blk-<id>'). */
(function(){
 'use strict';
 var FULL='No se pudo guardar: los archivos pesan demasiado para este navegador. Quita alguno o súbelos a la carpeta img/ o videos/ del sitio.';
 var DEF={title:'Nuevo título',text:'Escribe aquí tu texto.'};
 var PH='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#1e1e1e"/><rect x="120" y="60" width="160" height="110" rx="8" fill="none" stroke="#6fd3c6" stroke-width="6" stroke-dasharray="12 9"/><text x="200" y="125" fill="#6fd3c6" font-family="sans-serif" font-size="24" text-anchor="middle">Imagen</text></svg>');
 function toast(t,err){if(window.Media&&Media.toast)Media.toast(t,err)}
 function uid(){return 'b'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)}
 function parseLink(raw){
  raw=(raw||'').trim();if(!raw)return '';
  var m=raw.match(/\b(?:href|src)\s*=\s*["']([^"']+)["']/i);if(m)raw=m[1];
  if(raw.indexOf('//')===0)raw='https:'+raw;
  return /^https:\/\/[^\s"'<>]+$/i.test(raw)?raw:null;
 }
 var parseVideo=window.Embed?Embed.parse:function(){return null};
 var SP=[['0','Ninguno'],['0.5','Mínimo'],['1','Pequeño'],['1.4','Normal'],['2','Grande'],['3','Muy grande'],['4','Amplio'],['6','Extra']];
 var WD=[['12','Completo'],['9','3/4'],['8','2/3'],['6','Mitad'],['4','1/3'],['3','1/4']];
 var VA=[['t','Arriba'],['c','Centro'],['b','Abajo']];
 function opts(list,cur){return list.map(function(o){return '<option value="'+o[0]+'"'+(String(cur)===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')}
 function layoutVars(li,b){var w=[12,9,8,6,4,3].indexOf(+b.w)>-1?+b.w:12;li.style.setProperty('--span',w);li.style.setProperty('--mt',(b.mt!=null?+b.mt:0)+'rem');li.style.setProperty('--mb',(b.mb!=null?+b.mb:1.4)+'rem');li.dataset.va=b.va||'t'}
 function host(u){try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return ''}}

 /* videos subidos como archivo (IndexedDB) */
 function idb(){return new Promise(function(res,rej){var q=indexedDB.open('regalia-media',1);q.onupgradeneeded=function(){q.result.createObjectStore('v')};q.onsuccess=function(){res(q.result)};q.onerror=function(){rej(q.error)}})}
 function vOp(mode,fn){return idb().then(function(db){return new Promise(function(res,rej){var t=db.transaction('v',mode),rq=fn(t.objectStore('v'));t.oncomplete=function(){res(rq&&rq.result)};t.onerror=function(){rej(t.error)}})})}
 function dropLocal(b){if(b&&b.v&&b.v.type==='local')vOp('readwrite',function(s){return s.delete('blk-'+b.id)}).catch(function(){})}

 function create(cfg){
  var st=cfg.state,list=cfg.list,pend=null,pendV=null,urls=[],layOpen={};
  function LAY(b){return '<details class="blk-lay" data-lay'+(layOpen[b.id]?' open':'')+'><summary>Diseño y espacios</summary><div class="blk-layrow"><label class="blk-fmt">Ancho <select data-bsel="w">'+opts(WD,b.w||12)+'</select></label><label class="blk-fmt">Espacio arriba <select data-bsel="mt">'+opts(SP,b.mt!=null?b.mt:0)+'</select></label><label class="blk-fmt">Espacio abajo <select data-bsel="mb">'+opts(SP,b.mb!=null?b.mb:1.4)+'</select></label><label class="blk-fmt">Posición vertical <select data-bsel="va">'+opts(VA,b.va||'t')+'</select></label></div><p class="blk-laynote">Con «Mitad», «1/3»… dos bloques quedan lado a lado (por ejemplo texto e imagen); usa ↑ ↓ para decidir cuál va a la izquierda.</p></details>'}
  function ed(){return !!cfg.isEd()}
  function adm(){return !!cfg.isAdmin()}
  function note(t){if(cfg.msg)cfg.msg.textContent=t||''}
  function persist(){var ok=cfg.save();note(ok?'':FULL);if(!ok)toast(FULL,true);return ok}
  function idx(id){for(var i=0;i<st.items.length;i++)if(st.items[i].id===id)return i;return -1}
  function shown(b){return b.type==='image'?!!b.src:b.type==='video'?!!b.v:true}
  var file=document.createElement('input'),fileV=document.createElement('input');
  file.type='file';file.accept='image/*';fileV.type='file';fileV.accept='video/*';file.hidden=fileV.hidden=true;
  document.body.appendChild(file);document.body.appendChild(fileV);

  function mediaInto(box,b,e){
   var v=b.v,info=null;
   if(v&&v.type==='embed'){
    info=window.Embed?Embed.render(box,v,{title:'Video'}):null;
   } else if(v&&v.type==='file'){
    var d=document.createElement('video');d.controls=true;d.setAttribute('playsinline','');d.preload='metadata';d.src=v.src;box.appendChild(d);
   } else if(v&&v.type==='local'){
    var d2=document.createElement('video');d2.controls=true;d2.setAttribute('playsinline','');box.appendChild(d2);
    vOp('readonly',function(s){return s.get('blk-'+b.id)}).then(function(bl){
     if(bl){var u=URL.createObjectURL(bl);urls.push(u);d2.src=u}
     else box.innerHTML='<div class="blk-ph"><strong>El archivo de video ya no está en este navegador.</strong><span>Vuelve a subirlo o usa un enlace.</span></div>';
    }).catch(function(){});
   } else if(e){
    box.innerHTML='<div class="blk-ph"><strong>Espacio para video</strong><span>Usa «Poner enlace» o «Subir archivo»</span></div>';
   }
   return info;
  }

  function render(){
   var e=ed();list.classList.toggle('editing',e);
   if(cfg.bar)cfg.bar.hidden=!e;
   if(cfg.section)cfg.section.hidden=!e&&!st.items.some(shown);
   urls.forEach(function(u){URL.revokeObjectURL(u)});urls=[];
   list.innerHTML='';
   if(!st.items.length&&e){list.innerHTML='<li class="blk-empty">Aquí puedes agregar títulos, cuadros de texto, imágenes y videos. Aparecerán al final de la página, encima del pie de página.</li>';return}
   st.items.forEach(function(b){
    if(!e&&!shown(b))return;
    var li=document.createElement('li');li.className='blk b-'+b.type;li.dataset.id=b.id;li.dataset.al=b.al||((b.type==='image'||b.type==='video')?'c':'l');layoutVars(li,b);
    var main,u='';
    if(b.type==='title'){main=document.createElement('h2');main.className='blk-title';main.textContent=b.text||''}
    else if(b.type==='text'){main=document.createElement('div');main.className='blk-text';main.dataset.box=(b.box===false?'0':'1');main.textContent=b.text||'';if(b.rich&&window.RichText)RichText.setHTML(main,b.rich);main.setAttribute('data-rich','')}
    else if(b.type==='hl'){
     u=parseLink(b.u||'')||'';
     main=document.createElement('p');main.className='blk-hl';
     var ht=document.createElement(u&&!e?'a':'mark');ht.className='hl';ht.textContent=b.text||'';
     if(u&&!e){ht.href=u;ht.target='_blank';ht.rel='noopener noreferrer'}
     if(e){ht.contentEditable='true';ht.spellcheck=false;ht.setAttribute('data-bf','text')}
     main.appendChild(ht);
    }
    else if(b.type==='split'){
     u=parseLink(b.u||'')||'';
     main=document.createElement('div');main.className='blk-split';main.dataset.side=(b.side==='l'?'l':'r');main.dataset.box=(b.box===true?'1':'0');
     if(!b.src&&!e)main.classList.add('no-img');
     var tx=document.createElement('div');tx.className='sp-text';
     var hh=document.createElement('h3');hh.className='sp-title';hh.textContent=b.title||'';hh.setAttribute('data-bf','title');
     var bd=document.createElement('div');bd.className='sp-body';bd.textContent=b.text||'';if(b.rich&&window.RichText)RichText.setHTML(bd,b.rich);bd.setAttribute('data-bf','text');bd.setAttribute('data-rich','');
     if(e){hh.contentEditable='true';bd.contentEditable='true';hh.spellcheck=false;bd.spellcheck=false}
     tx.appendChild(hh);tx.appendChild(bd);main.appendChild(tx);
     if(b.src||e){
      var fg=document.createElement('figure');fg.className='sp-fig';
      var im2=document.createElement('img');im2.alt=b.c||'';im2.src=b.src||PH;
      if(u&&!e){var a2=document.createElement('a');a2.className='blk-a';a2.href=u;a2.target='_blank';a2.rel='noopener noreferrer';a2.appendChild(im2);fg.appendChild(a2)}else fg.appendChild(im2);
      var fc2=document.createElement('figcaption');fc2.textContent=b.c||'';fc2.setAttribute('data-bf','c');
      if(e){fc2.contentEditable='true';fc2.spellcheck=false}
      fg.appendChild(fc2);main.appendChild(fg);
     }
    }
    else{
     main=document.createElement('figure');main.className='blk-fig';
     if(b.type==='image'){
      u=parseLink(b.u||'')||'';
      var im=document.createElement('img');im.alt=b.c||'';im.src=b.src||PH;
      if(u&&!e){var a=document.createElement('a');a.className='blk-a';a.href=u;a.target='_blank';a.rel='noopener noreferrer';a.appendChild(im);main.appendChild(a)}else main.appendChild(im);
     } else {
      main.className+=' blk-vid';
      var box=document.createElement('div');box.className='blk-media';box.dataset.asp=b.asp||'h';var inf=mediaInto(box,b,e);main.appendChild(box);if(inf&&inf.watch&&!inf.facade&&window.Embed)main.appendChild(Embed.altLink(inf.watch));
     }
     var fc=document.createElement('figcaption');fc.textContent=b.c||'';fc.setAttribute('data-bf','c');
     if(e){fc.contentEditable='true';fc.spellcheck=false}
     main.appendChild(fc);
    }
    if(b.type==='title'||b.type==='text'){main.setAttribute('data-bf','text');if(e){main.contentEditable='true';main.spellcheck=false}}
    li.appendChild(main);
    if(e){
     var c=document.createElement('div');c.className='blk-ed';
     var extra='';
     var AL='<label class="blk-fmt">Alinear <select data-bsel="al"><option value="l">Izquierda</option><option value="c">Centro</option><option value="r">Derecha</option></select></label>';
     var BOX='<label class="blk-fmt"><input type="checkbox" data-bchk="box"> Caja</label>';
     var IMGC='<button class="gbtn solid" type="button" data-ba="img">Cambiar imagen</button><button class="gbtn" type="button" data-ba="url">'+(u?'Cambiar enlace':'Poner enlace')+'</button><span class="blk-host"></span>';
     if(b.type==='title')extra=AL;
     if(b.type==='hl')extra='<button class="gbtn solid" type="button" data-ba="url">'+(u?'Cambiar enlace':'Poner enlace')+'</button><span class="blk-host"></span>'+AL;
     if(b.type==='text')extra=AL+BOX;
     if(b.type==='image')extra=IMGC+AL;
     if(b.type==='split')extra=IMGC+'<label class="blk-fmt">Imagen a la <select data-bsel="side"><option value="r">Derecha</option><option value="l">Izquierda</option></select></label>'+AL.replace('Alinear ','Alinear texto ')+BOX;
     if(b.type==='video')extra='<button class="gbtn solid" type="button" data-ba="vlink">Poner enlace</button><button class="gbtn" type="button" data-ba="vfile">Subir archivo</button><button class="gbtn" type="button" data-ba="vrst">Quitar video</button><label class="blk-fmt">Formato <select data-bsel="asp"><option value="h">Horizontal 16:9</option><option value="v">Vertical 4:5</option><option value="t">Alto 9:16</option></select></label>'+AL;
     c.innerHTML='<button class="gbtn" type="button" data-ba="up" aria-label="Subir bloque">↑</button><button class="gbtn" type="button" data-ba="down" aria-label="Bajar bloque">↓</button>'+extra+'<button class="gbtn" type="button" data-ba="del">Eliminar</button>'+LAY(b);
     var h=c.querySelector('.blk-host');if(h)h.textContent=u?('Enlace: '+host(u)):'Sin enlace';
     [].forEach.call(c.querySelectorAll('select[data-bsel]'),function(s){var k=s.getAttribute('data-bsel');if(k==='asp')s.value=b.asp||'h';else if(k==='side')s.value=b.side==='l'?'l':'r';else if(k==='al')s.value=b.al||((b.type==='image'||b.type==='video')?'c':'l')});
     var bx=c.querySelector('[data-bchk=box]');if(bx)bx.checked=b.type==='split'?b.box===true:b.box!==false;
     li.appendChild(c);
    }
    list.appendChild(li);
   });
  }
  list.addEventListener('click',function(ev){
   var b=ev.target.closest('[data-ba]');if(!b||!adm())return;
   var li=b.closest('.blk'),i=idx(li.dataset.id),a=b.dataset.ba,it=st.items[i];if(i<0)return;
   if(a==='img'){pend=it.id;file.click();return}
   if(a==='vfile'){pendV=it.id;fileV.click();return}
   if(a==='url'){
    var v=prompt('Dirección (URL) o código embed/enlace <a href=…> al que llevará '+(it.type==='hl'?'el texto':'la imagen')+'. Vacío = quitar el enlace:',it.u||'https://');
    if(v==null)return;var p=parseLink(v==='https://'?'':v);
    if(p===null){note('Enlace no válido. Debe empezar con https://');return}
    it.u=p;
   }
   if(a==='vlink'){
    var w=prompt('Pega el enlace de YouTube o Vimeo, o la dirección de un archivo de video (https://… o videos/intro.mp4):');
    if(w==null)return;var pv=parseVideo(w);
    if(!pv){note('Enlace no válido. Usa YouTube, Vimeo o un archivo .mp4/.webm con https:// o una ruta como videos/intro.mp4.');return}
    dropLocal(it);it.v=pv;
   }
   if(a==='vrst'){dropLocal(it);it.v=null}
   if(a==='del'){dropLocal(it);st.items.splice(i,1)}
   if(a==='up'&&i>0)st.items.splice(i-1,0,st.items.splice(i,1)[0]);
   if(a==='down'&&i<st.items.length-1)st.items.splice(i+1,0,st.items.splice(i,1)[0]);
   persist();render();
  });
  list.addEventListener('change',function(ev){
   var s=ev.target;if(!s.getAttribute||!adm())return;
   var k=s.getAttribute('data-bsel'),chk=s.getAttribute('data-bchk');if(!k&&!chk)return;
   var i=idx(s.closest('.blk').dataset.id);if(i<0)return;
   if(k)st.items[i][k]=(k==='w'||k==='mt'||k==='mb')?+s.value:s.value;else st.items[i].box=s.checked;
   persist();render();
  });
  list.addEventListener('toggle',function(ev){var d=ev.target;if(d.matches&&d.matches('details[data-lay]')){var li=d.closest('.blk');if(li)layOpen[li.dataset.id]=d.open}},true);
  list.addEventListener('input',function(ev){
   if(!adm())return;var el=ev.target,k=el.getAttribute&&el.getAttribute('data-bf');if(!k)return;
   var li=el.closest('.blk'),i=li?idx(li.dataset.id):-1;if(i<0)return;
   var v=(k==='text')?el.innerText:el.textContent;
   if(k==='text')st.items[i].text=v;else if(k==='title')st.items[i].title=v;else st.items[i].c=v;
   if(k==='text'&&el.hasAttribute('data-rich')&&window.RichText){var rh=RichText.serialize(el);if(rh)st.items[i].rich=rh;else delete st.items[i].rich}
   cfg.save();
  });
  list.addEventListener('keydown',function(ev){
   var t=ev.target;if(ev.key==='Enter'&&t.getAttribute&&(t.classList.contains('blk-title')||t.classList.contains('sp-title')||t.classList.contains('hl')||t.tagName==='FIGCAPTION')){ev.preventDefault();t.blur()}
  });
  file.addEventListener('change',function(){
   var f=file.files[0];file.value='';if(!adm()||!f||pend==null)return;
   var id=pend;pend=null;
   window.Gallery.toData(f,1400).then(function(d){var i=idx(id);if(d&&i>-1){st.items[i].src=d;persist();render()}});
  });
  fileV.addEventListener('change',function(){
   var f=fileV.files[0];fileV.value='';if(!adm()||!f||pendV==null)return;
   var id=pendV;pendV=null;
   if(f.size>300*1048576){note('El archivo pesa más de 300 MB. Súbelo a la carpeta videos/ del sitio y usa «Poner enlace».');return}
   vOp('readwrite',function(s){return s.put(f,'blk-'+id)}).then(function(){
    var i=idx(id);if(i<0)return;st.items[i].v={type:'local'};persist();render();
    note('Video guardado solo en este navegador ('+(f.size/1048576).toFixed(1)+' MB). Para publicarlo, súbelo a videos/ y usa «Poner enlace».');
   }).catch(function(){note('No se pudo guardar el archivo en este navegador.')});
  });
  if(cfg.bar)cfg.bar.addEventListener('click',function(ev){
   var b=ev.target.closest('[data-badd]');if(!b||!adm())return;
   var t=b.dataset.badd,it={id:uid(),type:t};
   if(t==='title')it.text=DEF.title;
   if(t==='text')it.text=DEF.text;
   if(t==='image'){it.src=null;it.c='';it.u=''}
   if(t==='video'){it.v=null;it.c='';it.asp='h'}
   if(t==='hl'){it.text='Texto destacado';it.u=''}
   if(t==='split'){it.title=DEF.title;it.text=DEF.text;it.src=null;it.c='';it.u='';it.side='r';it.box=false;it.al='l'}
   st.items.push(it);persist();render();
   if(t==='image'||t==='split'){pend=it.id;file.click()}
  });
  if(cfg.watch&&window.MutationObserver){
   var mo=new MutationObserver(render);
   cfg.watch.forEach(function(el){if(el)mo.observe(el,{attributes:true,attributeFilter:['class']})});
  }
  render();
  return {render:render};
 }
 window.Blocks={create:create,parseLink:parseLink,parseVideo:parseVideo};
})();
