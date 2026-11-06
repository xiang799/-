window.createStudioWorkspace=function(T){
 const root=new T.Group();root.name='StudioWorkspace';
 const mat=(color,roughness=.6,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const black=mat('#282d2d',.52),silver=mat('#c5d2d6',.26,.75),cream=mat('#e3e1cc',.7),wood=mat('#bfa17d',.78);
 const mesh=(geo,m,p,x,y,z)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);p.add(o);return o;};
 const box=(w,h,d,m,p,x,y,z)=>mesh(new T.BoxGeometry(w,h,d),m,p,x,y,z);
 const cyl=(r,h,m,p,x,y,z)=>mesh(new T.CylinderGeometry(r,r,h,32),m,p,x,y,z);
 function group(name,x=0,y=0,z=0){const g=new T.Group();g.name=name;g.position.set(x,y,z);root.add(g);return g;}
 function rod(a,b,r,m,p){
  const start=new T.Vector3(...a),end=new T.Vector3(...b),v=end.clone().sub(start),mid=start.clone().add(end).multiplyScalar(.5);
  const o=cyl(r,v.length(),m,p,...mid.toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;
 }
 function roundedShape(w,h,r){
  const a=w/2,b=h/2,s=new T.Shape();s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.quadraticCurveTo(a,-b,a,-b+r);s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);s.lineTo(-a+r,b);s.quadraticCurveTo(-a,b,-a,b-r);s.lineTo(-a,-b+r);s.quadraticCurveTo(-a,-b,-a+r,-b);return s;
 }
 function plate(shape,d,m,p,x,y,z){
  const geo=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSize:.12,bevelThickness:.12,bevelSegments:3,curveSegments:12});geo.translate(0,0,-d/2);return mesh(geo,m,p,x,y,z);
 }
 const desk=group('BlackDesk');
 const top=plate(roundedShape(150,66,1),2,black,desk,0,74,0);top.rotation.x=-Math.PI/2;
 for(const x of [-65,65]){
  const rail=new T.CatmullRomCurve3([[x,1,-25],[x,65,-25],[x,71,-21],[x,71,21],[x,65,25],[x,1,25]].map(a=>new T.Vector3(...a)));
  mesh(new T.TubeGeometry(rail,60,1.35,12,false),silver,desk,0,0,0);
  for(const z of [-25,25])cyl(1.65,1.2,black,desk,x,.6,z);
 }
 rod([-65,66,-23],[65,66,-23],1.1,silver,desk);
 rod([-65,66,23],[65,66,23],1.1,silver,desk);
 const chair=group('BentwoodChair',0,0,65);chair.rotation.y=Math.PI;
 // Laminated seat and back share a curved centerline with an organic waist.
 const profile=new T.CatmullRomCurve3([[0,45,21],[0,44,9],[0,44,-5],[0,47,-15],[0,57,-19],[0,71,-22],[0,83,-24]].map(a=>new T.Vector3(...a)));
 const positions=[],uvs=[],indices=[],rows=60,cols=30;
 for(let i=0;i<=rows;i++){
  const u=i/rows,p=profile.getPoint(u),t=profile.getTangent(u),normal=new T.Vector3(0,-t.z,t.y).normalize();
  const width=21-7*Math.exp(-Math.pow((u-.62)/.16,2))+2*u;
  for(let j=0;j<=cols;j++){
   const v=j/cols*2-1;
   positions.push(p.x+v*width,p.y+normal.y*v*v*1.8,p.z+normal.z*v*v*1.8);
   uvs.push(j/cols,u);
  }
 }
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const chairGeo=new T.BufferGeometry();chairGeo.setAttribute('position',new T.Float32BufferAttribute(positions,3));chairGeo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));chairGeo.setIndex(indices);chairGeo.computeVertexNormals();
 const grainCanvas=document.createElement('canvas');grainCanvas.width=grainCanvas.height=256;const gc=grainCanvas.getContext('2d');
 gc.fillStyle='#bea07a';gc.fillRect(0,0,256,256);gc.lineWidth=.6;
 for(let i=0;i<130;i++){gc.strokeStyle=i%3?'#876e4d35':'#f5d6a35c';gc.beginPath();gc.moveTo(i*2,0);gc.bezierCurveTo(i*2+8,80,i*2-7,170,i*2+3,256);gc.stroke();}
 const grain=new T.CanvasTexture(grainCanvas);grain.colorSpace=T.SRGBColorSpace;
 const veneer=new T.MeshStandardMaterial({map:grain,roughness:.68});
 // Two curved skins joined by a gently rounded perimeter form a solid
 // laminated seat/back, rather than a double-sided surface.
 const source=chairGeo.attributes.position,normal=chairGeo.attributes.normal;
 const solidPositions=[],solidUVs=[],solidIndices=[],vertexCount=source.count,halfThickness=.72;
 for(const sign of [1,-1])for(let i=0;i<vertexCount;i++){
  solidPositions.push(source.getX(i)+normal.getX(i)*halfThickness*sign,source.getY(i)+normal.getY(i)*halfThickness*sign,source.getZ(i)+normal.getZ(i)*halfThickness*sign);
  solidUVs.push(chairGeo.attributes.uv.getX(i),chairGeo.attributes.uv.getY(i));
 }
 for(let i=0;i<indices.length;i+=3){
  const [a,b,c]=indices.slice(i,i+3);
  solidIndices.push(a,b,c,c+vertexCount,b+vertexCount,a+vertexCount);
 }
 const boundary=[];
 for(let j=0;j<=cols;j++)boundary.push(j);
 for(let i=1;i<=rows;i++)boundary.push(i*(cols+1)+cols);
 for(let j=cols-1;j>=0;j--)boundary.push(rows*(cols+1)+j);
 for(let i=rows-1;i>0;i--)boundary.push(i*(cols+1));
 const edgeStart=solidPositions.length/3,edgeSteps=6;
 for(let step=0;step<=edgeSteps;step++)for(const [j,index] of boundary.entries()){
  const angle=step/edgeSteps*Math.PI,n=new T.Vector3().fromBufferAttribute(normal,index);
  const current=new T.Vector3().fromBufferAttribute(source,index);
  const previous=new T.Vector3().fromBufferAttribute(source,boundary[(j+boundary.length-1)%boundary.length]);
  const next=new T.Vector3().fromBufferAttribute(source,boundary[(j+1)%boundary.length]);
  const outward=new T.Vector3().crossVectors(n,new T.Vector3().subVectors(next,previous)).normalize();
  current.addScaledVector(n,Math.cos(angle)*halfThickness).addScaledVector(outward,Math.sin(angle)*.26);
  solidPositions.push(...current.toArray());solidUVs.push(j/boundary.length,step/edgeSteps*.04);
 }
 for(let step=0;step<edgeSteps;step++)for(let j=0;j<boundary.length;j++){
  const a=edgeStart+step*boundary.length+j,b=edgeStart+step*boundary.length+(j+1)%boundary.length,c=a+boundary.length,d=b+boundary.length;
  solidIndices.push(a,b,c,b,d,c);
 }
 const solidChair=new T.BufferGeometry();solidChair.setAttribute('position',new T.Float32BufferAttribute(solidPositions,3));solidChair.setAttribute('uv',new T.Float32BufferAttribute(solidUVs,2));solidChair.setIndex(solidIndices);solidChair.computeVertexNormals();
 mesh(solidChair,veneer,chair,0,0,0).name='SolidLaminatedSeatBack';
 chairGeo.dispose();
 for(const x of [-15.5,15.5]){
  rod([x,43,-12],[x*1.15,1,-22],.9,silver,chair);
  rod([x,43,13],[x*1.2,1,23],.9,silver,chair);
  for(const z of [-22,23])cyl(1.1,1.3,black,chair,x*(z<0?1.15:1.2),.65,z);
 }
 const lamp=group('ArticulatedLamp',-51,75,-16);
 cyl(6.2,1.6,black,lamp,0,.8,0);
 const joints=[[0,2,0],[3,28,-1],[1,47,-3],[15,69,-6]];
 for(const side of [-1,1]){
  const z=side*.85;
  for(let i=0;i<3;i++){
   const a=joints[i],b=joints[i+1];rod([a[0],a[1],a[2]+z],[b[0],b[1],b[2]+z],.29,black,lamp);
   rod([a[0]+2.4,a[1],a[2]+z],[b[0]+2.4,b[1],b[2]+z],.29,black,lamp);
  }
 }
 for(const [x,y,z] of joints.slice(1,3)){
  rod([x,y,z-1.3],[x+2.5,y,z+1.3],.30,silver,lamp);
  const pivot=cyl(.48,3.4,mat('#a64a39'),lamp,x,y,z);pivot.rotation.x=Math.PI/2;
 }
 const head=box(7,2.2,4.4,black,lamp,16,69,-6);head.rotation.z=-.12;
 for(let i=0;i<6;i++)box(.40,.07,2.6,mat('#727b78'),lamp,13.7+i*.87,70.17,-6);
 const bulbMat=new T.MeshStandardMaterial({color:'#fff2ca',emissive:'#ffdba0',emissiveIntensity:1.8});
 box(5,.08,3.1,bulbMat,lamp,16,67.42,-6);
 box(6,2.3,5,black,lamp,1.2,23,1.5);box(5.6,2.8,4.5,black,lamp,3.0,42,-1.2);
 const beam=new T.SpotLight('#ffd494',18000,160,.38,.9,2);beam.position.set(16,67,-6);beam.target.position.set(25,.5,2);lamp.add(beam,beam.target);
 const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=192;
 const glowContext=glowCanvas.getContext('2d'),glow=glowContext.createRadialGradient(96,96,4,96,96,94);
 glow.addColorStop(0,'rgba(255,222,161,0.68)');glow.addColorStop(.35,'rgba(255,211,134,0.38)');glow.addColorStop(.72,'rgba(255,197,112,0.12)');glow.addColorStop(1,'rgba(255,197,112,0)');
 glowContext.fillStyle=glow;glowContext.fillRect(0,0,192,192);
 const pool=new T.Mesh(new T.PlaneGeometry(42,36),new T.MeshBasicMaterial({map:new T.CanvasTexture(glowCanvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,blending:T.AdditiveBlending,toneMapped:false}));
 pool.name='DeskLampLightPool';pool.rotation.x=-Math.PI/2;pool.position.set(25,.56,2);lamp.add(pool);
 const litLens=new T.MeshStandardMaterial({color:'#fff0c8',emissive:'#ffcd83',emissiveIntensity:2});
 box(4.9,.30,.08,litLens,lamp,16,68.4,-3.55);
 const tray=group('Toolbox',46,75,12);
 const trayBottom=plate(roundedShape(32,17,1.1),.55,cream,tray,0,.42,0);trayBottom.rotation.x=-Math.PI/2;
 for(const z of [-8.25,8.25])box(31.4,7.1,.4,cream,tray,0,4,z);
 for(const x of [-15.7,15.7])box(.4,7.1,16.9,cream,tray,x,4,0);
 const handle=roundedShape(21,15,1.3);
 const holePath=new T.Path();holePath.setFromPoints(roundedShape(14.8,3.4,1.2).getPoints(48).map(p=>new T.Vector2(p.x,p.y+4.1)));handle.holes.push(holePath);
 plate(handle,.5,cream,tray,0,8.05,0);
 for(const x of [-8,8])box(.35,6.7,8,cream,tray,x,3.7,4.1);
 for(let i=0;i<5;i++)rod([-12+i*1.2,1.1,-4],[-13+i*1.2,14+i%2*2,-5],.22,i%2?silver:black,tray);
 const disk=cyl(3.6,.65,wood,tray,1,4,4.7);disk.rotation.x=Math.PI/2;
 const roll=cyl(3.8,.45,mat('#b6d6dd'),tray,5.4,5,-3.9);roll.rotation.x=Math.PI/2;
 const print=group('BotanicalPrint',47,75,-23);
 print.rotation.x=-.12;print.rotation.y=-.13;
 plate(roundedShape(22,29,.15),.65,black,print,0,14.8,0);
 box(20.7,27.7,.15,mat('#f2ead7'),print,0,14.8,.45);
 const canvas=document.createElement('canvas');canvas.width=500;canvas.height=650;const c=canvas.getContext('2d');
 c.fillStyle='#e0d2b7';c.fillRect(0,0,500,650);c.strokeStyle='#353931';c.fillStyle='#353931';c.lineWidth=2;
 c.beginPath();c.moveTo(164,580);c.bezierCurveTo(202,420,316,243,337,93);c.stroke();
 for(let i=0;i<9;i++){
  const y=133+i*43,x=329-i*17,dir=i%2?1:-1;
  c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+dir*25,y-13,x+dir*43,y-35);c.stroke();
  c.beginPath();c.ellipse(x+dir*44,y-36,9,20,dir*.5,0,Math.PI*2);c.fill();
 }
 const image=new T.CanvasTexture(canvas);image.colorSpace=T.SRGBColorSpace;
 mesh(new T.PlaneGeometry(14.6,19.5),new T.MeshBasicMaterial({map:image}),print,0,15,.55);
 return {root,desk,chair,lamp,tray,print,beam,bulbMat,pool,litLens};
};
window.createRetroComputer=function(T){
 const root=new T.Group();root.name='RetroComputer';
 const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.75});
 const ivory=mat('#dbe8f5'),light=mat('#f0f7ff'),shade=mat('#9cacc1'),dark=mat('#282925'),key=mat('#f5faff');
 const add=(g,m,p,x,y,z)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o;};
 const box=(w,h,d,m,p,x,y,z)=>add(new T.BoxGeometry(w,h,d),m,p,x,y,z);
 function round(w,h,d,r,m,p,x,y,z){
  const a=w/2,b=h/2,s=new T.Shape();
  s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.quadraticCurveTo(a,-b,a,-b+r);s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);
  s.lineTo(-a+r,b);s.quadraticCurveTo(-a,b,-a,b-r);s.lineTo(-a,-b+r);s.quadraticCurveTo(-a,-b,-a+r,-b);
  const bevel=Math.min(.22,d*.19,r*.35);
  return add(new T.ExtrudeGeometry(s,{depth:d-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3}),m,p,x,y,z-d/2+bevel);
 }
 const group=(name,x,y,z)=>{const g=new T.Group();g.name=name;g.position.set(x,y,z);root.add(g);return g;};
 const pc=group('DesktopCase',0,0,0);
 const caseShell=mat('#5c5c5c'),caseFace=mat('#6b6b6b');
 round(33,5.8,22,.7,caseShell,pc,0,3.05,0);
 round(32.65,5.3,.55,.45,caseFace,pc,0,3.05,11.1);
 box(32.3,.09,.12,shade,pc,0,3.1,11.44);
 box(.09,5.18,.13,shade,pc,4.9,3.05,11.44);
 for(let i=0;i<5;i++)box(31,.085,.14,shade,pc,0,.81+i*.22,11.45);
 for(let i=0;i<12;i++)box(.09,.38,.19,shade,pc,-14.6+i*.41,4.74,11.46);
 box(6.3,.11,.1,dark,pc,10.3,4.1,11.46);
 box(.24,.18,.12,mat('#96b35d'),pc,-15.15,4.73,11.49);
 const crt=group('CRTMonitor',0,0,-.8);
 round(22,2.2,15,1.25,ivory,crt,0,7.05,0);
 add(new T.CylinderGeometry(5.1,7.9,2.6,40),shade,crt,0,8.82,0);
 round(25,21.7,11.8,1.2,ivory,crt,0,20.15,-1.8);
 round(19.9,17.8,7.5,1.5,shade,crt,0,19.95,-10.7);
 round(26.25,22.5,2.1,1.22,light,crt,0,20.15,4.6);
 round(22.1,17.5,.37,1.23,shade,crt,-.05,21.12,5.77);
 round(20.66,16.1,.38,1.16,dark,crt,-.05,21.1,6.01);
 for(let i=0;i<12;i++)box(.11,.55,4.7,shade,crt,12.64,24.1-i*.48,-2.1);
 round(2.5,.44,.18,.13,shade,crt,8.7,10.13,5.8);
 box(.34,.2,.22,mat('#9dc66c'),crt,10.5,10.15,5.8);
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;
 const c=canvas.getContext('2d');
 const fill=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 function label(value,x,y,color='#272344',size=14){
  c.font='bold '+size+'px monospace';c.fillStyle=color;c.fillText(value,x,y);
 }
 fill('#79b8e0',0,0,640,480);
 for(let y=0;y<460;y+=3)for(let x=0;x<640;x+=3){
  const n=((x*173+y*97+x*y*13)%29);
  if(n<7)fill(n<3?'#e2f4ff38':'#28669724',x,y,2,1);
 }
 function folder(x,y){
  fill('#544369',x,y+4,29,20);fill('#ffdc86',x+2,y,13,7);
  fill('#ffe8a0',x+2,y+6,25,15);fill('#fff8ce',x+3,y+7,22,3);
 }
 function win(x,y,w,h,title,bar,panel,ink='#fff'){
  fill('#444064',x+4,y+5,w,h);fill('#fdf8ff',x,y,w,h);
  fill('#726482',x+w-3,y+2,3,h-2);fill('#726482',x+2,y+h-3,w-2,3);
  fill(panel,x+4,y+4,w-8,h-8);fill(bar,x+4,y+4,w-8,24);
  label(title,x+10,y+21,ink,15);
  ['−','□','×'].forEach((symbol,i)=>{
   const bx=x+w-61+i*18;fill('#604a70',bx,y+7,16,17);fill('#f7e8fa',bx+1,y+8,14,14);
   label(symbol,bx+3,y+20,'#4d3759',13);
  });
 }
 ['MY FILES','ABOUT','ARCHIVE'].forEach((name,i)=>{folder(23,31+i*79);label(name,11,76+i*79,'#fff',12);});
 win(89,39,356,239,'PROJECT FILES','#393785','#f5f3f7');
 label('File   Edit   View',102,89);
 fill('#b0a9bb',99,98,334,2);
 [['PRODUCT',110,117],['INTERACTION',204,117],['SERVICE',314,117],['AIGC',110,187],['VISUAL',204,187]].forEach(([name,x,y])=>{
  folder(x,y);label(name,x-4,y+40,'#392f53',12);
 });
 fill('#ded8e6',99,251,334,18);label('5 folders',105,264,'#463b5b',12);
 win(378,105,226,166,'sketch.bmp','#dc9bc5','#fff5fa','#644163');
 for(let x=388;x<596;x+=15)fill('#f2c5dc',x,141,1,120);
 for(let y=143;y<262;y+=15)fill('#f2c5dc',388,y,208,1);
 win(166,293,225,143,'COLOR STUDY','#a68bd6','#bda1da');
 const sky=c.createLinearGradient(0,325,0,429);
 sky.addColorStop(0,'#7460ad');sky.addColorStop(1,'#efa9cb');
 fill(sky,174,325,209,104);
 fill('#ffe1eb',303,342,16,16);
 fill('#8173b9',176,384,94,4);fill('#8173b9',254,388,124,3);
 win(333,237,268,146,'WELCOME','#a28ad5','#ffc5d9');
 label('CHEN XIANG',355,301,'#573957',21);label('DESIGN WORKSPACE',355,329,'#68496e',13);
 fill('#e0d7ea',0,451,640,29);fill('#fff',0,451,640,2);
 fill('#f0e5f7',6,456,82,19);label('▦ START',11,470,'#413557',12);
 label('DESIGN DESK',519,471,'#413557',12);
 const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.NearestFilter;
 const glass=new T.PlaneGeometry(19.1,14.6,30,24),v=glass.attributes.position;
 for(let i=0;i<v.count;i++){const x=v.getX(i)/9.55,y=v.getY(i)/7.3;v.setZ(i,.30*(1-x*x)*(1-y*y));}
 glass.computeVertexNormals();
 add(glass,new T.MeshBasicMaterial({map:tex}),crt,-.05,21.1,6.23).name='ReplaceableScreen';
 const kb=group('Keyboard',-.4,.06,19.25);kb.rotation.x=-.07;
 round(35.9,9.1,1.14,.52,ivory,kb,0,.69,0).rotation.x=-Math.PI/2;
 function cap(x,z,w=1.16,m=key){round(w,1.07,.36,.09,m,kb,x,1.42,z).rotation.x=-Math.PI/2;}
 for(let i=0;i<16;i++)cap(-16.6+i*2.15,-3.49,1.37,i===0?shade:key);
 for(let r=0;r<4;r++){
  for(let i=0;i<14;i++)cap(-16.7+i*1.46,-1.99+r*1.36,1.27,i===13?shade:key);
  for(let i=0;i<4;i++)cap(10.35+i*1.69,-1.99+r*1.36,1.44);
 }
 for(const [x,w] of [[-16,1.85],[-13.7,1.8],[-7.3,9.8],[-.98,1.8],[2.35,2.05],[6.9,1.3],[12.2,4.7],[16.03,1.35]])cap(x,3.66,w);
 const mouse=group('WiredMouse',22.5,0,19.2);
 const foot=add(new T.SphereGeometry(1,32,16),shade,mouse,0,.77,0);foot.scale.set(2.25,.64,3);
 const top=add(new T.SphereGeometry(1,32,16),light,mouse,0,1.19,.05);top.scale.set(2.2,.78,2.96);
 const cable=new T.CatmullRomCurve3([[22.5,.48,16.4],[22.7,.32,12.6],[25,.24,9.9],[24.8,.24,6.6],[21,.31,4],[16.8,1.17,-1]].map(a=>new T.Vector3(...a)));
 add(new T.TubeGeometry(cable,44,.08,8,false),shade,root,0,0,0);
 return root;
};
// Procedural study in centimeters. Front +Z, up +Y.
window.createSuitcaseTurntable = function createSuitcaseTurntable(T) {
 const root=new T.Group();root.name='SuitcaseTurntable';
 const mat=(color,roughness=.7,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const shell=mat('#65c9df',.64),edge=mat('#8ad9e6'),cream=mat('#eee6d7'),dark=mat('#232528',.55);
 const record=mat('#19191b',.31),groove=mat('#3a3a40',.51),label=mat('#5d9acb'),brass=mat('#94734c',.35,.65),steel=mat('#aeb2b4',.31,.55),cloth=mat('#655a47'),thread=mat('#9c8c6d');
 function group(name,p,x=0,y=0,z=0){const g=new T.Group();g.name=name;g.position.set(x,y,z);p.add(g);return g;}
 function part(geo,m,p,x,y,z){const o=new T.Mesh(geo,m);o.position.set(x,y,z);p.add(o);return o;}
 function rounded(w,h,d,r,m,p,x,y,z){
  const s=new T.Shape(),a=w/2,b=h/2;
  s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.quadraticCurveTo(a,-b,a,-b+r);
  s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);s.lineTo(-a+r,b);
  s.quadraticCurveTo(-a,b,-a,b-r);s.lineTo(-a,-b+r);s.quadraticCurveTo(-a,-b,-a+r,-b);
  const bevel=Math.min(d*.2,r*.35);
  const g=new T.ExtrudeGeometry(s,{depth:d-2*bevel,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:8});
  g.translate(0,0,-(d-2*bevel)/2);return part(g,m,p,x,y,z);
 }
 const cyl=(r,h,m,p,x,y,z,n=72)=>part(new T.CylinderGeometry(r,r,h,n),m,p,x,y,z);
 function rod(a,b,r,m,p){const x=new T.Vector3(...a),y=new T.Vector3(...b),v=y.clone().sub(x),c=x.clone().addScaledVector(v,.5);const o=cyl(r,v.length(),m,p,c.x,c.y,c.z,16);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
 const body=group('Body',root);
 rounded(35.5,26,5.6,2.0,shell,body,0,3.6,0).rotation.x=-Math.PI/2;
 rounded(34.5,25.4,.45,1.45,edge,body,0,6.5,0).rotation.x=-Math.PI/2;
 rounded(33.5,24.4,.22,1.15,dark,body,0,6.77,0).rotation.x=-Math.PI/2;
 for(const x of [-14.5,14.5])for(const z of [-10.2,10.2])cyl(1,.9,dark,body,x,.55,z,24);
 const lid=group('LidHinge',root,0,6.6,-12.7);
 // The exterior panel sits above the mechanism when closed. The four
 // shallow walls connect it to the seam, leaving a cavity underneath.
 rounded(35.5,25.6,.62,1.75,shell,lid,0,12.7,-3.85);
 rounded(32.7,22.5,.22,.9,cream,lid,0,12.65,-3.39);
 for(const x of [-17.62,17.62])rounded(.22,24.9,3.65,.09,shell,lid,x,12.7,-1.93);
 for(const y of [.03,25.37])rounded(35.05,.24,3.65,.1,shell,lid,0,y,-1.93);
 rounded(32.9,.5,.27,.19,edge,lid,0,1.21,-3.21);
 for(const x of [-11,11])rounded(3.6,1.18,.4,.23,brass,lid,x,.82,.81);
 rounded(2.4,1.04,.4,.25,brass,lid,0,24.98,.9);
 // Woven grille pattern built from short line segments on the inset surface.
 for(const x of [-12.55,12.55]){
  rounded(7.3,3.25,.16,.42,cloth,body,x,3.65,13.13);
  const points=[];
  for(let i=0;i<42;i++)for(let j=0;j<18;j++){
   const u=-3.4+i*.163,v=-1.42+j*.164;
   points.push(x+u,3.65+v,13.224,x+u+.068,3.65+v+.056,13.224);
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));
  const lines=new T.LineSegments(geo,new T.LineBasicMaterial({color:thread.color}));body.add(lines);
 }
 const handle=group('CarryHandle',body,0,2.2,13.45);
 for(const x of [-5.4,5.4]){
  rounded(2.65,1.63,.35,.32,brass,body,x,4.4,13.2);
  rod([x,1.94,0],[x*.88,.13,.97],.22,brass,handle);
  for(const dx of [-.72,.72]){const screw=cyl(.19,.11,steel,body,x+dx,4.4,13.49,16);screw.rotation.x=Math.PI/2;}
 }
 rounded(10.5,1.67,1.75,.7,shell,handle,0,0,.96);
 rounded(2.65,1.62,.42,.22,brass,body,0,4.52,13.24);
 rounded(1.28,1.1,.28,.22,steel,body,0,4.7,13.52);
 const platter=group('RecordPivot',root,-5.15,7.18,.15);
 cyl(10.42,.59,dark,platter,0,0,0);cyl(12.3,.17,record,platter,0,.38,0,128);
 for(let i=0;i<26;i++){
  const r=4.5+i*.286;
  const ring=part(new T.RingGeometry(r,r+.035,96),groove,platter,0,.472+i*.0001,0);ring.rotation.x=-Math.PI/2;
 }
 cyl(3.75,.045,label,platter,0,.49,0);cyl(.23,.83,steel,platter,0,.9,0,24);
 const mark=rounded(2.15,.045,.15,.018,cream,platter,.02,.525,1.5);
 const arm=group('TonearmSwivel',root,12.25,7.08,-7.1);
 cyl(1.49,.52,dark,arm,0,.23,0,48);
 const lift=group('TonearmLift',arm,0,1.18,0);
 rounded(2.25,1.28,1.86,.26,dark,lift,0,.12,0);
 rod([0,.1,.45],[0,-.18,10.0],.185,steel,lift);
 rod([0,-.18,10],[.56,-.34,11.57],.24,dark,lift);
 rounded(1.13,.42,1.7,.16,dark,lift,.68,-.42,11.82);
 rounded(.88,.18,1.14,.11,mat('#be4e37'),lift,.68,-.68,12.0);
 cyl(.62,.57,dark,body,14.8,7.15,7.91,32);cyl(.44,.46,dark,body,14.65,7.1,4.85,32);
 cyl(.49,.34,steel,body,11.47,7.02,7.13,24);
 rounded(1.4,.21,3.2,.18,dark,body,12.28,6.99,-.4).rotation.x=-Math.PI/2;
 lid.rotation.x=-.18;
 arm.rotation.y=-.19;
 return {root,lid,platter,arm,lift};
};

