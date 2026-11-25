/* Pantalla de carga: el logo se «enciende» de izquierda a derecha con un haz de soldadura y chispas, mientras se
   precargan las páginas del sitio; al terminar parpadea como un neón y se pasa a la página principal.
   - Duración mínima MIN_MS para que la animación se vea completa; si algo tarda de más, a los MAX_MS se continúa igual.
   - Un clic, toque o tecla (Enter, Espacio, Esc) salta la pantalla de carga.
   - Con «movimiento reducido» el logo se muestra fijo y se continúa enseguida. */
var NEXT   = 'index.html';   /* página a la que se redirige al terminar */
var MIN_MS = 3000;           /* tiempo mínimo en pantalla */
var MAX_MS = 9000;           /* tiempo máximo de espera */
var PRELOAD = ['index.html','css/base.css','css/inicio.css','js/media.js','js/embed.js','js/richtext.js','js/pin.js','js/admin-ui.js','js/inicio.js','js/spacing.js','js/footer.js','js/portada.js','img/logo-empresa.png','img/logo-marketing.png','css/trabajo.css','css/plenario.css','css/contacto.css','css/servicio.css'];

(function(){
 'use strict';
 var logo=document.getElementById('logo'),cv=document.getElementById('sparks'),ctx=cv.getContext&&cv.getContext('2d');
 var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
 var t0=performance.now(),p=0,finishing=false,gone=false;

 /* ----- precarga real de las páginas (calienta la caché del navegador) ----- */
 var total=PRELOAD.length,loaded=0;
 function tick(){loaded++}
 PRELOAD.forEach(function(u){
  try{fetch(u,{cache:'force-cache'}).then(function(r){return r.blob()}).then(tick,tick)}catch(e){tick()}
 });
 function assets(){return total?Math.min(1,loaded/total):1}

 /* ----- salida ----- */
 function go(){
  if(gone)return;gone=true;
  try{sessionStorage.setItem('splash-v1','1')}catch(e){}
  location.replace(NEXT);
 }
 function finish(){
  if(finishing)return;finishing=true;
  p=1;logo.style.setProperty('--p',1);logo.classList.add('done');
  setTimeout(function(){document.body.classList.add('out')},reduce?200:1000);
  setTimeout(go,reduce?600:1550);
 }
 ['click','touchstart','keydown'].forEach(function(ev){
  window.addEventListener(ev,function(e){
   if(ev==='keydown'&&!/^(Enter| |Escape)$/.test(e.key))return;
   if(!finishing){finishing=true;logo.classList.add('done');document.body.classList.add('out');setTimeout(go,250)}
  },{passive:true,once:false});
 });
 if(reduce){logo.style.setProperty('--p',1);logo.classList.add('done');setTimeout(finish,1100);return}

 /* ----- chispas (canvas) ----- */
 var parts=[],W=0,H=0,dpr=1;
 function size(){
  if(!ctx)return;
  var r=cv.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);
  W=r.width;H=r.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 }
 size();window.addEventListener('resize',size);
 function spawn(x,n){
  for(var i=0;i<n&&parts.length<140;i++){
   var a=-Math.PI/2+(Math.random()-.35)*1.9,sp=60+Math.random()*190;
   parts.push({x:x,y:H*(.12+Math.random()*.76),vx:Math.cos(a)*sp*.7+40,vy:Math.sin(a)*sp,life:0,max:.55+Math.random()*.7,s:.8+Math.random()*2.2,w:Math.random()<.22});
  }
 }
 var last=t0,shown=0;
 function ease(x){return -(Math.cos(Math.PI*x)-1)/2} /* seno suave: arranca y termina despacio */
 function frame(now){
  var dt=Math.min(.05,(now-last)/1000);last=now;
  var el=now-t0,tt=Math.min(1,Math.max(0,(el-350)/(MIN_MS-350))); /* arranca tras la entrada del logo */
  var target=ease(tt),a=assets();
  if(a<1)target=Math.min(target,.25+.7*a);  /* no llega al final hasta que el sitio esté listo */
  p+=(target-p)*Math.min(1,dt*7);
  if(p>.998&&a>=1&&el>=MIN_MS){finish()}
  else if(el>=MAX_MS)finish();
  logo.style.setProperty('--p',p.toFixed(4));
  if(p>.004&&!finishing)logo.classList.add('run');
  if(ctx){
   if(!finishing&&p>.01&&p<.995)spawn(p*W*(1/1.12)+W*.0536,Math.round(3+dt*90));
   ctx.clearRect(0,0,W,H);ctx.globalCompositeOperation='lighter';
   for(var i=parts.length-1;i>=0;i--){
    var q=parts[i];q.life+=dt;
    if(q.life>q.max){parts.splice(i,1);continue}
    q.vy+=330*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;
    var k=1-q.life/q.max;
    ctx.globalAlpha=Math.max(0,k);ctx.fillStyle=q.w?'#fff6c2':'#f2c200';
    ctx.beginPath();ctx.arc(q.x,q.y,q.s*(.6+k*.6),0,6.2832);ctx.fill();
   }
   ctx.globalAlpha=1;
  }
  if(!gone)requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
})();
