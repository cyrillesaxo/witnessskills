-- WitnessSkills: P4 Seed - Promoted Field Test Packs
-- Migration: 20260616000003
-- Seeds: wedge_registry, domain_packs, mechanism_nodes,
--        antiwitness_mutations, misconception_signatures

-- ============================================================
-- WEDGE REGISTRY SEED
-- ============================================================

insert into public.wedge_registry (id, label, target_user, primary_cta, source_artifact_types, required_receipts, pass_threshold, fail_threshold, budget_band, status)
values
  ('existing_solution_activation',
   'Existing-Solution Activation',
   'Individual learners with existing courses, tutorials, or JDs',
   'Turn a course or tutorial into active proof',
   array['course','tutorial','documentation','job_description','training_module']::source_type[],
   array['source_submitted','challenge_completed','proof_record_created'],
   3, 3, 'manual_smoke_test', 'promote_field_test'),

  ('ai_generated_backend_code_review',
   'AI-Generated Backend Code Review',
   'Backend engineers reviewing AI-generated pull requests',
   'Can you catch unsafe AI-generated backend code?',
   array['ai_generated_pr','secure_review_checklist']::source_type[],
   array['source_submitted','challenge_completed','proof_record_created'],
   3, 3, 'manual_smoke_test', 'promote_field_test'),

  ('agentic_ai_oversight',
   'Agentic AI Oversight',
   'Engineers and ops teams supervising AI agents',
   'Can users supervise AI agents safely?',
   array['agent_permission_model','policy','incident_summary']::source_type[],
   array['source_submitted','probe_completed','report_forwarded'],
   3, 3, 'manual_smoke_test', 'promote_field_test'),

  ('role_specific_ai_governance',
   'Role-Specific AI Governance',
   'Employees using AI in customer support, HR, legal ops, engineering, finance',
   'Can employees use AI safely in this role?',
   array['policy','training_module','documentation']::source_type[],
   array['source_submitted','probe_completed','report_generated'],
   3, 3, 'manual_smoke_test', 'promote_field_test'),

  ('multi_tenant_saas_architecture',
   'Multi-Tenant SaaS Architecture Reasoning',
   'Staff+ engineers and senior IC reasoning through SaaS architecture',
   'Can engineers preserve SaaS architecture invariants under mutation?',
   array['architecture_prompt','incident_summary','job_description','documentation']::source_type[],
   array['source_submitted','challenge_completed','proof_record_created'],
   3, 3, 'manual_smoke_test', 'promote_field_test')
on conflict (id) do nothing;

-- ============================================================
-- DOMAIN PACKS SEED
-- ============================================================

insert into public.domain_packs (id, wedge_id, promoted_field_test, name, user_facing_title, availability, target_user, estimated_minutes, personal_cta, b2b_cta, responsible_use_copy, status)
values
  ('a1b2c3d4-0001-0001-0001-000000000001',
   'existing_solution_activation',
   'existing_solution_activation',
   'existing-solution-activation-v1',
   'Turn learning into proof',
   'both',
   'Learners with existing courses, tutorials, or JDs they want to activate',
   10,
   'Paste a course, tutorial, or JD. Get one proof challenge.',
   'Send a training module. Get three proof checkpoints.',
   'WitnessSkills does not replace your existing course, training, or workflow. It turns it into active proof.',
   'published'),

  ('a1b2c3d4-0002-0002-0002-000000000002',
   'ai_generated_backend_code_review',
   'ai_generated_backend_code_review',
   'ai-code-review-v1',
   'Review AI-generated code safely',
   'both',
   'Backend engineers reviewing AI-generated pull requests',
   12,
   'Try one AI-generated code review challenge.',
   'Send one anonymized AI-generated PR or secure-review checklist.',
   'This challenge uses realistic but synthetic code scenarios. Results reflect reasoning patterns, not certified security expertise.',
   'published'),

  ('a1b2c3d4-0003-0003-0003-000000000003',
   'agentic_ai_oversight',
   'agentic_ai_oversight',
   'agentic-ai-oversight-v1',
   'Oversee AI agents safely',
   'both',
   'Engineers and operations teams setting boundaries for AI agents',
   10,
   'Try one agent oversight challenge.',
   'Send your agent permission model or escalation policy. Get oversight-boundary probes.',
   'This challenge explores judgment in ambiguous agent scenarios. Results are observational, not predictive of real incidents.',
   'published'),

  ('a1b2c3d4-0004-0004-0004-000000000004',
   'role_specific_ai_governance',
   'role_specific_ai_governance',
   'ai-governance-role-v1',
   'Use AI safely in your role',
   'both',
   'Employees in customer support, HR, legal ops, engineering, finance using AI in their workflow',
   8,
   'Try one AI governance challenge for your role.',
   'Send an AI-use policy, escalation matrix, or QA rubric. Get role-specific misuse probes.',
   'This challenge reflects realistic misuse scenarios. Results describe reasoning patterns, not compliance certification.',
   'published'),

  ('a1b2c3d4-0005-0005-0005-000000000005',
   'multi_tenant_saas_architecture',
   'multi_tenant_saas_architecture',
   'saas-architecture-v1',
   'Reason through SaaS architecture',
   'both',
   'Staff+ engineers and senior IC reasoning under multi-tenant constraints',
   15,
   'Try one SaaS architecture challenge.',
   'Send a staff+ JD, architecture prompt, or anonymized incident. Get a sample architecture-reasoning probe.',
   'Architecture scenarios are synthetic and representative. Results reflect reasoning patterns under constraint change, not certification of production-readiness.',
   'published')
