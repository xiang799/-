window.createDeskExperience=function(T,{scene,camera,canvas,studio,computer,typewriter,basket,fan,turntable,display,badge,objects,editing}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const mat=(color,roughness=.7,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const paper=mat('#f8faf5'),blue=mat('#a8d9e4'),silver=mat('#bfced3',.3,.6);
 const mesh=(geo,material,parent,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,material);m.position.set(x,y,z);parent.add(m);return m;};
 function texture(width,height,draw){const c=document.createElement('canvas');c.width=width;c.height=height;draw(c.getContext('2d'));const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
 function rounded(w,h,d,r,material,parent){const s=new T.Shape(),a=w/2,b=h/2;s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.quadraticCurveTo(a,-b,a,-b+r);s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);s.lineTo(-a+r,b);s.quadraticCurveTo(-a,b,-a,b-r);s.lineTo(-a,-b+r);s.quadraticCurveTo(-a,-b,-a+r,-b);const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:2,curveSegments:8});g.translate(0,0,-d/2);return mesh(g,material,parent);}
 const notebook=new T.Group();notebook.name='ProcessSketchbook';notebook.position.set(-16,75.7,22);notebook.rotation.y=-.15;scene.add(notebook);
 const cover=rounded(17,12,.65,.5,blue,notebook);cover.rotation.x=-Math.PI/2;
 mesh(new T.BoxGeometry(15.7,.38,10.8),paper,notebook,0,.12,0);
 const coverArt=texture(510,360,c=>{c.fillStyle='#b8e1e9';c.fillRect(0,0,510,360);c.fillStyle='#507c8a';c.font='600 30px Consolas';c.fillText('PROCESS',48,82);c.font='16px Consolas';c.fillText('SKETCHES / FIELD NOTES',48,112);c.strokeStyle='#80b2c1';c.lineWidth=2;c.strokeRect(275,165,140,110);c.beginPath();c.ellipse(327,222,43,24,-.3,0,Math.PI*2);c.stroke();});
 const np=mesh(new T.PlaneGeometry(17,12),new T.MeshBasicMaterial({map:coverArt}),notebook,0,.4,0);np.rotation.x=-Math.PI/2;
 for(let i=0;i<6;i++){const ring=mesh(new T.TorusGeometry(.37,.06,6,14),silver,notebook,-7.5,.47,-4.4+i*1.75);ring.rotation.y=Math.PI/2;}
 const envelope=new T.Group();envelope.name='ResumeEnvelope';envelope.position.set(47,76.1,25);envelope.rotation.set(-Math.PI/2,0,.12);scene.add(envelope);
 rounded(14,9,.24,.3,paper,envelope);
 const envArt=texture(560,360,c=>{c.fillStyle='#f8faf5';c.fillRect(0,0,560,360);c.strokeStyle='#aac4ce';c.lineWidth=3;c.beginPath();c.moveTo(0,0);c.lineTo(280,210);c.lineTo(560,0);c.moveTo(0,360);c.lineTo(220,190);c.moveTo(560,360);c.lineTo(340,190);c.stroke();c.fillStyle='#86b2c2';c.font='24px Consolas';c.fillText('RESUME',217,300);});
 mesh(new T.PlaneGeometry(14,9),new T.MeshBasicMaterial({map:envArt}),envelope,0,0,.16);
 const board=new T.Group();board.name='FeltGuestbook';board.position.set(25,116,-53);scene.add(board);
 const felt=texture(600,360,c=>{c.fillStyle='#d6ded6';c.fillRect(0,0,600,360);c.strokeStyle='#c2cec3';c.globalAlpha=.3;for(let x=0;x<600;x+=4){c.beginPath();c.moveTo(x,0);c.lineTo(x,360);c.stroke();}for(let y=0;y<360;y+=4){c.beginPath();c.moveTo(0,y);c.lineTo(600,y);c.stroke();}});
 rounded(55,33,1.2,1.2,mat('#e8ece5'),board);
 mesh(new T.PlaneGeometry(52.6,30.6),new T.MeshStandardMaterial({map:felt,roughness:1}),board,0,0,.67);
 for(const x of [-18,18])mesh(new T.CylinderGeometry(.35,.35,26,12),silver,board,x,-29,0);
 const noteRoot=new T.Group();noteRoot.name='VisitorNotes';board.add(noteRoot);
 const mug=new T.Group();mug.name='CoffeeBreak';mug.position.set(-69,75,3);scene.add(mug);
 const profile=[[0,0],[1.9,0],[2.4,.4],[2.5,4.2],[2.1,4.2],[2.0,.6],[0,.6]].map(p=>new T.Vector2(...p));
 mesh(new T.LatheGeometry(profile,32),mat('#f4f7ef',.35),mug);
 mesh(new T.CylinderGeometry(2.05,2.05,.05,32),mat('#765941'),mug,0,3.6,0);
 const handle=mesh(new T.TorusGeometry(1.25,.35,10,24),paper,mug,2.55,2.1,0);handle.scale.x=.8;
 const descriptors={computer:['精选作品','featured'],typewriter:['写一张留言','compose'],basket:['设计档案','works'],fan:['色卡与材质','cmf'],turntable:['黑胶唱片机','music'],records:['选一张唱片','music'],badge:['关于陈湘','about'],lamp:['开关台灯','lamp'],notebook:['设计过程','process'],envelope:['简历与联系','contact'],board:['毛毡留言板','notes'],coffee:['听歌，休息一下','music']};
 const targets={computer,typewriter,basket,fan:fan.root,turntable:turntable.root,records:display,badge,lamp:studio.lamp,notebook,envelope,board,coffee:mug};
 const baseScales=Object.fromEntries(Object.entries(targets).map(([key,obj])=>[key,obj.scale.clone()]));
 const ray=new T.Raycaster(),pointer=new T.Vector2(),tooltip=document.querySelector('#scene-tooltip');
 let hovered=null,focusKey=null,playing=false,lidClosed=false,flight=null,last=performance.now();
 const cache=new Map(),loader=new T.TextureLoader();
 const recordLabel=mesh(new T.CircleGeometry(3.68,48),new T.MeshBasicMaterial({color:'#a7d6e4'}),turntable.platter,0,.525,0);recordLabel.rotation.x=-Math.PI/2;
 const labels=document.querySelector('#scene-labels');
 for(const key of ['basket','badge','computer','turntable','typewriter','fan','notebook','envelope','board']){const b=document.createElement('button');b.className='scene-label';b.textContent=descriptors[key][0];b.dataset.route=descriptors[key][1];b.dataset.anchor=key;labels.append(b);}
 function center(key){const o=targets[key];if(!o)return null;return new T.Box3().setFromObject(o).getCenter(new T.Vector3());}
 function screenPoint(key){const p=center(key);if(!p)return null;p.project(camera);const r=canvas.getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};}
 function hit(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const result=ray.intersectObjects(Object.values(targets),true)[0];if(!result)return null;let node=result.object,key;while(node&&!key){key=Object.keys(targets).find(k=>targets[k]===node);if(!key)node=node.parent;}return key?{key,hit:result.object}:null;}
 let lastHover=0,down=null;
 if(!editing){
  canvas.addEventListener('pointermove',event=>{if(performance.now()-lastHover<35||document.querySelector('#content-panel').open)return;lastHover=performance.now();const result=hit(event);hovered=result?.key||null;canvas.style.cursor=hovered?'pointer':'default';tooltip.classList.toggle('visible',!!hovered);if(hovered){tooltip.textContent=descriptors[hovered][0]+' ↗';const r=canvas.getBoundingClientRect();tooltip.style.left=event.clientX-r.left+'px';tooltip.style.top=event.clientY-r.top+'px';}});
  canvas.addEventListener('pointerleave',()=>{hovered=null;tooltip.classList.remove('visible');});
  canvas.addEventListener('pointerdown',event=>{down={x:event.clientX,y:event.clientY};});
  canvas.addEventListener('click',event=>{if(down&&Math.hypot(event.clientX-down.x,event.clientY-down.y)>8)return;const result=hit(event);if(!result)return;const {key}=result;hovered=null;tooltip.classList.remove('visible');if(key==='lamp'){document.querySelector('#lamp').click();return;}if(key==='records'){let node=result.hit;while(node&&node.userData.trackIndex===undefined)node=node.parent;if(node){window.portfolioApp.chooseTrack(node.userData.trackIndex);window.portfolioApp.notify('正在播放 · '+window.turntablePlaylist[node.userData.trackIndex].title);return;}}if(key==='basket'){let node=result.hit;while(node&&!/^PortfolioFolder/.test(node.name))node=node.parent;if(node){const index=Number(node.name.replace('PortfolioFolder',''))-1;window.portfolioApp.open('works/'+window.portfolioContent.categories[index].id);return;}}window.portfolioApp.open(descriptors[key][1]);});
 }
 function setNotes(notes){
  for(const child of [...noteRoot.children]){child.geometry.dispose();child.material.map?.dispose();child.material.dispose();noteRoot.remove(child);}
  const list=notes.slice(0,6);
  if(!list.length){const t=texture(500,150,c=>{c.fillStyle='#93a89f';c.font='24px Microsoft YaHei';c.textAlign='center';c.fillText('留一点灵感在这里',250,70);c.font='14px Consolas';c.fillText('A NOTE FROM YOUR VISIT',250,105);});mesh(new T.PlaneGeometry(37,11),new T.MeshBasicMaterial({map:t,transparent:true}),noteRoot,0,0,.76);return;}
  list.forEach((note,i)=>{
   const t=texture(300,300,c=>{c.fillStyle=['#d7e9f0','#d9e9d6','#e7dff1','#f1e9c9'].includes(note.color)?note.color:'#d7e9f0';c.fillRect(0,0,300,300);c.fillStyle='#667c82';c.font='20px Microsoft YaHei';const chars=[...note.message].slice(0,60);for(let row=0;row<6;row++)c.fillText(chars.slice(row*9,row*9+9).join(''),23,65+row*29);c.font='15px Microsoft YaHei';c.fillText('— '+String(note.name||'朋友').slice(0,12),25,271);c.fillStyle='#91a6aa';c.beginPath();c.arc(150,12,5,0,Math.PI*2);c.fill();});
   const n=mesh(new T.PlaneGeometry(13,12.3),new T.MeshBasicMaterial({map:t}),noteRoot,(i%3-1)*16,7.3-Math.floor(i/3)*14.5,.83+i*.002);n.rotation.z=[-.07,.04,-.02,.05,-.05,.02][i];
  });
 }
 function coverTexture(index){if(cache.has(index))return cache.get(index);const texture=loader.load(window.turntablePlaylist[index].cover);texture.colorSpace=T.SRGBColorSpace;cache.set(index,texture);return texture;}
 function putRecord(index){
  lidClosed=false;
  if(flight){scene.remove(flight.object);flight.object.traverse(o=>{o.geometry?.dispose();if(o.material&&!o.material.map)o.material.dispose();});flight=null;}
  const texture=coverTexture(index);
  if(reduced.matches){recordLabel.material.map=texture;recordLabel.material.needsUpdate=true;return;}
  const o=new T.Group();
  mesh(new T.CylinderGeometry(6,6,.17,64),mat('#20333c',.32),o);
  const label=mesh(new T.CircleGeometry(2.1,32),new T.MeshBasicMaterial({map:texture}),o,0,.1,0);label.rotation.x=-Math.PI/2;
  display.updateWorldMatrix(true,true);turntable.root.updateWorldMatrix(true,true);
  const source=display.children[index];const start=source.getWorldPosition(new T.Vector3());start.y-=3;
  const end=turntable.platter.getWorldPosition(new T.Vector3());end.y+=.7;
  o.position.copy(start);o.rotation.x=Math.PI/2;scene.add(o);
  const coverSize=source.children.find(child=>child.geometry?.type==='BoxGeometry')?.geometry.parameters.width||14;
  flight={object:o,start,end,at:performance.now(),texture,startScale:coverSize*.46*display.scale.x/6,endScale:12.3*turntable.root.scale.x/6};
 }
 function update(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;const k=reduced.matches?1:1-Math.exp(-dt*8);
  turntable.lid.rotation.x+=((lidClosed?Math.PI/2:-.18)-turntable.lid.rotation.x)*k;
  turntable.arm.rotation.y+=((playing?-.85:-.19)-turntable.arm.rotation.y)*k;
  turntable.lift.rotation.x+=((playing?0:-.035)-turntable.lift.rotation.x)*k;
  if(playing&&!reduced.matches)turntable.platter.rotation.y+=dt*3.49;
  if(!editing)for(const [key,obj] of Object.entries(targets)){const s=baseScales[key],factor=key===hovered&&key!=='lamp'?1.014:1;obj.scale.lerp(s.clone().multiplyScalar(factor),k);}
  if(flight){const progress=Math.min(1,(now-flight.at)/1150),e=progress*progress*(3-2*progress);flight.object.position.lerpVectors(flight.start,flight.end,e);flight.object.position.y+=Math.sin(progress*Math.PI)*24;flight.object.rotation.x=(1-e)*Math.PI/2;flight.object.scale.setScalar(T.MathUtils.lerp(flight.startScale,flight.endScale,e));if(progress===1){recordLabel.material.map=flight.texture;recordLabel.material.needsUpdate=true;scene.remove(flight.object);flight.object.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});flight=null;}}
  if(!labels.hidden)for(const b of labels.children){const p=screenPoint(b.dataset.anchor);const r=canvas.getBoundingClientRect();b.style.left=p.x-r.left+'px';b.style.top=p.y-r.top+'px';}
 }
 const api={focus:key=>{focusKey=targets[key]?key:null;hovered=null;tooltip.classList.remove('visible');},focused:()=>focusKey?{key:focusKey,center:center(focusKey),size:new T.Box3().setFromObject(targets[focusKey]).getSize(new T.Vector3())}:null,update,putRecord,setPlaying:value=>playing=value,setLid:value=>lidClosed=value,isLidClosed:()=>lidClosed,setNotes,screenPoint};
 setNotes(window.portfolioApp?.notes()||[]);
 window.workspaceScene=api;window.dispatchEvent(new CustomEvent('workspace:scene-ready'));
 document.querySelector('#toggle-labels').onclick=event=>{labels.hidden=!labels.hidden;event.currentTarget.setAttribute('aria-pressed',String(!labels.hidden));};
 return api;
};
