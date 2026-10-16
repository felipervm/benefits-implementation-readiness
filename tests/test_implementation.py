import unittest,sys,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'src'))
from implementation import assess,check_rows
from analyze import read
class ImplementationTests(unittest.TestCase):
 def setUp(self):
  self.e=read('employees.csv');self.n=read('enrollments.csv');self.p=read('plans.csv')
  self.c=check_rows('onboarding_checklist.csv');self.h=check_rows('carrier_handoff.csv');self.m=check_rows('hris_field_mapping.csv')
 def run_check(self):return assess(self.e,self.n,self.p,self.c,self.h,self.m)
 def test_decision(self):self.assertEqual(self.run_check()['decision'],'NO-GO')
 def test_counts(self):self.assertEqual((self.run_check()['blockers'],self.run_check()['reviews']),(10,3))
 def test_carrier(self):self.assertTrue(any(x['code']=='CARRIER_DEMO-CARRIER-B' for x in self.run_check()['issues']))
 def test_mapping(self):self.assertTrue(any(x['code']=='MAP_STATE' for x in self.run_check()['issues']))
 def test_documents(self):self.assertTrue(any(x['code']=='GATE_SIGNED_AUTHORIZATION' for x in self.run_check()['issues']))
 def test_missing_gate_fails(self):
  with self.assertRaises(ValueError):assess(self.e,self.n,self.p,self.c[:-1],self.h,self.m)
 def test_clean_data_still_blocked_without_docs(self):
  e=[dict(employee_id='A',province='ON',status='active',start_date='2025-01-01',end_date='')]
  n=[dict(employee_id='A',plan_id='P-CORE',coverage='individual',dependents_confirmed='yes')]
  self.assertEqual(assess(e,n,self.p,self.c,self.h,self.m)['decision'],'NO-GO')
 def test_ready_requires_signoff(self):
  e=[dict(employee_id='A',province='ON',status='active',start_date='2025-01-01',end_date='')]
  n=[dict(employee_id='A',plan_id='P-CORE',coverage='individual',dependents_confirmed='yes')]
  c=[dict(x,status='complete') for x in self.c];h=[dict(x,ack_status='confirmed') for x in self.h];m=[dict(x,validation_status='verified') for x in self.m]
  self.assertEqual(assess(e,n,self.p,c,h,m)['decision'],'READY FOR FORMAL SIGN-OFF')
 def test_saved_report(self):self.assertEqual(json.loads((ROOT/'data/implementation_report.json').read_text()),self.run_check())
if __name__=='__main__':unittest.main()