on conflict (id) do nothing;

-- ============================================================
-- MECHANISM NODES - Pack 1: Existing-Solution Activation
-- ============================================================

insert into public.mechanism_nodes (id, pack_id, name, invariant, false_causal_model, expected_expert_reasoning, common_shallow_pattern, severity, tier, stage)
values
  ('b1000001-0001-0001-0001-000000000001',
   'a1b2c3d4-0001-0001-0001-000000000001',
   'Transfer vs Recognition',
   'Recognizing a concept in a new context requires understanding the causal mechanism, not just the surface label.',
   'If you can define a term correctly, you can apply it in novel situations.',
   'Expert identifies whether the mechanism holds under a changed scenario, not just whether the term applies.',
   'Restates the definition or finds the familiar pattern without checking if the mechanism still holds.',
   'high', 'mid', 'discriminate'),

  ('b1000001-0001-0001-0001-000000000002',
   'a1b2c3d4-0001-0001-0001-000000000001',
   'Retrieval vs Re-reading',
   'Active recall from memory builds stronger durable retrieval paths than passive re-exposure.',
   'Reading something multiple times is equivalent to recalling it from memory.',
   'Expert schedules retrieval attempts after learning, not re-reading sessions.',
   'Plans to re-read notes or watch the video again instead of attempting recall.',
   'medium', 'junior', 'recognize'),

  ('b1000001-0001-0001-0001-000000000003',
   'a1b2c3d4-0001-0001-0001-000000000001',
   'Scenario Mutation',
   'A concept is understood when the learner can identify what changes when one condition changes.',
   'Understanding means being able to explain the concept as originally taught.',
   'Expert traces how a change in one variable propagates through the mechanism to a different output.',
   'Answers based on the original scenario without adjusting for the changed condition.',
   'high', 'mid', 'abstract'),

  ('b1000001-0001-0001-0001-000000000004',
   'a1b2c3d4-0001-0001-0001-000000000001',
   'Evidence Specificity',
   'Credible proof of skill requires specific, observable evidence, not general claims of familiarity.',
   'Saying you completed a course is sufficient proof of competency.',
   'Expert articulates a specific decision made, problem solved, or outcome produced as evidence.',
   'Lists course completions or years of experience without specific instances.',
   'medium', 'junior', 'recognize')
on conflict (id) do nothing;

-- ============================================================
-- MECHANISM NODES - Pack 2: AI-Generated Backend Code Review
-- ============================================================

