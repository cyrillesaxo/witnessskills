import { hasAny } from './utils';
import type { Domain, OntologyNode } from './types';

export const HELLO_POM = `<project>
  <groupId>com.example</groupId>
  <artifactId>hello</artifactId>
  <version>1.0.0</version>
  <dependencies>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.13.2</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>`;

export const MAVEN_NODES: OntologyNode[] = [
  {
    id: 'resolve',
    eat: { entity: 'repository', action: 'fetch', target: 'jar' },
    label: 'Artifact retrieval',
    col: 0, row: 1, requires: [],
    gist: 'Before anything resolves, the jar must physically arrive from a repository.',
    example: 'Concrete: run `mvn -o compile` offline on a fresh checkout — it fails on the first uncached dependency.',
    levels: [
      {
        tier: 'Junior',
        anchor: { artifact: 'junit:junit:4.13.2', known: "You've run the hello POM. This jar downloaded once and now sits in ~/.m2/repository/junit/junit/4.13.2/junit-4.13.2.jar." },
        newCase: 'You add org.slf4j:slf4j-api:2.0.13. First build downloads it; second build is instant and works offline.',
        witness: {
          example: 'Worked example (sibling): for gson, first build pulled from Central into .m2; second build reads it straight from .m2.',
          prompt: 'Where did slf4j-api come from on the FIRST build, and why is the SECOND build instant — mapping onto what happened with junit?',
          accept: a => hasAny(a, ['central', 'remote', 'downloaded', 'internet']) && hasAny(a, ['.m2', 'local', 'cached', 'local repo']),
        },
        antiwitness: {
          example: "Why it tempts: missing deps usually ARE typos. The tell: junit has the same coordinate shape and still builds offline.",
          mutation: "Same slf4j line, but you delete ~/.m2/.../slf4j-api-2.0.13.jar AND unplug the network. Build fails.",
          prompt: "junit still builds fine offline; slf4j doesn't. Using the SAME caching idea, why?",
          trap: 'The slf4j coordinate must be wrong.',
          accept: a => hasAny(a, ['not cached', 'deleted', 'not in .m2', 'no local', 'removed', 'missing locally', 'wasn\'t cached']),
        },
        hints: [
          'Concrete: your junit jar is in .m2 already, so offline works. slf4j was deleted from .m2.',
          'Abstract: resolution = (local cache) ∪ (reachable remotes). Offline shrinks it to the cache alone.',
        ],
      },
      {
        tier: 'Mid',
        anchor: { artifact: 'Maven Central', known: 'junit and slf4j both came from repo.maven.apache.org/maven2 — the default remote.' },
        newCase: "A teammate's company artifact com.acme:billing:1.4 fails with 'Could not find artifact' on your machine but resolves on theirs.",
        witness: {
          prompt: 'Both of you run identical POMs. What is present in THEIR resolution set but not yours?',
          accept: a => hasAny(a, ['private', 'internal', 'company', 'nexus', 'artifactory', 'settings.xml', 'mirror', 'credentials']),
        },
        antiwitness: {
          mutation: 'You add their Nexus to settings.xml. Now com.acme:billing resolves, but suddenly junit fails to download.',
          prompt: 'Adding a repo broke a jar that always worked. What about repository order or a mirror could do that?',
          trap: "Adding a repository can't affect an unrelated dependency.",
          accept: a => hasAny(a, ['mirror', 'order', 'mirrorof', 'intercept', 'overrides central', 'routes']),
        },
        hints: [
          'Concrete: if a mirror says mirrorOf=* it intercepts ALL requests including junit.',
          'Abstract: the resolution set is ordered and mirror-rewritable.',
        ],
      },
    ],
  },
  {
    id: 'coord',
    eat: { entity: 'dependency', action: 'resolve', target: 'artifact' },
    label: 'Coordinate resolution',
    col: 1, row: 1, requires: ['resolve'],
    gist: 'A G:A:V coordinate names exactly one artifact in the set that arrived.',
    example: 'Concrete: `junit:junit:4.13.2` resolves to exactly one file in .m2.',
    levels: [
      {
        tier: 'Junior',
        anchor: { artifact: 'junit:junit:4.13.2', known: 'In the hello POM, those three lines pinned one exact jar — and the build is green.' },
        newCase: 'You change the version line to 4.13.1. Build still green.',
        witness: {
          prompt: 'What changed on disk between 4.13.2 and 4.13.1 — pointing at the jar your junit anchor maps to?',
          accept: a => hasAny(a, ['different jar', 'another jar', '4.13.1', 'different file', 'new download']),
        },
        antiwitness: {
          mutation: "A teammate says 'the build is green, so the coordinate is whatever I typed.' But their .m2 already had a hand-edited junit-4.13.2.jar.",
          prompt: 'Their green build used a DIFFERENT jar than yours at the same coordinate. How is that possible?',
          trap: 'If it compiled, the coordinate is correct.',
          accept: a => hasAny(a, ['stale', 'cached', 'hand-edited', 'different jar', 'local copy', 'wrong jar in .m2']),
        },
        hints: [
          'Concrete: your junit-4.13.2.jar and theirs are different files at the same path.',
          'Abstract: coordinate→artifact is a lookup, not an identity.',
        ],
      },
    ],
  },
  {
    id: 'scope',
    eat: { entity: 'dependency', action: 'constrain', target: 'classpath' },
    label: 'Dependency scope',
    col: 2, row: 0, requires: ['coord'],
    gist: 'A scope decides which classpaths an artifact joins.',
    example: 'Concrete: junit at <scope>test</scope> is on the test classpath but absent from compile.',
    levels: [
      {
        tier: 'Junior',
        anchor: { artifact: 'junit:junit:4.13.2 @ test scope', known: 'In hello, junit is <scope>test</scope> — tests use it, main code never imports it.' },
        newCase: 'You add guava with NO scope and call Lists.newArrayList() inside App.java. It compiles.',
        witness: {
          prompt: "junit (test) is barred from App.java but guava (default) is allowed there. What is the default scope doing that test scope didn't?",
          accept: a => hasAny(a, ['compile', 'default']) && hasAny(a, ['main', 'everywhere', 'all classpath', 'available', 'src/main']),
        },
        antiwitness: {
          mutation: 'You move guava to <scope>test</scope> but leave the Lists call in App.java.',
          prompt: "App.java now won't compile, though the jar is still in .m2. Mapping onto why junit was never visible to main, what broke?",
          trap: 'Re-run with -U to force the guava download.',
          accept: a => hasAny(a, ['test scope', 'not on main', 'main classpath', 'not visible to main', 'scope', 'excluded from main']),
        },
        hints: [
          'Concrete: junit@test is exactly this — present for tests, absent for App.java.',
          'Abstract: scope is a per-classpath visibility filter.',
        ],
      },
    ],
  },
  {
    id: 'inherit',
    eat: { entity: 'parent', action: 'inherit', target: 'dependency' },
    label: 'Parent POM inheritance',
    col: 2, row: 1, requires: ['scope'],
    gist: 'A child POM inherits dependencyManagement from its parent — versions can arrive without a child declaration.',
    example: "Concrete: child POM has no junit version line, but parent's dependencyManagement pins junit:4.13.2 and the child build resolves it.",
    levels: [
      {
        tier: 'Junior',
        anchor: { artifact: 'hello parent BOM', known: 'Parent POM declares <dependencyManagement> with junit:4.13.2. Child declares junit with no <version> — build is green.' },
        newCase: 'Child adds slf4j-api with no version. Parent BOM has no slf4j entry. Build fails: version is missing.',
        witness: {
          prompt: 'junit resolved without a child version; slf4j did not. What did the parent supply for junit that slf4j lacked?',
          accept: a => hasAny(a, ['dependencymanagement', 'dependency management', 'managed version', 'bom', 'parent pins', 'inherited version', 'parent declares']),
        },
        antiwitness: {
          mutation: 'Teammate copies junit into child with explicit version 4.12. Build green — but differs from everyone else on 4.13.2.',
          prompt: 'Their build is green at a different junit than the BOM. Why is that a deceptive witness for "inheritance works"?',
          trap: 'If it compiles, the version choice does not matter.',
          accept: a => hasAny(a, ['overrides', 'bypass', 'not inherited', 'explicit version', 'diverges', 'bom ignored', 'different from parent']),
        },
        hints: [
          'Concrete: junit version came from parent <dependencyManagement>; slf4j had no managed entry.',
          'Abstract: inheritance fills missing version slots — it does not invent coordinates the parent never managed.',
        ],
      },
    ],
  },
  {
    id: 'transitive',
    eat: { entity: 'dependency', action: 'propagate', target: 'graph' },
    label: 'Transitive resolution',
    col: 3, row: 0, requires: ['coord', 'inherit'],
    gist: 'Dependencies of dependencies arrive too, filtered by scope.',
    example: 'Concrete: declaring only junit also puts hamcrest-core on your classpath.',
    levels: [
      {
        tier: 'Junior',
        anchor: { artifact: 'hello → junit:junit:4.13.2', known: 'You declared only junit. Yet hamcrest-core also landed in your build.' },
        newCase: 'You add spring-context:6.1.0 and suddenly 12 spring-* jars appear that you never named.',
        witness: {
          prompt: 'You only wrote one line for spring-context, just like junit. Where did the other 11 jars come from?',
          accept: a => hasAny(a, ['transitive', 'depends on', 'its dependencies', 'pulled in', 'brought in', 'indirect']),
        },
        antiwitness: {
          mutation: "Your boss: 'the build is green with all 12 jars, so that's exactly the dependency set we need.'",
          prompt: "junit silently brought hamcrest you never asked about. Why is 'green with 12 jars' NOT proof you need all 12?",
          trap: "If it built with those jars, they're the ones I need.",
          accept: a => hasAny(a, ["didn't choose", 'unintended', 'transitive', 'bloat', 'not asked', 'unused', 'incidental']),
        },
        hints: [
          'Concrete: junit→hamcrest was a free rider you never declared.',
          'Abstract: your declared set seeds a transitive closure that is computed, not chosen.',
        ],
      },
    ],
  },
  {
    id: 'readtree',
    eat: { entity: 'graph', action: 'read', target: 'path' },
    label: 'Reading the dependency tree',
    col: 3, row: 1, requires: ['transitive'],
    gist: 'Before you can fix the graph, you must see which path brought a jar.',
    example: 'Concrete: `mvn dependency:tree` prints hamcrest-core indented under junit.',
    levels: [
      {
        tier: 'Junior',
        anchor: { artifact: 'mvn dependency:tree on hello', known: "Run on hello, the tree shows junit with hamcrest-core nested under it." },
        newCase: 'On the spring project, dependency:tree shows commons-logging nested three levels under spring-context.',
        witness: {
          prompt: 'Reading it like the junit→hamcrest nesting: who pulled commons-logging in, and how does the indentation tell you?',
          accept: a => hasAny(a, ['spring', 'parent', 'nested under', 'indent', 'above it']) && hasAny(a, ['indent', 'nested', 'under', 'parent', 'tree']),
        },
        antiwitness: {
          mutation: "Someone greps the POM for 'commons-logging'. It's not in the POM at all.",
          prompt: "It's nowhere in the POM yet it's on the classpath. Why does the TREE find it when grepping the POM can't?",
          trap: "If it's not in the POM, dependency:tree won't show it either.",
          accept: a => hasAny(a, ['transitive', 'tree shows transitive', 'resolved', 'not declared', 'computed', 'full graph']),
        },
        hints: [
          "Concrete: hamcrest isn't a top-level POM line either, but dependency:tree shows it nested under junit.",
          'Abstract: the POM is the declared seed; the tree is the resolved closure.',
        ],
      },
    ],
  },
  {
    id: 'lifecycle',
    eat: { entity: 'phase', action: 'sequence', target: 'build' },
    label: 'Lifecycle phases',
    col: 0, row: 3, requires: [],
    gist: 'Phases run in order; invoking one runs all prior phases.',
    example: 'Concrete: `mvn test` prints compile output before test output every time.',
    levels: [
      {
        tier: 'Junior',
        anchor: { artifact: 'mvn test on hello', known: 'You ran `mvn test`; it compiled App.java FIRST, then ran the junit test.' },
        newCase: 'You run `mvn package` and notice it compiled AND tested before building the jar.',
        witness: {
          prompt: 'You already saw `mvn test` compile first. Why did `mvn package` also run compile and test before packaging?',
          accept: a => hasAny(a, ['prior', 'before', 'earlier', 'all phases', 'up to', 'preceding', 'in order', 'sequence']),
        },
        antiwitness: {
          mutation: "A teammate runs `mvn package`, a test fails, the jar isn't built. They say 'I only asked for package, why did tests run?'",
          prompt: 'Mapping onto how `mvn test` already ran compile-first, why did package drag tests in too?',
          trap: 'package and test are independent commands.',
          accept: a => hasAny(a, ['prior', 'before', 'all phases', 'up to', 'sequence', 'package is after test', 'comes after']),
        },
        hints: [
          'Concrete: `mvn test` = validate→compile→test. `mvn package` = same chain + package.',
          'Abstract: invoking a phase executes the totally-ordered prefix up to and including it.',
        ],
      },
    ],
  },
  {
    id: 'binding',
    eat: { entity: 'phase', action: 'bind', target: 'goal' },
    label: 'Phase-to-goal binding',
    col: 1, row: 3, requires: ['lifecycle'],
    gist: 'Plugin goals attach to phases; a phase fires its bound goals.',
    example: 'Concrete: you never type surefire, yet `mvn test` runs your tests.',
    levels: [
      {
        tier: 'Junior',
        anchor: { artifact: 'compile = compiler:compile bound to compile phase', known: "When hello compiled, maven-compiler-plugin's compile goal ran." },
        newCase: 'You add the surefire plugin; tests run during the `test` phase without you typing surefire.',
        witness: {
          prompt: "compiler:compile ran because it's bound to the compile phase. By the same mechanism, why does surefire run at the test phase?",
          accept: a => hasAny(a, ['bound', 'bind', 'attached', 'tied to', 'default binding']) && hasAny(a, ['phase', 'test']),
        },
        antiwitness: {
          mutation: 'You configure a custom plugin goal but forget <phase>. The build is green; your goal never runs.',
          prompt: 'compiler:compile ran because it was BOUND. Why is a green build consistent with your unbound goal never firing?',
          trap: 'If the build passed, every configured goal ran.',
          accept: a => hasAny(a, ['not bound', 'no phase', 'unbound', 'never attached', "wasn't bound", 'needs a phase']),
        },
        hints: [
          'Concrete: compiler:compile→compile phase, surefire:test→test phase. Both fire because bound.',
          'Abstract: execution = goals reachable via a phase binding.',
        ],
      },
    ],
  },
  {
    id: 'conflict',
    eat: { entity: 'version', action: 'arbitrate', target: 'graph' },
    label: 'Version conflict diagnosis',
    col: 4, row: 2, requires: ['readtree', 'binding'],
    gist: 'One coordinate at several versions — mediation picks one; read the graph to know why.',
    example: 'Concrete: two libraries pull guava 31.1 and 33.0; dependency:tree shows 31.1 won.',
    levels: [
      {
        tier: 'Junior',
        anchor: { artifact: 'one junit version in hello', known: 'hello had exactly one junit, so the classpath was unambiguous.' },
        newCase: 'Two libraries pull different guava (31.1 and 33.0). dependency:tree shows 31.1 won. Build green; at runtime: NoSuchMethodError.',
        witness: {
          prompt: 'hello never had to choose a version. Here Maven chose one guava. Why does a green build still throw NoSuchMethodError at runtime?',
          accept: a => hasAny(a, ['compiled against', 'different version', 'one version', 'method missing', 'binary', 'compile vs runtime']),
        },
        antiwitness: {
          mutation: "A teammate: 'it compiled, so the guava versions must be compatible.'",
          prompt: "hello's single-version safety doesn't apply here. Why is a green build the deceptive witness for a version conflict?",
          trap: 'A green build means the versions are compatible.',
          accept: a => hasAny(a, ['runtime', 'only one on classpath', 'compiled against other', 'method absent', 'linkage']),
        },
        hints: [
          'Concrete: hello = one guava, no conflict. Here = two guavas requested, one jar wins.',
          'Abstract: classpath holds one artifact per coordinate. Green proves compile, not runtime.',
        ],
      },
    ],
  },
  {
    id: 'hygiene',
    eat: { entity: 'dependency', action: 'declare', target: 'directly' },
    label: 'Direct-vs-transitive hygiene',
    col: 4, row: 1, requires: ['readtree'],
    gist: 'Using a class you got only transitively is a latent break.',
    example: 'Concrete: code calling StringUtils with only spring declared compiles today, breaks when spring drops commons-lang3.',
    levels: [
      {
        tier: 'Mid',
        anchor: { artifact: 'guava you declared directly', known: 'When you used Lists from guava, you DECLARED guava. Your code needs are visible in the POM.' },
        newCase: 'Your code calls StringUtils but never declared commons-lang3 — it arrived via spring. Build is green.',
        witness: {
          prompt: 'Contrast with how you declared guava: what is risky about relying on commons-lang3 you never declared?',
          accept: a => hasAny(a, ['transitive could', 'if spring', 'removes', 'drops', 'upgrade', 'breaks if', 'not guaranteed']),
        },
        antiwitness: {
          mutation: 'Spring upgrade stops depending on commons-lang3. Your code no longer compiles though you changed nothing.',
          prompt: 'You edited no line of your code, yet it broke. What was the real defect, present even while green?',
          trap: 'The spring upgrade is buggy and broke compilation.',
          accept: a => hasAny(a, ['undeclared', 'should have declared', 'relied on transitive', 'used but undeclared']),
        },
        hints: [
          'Concrete: you declared guava because you used Lists. You used StringUtils but never declared commons-lang3.',
          "Abstract: 'used but undeclared' is a green-but-broken state.",
        ],
      },
    ],
  },
  {
    id: 'toolchain',
    eat: { entity: 'compiler', action: 'target', target: 'bytecode' },
    label: 'Compiler target / JDK',
    col: 2, row: 3, requires: ['binding'],
    gist: 'The JDK running Maven decides what bytecode the build can emit.',
    example: "Concrete: IDE on JDK 21 compiles fine but `mvn compile` on JAVA_HOME=17 fails with 'invalid target release: 21'.",
    levels: [
      {
        tier: 'Junior',
        anchor: { artifact: 'hello compiled by JDK 17', known: 'You ran `mvn compile` with JDK 17; it produced App.class targeting 17.' },
        newCase: "Project sets <maven.compiler.release>21</maven.compiler.release> but `mvn compile` fails: 'invalid target release: 21'.",
        witness: {
          prompt: 'Your JDK 17 emitted 17-bytecode fine. Why can\'t that same setup emit 21?',
          accept: a => hasAny(a, ['jdk 21', 'newer jdk', "can't target", 'need jdk', 'compiler doesn\'t support']),
        },
        antiwitness: {
          mutation: 'It compiles in IDE (JDK 21) but `mvn compile` from terminal fails on same code.',
          prompt: 'Same project, same code — IDE green, Maven red. What differs?',
          trap: 'Maven uses the same JDK as my IDE.',
          accept: a => hasAny(a, ['different jdk', 'java_home', 'ide uses', 'separate jdk', 'terminal jdk']),
        },
        hints: [
          'Concrete: IDE points at JDK 21; terminal JAVA_HOME points at JDK 17.',
          'Abstract: the toolchain is environment state, not project state.',
        ],
      },
    ],
  },
  {
    id: 'packaging',
    eat: { entity: 'jar', action: 'assemble', target: 'artifact' },
    label: 'Packaging the runnable jar',
    col: 3, row: 3, requires: ['binding', 'transitive'],
    gist: 'A plain jar holds only your classes — its dependencies are not inside it.',
    example: 'Concrete: `jar tf hello.jar` lists only com/example/*.class — no guava.',
    levels: [
      {
        tier: 'Junior',
        anchor: { artifact: 'hello-1.0.0.jar', known: '`mvn package` produced hello-1.0.0.jar — an archive of YOUR compiled classes only.' },
        newCase: 'You add guava, `mvn package` succeeds, then `java -jar hello.jar` throws NoClassDefFoundError: guava.',
        witness: {
          prompt: "`mvn test` passed using guava. Why does `java -jar` fail at runtime?",
          accept: a => hasAny(a, ['not in the jar', 'not bundled', 'only my classes', 'classpath', 'deps not included', 'not self-contained']),
        },
        antiwitness: {
          mutation: "Shaded jar runs; teammate says 'the first jar built too, so shading just adds bloat.'",
          prompt: "Both jars 'built'. Why was the first build the deceptive witness?",
          trap: "If the jar built, it's runnable.",
          accept: a => hasAny(a, ['self-contained', "didn't include deps", 'not runnable', 'thin jar', 'missing deps']),
        },
        hints: [
          'Concrete: `mvn test` ran with guava on the classpath; `java -jar` gives the jar only its own contents.',
          'Abstract: a green `package` proves the archive was written, not runtime self-sufficiency.',
        ],
      },
    ],
  },
];

export const DOMAINS: Record<string, Domain> = {
  maven: { name: 'Apache Maven', root: 'resolve', nodes: MAVEN_NODES, helloPom: HELLO_POM },
};
