/* Texto destacado (resaltado amarillo) y enlaces externos dentro de los textos editables.
   Modo edición: al seleccionar texto (o al poner el cursor) en un párrafo editable aparece una barra con
     · Resaltar  → resalta en amarillo la selección; sin selección, inserta un «Texto destacado» para escribir encima
     · Enlace    → convierte el texto destacado en un enlace externo (https://…, o pegando <a href="…"> / <iframe src="…">)
     · Quitar    → quita el resaltado o el enlace
   Solo se permiten estas marcas (<mark>, <a>); todo lo demás se limpia, así que el contenido guardado no puede traer código.
   Los párrafos de la página que llevan data-rich="clave" se guardan aquí ('richtext-v1'); los bloques libres guardan su propia
   copia (campo rich) usando RichText.serialize / RichText.setHTML. */
(window.Media&&Media.run||function(f){f()})(function(){
 'use strict';
 var KEY='richtext-v1';
 function $(i){return document.getElementById(i)}
 function isEd(){var pg=$('page');return document.body.classList.contains('edit')||!!(pg&&pg.classList.contains('edit'))}
 function esc(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
 function escA(t){return esc(t).replace(/"/g,'&quot;')}
 function parseLink(raw){
  raw=(raw||'').trim();if(!raw)return '';
  var m=raw.match(/\b(?:href|src)\s*=\s*["']([^"']+)["']/i);if(m)raw=m[1];
  if(raw.indexOf('//')===0)raw='https:'+raw;
  return /^https:\/\/[^\s"'<>]+$/i.test(raw)?raw:null;
 }
 /* DOM → texto con marcas permitidas */
 function ser(node){
  var s='';
  [].forEach.call(node.childNodes,function(n){
   if(n.nodeType===3){s+=esc(n.nodeValue.replace(/\u200b/g,''))}
   else if(n.nodeType===1){
    var t=n.tagName;
    if(t==='BR')s+='\n';
    else if(t==='MARK'){var i=ser(n);if(i.replace(/\s/g,''))s+='<mark class="hl">'+i+'</mark>'}
    else if(t==='A'){
     var u=parseLink(n.getAttribute('href')||''),i2=ser(n);
     if(u&&i2.replace(/\s/g,''))s+='<a class="hl" href="'+escA(u)+'" target="_blank" rel="noopener noreferrer">'+i2+'</a>';else s+=i2;
    }
    else if(t==='DIV'||t==='P'){var i3=ser(n);s+=(s&&!/\n$/.test(s)?'\n':'')+i3+'\n'}
    else if(t!=='SCRIPT'&&t!=='STYLE')s+=ser(n);
   }
  });
  return s;
 }
 function serialize(el){var h=ser(el).replace(/\n+$/,'');return /<(mark|a)\b/.test(h)?h:''}
 function sanitize(html){
  var doc=new DOMParser().parseFromString('<body>'+String(html||'')+'</body>','text/html');
  return ser(doc.body);
 }
 function setHTML(el,html){el.innerHTML=sanitize(html)}
 function plain(html){var d=document.createElement('div');d.innerHTML=sanitize(html);return d.textContent.replace(/\s+/g,'')}
 function hasFmt(el){return !!el.querySelector('mark,a')}

 /* ----- textos de la página con formato (clave por página) ----- */
 var page=location.pathname.split('/').pop()||'index.html';
 if(/servicio/.test(page))page+='?s='+(new URLSearchParams(location.search).get('s')||'c0');
 var store={};try{var r0=JSON.parse(localStorage.getItem(KEY));if(r0&&typeof r0==='object')store=r0}catch(e){}
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}}
 var guard=false;
 function applyOne(el){
  var k=el.getAttribute('data-rich');if(!k)return;
  var h=(store[page]||{})[k];if(!h||hasFmt(el))return;
  if(plain(h)!==el.textContent.replace(/\s+/g,''))return; /* el texto cambió por otra vía: no se pisa */
  guard=true;setHTML(el,h);guard=false;
 }
 function statics(){return [].filter.call(document.querySelectorAll('[data-rich]'),function(e){return e.getAttribute('data-rich')})}
 function applyAll(){statics().forEach(applyOne)}
 applyAll();
 if(window.MutationObserver)statics().forEach(function(el){
  new MutationObserver(function(){if(!guard)applyOne(el)}).observe(el,{childList:true});
 });
 document.addEventListener('input',function(e){
  var el=e.target&&e.target.closest&&e.target.closest('[data-rich]');if(!el)return;
  var k=el.getAttribute('data-rich');if(!k)return;
  var h=serialize(el);store[page]=store[page]||{};
  if(h)store[page][k]=h;else delete store[page][k];
  persist();
 });

 /* ----- barra flotante ----- */
 var bar=document.createElement('div');bar.className='rt-bar';bar.hidden=true;bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Formato del texto');
 bar.innerHTML='<button type="button" class="hlb" data-rt="hl" title="Resaltar en amarillo / insertar texto destacado">Resaltar</button><button type="button" data-rt="link" title="Enlace externo para el texto destacado">Enlace</button><button type="button" data-rt="clear" title="Quitar resaltado o enlace">Quitar</button>';
 document.body.appendChild(bar);
 bar.addEventListener('mousedown',function(e){e.preventDefault()});
 function hostEl(){
  var s=getSelection();if(!s||!s.rangeCount||!s.anchorNode)return null;
  var n=s.anchorNode;n=n.nodeType===3?n.parentNode:n;
  var el=n.closest&&n.closest('[data-rich][contenteditable="true"]');
  if(!el)return null;
  var f=s.focusNode;f=f&&(f.nodeType===3?f.parentNode:f);
  return el.contains(f)?el:null;
 }
 function place(){
  var el=hostEl();
  if(!el||!isEd()){bar.hidden=true;return}
  var rg=getSelection().getRangeAt(0),rc=rg.getBoundingClientRect();
  if(!rc||(!rc.width&&!rc.height))rc=el.getBoundingClientRect();
  bar.hidden=false;
  var bw=bar.offsetWidth||230,bh=bar.offsetHeight||42;
  var top=rc.top-bh-8;if(top<8)top=Math.min(rc.bottom+8,innerHeight-bh-8);
  var left=Math.max(8,Math.min(rc.left+rc.width/2-bw/2,innerWidth-bw-8));
  bar.style.top=top+'px';bar.style.left=left+'px';
 }
 document.addEventListener('selectionchange',place);
 window.addEventListener('scroll',place,{passive:true});
 window.addEventListener('resize',place);

 function unwrap(n){var p=n.parentNode;if(!p)return;while(n.firstChild)p.insertBefore(n.firstChild,n);p.removeChild(n);p.normalize()}
 function selectNode(n){var s=getSelection(),r=document.createRange();r.selectNodeContents(n);s.removeAllRanges();s.addRange(r)}
 function changed(el){el.dispatchEvent(new Event('input',{bubbles:true}));place()}
 function closestIn(node,sel,el){var n=node.nodeType===3?node.parentNode:node;var c=n.closest&&n.closest(sel);return c&&el.contains(c)?c:null}
 function wrap(range,tag){
  var node=document.createElement(tag);node.className='hl';
  var frag=range.extractContents();
  [].slice.call(frag.querySelectorAll('mark,a')).forEach(unwrap);
  node.appendChild(frag);range.insertNode(node);return node;
 }
 function insertSnippet(range,tag,text){
  var node=document.createElement(tag);node.className='hl';node.textContent=text;
  var sp=document.createTextNode(' ');
  range.insertNode(sp);range.insertNode(node); /* el espacio posterior permite seguir escribiendo fuera del resaltado */
  return node;
 }
 function act(a){
  var el=hostEl();if(!el)return;
  var s=getSelection(),range=s.getRangeAt(0);
  if(a==='hl'){
   var m=closestIn(range.commonAncestorContainer,'mark',el);
   if(m){unwrap(m);changed(el);return}
   if(closestIn(range.commonAncestorContainer,'a',el))return; /* un enlace ya va resaltado */
   var node=range.collapsed?insertSnippet(range,'mark','Texto destacado'):wrap(range,'mark');
   selectNode(node);changed(el);
  }
  if(a==='link'){
   var cur=closestIn(range.commonAncestorContainer,'a',el),mk=closestIn(range.commonAncestorContainer,'mark',el);
   var saved=range.cloneRange();
   var v=prompt('Dirección (URL) o código embed/enlace <a href=…> del sitio externo. Vacío = quitar el enlace:',cur?cur.getAttribute('href'):'https://');
   if(v==null)return;
   s.removeAllRanges();s.addRange(saved);
   var url=parseLink(v==='https://'?'':v);
   if(url===null){alert('Enlace no válido. Debe empezar con https://');return}
   if(!url){ /* quitar el enlace, se conserva el resaltado */
    if(cur){var mm=document.createElement('mark');mm.className='hl';while(cur.firstChild)mm.appendChild(cur.firstChild);cur.parentNode.replaceChild(mm,cur);selectNode(mm);changed(el)}
    return;
   }
   if(cur){cur.setAttribute('href',url);changed(el);return}
   var a2;
   if(mk){ /* el texto ya estaba resaltado: pasa a ser un enlace resaltado */
    a2=document.createElement('a');a2.className='hl';a2.setAttribute('href',url);
    while(mk.firstChild)a2.appendChild(mk.firstChild);mk.parentNode.replaceChild(a2,mk);
   } else if(saved.collapsed){a2=insertSnippet(saved,'a','Enlace destacado');a2.setAttribute('href',url)}
   else{a2=wrap(saved,'a');a2.setAttribute('href',url)}
   selectNode(a2);changed(el);
  }
  if(a==='clear'){
   var any=false;
   [].slice.call(el.querySelectorAll('mark,a')).forEach(function(n){if(range.intersectsNode(n)){unwrap(n);any=true}});
   if(!any){var c=closestIn(range.commonAncestorContainer,'mark,a',el);if(c){unwrap(c);any=true}}
   if(any)changed(el);
  }
 }
 bar.addEventListener('click',function(e){var b=e.target.closest('[data-rt]');if(b)act(b.dataset.rt)});
 /* en edición, un clic sobre un enlace no navega */
 document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('a.hl');
  if(a&&isEd()&&a.closest('[contenteditable="true"]'))e.preventDefault();
 },true);
 window.RichText={serialize:serialize,sanitize:sanitize,setHTML:setHTML,parseLink:parseLink};
});
