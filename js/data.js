/** Brand-first portfolio data and case-study modal. */
const PROJECTS_URL = '/api.php?_query=projects';
let siteBrands = [], allPortfolioProjects = [], lastProjectTrigger = null;
function safeUrl(v){ const raw=String(v||'').trim(); if(!raw)return ''; if(raw.startsWith('/')||/^https?:\/\//i.test(raw)) return raw; return ''; }
function isVideo(v){return /\.(mp4|webm|mov|m4v|ogv|ogg|avi|mkv)(\?.*)?$/i.test(v||'') || /youtube|vimeo/i.test(v||'');}
async function loadProjects(){try {const r=await fetch(PROJECTS_URL,{cache:'no-store'});if(!r.ok)throw Error();const d=await r.json(); allPortfolioProjects=(d.projects||[]).filter(p=>p.published!==false);siteBrands=(d.brands||[]).sort((a,b)=>(a.order||0)-(b.order||0)); return allPortfolioProjects;}catch(e){console.error(e);return [];}}
function mediaEl(url, title, controls=false){ const safe=safeUrl(url); if(!safe)return document.createElement('div'); if(isVideo(safe)&&!/youtube|vimeo/i.test(safe)){const v=document.createElement('video');v.src=safe;v.controls=controls;v.playsInline=true;v.preload='metadata';return v;}const i=document.createElement('img');i.src=safe;i.alt=title||'';i.loading='lazy';return i; }
function renderProjects(){const grid=document.getElementById('workGrid');if(!grid)return;grid.innerHTML=''; const brands=siteBrands.filter(b=>allPortfolioProjects.some(p=>String(p.brand)===String(b.id))); if(!brands.length){grid.innerHTML='<div class="projects-public-empty"><h3>No brands published yet</h3><p>New work will appear here soon.</p></div>';return;}brands.forEach(brand=>{const count=allPortfolioProjects.filter(p=>String(p.brand)===String(brand.id)).length, card=document.createElement('button');card.type='button';card.className='brand-card';card.setAttribute('aria-haspopup','dialog'); const img=mediaEl(brand.thumbnail,brand.name);img.className='brand-card-image';card.append(img);const overlay=document.createElement('span');overlay.className='brand-card-overlay';overlay.innerHTML='<strong></strong><small></small>';overlay.querySelector('strong').textContent=brand.name;overlay.querySelector('small').textContent=count+' project'+(count===1?'':'s');card.append(overlay);card.onclick=()=>openBrandModal(brand,card);grid.append(card);});}
function openBrandModal(brand,trigger){
  const modal=document.getElementById('projectModal'), content=modal.querySelector('.modal-content'); lastProjectTrigger=trigger;
  modal.classList.add('is-open','is-brand-modal');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  content.querySelectorAll('.brand-modal-body').forEach(n=>n.remove());
  const brandProjects=allPortfolioProjects.filter(p=>String(p.brand)===String(brand.id));
  const body=document.createElement('div');body.className='brand-modal-body';
  const hero=document.createElement('header');hero.className='brand-showcase-hero';
  const image=mediaEl(brand.thumbnail,brand.name);image.className='brand-showcase-image';
  hero.append(image);
  const copy=document.createElement('div');copy.className='brand-showcase-copy';copy.innerHTML='<span class="brand-showcase-kicker">Client archive</span><h3></h3><p></p>';
  copy.querySelector('h3').textContent=brand.name;copy.querySelector('p').textContent=brandProjects.length+' selected '+(brandProjects.length===1?'project':'projects')+' — explore the work below.';hero.append(copy);body.append(hero);
  const intro=document.createElement('div');intro.className='brand-projects-intro';intro.innerHTML='<div><span>Projects</span><h4>Stories made for '+escapeHtml(brand.name)+'</h4></div><p>Select a project to explore its full case study.</p>';body.append(intro);
  const grid=document.createElement('div');grid.className='brand-projects-grid';brandProjects.forEach((project,index)=>grid.append(projectTile(project,index)));body.append(grid);content.append(body);
  requestAnimationFrame(()=>body.classList.add('is-ready'));
}
function escapeHtml(value){const n=document.createElement('div');n.textContent=value||'';return n.innerHTML;}
function projectTile(project,index){
  const article=document.createElement('article');article.className='brand-project-tile';article.style.setProperty('--tile-delay',Math.min(index,8)*55+'ms');
  const media=Array.isArray(project.gallery)&&project.gallery.length?project.gallery:[project.thumbnail||project.video].filter(Boolean);
  const visual=document.createElement('div');visual.className='brand-project-visual';
  if(media.length){const preview=mediaEl(media[0],project.title);preview.className='brand-project-preview';visual.append(preview);}else visual.innerHTML='<div class="brand-project-no-media">No media</div>';
  if(media.length>1){const count=document.createElement('span');count.className='brand-media-count';count.textContent='+'+(media.length-1)+' media';visual.append(count)}
  const details=document.createElement('div');details.className='brand-project-tile-details';details.innerHTML='<span></span><h4></h4><button type="button" aria-label="Open project">Explore <b>↗</b></button>';details.querySelector('span').textContent=project.year||'Case study';details.querySelector('h4').textContent=project.title||'Untitled project';
  article.append(visual,details);article.tabIndex=0;article.setAttribute('role','button');article.setAttribute('aria-label','Explore '+(project.title||'project'));
  const open=()=>openCaseStudy(article,project,media);article.onclick=open;article.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};return article;
}
function openCaseStudy(tile,project,media){
  const body=tile.closest('.brand-modal-body');if(!body)return;body.querySelectorAll('.brand-case-study').forEach(n=>n.remove());
  const panel=document.createElement('section');panel.className='brand-case-study';let active=0;
  const render=()=>{panel.innerHTML='';const top=document.createElement('div');top.className='case-study-top';top.innerHTML='<button type="button" class="case-back">← All projects</button><button type="button" class="case-close" aria-label="Close project">×</button>';top.querySelector('.case-back').onclick=()=>panel.remove();top.querySelector('.case-close').onclick=()=>panel.remove();
    const viewer=document.createElement('div');viewer.className='case-media-viewer';if(media.length)viewer.append(mediaEl(media[active],project.title,true));else viewer.innerHTML='<div class="brand-project-no-media">No media added for this project.</div>';
    if(media.length>1){const nav=document.createElement('div');nav.className='case-media-nav';nav.innerHTML='<button type="button" aria-label="Previous media">←</button><span></span><button type="button" aria-label="Next media">→</button>';nav.querySelector('span').textContent=(active+1)+' / '+media.length;nav.children[0].onclick=()=>{active=(active-1+media.length)%media.length;render()};nav.children[2].onclick=()=>{active=(active+1)%media.length;render()};viewer.append(nav)}
    const info=document.createElement('div');info.className='case-study-info';info.innerHTML='<div class="case-study-meta"></div><h3></h3><p class="case-study-description"></p><div class="case-study-bottom"><span class="case-role"></span><div class="case-tools"></div></div>';info.querySelector('.case-study-meta').textContent=[project.year,project.role].filter(Boolean).join('  ·  ');info.querySelector('h3').textContent=project.title||'';info.querySelector('.case-study-description').textContent=project.description||'No project description has been added yet.';info.querySelector('.case-role').textContent=project.role?'Role: '+project.role:'';(project.tools||[]).forEach(t=>{const tag=document.createElement('span');tag.textContent=t;info.querySelector('.case-tools').append(tag)});panel.append(top,viewer,info);
  };render();body.append(panel);requestAnimationFrame(()=>panel.classList.add('is-open'));
}
function closeProjectModal(){const modal=document.getElementById('projectModal');if(!modal)return;modal.classList.remove('is-open','is-brand-modal');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';if(lastProjectTrigger)lastProjectTrigger.focus();}
Object.assign(window,{loadProjects,renderProjects,closeProjectModal,openBrandModal,renderFilters:()=>{},filterProjects:()=>allPortfolioProjects});
