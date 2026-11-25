/* Publicar los cambios del modo edición para que los vea todo el mundo.
   Los cambios del modo edición viven en el navegador del administrador. «Publicar» reúne TODO lo editado (textos, servicios,
   enlaces, imágenes, GIF, videos subidos, bloques, pie de página, PIN…) en un ZIP:
     data/content.json   textos y configuración
     data/img/…          imágenes (con su nombre único)
     data/video/…        videos subidos como archivo
   Se copia la carpeta «data» junto a index.html y se vuelve a subir el sitio a Netlify. A partir de ahí todos los visitantes
   ven ese contenido (js/media.js lo carga al abrir cualquier página). */
(function(){
 'use strict';
 var LOGO='img/logo-empresa.png';
 var NAMES={'inicio-v1':'Inicio y servicios','trabajo-v1':'Nuestro trabajo','servicios-v1':'Páginas de servicio','plenario-v1':'Taller (Plenario)','contacto-v1':'Contacto','portada-v1':'Portada','footer-v1':'Pie de página','richtext-v1':'Textos destacados','spacing-v1':'Espaciado','admin-pin-v1':'PIN de administrador'};
 function $(i){return document.getElementById(i)}

 /* ----- ZIP (sin compresión) ----- */
 var CRC=(function(){var t=new Uint32Array(256);for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
 function crc32(u8){var c=0xFFFFFFFF;for(var i=0;i<u8.length;i++)c=CRC[(c^u8[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
 function zip(files){
  var enc=new TextEncoder(),parts=[],central=[],off=0,d=new Date();
  var time=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),date=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  files.forEach(function(f){
   var name=enc.encode(f.name),crc=crc32(f.bytes),sz=f.bytes.length;
   var h=new DataView(new ArrayBuffer(30));
   h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,time,true);h.setUint16(12,date,true);
   h.setUint32(14,crc,true);h.setUint32(18,sz,true);h.setUint32(22,sz,true);h.setUint16(26,name.length,true);h.setUint16(28,0,true);
   parts.push(h.buffer,name,f.bytes);
   var c=new DataView(new ArrayBuffer(46));
   c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint16(12,time,true);c.setUint16(14,date,true);
   c.setUint32(16,crc,true);c.setUint32(20,sz,true);c.setUint32(24,sz,true);c.setUint16(28,name.length,true);c.setUint16(30,0,true);c.setUint16(32,0,true);c.setUint16(34,0,true);c.setUint16(36,0,true);c.setUint32(38,0,true);c.setUint32(42,off,true);
   central.push(c.buffer,name);off+=30+name.length+sz;
  });
  var csize=0;central.forEach(function(b){csize+=b.byteLength});
  var e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,csize,true);e.setUint32(16,off,true);
  return new Blob(parts.concat(central,[e.buffer]),{type:'application/zip'});
 }

 /* ----- videos subidos como archivo (IndexedDB) ----- */
 function idbGet(key){
  return new Promise(function(res){
   try{
    var q=indexedDB.open('regalia-media',1);
    q.onupgradeneeded=function(){if(!q.result.objectStoreNames.contains('v'))q.result.createObjectStore('v')};
    q.onerror=function(){res(null)};
    q.onsuccess=function(){try{var r=q.result.transaction('v','readonly').objectStore('v').get(key);r.onsuccess=function(){res(r.result||null)};r.onerror=function(){res(null)}}catch(e){res(null)}};
   }catch(e){res(null)}
  });
 }
 function hex(buf){return [].map.call(new Uint8Array(buf),function(x){return('0'+x.toString(16)).slice(-2)}).join('')}
 function hash(u8){return crypto.subtle.digest('SHA-256',u8).then(function(b){return hex(b).slice(0,16)})}
 var EXT={jpeg:'jpg','svg+xml':'svg'};

 /* ----- construir el contenido ----- */
 async function build(){
  var files=[],seen={},stat={img:0,vid:0,lost:0,bytes:0,keys:0};
  var content={v:1,t:Date.now(),generated:new Date().toISOString(),keys:{}};
  async function addFile(prefix,u8,ext){
   var name=prefix+(await hash(u8))+'.'+ext;
   if(!seen[name]){seen[name]=1;files.push({name:name,bytes:u8});stat.bytes+=u8.length}
   return name;
  }
  async function image(url){
   var m=url.match(/^data:image\/([a-z0-9.+-]+);base64,/i);if(!m)return url;
   var ext=EXT[m[1].toLowerCase()]||m[1].toLowerCase();
   var u8=new Uint8Array(await (await fetch(url)).arrayBuffer());
   var n=files.length,name=await addFile('data/img/',u8,ext);if(files.length>n)stat.img++;return name;
  }
  async function walk(node){
   if(typeof node==='string'){return node.indexOf('data:image/')===0?await image(node):node}
   if(Array.isArray(node)){for(var i=0;i<node.length;i++)node[i]=await walk(node[i]);return node}
   if(node&&typeof node==='object'){for(var k in node)node[k]=await walk(node[k]);return node}
   return node;
  }
  async function movie(parent,prop,idbKey){
   var blob=await idbGet(idbKey);
   if(!blob){delete parent[prop];stat.lost++;return}
   var u8=new Uint8Array(await blob.arrayBuffer()),ext=/webm/.test(blob.type)?'webm':/ogg/.test(blob.type)?'ogv':/quicktime/.test(blob.type)?'mov':'mp4';
   var n=files.length,name=await addFile('data/video/',u8,ext);if(files.length>n)stat.vid++;
   parent[prop]={type:'file',src:name};
  }
  async function videos(key,obj){
   var jobs=[];
   function blocks(list){(list||[]).forEach(function(b){if(b&&b.v&&b.v.type==='local')jobs.push(movie(b,'v','blk-'+b.id))})}
   if(key==='servicios-v1'&&obj.pages)Object.keys(obj.pages).forEach(function(id){var p=obj.pages[id];if(p.video&&p.video.type==='local')jobs.push(movie(p,'video','v-'+id));blocks(p.blocks&&p.blocks.items)});
   if((key==='trabajo-v1'||key==='contacto-v1')&&obj.blocks)blocks(obj.blocks.items);
   if(key==='portada-v1'&&obj.video&&obj.video.type==='local')jobs.push(movie(obj,'video','portada-video'));
   await Promise.all(jobs);
  }
  for(var i=0;i<Media.keys.length;i++){
   var key=Media.keys[i],raw=localStorage.getItem(key);if(!raw)continue;
   var obj;try{obj=JSON.parse(raw)}catch(e){continue}
   if(!obj||typeof obj!=='object')continue;
   await videos(key,obj);obj=await walk(obj);content.keys[key]=obj;stat.keys++;
  }
  var enc=new TextEncoder();
  files.unshift({name:'data/content.json',bytes:enc.encode(JSON.stringify(content))});
  files.push({name:'LEEME-PUBLICAR.txt',bytes:enc.encode(
   'PUBLICAR LOS CAMBIOS EN NETLIFY\r\n===============================\r\n\r\n'+
   '1. Descomprime este ZIP.\r\n'+
   '2. Copia la carpeta «data» dentro de la carpeta de tu sitio, junto a index.html.\r\n   Si ya existe una carpeta «data», reemplázala por esta.\r\n'+
   '3. En Netlify abre tu sitio > Deploys y arrastra la CARPETA COMPLETA del sitio (con «data» dentro).\r\n'+
   '4. Abre el sitio en una ventana privada o en otro dispositivo: verás todos los cambios.\r\n\r\n'+
   'Contenido: data/content.json (textos y configuración), data/img (imágenes y GIF), data/video (videos subidos).\r\n'+
   'Generado: '+new Date().toLocaleString('es-CL')+'\r\n')});
  stat.total=files.length;
  return {blob:zip(files),stat:stat};
 }

 /* ----- ventana ----- */
 var box=null,opener=null;
 function dlg(){
  if(box)return;
  box=document.createElement('div');box.className='dlg';box.id='pubdlg';
  box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-labelledby','pb-t');
  box.innerHTML='<div class="pinbox pubbox">'+
   '<img class="pin-logo" src="'+LOGO+'" alt="Taller Regalia &amp; Setups">'+
   '<h3 id="pb-t">Publicar los cambios</h3>'+
   '<p class="pin-d" id="pb-state"></p>'+
   '<ol class="pb-steps"><li>Descarga el ZIP con todos los cambios.</li><li>Copia su carpeta <b>data</b> dentro de la carpeta de tu sitio, junto a <b>index.html</b>.</li><li>En Netlify: <b>Deploys</b> → arrastra la carpeta completa del sitio.</li></ol>'+
   '<p class="pb-note">Haz esto desde el mismo navegador y la misma dirección donde editaste: ahí están guardados tus cambios.</p>'+
   '<p id="pb-e" role="status"></p>'+
   '<div class="bar"><button class="pin-btn primary" type="button" id="pb-go">Descargar ZIP</button><button class="pin-btn" type="button" id="pb-x">Cerrar</button></div></div>';
  document.body.appendChild(box);
  var img=box.querySelector('.pin-logo');img.addEventListener('error',function(){img.hidden=true});
  $('pb-x').addEventListener('click',close);
  box.addEventListener('click',function(e){if(e.target===box)close()});
  $('pb-go').addEventListener('click',run);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&box.classList.contains('on')){e.stopPropagation();close()}},true);
 }
 function state(){
  var d=Media.dirtyKeys(),p=Media.published(),t=p?new Date(p.t).toLocaleString('es-CL'):null;
  $('pb-state').textContent=(d.length?'Cambios sin publicar: '+d.map(function(k){return NAMES[k]||k}).join(', ')+'.':'Todo lo editado en este navegador ya coincide con la última publicación.')+(t?' Última publicación detectada: '+t+'.':' Aún no hay una publicación en el sitio.');
 }
 function open(){
  dlg();opener=document.activeElement;$('pb-e').textContent='';$('pb-go').disabled=false;$('pb-go').textContent='Descargar ZIP';state();
  box.classList.add('on');$('pb-go').focus();
 }
 function close(){if(!box)return;box.classList.remove('on');if(opener&&opener.focus)opener.focus()}
 async function run(){
  var b=$('pb-go');b.disabled=true;b.textContent='Preparando…';$('pb-e').textContent='Reuniendo textos, imágenes y videos…';
  try{
   var r=await build(),mb=(r.blob.size/1048576).toFixed(1);
   var a=document.createElement('a'),n=new Date();
   a.href=URL.createObjectURL(r.blob);
   a.download='publicar-cambios-'+n.getFullYear()+'-'+('0'+(n.getMonth()+1)).slice(-2)+'-'+('0'+n.getDate()).slice(-2)+'.zip';
   document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},4000);
   $('pb-e').textContent='Listo: '+r.stat.keys+' secciones, '+r.stat.img+' imágenes, '+r.stat.vid+' videos ('+mb+' MB).'+(r.stat.lost?' Aviso: '+r.stat.lost+' video(s) subido(s) ya no estaban en este navegador y quedaron fuera.':'');
   b.textContent='Descargar de nuevo';
  }catch(e){$('pb-e').textContent='No se pudo preparar el ZIP: '+(e&&e.message||e);b.textContent='Reintentar'}
  b.disabled=false;
 }
 window.Publish={open:open,build:build};
})();
