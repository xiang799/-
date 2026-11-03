from playwright.sync_api import sync_playwright,expect
import json
from pathlib import Path
import tempfile
ARTIFACTS=Path(tempfile.gettempdir())/"chen-three-browser-artifacts"
ARTIFACTS.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':1440,'height':1080},device_scale_factor=1)
 page=context.new_page();errors=[];bad=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:bad.append((r.status,r.url)) if r.status>=400 else None)
 page.goto('http://127.0.0.1:8000/',wait_until='networkidle')
 page.wait_for_function('window.STUDIO_3D?.ready')
 assert page.evaluate('STUDIO_3D.engine')=='three.js'
 assert page.evaluate('STUDIO_3D.version')=='180'
 assert page.evaluate('STUDIO_3D.diagnostics.objects')==13
 assert page.locator('.flat-fallback').is_visible()==False
 # Select a genuine raycastable surface near each object's projected anchor.
 def hit_point(id):
  point=page.evaluate('''id=>{
   const p=STUDIO_3D.project(id);
   for(const radius of [0,12,24,40,60,85,115])for(const dx of [0,-radius,radius])for(const dy of [0,-radius,radius]){
    if(STUDIO_3D.hitTest(p.x+dx,p.y+dy)===id)return{x:p.x+dx,y:p.y+dy};
   }
   return null;
  }''',id)
  assert point,('unreachable 3D object',id)
  return point
 # Camera responds to pointer and the image rendered on the physical monitor.
 page.mouse.move(200,350)
 page.wait_for_timeout(200)
 before=page.evaluate('STUDIO_3D.cameraPosition')
 page.mouse.move(1190,800);page.wait_for_timeout(250)
 after=page.evaluate('STUDIO_3D.cameraPosition')
 assert before!=after
 for id,category,count in [('industrial','industrial',8),('interaction','interaction',4),('service','service',5),('aigc','aigc',2),('visual','visual',4)]:
  pt=hit_point(id);page.mouse.click(pt['x'],pt['y'])
  expect(page.locator('#content-panel')).to_be_visible(timeout=6000)
  assert 'category='+category in page.url
  expect(page.locator('.project-card')).to_have_count(count)
  page.locator('#panel-close').click();expect(page.locator('#content-panel')).not_to_be_visible()
  page.wait_for_timeout(200)
 # Actual canvas click, then stable reading camera.
 pt=hit_point('monitor');page.mouse.click(pt['x'],pt['y'])
 expect(page.locator('#panel-title')).to_contain_text('搭衣簿',timeout=6000)
 frame=page.evaluate('STUDIO_3D.diagnostics.frames');cam=page.evaluate('STUDIO_3D.cameraPosition')
 page.mouse.move(900,700);page.wait_for_timeout(500)
 assert page.evaluate('STUDIO_3D.cameraPosition')==cam
 assert page.evaluate('STUDIO_3D.diagnostics.frames')<=frame+1
 page.locator('#panel-close').click()
 # All remaining physical desk objects have working destinations.
 for id,title in [('sketchbook','草稿'),('cmf','触手可及'),('about','认真回应'),('contact','有意思'),('guestbook','回声')]:
  page.wait_for_timeout(180);pt=hit_point(id);page.mouse.click(pt['x'],pt['y'])
  expect(page.locator('#panel-title')).to_contain_text(title,timeout=6000)
  page.keyboard.press('Escape');expect(page.locator('#content-panel')).not_to_be_visible()
 for id,dialog in [('music','#music-dialog'),('compose','#compose-dialog')]:
  page.wait_for_timeout(180);pt=hit_point(id);page.mouse.click(pt['x'],pt['y'])
  expect(page.locator(dialog)).to_be_visible(timeout=6000)
  page.keyboard.press('Escape');expect(page.locator(dialog)).not_to_be_visible()
 # Keyboard activation is equivalent to a canvas click.
 label=page.locator('[data-scene="sketchbook"]');label.focus();page.keyboard.press('Enter')
 expect(page.locator('#panel-title')).to_contain_text('草稿',timeout=6000)
 page.locator('#panel-close').click()
 page.locator('#scene-label-toggle').click()
 assert page.locator('#three-workbench').evaluate('(e)=>e.classList.contains("labels-on")')
 page.locator('#scene-label-toggle').click()
 page.locator('#scene-light-toggle').click()
 assert page.evaluate('STUDIO_3D.diagnostics.night')
 page.mouse.move(60,120);page.wait_for_timeout(500)
 page.screenshot(path=str(ARTIFACTS/'three-studio-night.png'),full_page=True)
 page.locator('#scene-light-toggle').click()
 # Four real project textures are selected, and the monitor opens the same case.
 for id,title in [('cable-robot','斜拉索'),('hikeshare','HikeShare'),('jizai','季载')]:
  page.locator('#three-workbench [data-feature="'+id+'"]').click()
  label=page.locator('[data-scene=monitor]');label.focus();page.keyboard.press('Enter')
  expect(page.locator('#panel-title')).to_contain_text(title,timeout=6000)
  page.locator('#panel-close').click()
 page.locator('#three-workbench [data-feature=dayibu]').click()
 # Reduced-motion disables parallax and the delayed object transition.
 page.emulate_media(reduced_motion='reduce');page.mouse.move(50,100);page.wait_for_timeout(300)
 stationary=page.evaluate('STUDIO_3D.cameraPosition')
 page.mouse.move(1100,600);page.wait_for_timeout(300)
 assert all(abs(a-b)<.015 for a,b in zip(stationary,page.evaluate('STUDIO_3D.cameraPosition')))
 # Resize checks cover landscape, narrow phone, and tablet; mobile labels stay legible.
 for width in [320,390,540,760,768,1024,1440]:
  page.set_viewport_size({'width':width,'height':900});page.wait_for_timeout(100)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
 page.set_viewport_size({'width':1440,'height':1080});page.mouse.move(40,100);page.wait_for_timeout(300)
 page.screenshot(path=str(ARTIFACTS/'three-studio-desktop.png'),full_page=True)
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(200)
 page.screenshot(path=str(ARTIFACTS/'three-studio-mobile.png'),full_page=True)
 page.locator('[data-scene=contact]').click()
 expect(page.locator('#panel-title')).to_contain_text('有意思')
 page.reload();page.wait_for_function('window.STUDIO_3D?.ready')
 expect(page.locator('#panel-title')).to_contain_text('有意思')
 page.locator('#panel-close').click()
 # A lost WebGL context restores the fully working illustrated fallback.
 page.evaluate('document.querySelector("#studio-canvas").getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()')
 expect(page.locator('.flat-fallback')).to_be_visible(timeout=6000)
 assert not page.evaluate('window.STUDIO_3D.ready')
 page.locator('.flat-fallback .folder-rust').click()
 expect(page.locator('.project-card')).to_have_count(8)
 assert not errors,errors
 assert not bad,bad
 print(json.dumps({'renderer':'Three.js r180 / real WebGL','physical_objects_clicked':13,'category_filters':[8,4,5,2,4],'pointer_parallax':'passed','reading_camera_freeze':'passed','keyboard_and_mobile':'passed','day_night':'passed','featured_textures':'passed','reduced_motion':'passed','context_loss_fallback':'passed','browser_errors':errors,'broken_assets':bad},ensure_ascii=False))
 browser.close()