window.createRecordDisplay=function(T,{position=[0,0,-18],records=[]}={}){
 const wall=new T.Group();wall.name='WallRecordDisplay';
 wall.position.set(...position);
 const editions=[
  {x:-21,y:53,size:14,title:'TIDELINE',ink:'#e8e5b5',paper:'#234e3e',vinyl:'#138455',center:'#e4d9b2'},
  {x:-8,y:58,size:7.8,title:'DAY TRIP',ink:'#73462a',paper:'#efc979',vinyl:'#253632',center:'#ecc298'},
  {x:-8,y:47,size:7.8,title:'GO / GO',ink:'#f5d4c5',paper:'#994661',vinyl:'#2b2429',center:'#dc7396'},
  {x:5,y:53,size:14,title:'AFTER HOURS',ink:'#e8e3ed',paper:'#403b53',vinyl:'#dce4eb',center:'#46525a'},
  {x:21,y:53,size:14,title:'AMBER LIGHT',ink:'#f0deaf',paper:'#205464',vinyl:'#eb881e',center:'#174a56'}
 ];
 const material=(color,roughness=.72)=>new T.MeshStandardMaterial({color,roughness});
 const mesh=(g,m,p,x,y,z)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o;};
 const support=material('#b6c4bf',.4);
 const slots=records.length===4
  ? [editions[0],editions[1],editions[3],editions[4]]
  : editions;
 for(const [index,slot] of slots.entries()){
  const e={...slot,...records[index]};
  const g=new T.Group();g.name=e.title;g.position.set(e.x,e.y,0);wall.add(g);
  g.userData.trackIndex=index;
  const c=document.createElement('canvas');c.width=c.height=384;const ctx=c.getContext('2d');
  ctx.fillStyle=e.paper;ctx.fillRect(0,0,384,384);
  ctx.strokeStyle=e.ink;ctx.lineWidth=1.4;ctx.globalAlpha=.45;
  for(let i=0;i<21;i++){ctx.beginPath();ctx.ellipse(210,235,40+i*6,16+i*4,-.45,0,Math.PI*2);ctx.stroke();}
  ctx.globalAlpha=1;ctx.fillStyle=e.ink;ctx.font='700 30px Georgia';ctx.fillText(e.title,22,51);
  ctx.font='13px monospace';ctx.fillText('DESK SESSIONS  /  SIDE A',23,78);
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
  mesh(new T.BoxGeometry(e.size,e.size,.36),material(e.paper),g,0,0,0);
  const coverMaterial=new T.MeshBasicMaterial({map:texture,toneMapped:false});
  mesh(new T.PlaneGeometry(e.size-.12,e.size-.12),coverMaterial,g,0,0,.19);
  if(e.cover){
   new T.TextureLoader().load(e.cover,cover=>{
    cover.colorSpace=T.SRGBColorSpace;
    coverMaterial.map=cover;
    coverMaterial.needsUpdate=true;
    texture.dispose();
   },undefined,()=>console.warn('Record cover unavailable:',e.title));
  }
  const r=e.size*.46;
  const disc=mesh(new T.CylinderGeometry(r,r,.14,96),material(e.vinyl,.27),g,0,-e.size*.49,.47);disc.rotation.x=Math.PI/2;
  const grooves=new T.MeshBasicMaterial({color:e.ink,transparent:true,opacity:.2,depthWrite:false});
  for(let i=0;i<19;i++){
   const a=r*(.34+i*.033);
   mesh(new T.RingGeometry(a,a+r*.005,80),grooves,g,0,-e.size*.49,.55);
  }
  mesh(new T.CircleGeometry(r*.3,40),material(e.center),g,0,-e.size*.49,.56);
  mesh(new T.CircleGeometry(r*.045,20),material('#282c2c'),g,0,-e.size*.49,.57);
  for(const x of [-e.size*.32,e.size*.32])mesh(new T.BoxGeometry(e.size*.13,.23,.97),support,g,x,-e.size*.54,.12);
 }
 return wall;
};

