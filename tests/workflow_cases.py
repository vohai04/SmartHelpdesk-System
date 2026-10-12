"""Business workflow assertions, invoked inside the disposable triage harness."""
from concurrent.futures import ThreadPoolExecutor
import uuid

def run(c):
 api,ticket,create,check,wait,query,login=[c[k] for k in ['api','ticket','create','check','wait','query','login']]
 admin,customer,category=c['admin'],c['customer'],c['category']
 a1=login('agent1@smarthelpdesk.com','agent123');a2=login('agent2@smarthelpdesk.com','agent123')
 agents=api('/tickets/agents',token=admin)[1];ids={a['email']:a['id'] for a in agents};one=ids['agent1@smarthelpdesk.com'];two=ids['agent2@smarthelpdesk.com']
 cust_id=query('SELECT "Id" FROM "Users" WHERE "Email"=%s',('customer.vip@gmail.com',))[0][0]
 def new():
  id=create('case-workflow-'+uuid.uuid4().hex[:6],customer,category)
  wait(lambda:ticket(id,admin)['triageStatus']=='Completed');return id
 def action(id,key,token=admin,expected=200,**extra):
  body={'action':key,'expectedVersion':ticket(id,admin)['version'],**extra}
  status,data=api('/tickets/'+id+'/actions',body,token)
  check('Workflow '+key+' returns '+str(expected),status==expected,{'actual':status,'response':data if status!=expected else ''})
  return data
 def message(id,token,internal=False):return api('/tickets/'+id+'/messages',{'ticketId':id,'content':'Workflow test message','isInternalNote':internal},token)
 id=new()
 action(id,'Start',a1,403)
 action(id,'Assign',admin,400,assignedToId=str(cust_id))
 action(id,'Assign',admin,400,assignedToId=str(uuid.uuid4()))
 version=ticket(id,admin)['version']
 with ThreadPoolExecutor(max_workers=2) as pool:
  statuses=list(pool.map(lambda t:api('/tickets/'+id+'/actions',{'action':'Claim','expectedVersion':version},t)[0],[a1,a2]))
 check('Concurrent claims have exactly one winner',sorted(statuses)==[200,409],statuses)
 owner=ticket(id,admin)['assignedToId'];own=a1 if owner==one else a2;other=a2 if owner==one else a1;other_id=two if owner==one else one
 action(id,'ReturnToQueue',own,400)
 action(id,'ReturnToQueue',own,reason='Claimed by mistake')
 check('Unstarted work returns to queue',ticket(id,admin)['assignedToId'] is None)
 action(id,'Claim',own)
 action(id,'Start',own)
 action(id,'ReturnToQueue',own,400,reason='I want to stop')
 status,_=api('/tickets/'+id,{'assignedToId':'00000000-0000-0000-0000-000000000000','expectedVersion':ticket(id,admin)['version'],'reason':'Try legacy unassign'},own,'PUT')
 check('Legacy unassign cannot abandon active work',status==400,status)
 action(id,'RequestTransfer',own,400,assignedToId=owner,reason='Transfer to myself')
 action(id,'RequestTransfer',own,assignedToId=other_id,reason='Progress completed; please continue investigation')
 d=ticket(id,admin);check('Pending handover keeps original owner',d['assignedToId']==owner and d['status']=='InProgress')
 check('Customer sees no internal handover notes',ticket(id,customer)['transferReason'] is None)
 action(id,'RequestTransfer',own,409,assignedToId=other_id,reason='Duplicate request')
 action(id,'AcceptTransfer',own,403)
 action(id,'RejectTransfer',other,reason='Cannot take this request today')
 check('Rejection keeps current owner',ticket(id,admin)['assignedToId']==owner and ticket(id,admin)['transferRequestedAt'] is None)
 action(id,'RequestTransfer',own,assignedToId=other_id,reason='A second handover request')
 action(id,'CancelTransfer',own,reason='I can continue this work')
 action(id,'AcceptTransfer',other,409)
 action(id,'RequestTransfer',own,assignedToId=other_id,reason='Ready to hand over this work')
 # Agent demotion/deactivation cannot strand active responsibility or pending receipt.
 status,_=api('/users/'+owner,token=admin,method='DELETE');check('Cannot disable responsible agent',status==409,status)
 status,_=api('/users/'+other_id+'/role',{'role':0},admin,'PUT');check('Cannot demote pending receiving agent',status==409,status)
 action(id,'AcceptTransfer',other)
 check('Acceptance swaps owner and keeps workflow state',ticket(id,admin)['assignedToId']==other_id and ticket(id,admin)['status']=='InProgress' and ticket(id,admin)['transferRequestedAt'] is None)
 status,_=message(id,own);check('Former owner cannot send public reply',status==403,status)
 status,_=message(id,own,True);check('Another agent can add internal note',status==200,status)
 status,_=api('/tickets/'+id,{'priority':'Urgent'},own,'PUT');check('Former owner cannot edit priority',status==403,status)
 action(id,'WaitForCustomer',other,reason='Please send the affected device serial number')
 before=ticket(id,admin)['version'];status,_=message(id,other,True)
 check('Internal note preserves WaitingForCustomer',status==200 and ticket(id,admin)['status']=='WaitingForCustomer')
 status,_=message(id,customer);check('Customer reply resumes work',status==200 and ticket(id,admin)['status']=='InProgress')
 check('Reply increments ticket version',ticket(id,admin)['version']>before)
 action(id,'Resolve',other,400)
 action(id,'RequestTransfer',other,assignedToId=owner,reason='Resolution needs a second agent')
 resolved_before=api('/analytics/dashboard',token=admin)[1]['resolvedTickets']
 action(id,'Resolve',other,reason='Root cause fixed and verified with the customer')
 check('Resolved metric counts actual resolution',api('/analytics/dashboard',token=admin)[1]['resolvedTickets']==resolved_before+1)
 resolved_at=query('SELECT "ResolvedAt" FROM "Tickets" WHERE "Id"=%s',(id,))[0][0]
 status,_=message(id,other,True)
 check('Internal notes preserve resolution timestamp',status==200 and query('SELECT "ResolvedAt" FROM "Tickets" WHERE "Id"=%s',(id,))[0][0]==resolved_at)
 status,_=message(id,other)
 check('Public staff reply requires reopening resolved work',status==400,status)
 check('Resolution cancels pending transfer',ticket(id,admin)['transferRequestedAt'] is None)
 action(id,'ConfirmResolution',other,403)
 action(id,'ConfirmResolution',customer)
 status,_=message(id,customer);check('Closed ticket rejects direct replies',status==400,status)
 action(id,'Assign',admin,400,assignedToId=owner,reason='Try assigning closed ticket')
 action(id,'Reopen',customer,reason='The issue has returned after restarting')
 check('Reopen retains valid responsible agent',ticket(id,admin)['assignedToId']==other_id and ticket(id,admin)['status']=='InProgress')
 action(id,'RequestTransfer',other,reason='Admin coordination required')
 coord=api('/tickets?assignmentFilter=PendingHandover',token=admin)[1]
 check('Pending handover is discoverable in queue',any(t['id']==id for t in coord['items']))
 # Bring reminder due without waiting one hour; only isolated DB is affected.
 query('UPDATE "TicketJobs" SET "NextAttemptAt"=NOW() WHERE "TicketId"=%s AND "Kind"=5',(id,))
 wait(lambda:query('SELECT COUNT(*) FROM "TicketJobs" WHERE "TicketId"=%s AND "Kind"=5 AND "Status"<>2',(id,))[0][0]==0)
 check('Reminder does not remove current owner',ticket(id,admin)['assignedToId']==other_id)
 action(id,'AcceptTransfer',admin,assignedToId=owner)
 action(id,'Assign',admin,400,assignedToId=other_id)
 action(id,'Assign',admin,assignedToId=other_id,reason='Emergency reassignment by administrator')
 status,_=api('/tickets/'+id+'/actions',{'action':'Close','reason':'Stale client request','expectedVersion':0},admin)
 check('Stale client action rejected',status==409,status)
 action(id,'Close',other,403,reason='Agent tries force closing')
 resolved_before=api('/analytics/dashboard',token=admin)[1]['resolvedTickets']
 action(id,'Close',admin,reason='Duplicate request; tracked under another ticket')
 check('Administrative closure is not counted as successful resolution',api('/analytics/dashboard',token=admin)[1]['resolvedTickets']==resolved_before)
 check('Exception closure has a reason',ticket(id,admin)['closureReason'].startswith('Duplicate'))
 action(id,'Reopen',customer,reason='Need to continue the original request')
 action(id,'Withdraw',customer,reason='Request is no longer needed')
 # Archive only closed work and preserve audit/history.
 status,_=api('/tickets/'+id,token=admin,method='DELETE');check('Closed ticket can be archived',status==204,status)
 status,_=api('/tickets/'+id,token=admin);check('Archived ticket unavailable',status==404,status)
 check('Business actions persist audit records',query('SELECT COUNT(*) FROM "AuditLogs" WHERE "EntityId"=%s',(id,))[0][0]>=15)
 # Exclude inactive agents, reject forged target, reject stale account tokens.
 id2=new();query('UPDATE "Users" SET "IsActive"=FALSE WHERE "Id"=%s',(two,))
 check('Agent list excludes inactive users',all(a['id']!=two for a in api('/tickets/agents',token=admin)[1]))
 action(id2,'Assign',admin,400,assignedToId=two)
 status,_=api('/tickets',token=a2);check('Existing JWT rejects inactive account',status==401,status)
 query('UPDATE "Users" SET "IsActive"=TRUE WHERE "Id"=%s',(two,))
 query('UPDATE "Users" SET "Role"=0 WHERE "Id"=%s',(two,))
 status,_=api('/tickets',token=a2);check('Existing JWT rejects changed role',status==401,status)
 query('UPDATE "Users" SET "Role"=1 WHERE "Id"=%s',(two,))
 status,_=api('/tickets/'+id2,token=admin,method='DELETE');check('Cannot archive live work',status==400,status)
 other_customer=login('contact@abc.com','cust123');action(id2,'Withdraw',other_customer,403,reason='Foreign ticket attempt')
 action(id2,'Withdraw',customer,reason='No longer needed')
 # Exercise the real modal and realtime ownership UI in both themes and small viewports.
 page=c['pages'][0];FE=c['FE'];OUT=c['OUT'];browser=c['browser']
 ui=new();action(ui,'Assign',admin,assignedToId=one);action(ui,'Start',a1)
 page.goto(FE+'/tickets/'+ui);page.get_by_role('button',name='Request handover',exact=True).wait_for()
 for width,height,theme in [(320,568,'light'),(390,480,'dark'),(844,390,'dark'),(1440,900,'light')]:
  page.set_viewport_size({'width':width,'height':height})
  page.evaluate("theme=>{localStorage.setItem('theme',theme);document.documentElement.dataset.theme=theme}",theme)
  if width<1024:
   toggle=page.get_by_role('button',name='Ticket Details',exact=True)
   if toggle.get_attribute('aria-expanded')!='true':toggle.click()
  button=page.get_by_role('button',name='Request handover',exact=True);button.click()
  dialog=page.get_by_role('dialog');dialog.wait_for()
  dialog.locator('#handover-reason').fill('UI handover progress notes')
  dialog.locator('#handover-target').select_option(two)
  submit=dialog.get_by_role('button',name='Confirm',exact=True);submit.scroll_into_view_if_needed()
  box=dialog.bounding_box();button_box=submit.bounding_box()
  check(f'Handover dialog fits {width}x{height} {theme}',box['x']>=-1 and box['y']>=-1 and box['x']+box['width']<=width+1 and box['y']+box['height']<=height+1 and button_box['y']+button_box['height']<=height+1,box)
  check(f'Handover controls use readable font {width}',all(el.evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')>=16 for el in dialog.locator('input,select,textarea').all()))
  page.screenshot(path=str(OUT/f'handover-{width}-{theme}.png'))
  page.keyboard.press('Escape');dialog.wait_for(state='hidden')
  check(f'Handover returns keyboard focus {width}',button.evaluate('e=>e===document.activeElement'))
 page.set_viewport_size({'width':1440,'height':900});page.get_by_role('button',name='Request handover',exact=True).click()
 dialog=page.get_by_role('dialog');dialog.locator('#handover-reason').fill('Finish the investigation on the second device');dialog.locator('#handover-target').select_option(two);dialog.get_by_role('button',name='Confirm',exact=True).click();dialog.wait_for(state='hidden')
 page.get_by_text('Handover awaiting acceptance',exact=True).wait_for()
 check('Real UI request keeps original assignee',ticket(ui,admin)['assignedToId']==one)
 receiver=browser.new_page(viewport={'width':1440,'height':900});receiver.goto(FE+'/auth/login');receiver.get_by_placeholder('you@company.com').fill('agent2@smarthelpdesk.com');receiver.get_by_placeholder('Password',exact=True).fill('agent123');receiver.get_by_role('button',name='Sign in',exact=True).click();receiver.wait_for_url(FE+'/');receiver.goto(FE+'/tickets/'+ui)
 receiver.get_by_role('button',name='Accept handover',exact=True).click();receiver.get_by_role('dialog').get_by_role('button',name='Confirm',exact=True).click();receiver.get_by_role('dialog').wait_for(state='hidden')
 wait(lambda:ticket(ui,admin)['assignedToId']==two)
 page.get_by_text('Trần Hỗ Trợ 2',exact=True).wait_for()
 check('Real UI acceptance updates another tab via realtime',ticket(ui,admin)['transferRequestedAt'] is None)
 # Verify attachment ownership and protected delivery with actual multipart uploads.
 import base64,json
 from urllib import request,error
 png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jNf8AAAAASUVORK5CYII=')
 def upload(token):
  boundary='workflow'+uuid.uuid4().hex
  body=(f'--{boundary}\r\nContent-Disposition: form-data; name="ticketId"\r\n\r\n{ui}\r\n--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="workflow.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+png+f'\r\n--{boundary}--\r\n'.encode())
  req=request.Request(c['API']+'/api/attachments',data=body,headers={'Authorization':'Bearer '+token,'Content-Type':'multipart/form-data; boundary='+boundary})
  try:
   with request.urlopen(req) as response:data=json.loads(response.read());c.setdefault('test_uploads',[]).append(data['filePath']);return response.status,data
  except error.HTTPError as e:return e.code,None
 def download(path,token=None):
  try:
   with request.urlopen(request.Request(c['API']+path,headers={'Authorization':'Bearer '+token} if token else {})) as response:return response.status
  except error.HTTPError as e:return e.code
 status,_=upload(other_customer);check('Foreign customer cannot upload to ticket',status==403,status)
 status,public=upload(customer);check('Requester can upload to own ticket',status==200,status)
 status,_=api('/tickets/'+ui+'/messages',{'ticketId':ui,'content':'Forged attachment claim','attachmentIds':[public['id']]},a2)
 check('Agent cannot attach requester-owned upload',status==400,status)
 status,_=api('/tickets/'+ui+'/messages',{'ticketId':ui,'content':'Public attachment caption','attachmentIds':[public['id']]},customer)
 check('Requester can attach own upload',status==200,status)
 check('Public static attachment route is blocked',download(public['filePath'])==404)
 check('Attachment download requires authentication',download('/api/attachments/'+public['id']+'/content')==401)
 check('Requester can download public attachment',download('/api/attachments/'+public['id']+'/content',customer)==200)
 check('Foreign customer cannot download attachment',download('/api/attachments/'+public['id']+'/content',other_customer)==403)
 status,_=api('/tickets/'+ui+'/messages',{'ticketId':ui,'content':'Reuse attachment','attachmentIds':[public['id']]},customer)
 check('Already attached upload cannot be reused',status==400,status)
 status,private=upload(a2);check('Assigned agent can upload',status==200,status)
 status,_=api('/tickets/'+ui+'/messages',{'ticketId':ui,'content':'Private note with attachment','isInternalNote':True,'attachmentIds':[private['id']]},a2)
 check('Agent can attach file to private note',status==200,status)
 check('Customer cannot download internal note attachment',download('/api/attachments/'+private['id']+'/content',customer)==403)
 check('Staff can download internal note attachment',download('/api/attachments/'+private['id']+'/content',admin)==200)
 page.get_by_text('Private note with attachment',exact=True).wait_for()
 page.locator('img[alt="workflow.png"]').first.wait_for()
 check('Protected attachments render in real browser',True)
 action(ui,'Withdraw',customer,reason='The request is no longer needed')
 page.get_by_role('button',name='Archive ticket',exact=True).wait_for()
 page.get_by_role('button',name='Archive ticket',exact=True).click();page.get_by_role('dialog').get_by_role('button',name='Confirm',exact=True).click();page.wait_for_url(FE+'/tickets')
 check('Real UI archive returns to queue and preserves record',query('SELECT "IsDeleted" FROM "Tickets" WHERE "Id"=%s',(ui,))[0][0])
 receiver.close()
 return {'id':id2,'agent1':a1,'agent2':a2,'one':one,'two':two}
