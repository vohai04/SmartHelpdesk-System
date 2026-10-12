"""Checks for short-screen dialogs and keyboard navigation; no data mutations."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path(__file__).resolve().parents[1]/'artifacts'/'settings-modals'
OUT.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch()
 for width,height,theme in [(w,h,t) for w,h in [(320,568),(390,480),(844,390),(1440,900)] for t in ['light','dark']]:
  ctx=browser.new_context(viewport={'width':width,'height':height},ignore_https_errors=True)
  ctx.add_init_script(f"localStorage.setItem('theme','{theme}')")
  page=ctx.new_page();page.set_default_timeout(10000)
  page.goto('http://127.0.0.1:5178/auth/login')
  page.get_by_placeholder('you@company.com').fill('admin@smarthelpdesk.com')
  page.get_by_placeholder('Password',exact=True).fill('admin123')
  page.get_by_role('button',name='Sign in',exact=True).click();page.wait_for_url('http://127.0.0.1:5178/')
  page.goto('http://127.0.0.1:5178/profile')
  page.wait_for_url('http://127.0.0.1:5178/settings')
  page.get_by_role('heading',name='Settings',exact=True).wait_for()
  assert page.get_by_text('My profile',exact=True).count()==0
  assert page.get_by_text('Account ID',exact=True).count()==0
  assert page.locator('a[href="/profile"]').count()==0
  assert page.locator('.settings-summary-details dt').all_text_contents()==['Full name','Email address','Role']
  if width<1024:
   assert page.locator('.mobile-nav a').count()==3
   assert page.locator('.mobile-nav').evaluate('el=>getComputedStyle(el).gridTemplateColumns.split(" ").length')==3
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  results.append({'test':f'{width} {theme} consolidated settings / legacy redirect / navigation','status':'passed'})
  for path,button in [('/settings','Edit profile'),('/settings','Change password')]:
   page.goto('http://127.0.0.1:5178'+path)
   assert page.locator('.app-main input, .app-main form').count()==0
   trigger=page.get_by_role('button',name=button,exact=True)
   trigger.click()
   dialog=page.get_by_role('dialog');dialog.wait_for()
   b=dialog.bounding_box()
   assert b['x']>=0 and b['y']>=0 and b['x']+b['width']<=width+1 and b['y']+b['height']<=height+1,(button,b)
   for control in dialog.locator('input:not([type="file"]), textarea').all():
    assert control.evaluate('el=>parseFloat(getComputedStyle(el).fontSize)')>=16
   submit=dialog.locator('button[type="submit"]')
   if submit.count():
    submit.scroll_into_view_if_needed();box=submit.bounding_box()
    assert 0<=box['y'] and box['y']+box['height']<=height+1,box
   page.screenshot(path=str(OUT/f'{width}x{height}-{theme}-{button.replace(" ","-")}.png'))
   if button=='Edit profile':
    dialog.locator('input:not([disabled])').fill('Unsaved draft')
   else:
    boxes=dialog.locator('input[type=password]').all()
    for box,value in zip(boxes,['invalid-current','new-password-A','new-password-B']):box.fill(value)
    dialog.locator('button[type=submit]').click()
    dialog.get_by_text('New passwords do not match.',exact=True).wait_for()
   page.keyboard.press('Escape');dialog.wait_for(state='hidden')
   page.wait_for_function('el=>el===document.activeElement',arg=trigger.element_handle())
   trigger.click();dialog.wait_for()
   if button=='Edit profile':assert dialog.locator('input:not([disabled])').input_value()=='System Admin'
   else:assert all(box.input_value()=='' for box in dialog.locator('input[type=password]').all())
   page.keyboard.press('Escape');dialog.wait_for(state='hidden')
   results.append({'test':f'{width}x{height} {theme} {button}','status':'passed'})
  if width<1024:
   toggle=page.get_by_role('button',name='Toggle navigation',exact=True)
   toggle.click();page.locator('.nav-backdrop').wait_for(state='visible')
   page.locator('.app-sidebar').get_by_role('button',name='Close sidebar',exact=True).focus()
   page.keyboard.press('Tab')
   assert page.evaluate("document.querySelector('.app-sidebar').contains(document.activeElement)")
   page.keyboard.press('Shift+Tab')
   assert page.evaluate("document.querySelector('.app-sidebar').contains(document.activeElement)")
   page.keyboard.press('Escape');page.locator('.nav-backdrop').wait_for(state='hidden')
   assert toggle.evaluate('el=>el===document.activeElement')
   results.append({'test':f'{width} {theme} keyboard focus trap / Escape / focus restore','status':'passed'})
  ctx.close()
 browser.close()
report={'passed':len(results),'failed':0,'results':results}
(OUT/'regressions.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
