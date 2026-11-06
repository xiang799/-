window.createWorkspaceRoom=function(T){
 const room=new T.Group();room.name='WarmWhiteRoom';
 const mat=(c,r=.85)=>new T.MeshStandardMaterial({color:c,roughness:r});
 const cream=mat('#eee5d3'),trim=mat('#fbf5e6'),wood=mat('#bea17b'),green=mat('#3e673b'),greenLight=mat('#5b7a40');
 function mesh(geo,m,p,x,y,z){const o=new T.Mesh(geo,m);o.position.set(x,y,z);p.add(o);return o;}
 const box=(w,h,d,m,p,x,y,z)=>mesh(new T.BoxGeometry(w,h,d),m,p,x,y,z);

 const plant=new T.Group();plant.name='MonsteraPlant';plant.position.set(107,0,-20);room.add(plant);
 const pot=mat('#d8cdb2');
 const potProfile=[[0,0],[11,0],[13,2],[16,27],[16,29],[14.5,29],[13.2,4],[0,4]].map(p=>new T.Vector2(...p));
 mesh(new T.LatheGeometry(potProfile,48),pot,plant,0,0,0);
 mesh(new T.CylinderGeometry(14,14,.45,40),mat('#514534'),plant,0,26,0);
 function leafShape(){
  const shape=new T.Shape();
  shape.moveTo(0,-13);shape.bezierCurveTo(-4,-11,-12,-8,-14,-1);
  shape.bezierCurveTo(-17,6,-10,15,-5,15);shape.bezierCurveTo(-2,15,0,10,0,9);
  shape.bezierCurveTo(0,10,2,15,5,15);shape.bezierCurveTo(10,15,17,6,14,-1);
  shape.bezierCurveTo(12,-8,4,-11,0,-13);
  for(const sign of [-1,1])for(let i=0;i<3;i++){
   const hole=new T.Path();hole.absellipse(sign*(5.0+i*.9),-5+i*5.3,1.0,3.0,-sign*.73,0,Math.PI*2,true);shape.holes.push(hole);
  }
  return shape;
 }
 const leaves=[[-23,92,6,.9,-.45],[26,104,-8,1.03,.55],[-5,132,-3,1.13,-.12],[27,72,20,.81,.65],[-28,68,23,.82,-.65],[11,117,16,.99,.29],[4,81,-20,.85,.10]];
 leaves.forEach(([x,y,z,scale,tilt],i)=>{
  const curve=new T.CatmullRomCurve3([[0,26,0],[x*.3,y*.56,z*.3],[x*.8,y-18,z*.85],[x,y-11,z]].map(p=>new T.Vector3(...p)));
  mesh(new T.TubeGeometry(curve,28,.40,8),green,plant,0,0,0);
  const geometry=new T.ShapeGeometry(leafShape(),24),p=geometry.attributes.position;
  for(let j=0;j<p.count;j++){const xx=p.getX(j),yy=p.getY(j);p.setZ(j,1.8*(xx/15)**2+.07*yy);}
  geometry.computeVertexNormals();
  const material=(i%2?green:greenLight).clone();material.side=T.DoubleSide;
  const leaf=mesh(geometry,material,plant,x,y,z);leaf.scale.setScalar(scale);leaf.rotation.z=tilt;leaf.rotation.x=-.25;leaf.castShadow=true;
  const vein=new T.CatmullRomCurve3([[0,-12,-.8],[0,0,.06],[0,12,.9]].map(p=>new T.Vector3(...p)));
  const rib=new T.Mesh(new T.TubeGeometry(vein,10,.12,6),mat('#92a66a'));leaf.add(rib);
 });
 return {room,plant};
};
(async()=>{
 const T=window.THREE,host=document.querySelector('#view'),status=document.querySelector('#status');
 const fallback=document.querySelector('#scene-fallback');
 const fallbackMessage=document.querySelector('#scene-fallback-message');
 function showFallback(message){
  host.dataset.scene='fallback';fallback.hidden=false;fallbackMessage.textContent=message;
  document.querySelectorAll('[data-view],#lamp,#toggle-labels').forEach(button=>button.disabled=true);
 }
 function showScene(){
  host.dataset.scene='ready';fallback.hidden=true;
  document.querySelectorAll('[data-view],#lamp,#toggle-labels').forEach(button=>button.disabled=false);
 }
 try{
  window.WorkspaceLoading?.update(82,'正在布置桌面物件…');
  const mobile=matchMedia('(pointer: coarse)').matches || innerWidth<=600;
  const renderer=new T.WebGLRenderer({alpha:false,antialias:!mobile,powerPreference:'default'});
  renderer.setClearColor('#ffffff');
  let contextLost=false, recovered=false, firstFrame=true, needsFrame=false;
  let resizeScene=()=>{};
  renderer.domElement.addEventListener('webglcontextlost',event=>{
   event.preventDefault();contextLost=true;firstFrame=true;
   if(host.dataset.scene==='ready')showFallback('3D 工作台正在恢复，你可以先浏览作品。');
  });
  renderer.domElement.addEventListener('webglcontextrestored',()=>{
   contextLost=false;recovered=true;resizeScene();
  });
  renderer.shadowMap.enabled=false;renderer.shadowMap.type=T.PCFSoftShadowMap;
  host.prepend(renderer.domElement);
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-175,175,140,-140,.1,1200);
  const studio=window.createStudioWorkspace(T),{room,plant}=window.createWorkspaceRoom(T);
  window.WorkspaceLoading?.update(86,'正在摆好电脑和打字机…');
  studio.tray.position.set(54,75,18);studio.tray.scale.setScalar(.77);
  studio.print.position.set(54,75,-24);studio.print.scale.setScalar(.75);
  studio.lamp.position.set(-59,75,-20);studio.lamp.scale.setScalar(.83);
  scene.add(studio.root,room);
  const computer=window.createRetroComputer(T);computer.position.set(-10,75,-2);computer.scale.setScalar(.84);scene.add(computer);
  const typewriter=window.createTypewriter(T);typewriter.position.set(-43,75,12);typewriter.scale.setScalar(.60);typewriter.rotation.y=.10;scene.add(typewriter);
  const basket=window.createPortfolioBookends(T);basket.position.set(43,75,-16);basket.scale.setScalar(.68);basket.rotation.y=-.12;scene.add(basket);
  const fan=window.createColorFan(T);fan.root.scale.setScalar(.48);fan.root.position.set(13,75.75,21);fan.root.rotation.x=-Math.PI/2;fan.root.rotation.z=.12;
  fan.strips.forEach((s,i)=>s.rotation.z=i===12?.09:-(12-i)*.124);scene.add(fan.root);
  const turntable=window.createSuitcaseTurntable(T);turntable.root.position.set(-109,56,4);turntable.root.scale.setScalar(.91);turntable.root.rotation.y=.16;scene.add(turntable.root);
  window.applyTurntableDecals(T,turntable.lid).catch(error=>console.warn('Sticker decoration unavailable',error));
  const display=window.createRecordDisplay(T,{position:[-102,103,-48],records:window.turntablePlaylist});
  display.scale.setScalar(.94);scene.add(display);
  const badge=await window.createDesignerBadge(T);badge.position.set(-39,112,-49.5);badge.scale.setScalar(1.35);badge.rotation.z=-.09;scene.add(badge);
  window.WorkspaceLoading?.update(92,'正在放好唱片和 ID 卡…');
  // A narrow side table gives the record player its own movable surface.
  const stand=new T.Group();stand.name='RecordSideTable';stand.position.set(-109,0,4);scene.add(stand);
  const steel=new T.MeshStandardMaterial({color:'#aebdc0',metalness:.65,roughness:.32}),dark=new T.MeshStandardMaterial({color:'#303535',roughness:.65});
  const box=(w,h,d,m,x,y,z)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;stand.add(mesh);};
  box(43,1.3,36,dark,0,55,0);box(43,1.3,36,dark,0,14,0);
  for(const x of [-20,20])for(const z of [-16,16])box(1.2,55,1.2,steel,x,27.5,z);
  scene.add(new T.HemisphereLight('#fff7e8','#dce4e7',1.75));
  const sunlight=new T.DirectionalLight('#fffaf2',1.6);sunlight.position.set(-280,235,95);sunlight.target.position.set(20,35,-25);
  sunlight.castShadow=false;sunlight.shadow.mapSize.set(2048,2048);sunlight.shadow.camera.left=-175;sunlight.shadow.camera.right=175;sunlight.shadow.camera.top=160;sunlight.shadow.camera.bottom=-160;sunlight.shadow.camera.near=5;sunlight.shadow.camera.far=650;sunlight.shadow.normalBias=.25;
  scene.add(sunlight,sunlight.target);
  const fill=new T.DirectionalLight('#f2f7fa',1.0);fill.position.set(150,160,100);scene.add(fill);
  for(const object of [studio.root,computer,typewriter,basket,turntable.root,display]){
   object.traverse(m=>{if(m.isMesh&&!m.material?.transparent){m.castShadow=true;m.receiveShadow=true;}});
  }
  const views=[
   {p:[260,210,350],t:[-8,70,5],r:119},
   {p:[-4,160,425],t:[-8,75,5],r:144},
   {p:[145,192,245],t:[0,89,1],r:86},
   {p:[-184,149,206],t:[-91,102,-10],r:79}
  ];
  let selected=0,aspect=1,visibleRadius=views[0].r;
  const target=new T.Vector3(...views[0].t),next=new T.Vector3(),nextTarget=new T.Vector3();
  camera.position.set(...views[0].p);
  resizeScene=()=>{
   const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);
   aspect=width/height;
   const pixelBudget=mobile?(recovered?1000000:1600000):2600000;
   const densityLimit=mobile?(recovered?1.5:2.25):1.5;
   renderer.setPixelRatio(Math.min(devicePixelRatio,densityLimit,Math.sqrt(pixelBudget/(width*height))));
   renderer.setSize(width,height,false);
   needsFrame=true;
  };
  resizeScene();new ResizeObserver(resizeScene).observe(host);
  const buttons=[...document.querySelectorAll('[data-view]')];
  buttons.forEach(b=>b.onclick=()=>{selected=Number(b.dataset.view);buttons.forEach(x=>x.setAttribute('aria-pressed',String(b===x)));});
  let on=true;
  const beamIntensity=studio.beam.intensity;
  document.querySelector('#lamp').onclick=e=>{on=!on;studio.beam.intensity=on?beamIntensity:0;studio.pool.visible=on;studio.bulbMat.emissiveIntensity=on?1.8:0;studio.litLens.emissiveIntensity=on?2:0;e.currentTarget.textContent=on?'关台灯':'开台灯';e.currentTarget.setAttribute('aria-pressed',String(on));};
  const editing=new URLSearchParams(location.search).get('edit')==='1';
  const objects={desk:studio.desk,chair:studio.chair,computer,typewriter,basket,fan:fan.root,turntable:turntable.root,records:display,badge,lamp:studio.lamp,toolbox:studio.tray,print:studio.print,plant,stand};
  const editor=window.createWorkspaceEditor(T,{
   scene,camera,canvas:renderer.domElement,
   objects,enabled:editing
  });
  const experience=window.createDeskExperience(T,{scene,camera,canvas:renderer.domElement,studio,computer,typewriter,basket,fan,turntable,display,badge,objects,editing});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  window.WorkspaceLoading?.update(97,'正在点亮工作台…');
  let lastFrame=0;
  const focusOffset=new T.Vector3(190,145,260);
  renderer.setAnimationLoop(now=>{
   if(contextLost||document.hidden||(mobile&&!firstFrame&&!needsFrame&&(now-lastFrame<32||document.body.classList.contains('panel-open'))))return;
   lastFrame=now;
   needsFrame=false;
   const v=views[selected],k=reduced.matches?1:.10;
   const focus=experience.focused();
   if(focus){nextTarget.copy(focus.center);next.copy(focus.center).add(focusOffset);}
   else{next.set(...v.p);nextTarget.set(...v.t);if(aspect<1.4&&selected===0){nextTarget.x+=8;nextTarget.y+=2;}}
   camera.position.lerp(next,k);target.lerp(nextTarget,k);
   camera.lookAt(target);const radius=focus?Math.max(35,focus.size.y*.8,focus.size.x/(aspect*1.4),focus.size.z*.62):v.r;
   const fitScale=!focus?(aspect<.8?1.24:aspect<1.4?1.3:1.08):1.08;
   const r=Math.max(radius,radius*fitScale/aspect);
   visibleRadius+=(r-visibleRadius)*k;
   camera.left=-visibleRadius*aspect;camera.right=visibleRadius*aspect;camera.top=visibleRadius;camera.bottom=-visibleRadius;camera.updateProjectionMatrix();
   editor?.update();experience.update(now);
   try{renderer.render(scene,camera);}catch(error){
    renderer.setAnimationLoop(null);
    if(firstFrame && host.dataset.scene!=='fallback')window.WorkspaceLoading?.fail(error);
    else showFallback('3D 工作台暂时不可用，你仍可浏览作品和简历。');
    console.error(error);return;
   }
   if(firstFrame){firstFrame=false;showScene();window.WorkspaceLoading?.ready();}
  });
  status.textContent=editing?'摆放编辑模式':'点击桌面上的物件，打开我的设计档案。';
 }catch(error){console.error(error);window.WorkspaceLoading?.fail(error);}
})();
