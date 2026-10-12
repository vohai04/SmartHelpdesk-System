"""Persistent assignment notifications in the disposable integration database."""
import uuid

def run(c):
 api,ticket,create,check,wait,query,login=[c[k] for k in ['api','ticket','create','check','wait','query','login']]
 admin,customer,category=c['admin'],c['customer'],c['category']
 a1=login('agent1@smarthelpdesk.com','agent123');a2=login('agent2@smarthelpdesk.com','agent123')
 agents=api('/tickets/agents',token=admin)[1];one=next(a['id'] for a in agents if a['email']=='agent1@smarthelpdesk.com');two=next(a['id'] for a in agents if a['email']=='agent2@smarthelpdesk.com')
 def inbox(token):
  status,data=api('/notifications',token=token);assert status==200;return data
 def assignment(token,id):return next((n for n in inbox(token)['items'] if n['ticketId']==id and n['title']=='Ticket assigned to you'),None)
 def action(id,key,**extra):
  status,data=api('/tickets/'+id+'/actions',{'action':key,'expectedVersion':ticket(id,admin)['version'],**extra},admin)
  assert status==200,(status,data)
 def new():
  id=create('case-notification-'+uuid.uuid4().hex[:6],customer,category)
  wait(lambda:ticket(id,admin)['triageStatus']=='Completed');return id
 check('Notification inbox rejects anonymous calls',api('/notifications')[0]==401)
 id=new();action(id,'Assign',assignedToId=one)
 n=wait(lambda:assignment(a1,id))
 check('Offline assignee has persistent unread assignment',not n['read'])
 check('Other agent does not receive assignment alert',assignment(a2,id) is None)
 check('Customer does not receive internal assignment alert',assignment(customer,id) is None)
 status,_=api('/notifications/read',{'ids':[n['id']]},a2)
 check('Foreign recipient cannot mark notification read',status==204 and not assignment(a1,id)['read'])
 api('/notifications/dismiss',{'ids':[n['id']]},a2)
 check('Foreign recipient cannot dismiss notification',assignment(a1,id) is not None)
 # Re-deliver the same outbox event to simulate a crash after delivery.
 query('UPDATE "TicketJobs" SET "Status"=0,"NextAttemptAt"=NOW() WHERE "Id"=%s',(n['eventId'],))
 wait(lambda:query('SELECT "Status" FROM "TicketJobs" WHERE "Id"=%s',(n['eventId'],))[0][0]==2)
 check('Notification retries are idempotent',query('SELECT COUNT(*) FROM "UserNotifications" WHERE "EventId"=%s AND "RecipientId"=%s',(n['eventId'],one))[0][0]==1)
 browser,FE=c['browser'],c['FE'];ctx=browser.new_context(viewport={'width':390,'height':700});page=ctx.new_page()
 page.goto(FE+'/auth/login');page.get_by_placeholder('you@company.com').fill('agent1@smarthelpdesk.com');page.get_by_placeholder('Password',exact=True).fill('agent123');page.get_by_role('button',name='Sign in',exact=True).click();page.wait_for_url(FE+'/')
 page.get_by_role('button',name='Notifications',exact=True).click()
 link=page.locator('.notifications-panel a').filter(has_text='Ticket assigned to you').filter(has_text='case-notification')
 link.first.wait_for();check('Offline assignment appears after login',True)
 page.reload();page.get_by_role('button',name='Notifications',exact=True).click();link.first.wait_for();check('Assignment survives page reload',True)
 link.first.click();page.wait_for_url(FE+'/tickets/'+id)
 wait(lambda:assignment(a1,id)['read']);check('Opening notification marks it read on server',True)
 page.goto(FE+'/settings');page.wait_for_timeout(1000)
 live=new();action(live,'Assign',assignedToId=one)
 page.get_by_role('button',name='Notifications',exact=True).click()
 page.locator('.notifications-panel a[href="/tickets/'+live+'"]').filter(has_text='Ticket assigned to you').wait_for()
 check('Live assignment reaches assignee bell',True)
 page.get_by_role('button',name='Notifications',exact=True).click()
 page.evaluate("async()=>{const {signalRService}=await import('/src/services/signalrService.ts');signalRService.stopConnection()}")
 missed=new();action(missed,'Assign',assignedToId=one);wait(lambda:assignment(a1,missed))
 page.evaluate("async()=>{const {signalRService}=await import('/src/services/signalrService.ts');signalRService.startConnection()}")
 page.wait_for_timeout(1000);page.get_by_role('button',name='Notifications',exact=True).click()
 page.locator('.notifications-panel a[href="/tickets/'+missed+'"]').filter(has_text='Ticket assigned to you').wait_for()
 check('Reconnect recovers missed assignment',True)
 page.screenshot(path=str(c['OUT']/'mobile-notifications.png'))
 action(missed,'Assign',assignedToId=two,reason='Transfer ownership for notification check')
 wait(lambda:assignment(a2,missed));wait(lambda:any(n['ticketId']==missed and n['title']=='Ticket reassigned' for n in inbox(a1)['items']))
 check('Reassignment alerts both old and new owners',True)
 shown=inbox(a1)['items'];api('/notifications/dismiss',{'ids':[n['id'] for n in shown]},a1)
 page.reload();page.get_by_role('button',name='Notifications',exact=True).click()
 page.get_by_text("You're all caught up!",exact=True).wait_for();check('Dismissed notifications stay dismissed after reload',True)
 ctx.close()
