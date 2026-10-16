(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const put = (id, value) => { get(id).textContent = value; };
  const all = selector => [...document.querySelectorAll(selector)];
  const workstreams = [
    { area: 'Data integrity', label: 'Employee data', note: 'Roster, elections and plans' },
    { area: 'Implementation gates', label: 'Client approvals', note: 'Documents and validation' },
    { area: 'Carrier handoff', label: 'Carrier handoff', note: 'Acknowledgement pending' },
    { area: 'HRIS mapping', label: 'HRIS mapping', note: 'Field assumptions' }
  ];
  const titles = {
    INACTIVE_ENROLLMENT: 'An enrollment needs an eligibility check.',
    MISSING_START_DATE: 'The employment start date is missing.',
    DUPLICATE_EMPLOYEE: 'An employee ID appears more than once.',
    PROVINCE_MISMATCH: 'The province and plan need reconciliation.',
    UNKNOWN_PLAN: 'The plan identifier needs verification.',
    UNKNOWN_EMPLOYEE: 'An enrollment needs a matching employee.',
    DEPENDENTS_NOT_CONFIRMED: 'Dependent information needs confirmation.',
    MISSING_ENROLLMENT: 'A missing election needs clarification.',
    GATE_SIGNED_AUTHORIZATION: 'Signed authorization is not confirmed.',
    GATE_CARRIER_FORMS_READY: 'Carrier forms are not confirmed ready.',
    GATE_CLIENT_VALIDATION: 'Client validation is still outstanding.',
    'CARRIER_DEMO-CARRIER-B': 'The carrier acknowledgement is outstanding.',
    MAP_STATE: 'The HRIS field mapping needs review.'
  };
  let report; let area = 'Data integrity'; let severity = 'All'; let page = 0; let selectedIndex = null;
  const pageSize = 3;
  const title = issue => titles[issue.code] || issue.code.replaceAll('_', ' ');
  const filtered = () => report.issues.filter(issue => issue.area === area && (severity === 'All' || issue.severity === severity));

  function showDetail(index) {
    selectedIndex = index; const issue = report.issues[index];
    get('action-detail').hidden = false; get('empty-state').hidden = true;
    put('detail-title', title(issue)); put('detail-code', issue.code);
    put('detail-severity', issue.severity === 'BLOCKER' ? 'BLOCKING ACTION' : 'FOR REVIEW');
    get('detail-severity').dataset.severity = issue.severity;
    put('detail-owner', issue.owner); put('detail-action', issue.action);
    all('#action-list [data-issue-index]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.issueIndex) === index)));
    document.body.dataset.issue = issue.code;
  }
  function render() {
    const issues = filtered();
    const totalPages = Math.max(1, Math.ceil(issues.length / pageSize));
    page = Math.min(page, totalPages - 1);
    const visible = issues.slice(page * pageSize, (page + 1) * pageSize);
    all('#workstreams [data-area]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.area === area)));
    all('[data-severity]').forEach(button => {
      if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.severity === severity));
    });
    put('result-count', `${issues.length} matching ${issues.length === 1 ? 'item' : 'items'}`);
    const list = get('action-list'); list.replaceChildren();
    visible.forEach(issue => {
      const index = report.issues.indexOf(issue);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'action-row';
      button.dataset.issueIndex = String(index); button.setAttribute('aria-controls', 'action-detail');
      const marker = document.createElement('span'); marker.className = `action-marker ${issue.severity.toLowerCase()}`; marker.setAttribute('aria-hidden', 'true');
      const body = document.createElement('span'); body.className = 'action-row-copy';
      const heading = document.createElement('strong'); heading.textContent = title(issue);
      const owner = document.createElement('span'); owner.textContent = issue.owner; body.append(heading, owner);
      const arrow = document.createElement('span'); arrow.className = 'action-arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
      button.append(marker, body, arrow); button.addEventListener('click', () => showDetail(index)); list.append(button);
    });
    get('previous-page').disabled = page === 0; get('next-page').disabled = page >= totalPages - 1;
    put('page-summary', issues.length ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, issues.length)} of ${issues.length} matching items` : '0 matching items');
    if (visible.length) showDetail(report.issues.indexOf(visible[0]));
    else {
      selectedIndex = null; get('action-detail').hidden = true; get('empty-state').hidden = false;
      document.body.dataset.issue = 'none';
    }
    document.body.dataset.area = area; document.body.dataset.severity = severity;
  }
  all('.severity-filters [data-severity]').forEach(button => button.addEventListener('click', () => {
    severity = button.dataset.severity; page = 0; render();
  }));
  get('reset-severity').addEventListener('click', () => { severity = 'All'; page = 0; render(); });
  get('previous-page').addEventListener('click', () => { page = Math.max(0, page - 1); render(); });
  get('next-page').addEventListener('click', () => { page += 1; render(); });

  async function load() {
    try {
      const response = await fetch(get('main').dataset.report, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      report = await response.json();
      if (!Array.isArray(report.issues)) throw new Error('Generated issues unavailable');
      put('hero-decision', report.decision === 'NO-GO' ? 'Hold for review.' : report.decision);
      put('hero-counts', `${report.blockers} blocking actions · ${report.reviews} review items`);
      put('hero-employee-count', report.employee_rows); put('hero-enrollment-count', report.enrollment_rows);
      put('decision-note', `${report.decision} under the sample rules`);
      put('artifact-actions-copy', `${report.issues.length} items, each with a priority, responsible team and next action.`);
      workstreams.forEach((stream, index) => {
        const items = report.issues.filter(issue => issue.area === stream.area);
        const blockers = items.filter(issue => issue.severity === 'BLOCKER').length;
        const reviews = items.filter(issue => issue.severity === 'REVIEW').length;
        const button = document.createElement('button'); button.type = 'button'; button.dataset.area = stream.area;
        button.setAttribute('aria-controls', 'review-board');
        const top = document.createElement('span'); top.className = 'workstream-top';
        const number = document.createElement('span'); number.textContent = `0${index + 1}`;
        const count = document.createElement('span'); count.className = 'workstream-count'; count.textContent = `${items.length} ${items.length === 1 ? 'item' : 'items'}`; top.append(number, count);
        const heading = document.createElement('strong'); heading.textContent = stream.label;
        const breakdown = document.createElement('span'); breakdown.className = 'workstream-breakdown';
        const parts = []; if (blockers) parts.push(`${blockers} ${blockers === 1 ? 'blocker' : 'blockers'}`); if (reviews) parts.push(`${reviews} ${reviews === 1 ? 'review' : 'reviews'}`);
        breakdown.textContent = parts.join(' / ') || 'No findings';
        button.append(top, heading, breakdown);
        button.addEventListener('click', () => { area = stream.area; page = 0; render(); }); get('workstreams').append(button);
      });
      render(); document.body.dataset.ready = 'benefits-v2';
    } catch (error) {
      get('load-error').hidden = false; put('load-error', 'The generated report could not load. Open the JSON report or implementation brief to inspect the original findings.');
      get('review-board').hidden = true; put('hero-decision', 'Report unavailable.');
      put('hero-counts', 'Inspect the committed source report.'); document.body.dataset.ready = 'report-unavailable';
    }
  }

  const nav = get('navigation'); const toggle = document.querySelector('.menu-toggle');
  function closeMenu() { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open navigation'); }
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true'; nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open)); toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { closeMenu(); toggle.focus(); } });
  document.addEventListener('click', event => { if (!document.querySelector('.site-header').contains(event.target)) closeMenu(); });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .08 });
    all('.section-heading,.review-board,.decision-intro,.artifact-grid,.about-layout').forEach(element => observer.observe(element));
    const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      nav.querySelectorAll('a').forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    }), { rootMargin: '-15% 0px -65% 0px' });
    all('main section[id]').forEach(section => navObserver.observe(section));
  }
  load();
})();
