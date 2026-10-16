# Before Go-Live
### Making benefits implementations easier to verify, coordinate, and launch

**Independent proof of work by Felipe Mattos** | Fictional case | [Interactive walkthrough](https://felipervm.github.io/benefits-implementation-readiness/)

> How can an Implementation Analyst help protect a client's launch without passing incomplete data, missing approvals, or unresolved carrier handoffs downstream?

## Why this is relevant to Sterling Brokers

The [published Implementation Analyst role](https://ats.rippling.com/sterling-careers/jobs/1e038908-9c04-45d7-91ea-cd2ee226de09) includes client kickoffs, onboarding validation, carrier coordination, member setup, implementation tracking, audits, and process improvements. Sterling's [public BambooHR integration listing](https://www.bamboohr.com/integrations/listings/sterling-brokers) also documents a relevant HRIS context.

**The hypothesis is not that Sterling has a data-quality problem.** It is that a repeatable, transparent go-live decision can help cross-functional teams resolve implementation dependencies with clearer ownership and communication.

## The fictional result

| Dimension | Simulated outcome | Next owner |
| --- | --- | --- |
| HR roster, enrollment, plans | 6 blocking exceptions + 2 reviews | Employer HR / Carrier Relations |
| Client intake and documents | 3 incomplete gates | Client HR / Implementation |
| Carrier handoff | 1 outstanding acknowledgement | Carrier Relations |
| HRIS field mapping | 1 mapping needs review | Systems / Implementation |
| **Overall** | **NO-GO: 10 blockers, 3 reviews** | **Revalidate, then formal sign-off** |

Ten fictional employee records and nine enrollment records feed the exercise. The decision separates *observed issues, responsible teams, and next actions* — rather than treating a clean spreadsheet as approval to activate coverage.

## Explore the deliverables

The walkthrough separates the overall launch decision from the filtered action list. Explore the four workstreams, distinguish blockers from review items and inspect the responsible team and next action. The visual design uses original conceptual artwork and self-hosted open fonts; see [visual direction and asset provenance](docs/visual_direction.md).

- **[Executive walkthrough](https://felipervm.github.io/benefits-implementation-readiness/)** — a concise go-live narrative and filterable action register
- **[Six-tab Excel action workbook](implementation_readiness.xlsx)** — Decision, Action Register, Client Gates, Carrier Handoff, HRIS Mapping, Instructions
- **[Machine-readable findings](data/implementation_report.json)** and [action-register CSV](data/implementation_actions.csv)
- **[Implementation decision brief](docs/implementation_brief.md)** and [fictional client update](docs/client_update.md)
- **[Deterministic Python audit](src/analyze.py)**, [implementation decision logic](src/implementation.py), and [automated tests](tests/test_implementation.py)

### Reproduce

Python 3.10+; standard library only:

```bash
python -m unittest discover -s tests -v
python src/analyze.py
python src/implementation.py
```

The static website reads the committed JSON report. For local preview:

```bash
python -m http.server 8000
```

Open http://localhost:8000. The Excel workbook is a **static coordination snapshot**. Editing its statuses does not rerun the validation engine.

## Integrity and limitations

This is a **fully independent fictional exercise**, not a Sterling implementation, product integration or coverage determination. No carrier credentials, SCB Connect access, real employees, protected health information or customer records were used. All plans, rules, statuses, deadlines and decisions are illustrative. Passing the hypothetical checks does not create actual insurance coverage or authorize go-live. No operational time savings or real customer outcomes are claimed.

Created by **Felipe Mattos** · [LinkedIn](https://www.linkedin.com/in/felipervm) · [GitHub](https://github.com/felipervm)