insert into public.mechanism_nodes (id, pack_id, name, invariant, false_causal_model, expected_expert_reasoning, common_shallow_pattern, severity, tier, stage)
values
  ('b2000002-0002-0002-0002-000000000001',
   'a1b2c3d4-0002-0002-0002-000000000002',
   'Authorization Boundary',
   'Authorization must be checked at every execution boundary, not just the entry point.',
   'If the HTTP request is authenticated, all downstream operations are authorized.',
   'Expert checks whether authorization is re-verified when execution crosses a trust boundary (e.g., background job, service call).',
   'Checks that the endpoint has auth middleware but does not trace downstream authorization.',
   'critical', 'senior', 'discriminate'),

  ('b2000002-0002-0002-0002-000000000002',
   'a1b2c3d4-0002-0002-0002-000000000002',
   'Tenant Isolation',
   'Every database query in a multi-tenant system must scope to the correct tenant, including background jobs.',
   'Tenant isolation is enforced by the ORM or framework automatically.',
   'Expert traces whether tenant context is explicitly passed and validated at each query site, including async contexts.',
   'Assumes ORM or RLS handles tenant scoping without checking explicit tenant filters in queries.',
   'critical', 'senior', 'abstract'),

  ('b2000002-0002-0002-0002-000000000003',
   'a1b2c3d4-0002-0002-0002-000000000002',
   'Generated Test Overtrust',
   'AI-generated tests may test the generated implementation, not the correct behavior.',
   'If the tests pass, the code is correct.',
   'Expert checks whether tests were generated from the same prompt as the code and may share the same blind spots.',
   'Accepts green tests as validation without checking test quality or coverage of edge cases.',
   'high', 'mid', 'discriminate'),

  ('b2000002-0002-0002-0002-000000000004',
   'a1b2c3d4-0002-0002-0002-000000000002',
   'Secrets in Generated Code',
   'AI-generated code may embed credentials, tokens, or sensitive values directly in source.',
   'AI models know not to include secrets in code.',
   'Expert searches generated code for hardcoded values matching credential patterns before reviewing logic.',
   'Reviews logic flow without checking for hardcoded secrets or sensitive values.',
   'high', 'junior', 'recognize')
on conflict (id) do nothing;

-- ============================================================
-- MECHANISM NODES - Pack 3: Agentic AI Oversight
-- ============================================================

insert into public.mechanism_nodes (id, pack_id, name, invariant, false_causal_model, expected_expert_reasoning, common_shallow_pattern, severity, tier, stage)
values
  ('b3000003-0003-0003-0003-000000000001',
   'a1b2c3d4-0003-0003-0003-000000000003',
   'Human Approval Threshold',
   'Actions with irreversible or high-impact consequences require human approval before execution.',
   'The agent can be trusted to identify when to escalate based on its training.',
   'Expert defines explicit, quantified thresholds for autonomous action vs required human approval.',
   'Trusts the agent to self-identify escalation scenarios without codified thresholds.',
   'critical', 'senior', 'abstract'),

  ('b3000003-0003-0003-0003-000000000002',
   'a1b2c3d4-0003-0003-0003-000000000003',
   'Permission Boundary Drift',
   'Agent permissions granted for one context do not automatically apply to adjacent contexts.',
   'If an agent is granted permission for task A, it can use those permissions for related task B.',
   'Expert checks whether permission grants are scoped to specific actions and whether adjacent contexts require new grants.',
   'Assumes permissions granted for one task transfer to similar tasks without re-authorization.',
   'high', 'mid', 'discriminate'),

  ('b3000003-0003-0003-0003-000000000003',
   'a1b2c3d4-0003-0003-0003-000000000003',
   'Regulated Data Handling by Agent',
   'Agent access to regulated data (PII, PHI, financial) requires the same controls as human access.',
   'Agent data access is internal and therefore exempt from data handling regulations.',
   'Expert verifies that agent data access is logged, scoped, and governed by the same policies as human access.',
   'Treats agent data access as internal system operation not subject to data governance policies.',
   'critical', 'senior', 'discriminate')
on conflict (id) do nothing;

-- ============================================================
-- MECHANISM NODES - Pack 4: Role-Specific AI Governance
-- ============================================================

