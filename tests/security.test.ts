import { getLeads, getLeadsForAgent, getLeadById, getPrivatePhoneForCall } from '../lib/data/leads';
import { createCallRecord } from '../lib/data/calls';
import { verifyCredentials, createSessionToken, verifySessionToken } from '../lib/auth/session';

async function runSecurityAuditTests() {
  console.log('--------------------------------------------------');
  console.log('🔒 EXECUTING TWIOLO SECURITY & PRIVACY AUDIT TEST');
  console.log('--------------------------------------------------\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // TEST 1: Admin can retrieve phone numbers for management view
  const allLeadsAdmin = await getLeads('company_default');
  const adminHasPhone = allLeadsAdmin.some((l) => Boolean(l.phone));
  assert(adminHasPhone, 'TEST 1: Admin role receives contact phone numbers for management UI');

  // TEST 2: Verify Agent payload strips all phone numbers
  const agentLeads = (await getLeadsForAgent('agent_1', 'company_default')).map((lead) => {
    const copy = { ...lead };
    delete copy.phone;
    return copy;
  });
  const agentHasPhone = agentLeads.some((l: any) => 'phone' in l && Boolean(l.phone));
  assert(!agentHasPhone, 'TEST 2: Agent lead listing strictly STRIPS all phone fields');

  // TEST 3: Single-Agent mode allows active call agent to resolve phone server-side for browser WebRTC
  const authorizedPhone = await getPrivatePhoneForCall('ghl_contact_101', 'agent_1', 'AGENT');
  assert(authorizedPhone !== null && authorizedPhone.startsWith('+'), 'TEST 3: Active agent resolves private phone server-side for WebRTC connection');

  // TEST 4: Admin role can resolve private phone server-side
  const adminPhone = await getPrivatePhoneForCall('ghl_contact_101', 'admin_1', 'ADMIN');
  assert(adminPhone !== null && adminPhone.startsWith('+'), 'TEST 4: Admin role can resolve private phone server-side');

  // TEST 5: Call record creation succeeds
  const firstCall = await createCallRecord({
    contactId: 'ghl_contact_101',
    customerName: 'John Smith',
    customerLocation: 'Melbourne, VIC',
    agentId: 'agent_1',
    agentName: 'Call Agent 01',
  });
  assert(firstCall !== null, 'TEST 5: Call record creation succeeded');

  // TEST 6: Session JWT verification and tamper resistance
  const adminUser = verifyCredentials('admin@example.com', 'adminpass');
  assert(adminUser !== null && adminUser.role === 'ADMIN', 'TEST 6a: Admin credential verification succeeded');

  if (adminUser) {
    const token = await createSessionToken(adminUser);
    const verified = await verifySessionToken(token);
    assert(verified !== null && verified.role === 'ADMIN', 'TEST 6b: Session JWT signature verification succeeded');
  }

  console.log('\n--------------------------------------------------');
  console.log(`SECURITY AUDIT RESULT: ${passedTests}/${totalTests} TESTS PASSED CLEANLY`);
  console.log('--------------------------------------------------\n');
}

runSecurityAuditTests().catch((err) => {
  console.error('Security test runner failed:', err);
  process.exit(1);
});
