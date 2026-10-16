import csv,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(name):
 with (ROOT/'data'/name).open(newline='',encoding='utf8') as f:return list(csv.DictReader(f))
def audit(employees,enrollments,plans):
 byid={};issues=[];planmap={p['plan_id']:p for p in plans}
 def add(e,c,s,o,a):issues.append(dict(employee_id=e,code=c,severity=s,owner=o,action=a))
 for e in employees:byid.setdefault(e['employee_id'],[]).append(e)
 for eid,rows in byid.items():
  if len(rows)>1:add(eid,'DUPLICATE_EMPLOYEE','BLOCKER','Employer HR','Confirm authoritative employee ID')
  e=rows[0]
  if not e['start_date']:add(eid,'MISSING_START_DATE','BLOCKER','Employer HR','Supply verified employment start date')
  if e['status']=='terminated' and not e['end_date']:add(eid,'MISSING_TERMINATION_DATE','REVIEW','Employer HR','Check effective termination date')
 for x in enrollments:
  eid=x['employee_id'];e=byid.get(eid,[None])[0];p=planmap.get(x['plan_id'])
  if not e:add(eid,'UNKNOWN_EMPLOYEE','BLOCKER','Employer HR','Reconcile employee with authorized roster');continue
  if not p:add(eid,'UNKNOWN_PLAN','BLOCKER','Carrier Relations','Verify plan identifier');continue
  if e['status']!='active':add(eid,'INACTIVE_ENROLLMENT','BLOCKER','Employer HR','Check status and coverage eligibility')
  if e['province'] not in p['provinces'].split('|'):add(eid,'PROVINCE_MISMATCH','BLOCKER','Carrier Relations','Validate provincial plan mapping')
  if x['coverage']=='family' and x['dependents_confirmed'].lower()!='yes':add(eid,'DEPENDENTS_NOT_CONFIRMED','REVIEW','Client implementation','Confirm dependent information securely')
 for eid,rows in byid.items():
  if rows[0]['status']=='active' and not any(x['employee_id']==eid for x in enrollments):add(eid,'MISSING_ENROLLMENT','REVIEW','Client implementation','Confirm waived coverage or missing form')
 issues.sort(key=lambda x:(0 if x['severity']=='BLOCKER' else 1,x['employee_id'],x['code']))
 b=sum(x['severity']=='BLOCKER' for x in issues);r=sum(x['severity']=='REVIEW' for x in issues)
 return dict(decision='NO-GO' if b else 'CONDITIONAL GO' if r else 'GO',employee_rows=len(employees),enrollment_rows=len(enrollments),blockers=b,reviews=r,issues=issues)
def main():
 d=audit(read('employees.csv'),read('enrollments.csv'),read('plans.csv'))
 (ROOT/'data/report.json').write_text(json.dumps(d,indent=2)+'\n')
 with (ROOT/'data/exceptions.csv').open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=['employee_id','code','severity','owner','action']);w.writeheader();w.writerows(d['issues'])
if __name__=='__main__':main()
