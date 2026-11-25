/* Videos incrustados (YouTube / Vimeo / archivo) para toda la web.
   Embed.parse(texto)  → {type:'embed'|'file', src} o null. Acepta enlaces de YouTube (watch, youtu.be, shorts, live,
                         listas de reproducción, tiempo de inicio «?t=1m30s»), Vimeo (incluye enlaces no listados),
                         el código <iframe …> completo o un archivo .mp4/.webm (https:// o videos/intro.mp4).
   Embed.render(caja, v, {title, auto}) → coloca el reproductor y devuelve {watch, facade}.
   Embed.altLink(watch) → párrafo «¿No carga el video? Ábrelo en YouTube».

   Error 153 de YouTube («Error de configuración del reproductor»): YouTube exige que el navegador envíe el origen de
   la página (cabecera Referer). Eso falla si la página se abre desde un archivo local (file://) o dentro de un recuadro
   aislado. Aquí:
     · cada reproductor lleva referrerpolicy="strict-origin-when-cross-origin" y el parámetro origin;
     · si la página NO puede enviar el origen (archivo local), en vez del reproductor con error se muestra una tarjeta
       con la miniatura y el botón «Ver en YouTube» que abre el video en otra pestaña;
     · bajo cada reproductor hay un enlace «Ábrelo en YouTube» por si el reproductor no carga.
   Publicado en https:// (por ejemplo en Netlify) el reproductor integrado funciona normalmente. */
(function(){
 'use strict';
 var YT_ID=/^[\w-]{6,15}$/,PLAYLIST=/^[\w-]{10,64}$/;
 function seconds(t){
  if(!t)return 0;
  if(/^\d+$/.test(t))return +t;
  var m=String(t).match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i);
  return m?(+(m[1]||0))*3600+(+(m[2]||0))*60+(+(m[3]||0)):0;
 }
 function parse(raw){
  raw=(raw||'').trim();
  var m=raw.match(/<iframe[^>]*\ssrc\s*=\s*["']([^"']+)["']/i);if(m)raw=m[1];
  if(raw.indexOf('//')===0)raw='https:'+raw;
  if(/\.(mp4|webm|ogv|mov)(\?[^\s]*)?$/i.test(raw)&&(/^https:\/\//i.test(raw)||/^[\w./-]+$/.test(raw)))return{type:'file',src:raw};
  var u;try{u=new URL(raw)}catch(e){return null}
  if(u.protocol!=='https:')return null;
  var h=u.hostname.replace(/^www\./,'').replace(/^(m|music)\./,''),q=u.searchParams,id=null,list=q.get('list');
  if(h==='youtu.be')id=u.pathname.slice(1).split('/')[0];
  else if(h==='youtube.com'||h==='youtube-nocookie.com'){
   if(u.pathname==='/watch')id=q.get('v');
   else{var mm=u.pathname.match(/^\/(embed|shorts|live|v)\/([\w-]+)/);if(mm&&mm[2]!=='videoseries')id=mm[2]}
   if(!id&&u.pathname==='/playlist'&&list&&PLAYLIST.test(list))return{type:'embed',src:'https://www.youtube-nocookie.com/embed/videoseries?list='+list};
  }
  if(id&&YT_ID.test(id)){
   var p=[],st=seconds(q.get('t')||q.get('start'));
   if(st)p.push('start='+st);
   if(list&&PLAYLIST.test(list))p.push('list='+list);
   return{type:'embed',src:'https://www.youtube-nocookie.com/embed/'+id+(p.length?'?'+p.join('&'):'')};
  }
  if(!id&&(h==='youtube.com'||h==='youtube-nocookie.com')&&list&&PLAYLIST.test(list))return{type:'embed',src:'https://www.youtube-nocookie.com/embed/videoseries?list='+list};
  if(h==='vimeo.com'||h==='player.vimeo.com'){
   var vm=u.pathname.match(/(\d{6,})/);
   if(vm){var hh=q.get('h')||((u.pathname.match(/\/\d{6,}\/([a-f0-9]{6,})/i)||[])[1]);return{type:'embed',src:'https://player.vimeo.com/video/'+vm[1]+(hh?'?h='+hh:'')}}
  }
  return null;
 }
 function isYT(src){return /^https:\/\/www\.youtube-nocookie\.com\/embed\//.test(src||'')}
 /* ¿esta página puede enviar su origen (Referer) a YouTube? */
 function canEmbed(){
  var p=location.protocol;
  if(p==='file:'||location.origin==='null')return false;
  return p==='https:'||(p==='http:'&&/^(localhost|127\.0\.0\.1)$/.test(location.hostname));
 }
 function info(src){
  try{
   var u=new URL(src),parts=u.pathname.split('/');
   if(u.hostname==='www.youtube-nocookie.com'){
    var id=parts[2],list=u.searchParams.get('list'),st=u.searchParams.get('start');
    if(id==='videoseries')return{provider:'YouTube',watch:'https://www.youtube.com/playlist?list='+list,thumb:null};
    return{provider:'YouTube',watch:'https://www.youtube.com/watch?v='+id+(list?'&list='+list:'')+(st?'&t='+st+'s':''),thumb:'https://i.ytimg.com/vi/'+id+'/hqdefault.jpg'};
   }
   if(u.hostname==='player.vimeo.com'){var vid=parts[2],h=u.searchParams.get('h');return{provider:'Vimeo',watch:'https://vimeo.com/'+vid+(h?'/'+h:''),thumb:null}}
  }catch(e){}
  return{provider:'',watch:null,thumb:null};
 }
 function render(box,v,o){
  o=o||{};
  var inf=info(v.src);
  if(isYT(v.src)&&!canEmbed()&&inf.watch){
   var a=document.createElement('a');a.className='emb-facade';a.href=inf.watch;a.target='_blank';a.rel='noopener noreferrer';
   if(inf.thumb)a.style.backgroundImage='url("'+inf.thumb+'")';
   a.innerHTML='<span class="emb-play" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30"><polygon points="8 5 19 12 8 19 8 5" fill="currentColor"/></svg></span><strong>Ver en YouTube</strong><small>El reproductor integrado funciona cuando el sitio está publicado (https://). Desde un archivo local el video se abre en YouTube.</small>';
   box.appendChild(a);
   return{watch:inf.watch,facade:true};
  }
  var f=document.createElement('iframe'),u;
  try{u=new URL(v.src)}catch(e){return{watch:null,facade:false}}
  if(isYT(v.src)){
   u.searchParams.set('rel','0');u.searchParams.set('playsinline','1');
   if(canEmbed())u.searchParams.set('origin',location.origin);
   if(o.auto){u.searchParams.set('autoplay','1');u.searchParams.set('mute','1')}
  } else if(o.auto){u.searchParams.set('autoplay','1');u.searchParams.set('muted','1');u.searchParams.set('loop','1')}
  f.src=u.href;f.title=o.title||'Video';f.loading='lazy';f.allowFullscreen=true;
  f.setAttribute('allow','autoplay; fullscreen; picture-in-picture; encrypted-media');
  f.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
  box.appendChild(f);
  return{watch:inf.watch,facade:false,provider:inf.provider};
 }
 function altLink(watch){
  var p=document.createElement('p');p.className='emb-alt';
  var a=document.createElement('a');a.href=watch;a.target='_blank';a.rel='noopener noreferrer';
  a.textContent='¿No carga el video? Ábrelo en '+(/vimeo/.test(watch)?'Vimeo':'YouTube')+' ↗';
  p.appendChild(a);return p;
 }
 window.Embed={parse:parse,render:render,altLink:altLink,canEmbed:canEmbed};
})();
