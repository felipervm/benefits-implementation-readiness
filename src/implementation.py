import csv,json
from pathlib import Path
from analyze import audit,read
ROOT=Path(__file__).resolve().parents[1]
def check_rows(name):
 with (ROOT/'data'/name).open(newline='',encoding='utf8') as f:return list(csv.DictReader(f))
def assess(employees,enrollments,plans,checklist,carrier,field_map):
 d=audit(employees,enrollments,plans)
 tasks=[{'code':x['code'],'severity':x['severity'],'owner':x['owner'],'action':x['action'],'area':'Data integrity'} for x in d['issues']]
 def add(c,s,o,a,area):tasks.append(dict(code=c,severity=s,owner=o,action=a,area=area))
 required={'kickoff_scope':'Client implementation','signed_authorization':'Client HR','effective_date_approved':'Client HR','carrier_forms_ready':'Carrier Relations','platform_mapping_review':'Systems / Implementation','client_validation':'Client HR'}
 if len(checklist)!=len(required) or {x['item'] for x in checklist}!=set(required):raise ValueError('Missing or duplicated implementation gate')
 for x in checklist:
  if x['status']!='complete':add('GATE_'+x['item'].upper(),'BLOCKER',required[x['item']],'Confirm '+x['item'].replace('_',' ')+' with evidence','Implementation gates')
 for x in carrier:
  if x['ack_status']!='confirmed':add('CARRIER_'+x['carrier_ref'],'BLOCKER','Carrier Relations','Obtain acknowledgement from '+x['carrier_ref'],'Carrier handoff')
 fields={x['source_field']:x for x in field_map}
 for key in ('id','hireDate','status','state','terminationDate'):
  if key not in fields:raise ValueError('Missing HRIS field: '+key)
  if fields[key]['validation_status']!='verified':add('MAP_'+key.upper(),'REVIEW','Systems / Implementation','Validate HRIS mapping '+key,'HRIS mapping')
 blockers=sum(x['severity']=='BLOCKER' for x in tasks);reviews=sum(x['severity']=='REVIEW' for x in tasks)
 return {'decision':'NO-GO' if blockers else 'CONDITIONAL GO — approval required' if reviews else 'READY FOR FORMAL SIGN-OFF','data_decision':d['decision'],'blockers':blockers,'reviews':reviews,'data_blockers':d['blockers'],'data_reviews':d['reviews'],'employee_rows':d['employee_rows'],'enrollment_rows':d['enrollment_rows'],'issues':tasks,'by_area':{a:sum(x['area']==a for x in tasks) for a in ['Data integrity','Implementation gates','Carrier handoff','HRIS mapping']},'caveat':'Fictional case; no real eligibility or carrier activation verified.'}
def main():
 d=assess(read('employees.csv'),read('enrollments.csv'),read('plans.csv'),check_rows('onboarding_checklist.csv'),check_rows('carrier_handoff.csv'),check_rows('hris_field_mapping.csv'))
 (ROOT/'data/implementation_report.json').write_text(json.dumps(d,indent=2)+'\n')
 with (ROOT/'data/implementation_actions.csv').open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=['area','code','severity','owner','action']);w.writeheader();w.writerows(d['issues'])
 print(d['decision'],d['blockers'],'blockers',d['reviews'],'reviews')
if __name__=='__main__':main()
