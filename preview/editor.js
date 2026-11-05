window.createWorkspaceEditor=function(T,{scene,camera,canvas,objects,enabled=true}){
 const names={desk:'桌子',chair:'椅子',computer:'电脑',typewriter:'打字机',basket:'文件收纳篮',fan:'扇形色卡',turntable:'唱片机',records:'唱片展示栏',badge:'ID 卡',lamp:'台灯',toolbox:'提手收纳盒',print:'装饰画',plant:'龟背竹',stand:'唱片机边几'};
 const storageKey='chenxiang-workspace-layout-v2';
 const snapshot=()=>Object.fromEntries(Object.entries(objects).map(([id,o])=>[id,{position:o.position.toArray(),rotation:[o.rotation.x,o.rotation.y,o.rotation.z],scale:o.scale.toArray()}]));

 function validate(layout){
  if(!layout||typeof layout!=='object')throw Error('布局格式错误');
  const ids=Object.keys(objects);
  if(Object.keys(layout).length!==ids.length)throw Error('布局物件数量不匹配');
  for(const id of ids)for(const key of ['position','rotation','scale']){
   const value=layout[id]?.[key];
   if(!Array.isArray(value)||value.length!==3||!value.every(Number.isFinite))throw Error('布局数据不完整');
   if(value.some(n=>Math.abs(n)>10000)||(key==='scale'&&value.some(n=>n<.02||n>100)))throw Error('布局数值超出范围');
  }
  return layout;
 }
 function apply(layout){
  validate(layout);
  for(const [id,v] of Object.entries(layout)){const o=objects[id];o.position.fromArray(v.position);o.rotation.set(...v.rotation);o.scale.fromArray(v.scale);}
 }
 if(window.workspaceDefaultLayout?.version===1)apply(window.workspaceDefaultLayout.objects);
 const defaults=snapshot();
 if(!enabled){try{const saved=localStorage.getItem(storageKey);if(saved)apply(JSON.parse(saved));}catch{}return {update:()=>{}};}
 let id='computer',dragEnabled=false,drag=null,dirty=false;
 const panel=document.createElement('aside');panel.id='editor';panel.setAttribute('aria-label','物件摆放编辑器');
 function fields(key,title,step){
  return '<fieldset><legend>'+title+'</legend><div class="axis-fields">'+['x','y','z'].map((axis,i)=>'<label>'+axis.toUpperCase()+'<input type="number" step="'+step+'" data-key="'+key+'" data-axis="'+i+'"></label>').join('')+'</div></fieldset>';
 }
 panel.innerHTML='<h2>摆放编辑器</h2><label>选择物件<select id="object-select">'+Object.keys(objects).map(key=>'<option value="'+key+'">'+names[key]+'</option>').join('')+'</select></label>'+
 fields('position','位置（厘米）',1)+
 '<label>整体大小 <input id="object-size" type="range" min="10" max="300" value="100" step="1"><output id="size-label"></output></label>'+
 fields('rotation','旋转（度）',5)+
 '<p>X 左右 · Y 高低 · Z 前后<br>可开启拖动，在同一高度的平面上移动。</p>'+
 '<div class="edit-actions"><button id="drag-toggle" aria-pressed="false">开启拖动</button><button id="reset-one">重置此物件</button><button id="save-layout">保存摆放</button><button id="export-layout">导出布局</button><button id="import-layout">导入布局</button><button id="reset-all">恢复初始布局</button></div>'+
 '<input id="layout-file" type="file" accept=".json,application/json" hidden><p id="editor-status" role="status"></p>';
 (document.querySelector('#workspace-shell')||document.body).append(panel);document.body.classList.add('editing');
 const status=panel.querySelector('#editor-status'),select=panel.querySelector('select');
 function message(s){status.textContent=s;}
 const helper=new T.BoxHelper(objects[id],0xc89035);helper.material.depthTest=false;helper.renderOrder=10;helper.raycast=()=>{};scene.add(helper);
 function refresh(){
  const o=objects[id];select.value=id;
  panel.querySelectorAll('[data-key]').forEach(input=>{
   const i=Number(input.dataset.axis),key=input.dataset.key;
   const value=key==='rotation'?T.MathUtils.radToDeg(o.rotation[['x','y','z'][i]]):o.position[['x','y','z'][i]];
   input.value=Number(value.toFixed(2));
  });
  const percent=Math.round(o.scale.x/defaults[id].scale[0]*100);
  panel.querySelector('#object-size').value=percent;panel.querySelector('#size-label').textContent=percent+'%';
  helper.setFromObject(o);
 }
 function selectObject(key){id=key;refresh();}
 function changed(){dirty=true;message('已调整，点击“保存摆放”保存在当前浏览器。');helper.update();}
 select.onchange=()=>selectObject(select.value);
 panel.querySelectorAll('[data-key]').forEach(input=>input.onchange=()=>{
  if(!input.value.trim()){refresh();return;}
  const value=Number(input.value);if(!Number.isFinite(value)||Math.abs(value)>10000){refresh();return;}
  const axis=['x','y','z'][Number(input.dataset.axis)],o=objects[id];
  o[input.dataset.key][axis]=input.dataset.key==='rotation'?T.MathUtils.degToRad(value):value;
  changed();refresh();
 });
 panel.querySelector('#object-size').oninput=e=>{
  const factor=Number(e.target.value)/100;
  objects[id].scale.fromArray(defaults[id].scale.map(n=>n*factor));changed();refresh();
 };
 panel.querySelector('#drag-toggle').onclick=e=>{
  dragEnabled=!dragEnabled;e.currentTarget.setAttribute('aria-pressed',String(dragEnabled));e.currentTarget.textContent=dragEnabled?'关闭拖动':'开启拖动';canvas.style.cursor=dragEnabled?'grab':'default';
 };
 panel.querySelector('#reset-one').onclick=()=>{const v=defaults[id],o=objects[id];o.position.fromArray(v.position);o.rotation.set(...v.rotation);o.scale.fromArray(v.scale);changed();refresh();};
 panel.querySelector('#reset-all').onclick=()=>{apply(defaults);changed();refresh();};
 panel.querySelector('#save-layout').onclick=()=>{
  try{localStorage.setItem(storageKey,JSON.stringify(snapshot()));dirty=false;message('摆放已保存，下次打开会自动恢复。');}catch{message('浏览器无法保存，请使用“导出布局”。');}
 };
 panel.querySelector('#export-layout').onclick=()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,objects:snapshot()},null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='chenxiang-workspace-layout.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  message('已导出布局文件，可以把它发回给我。');
 };
 const file=panel.querySelector('#layout-file');
 panel.querySelector('#import-layout').onclick=()=>file.click();
 file.onchange=async()=>{
  try{
   if(!file.files[0])return;
   if(file.files[0].size>100000)throw Error('文件过大');
   const payload=JSON.parse(await file.files[0].text());
   if(payload.version!==1)throw Error('布局版本不匹配');
   apply(payload.objects);changed();refresh();message('布局已导入，确认后点击“保存摆放”。');
  }catch(error){message('导入失败：'+error.message);}finally{file.value='';}
 };
 const ray=new T.Raycaster(),pointer=new T.Vector2(),point=new T.Vector3(),world=new T.Vector3();
 function setRay(e){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);}
 canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  setRay(e);
  const hit=ray.intersectObjects(Object.values(objects),true)[0];if(!hit)return;
  let target=hit.object,key;
  while(target&&!key){key=Object.keys(objects).find(k=>objects[k]===target);target=target.parent;}
  if(!key)return;selectObject(key);
  if(!dragEnabled)return;
  const object=objects[id];object.getWorldPosition(world);
  const plane=new T.Plane(new T.Vector3(0,1,0),-world.y);
  if(!ray.ray.intersectPlane(plane,point))return;
  drag={object,plane,offset:point.clone().sub(world),pointerId:e.pointerId};
  canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';e.preventDefault();
 });
 canvas.addEventListener('pointermove',e=>{
  if(!drag||drag.pointerId!==e.pointerId)return;
  setRay(e);if(!ray.ray.intersectPlane(drag.plane,point))return;
  point.sub(drag.offset);drag.object.parent.worldToLocal(point);drag.object.position.copy(point);
  changed();refresh();
 });
 function release(e){if(drag?.pointerId===e.pointerId){drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);canvas.style.cursor=dragEnabled?'grab':'default';}}
 canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
 try{const saved=localStorage.getItem(storageKey);if(saved){apply(JSON.parse(saved));message('已恢复上次保存的摆放。');}}catch{message('未读取到有效的已保存布局。');}
 refresh();
 return {update:()=>helper.update()};
};
