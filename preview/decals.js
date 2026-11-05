// Outline coordinates are in reference-image space. Clip inside the texture
// so the artwork's own white border survives and the outer background disappears.
window.applyTurntableDecals=async function(T,lid){
 const designs=[
  {file:0,frame:[752,495],xy:[-9.4,16.8],w:5.4,angle:1.47,outline:[[31,184],[43,107],[64,59],[91,27],[123,9],[165,5],[206,15],[248,52],[274,96],[298,162],[314,223],[318,292],[307,361],[284,421],[259,460],[213,478],[160,478],[116,454],[80,408],[58,357],[41,296],[34,236]]},
  {file:0,frame:[752,495],xy:[10.3,15.1],w:9.2,angle:-.11,outline:[[348,296],[363,181],[434,128],[441,83],[499,45],[598,55],[652,99],[662,151],[690,177],[711,268],[684,305],[720,335],[726,406],[685,435],[548,441],[452,412],[471,359],[393,348]]},
  {file:1,frame:[447,265],xy:[-7.8,8.6],w:12,angle:-.13,outline:[[25,194],[31,60],[48,46],[58,26],[387,40],[400,65],[424,79],[407,207],[397,219],[385,244],[51,228],[41,210]]},
  {file:2,frame:[775,439],xy:[.9,19.7],w:11.1,angle:.13,outline:[[21,331],[28,308],[49,296],[151,290],[131,275],[124,253],[136,229],[199,199],[170,176],[156,150],[162,124],[182,115],[248,119],[227,81],[239,54],[264,48],[329,81],[330,43],[346,20],[369,15],[390,25],[420,77],[427,55],[446,35],[469,37],[485,55],[501,119],[531,96],[556,93],[573,112],[569,142],[554,181],[603,175],[625,189],[630,211],[615,235],[579,265],[711,255],[734,264],[743,284],[739,302],[724,329],[724,357],[714,375],[696,383],[658,382],[622,395],[290,404],[251,416],[51,419],[33,409],[24,392]]},
  {file:3,frame:[825,642],xy:[1.5,8.1],w:2.75,angle:.15,outline:[[202,76],[211,62],[224,46],[266,40],[317,32],[352,35],[381,50],[396,72],[398,105],[390,125],[403,143],[405,173],[391,197],[350,218],[342,250],[322,276],[292,293],[258,287],[235,270],[221,246],[217,205],[212,175],[219,146],[208,134]]},
  {file:3,frame:[825,642],xy:[10.7,7.0],w:2.85,angle:-.13,outline:[[574,187],[580,171],[617,154],[635,153],[655,164],[681,207],[699,231],[722,239],[746,296],[766,353],[763,363],[635,414],[620,411],[607,382],[605,357],[594,332],[594,308],[599,286],[590,266],[600,251]]},
  {file:3,frame:[825,642],xy:[-1.7,5.8],w:2.7,angle:.16,outline:[[53,446],[63,404],[80,389],[97,383],[112,367],[164,377],[177,389],[184,408],[203,428],[219,454],[236,479],[242,501],[265,516],[258,539],[248,566],[245,608],[236,617],[199,608],[175,593],[151,577],[124,557],[101,531],[84,505],[71,484],[58,479]]}
 ];
 designs.push(
  {file:4,inside:true,xy:[8.8,13.6],w:8.6,angle:-.13},
  {file:5,inside:true,xy:[-1.3,7.3],w:3.75,angle:.23},
  {file:6,inside:true,xy:[-9.5,15.7],w:8.4,angle:.15},
  {file:7,inside:true,xy:[1.2,19.2],w:4.9,angle:-.24}
 );
 const images=await Promise.all(window.turntableStickerSources.map(src=>new Promise((resolve,reject)=>{
  const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;
 })));
 for(const d of designs){
  const source=images[d.file];
  const frame=d.frame||[source.naturalWidth,source.naturalHeight];
  const outline=d.outline||[[0,0],[frame[0],0],[frame[0],frame[1]],[0,frame[1]]];
  const xs=outline.map(p=>p[0]),ys=outline.map(p=>p[1]);
  const x=Math.min(...xs)-2,y=Math.min(...ys)-2,w=Math.max(...xs)-x+2,h=Math.max(...ys)-y+2;
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');ctx.beginPath();
  outline.forEach(([a,b],i)=>i===0?ctx.moveTo(a-x,b-y):ctx.lineTo(a-x,b-y));
  ctx.closePath();ctx.clip();ctx.drawImage(source,-x,-y,...frame);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const decal=new T.Mesh(new T.PlaneGeometry(d.w,d.w*h/w),new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.06,depthWrite:false,toneMapped:false}));
  decal.name=d.inside?'InteriorSticker':'ExteriorSticker';
  decal.position.set(...d.xy,d.inside?-3.23:-4.19);
  decal.rotation.x=d.inside?0:Math.PI;decal.rotateZ(d.angle);decal.renderOrder=2;
  lid.add(decal);
 }
};
