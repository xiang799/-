(() => {
  'use strict';
  const {categories,projects,profile,cmf}=window.portfolioContent;
  const images=window.projectImages;
  const tracks=window.turntablePlaylist;
  const panel=document.querySelector('#content-panel');
  const body=document.querySelector('#panel-content');
  const lightbox=document.querySelector('#lightbox');
  const audio=document.querySelector('#desk-audio');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const btn=(route,label,cls='text-link')=>`<button class="${cls}" data-route="${esc(route)}">${label}</button>`;
  const category=id=>categories.find(c=>c.id===id);
  const project=id=>projects.find(p=>p.id===id);
  const shot=(id,index=0)=>images[id]?.[index]||images[id]?.[0];
  const assetImage=(item,attrs='',preview=false)=>`<img src="${esc(preview?(item.thumbnail||item.src):item.src)}" decoding="async" alt="${esc(item.label)}" width="${item.width||1600}" height="${item.height||1000}" ${attrs}>`;
  const count=id=>(images[id]||[]).length;
  const time=seconds=>Number.isFinite(seconds)?`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`:'0:00';
  let route='',returnRoute='works',page=0,reading=false,activeTrack=-1,lastOpener=null;
  let currentCategory='all',carouselIndex=0,cmfIndex=0,cmfColor=0,noteColor='#d7e9f0';
  let notes=[],noteStatus='loading',noteReadVersion=0,draft={message:'',name:''},closing=0,toastTimer=0;
  const selections={};
  const noteColors=['#d7e9f0','#d9e9d6','#e7dff1','#f1e9c9'];
  const guestbookUrl='https://chen-xiang-guestbook.pages.dev/messages';
  const noteColorKeys=['blue','green','pink','yellow'];
  function fromGuestbookItem(item){
    return {id:item.id,message:item.body,name:item.nickname,color:noteColors[noteColorKeys.indexOf(item.color)]||noteColors[0],created_at:item.created_at};
  }
  function notify(message){const node=document.querySelector('#toast');node.textContent=message;node.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('show'),2600);}
  function open(next){if(location.hash.slice(1)===next)render(next);else location.hash=next;}
  function close(){
    clearTimeout(closing);
    panel.classList.add('is-closing');
    closing=setTimeout(()=>{
      panel.close();panel.classList.remove('is-closing');document.body.classList.remove('panel-open');
      history.pushState(null,'',location.pathname+location.search);route='';
      window.workspaceScene?.focus(null);
      lastOpener?.focus?.({preventScroll:true});
    },reduced.matches?0:190);
  }
  function display(title,kicker,html){
    clearTimeout(closing);panel.classList.remove('is-closing');
    body.querySelectorAll('video').forEach(video=>video.pause());
    document.querySelector('#panel-title').textContent=title;
    document.querySelector('#panel-kicker').textContent=kicker;
    body.innerHTML=html;body.scrollTop=0;
    if(!panel.open){lastOpener=document.activeElement;panel.showModal();document.body.classList.add('panel-open');document.querySelector('#panel-close').focus({preventScroll:true});}
  }
  function render(next){
    if(lightbox.open)lightbox.close();
    const previous=route;route=next;
    const [path,query='']=next.split('?'),parts=path.split('/'),key=parts[0],arg=parts[1];
    if(key!=='project'){body.querySelectorAll('video').forEach(video=>video.pause());}
    window.workspaceScene?.focus(({works:'basket',featured:'computer',project:'computer',about:'badge',contact:'envelope',cmf:'fan',process:'notebook',music:'turntable',compose:'typewriter',notes:'board'})[key]||null);
    if(key==='works'&&!arg)showFolders();
    else if(key==='works'||key==='featured')showCategory(key==='featured'?'featured':arg||'all');
    else if(key==='project'){
      if(previous.split('?')[0]!==path){page=Math.max(0,Number(new URLSearchParams(query).get('page'))||0);reading=false;}
      showProject(arg);
    }
    else if(key==='about')showAbout();
    else if(key==='contact')showContact();
    else if(key==='music')showMusic();
    else if(key==='cmf')showCMF();
    else if(key==='process')showProcess();
    else if(key==='compose')showCompose();
    else if(key==='notes'){showNotes();fetchNotes();}
    else{route='works';showFolders();}
  }
  function showFolders(){
    returnRoute='works';
    display('打开我的设计档案','WORK ARCHIVE / 01—05',`<section><p class="panel-intro">五个方向，一些从问题走到方案的记录。悬停文件夹，作品名称会浮出来。</p><div class="folders-display">${categories.map((c,i)=>{
      const list=projects.filter(p=>p.categories.includes(c.id));
      return `<article class="archive-folder" style="--folder:${c.color};--order:${i};--tilt:${[-4,3,-2,3,-4][i]}deg"><div class="archive-folder__back"></div><div class="archive-folder__paper"></div><div class="folder-projects">${list.map((p,j)=>`<button data-project="${p.id}" style="--slip:${j}">${esc(p.title)} ↗</button>`).join('')}</div><button class="archive-folder__front" data-route="works/${c.id}" aria-label="打开${c.title}文件夹"><span class="folder-tag">${c.english}</span><b>${c.title}</b><small>${String(list.length).padStart(2,'0')} PROJECTS / ↗</small></button></article>`;
    }).join('')}</div><div class="archive-bottom"><span>15 个项目 · ${Object.values(images).reduce((sum,list)=>sum+list.length,0)} 张展板与文档页面</span>${btn('works/all','按顺序浏览全部作品 ↗')}</div></section>`);
  }
  function showCategory(id){
    const list=id==='all'?projects:id==='featured'?projects.filter(p=>p.featured):projects.filter(p=>p.categories.includes(id));
    if(!list.length){showFolders();return;}
    currentCategory=id;returnRoute=id==='featured'?'featured':`works/${id}`;
    carouselIndex=Math.min(selections[id]||0,list.length-1);
    const title=id==='all'?'全部设计档案':id==='featured'?'屏幕上的精选作品':category(id).title;
    display(title,'SWIPE TO EXPLORE',`<section><div class="subnav">${btn('works','← 文件夹')}<span class="count-label" id="carousel-count"></span></div><div class="filter-tabs">${[{id:'all',title:'全部'},...categories].map(c=>`<button data-route="works/${c.id}" class="${id===c.id?'active':''}">${c.title}</button>`).join('')}</div><div class="work-rail" id="work-rail" role="region" aria-label="左右滑动浏览作品" tabindex="0">${list.map((p,i)=>`<article class="work-slide ${i===carouselIndex?'selected':''}" role="group" aria-label="${i+1} / ${list.length}"><button class="work-cover" data-project="${p.id}" aria-label="查看${esc(p.title)}">${assetImage(shot(p.id),i===carouselIndex?'fetchpriority="high"':'loading="lazy"',true)}</button></article>`).join('')}</div><div class="work-caption"><h3 id="carousel-title"></h3><p id="carousel-description"></p><div class="carousel-controls"><button class="arrow-button" data-slide="-1" aria-label="上一件作品">←</button><button class="primary-action" id="carousel-open">打开项目 ↗</button><button class="arrow-button" data-slide="1" aria-label="下一件作品">→</button></div><div class="carousel-dots">${list.map((p,i)=>`<button data-slide-to="${i}" aria-label="第 ${i+1} 件作品" aria-current="${i===carouselIndex}"><i></i></button>`).join('')}</div></div></section>`);
    const rail=document.querySelector('#work-rail'),items=[...rail.children];
    function select(i){
      carouselIndex=i;selections[id]=i;const p=list[i];
      document.querySelector('#carousel-count').textContent=`PROJECT ${String(i+1).padStart(2,'0')} / ${String(list.length).padStart(2,'0')}`;
      document.querySelector('#carousel-title').textContent=p.title;
      document.querySelector('#carousel-description').textContent=p.subtitle+' · '+p.summary;
      document.querySelector('#carousel-open').dataset.project=p.id;
      items.forEach((item,j)=>item.classList.toggle('selected',i===j));
      body.querySelectorAll('[data-slide-to]').forEach((b,j)=>b.setAttribute('aria-current',String(j===i)));
      body.querySelectorAll('[data-slide]').forEach(b=>b.disabled=Number(b.dataset.slide)<0?i===0:i===list.length-1);
    }
    const left=i=>items[i].offsetLeft-(rail.clientWidth-items[i].clientWidth)/2;
    rail.go=i=>{i=Math.max(0,Math.min(list.length-1,i));select(i);rail.scrollTo({left:left(i),behavior:reduced.matches?'instant':'smooth'});};
    let scrollFrame=0;
    rail.onscroll=()=>{cancelAnimationFrame(scrollFrame);scrollFrame=requestAnimationFrame(()=>{if(!rail.isConnected)return;const center=rail.scrollLeft+rail.clientWidth/2;let at=0,d=Infinity;items.forEach((item,j)=>{const next=Math.abs(item.offsetLeft+item.clientWidth/2-center);if(next<d){d=next;at=j;}});select(at);});};
    requestAnimationFrame(()=>{if(rail.isConnected){rail.scrollLeft=left(carouselIndex);select(carouselIndex);}});
    let pointer=null,start=0,startLeft=0,dragged=false;
    rail.onpointerdown=e=>{if(e.pointerType==='mouse'&&e.button===0){pointer=e.pointerId;start=e.clientX;startLeft=rail.scrollLeft;dragged=false;}};
    rail.onpointermove=e=>{if(pointer!==e.pointerId)return;const dx=e.clientX-start;if(Math.abs(dx)>7&&!dragged){dragged=true;rail.classList.add('dragging');rail.setPointerCapture(pointer);}if(dragged){e.preventDefault();rail.scrollLeft=startLeft-dx;}};
    const release=e=>{if(pointer===null)return;if(rail.hasPointerCapture(pointer))rail.releasePointerCapture(pointer);pointer=null;rail.classList.remove('dragging');if(dragged)rail.go(carouselIndex);};
    rail.onpointerup=release;rail.onpointercancel=release;rail.ondragstart=e=>e.preventDefault();
    rail.addEventListener('click',e=>{if(dragged){e.preventDefault();e.stopPropagation();dragged=false;}},true);
  }
  function showProject(id){
    const p=project(id);if(!p){showFolders();return;}
    const list=images[id]||[];page=Math.min(page,Math.max(0,list.length-1));
    const attachments=`<div class="project-attachments">${p.pdf?`<a class="secondary-action" href="${p.pdf}" target="_blank" rel="noopener">打开完整 PDF ↗</a><a class="secondary-action" href="${p.pdf}" download>下载原始文档 ↓</a>`:''}${p.external?`<a class="secondary-action" href="${esc(p.external)}" target="_blank" rel="noopener">查看 LoRA 模型主页 ↗</a>`:''}</div>${p.video?`<video class="project-video" controls preload="none" src="${p.video}" aria-label="${esc(p.title)}展示视频"></video>`:''}`;
    const mobilePreview=matchMedia('(max-width: 600px)').matches;
    const gallery=reading?`<div class="project-reading">${list.map((item,i)=>`<figure><button data-zoom="${i}" style="padding:0;width:100%" aria-label="放大第 ${i+1} 张">${assetImage(item,'loading="lazy"',mobilePreview)}</button><figcaption>${String(i+1).padStart(2,'0')} / ${list.length} · ${esc(item.label)}</figcaption></figure>`).join('')}</div>`:`<figure class="project-sheet"><button data-zoom="${page}" aria-label="放大当前项目展板">${assetImage(list[page],'fetchpriority="high"',mobilePreview)}</button><span class="zoom-hint">点击放大 ↗</span></figure><div class="sheet-controls"><button class="arrow-button" data-page="-1" aria-label="上一张项目图" ${page===0?'disabled':''}>←</button><span aria-live="polite">${page+1} / ${list.length} · ${esc(list[page].label)}</span><button class="arrow-button" data-page="1" aria-label="下一张项目图" ${page===list.length-1?'disabled':''}>→</button></div><div class="thumbnails">${list.map((item,i)=>`<button data-page-to="${i}" aria-current="${i===page}" aria-label="查看第 ${i+1} 张"><img src="${item.thumbnail||item.src}" alt="" loading="lazy"></button>`).join('')}</div>`;
    display(p.title,p.subtitle+' / '+p.categories.map(id=>category(id).english).join(' · '),`<section><div class="project-top">${btn(returnRoute,'← 返回作品展厅')}<div class="project-view"><button data-reading="false" class="${reading?'':'active'}">逐页浏览</button><button data-reading="true" class="${reading?'active':''}">连续阅读</button></div></div><p class="project-summary">${esc(p.summary)}<br><span class="count-label">${list.length} PAGES ${p.video?' / PROJECT FILM':''}</span></p>${gallery}${attachments}</section>`);
  }
  function zoom(index){
    const id=route.split('/')[1]?.split('?')[0],item=images[id]?.[index];if(!item)return;
    document.querySelector('#lightbox-title').textContent=project(id).title+' · '+item.label;
    const image=document.querySelector('#lightbox-image');image.src=item.src;image.alt=item.label;
    document.querySelector('#lightbox-zoom').value=100;image.style.setProperty('--zoom','100%');
    if(!lightbox.open)lightbox.showModal();
  }
  function showAbout(){
    display('你好，我是陈湘。','THE DESIGNER / PERSONAL ID',`<section class="profile-layout"><aside class="id-sleeve"><div class="id-slot"></div><div class="id-paper"><b>THE<br>DESIGNER</b><small>PRODUCT DESIGN / PERSONAL ID</small><img class="id-photo" src="${profile.photo}" alt="陈湘的生活照"><dl><dt>NAME</dt><dd>陈湘 / CHEN XIANG</dd><dt>FOCUS</dt><dd>产品 · 交互 · AIGC</dd><dt>EDU</dt><dd>中南大学 / 设计学</dd></dl></div></aside><div class="profile-copy"><span class="eyebrow">PRODUCT & INTERACTION DESIGN</span><h3>从想法，到可以使用的体验。</h3><p>${profile.intro}</p><div class="actions"><a class="primary-action" href="${profile.resume}" download="陈湘_产品经理.pdf">下载我的简历 ↓</a>${btn('contact','简历与联系 ↗')}</div><div class="profile-section"><h4>EDUCATION / 教育</h4><div class="timeline">${profile.education.map(([date,text])=>`<time>${date}</time><b>${text}</b>`).join('')}</div></div><div class="profile-section"><h4>EXPERIENCE / 实习</h4><div class="timeline">${profile.experience.map(([date,company,role,description])=>`<time>${date}</time><div><b>${company}</b><p>${role}<br>${description}</p></div>`).join('')}</div></div><div class="profile-section"><h4>TOOLBOX / 工具</h4><div class="skills">${profile.skills.map(skill=>`<span>${skill}</span>`).join('')}</div></div><div class="profile-section"><h4>RECOGNITION / 荣誉</h4><ul class="honors">${profile.honors.map(honor=>`<li>${honor}</li>`).join('')}</ul></div></div></section>`);
  }
  function showContact(){display('保持联系','A LETTER FROM MY DESK',`<section><p class="panel-intro">欢迎交流产品设计、交互体验与 AIGC 相关机会。</p><div class="contact-grid"><div class="contact-card"><small>EMAIL</small><a href="mailto:${profile.email}">${profile.email} ↗</a><button class="text-link" data-copy="${profile.email}">复制邮箱</button></div><div class="contact-card"><small>PHONE</small><a href="tel:+86${profile.phone}">${profile.phone} ↗</a></div></div><div class="actions"><a class="primary-action" href="${profile.resume}" download="陈湘_产品经理.pdf">下载简历 PDF ↓</a><a class="secondary-action" href="${profile.resume}" target="_blank" rel="noopener">在新窗口预览 ↗</a></div><iframe class="resume-preview" title="陈湘个人简历 PDF 预览" src="${profile.resume}#toolbar=0"></iframe></section>`);}
  function showMusic(){
    const i=activeTrack<0?0:activeTrack,track=tracks[i];
    display('从唱片架上，选一首。','DESK SESSIONS / FIVE RECORDS',`<section><p class="panel-intro">把喜欢的唱片放上唱片机。浏览作品时，音乐会继续陪着你。</p><div class="record-grid">${tracks.map((track,j)=>`<button class="record-sleeve ${j===activeTrack?'selected':''}" data-track="${j}" aria-label="播放 ${esc(track.title)}"><img src="${track.cover}" alt="${esc(track.title)}专辑封面"><b>${esc(track.title)}</b><small>${esc(track.artist)}</small></button>`).join('')}</div><div class="record-deck"><div class="record-art ${!audio.paused?'is-playing':''}" id="record-art"><img id="record-label" src="${track.cover}" alt=""></div><div class="record-controls"><h3 id="track-title">${esc(track.title)}</h3><p id="track-artist">${esc(track.artist)}</p><div class="audio-controls"><button class="arrow-button" data-track-step="-1" aria-label="上一首">←</button><button class="audio-play" data-audio-toggle aria-label="${audio.paused?'播放':'暂停'}">${audio.paused?'▶':'Ⅱ'}</button><button class="arrow-button" data-track-step="1" aria-label="下一首">→</button><label class="volume-control">音量<input data-volume type="range" min="0" max="1" step=".01" value="${audio.volume}" aria-label="音乐音量"></label></div><div class="audio-progress"><span id="audio-current">${time(audio.currentTime)}</span><input id="audio-seek" type="range" min="0" max="1000" value="0" aria-label="音乐播放进度"><span id="audio-duration">${time(audio.duration)}</span></div><div class="audio-status" id="audio-status" role="status">${activeTrack<0?'点一张封面，开始播放。':audio.paused?'唱片已暂停。':'正在播放。'}</div></div></div><div class="actions" style="margin-top:20px"><button class="text-link" id="turntable-lid">${window.workspaceScene?.isLidClosed?.()?'打开唱片机箱盖':'合上唱片机箱盖'}</button></div></section>`);
    updateAudioUI();
  }
  function chooseTrack(i){
    i=(i+tracks.length)%tracks.length;const changed=i!==activeTrack;activeTrack=i;
    if(changed){audio.src=tracks[i].src;window.workspaceScene?.putRecord(i);}
    window.workspaceScene?.setLid(false);
    const attempt=audio.play();
    attempt?.catch(error=>{if(error.name!=='AbortError'){notify('音频暂时未能播放，请点击播放重试。');const status=document.querySelector('#audio-status');if(status)status.textContent='请点击播放按钮重试。';}});
    if(route==='music')showMusic();
    updateAudioUI();
  }
  function toggleAudio(){if(activeTrack<0){chooseTrack(0);return;}if(audio.paused){window.workspaceScene?.setLid(false);audio.play().catch(()=>notify('请重新选择唱片。'));}else audio.pause();}
  function updateAudioUI(){
    const playing=!audio.paused&&!audio.ended,track=tracks[Math.max(0,activeTrack)];
    document.body.classList.toggle('has-audio',activeTrack>=0);
    window.workspaceScene?.setPlaying(playing);
    const mini=document.querySelector('#mini-player');mini.hidden=activeTrack<0;mini.classList.toggle('is-playing',playing);
    document.querySelector('#mini-cover').src=track.cover;
    document.querySelector('#mini-title').textContent=track.title;
    document.querySelector('#mini-artist').textContent=track.artist;
    document.querySelectorAll('[data-audio-toggle]').forEach(b=>{b.textContent=playing?'Ⅱ':'▶';b.setAttribute('aria-label',playing?'暂停音乐':'播放音乐');});
    const art=document.querySelector('#record-art');art?.classList.toggle('is-playing',playing);
    const current=document.querySelector('#audio-current'),duration=document.querySelector('#audio-duration'),seek=document.querySelector('#audio-seek');
    if(current)current.textContent=time(audio.currentTime);if(duration)duration.textContent=time(audio.duration);
    if(seek&&Number.isFinite(audio.duration)&&document.activeElement!==seek)seek.value=String(audio.currentTime/audio.duration*1000);
    const status=document.querySelector('#audio-status');if(status&&activeTrack>=0)status.textContent=playing?'正在播放。':'唱片已暂停。';
  }
  audio.volume=.45;audio.preload='metadata';
  ['play','pause','playing','loadedmetadata','durationchange','timeupdate'].forEach(event=>audio.addEventListener(event,updateAudioUI));
  audio.addEventListener('ended',()=>chooseTrack((activeTrack+1)%tracks.length));
  audio.addEventListener('error',()=>{const node=document.querySelector('#audio-status');if(node)node.textContent='这首音乐未能载入，请重试或换一张唱片。';notify('音乐载入失败，请重新选择唱片。');window.workspaceScene?.setPlaying(false);});
  document.addEventListener('play',event=>{if(event.target.tagName==='VIDEO')audio.pause();},true);
  function showCMF(){
    const entry=cmf[cmfIndex];cmfColor=Math.min(cmfColor,entry.colors.length-1);const [name,color]=entry.colors[cmfColor];
    display('颜色，材料，与触感','CMF / COLOUR FIELD NOTES',`<section><div class="filter-tabs">${cmf.map((item,i)=>`<button data-cmf="${i}" class="${i===cmfIndex?'active':''}">${item.title}</button>`).join('')}</div><div class="cmf-layout" style="margin-top:25px"><div>${assetImage(shot(entry.id,entry.image),'class="cmf-image"',matchMedia('(max-width: 600px)').matches)}<div class="cmf-cards">${entry.colors.map(([label,hex],i)=>`<button class="cmf-swatch ${i===cmfColor?'selected':''}" data-cmf-color="${i}" style="--color:${hex};--tilt:${[-3,2,-1,3][i]}deg"><i></i><span>${label}<small>${hex.toUpperCase()}</small></span></button>`).join('')}</div></div><div><span class="eyebrow">${project(entry.id).title} / MATERIAL STUDY</span><h3 class="cmf-material">${entry.material}</h3><p class="cmf-note">色卡用于呈现展板中的色彩方向。屏幕色值为示意取色，不作为实体印刷标准。</p><div class="cmf-selected" style="--color:${color}"><i></i><p>${name}<br><button class="text-link" data-copy="${color}">复制 ${color.toUpperCase()}</button></p></div>${btn('project/'+entry.id,'查看相关项目 ↗','secondary-action')}</div></div></section>`);
  }
  function showProcess(){
    const ids=['dayibu','tea','robot','train','hike','research'];
    display('翻一翻设计过程','SKETCHBOOK / FROM QUESTIONS TO FORMS',`<section><p class="panel-intro">调研、用户画像、造型与方案推演。这里引用项目中的原始过程资料。</p><div class="process-index">${ids.map(id=>{const p=project(id),index=id==='dayibu'?2:id==='tea'?4:1;return `<button class="process-card" data-process="${id}" data-page-start="${index}">${assetImage(shot(id,index),'loading="lazy"',true)}<span><b>${p.title}</b><small>${count(id)} 张项目图与过程页面 ↗</small></span></button>`;}).join('')}</div></section>`);
  }
  async function fetchNotes(){
    const version=++noteReadVersion;
    try{
      const response=await fetch(guestbookUrl,{cache:'no-store',signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw Error();
      const data=await response.json();
      if(!Array.isArray(data.items))throw Error();
      if(version!==noteReadVersion)return;
      notes=data.items.map(fromGuestbookItem);
      noteStatus='ready';
    }catch{
      if(version!==noteReadVersion)return;
      noteStatus='unavailable';
    }
    window.workspaceScene?.setNotes(notes);
    if(route==='notes')showNotes();
  }
  function notesMarkup(){return notes.length?notes.map((note,i)=>`<article class="guest-note" style="--note:${noteColors.includes(note.color)?note.color:noteColors[0]};--tilt:${[-3,2,-1,3,0][i%5]}deg">${esc(note.message)}<small>— ${esc(note.name||'路过的朋友')}<br>${note.created_at?esc(new Date(note.created_at).toLocaleDateString('zh-CN')):''}</small></article>`).join(''):'<p class="notes-empty">毛毡板上还没有留言。<br>去打字机上，留下第一张纸条吧。</p>';}
  function showNotes(){display('留在工作台上的话','THE FELT BOARD / LITTLE HELLOS',`<section><div class="subnav">${btn('compose','写一张留言 ↗','primary-action')}<span class="count-label">${notes.length} NOTES</span></div><p class="panel-intro">${noteStatus==='ready'?'这里是访问者留下的纸条。':noteStatus==='unavailable'?'暂时连不上留言板。关闭后重新打开即可重试。':'正在打开留言板…'}</p><div class="guestboard">${noteStatus==='ready'||notes.length?notesMarkup():''}</div></section>`);}
  function showCompose(){display('打几行字，留在这里。','TYPE A LITTLE NOTE',`<section class="typewriter-layout"><form class="typing-form typing-machine" id="note-form"><div class="typing-paper"><small>A NOTE FROM YOUR VISIT</small><label><span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden">留言内容</span><textarea name="message" required maxlength="120" placeholder="今天想留下什么？">${esc(draft.message)}</textarea></label><div class="typing-meta"><label>署名（选填）<input name="nickname" maxlength="20" value="${esc(draft.name)}" placeholder="路过的朋友"></label><span class="typing-count" id="typing-count">${draft.message.length} / 120</span></div><div class="note-colors" aria-label="纸张颜色">${noteColors.map((color,i)=>`<button type="button" data-note-color="${color}" style="--color:${color}" aria-label="纸张颜色 ${['蓝','绿','紫','黄'][i]}" aria-pressed="${color===noteColor}"></button>`).join('')}</div></div><div class="typing-keys" aria-hidden="true">${[...'HELLOCHENXIANG'].map(char=>`<i>${char}</i>`).join('')}</div><div class="actions" style="justify-content:center"><button class="primary-action" type="submit" id="note-submit">贴到毛毡板 ↗</button></div><p class="form-status" id="note-form-status" role="status"></p></form><aside class="typing-aside"><span class="eyebrow">MAKE YOURSELF AT HOME</span><h3>一张小纸条，<br>一次相遇的记录。</h3><p>写下灵感、感受，或者只是打个招呼。提交后，纸条会贴到工作台上方的毛毡板。</p><p>留言会在这个网站的留言板中公开展示。</p>${btn('notes','看看大家的留言 ↗')}</aside></section>`);}
  async function submitNote(form){
    const message=form.elements.message.value.trim(),name=form.elements.nickname.value.trim()||'路过的朋友';
    const status=document.querySelector('#note-form-status'),button=document.querySelector('#note-submit');
    if(!message){status.textContent='先写下一点内容吧。';return;}
    button.disabled=true;button.textContent='正在送出纸条…';status.textContent='';
    try{
      const response=await fetch(guestbookUrl,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({body:message,nickname:name,color:noteColorKeys[noteColors.indexOf(noteColor)]}),
        signal:AbortSignal.timeout(12000)
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.item)throw Error(data.error||'暂时未能发布留言，请重试。');
      const note=fromGuestbookItem(data.item);
      ++noteReadVersion;
      noteStatus='ready';
      if(!form.isConnected){notes=[note,...notes].slice(0,40);window.workspaceScene?.setNotes(notes);return;}
      notes=[note,...notes].slice(0,40);draft={message:'',name:''};window.workspaceScene?.setNotes(notes);window.workspaceScene?.focus('board');
      const rect=form.querySelector('.typing-paper').getBoundingClientRect();
      const stage=document.createElement('dialog');stage.className='paper-stage';stage.setAttribute('aria-label','纸条正在贴到毛毡板');
      const paper=document.createElement('div');paper.className='paper-flight';paper.style.setProperty('--note',noteColor);paper.style.left=rect.left+rect.width/2-70+'px';paper.style.top=rect.top+30+'px';paper.style.width='140px';paper.textContent=message;stage.append(paper);document.body.append(stage);stage.showModal();
      const destination={x:innerWidth*.52,y:innerHeight*.44};
      requestAnimationFrame(()=>requestAnimationFrame(()=>{paper.style.transform=`translate(${destination.x-(rect.left+rect.width/2)}px,${destination.y-(rect.top+80)}px) rotate(-8deg) scale(.28)`;paper.style.opacity='.2';}));
      setTimeout(()=>{stage.close();stage.remove();close();notify('纸条已经贴到毛毡板上了。');},reduced.matches?100:850);
    }catch(error){status.textContent=error instanceof TypeError||error.name==='TimeoutError'?'暂时连不上留言板，文字仍保留在输入框。':error.message||'保存失败，文字仍保留在输入框。';status.classList.add('form-error');button.disabled=false;button.textContent='重新提交 ↗';}
  }
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.route){event.preventDefault();open(b.dataset.route);}
    if(b.dataset.project){returnRoute=route.startsWith('works')||route==='featured'?route:returnRoute;open('project/'+b.dataset.project);}
    if(b.dataset.process){returnRoute='process';open('project/'+b.dataset.process+'?page='+b.dataset.pageStart);}
    if(b.dataset.slide!==undefined)document.querySelector('#work-rail')?.go(carouselIndex+Number(b.dataset.slide));
    if(b.dataset.slideTo!==undefined)document.querySelector('#work-rail')?.go(Number(b.dataset.slideTo));
    if(b.dataset.page!==undefined){page+=Number(b.dataset.page);showProject(route.split('/')[1].split('?')[0]);}
    if(b.dataset.pageTo!==undefined){page=Number(b.dataset.pageTo);showProject(route.split('/')[1].split('?')[0]);body.querySelector(`[data-page-to="${page}"]`)?.scrollIntoView({block:'nearest',inline:'center'});}
    if(b.dataset.reading!==undefined){reading=b.dataset.reading==='true';showProject(route.split('/')[1].split('?')[0]);}
    if(b.dataset.zoom!==undefined)zoom(Number(b.dataset.zoom));
    if(b.dataset.track!==undefined){chooseTrack(Number(b.dataset.track));setTimeout(close,reduced.matches?0:90);}
    if(b.hasAttribute('data-audio-toggle'))toggleAudio();
    if(b.dataset.trackStep!==undefined)chooseTrack(Math.max(0,activeTrack)+Number(b.dataset.trackStep));
    if(b.dataset.cmf!==undefined){cmfIndex=Number(b.dataset.cmf);cmfColor=0;showCMF();}
    if(b.dataset.cmfColor!==undefined){cmfColor=Number(b.dataset.cmfColor);showCMF();}
    if(b.dataset.noteColor){noteColor=b.dataset.noteColor;body.querySelectorAll('[data-note-color]').forEach(node=>node.setAttribute('aria-pressed',String(node===b)));}
    if(b.dataset.copy){if(navigator.clipboard)navigator.clipboard.writeText(b.dataset.copy).then(()=>notify('已复制 '+b.dataset.copy)).catch(()=>notify('请手动复制：'+b.dataset.copy));else notify('请手动复制：'+b.dataset.copy);}
    if(b.id==='turntable-lid'){const closed=!window.workspaceScene?.isLidClosed?.();window.workspaceScene?.setLid(closed);if(closed)audio.pause();b.textContent=closed?'打开唱片机箱盖':'合上唱片机箱盖';}
  });
  document.addEventListener('input',event=>{
    if(event.target.matches('[data-volume]')){audio.volume=Number(event.target.value);return;}
    if(event.target.id==='audio-seek'){if(Number.isFinite(audio.duration))audio.currentTime=Number(event.target.value)/1000*audio.duration;return;}
    const form=event.target.closest('#note-form');if(form){draft={message:form.elements.message.value,name:form.elements.nickname.value};document.querySelector('#typing-count').textContent=draft.message.length+' / 120';form.classList.remove('is-typing');void form.offsetWidth;form.classList.add('is-typing');}
    if(event.target.id==='lightbox-zoom')document.querySelector('#lightbox-image').style.setProperty('--zoom',event.target.value+'%');
  });
  document.addEventListener('submit',event=>{if(event.target.id==='note-form'){event.preventDefault();submitNote(event.target);}});
  document.querySelector('#panel-close').onclick=close;
  panel.addEventListener('cancel',event=>{event.preventDefault();close();});
  panel.addEventListener('click',event=>{if(event.target===panel){const r=panel.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
  document.querySelector('#lightbox-close').onclick=()=>lightbox.close();
  lightbox.addEventListener('close',()=>document.querySelector('#lightbox-image').removeAttribute('src'));
  document.addEventListener('keydown',event=>{
    if(!panel.open||lightbox.open||!['ArrowLeft','ArrowRight'].includes(event.key)||event.target.closest('input,textarea,video,select'))return;
    const direction=event.key==='ArrowRight'?1:-1;
    if(route.startsWith('works/')||route==='featured'){event.preventDefault();document.querySelector('#work-rail')?.go(carouselIndex+direction);}
    if(route.startsWith('project/')&&!reading){event.preventDefault();const id=route.split('/')[1].split('?')[0];page=Math.max(0,Math.min(count(id)-1,page+direction));showProject(id);}
  });
  window.addEventListener('hashchange',()=>{const hash=location.hash.slice(1);if(hash)render(hash);else if(panel.open){panel.close();document.body.classList.remove('panel-open');route='';window.workspaceScene?.focus(null);}});
  window.addEventListener('workspace:entered',()=>{if(location.hash.length>1)render(location.hash.slice(1));});
  window.portfolioApp={open,close,chooseTrack,notify,notes:()=>notes};
  window.addEventListener('workspace:scene-ready',()=>window.workspaceScene?.setNotes(notes));
  window.addEventListener('workspace:entered',()=>{if(route!=='notes')fetchNotes();});
})();
