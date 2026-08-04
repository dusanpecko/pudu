
const q=(s,a=document)=>a.querySelector(s),qa=(s,a=document)=>[...a.querySelectorAll(s)];
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('on')),{threshold:.12});qa('.reveal').forEach(e=>io.observe(e));
window.addEventListener('pointermove',e=>{const r=q('.robot');if(!r)return;const x=(e.clientX/innerWidth-.5)*12,y=(e.clientY/innerHeight-.5)*-8;r.style.transform=`translateY(-4px) rotateY(${x}deg) rotateX(${y}deg)`});
qa('[data-count]').forEach(el=>{const end=+el.dataset.count;let done=false;const ob=new IntersectionObserver(es=>{if(es[0].isIntersecting&&!done){done=true;let t=0;const st=performance.now();const run=n=>{t=Math.min(1,(n-st)/1100);el.textContent=Math.round(end*(1-Math.pow(1-t,3)));if(t<1)requestAnimationFrame(run)};requestAnimationFrame(run)}});ob.observe(el)});
q('.menu')?.addEventListener('click',()=>alert('V Next.js verzii sa tu otvorí mobilné menu.'));
