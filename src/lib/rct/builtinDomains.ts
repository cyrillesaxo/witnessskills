import type { Domain } from './types';

// ---------------------------------------------------------------------------
// Git domain
// ---------------------------------------------------------------------------
const GIT_NODES = [
  {
    id: 'git-commit',
    label: 'Commit & staging area',
    description: 'How the index (staging area) relates to commits and working tree.',
    tier: 'Junior' as const,
    keywords: ['commit', 'stage', 'index', 'add', 'working tree', 'snapshot'],
    negativeKeywords: ['push', 'remote'],
    prerequisites: [],
  },
  {
    id: 'git-branch',
    label: 'Branching model',
    description: 'Branches as lightweight movable pointers to commits.',
    tier: 'Junior' as const,
    keywords: ['branch', 'pointer', 'HEAD', 'checkout', 'detached'],
    negativeKeywords: [],
    prerequisites: ['git-commit'],
  },
  {
    id: 'git-merge',
    label: 'Merge strategies',
    description: 'Fast-forward vs three-way merge vs squash; when each applies.',
    tier: 'Mid' as const,
    keywords: ['merge', 'fast-forward', 'three-way', 'squash', 'conflict', 'ours', 'theirs'],
    negativeKeywords: ['rebase'],
    prerequisites: ['git-branch'],
  },
  {
    id: 'git-rebase',
    label: 'Rebase & history rewriting',
    description: 'Interactive rebase, fixup, reorder; golden rule of rebasing.',
    tier: 'Mid' as const,
    keywords: ['rebase', 'interactive', 'fixup', 'squash', 'cherry-pick', 'history', 'amend'],
    negativeKeywords: ['merge commit'],
    prerequisites: ['git-branch'],
  },
  {
    id: 'git-remote',
    label: 'Remotes & fetch/pull/push',
    description: 'Remote tracking branches, origin, fetch vs pull distinction.',
    tier: 'Mid' as const,
    keywords: ['remote', 'origin', 'fetch', 'pull', 'push', 'tracking', 'upstream'],
    negativeKeywords: [],
    prerequisites: ['git-branch'],
  },
  {
    id: 'git-reflog',
    label: 'Reflog & recovery',
    description: 'Using reflog to recover lost commits, detached HEAD recovery.',
    tier: 'Senior' as const,
    keywords: ['reflog', 'recover', 'lost commit', 'reset', 'ORIG_HEAD'],
    negativeKeywords: [],
    prerequisites: ['git-commit', 'git-branch'],
  },
  {
    id: 'git-hooks',
    label: 'Git hooks & automation',
    description: 'Pre-commit, pre-push, commit-msg hooks; bypassing with --no-verify.',
    tier: 'Senior' as const,
    keywords: ['hook', 'pre-commit', 'pre-push', 'commit-msg', 'husky', 'lint-staged'],
    negativeKeywords: [],
    prerequisites: ['git-commit'],
  },
  {
    id: 'git-objects',
    label: 'Object model (blob/tree/commit/tag)',
    description: 'Content-addressed storage: blobs, trees, commits, annotated tags.',
    tier: 'Senior' as const,
    keywords: ['blob', 'tree', 'object', 'SHA', 'pack', 'content-addressed', 'plumbing'],
    negativeKeywords: [],
    prerequisites: ['git-commit'],
  },
];

export const GIT_DOMAIN: Domain = {
  name: 'Git',
  root: 'git-commit',
  nodes: GIT_NODES,
  grounded: true,
};

