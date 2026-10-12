"""Live theme regression checks. Reads seeded local data; no account/ticket writes."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path(__file__).resolve().parents[1]/'artifacts'/'themes'
OUT.mkdir(parents=True,exist_ok=True)
results=[]
def contrast(a,b):
 def lum(c):
  v=[int(c[i:i+2],16)/255 for i in (1,3,5)]
  v=[x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v]
  return sum(x*w for x,w in zip(v,[.2126,.7152,.0722]))
 x,y=sorted([lum(a),lum(b)]);return (y+.05)/(x+.05)
with sync_playwright() as p:
 browser=p.chromium.launch()
 for width in [320,1440]:
  for theme in ['light','dark']:
   ctx=browser.new_context(viewport={'width':width,'height':844 if width==320 else 960},ignore_https_errors=True)
   ctx.add_init_script(f"if (!localStorage.getItem('theme')) localStorage.setItem('theme','{theme}'); document.addEventListener('DOMContentLoaded',()=>window.initialTheme=document.documentElement.dataset.theme)")
   page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto('http://127.0.0.1:5178/auth/login');assert page.locator('html').get_attribute('data-theme')==theme;assert page.evaluate('window.initialTheme')==theme
   page.get_by_placeholder('you@company.com').fill('admin@smarthelpdesk.com');page.get_by_placeholder('Password',exact=True).fill('admin123');page.get_by_role('button',name='Sign in',exact=True).click();page.wait_for_url('http://127.0.0.1:5178/')
   api=ctx.request.get('https://localhost:7055/api/tickets?pageSize=1',headers={'Authorization':'Bearer '+page.evaluate("JSON.parse(localStorage.getItem('auth-storage-v2')).state.token")}).json()
   routes=['/','/tickets','/profile','/settings','/users','/admin/categories','/admin/audit-logs']
   if api.get('items'):routes.append('/tickets/'+api['items'][0]['id'])
   for route in routes:
    page.goto('http://127.0.0.1:5178'+route);page.wait_for_load_state('networkidle');page.wait_for_function("document.querySelectorAll('.skeleton').length===0")
    assert page.locator('html').get_attribute('data-theme')==theme
    assert page.evaluate("document.querySelector('.app-main').scrollWidth<=document.querySelector('.app-main').clientWidth")
    page.screenshot(path=str(OUT/f'{width}-{theme}-{route.strip("/").replace("/","-") or "overview"}.png'))
    results.append({'test':f'{width} {theme} {route}','status':'passed'})
   tokens=page.evaluate("""()=>{const s=getComputedStyle(document.documentElement);return Object.fromEntries(['surface-default','surface-bg','text-primary','text-secondary','text-tertiary','accent','accent-subtle','text-on-accent','danger','danger-subtle','success','success-subtle','warning','warning-subtle'].map(k=>[k,s.getPropertyValue('--'+k).trim()]))}""")
   for text in ['text-primary','text-secondary','text-tertiary']:
    for bg in ['surface-default','surface-bg']:assert contrast(tokens[text],tokens[bg])>=4.5,(theme,text,bg,contrast(tokens[text],tokens[bg]))
   for semantic in ['accent','danger','success','warning']:assert contrast(tokens[semantic],tokens[semantic+'-subtle'])>=4.5,(theme,semantic)
   assert contrast(tokens['accent'],tokens['text-on-accent'])>=4.5
   results.append({'test':f'{width} {theme} text / badge / primary contrast','status':'passed'})
   page.get_by_role('button',name='Notifications',exact=True).click()
   assert page.locator('.notifications-panel').evaluate("el=>getComputedStyle(el).backgroundColor")==page.locator('.app-header').evaluate("el=>getComputedStyle(el).backgroundColor")
   page.screenshot(path=str(OUT/f'{width}-{theme}-notifications.png'));page.get_by_role('button',name='Notifications',exact=True).click()
   page.get_by_role('button',name='Account menu',exact=True).click();page.locator('[role=menu]').wait_for()
   assert page.locator('[role=menu]').evaluate("el=>getComputedStyle(el).backgroundColor")==page.locator('.app-header').evaluate("el=>getComputedStyle(el).backgroundColor")
   page.keyboard.press('Escape')
   page.goto('http://127.0.0.1:5178/tickets');page.get_by_role('button',name='New Ticket',exact=True).click();dialog=page.get_by_role('dialog');dialog.wait_for()
   assert dialog.locator('input').first.evaluate('el=>getComputedStyle(el).color')==page.locator('.app-main').evaluate('el=>getComputedStyle(el).color')
   page.screenshot(path=str(OUT/f'{width}-{theme}-create-dialog.png'));page.keyboard.press('Escape')
   target='dark' if theme=='light' else 'light'
   page.get_by_role('button',name='Switch to '+target+' mode',exact=True).click();page.reload();page.wait_for_load_state('networkidle')
   assert page.locator('html').get_attribute('data-theme')==target
   page.goto('http://127.0.0.1:5178/auth/login');assert page.locator('html').get_attribute('data-theme')==target;assert page.evaluate('window.initialTheme')==target
   results.append({'test':f'{width} {theme} portals / toggle / reload / auth initial theme','status':'passed'})
   page.goto('http://127.0.0.1:5178/tickets')
   second=ctx.new_page();second.goto('http://127.0.0.1:5178/profile');second.locator('.theme-toggle').wait_for()
   page.get_by_role('button',name='Switch to '+theme+' mode',exact=True).click()
   second.wait_for_function('document.documentElement.dataset.theme === "'+theme+'"')
   second.get_by_role('button',name='Switch to '+target+' mode',exact=True).click()
   page.wait_for_function('document.documentElement.dataset.theme === "'+target+'"');second.close()
   for variant in ['default','destructive']:
    page.evaluate("""async variant=>{const module=await import('/src/hooks/use-toast.ts');window.themeTestToast=module.toast({title:'Theme preview',description:'Local visual check',variant});}""",variant)
    toast=page.locator('[data-radix-toast-announce-exclude]').first
    page.get_by_text('Theme preview',exact=True).wait_for()
    popup=page.get_by_text('Theme preview',exact=True).locator('xpath=ancestor::li[1]')
    color=popup.evaluate('el=>getComputedStyle(el).backgroundColor')
    expected=page.evaluate("key=>{const el=document.createElement('div');el.style.background='var(--'+key+')';document.body.append(el);const c=getComputedStyle(el).backgroundColor;el.remove();return c}", 'danger-subtle' if variant=='destructive' else 'surface-default')
    assert color==expected,(variant,color,expected)
    page.screenshot(path=str(OUT/f'{width}-{target}-toast-{variant}.png'))
    page.evaluate('window.themeTestToast.dismiss()');page.get_by_text('Theme preview',exact=True).wait_for(state='hidden')
   results.append({'test':f'{width} {theme} cross-tab synchronization / default and error toast','status':'passed'})
   assert not errors,errors
   ctx.close()
 for preferred in ['light','dark']:
  ctx=browser.new_context(color_scheme=preferred);page=ctx.new_page();page.goto('http://127.0.0.1:5178/auth/login')
  assert page.locator('html').get_attribute('data-theme')==preferred
  results.append({'test':f'System preference {preferred} on first visit','status':'passed'});ctx.close()
 browser.close()
report={'passed':len(results),'failed':0,'results':results}
(OUT/'report.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