insert into public.mechanism_nodes (id, pack_id, name, invariant, false_causal_model, expected_expert_reasoning, common_shallow_pattern, severity, tier, stage)
values
  ('b4000004-0004-0004-0004-000000000001',
   'a1b2c3d4-0004-0004-0004-000000000004',
   'AI Output Verification',
   'AI-generated outputs used in customer-facing or regulated contexts require human verification before use.',
   'If the AI output looks correct, it can be used directly.',
   'Expert identifies which outputs require verification, who is responsible, and what the verification step looks like.',
   'Uses AI output directly when it looks plausible without a verification step.',
   'high', 'junior', 'recognize'),

  ('b4000004-0004-0004-0004-000000000002',
   'a1b2c3d4-0004-0004-0004-000000000004',
   'Policy Escalation Boundary',
   'When an AI-assisted action falls outside explicit policy coverage, the employee must escalate rather than extrapolate.',
   'If the policy does not explicitly forbid something, it is implicitly permitted.',
   'Expert identifies the escalation path when an AI-assisted action is ambiguous under current policy.',
   'Proceeds with the action when policy is silent, assuming silence means permission.',
   'high', 'mid', 'discriminate'),

  ('b4000004-0004-0004-0004-000000000003',
   'a1b2c3d4-0004-0004-0004-000000000004',
   'Sensitive Data in AI Prompts',
   'Customer, employee, or regulated data must not be included in AI prompts sent to external models without explicit authorization.',
   'Using AI to help process data is the same as using any internal tool.',
   'Expert checks whether the data in the prompt is covered by data handling policy and whether the AI provider is an authorized processor.',
   'Pastes customer data into an AI prompt assuming the AI is an internal tool like a spreadsheet.',
   'critical', 'junior', 'recognize')
on conflict (id) do nothing;

-- ============================================================
-- MECHANISM NODES - Pack 5: Multi-Tenant SaaS Architecture
-- ============================================================

insert into public.mechanism_nodes (id, pack_id, name, invariant, false_causal_model, expected_expert_reasoning, common_shallow_pattern, severity, tier, stage)
values
  ('b5000005-0005-0005-0005-000000000001',
   'a1b2c3d4-0005-0005-0005-000000000005',
   'Background Job Tenant Context',
   'Background jobs that process data must carry and enforce explicit tenant context, not inherit it from a request.',
   'Background jobs run in the system context and are not subject to tenant isolation.',
   'Expert traces how tenant context is established in background jobs and verifies it is scoped per-tenant, not global.',
   'Assumes background jobs are safe from tenant bleed because they are not user-initiated requests.',
   'critical', 'senior', 'discriminate'),

  ('b5000005-0005-0005-0005-000000000002',
   'a1b2c3d4-0005-0005-0005-000000000005',
   'Cache Key Tenant Scoping',
   'Cached objects must include tenant identifier in the cache key to prevent cross-tenant data leakage.',
   'The cache is isolated per user session so tenant bleed through cache is not possible.',
   'Expert verifies cache keys include tenant ID and that cache invalidation is scoped correctly on permission changes.',
   'Designs cache keys around user ID or resource ID without including tenant scope.',
   'critical', 'senior', 'abstract'),

  ('b5000005-0005-0005-0005-000000000003',
   'a1b2c3d4-0005-0005-0005-000000000005',
   'Idempotency Under Retry',
   'Operations that may be retried must be idempotent to prevent duplicate side effects.',
   'Retry logic in the job queue prevents duplicate processing.',
   'Expert identifies which operations need explicit idempotency keys and where duplicate side effects (double billing, double send) can occur.',
   'Relies on at-least-once delivery guarantees without adding idempotency at the application layer.',
   'high', 'senior', 'abstract'),

  ('b5000005-0005-0005-0005-000000000004',
   'a1b2c3d4-0005-0005-0005-000000000005',
   'Customer-Managed Key Revocation',
   'When a customer revokes their encryption key, their data must become inaccessible immediately, including cached plaintext.',
   'Key revocation applies to new data; existing cached or in-flight data is unaffected.',
   'Expert traces the revocation flow through cache invalidation, in-flight request cancellation, and background job suspension.',
   'Assumes key revocation only affects new encryption operations, not already-decrypted data in memory or cache.',
   'critical', 'senior', 'abstract')
on conflict (id) do nothing;

-- ============================================================
-- MISCONCEPTION SIGNATURES
-- ============================================================

