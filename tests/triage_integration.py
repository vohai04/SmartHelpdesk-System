"""Durable triage integration tests with a disposable PostgreSQL DB, local fake AI
and local failing SMTP. No real email or paid AI calls. Requires psycopg + Playwright.
"""
import json, os, re, shutil, socketserver, subprocess, threading, time, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib import request, error
import psycopg
from psycopg import sql
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts'/'triage';OUT.mkdir(parents=True,exist_ok=True)
API='http://127.0.0.1:5179';FE='http://127.0.0.1:5180'
db_created=False
results=[];calls={};burst_active=0;burst_max=0;lock=threading.Lock();server_process=None;frontend_process=None
settings=json.loads((ROOT/'SmartHelpdesk.WebApi/appsettings.json').read_text(encoding='utf-8-sig'))
development=ROOT/'SmartHelpdesk.WebApi/appsettings.Development.json'
if development.exists():settings.update(json.loads(development.read_text(encoding='utf-8-sig')))
connection=os.environ.get('ConnectionStrings__DefaultConnection',settings['ConnectionStrings']['DefaultConnection'])
parts=dict(x.split('=',1) for x in connection.split(';') if '=' in x)
params={k:v for key,value in parts.items() for k,v in [( {'host':'host','port':'port','database':'dbname','username':'user','user id':'user','password':'password'}.get(key.lower(),''),value)] if k}
DB='smartdesk_triage_test_'+uuid.uuid4().hex[:12]
assert re.fullmatch(r'smartdesk_triage_test_[a-f0-9]{12}',DB)
admin_params={**params,'dbname':'postgres'}
def check(name,condition,detail=None):
 assert condition,name+': '+str(detail)
 results.append({'test':name,'status':'passed','detail':detail});print('PASS '+name,flush=True)
def wait(fn,timeout=25):
 end=time.monotonic()+timeout
 while time.monotonic()<end:
  value=fn()
  if value:return value
  time.sleep(.15)
 raise AssertionError('Timed out waiting for '+getattr(fn,'__name__','condition'))
def api(path,data=None,token=None,method=None):
 headers={'Content-Type':'application/json'}
 if token:headers['Authorization']='Bearer '+token
 req=request.Request(API+'/api'+path,data=json.dumps(data).encode() if data is not None else None,headers=headers,method=method)
 try:
  with request.urlopen(req,timeout=10) as response:return response.status,json.loads(response.read() or 'null')
 except error.HTTPError as e:return e.code,json.loads(e.read() or 'null')
def query(statement,args=()):
 with psycopg.connect(**{**params,'dbname':DB}) as db:
  return db.execute(statement,args).fetchall() if statement.lstrip().upper().startswith('SELECT') else db.execute(statement,args).rowcount