// ---------------------------------------------------------------------------
// Gradle domain
// ---------------------------------------------------------------------------
const GRADLE_NODES = [
  {
    id: 'gradle-build',
    label: 'Build lifecycle & tasks',
    description: 'Initialization, configuration, and execution phases; task DAG.',
    tier: 'Junior' as const,
    keywords: ['task', 'lifecycle', 'phase', 'build', 'run', 'assemble', 'check'],
    negativeKeywords: [],
    prerequisites: [],
  },
  {
    id: 'gradle-deps',
    label: 'Dependency configurations',
    description: 'implementation vs api vs runtimeOnly vs compileOnly scopes.',
    tier: 'Junior' as const,
    keywords: ['implementation', 'api', 'runtimeOnly', 'compileOnly', 'testImplementation', 'scope'],
    negativeKeywords: ['maven scope'],
    prerequisites: ['gradle-build'],
  },
  {
    id: 'gradle-multiproject',
    label: 'Multi-project builds',
    description: 'settings.gradle, subprojects, project dependencies, allprojects.',
    tier: 'Mid' as const,
    keywords: ['subproject', 'settings', 'allprojects', 'project dependency', 'include', 'composite'],
    negativeKeywords: [],
    prerequisites: ['gradle-build'],
  },
  {
    id: 'gradle-incremental',
    label: 'Incremental build & caching',
    description: 'UP-TO-DATE checks, build cache, task inputs/outputs fingerprinting.',
    tier: 'Mid' as const,
    keywords: ['incremental', 'UP-TO-DATE', 'cache', 'inputs', 'outputs', 'fingerprint', 'cached'],
    negativeKeywords: [],
    prerequisites: ['gradle-build'],
  },
  {
    id: 'gradle-plugins',
    label: 'Plugin system',
    description: 'Binary plugins, script plugins, convention plugins, buildSrc.',
    tier: 'Mid' as const,
    keywords: ['plugin', 'apply', 'buildSrc', 'convention', 'binary plugin', 'extension'],
    negativeKeywords: [],
    prerequisites: ['gradle-build'],
  },
  {
    id: 'gradle-resolution',
    label: 'Dependency resolution & conflicts',
    description: 'Version conflict resolution, force, strictly, reject, BOM import.',
    tier: 'Senior' as const,
    keywords: ['conflict', 'force', 'strictly', 'reject', 'BOM', 'platform', 'resolution strategy'],
    negativeKeywords: [],
    prerequisites: ['gradle-deps'],
  },
  {
    id: 'gradle-custom-task',
    label: 'Custom task types & workers',
    description: 'Writing typed task classes, worker API, task parallelism.',
    tier: 'Senior' as const,
    keywords: ['DefaultTask', 'TaskAction', 'worker', 'parallel', 'task type', 'lazy configuration'],
    negativeKeywords: [],
    prerequisites: ['gradle-build', 'gradle-incremental'],
  },
];

export const GRADLE_DOMAIN: Domain = {
  name: 'Gradle',
  root: 'gradle-build',
  nodes: GRADLE_NODES,
  grounded: true,
};

// ---------------------------------------------------------------------------
// Docker domain
// ---------------------------------------------------------------------------
const DOCKER_NODES = [
  {
    id: 'docker-image',
    label: 'Images & layers',
    description: 'Union filesystem, layer caching, image vs container distinction.',
    tier: 'Junior' as const,
    keywords: ['image', 'layer', 'union filesystem', 'overlay', 'pull', 'tag'],
    negativeKeywords: [],
    prerequisites: [],
  },
  {
    id: 'docker-dockerfile',
    label: 'Dockerfile instructions',
    description: 'FROM, RUN, COPY, ADD, CMD vs ENTRYPOINT, ENV, ARG, EXPOSE.',
    tier: 'Junior' as const,
    keywords: ['Dockerfile', 'FROM', 'RUN', 'COPY', 'CMD', 'ENTRYPOINT', 'ENV', 'ARG', 'EXPOSE'],
    negativeKeywords: [],
    prerequisites: ['docker-image'],
  },
  {
    id: 'docker-networking',
    label: 'Container networking',
    description: 'Bridge, host, overlay networks; port publishing; DNS resolution.',
    tier: 'Mid' as const,
    keywords: ['bridge', 'host network', 'overlay', 'port', 'publish', 'expose', 'DNS', '-p'],
    negativeKeywords: [],
    prerequisites: ['docker-image'],
  },
  {
    id: 'docker-volumes',
    label: 'Volumes & bind mounts',
    description: 'Named volumes vs bind mounts vs tmpfs; persistence and sharing.',
    tier: 'Mid' as const,
    keywords: ['volume', 'bind mount', 'tmpfs', 'persist', '-v', '--mount'],
    negativeKeywords: [],
    prerequisites: ['docker-image'],
  },
  {
    id: 'docker-compose',
    label: 'Docker Compose',
    description: 'Multi-container apps, service dependencies, health checks, profiles.',
    tier: 'Mid' as const,
    keywords: ['compose', 'service', 'depends_on', 'healthcheck', 'profile', 'scale', 'override'],
    negativeKeywords: [],
    prerequisites: ['docker-networking', 'docker-volumes'],
  },
  {
    id: 'docker-multistage',
    label: 'Multi-stage builds',
    description: 'Build vs runtime stages, minimising final image size, COPY --from.',
    tier: 'Senior' as const,
    keywords: ['multi-stage', 'builder', 'COPY --from', 'distroless', 'scratch', 'slim'],
    negativeKeywords: [],
    prerequisites: ['docker-dockerfile'],
  },
  {
    id: 'docker-security',
    label: 'Container security',
    description: 'Non-root user, read-only filesystem, capabilities, seccomp, secrets.',
    tier: 'Senior' as const,
    keywords: ['non-root', 'USER', 'capability', 'seccomp', 'secret', 'read-only', 'privileged'],
    negativeKeywords: [],
    prerequisites: ['docker-dockerfile'],
  },
];

export const DOCKER_DOMAIN: Domain = {
  name: 'Docker',
  root: 'docker-image',
  nodes: DOCKER_NODES,
  grounded: true,
};