insert into public.misconception_signatures (id, pack_id, label, false_causal_model, response_pattern, downstream_risk, suggested_practice_next, suggested_reviewer_followup, severity, mechanism_node_ids)
values
  -- Pack 1
  ('c1000001-0001-0001-0001-000000000001',
   'a1b2c3d4-0001-0001-0001-000000000001',
   'Definition-equals-transfer',
   'Correct definition means correct application in novel contexts.',
   'Restates the textbook definition without adjusting for the changed scenario condition.',
   'Uses concepts in wrong contexts; makes errors that correct definition would not predict.',
   'Practice applying the concept in 3 scenarios where one condition changes each time.',
   'Ask: What would change about your answer if X were different? Where does the mechanism break?',
   'high',
   array['b1000001-0001-0001-0001-000000000001']::uuid[]),

  -- Pack 2
  ('c2000002-0002-0002-0002-000000000001',
   'a1b2c3d4-0002-0002-0002-000000000002',
   'Request-path-only authorization',
   'Authentication at the HTTP request boundary means all operations are authorized.',
   'Checks endpoint auth middleware but does not trace authorization through background jobs or service calls.',
   'Authorization bypasses in background jobs, webhooks, or service-to-service calls leading to unauthorized data access.',
   'Trace one code path from a background job trigger to data access and check each authorization point.',
   'Ask: What authorizes this operation when it runs outside an HTTP request context?',
   'critical',
   array['b2000002-0002-0002-0002-000000000001']::uuid[]),

  ('c2000002-0002-0002-0002-000000000002',
   'a1b2c3d4-0002-0002-0002-000000000002',
   'ORM-handles-tenant-isolation',
   'The ORM or framework automatically enforces tenant scoping on all queries.',
   'Reviews business logic without checking whether tenant filters are explicitly present in queries.',
   'Tenant data bleed where one tenant can access another tenant''s data through unscoped queries.',
   'Review three database queries in your codebase and check each for explicit tenant scoping.',
   'Ask: Show me where tenant context is explicitly applied in this query. What happens if tenant_id is missing?',
   'critical',
   array['b2000002-0002-0002-0002-000000000002']::uuid[]),

  -- Pack 3
  ('c3000003-0003-0003-0003-000000000001',
   'a1b2c3d4-0003-0003-0003-000000000003',
   'Agent-self-escalation-trust',
   'A well-trained agent can reliably identify when it should escalate to a human.',
   'Describes escalation as something the agent handles without specifying explicit codified thresholds.',
   'Agents take irreversible actions without human approval because escalation conditions were not explicitly defined.',
   'Define 3 specific quantified thresholds for when agent actions require human approval.',
   'Ask: What is the explicit threshold that triggers escalation? Who receives the escalation and in what timeframe?',
   'critical',
   array['b3000003-0003-0003-0003-000000000001']::uuid[]),

  -- Pack 4
  ('c4000004-0004-0004-0004-000000000001',
   'a1b2c3d4-0004-0004-0004-000000000004',
   'Policy-silence-as-permission',
   'If the AI use policy does not explicitly prohibit an action, it is implicitly allowed.',
   'Proceeds with ambiguous AI-assisted action when policy does not address it directly.',
   'Employees use AI for regulated or sensitive tasks that policy did not anticipate, creating compliance exposure.',
   'For your next ambiguous AI task, identify the escalation path before proceeding.',
   'Ask: What is the escalation path when you encounter a task that policy does not explicitly cover?',
   'high',
   array['b4000004-0004-0004-0004-000000000002']::uuid[]),

  -- Pack 5
  ('c5000005-0005-0005-0005-000000000001',
   'a1b2c3d4-0005-0005-0005-000000000005',
   'Background-job-system-context',
   'Background jobs run in a trusted system context and are not subject to tenant isolation rules.',
   'Describes background job data access without specifying per-tenant scoping of queries.',
   'Background jobs process data across tenant boundaries causing cross-tenant data exposure.',
   'Trace one background job in your system and find where tenant context is established and enforced.',
   'Ask: How does this background job know which tenant''s data to process? What prevents it from processing another tenant''s data?',
   'critical',
   array['b5000005-0005-0005-0005-000000000001']::uuid[]),

  ('c5000005-0005-0005-0005-000000000002',
   'a1b2c3d4-0005-0005-0005-000000000005',
   'Cache-key-session-isolation',
   'Caching per user session prevents cross-tenant data leakage.',
   'Designs cache keys using user ID or resource ID without including tenant scope.',
   'Tenant A can read Tenant B''s cached data when sessions are not tenant-scoped, or when cache keys collide.',
   'Review your caching layer and verify every cache key includes tenant_id as a mandatory prefix.',
   'Ask: If two users from different tenants request the same resource type, would they ever share a cache entry?',
   'critical',
   array['b5000005-0005-0005-0005-000000000002']::uuid[])
on conflict (id) do nothing;

-- ============================================================
-- ANTIWITNESS MUTATIONS - Sample set (Pack 2: AI Code Review)
-- ============================================================

