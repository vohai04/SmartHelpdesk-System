"""Local API + browser smoke checks. Requires Python Playwright and running BE/FE.
Run: python tests/smoke.py --api https://localhost:7055 --frontend http://127.0.0.1:5178
Uses seeded local accounts; writes reports/screenshots to ignored artifacts/smoke.
Only reads application data and submits invalid requests (no persistent mutations).
"""
import argparse
import json
import os
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--api', default='https://localhost:7055')
parser.add_argument('--frontend', default='http://127.0.0.1:5178')
args = parser.parse_args()
OUT = Path(__file__).resolve().parents[1] / 'artifacts' / 'smoke'
OUT.mkdir(parents=True, exist_ok=True)
results = []
accounts = {
    'Admin': (os.getenv('SMOKE_ADMIN_EMAIL', 'admin@smarthelpdesk.com'), os.getenv('SMOKE_ADMIN_PASSWORD', 'admin123')),
    'Agent': (os.getenv('SMOKE_AGENT_EMAIL', 'agent1@smarthelpdesk.com'), os.getenv('SMOKE_AGENT_PASSWORD', 'agent123')),
    'Customer': (os.getenv('SMOKE_CUSTOMER_EMAIL', 'customer.vip@gmail.com'), os.getenv('SMOKE_CUSTOMER_PASSWORD', 'cust123')),
}

def check(name, fn):
    try:
        detail = fn()
        results.append({'test': name, 'status': 'passed', 'detail': detail})
        print('PASS ' + name, flush=True)
        return detail
    except Exception as e:
        results.append({'test': name, 'status': 'failed', 'detail': str(e)[:1600]})
        print('FAIL ' + name + ': ' + str(e)[:300], flush=True)
        return None


def expect(response, status):
    assert response.status == status, f'Expected {status}, got {response.status}: {response.text()[:400]}'
    return response.json() if 'application/json' in response.headers.get('content-type', '') else None

