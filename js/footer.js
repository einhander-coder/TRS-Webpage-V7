/* Pie de página compartido: redes sociales (icono + descripción editable) y soporte por WhatsApp.
   Se carga en todas las páginas. Los datos se guardan con la clave 'footer-v1' (mismo navegador / mismo sitio).
   La edición solo se activa cuando la página está en «Modo edición» (protegido por PIN). */
(window.Media&&Media.run||function(f){f()})(function(){
 'use strict';
 var KEY='footer-v1';
 var NETS={
  instagram:['Instagram','<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>'],
  facebook:['Facebook','<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'],
  youtube:['YouTube','<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>'],
  tiktok:['TikTok','<path d="M9 12a4 4 0 1 0 4 4V3a5 5 0 0 0 5 5"/>'],
  x:['X','<line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/>'],
  linkedin:['LinkedIn','<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>'],
  github:['GitHub','<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>'],
  telegram:['Telegram','<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>'],
  web:['Sitio web','<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>']
 };
 var WA='<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>';
 function svg(p,s){return '<svg viewBox="0 0 24 24" width="'+s+'" height="'+s+'" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'}
 var DEF={name:'Taller Regalia & Setups',desc:'Servicio técnico de computación, electrónica y reparación.',
  copy:'© '+new Date().getFullYear()+' Taller Regalia & Setups',
  soc:[{id:'s1',k:'instagram',u:'',d:'Síguenos en Instagram'},{id:'s2',k:'facebook',u:'',d:'Nuestra página en Facebook'},{id:'s3',k:'youtube',u:'',d:'Videos de nuestros trabajos'}],
  wa:{num:'',msg:'Hola, necesito soporte técnico.',d:'Soporte por WhatsApp en horario de atención.',float:true}};
 var S;
 try{var r=JSON.parse(localStorage.getItem(KEY));S=(r&&Array.isArray(r.soc))?r:JSON.parse(JSON.stringify(DEF))}catch(e){S=JSON.parse(JSON.stringify(DEF))}
 ['name','desc','copy'].forEach(function(k){if(typeof S[k]!=='string')S[k]=DEF[k]});
 S.wa=Object.assign({},DEF.wa,S.wa||{});
 function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){msg('No se pudo guardar en este navegador.')}}
 function esc(t){return String(t).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function okUrl(u){return /^(https:\/\/[^\s"'<>]+|mailto:[^\s"'<>]+)$/i.test(u||'')}
 function waHref(){var n=String(S.wa.num||'').replace(/\D/g,'');return(n.length<8||n.length>15)?'':'https://wa.me/'+n+'?text='+encodeURIComponent(S.wa.msg||'')}

 var foot=document.getElementById('site-footer');
 if(!foot){foot=document.createElement('footer');foot.id='site-footer';document.body.appendChild(foot)}
 foot.className='site-footer';
 function isEd(){var pg=document.getElementById('page');return document.body.classList.contains('edit')||!!(pg&&pg.classList.contains('edit'))}
 var editing=isEd();

 function msg(t){var m=foot.querySelector('.ft-msg');if(m)m.textContent=t}
 function item(s){
  var ed=editing,ce=ed?' contenteditable="true" spellcheck="false"':'',ok=okUrl(s.u);
  var a='<a class="soc'+(ok?'':' nolink')+'"'+(ok&&!ed?' href="'+esc(s.u)+'" target="_blank" rel="noopener noreferrer"':'')+'><span class="ic">'+svg((NETS[s.k]||NETS.web)[1],20)+'</span><span class="ds" data-ft="d"'+ce+'>'+esc(s.d)+'</span></a>';
  if(ed)a+='<div class="soc-ed"><select class="soc-net" aria-label="Red social">'+Object.keys(NETS).map(function(k){return '<option value="'+k+'"'+(k===s.k?' selected':'')+'>'+NETS[k][0]+'</option>'}).join('')+'</select><button class="ft-btn" type="button" data-act="url">'+(ok?'Cambiar enlace':'Poner enlace')+'</button><button class="ft-btn" type="button" data-act="rm">Quitar</button></div>';
  return '<li class="soc-item" data-id="'+esc(s.id)+'">'+a+'</li>';
 }
 function render(){
  var ed=editing,ce=ed?' contenteditable="true" spellcheck="false"':'',wa=waHref();
  var items=S.soc.filter(function(s){return ed||okUrl(s.u)});
  var h='<div class="ft-grid"><div class="ft-col"><strong class="ft-brand" data-ft="name"'+ce+'>'+esc(S.name)+'</strong><p data-ft="desc"'+ce+'>'+esc(S.desc)+'</p></div>';
  if(items.length)h+='<div class="ft-col"><p class="ft-h">Síguenos</p><ul class="ft-soc">'+items.map(item).join('')+'</ul></div>';
  if(wa||ed){
   h+='<div class="ft-col"><p class="ft-h">Soporte</p><p data-ft="wad"'+ce+'>'+esc(S.wa.d)+'</p>';
   h+=wa?'<a class="wa-btn" href="'+esc(wa)+'" target="_blank" rel="noopener noreferrer">'+svg(WA,22)+'<span>Escribir por WhatsApp</span></a>':'<p class="ft-empty">Aún no hay número de WhatsApp.</p>';
   h+='</div>';
  }
  h+='</div><div class="ft-bottom"><p data-ft="copy"'+ce+'>'+esc(S.copy)+'</p></div>';
  if(ed)h+='<div class="ft-ed"><strong>Pie de página:</strong><button class="ft-btn solid" type="button" data-act="add">+ Agregar red</button><button class="ft-btn" type="button" data-act="wa">Número y mensaje de WhatsApp</button><label><input type="checkbox" data-act="float"'+(S.wa.float!==false?' checked':'')+'> Botón flotante</label><span class="ft-msg" role="status"></span></div>';
  foot.innerHTML=h;foot.classList.toggle('editing',ed);
  var fl=document.getElementById('wa-float');
  if(wa&&S.wa.float!==false){
   if(!fl){fl=document.createElement('a');fl.id='wa-float';fl.className='wa-float';fl.target='_blank';fl.rel='noopener noreferrer';fl.setAttribute('aria-label','Soporte por WhatsApp');document.body.appendChild(fl)}
   fl.href=wa;fl.innerHTML=svg(WA,28);
  } else if(fl){fl.remove()}
 }

 foot.addEventListener('click',function(e){
  if(!editing)return;
  var b=e.target.closest('[data-act]');if(!b||b.type==='checkbox')return;
  var li=b.closest('.soc-item'),s=li&&S.soc.filter(function(x){return x.id===li.dataset.id})[0],act=b.dataset.act;
  if(act==='add'){S.soc.push({id:'s'+Date.now(),k:'web',u:'',d:'Nuevo enlace'});save();render()}
  if(act==='rm'&&s){S.soc=S.soc.filter(function(x){return x!==s});save();render()}
  if(act==='url'&&s){
   var v=prompt('Dirección del perfil (https://…). Déjala vacía para quitar el enlace:',s.u||'https://');
   if(v==null)return;v=v.trim();
   if(v&&v!=='https://'&&!okUrl(v)){msg('Dirección no válida: debe empezar con https://');return}
   s.u=(v==='https://')?'':v;save();render();
  }
  if(act==='wa'){
   var n=prompt('Número de WhatsApp con código de país, solo dígitos (ej. 56912345678). Vacío = quitar:',S.wa.num||'');
   if(n==null)return;n=n.replace(/[\s+()-]/g,'');
   if(n&&!/^\d{8,15}$/.test(n)){msg('Número no válido: usa de 8 a 15 dígitos, con código de país.');return}
   S.wa.num=n;
   if(n){var t=prompt('Mensaje que aparecerá escrito al abrir el chat:',S.wa.msg||'');if(t!=null)S.wa.msg=t.trim()}
   save();render();
  }
 });
 foot.addEventListener('change',function(e){
  if(!editing)return;var t=e.target;
  if(t.classList.contains('soc-net')){var li=t.closest('.soc-item');S.soc.forEach(function(x){if(x.id===li.dataset.id)x.k=t.value});save();render()}
  if(t.dataset&&t.dataset.act==='float'){S.wa.float=t.checked;save();render()}
 });
 foot.addEventListener('input',function(e){
  if(!editing)return;var el=e.target,f=el.dataset&&el.dataset.ft;if(!f)return;
  var v=el.textContent;
  if(f==='d'){var li=el.closest('.soc-item');S.soc.forEach(function(x){if(x.id===li.dataset.id)x.d=v})}
  else if(f==='wad')S.wa.d=v;else S[f]=v;
  save();
 });
 foot.addEventListener('keydown',function(e){if(editing&&e.key==='Enter'&&e.target.dataset&&e.target.dataset.ft){e.preventDefault();e.target.blur()}});

 /* seguir el «Modo edición» de la página */
 var mo=new MutationObserver(function(){var e=isEd();if(e!==editing){editing=e;render()}});
 mo.observe(document.body,{attributes:true,attributeFilter:['class']});
 var pg=document.getElementById('page');if(pg)mo.observe(pg,{attributes:true,attributeFilter:['class']});
 render();
});