insert into public.antiwitness_mutations (id, pack_id, mechanism_node_id, base_scenario, scenario_change, shallow_answer_it_breaks, expected_preserved_mechanism, expected_expert_response, misconception_signature_ids, maturity)
values
  ('d2000002-0002-0002-0002-000000000001',
   'a1b2c3d4-0002-0002-0002-000000000002',
   'b2000002-0002-0002-0002-000000000001',
   'A Copilot-generated API endpoint checks auth middleware at the route level. The middleware verifies the JWT and sets req.user. The endpoint then calls a service that queries the database using req.user.id.',
   'The same service function is now also called from a background job that processes webhook events. The webhook job does not go through the route middleware.',
   'The endpoint has auth middleware so the service is authorized.',
   'Authorization must be re-verified when the service is called outside the request path (background job context).',
   'The background job context bypasses the route middleware entirely. The service function must perform its own authorization check, not rely on middleware that only runs in the HTTP request path. I would add an explicit authorization check inside the service function itself, or require callers to pass a verified principal object.',
   array['c2000002-0002-0002-0002-000000000001']::uuid[],
   'expert_reviewed'),

  ('d2000002-0002-0002-0002-000000000002',
   'a1b2c3d4-0002-0002-0002-000000000002',
   'b2000002-0002-0002-0002-000000000002',
   'A Cursor-generated data export function queries all records WHERE tenant_id = current_tenant_id(). The current_tenant_id() function reads from a thread-local variable set at request start.',
   'The same export function is now queued as a background job. The background job worker initializes without an HTTP request context, so the thread-local variable is never set.',
   'The query has a tenant_id filter so it is tenant-isolated.',
   'Tenant isolation requires explicit tenant context that survives the async execution boundary.',
   'The thread-local variable is not carried across the async boundary to the background worker. When the job runs, current_tenant_id() returns null or an incorrect value. The query either fails, returns no rows, or returns rows from the wrong tenant depending on the null handling. Explicit tenant_id must be passed as a parameter to the job, not inferred from execution context.',
   array['c2000002-0002-0002-0002-000000000002']::uuid[],
   'expert_reviewed'),

  -- Pack 5: SaaS Architecture
  ('d5000005-0005-0005-0005-000000000001',
   'a1b2c3d4-0005-0005-0005-000000000005',
   'b5000005-0005-0005-0005-000000000002',
   'Your API caches user permission sets with the key: cache:permissions:{user_id}. The cache TTL is 5 minutes. When a user''s role changes, the cache is invalidated by deleting cache:permissions:{user_id}.',
   'You are now operating in a multi-tenant environment. Two users from different tenants happen to have the same user_id integer (IDs are per-tenant sequences, not globally unique).',
   'The cache key includes the user_id so permissions are user-scoped.',
   'Cache keys must include tenant scope when IDs are not globally unique across tenants.',
   'The cache key cache:permissions:{user_id} will collide for users from different tenants who share the same integer ID. User from Tenant A would receive cached permissions from User of Tenant B. The fix is to include tenant_id in the cache key: cache:permissions:{tenant_id}:{user_id}. This is a critical security bug that a shallow cache key review would miss.',
   array['c5000005-0005-0005-0005-000000000002']::uuid[],
   'expert_reviewed'),

  -- Pack 1: Existing-Solution Activation
  ('d1000001-0001-0001-0001-000000000001',
   'a1b2c3d4-0001-0001-0001-000000000001',
   'b1000001-0001-0001-0001-000000000001',
   'A learner just finished a course module on memoization. The module explained that memoization caches the result of a function call so repeated calls with the same input return the cached result immediately.',
   'The learner is now asked to apply memoization to a function whose return value depends not only on its arguments but also on the current time of day.',
   'Memoization caches results of repeated calls with the same input.',
   'Memoization assumes the function is pure (same input always produces same output). Time-dependent functions are not pure.',
   'The standard memoization technique does not apply here because the function is not pure — the same arguments produce different results at different times. Caching the result would return stale data on subsequent calls. The learner should recognize that memoization requires referential transparency and either modify the function to make time an explicit argument (making it pure) or use a time-windowed cache with appropriate TTL instead of pure memoization.',
   array['c1000001-0001-0001-0001-000000000001']::uuid[],
   'expert_reviewed')
on conflict (id) do nothing;