with sync_playwright() as p:
    api = p.request.new_context(ignore_https_errors=True, timeout=15000)
    auth = {}
    tickets = {}
    check('API Swagger', lambda: expect(api.get(args.api + '/swagger/v1/swagger.json'), 200) and 'Swagger available')
    for path in ['/tickets', '/categories', '/users', '/analytics/dashboard', '/auditlogs']:
        check('API anonymous denied ' + path, lambda path=path: expect(api.get(args.api + '/api' + path), 401))
    check('API invalid login', lambda: expect(api.post(args.api + '/api/auth/login', data={'email':'invalid@example.com', 'password':'invalid-password'}), 400))
    check('API login validation', lambda: expect(api.post(args.api + '/api/auth/login', data={'email':'invalid', 'password':''}), 400))
    for role, (email, password) in accounts.items():
        data = expect(api.post(args.api + '/api/auth/login', data={'email':email, 'password':password}), 200)
        assert data['role'] == role
        auth[role] = data
        check('API login ' + role, lambda role=role: {'role':role})
        headers = {'Authorization':'Bearer ' + data['token']}
        def get(path, status=200):
            return expect(api.get(args.api + '/api' + path, headers=headers), status)
        listing = check('API ticket pagination ' + role, lambda: get('/tickets?pageNumber=1&pageSize=100'))
        tickets[role] = listing['items'] if listing else []
        # Keep report summaries free of application data.
        if listing:
            results[-1]['detail'] = {'totalCount':listing['totalCount'], 'loaded':len(listing['items'])}
        check('API categories ' + role, lambda: len(get('/categories')))
        check('API analytics permission ' + role, lambda role=role: (get('/analytics/dashboard',403 if role == 'Customer' else 200) is not None) if role != 'Customer' else get('/analytics/dashboard',403))
        check('API users permission ' + role, lambda role=role: get('/users?pageSize=1',403 if role == 'Customer' else 200) and 'allowed')
        check('API audit permission ' + role, lambda role=role: get('/auditlogs?pageSize=1',200 if role == 'Admin' else 403) and 'allowed')
        check('API agents permission ' + role, lambda role=role: len(get('/tickets/agents')) if role != 'Customer' else get('/tickets/agents',403))
        check('API missing ticket ' + role, lambda: get('/tickets/00000000-0000-0000-0000-000000000001',404) and 'not found')
        if tickets[role]:
            tid = tickets[role][0]['id']
            check('API ticket details ' + role, lambda: get('/tickets/' + tid)['id'] == tid)
            messages = check('API ticket messages ' + role, lambda: get('/tickets/' + tid + '/messages')['totalCount'])
            def filter_check():
                first = tickets[role][0]
                filtered = get('/tickets?status=' + first['status'] + '&priority=' + (first['priority'] or 'Unclassified'))
                assert all(t['status']==first['status'] and t['priority']==first['priority'] for t in filtered['items'])
                return {'count':len(filtered['items'])}
            check('API status and priority filters ' + role, filter_check)
        if role == 'Customer':
            def own_check():
                assert all(t['createdById'] == data['userId'] for t in tickets[role])
                assert all(not t['isAiTriaged'] and t.get('aiSummary') is None for t in tickets[role])
                return {'loaded':len(tickets[role])}
            check('API customer isolation and AI visibility', own_check)
            foreign = next((t for t in tickets['Admin'] if t['createdById'] != data['userId']), None)
            if foreign:
                check('API customer cannot read another ticket', lambda: get('/tickets/' + foreign['id'],404) and 'denied')
                check('API customer cannot read another conversation', lambda: get('/tickets/' + foreign['id'] + '/messages',403) and 'denied')
        check('API create validation ' + role, lambda: expect(api.post(args.api + '/api/tickets',headers=headers,data={'title':'', 'description':'', 'categoryId':None}),400) and 'invalid rejected')

    browser = p.chromium.launch(headless=True)
    def new_context(width=1536, height=960):
        return browser.new_context(viewport={'width':width,'height':height},ignore_https_errors=True, is_mobile=width<768, has_touch=width<768)
    def ui_login(page, role):
        page.goto(args.frontend + '/auth/login')
        page.wait_for_load_state('networkidle')
        page.get_by_placeholder('you@company.com').fill(accounts[role][0])
        page.get_by_placeholder('Password', exact=True).fill(accounts[role][1])
        page.get_by_role('button',name='Sign in',exact=True).click()
        page.wait_for_url(args.frontend + '/',timeout=15000)
        page.locator('.app-main').wait_for()
        page.wait_for_load_state('networkidle')
    def layout(page):
        page.wait_for_function("document.querySelectorAll('.skeleton').length === 0")
        page.evaluate('document.fonts.ready')
        info = page.evaluate("""() => {
          const main = document.querySelector('.app-main');
          return { viewport:innerWidth,document:document.documentElement.scrollWidth,
            mainWidth:main.clientWidth,mainScrollWidth:main.scrollWidth,
            railWidth:0, font:document.fonts.check('14px \"Be Vietnam Pro\"'),
            mobileVisible:getComputedStyle(document.querySelector('.mobile-nav')).display !== 'none' };
        }""")
        assert info['document'] <= info['viewport'] + 1, 'Document overflow: ' + str(info)
        assert info['mainScrollWidth'] <= info['mainWidth'] + 1, 'Main overflow: ' + str(info)
        assert info['mobileVisible'] == (info['viewport'] < 1024), 'Navigation breakpoint: ' + str(info)
        assert info['font'], 'Font missing'
        return info
    def record_errors(page):
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        failed = []
        page.on('response',lambda r: failed.append({'status':r.status,'path':urlparse(r.url).path}) if r.status>=400 and '/api/' in r.url else None)
        return errors,failed
    # Real UI sign-in for each role, check route access and notifications.
    for role in accounts:
        ctx = new_context()
        page = ctx.new_page()
        page.set_default_timeout(7000)
        errors,failed = record_errors(page)
        check('UI login ' + role, lambda role=role: ui_login(page,role))
        check('UI dashboard ' + role,lambda: layout(page))
        page.get_by_role('button',name='Notifications',exact=True).click()
        page.screenshot(path=str(OUT / ('notifications-' + role.lower() + '.png')))
        page.get_by_role('button',name='Notifications',exact=True).click()
        page.goto(args.frontend + '/tickets')
        page.wait_for_url('**/tickets')
        page.wait_for_load_state('networkidle')
        check('UI tickets navigation ' + role,lambda: layout(page))
        def search():
            page.keyboard.press('Control+k')
            box = page.get_by_placeholder('Search tickets by title or description...')
            box.wait_for()
            keyword = tickets[role][0]['title'][:12] if tickets[role] else 'nonexistent-test-title'
            with page.expect_response(lambda r: '/api/tickets?' in r.url and 'keyword=' in r.url):
                box.fill(keyword)
            page.get_by_role('dialog').screenshot(path=str(OUT / ('search-' + role.lower() + '.png')))
            page.keyboard.press('Escape')
            return 'Live API response received'
        check('UI global search ' + role,search)
        check('UI no JavaScript errors ' + role,lambda: None if not errors else (_ for _ in ()).throw(AssertionError(errors)))
        check('UI no failed API requests ' + role,lambda: None if not failed else (_ for _ in ()).throw(AssertionError(failed)))
        ctx.close()

    widths = [320,360,390,430,768,1024,1536]
    for width in widths:
        ctx = new_context(width,844 if width < 768 else 960)
        page = ctx.new_page()
        page.set_default_timeout(7000)
        errors,failed = record_errors(page)
        ui_login(page,'Admin')
        paths = ['/', '/tickets', '/profile', '/settings', '/users', '/admin/categories', '/admin/audit-logs']
        if tickets['Admin']:
            paths.append('/tickets/' + tickets['Admin'][0]['id'])
        for path in paths:
            def visit(path=path):
                page.goto(args.frontend + path)
                page.wait_for_load_state('networkidle')
                page.locator('.app-main').wait_for()
                if path.startswith('/tickets/'):
                    page.locator('.app-main textarea').wait_for()
                label = path.strip('/').replace('/','-') or 'dashboard'
                info = layout(page)
                page.screenshot(path=str(OUT / (str(width)+'-'+label+'.png')),full_page=True)
                if path.startswith('/tickets/'):
                    send = page.get_by_role('button',name='Send',exact=True)
                    send.scroll_into_view_if_needed()
                    box = send.bounding_box()
                    assert box['x'] >= info['railWidth'] and box['x'] + box['width'] <= width + 1, 'Reply button clipped: ' + str(box)
                    assert box['y'] + box['height'] <= page.locator('.app-main').bounding_box()['y'] + page.locator('.app-main').bounding_box()['height'] + 1, 'Reply button hidden below footer: ' + str(box)
                return info
            check('Responsive ' + str(width) + ' ' + path,visit)
        def settings_scroll():
            page.goto(args.frontend + '/profile')
            page.wait_for_url(args.frontend + '/settings')
            page.get_by_role('heading', name='Settings', exact=True).wait_for()
            assert page.get_by_text('My profile', exact=True).count() == 0
            assert page.get_by_text('Account ID', exact=True).count() == 0
            assert page.locator('a[href="/profile"]').count() == 0
            button = page.get_by_role('button', name='Change password', exact=True)
            button.scroll_into_view_if_needed()
            assert button.evaluate("""el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}"""), 'Settings action overlapped while scrolling'
            page.screenshot(path=str(OUT / (str(width)+'-settings-scrolled.png')))
            return 'Legacy profile redirects to settings; no duplicate profile or account ID; security action unobstructed'
        check('Responsive consolidated settings ' + str(width), settings_scroll)
        def navigation():
            page.goto(args.frontend + '/')
            page.wait_for_load_state('networkidle')
            if width < 1024:
                page.get_by_role('button',name='Toggle navigation',exact=True).click()
                page.locator('.nav-backdrop').wait_for(state='visible')
                page.locator('.app-sidebar').get_by_role('link',name='Tickets',exact=True).click()
                page.wait_for_url('**/tickets')
                assert not page.locator('.nav-backdrop').is_visible()
                page.get_by_role('button',name='Toggle navigation',exact=True).click()
                page.get_by_role('button',name='Close sidebar',exact=True).click()
                assert not page.locator('.nav-backdrop').is_visible()
                page.get_by_role('button',name='Toggle navigation',exact=True).click()
                page.get_by_role('button',name='Close navigation',exact=True).click(position={'x':width-8,'y':200})
                assert not page.locator('.nav-backdrop').is_visible()
            else:
                page.get_by_role('button',name='Toggle navigation',exact=True).click()
                page.wait_for_function("document.querySelector('.app-sidebar').getBoundingClientRect().width < 1")
                page.get_by_role('button',name='Toggle navigation',exact=True).click()
            return 'Sidebar opens, closes, and navigation works'
        check('Responsive sidebar ' + str(width), navigation)
        def modal():
            page.goto(args.frontend + '/tickets')
            page.wait_for_load_state('networkidle')
            page.get_by_role('button',name='New Ticket',exact=True).click()
            dialog = page.get_by_role('dialog')
            dialog.wait_for()
            page.get_by_role('button',name='Create Ticket',exact=True).click()
            page.get_by_text('Title must be at least 3 characters',exact=True).wait_for()
            box = dialog.bounding_box()
            assert box['x']>=-1 and box['x']+box['width']<=width+1, str(box)
            assert box['y']>=-1 and box['y']+box['height']<=page.viewport_size['height']+1,str(box)
            page.screenshot(path=str(OUT / (str(width)+'-create-validation.png')),full_page=True)
            page.keyboard.press('Escape')
            return {'dialog':box,'validation':'passed'}
        check('Responsive create form validation ' + str(width),modal)
        def notifications():
            page.get_by_role('button',name='Notifications',exact=True).click()
            box = page.get_by_role('heading',name='Notifications',exact=True).evaluate('(el) => {const b=el.parentElement.parentElement.getBoundingClientRect();return {x:b.x,width:b.width}}')
            page.screenshot(path=str(OUT / (str(width)+'-notifications.png')),full_page=True)
            assert box['x'] >= 0 and box['x']+box['width']<=width+1, 'Notification popup clipped: '+str(box)
            page.get_by_role('button',name='Notifications',exact=True).click()
            return 'Notification content visible'
        check('Responsive notifications ' + str(width),notifications)
        def theme():
            page.get_by_role('button',name='Switch to dark mode',exact=True).click()
            assert page.locator('html').get_attribute('data-theme') == 'dark'
            page.screenshot(path=str(OUT / (str(width)+'-dark.png')),full_page=True)
            page.reload()
            page.wait_for_load_state('networkidle')
            assert page.locator('html').get_attribute('data-theme') == 'dark'
            page.get_by_role('button',name='Switch to light mode',exact=True).click()
            return 'Dark mode persists after reload'
        check('Responsive dark mode ' + str(width),theme)
        check('Responsive no JavaScript errors ' + str(width),lambda: None if not errors else (_ for _ in ()).throw(AssertionError(errors)))
        check('Responsive no failed API requests ' + str(width),lambda: None if not failed else (_ for _ in ()).throw(AssertionError(failed)))
        ctx.close()
    for width,height in [(320,568),(844,390)]:
        ctx = new_context(width,height)
        page = ctx.new_page()
        page.set_default_timeout(7000)
        ui_login(page,'Admin')
        def short_screen():
            page.goto(args.frontend + '/tickets/' + tickets['Admin'][0]['id'])
            page.wait_for_load_state('networkidle')
            page.locator('.app-main textarea').wait_for()
            info = layout(page)
            send = page.get_by_role('button',name='Send',exact=True)
            send.scroll_into_view_if_needed()
            box = send.bounding_box()
            assert box['x'] >= info['railWidth'] and box['x']+box['width']<=width+1,str(box)
            assert box['y']>=64 and box['y']+box['height']<=height-68,str(box)
            page.screenshot(path=str(OUT / (f'{width}x{height}-reply.png')),full_page=True)
            return {'replyButton':box,'layout':info}
        if tickets['Admin']:
            check(f'Responsive short screen {width}x{height}',short_screen)
        ctx.close()
    browser.close()
    api.dispose()

report = {'frontend':args.frontend,'api':args.api,'passed':sum(t['status']=='passed' for t in results),'failed':sum(t['status']=='failed' for t in results),'results':results}
(OUT / 'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'passed':report['passed'],'failed':report['failed'],'report':str(OUT / 'report.json')}),flush=True)
raise SystemExit(1 if report['failed'] else 0)