// ---------------------------------------------------------------------------
// npm / Node.js packaging domain
// ---------------------------------------------------------------------------
const NPM_NODES = [
  {
    id: 'npm-package',
    label: 'package.json & package-lock.json',
    description: 'Manifest fields, lockfile purpose, deterministic installs.',
    tier: 'Junior' as const,
    keywords: ['package.json', 'package-lock', 'lockfile', 'manifest', 'dependencies', 'devDependencies'],
    negativeKeywords: [],
    prerequisites: [],
  },
  {
    id: 'npm-semver',
    label: 'SemVer & version ranges',
    description: 'Major.minor.patch semantics, ^ vs ~ vs exact vs *, pre-release tags.',
    tier: 'Junior' as const,
    keywords: ['semver', 'major', 'minor', 'patch', 'caret', 'tilde', 'range', 'pre-release'],
    negativeKeywords: [],
    prerequisites: ['npm-package'],
  },
  {
    id: 'npm-scripts',
    label: 'npm scripts & lifecycle',
    description: 'pre/post hooks, script composition, env vars, PATH augmentation.',
    tier: 'Mid' as const,
    keywords: ['scripts', 'preinstall', 'postinstall', 'lifecycle', 'npm run', 'PATH', 'cross-env'],
    negativeKeywords: [],
    prerequisites: ['npm-package'],
  },
  {
    id: 'npm-workspaces',
    label: 'Workspaces & monorepos',
    description: 'npm workspaces, hoisting, cross-package linking, turborepo/nx basics.',
    tier: 'Mid' as const,
    keywords: ['workspace', 'monorepo', 'hoist', 'link', 'turborepo', 'nx', 'pnpm'],
    negativeKeywords: [],
    prerequisites: ['npm-package'],
  },
  {
    id: 'npm-registry',
    label: 'Registry & publishing',
    description: 'npm publish, .npmrc, scoped packages, private registry, provenance.',
    tier: 'Mid' as const,
    keywords: ['publish', 'registry', '.npmrc', 'scope', 'private', 'token', 'provenance'],
    negativeKeywords: [],
    prerequisites: ['npm-package'],
  },
  {
    id: 'npm-resolution',
    label: 'Dependency resolution & deduplication',
    description: 'How npm resolves version conflicts, dedup, peer deps, overrides.',
    tier: 'Senior' as const,
    keywords: ['dedup', 'peer', 'override', 'resolution', 'phantom dep', 'hoisting algorithm'],
    negativeKeywords: [],
    prerequisites: ['npm-semver'],
  },
  {
    id: 'npm-audit',
    label: 'Security audit & patching',
    description: 'npm audit, audit fix, GHSA advisories, overrides for patch.',
    tier: 'Senior' as const,
    keywords: ['audit', 'vulnerability', 'GHSA', 'CVE', 'npm audit fix', 'override'],
    negativeKeywords: [],
    prerequisites: ['npm-package'],
  },
];

export const NPM_DOMAIN: Domain = {
  name: 'npm / Node packaging',
  root: 'npm-package',
  nodes: NPM_NODES,
  grounded: true,
};

// ---------------------------------------------------------------------------
// TypeScript domain
// ---------------------------------------------------------------------------
const TS_NODES = [
  {
    id: 'ts-types',
    label: 'Type system basics',
    description: 'Primitive types, union, intersection, literal types, type vs interface.',
    tier: 'Junior' as const,
    keywords: ['type', 'interface', 'union', 'intersection', 'literal', 'primitive', 'any', 'unknown'],
    negativeKeywords: [],
    prerequisites: [],
  },
  {
    id: 'ts-narrowing',
    label: 'Narrowing & type guards',
    description: 'typeof, instanceof, discriminated unions, assertion functions, in operator.',
    tier: 'Junior' as const,
    keywords: ['narrowing', 'typeof', 'instanceof', 'discriminated union', 'type guard', 'in'],
    negativeKeywords: [],
    prerequisites: ['ts-types'],
  },
  {
    id: 'ts-generics',
    label: 'Generics',
    description: 'Generic functions, classes, constraints, default type params.',
    tier: 'Mid' as const,
    keywords: ['generic', 'T', 'constraint', 'extends', 'keyof', 'infer', 'default'],
    negativeKeywords: [],
    prerequisites: ['ts-types'],
  },
  {
    id: 'ts-utility',
    label: 'Utility types',
    description: 'Partial, Required, Readonly, Pick, Omit, Record, ReturnType, Awaited.',
    tier: 'Mid' as const,
    keywords: ['Partial', 'Required', 'Readonly', 'Pick', 'Omit', 'Record', 'ReturnType', 'Awaited', 'Extract'],
    negativeKeywords: [],
    prerequisites: ['ts-generics'],
  },
  {
    id: 'ts-mapped',
    label: 'Mapped & conditional types',
    description: 'Mapped types with as clauses, conditional types, infer in conditions.',
    tier: 'Senior' as const,
    keywords: ['mapped type', 'conditional type', 'infer', 'distributive', 'template literal type', 'as clause'],
    negativeKeywords: [],
    prerequisites: ['ts-generics', 'ts-utility'],
  },
  {
    id: 'ts-decorators',
    label: 'Decorators & metadata',
    description: 'Class, method, parameter decorators; reflect-metadata; stage 3 spec.',
    tier: 'Senior' as const,
    keywords: ['decorator', 'reflect-metadata', 'experimentalDecorators', 'class decorator', 'method decorator'],
    negativeKeywords: [],
    prerequisites: ['ts-types'],
  },
  {
    id: 'ts-config',
    label: 'tsconfig & compilation',
    description: 'strict mode, module resolution, paths, project references, isolatedModules.',
    tier: 'Mid' as const,
    keywords: ['tsconfig', 'strict', 'module resolution', 'paths', 'project references', 'isolatedModules', 'target'],
    negativeKeywords: [],
    prerequisites: ['ts-types'],
  },
];

