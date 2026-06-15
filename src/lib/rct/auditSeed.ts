export interface AuditNode {
  id: string;
  label: string;
  note: string;
}

export interface AuditItem {
  q: string;
  freq: number;
  nodes: string[];
  trap: string;
  real?: boolean;
  src?: string;
}

/** @deprecated Use domainToAuditNodes(domain) — kept for maven seed reference */
export const AUDIT_NODES: AuditNode[] = [
  { id: 'resolve', label: 'Artifact retrieval', note: 'repository reachability / download' },
  { id: 'coord', label: 'Coordinate resolution', note: 'G:A:V → one artifact' },
  { id: 'scope', label: 'Dependency scope', note: 'classpath visibility' },
  { id: 'inherit', label: 'Parent POM inheritance', note: 'dependencyManagement / BOM' },
  { id: 'transitive', label: 'Transitive resolution', note: 'deps of deps' },
  { id: 'readtree', label: 'Reading the tree', note: 'dependency:tree diagnosis' },
  { id: 'hygiene', label: 'Direct-vs-transitive hygiene', note: 'used-but-undeclared' },
  { id: 'lifecycle', label: 'Lifecycle phases', note: 'phase ordering' },
  { id: 'binding', label: 'Phase-to-goal binding', note: 'plugin goals' },
  { id: 'conflict', label: 'Version conflict', note: 'mediation / nearest-wins' },
  { id: 'toolchain', label: 'Compiler target / JDK', note: 'build JDK vs IDE JDK' },
  { id: 'packaging', label: 'Packaging the jar', note: 'plain vs fat/shaded jar' },
];

export const AUDIT_SEED: AuditItem[] = [
  { q: 'Could not find artifact ... in central (private/Nexus repo)', freq: 5, nodes: ['resolve'], trap: 'the coordinate must be wrong', real: true, src: 'gitlab.com/gitlab-org/gitlab/-/issues/36076' },
  { q: 'NoClassDefFoundError at runtime, build was green (version conflict)', freq: 5, nodes: ['conflict', 'readtree'], trap: 'a green build means the versions are compatible', real: true, src: 'alibabacloud.com/help/en/oss' },
  { q: 'Why is THIS jar in my build? (unexpected transitive dependencies)', freq: 4, nodes: ['transitive', 'readtree'], trap: "if it built with those jars, they're the ones I need", real: true },
  { q: 'provided/test scope dependency missing at runtime', freq: 3, nodes: ['scope'], trap: 're-run with -U to force the download', real: true },
  { q: 'Child POM missing version for dependency (parent BOM not inherited)', freq: 3, nodes: ['inherit'], trap: 'if it compiles, the version choice does not matter', real: true },
  { q: 'Code uses a class that only arrived transitively; upgrade breaks compile', freq: 3, nodes: ['hygiene'], trap: 'the upstream upgrade is buggy', real: true },
  { q: '1.0-SNAPSHOT resolves to different bytes across machines', freq: 2, nodes: ['coord'], trap: 'same coordinate always means same artifact', real: true },
  { q: 'Plugin goal configured but never runs (missing phase binding)', freq: 1, nodes: ['binding'], trap: 'if the build passed, all configured goals ran', real: false },
  { q: 'Maven build extremely SLOW / how to speed up', freq: 4, nodes: [], trap: '', real: true, src: 'NO node covers build performance' },
  { q: "Java version mismatch: 'invalid target release'", freq: 4, nodes: ['toolchain'], trap: 'Maven uses the same JDK as my IDE', real: true },
  { q: 'How to build a fat/uber JAR (shade vs assembly plugin)', freq: 3, nodes: ['packaging'], trap: "if the jar built, it's runnable", real: true },
  { q: 'Multi-module: how to build only one module + its dependents', freq: 3, nodes: [], trap: '', real: true },
];