window.createDesignerBadge=async function(T){
 const root=new T.Group();root.name='DesignerID';
 const chrome=new T.MeshStandardMaterial({color:0xbfcbd0,metalness:.78,roughness:.23});
 const glass=new T.MeshPhysicalMaterial({color:0xe6fff5,transparent:true,opacity:.3,roughness:.24,metalness:.08,depthWrite:false});
 const clearEdge=new T.MeshPhysicalMaterial({color:0xe8fff8,transparent:true,opacity:.65,roughness:.21,metalness:.16,depthWrite:false});
 function mesh(geo,mat,x=0,y=0,z=0){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);root.add(m);return m;}
 function rounded(w,h,r,C=T.Shape){
  const s=new C(),a=w/2,b=h/2;
  s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.quadraticCurveTo(a,-b,a,-b+r);s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);s.lineTo(-a+r,b);s.quadraticCurveTo(-a,b,-a,b-r);s.lineTo(-a,-b+r);s.quadraticCurveTo(-a,-b,-a+r,-b);return s;
 }
 function solid(shape,depth,bevel,material,x,y,z){
  return mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:12}),material,x,y,z);
 }
 function ring(w,h,t,x,y,z,angle=0){
  const m=mesh(new T.TorusGeometry(1,t,9,36),chrome,x,y,z);m.scale.set(w,h,1);m.rotation.z=angle;return m;
 }
 const sleeve=rounded(8.3,11.7,.54);
 sleeve.holes.push(rounded(7.97,11.36,.44,T.Path));
 solid(sleeve,.17,.045,clearEdge,0,0,-.11);
 solid(rounded(8.04,11.44,.47),.06,0,glass,0,0,-.14);
 const head=rounded(8.03,1.48,.38);
 head.holes.push(rounded(1.82,.50,.24,T.Path));
 for(const x of [-2.35,2.35]){
  const hole=new T.Path();hole.absarc(x,0,.28,0,2*Math.PI,true);head.holes.push(hole);
 }
 solid(head,.085,0,clearEdge,0,4.85,-.018);
 solid(rounded(8.01,.1,.045),.064,.018,clearEdge,0,4.05,.056);
 solid(rounded(8.01,.075,.033),.064,.015,clearEdge,0,3.88,.056);
 const cardCanvas=document.createElement('canvas');cardCanvas.width=900;cardCanvas.height=1120;
 const ctx=cardCanvas.getContext('2d');
 const photo=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=window.badgePhoto;});
 ctx.fillStyle='#f5eedc';ctx.fillRect(0,0,900,1120);
 ctx.fillStyle='#252723';ctx.font='900 87px Arial';ctx.fillText('THE',62,117);ctx.fillText('DESIGNER',60,201);
 ctx.font='600 22px monospace';ctx.fillText('ISSUE / 01',680,115);
 ctx.strokeStyle='#515448';ctx.setLineDash([6,7]);ctx.beginPath();ctx.moveTo(63,222);ctx.lineTo(834,222);ctx.stroke();ctx.setLineDash([]);
 ctx.font='700 25px Arial';ctx.fillText('PRODUCT DESIGN / PERSONAL ID',63,258);
 const x=290,y=300,w=320,h=366;
 const cropW=photo.naturalWidth*.68,cropH=cropW*h/w;
 ctx.drawImage(photo,(photo.naturalWidth-cropW)*.5,0,cropW,cropH,x,y,w,h);
 ctx.strokeStyle='#979181';ctx.strokeRect(x,y,w,h);
 const fields=[['NAME','陈湘  /  CHEN XIANG'],['FOCUS','产品设计 · 交互体验 · AIGC'],['EDUCATION','中南大学  /  设计学硕士在读']];
 fields.forEach(([label,value],i)=>{
  const yy=752+i*86;ctx.fillStyle='#535546';ctx.font='600 20px monospace';ctx.fillText(label,64,yy);
  ctx.fillStyle='#252723';ctx.font='700 34px Microsoft YaHei, sans-serif';ctx.fillText(value,232,yy,600);
  ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(64,yy+17);ctx.lineTo(834,yy+17);ctx.stroke();ctx.setLineDash([]);
 });
 ctx.font='600 17px monospace';ctx.fillText('DESIGN DESK / PERSONAL ARCHIVE',64,1040);
 for(let i=0,pos=653;i<36;i++){const width=[2,4,2,5,3][i%5];ctx.fillRect(pos,1013,width,43);pos+=width+2;}
 const tex=new T.CanvasTexture(cardCanvas);tex.colorSpace=T.SRGBColorSpace;
 solid(rounded(7.48,9.33,.17),.055,0,new T.MeshStandardMaterial({color:0xf4ecd9}),0,-.87,-.058);
 mesh(new T.PlaneGeometry(7.45,9.30),new T.MeshBasicMaterial({map:tex}),0,-.87,.002);
 const shine=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.085,depthWrite:false});
 mesh(new T.PlaneGeometry(.26,8.9),shine,-3.85,-.63,.077);
 solid(rounded(1.28,2.03,.14),.30,.06,chrome,0,11.55,0);
 solid(rounded(.93,1.56,.11),.04,.025,new T.MeshStandardMaterial({color:0xd7e1e4,metalness:.55,roughness:.35}),0,11.58,.36);
 ring(.75,.73,.09,0,10.12,.1);
 for(let i=0;i<5;i++){const link=ring(.26,.42,.07,0,9.52-i*.88,.12);link.rotation.y=i%2?.85:.04;}
 for(const side of [-1,1])for(let i=0;i<3;i++)ring(.22,.37,.068,side*(.38+i*.34),9.43-i*.48,.2,side*.52);
 const heart=new T.Shape();heart.moveTo(0,-.72);heart.bezierCurveTo(-1.15,-.12,-.92,.88,-.36,.67);heart.quadraticCurveTo(-.12,.61,0,.35);heart.bezierCurveTo(.55,1.23,1.32,.3,0,-.72);
 const silver=new T.MeshStandardMaterial({color:0xf5f7f8,metalness:.53,roughness:.31});
 solid(heart,.13,.16,silver,-1.65,7.33,.28).rotation.z=-.22;
 const star=new T.Shape();
 const tips=Array.from({length:10},(_,i)=>{const a=Math.PI/2+i*Math.PI/5,r=i%2?.42:.79;return new T.Vector2(Math.cos(a)*r,Math.sin(a)*r);});
 tips.forEach((tip,i)=>{
  const start=tip.clone().lerp(tips[(i+9)%10],.24);
  const end=tip.clone().lerp(tips[(i+1)%10],.24);
  if(i===0)star.moveTo(start.x,start.y);else star.lineTo(start.x,start.y);
  star.quadraticCurveTo(tip.x,tip.y,end.x,end.y);
 });
 star.closePath();
 solid(star,.13,.09,silver,1.66,7.28,.28).rotation.z=.17;
 return root;
};
window.createTypewriter=function(T){
 const root=new T.Group();root.name='Typewriter';
 const mat=(color,roughness=.68,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const blue=mat('#9dd8e4',.42),edge=mat('#b9e8ed',.38),black=mat('#273239'),ivory=mat('#efe9d7'),steel=mat('#b9c6ca',.28,.62),red=mat('#a63743');
 function add(g,m,x,y,z,p=root){const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o;}
 function shape(w,h,r){const s=new T.Shape(),a=w/2,b=h/2;s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.quadraticCurveTo(a,-b,a,-b+r);s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);s.lineTo(-a+r,b);s.quadraticCurveTo(-a,b,-a,b-r);s.lineTo(-a,-b+r);s.quadraticCurveTo(-a,-b,-a+r,-b);return s;}
 function round(w,h,d,r,m,x,y,z,p=root){
  const b=Math.min(d*.2,r*.35),g=new T.ExtrudeGeometry(shape(w,h,r),{depth:d-2*b,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:3,curveSegments:8});g.translate(0,0,-(d-2*b)/2);return add(g,m,x,y,z,p);
 }
 function texture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'));const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshBasicMaterial({map:t});}
 round(32,24,2.5,2,blue,0,1.4,0).rotation.x=-Math.PI/2;
 round(28,13.7,.5,1.1,black,0,2.65,4.15).rotation.x=-Math.PI/2;
 for(const x of [-14.65,14.65])round(2.1,19,3.1,.8,blue,x,2.65,1).rotation.x=-Math.PI/2;
 round(31.1,3.6,2.4,.75,edge,0,2.15,11);
 round(30.1,5.35,9.4,1.25,blue,0,5.1,-5.9);
 round(27.7,2.55,.22,.37,edge,0,5.12,-1.12);
 const badge=texture(360,70,c=>{c.fillStyle='#c9e9ed';c.fillRect(0,0,360,70);c.fillStyle='#233e47';c.font='bold 39px monospace';c.textAlign='center';c.fillText('R O Y A L',180,49);});
 add(new T.PlaneGeometry(7.1,1.38),badge,0,5.25,-.98);
 round(16.7,2.1,.36,.54,black,0,7.93,-5.3).rotation.x=-Math.PI/2;
 round(15.45,.31,.21,.13,red,0,8.09,-5.06);
 for(const x of [-6.7,6.7])add(new T.CylinderGeometry(1.22,1.22,.25,32),black,x,8.14,-5.42);
 for(let i=0;i<12;i++)round(.12,.23,.77,.045,steel,(i-5.5)*.23,8.27,-5.22).rotation.y=(i-5.5)*.11;
 const carriage=new T.Group();carriage.name='Carriage';root.add(carriage);
 round(31.4,1.12,1.2,.43,edge,0,8.45,-10.12,carriage);
 const roller=add(new T.CylinderGeometry(.7,.7,28,48),black,0,8.75,-9.28,carriage);roller.rotation.z=Math.PI/2;
 const rail=add(new T.CylinderGeometry(.10,.10,29.4,20),steel,0,9.47,-8.85,carriage);rail.rotation.z=Math.PI/2;
 for(const x of [-15.6,15.6]){
  round(1.2,2.4,1.05,.24,steel,x,8.92,-9.38,carriage);
  const knob=add(new T.CylinderGeometry(.83,.83,.85,28),ivory,x*1.056,8.75,-9.27,carriage);knob.rotation.z=Math.PI/2;
 }
 const lever=round(3.7,.31,.31,.13,steel,-14.45,10.13,-9.38,carriage);lever.rotation.z=.26;
 const keys=['234567890-','QWERTYUIOP','ASDFGHJKL;','ZXCVBNM,./'];
 keys.forEach((row,j)=>[...row].forEach((letter,i)=>{
  const x=(i-4.5)*2.44+(j%2)*.55,y=5.08-j*.57,z=1.2+j*2.13;
  round(.30,1.18,.30,.08,steel,x,y-.64,z);
  round(1.87,1.41,.40,.35,ivory,x,y,z).rotation.x=-Math.PI/2;
  const top=texture(64,56,c=>{c.fillStyle='#eee7d4';c.fillRect(0,0,64,56);c.font='bold 29px monospace';c.textAlign='center';c.fillStyle='#30302b';c.fillText(letter,32,38);});
  add(new T.PlaneGeometry(1.4,1.04),top,x,y+.205,z).rotation.x=-Math.PI/2;
 }));
 for(const x of [-12.85,13.13])round(2.3,1.55,.48,.36,ivory,x,3.42,8.07).rotation.x=-Math.PI/2;
 round(15.5,1.38,.57,.38,ivory,.2,3.05,9.58).rotation.x=-Math.PI/2;
 const paperMat=texture(720,624,c=>{
  c.fillStyle='#f8f0db';c.fillRect(0,0,720,624);c.fillStyle='#494137';c.font='600 34px Courier New';c.fillText('A NOTE FROM THE DESK',75,126);
  c.fillRect(76,150,568,2);c.font='25px Courier New';
  ['Hello, and welcome.','Make yourself at home.','Leave me a little note.'].forEach((line,i)=>c.fillText(line,77,234+i*52));
  c.font='italic 24px Courier New';c.fillText('— Chen Xiang',77,449);
 });
 const sheet=new T.PlaneGeometry(15.5,13.43,12,16),v=sheet.attributes.position;
 for(let i=0;i<v.count;i++){const x=v.getX(i),y=v.getY(i);v.setZ(i,.35*(x/7.75)**2+.42*Math.max(0,-y/6.72)**3);}
 sheet.computeVertexNormals();paperMat.side=T.DoubleSide;
 const paper=add(sheet,paperMat,0,15.33,-9.11,carriage);paper.rotation.x=-.11;paper.name='TypedPaper';
 return root;
};
window.createPortfolioBookends=function(T){
 const root=new T.Group();root.name='PortfolioBasket';
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.64,...extra});
 const white=mat('#f0f3f4'),paper=mat('#fffef8'),clip=mat('#d8e6e6'),metal=mat('#9eafb5',{metalness:.45});
 function add(geometry,material,x,y,z,parent=root){
  const object=new T.Mesh(geometry,material);object.position.set(x,y,z);parent.add(object);return object;
 }
 function roundedShape(w,h,r){
  const a=w/2,b=h/2,s=new T.Shape();
  s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.quadraticCurveTo(a,-b,a,-b+r);s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);
  s.lineTo(-a+r,b);s.quadraticCurveTo(-a,b,-a,b-r);s.lineTo(-a,-b+r);s.quadraticCurveTo(-a,-b,-a+r,-b);return s;
 }
 function rounded(w,h,d,r,material,x,y,z,parent=root){
  const geometry=new T.ExtrudeGeometry(roundedShape(w,h,r),{depth:d,bevelEnabled:false,curveSegments:10});
  geometry.translate(0,0,-d/2);return add(geometry,material,x,y,z,parent);
 }
 function rod(a,b,r=.12){
  const from=new T.Vector3(...a),to=new T.Vector3(...b),v=to.clone().sub(from),mid=from.clone().add(to).multiplyScalar(.5);
  const object=add(new T.CylinderGeometry(r,r,v.length(),8),white,...mid.toArray());
  object.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());
 }
 const bottom=rounded(29.4,19.4,.48,1.2,white,0,.42,0);bottom.rotation.x=-Math.PI/2;
 // Thin powder-coated frames, with a woven diamond mesh on four walls.
 for(const y of [1,12.7]){
  rod([-14,y,-9.3],[14,y,-9.3],.23);rod([-14,y,9.3],[14,y,9.3],.23);
  rod([-14.5,y,-8.8],[-14.5,y,8.8],.23);rod([14.5,y,-8.8],[14.5,y,8.8],.23);
 }
 for(const x of [-14.5,14.5])for(const z of [-9.3,9.3])rod([x,.6,z],[x,12.7,z],.19);
 const points=[];
 function meshWall(width,height,project,handle){
  for(const direction of [-1,1])for(let start=-height;start<=width+height;start+=.65){
   for(let y=.4;y<height;y+=.35){
    const x=start+direction*y,x2=start+direction*(y+.35);
    if(x<0||x>width||x2<0||x2>width)continue;
    if(handle&&Math.abs(x-width/2)<4.2&&y>6.7&&y<9.7)continue;
    points.push(...project(x,y),...project(x2,y+.35));
   }
  }
 }
 for(const z of [-9.3,9.3])meshWall(29,11.6,(x,y)=>[x-14.5,y+.7,z],z>0);
 for(const x of [-14.5,14.5])meshWall(18.6,11.6,(z,y)=>[x,y+.7,z-9.3],false);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));
 root.add(new T.LineSegments(geo,new T.LineBasicMaterial({color:'#d5dfe2'})));
 const grip=roundedShape(9.0,3.3,1.6);grip.holes.push(roundedShape(7.9,2.25,1.10));
 add(new T.ExtrudeGeometry(grip,{depth:.26,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:2}),white,0,8.8,9.35);
 const colors=['#a5c6eb','#c3b4e5','#a5ddcf','#9aadd8','#b2dce5'];
 const names=['工业设计','交互设计','体验与服务','AIGC','视觉与信息'];
 const files=new T.Group();files.name='Folders';root.add(files);
 const leanAngles=[.12,.22,.32,.42,.51];
 let baseX=-12.5;
 for(let i=0;i<5;i++){
  const folder=new T.Group();folder.name='PortfolioFolder'+(i+1);
  if(i>0)baseX+=20*(Math.tan(leanAngles[i])-Math.tan(leanAngles[i-1]))+1.20;
  folder.position.set(baseX,1.1,0);folder.rotation.z=leanAngles[i];files.add(folder);
  const h=21+(i%2)*.5,coverMat=mat(colors[i],{transparent:true,opacity:.48,side:T.DoubleSide,depthWrite:false});
  rounded(15.3,h-.7,.50,.25,paper,0,h/2,0,folder).rotation.y=Math.PI/2;
  for(const x of [-.39,.39])rounded(16.7,h,.08,.44,coverMat,x,h/2,0,folder).rotation.y=Math.PI/2;
  add(new T.BoxGeometry(.87,h,.18),mat(colors[i]),0,h/2,8.30,folder);
  const fastener=rounded(1.25,7.7,.28,.25,clip,.60,9.1,6.65,folder);fastener.rotation.y=Math.PI/2;
  for(const y of [5.8,12.4]){
   const pin=add(new T.CylinderGeometry(.17,.17,.08,16),metal,.81,y,6.65,folder);pin.rotation.z=Math.PI/2;
  }
  const canvas=document.createElement('canvas');canvas.width=384;canvas.height=200;
  const c=canvas.getContext('2d');c.fillStyle='#f7fbfb';c.fillRect(0,0,384,200);
  c.fillStyle='#405b72';c.font='bold 31px sans-serif';c.fillText(names[i],23,57);
  c.font='16px monospace';c.fillText('DESIGN ARCHIVE / 0'+(i+1),23,94);
  c.fillRect(23,118,338,2);c.font='32px Georgia';c.fillText('Chen Xiang',23,166);
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
  const label=add(new T.PlaneGeometry(6.2,3.23),new T.MeshBasicMaterial({map:tex}),.448,4.1,-3.8,folder);label.rotation.y=Math.PI/2;
  // Slim upper-right index tab, visible above the basket rim.
  rounded(3.3,1.1,.12,.22,mat(colors[i]),.47,h+.35,-6.15,folder).rotation.y=Math.PI/2;
 }
 const cup=new T.Group();cup.name='CorkPencilCup';cup.position.set(10.45,.75,3.7);root.add(cup);
 const corkCanvas=document.createElement('canvas');corkCanvas.width=corkCanvas.height=256;
 const corkContext=corkCanvas.getContext('2d');
 corkContext.fillStyle='#b68b58';corkContext.fillRect(0,0,256,256);
 let seed=729;
 for(let i=0;i<6200;i++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%256;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;const y=seed%256;
  corkContext.fillStyle=i%3?'#77573345':'#ecd1a077';
  corkContext.fillRect(x,y,i%4===0?2:1,i%5===0?2:1);
 }
 const corkTexture=new T.CanvasTexture(corkCanvas);corkTexture.colorSpace=T.SRGBColorSpace;
 const cork=mat('#ffffff',{map:corkTexture,roughness:.95});
 const profile=[[0,0],[2.15,0],[2.50,.38],[2.65,1],[2.65,9.35],[2.53,9.7],[2.18,9.77],[2.04,9.5],[2.04,.65],[0,.65]].map(p=>new T.Vector2(...p));
 add(new T.LatheGeometry(profile,56),cork,0,0,0,cup);
 const rim=new T.Mesh(new T.TorusGeometry(2.35,.29,10,56),cork);
 rim.rotation.x=Math.PI/2;rim.position.y=9.48;cup.add(rim);
 const pencil=new T.Group();pencil.name='Pencil';pencil.position.set(-.6,.8,.1);pencil.rotation.z=.10;pencil.rotation.x=-.055;cup.add(pencil);
 const shaft=mat('#273333');
 add(new T.CylinderGeometry(.19,.19,16.5,6),shaft,0,8.25,0,pencil);
 add(new T.ConeGeometry(.19,.86,6),mat('#d8b98b'),0,16.93,0,pencil);
 add(new T.ConeGeometry(.067,.29,6),mat('#313535'),0,17.46,0,pencil);
 rounded(2.2,3.3,.35,.05,mat('#e9d68a'),.65,9.95,-.55,cup).rotation.z=-.075;
 const noteColors=['#edd16e','#e8afb9','#79b9cb'];
 for(const [i,angle] of [-.72,.72,0].entries()){
  const note=new T.Group();note.name='CupNote'+(i+1);
  note.position.set(Math.sin(angle)*2.7,[6.45,5.9,2.6][i],Math.cos(angle)*2.7);
  note.rotation.y=angle;note.rotation.z=[-.07,.11,.035][i];cup.add(note);
  const sheet=new T.PlaneGeometry(2.3,2.55,6,8),vertices=sheet.attributes.position;
  for(let j=0;j<vertices.count;j++){
   const y=vertices.getY(j);vertices.setZ(j,.10*(vertices.getX(j)/1.15)**2+.13*Math.max(0,-y/1.275)**2);
  }
  sheet.computeVertexNormals();
  add(sheet,mat(noteColors[i],{side:T.DoubleSide}),0,0,.025,note);
  const pin=add(new T.CylinderGeometry(.12,.12,.17,16),metal,0,.91,.18,note);pin.rotation.x=Math.PI/2;
 }
 return root;
};
window.createColorFan=function(T){
 const root=new T.Group();root.name='ColorFan';
 const strips=[];
 function outline(w,h,r){
  const s=new T.Shape(),x=w/2;
  s.moveTo(-x+r,0);s.lineTo(x-r,0);s.quadraticCurveTo(x,0,x,r);s.lineTo(x,h-r);s.quadraticCurveTo(x,h,x-r,h);
  s.lineTo(-x+r,h);s.quadraticCurveTo(-x,h,-x,h-r);s.lineTo(-x,r);s.quadraticCurveTo(-x,0,-x+r,0);return s;
 }
 const w=2.8,h=17.5,pinY=.85;
 const geometry=new T.ExtrudeGeometry(outline(w,h,.29),{depth:.035,bevelEnabled:false,curveSegments:12});
 geometry.translate(0,-pinY,0);
 const paper=new T.MeshStandardMaterial({color:'#f9f6eb',roughness:.9});
 function printedMaterial(hue,index,cover=false){
  const canvas=document.createElement('canvas');canvas.width=224;canvas.height=1400;
  const c=canvas.getContext('2d');c.fillStyle='#faf9f3';c.fillRect(0,0,224,1400);
  if(cover){
   c.fillStyle='#58a8c4';c.fillRect(0,0,224,1050);
   c.fillStyle='#f5fcff';c.font='20px monospace';c.fillText('COLOR STUDY',19,60);
   c.save();c.translate(126,950);c.rotate(-Math.PI/2);c.font='bold 57px sans-serif';c.fillText('DESIGN PALETTE',0,0);c.restore();
   c.fillStyle='#34434e';c.font='bold 25px sans-serif';c.fillText('CHEN XIANG',19,1110);
   c.font='17px monospace';c.fillText('CMF / 2026',19,1150);
  }else{
   for(let j=0;j<5;j++){
    const light=79-j*10,shade=new T.Color().setHSL(hue,.48,light/100);
    c.fillStyle='#'+shade.getHexString();c.fillRect(0,24+j*242,224,183);
    c.fillStyle='#3f4a4f';c.font='17px monospace';c.fillText('#'+shade.getHexString().toUpperCase(),12,232+j*242);
   }
   c.fillStyle='#7c8589';c.font='16px monospace';c.fillText('STUDY '+String(index+1).padStart(2,'0'),12,1274);
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const front=geometry.clone();
  const uv=front.attributes.uv,pos=front.attributes.position;
  for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+w/2)/w,(pos.getY(i)+pinY)/h);
  const materials=[new T.MeshBasicMaterial({map:texture}),paper];
  return {geometry:front,materials};
 }
 const hues=[.54,.56,.59,.63,.69,.75,.84,.94,.04,.09,.13,.32];
 function strip(index,isCover=false){
  const pivot=new T.Group();pivot.position.set(-6,-7,index*.049);root.add(pivot);
  const printed=printedMaterial(hues[index%12],index,isCover);
  const mesh=new T.Mesh(printed.geometry,printed.materials);mesh.name=isCover?'Cover':'SwatchStrip'+index;pivot.add(mesh);
  strips.push(pivot);
 }
 hues.forEach((_,i)=>strip(i));
 strip(12,true);
 const silver=new T.MeshStandardMaterial({color:'#c1ced0',roughness:.3,metalness:.65});
 const rivet=new T.Mesh(new T.CylinderGeometry(.19,.19,.90,32),silver);rivet.rotation.x=Math.PI/2;rivet.position.set(-6,-7,.3);root.add(rivet);
 const head=new T.Mesh(new T.SphereGeometry(.22,20,12),silver);head.scale.z=.35;head.position.set(-6,-7,.80);root.add(head);
 return {root,strips};
};
