/* Espaciado entre las secciones de la página (modo edición).
   Un selector «Espaciado entre secciones» en el panel de edición ajusta la separación entre los bloques de contenido
   (galería, insumos, características, bloques libres…). Se guarda por página en este navegador (clave 'spacing-v1'). */
(window.Media&&Media.run||function(f){f()})(function(){
 'use strict';
 var KEY='spacing-v1';
 var PRESETS=[['c','Compacto','1.2rem'],['n','Normal',''],['a','Amplio','clamp(4rem,9vw,6.5rem)'],['x','Muy amplio','clamp(6rem,14vw,10rem)']];
 var page=(location.pathname.split('/').pop()||'index.html');
 if(/servicio/.test(page))page+='?s='+(new URLSearchParams(location.search).get('s')||'c0');
 var map={};try{var r=JSON.parse(localStorage.getItem(KEY));if(r&&typeof r==='object')map=r}catch(e){}
 function isEd(){var pg=document.getElementById('page');return document.body.classList.contains('edit')||!!(pg&&pg.classList.contains('edit'))}
 function apply(){
  var id=map[page]||'n',p=PRESETS.filter(function(x){return x[0]===id})[0]||PRESETS[1],root=document.documentElement;
  root.classList.toggle('sec-gap',!!p[2]);
  if(p[2])root.style.setProperty('--sec-gap',p[2]);else root.style.removeProperty('--sec-gap');
 }
 var host=document.querySelector('.edtools')||document.querySelector('.logotools');
 if(host){
  var bar=document.createElement('div');bar.className='bar sp-bar';
  bar.innerHTML='<span>Espaciado entre secciones:</span><select aria-label="Espaciado entre secciones">'+PRESETS.map(function(p){return '<option value="'+p[0]+'">'+p[1]+'</option>'}).join('')+'</select>';
  var sel=bar.querySelector('select');sel.value=map[page]||'n';
  sel.addEventListener('change',function(){
   if(!isEd()){sel.value=map[page]||'n';return}
   map[page]=sel.value;try{localStorage.setItem(KEY,JSON.stringify(map))}catch(e){}
   apply();
  });
  var note=host.querySelector('#ed-msg');
  if(note&&note.parentNode===host)host.insertBefore(bar,note);else host.appendChild(bar);
 }
 apply();
});