export const TS_DOMAIN: Domain = {
  name: 'TypeScript',
  root: 'ts-types',
  nodes: TS_NODES,
  grounded: true,
};

// ---------------------------------------------------------------------------
// SQL domain
// ---------------------------------------------------------------------------
const SQL_NODES = [
  {
    id: 'sql-select',
    label: 'SELECT & filtering',
    description: 'SELECT, WHERE, DISTINCT, ORDER BY, LIMIT; NULL handling.',
    tier: 'Junior' as const,
    keywords: ['SELECT', 'WHERE', 'DISTINCT', 'ORDER BY', 'LIMIT', 'NULL', 'IS NULL', 'LIKE'],
    negativeKeywords: [],
    prerequisites: [],
  },
  {
    id: 'sql-joins',
    label: 'JOINs',
    description: 'INNER, LEFT, RIGHT, FULL OUTER, CROSS, SELF joins; join conditions.',
    tier: 'Junior' as const,
    keywords: ['JOIN', 'INNER JOIN', 'LEFT JOIN', 'OUTER JOIN', 'CROSS JOIN', 'ON', 'USING'],
    negativeKeywords: [],
    prerequisites: ['sql-select'],
  },
  {
    id: 'sql-aggregates',
    label: 'Aggregation & GROUP BY',
    description: 'COUNT, SUM, AVG, MIN, MAX, GROUP BY, HAVING, ROLLUP.',
    tier: 'Mid' as const,
    keywords: ['GROUP BY', 'HAVING', 'COUNT', 'SUM', 'AVG', 'aggregate', 'ROLLUP'],
    negativeKeywords: [],
    prerequisites: ['sql-select'],
  },
  {
    id: 'sql-subqueries',
    label: 'Subqueries & CTEs',
    description: 'Correlated subqueries, CTE (WITH), recursive CTE, EXISTS vs IN.',
    tier: 'Mid' as const,
    keywords: ['subquery', 'CTE', 'WITH', 'EXISTS', 'IN', 'correlated', 'recursive'],
    negativeKeywords: [],
    prerequisites: ['sql-joins', 'sql-aggregates'],
  },
  {
    id: 'sql-indexes',
    label: 'Indexes & query planning',
    description: 'B-tree, hash, composite indexes; EXPLAIN; covering index; selectivity.',
    tier: 'Mid' as const,
    keywords: ['index', 'B-tree', 'composite', 'EXPLAIN', 'covering index', 'selectivity', 'scan type'],
    negativeKeywords: [],
    prerequisites: ['sql-select'],
  },
  {
    id: 'sql-transactions',
    label: 'Transactions & isolation',
    description: 'ACID, isolation levels, dirty read, phantom read, MVCC, SAVEPOINT.',
    tier: 'Senior' as const,
    keywords: ['ACID', 'transaction', 'isolation', 'dirty read', 'phantom', 'MVCC', 'SAVEPOINT', 'ROLLBACK'],
    negativeKeywords: [],
    prerequisites: ['sql-select'],
  },
  {
    id: 'sql-window',
    label: 'Window functions',
    description: 'OVER, PARTITION BY, RANK, ROW_NUMBER, LAG/LEAD, ROWS BETWEEN.',
    tier: 'Senior' as const,
    keywords: ['window function', 'OVER', 'PARTITION BY', 'RANK', 'ROW_NUMBER', 'LAG', 'LEAD', 'frame'],
    negativeKeywords: [],
    prerequisites: ['sql-aggregates'],
  },
];

export const SQL_DOMAIN: Domain = {
  name: 'SQL',
  root: 'sql-select',
  nodes: SQL_NODES,
  grounded: true,
};