class FakeAI(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_POST(self):
  global burst_active,burst_max
  if self.headers.get('x-goog-api-key') != 'local-test-only':
   self.send_response(403);self.end_headers();self.wfile.write(b'{}');return
  body=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
  prompt=body['contents'][0]['parts'][0]['text']
  match=re.search(r'case-[a-z]+',prompt);case=match.group() if match else 'case-success'
  with lock:calls[case]=calls.get(case,0)+1;attempt=calls[case]
  if case=='case-transient' and attempt==1:
   self.send_response(429);self.end_headers();self.wfile.write(b'{}');return
  delay=5 if case=='case-timeout' else 8 if case=='case-restart' and attempt==1 else 1.5
  if case=="case-burst":
   with lock:burst_active+=1;burst_max=max(burst_max,burst_active)
  time.sleep(delay)
  if case=="case-burst":
   with lock:burst_active-=1
  result={'priority':'Bogus' if case=='case-invalid' else '1' if case=='case-numeric' else 'High','sentiment':'Bình thường','summary':'Test classification.'}
  text='invalid json' if case=='case-json' else json.dumps(result,ensure_ascii=False)
  try:
   self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers()
   self.wfile.write(json.dumps({'candidates':[{'content':{'parts':[{'text':text}]}}]}).encode())
  except OSError:pass
class SlowSMTP(socketserver.BaseRequestHandler):
 def handle(self):
  time.sleep(10)
  try:self.request.sendall(b'421 Local test SMTP unavailable\r\n')
  except OSError:pass
ai=ThreadingHTTPServer(('127.0.0.1',0),FakeAI);smtp=socketserver.ThreadingTCPServer(('127.0.0.1',0),SlowSMTP);smtp.daemon_threads=True
for server in [ai,smtp]:threading.Thread(target=server.serve_forever,daemon=True).start()
base_env={**os.environ,'ASPNETCORE_ENVIRONMENT':'Development','ConnectionStrings__DefaultConnection':re.sub(r'(?i)Database=[^;]*','Database='+DB,connection),
 'Gemini__ApiKey':'local-test-only','Gemini__Endpoint':f'http://127.0.0.1:{ai.server_port}/generate',
 'EmailSettings__Host':'127.0.0.1','EmailSettings__Port':str(smtp.server_address[1]),'EmailSettings__Username':'','EmailSettings__Password':'',
 'EmailSettings__FromAddress':'test@example.invalid','EmailSettings__FromName':'Local test','TicketJobs__TimeoutSeconds':'3','TicketJobs__PollIntervalMilliseconds':'100'}
def stop_backend():
 global server_process
 if server_process and server_process.poll() is None:server_process.kill();server_process.wait(timeout=10)
def start_backend(enabled=True):
 global server_process
 env={**base_env,'TicketJobs__Enabled':str(enabled).lower()}
 log=open(OUT/'backend.log','ab')
 server_process=subprocess.Popen(['dotnet',str(ROOT/'SmartHelpdesk.WebApi/bin/Debug/net8.0/SmartHelpdesk.WebApi.dll'),'--urls',API],cwd=ROOT/'SmartHelpdesk.WebApi',env=env,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
 log.close()
 def ready():
  if server_process.poll() is not None:raise AssertionError('Test BE failed to start; inspect artifacts/triage/backend.log')
  try:return request.urlopen(API+'/swagger/v1/swagger.json',timeout=1).status==200
  except (OSError,error.URLError):return False
 wait(ready,45)
def login(email,password):
 status,data=api('/auth/login',{'email':email,'password':password});assert status==200,(status,data);return data['token']
def ticket(id,token):
 status,data=api('/tickets/'+id,token=token);assert status==200,(status,data);return data
def create(case,token,category):
 start=time.monotonic();status,data=api('/tickets',{'title':case,'description':'Local integration test description.','categoryId':category},token)
 assert status==201,(status,data)
 check(case+' initial response unclassified',data.get('priority') is None and data.get('triageStatus')=='Pending',data)
 check(case+' create returns without waiting for AI',time.monotonic()-start<2,{'milliseconds':round((time.monotonic()-start)*1000)})
 return data.get('id',data.get('Id'))
try:
 with psycopg.connect(**admin_params,autocommit=True) as db:db.execute(sql.SQL('CREATE DATABASE {}').format(sql.Identifier(DB)))
 db_created=True
 start_backend(False)
 admin=login('admin@smarthelpdesk.com','admin123');customer=login('customer.vip@gmail.com','cust123')
 category=api('/categories',token=admin)[1][0]['id']
 check('Migration retains historical priorities',query('SELECT COUNT(*) FROM "Tickets" WHERE "Priority" IS NOT NULL')[0][0]==3)
 pending=create('case-success',customer,category)
 check('Ticket and four jobs are persisted atomically',query('SELECT COUNT(*) FROM "TicketJobs" WHERE "TicketId"=%s',(pending,))[0][0]==4)
 check('Queued ticket has no Medium priority',ticket(pending,admin)['priority'] is None)
 stop_backend();start_backend()
 with sync_playwright() as p:
  browser=p.chromium.launch();frontend_env={**os.environ,'VITE_API_URL':API+'/api','VITE_HUB_URL':API+'/hubs/notifications'}
  log=open(OUT/'frontend.log','w')
  frontend_process=subprocess.Popen([shutil.which('node'),str(ROOT/'SmartHelpdesk.Frontend/node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port','5180','--strictPort'],cwd=ROOT/'SmartHelpdesk.Frontend',env=frontend_env,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW);log.close()
  def fe_ready():
   try:return request.urlopen(FE,timeout=1).status==200
   except OSError:return False
  wait(fe_ready)
  pages=[];events={};js_errors=[]
  for role,email,password,width in [('Admin','admin@smarthelpdesk.com','admin123',1440),('Customer','customer.vip@gmail.com','cust123',390),('Other','contact@abc.com','cust123',390)]:
   ctx=browser.new_context(viewport={'width':width,'height':900});page=ctx.new_page();page.set_default_timeout(10000);events[role]=[]
   def websocket(ws,role=role):
    def received(frame):
     if isinstance(frame,str):
      for chunk in frame.split('\x1e'):
       try:
        data=json.loads(chunk)
        if data.get('target')=='TicketTriageUpdated':events[role].append(data['arguments'][0])
       except (ValueError,KeyError):pass
    ws.on('framereceived',received)
   page.on('websocket',websocket);page.on('pageerror',lambda e:js_errors.append(str(e)))
   page.goto(FE+'/auth/login');page.get_by_placeholder('you@company.com').fill(email);page.get_by_placeholder('Password',exact=True).fill(password);page.get_by_role('button',name='Sign in',exact=True).click();page.wait_for_url(FE+'/');page.goto(FE+'/tickets');page.wait_for_load_state('networkidle');pages.append(page)
  if os.environ.get('WORKFLOW_ONLY')!='1':
   done=wait(lambda: (d if (d:=ticket(pending,admin))['triageStatus']=='Completed' else None))
   check('Persisted queued job survives restart',done['priority']=='High' and done['isAiTriaged'])
   # Create via the real customer UI, then observe a realtime update on both lists.
   customer_page=pages[1];customer_page.get_by_role('button',name='New Ticket',exact=True).click();dialog=customer_page.get_by_role('dialog')
   dialog.get_by_placeholder('E.g., Cannot connect to VPN').fill('case-realtime');dialog.get_by_placeholder('Provide as much detail as possible...').fill('Local realtime integration test description.');dialog.locator('select').select_option(category)
   with customer_page.expect_response(lambda r:r.request.method=='POST' and r.url.endswith('/api/tickets')) as created:
    dialog.get_by_role('button',name='Create Ticket',exact=True).click()
   new_id=created.value.json()['id'];dialog.wait_for(state='hidden')
   for page in pages[:2]:page.get_by_role('link').filter(has_text='case-realtime').first.wait_for()
   customer_page.screenshot(path=str(OUT/'mobile-pending.png'))
   wait(lambda:ticket(new_id,admin)['triageStatus']=='Completed')
   for page in pages[:2]:
    row=page.get_by_role('link').filter(has_text='case-realtime').first
    page.wait_for_function("id=>Array.from(document.querySelectorAll('a')).some(el=>el.href.endsWith('/tickets/'+id)&&el.innerText.includes('High'))",arg=new_id)
   check('Admin and owner receive typed realtime completion',all(any(e['ticketId']==new_id and e['triageStatus']=='Completed' for e in events[r]) for r in ['Admin','Customer']))
   check('Other customer receives no foreign ticket events',not any(e['ticketId']==new_id for e in events['Other']))
   customer_page.screenshot(path=str(OUT/'mobile-completed.png'))
   # A completed triage refreshes staff-only AI details but not messages.
   detail=create('case-detail',customer,category)
   pages[0].goto(FE+'/tickets/'+detail);pages[0].locator('.app-main textarea').wait_for();pages[0].wait_for_load_state('networkidle')
   message_reads=[]
   pages[0].on('request',lambda r:message_reads.append(r.url) if '/messages' in r.url else None)
   pages[0].get_by_text('Test classification.',exact=False).wait_for()
   check('AI details update without reloading chat',not message_reads,message_reads)
   before=len(message_reads);unrelated=create('case-unrelated',customer,category)
   wait(lambda:ticket(unrelated,admin)['triageStatus']=='Completed');pages[0].wait_for_timeout(300)
   check('Unrelated ticket events do not refresh open chat',len(message_reads)==before)
   # Deliberately drop the connection while the result changes, then reconcile.
   pages[1].evaluate("async()=>{const {signalRService}=await import('/src/services/signalrService.ts');signalRService.stopConnection()}")
   missed=create('case-missed',customer,category);wait(lambda:ticket(missed,admin)['triageStatus']=='Completed')
   pages[1].evaluate("async()=>{const {signalRService}=await import('/src/services/signalrService.ts');signalRService.startConnection()}")
   pages[1].wait_for_function("id=>Array.from(document.querySelectorAll('a')).some(el=>el.href.endsWith('/tickets/'+id)&&el.innerText.includes('High'))",arg=missed)
   check('Reconnect reconciles missed completion',True)
   # Two AI slots actually process concurrent work.
   first=create('case-burst-a',customer,category);second=create('case-burst-b',customer,category)
   wait(lambda:ticket(first,admin)['triageStatus']=='Completed' and ticket(second,admin)['triageStatus']=='Completed')
   check('Bounded AI lane handles concurrent jobs',burst_max==2 and calls.get('case-burst')==2,{'peak':burst_max})
   for case in ['case-invalid','case-json','case-numeric','case-timeout','case-transient']:
    id=create(case,customer,category);expected='Completed' if case=='case-transient' else 'Failed'
    d=wait(lambda: (d if (d:=ticket(id,admin))['triageStatus']==expected else None),40)
    check(case+' bounded retry result',d['priority']=='High' if expected=='Completed' else d['priority'] is None and not d['isAiTriaged'],d['triageStatus'])
    check(case+' attempt count',query('SELECT "Attempts" FROM "TicketJobs" WHERE "TicketId"=%s AND "Kind"=0',(id,))[0][0]==(2 if expected=='Completed' else 3))
   manual=create('case-manual',customer,category)
   wait(lambda:calls.get('case-manual',0)>0)
   status,_=api('/tickets/'+manual,{'priority':'Urgent'},admin,'PUT');assert status==204 or status==200,status
   d=wait(lambda:(d if (d:=ticket(manual,admin))['triageStatus']=='Completed' else None),30)
   check('AI preserves concurrent human priority',d['priority']=='Urgent' and d['prioritySource']=='Manual')
   count=calls['case-manual']
   query('INSERT INTO "TicketJobs" ("Id","TicketId","Kind","Status","Attempts","NextAttemptAt","CreatedAt","IsDeleted") VALUES (%s,%s,0,0,0,NOW(),NOW(),FALSE)',(uuid.uuid4(),manual))
   wait(lambda:query('SELECT COUNT(*) FROM "TicketJobs" WHERE "TicketId"=%s AND "Kind"=0 AND "Status"=2',(manual,))[0][0]==2)
   check('Duplicate AI job is idempotent',calls['case-manual']==count)
   status,_=api('/tickets/'+manual,{'priority':'999'},admin,'PUT');check('Invalid manual priority rejected',status==400)
   restarting=create('case-restart',customer,category);wait(lambda:calls.get('case-restart',0)>0)
   stop_backend()
   # Initial SignalR handshake failure must retry when the server returns.
   pages[2].evaluate("async()=>{const {signalRService}=await import('/src/services/signalrService.ts');signalRService.stopConnection();signalRService.startConnection()}")
   query('UPDATE "TicketJobs" SET "NextAttemptAt"=NOW()-INTERVAL \'1 second\' WHERE "TicketId"=%s AND "Kind"=0',(restarting,));start_backend()
   d=wait(lambda:(d if (d:=ticket(restarting,admin))['triageStatus']=='Completed' else None),30)
   check('Expired processing lease resumes after crash',d['priority']=='High')
   pages[2].wait_for_timeout(3500)
   restored=create('case-restored',customer,category);wait(lambda:ticket(restored,admin)['triageStatus']=='Completed')
   pages[1].wait_for_function("id=>Array.from(document.querySelectorAll('a')).some(el=>el.href.endsWith('/tickets/'+id)&&el.innerText.includes('High'))",arg=restored)
   check('SignalR automatically recovers after backend restart',True)
   for page in pages[:2]:page.wait_for_function('document.querySelectorAll(".skeleton").length===0');page.wait_for_timeout(500)
   filtered=api('/tickets?priority=Unclassified',token=admin)[1]
   check('Unclassified filter excludes classified tickets',filtered['items'] and all(t['priority'] is None for t in filtered['items']))
   metrics=api('/analytics/dashboard',token=admin)[1]
   check('Analytics counts unclassified independently of Medium',metrics['ticketsByPriority'].get('Unclassified',0)>=4 and metrics['ticketsByPriority'].get('Medium')==1)
   check('SMTP failures do not block or fake success',query('SELECT COUNT(*) FROM "TicketJobs" WHERE "Kind"=1 AND "Status"=3')[0][0]>0)
  from notification_cases import run as run_notifications
  run_notifications(globals())
  from workflow_cases import run as run_workflow
  workflow=run_workflow(globals())
  check('No frontend JavaScript errors',not js_errors,js_errors)
  browser.close()
except Exception as exc:
 results.append({'test':'integration run','status':'failed','detail':str(exc)});print('FAIL '+str(exc),flush=True)
 raise
finally:
 for uploaded in globals().get('test_uploads',[]):
  upload_root=(ROOT/'SmartHelpdesk.WebApi/wwwroot/uploads').resolve()
  path=(upload_root/Path(uploaded).name).resolve()
  if path.parent==upload_root and re.match(r'^[0-9a-f-]{36}_workflow\.png$',path.name):path.unlink(missing_ok=True)
 stop_backend()
 if frontend_process and frontend_process.poll() is None:frontend_process.kill();frontend_process.wait(timeout=10)
 ai.shutdown();smtp.shutdown()
 if db_created:
  with psycopg.connect(**admin_params,autocommit=True) as db:db.execute(sql.SQL('DROP DATABASE IF EXISTS {} WITH (FORCE)').format(sql.Identifier(DB)))
 report={'passed':sum(r['status']=='passed' for r in results),'failed':sum(r['status']=='failed' for r in results),'results':results}
 (OUT/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding='utf-8');print(json.dumps({'passed':report['passed'],'failed':report['failed']}),flush=True)
