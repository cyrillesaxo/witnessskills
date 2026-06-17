import { hydrateGenerated } from './domainGenerator';
import type { Domain } from './types';

// ---------------------------------------------------------------------------
// Git
// ---------------------------------------------------------------------------
export const GIT_DOMAIN: Domain = hydrateGenerated({
  name: 'Git',
  root: 'git-commit',
  grounded: true,
  nodes: [
    { id: 'git-commit', label: 'Commit & staging area',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 0, requires: [],
      gist: 'The index (staging area) is a snapshot buffer between your working tree and the next commit.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'git add README.md && git commit -m "init"',
            known: 'You ran git add then git commit and the file appeared in the repo history.' },
          newCase: 'You edit two files but only git-add one of them, then commit. What ends up in the commit?',
          witness: { prompt: 'Which files are in the commit, and where is the other file?',
            acceptKeywords: ['staged','index','only','one'], rejectKeywords: ['both','everything'] },              antiwitness: { mutation: 'You git-add both files and then unstage one with git restore --staged. What does the commit contain?', prompt: 'Which file ends up in the commit?', trap: 'both files', accept: (a) => /one|only|staged|single/.test(a.toLowerCase()) && !/both|two|all/.test(a.toLowerCase()) },
          hints: ['Think about what git add does to the index.', 'The working-tree change is still there — just not staged.'] }
      ]
    },
    { id: 'git-branch', label: 'Branching model',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 0, requires: ['git-commit'],
      gist: 'Branches are lightweight movable pointers to commits.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'git checkout -b feature',
            known: 'You created a branch and commits on it did not affect main.' },
          newCase: 'You are on main. A colleague says "branch A is behind main." What does that mean?',
          witness: { prompt: 'What is branch A missing compared to main?',
            acceptKeywords: ['commits','ahead','behind','pointer','diverged'], rejectKeywords: ['file','deleted'] },
          hints: ['A branch is just a pointer to a commit.', 'Behind means the branch tip is an ancestor of main.'] }
      ]
    },
    { id: 'git-merge', label: 'Merging strategies',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 1, requires: ['git-branch'],
      gist: 'Fast-forward vs three-way merge vs squash — each applies in different divergence situations.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'git merge feature (fast-forward)',
            known: 'When feature only added commits on top of main, merge was instant with no merge commit.' },
          newCase: 'Main has a new commit since you branched. You merge feature into main. What kind of merge happens?',
          witness: { prompt: 'Why is this not a fast-forward, and what gets created?',
            acceptKeywords: ['three-way','merge commit','diverged','not ancestor'], rejectKeywords: ['fast-forward'] },
          hints: ['Fast-forward only works when one branch is a direct ancestor.', 'Three-way merge creates a new commit with two parents.'] }
      ]
    },
    { id: 'git-rebase', label: 'Rebase & history rewriting',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 1, requires: ['git-branch'],
      gist: 'Interactive rebase, fixup, reorder — the golden rule of rebasing.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'git rebase main (on feature branch)',
            known: 'Your feature branch commits were replayed on top of the latest main, giving a linear history.' },
          newCase: 'A teammate rebased a branch already pushed to origin and force-pushed. You had pulled that branch. What problem do you face?',
          witness: { prompt: 'What happens when you try to pull or merge now?',
            acceptKeywords: ['conflict','diverged','force push','rewrite','different history'], rejectKeywords: ['nothing','fine'] },
          hints: ['Rebase rewrites commit SHAs.', 'Force-push replaces the remote branch history.'] }
      ]
    },
    { id: 'git-remote', label: 'Remotes & fetch/pull/push',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 2, row: 0, requires: ['git-commit'],
      gist: 'fetch downloads objects, pull = fetch + merge, push uploads local commits to remote.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'git fetch origin && git merge origin/main',
            known: 'You fetched then manually merged, which is what git pull does in one step.' },
          newCase: 'You ran git pull but got a merge conflict. What is git pull doing under the hood?',
          witness: { prompt: 'Name the two operations git pull performs.',
            acceptKeywords: ['fetch','merge','two','remote'], rejectKeywords: ['push','upload'] },
          hints: ['Pull is a convenience command.', 'It fetches remote commits then tries to integrate them.'] }
      ]
    },
    { id: 'git-conflict', label: 'Conflict resolution',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 2, row: 1, requires: ['git-merge','git-remote'],
      gist: 'Conflicts occur when the same lines changed in both branches; resolved by editing markers then staging.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: '<<<<<<< HEAD ... ======= ... >>>>>>> feature',
            known: 'You saw these markers in a file after a merge; you edited them out and ran git add.' },
          newCase: 'After resolving conflict markers and git-adding the file, what command finalises the merge?',
          witness: { prompt: 'What git command completes the merge after resolving?',
            acceptKeywords: ['commit','git commit','merge commit'], rejectKeywords: ['push','add'] },
          hints: ['You have staged the resolved file.', 'A merge commit needs to be created to seal the merge.'] }
      ]
    },
    { id: 'git-stash', label: 'Stash & worktree',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 2, requires: ['git-commit','git-branch'],
      gist: 'git stash saves dirty working-tree changes onto a stack so you can switch contexts cleanly.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'git stash && git checkout hotfix && git stash pop',
            known: 'You stashed half-done work, switched branch, fixed a bug, came back and popped the stash.' },
          newCase: 'You stash twice without popping. You then do git stash pop. Which set of changes comes back?',
          witness: { prompt: 'Which stash entry does pop restore, and why?',
            acceptKeywords: ['last','most recent','LIFO','stack','stash@{0}'], rejectKeywords: ['first','oldest'] },
          hints: ['Stash is a stack — last in, first out.', 'stash@{0} is always the most recently stashed entry.'] }
      ]
    },
    { id: 'git-log', label: 'History & bisect',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 2, row: 2, requires: ['git-remote'],
      gist: 'git log, blame, diff, and bisect give you full forensic visibility into project history.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'git bisect start && git bisect bad && git bisect good abc123',
            known: 'Git binary-searched through commits to find the first bad commit.' },
          newCase: 'You have 1000 commits and a regression. How many commits does git bisect need to check at most?',
          witness: { prompt: 'What is the maximum number of commits bisect inspects, and why?',
            acceptKeywords: ['10','log','binary','bisect','half'], rejectKeywords: ['1000','all','linear'] },
          hints: ['Binary search halves the range each step.', 'log2(1000) ≈ 10.'] }
      ]
    },
  ],
});

// ---------------------------------------------------------------------------
// Gradle
// ---------------------------------------------------------------------------
export const GRADLE_DOMAIN: Domain = hydrateGenerated({
  name: 'Gradle',
  root: 'gradle-build',
  grounded: true,
  nodes: [
    { id: 'gradle-build', label: 'Build lifecycle & tasks',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 0, requires: [],
      gist: 'Gradle builds are a DAG of tasks; the lifecycle phases are initialisation, configuration, execution.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: './gradlew build',
            known: 'Running gradlew build compiled sources, ran tests, and produced a JAR.' },
          newCase: 'You add a new task printVersion that just prints the version. When does its action block run vs its configuration block?',
          witness: { prompt: 'Explain when configuration code and when the doLast action code execute.',
            acceptKeywords: ['configuration','execution','doLast','always','action'], rejectKeywords: ['same time','compile'] },
          hints: ['Configuration phase configures every task, even those not running.', 'The action block only runs when the task is in the execution graph.'] }
      ]
    },
    { id: 'gradle-deps', label: 'Dependency configurations',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 0, requires: ['gradle-build'],
      gist: 'implementation vs api vs compileOnly vs runtimeOnly control the visibility of dependencies to consumers.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'implementation("com.google.guava:guava:32.0.0-jre")',
            known: 'Using implementation hid Guava from consumers of your library; changing to api exposed it.' },
          newCase: 'Your library uses Guava internally but does not expose it in its public API. Which configuration should you use?',
          witness: { prompt: 'Which Gradle dependency configuration keeps Guava off the consumer compile classpath?',
            acceptKeywords: ['implementation','not api','internal'], rejectKeywords: ['api','compile'] },
          hints: ['api leaks the dependency to consumers.', 'implementation keeps it internal to your module.'] }
      ]
    },
    { id: 'gradle-cache', label: 'Build cache & incremental builds',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 1, requires: ['gradle-build'],
      gist: 'Tasks declare inputs/outputs; Gradle skips tasks marked UP-TO-DATE or pulls from the build cache.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: './gradlew build (second run: UP-TO-DATE)',
            known: 'Nothing changed so Gradle skipped all tasks showing UP-TO-DATE.' },
          newCase: 'You change a comment in a source file and rebuild. The compileJava task runs again. Why did the cache not help?',
          witness: { prompt: 'What are Gradle task inputs, and why does a comment change affect them?',
            acceptKeywords: ['inputs','source','changed','hash','classpath'], rejectKeywords: ['output only','nothing'] },
          hints: ['Gradle hashes task inputs including source files.', 'Even a comment changes the source file hash.'] }
      ]
    },
    { id: 'gradle-multimodule', label: 'Multi-project builds',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 1, requires: ['gradle-deps'],
      gist: 'settings.gradle declares sub-projects; project(:lib) dependencies wire modules together.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'include("app","lib") in settings.gradle',
            known: 'You added a lib sub-project and the app project depended on it via project(":lib").' },
          newCase: 'You run ./gradlew :app:build. Does the :lib:build task also run? Why?',
          witness: { prompt: 'Explain whether and why :lib is built when :app builds.',
            acceptKeywords: ['dependency','project dep','automatically','transitive','lib'], rejectKeywords: ['separate','manual'] },
          hints: ['Gradle resolves project-level dependencies.', 'If app depends on :lib, Gradle builds lib first.'] }
      ]
    },
    { id: 'gradle-plugins', label: 'Plugins & conventions',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 2, row: 0, requires: ['gradle-build'],
      gist: 'plugins id("java") apply conventions (source sets, task wiring); custom plugins extend the build.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'plugins { id("java") }',
            known: 'Adding the java plugin automatically created compileJava, test, and jar tasks.' },
          newCase: 'Without the java plugin, you try to call compileJava. What happens?',
          witness: { prompt: 'What does Gradle report if a task added by a plugin is missing?',
            acceptKeywords: ['not found','unknown','task','plugin','missing'], rejectKeywords: ['runs fine','always there'] },
          hints: ['Tasks are added by plugins, not built-in.', 'Without the plugin the task does not exist.'] }
      ]
    },
    { id: 'gradle-wrapper', label: 'Gradle Wrapper',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 2, row: 1, requires: ['gradle-build'],
      gist: 'The wrapper (gradlew) pins a specific Gradle version so all devs and CI use the same build tool.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: './gradlew build (uses wrapper-pinned 8.x)',
            known: 'gradlew downloaded a specific Gradle version defined in gradle/wrapper/gradle-wrapper.properties.' },
          newCase: 'A new team member has Gradle 7 installed globally. Why does ./gradlew build still use Gradle 8?',
          witness: { prompt: 'What overrides the locally installed Gradle when using the wrapper?',
            acceptKeywords: ['wrapper','properties','pinned','gradle-wrapper','version'], rejectKeywords: ['global','installed','PATH'] },
          hints: ['gradlew reads gradle-wrapper.properties for the version.', 'It downloads that version if not cached.'] }
      ]
    },
    { id: 'gradle-testing', label: 'Test task & reporting',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 2, requires: ['gradle-deps','gradle-cache'],
      gist: 'The test task compiles and runs tests; build/reports/tests/test/index.html shows results.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: './gradlew test && open build/reports/tests/test/index.html',
            known: 'Gradle ran JUnit tests and generated an HTML report at that path.' },
          newCase: 'A test fails on CI but passes locally. You suspect a test ordering issue. How would you use Gradle to investigate?',
          witness: { prompt: 'What Gradle flag randomises test execution order to expose ordering bugs?',
            acceptKeywords: ['random','seed','failFast','parallel','TestNG','JUnit','order'], rejectKeywords: ['nothing','impossible'] },
          hints: ['Gradle supports test order randomisation.', 'Try --tests or set testExecutionOrderStrategy.'] }
      ]
    },
  ],
});

// ---------------------------------------------------------------------------
// Docker
// ---------------------------------------------------------------------------
export const DOCKER_DOMAIN: Domain = hydrateGenerated({
  name: 'Docker',
  root: 'docker-image',
  grounded: true,
  nodes: [
    { id: 'docker-image', label: 'Images & layers',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 0, requires: [],
      gist: 'A Docker image is a read-only stack of layers; each Dockerfile instruction adds a layer.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'docker build -t myapp .',
            known: 'Each RUN/COPY/ADD in the Dockerfile created a separate layer in the image.' },
          newCase: 'You have two Dockerfiles: one with RUN apt-get update && apt-get install -y curl on one line, another with them on two separate RUN lines. Which produces a smaller image?',
          witness: { prompt: 'Why does combining commands in one RUN reduce image size?',
            acceptKeywords: ['one layer','fewer layers','cache','squash','single RUN'], rejectKeywords: ['same','no difference'] },
          hints: ['Each RUN line creates a new layer.', 'apt-get cache is included in intermediate layers if not cleaned in the same RUN.'] }
      ]
    },
    { id: 'docker-container', label: 'Containers & runtime',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 0, requires: ['docker-image'],
      gist: 'A container is a running image instance with a writable layer on top; it is isolated via namespaces and cgroups.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'docker run -d nginx',
            known: 'Docker created a container from the nginx image; it ran in the background.' },
          newCase: 'You stop and restart a container. Files you created inside it are still there. You then docker rm it and run a new container. Are those files still there?',
          witness: { prompt: 'What happens to container filesystem changes after docker rm and a new docker run?',
            acceptKeywords: ['lost','gone','ephemeral','writable layer','new container'], rejectKeywords: ['persist','same','saved'] },
          hints: ['Containers have a writable layer that is tied to that container instance.', 'docker rm discards the writable layer.'] }
      ]
    },
    { id: 'docker-volumes', label: 'Volumes & bind mounts',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 1, requires: ['docker-container'],
      gist: 'Volumes persist data beyond container lifecycle; bind mounts mirror a host directory into the container.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'docker run -v mydata:/app/data myapp',
            known: 'Data written to /app/data persisted after the container was removed and reused on restart.' },
          newCase: 'A teammate uses a bind mount (-v $(pwd):/app) for local dev. What is the downside in production?',
          witness: { prompt: 'Why are bind mounts unsuitable for production containers?',
            acceptKeywords: ['host path','machine-specific','portable','not reproducible','coupling'], rejectKeywords: ['fine','no difference'] },
          hints: ['Bind mounts reference host filesystem paths.', 'The path must exist on every machine that runs the container.'] }
      ]
    },
    { id: 'docker-network', label: 'Container networking',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 1, requires: ['docker-container'],
      gist: 'Docker networks isolate container communication; bridge (default), host, none, overlay for Swarm.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'docker network create mynet && docker run --network mynet',
            known: 'Two containers on the same custom bridge network could reach each other by container name.' },
          newCase: 'Two containers on the default bridge network cannot reach each other by name. Why?',
          witness: { prompt: 'What DNS capability does the default bridge lack that custom bridges have?',
            acceptKeywords: ['DNS','name resolution','automatic','custom','bridge'], rejectKeywords: ['IP only','firewall'] },
          hints: ['The default bridge network does not provide automatic DNS resolution.', 'Custom networks have built-in container name DNS.'] }
      ]
    },
    { id: 'docker-compose', label: 'Docker Compose',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 2, row: 0, requires: ['docker-network','docker-volumes'],
      gist: 'Compose defines multi-container apps in YAML; services share a network and can declare dependencies.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'docker compose up (web + db services)',
            known: 'Compose started both services in the correct order on a shared network, web could reach db by hostname.' },
          newCase: 'You set depends_on: [db] for the web service. Does Compose wait for db to be ready to accept connections before starting web?',
          witness: { prompt: 'What does depends_on actually guarantee vs what it does not?',
            acceptKeywords: ['started','not ready','health','depends_on','order only'], rejectKeywords: ['fully ready','guaranteed','waits'] },
          hints: ['depends_on only controls startup order.', 'It does not wait for the db to be ready to accept connections.'] }
      ]
    },
    { id: 'docker-dockerfile', label: 'Dockerfile best practices',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 2, row: 1, requires: ['docker-image'],
      gist: 'Multi-stage builds, .dockerignore, minimal base images, non-root USER are key production practices.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'FROM node:18 AS build ... FROM node:18-alpine AS production',
            known: 'Multi-stage build copied only the compiled output into the slim final image, dropping dev tools.' },
          newCase: 'Why should you use a non-root USER in a Dockerfile for production?',
          witness: { prompt: 'What security risk does running as root inside a container create?',
            acceptKeywords: ['root','privilege','escape','security','host','escalation'], rejectKeywords: ['no difference','performance'] },
          hints: ['If a container is compromised, a root process has more power.', 'Running as non-root limits blast radius.'] }
      ]
    },
    { id: 'docker-registry', label: 'Registries & tagging',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 2, requires: ['docker-image','docker-compose'],
      gist: 'docker push/pull to registries (Docker Hub, ECR, GCR); image tags are mutable pointers to digests.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'docker tag myapp:1.0 registry.io/myapp:1.0 && docker push',
            known: 'You tagged the image with the registry prefix and pushed it; others pulled with the same tag.' },
          newCase: 'You push a new image with the same tag myapp:latest. A colleague pulls myapp:latest. Do they get the new image or the old one?',
          witness: { prompt: 'What does a Docker tag actually point to, and can it change?',
            acceptKeywords: ['mutable','new','latest','overwritten','digest'], rejectKeywords: ['immutable','always same'] },
          hints: ['Tags are mutable pointers.', 'Pushing with the same tag overwrites the tag in the registry.'] }
      ]
    },
  ],
});

// ---------------------------------------------------------------------------
// npm / Node packaging
// ---------------------------------------------------------------------------
export const NPM_DOMAIN: Domain = hydrateGenerated({
  name: 'npm / Node packaging',
  root: 'npm-init',
  grounded: true,
  nodes: [
    { id: 'npm-init', label: 'package.json & project init',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 0, requires: [],
      gist: 'package.json is the project manifest: name, version, scripts, dependencies, devDependencies.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'npm init -y (produces package.json)',
            known: 'Running npm init created a package.json with default fields in the current directory.' },
          newCase: 'You have a utility used only in tests. Should it go in dependencies or devDependencies?',
          witness: { prompt: 'What is the difference between dependencies and devDependencies?',
            acceptKeywords: ['devDependencies','dev','test','production','not bundled'], rejectKeywords: ['same','no difference'] },
          hints: ['dependencies are needed at runtime in production.', 'devDependencies are only needed for development and testing.'] }
      ]
    },
    { id: 'npm-lockfile', label: 'Lock file & reproducibility',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 0, requires: ['npm-init'],
      gist: 'package-lock.json pins exact versions of every transitive dependency for reproducible installs.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'npm install (generates package-lock.json)',
            known: 'The lock file recorded the exact version of every package so the next npm ci gets the same tree.' },
          newCase: 'You commit package.json but not package-lock.json. A colleague runs npm install. Do they get the same versions?',
          witness: { prompt: 'Why might they get different package versions?',
            acceptKeywords: ['semver','range','lock','different','patch','minor'], rejectKeywords: ['same','identical'] },
          hints: ['package.json uses semver ranges like ^1.2.3.', 'Without a lock file, npm resolves the latest matching version, which may differ.'] }
      ]
    },
    { id: 'npm-scripts', label: 'npm scripts',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 1, requires: ['npm-init'],
      gist: 'scripts in package.json run in a shell with node_modules/.bin on PATH; lifecycle hooks run automatically.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: '"scripts": { "build": "tsc", "test": "jest" }',
            known: 'Running npm run build invoked tsc without needing the full path to node_modules/.bin/tsc.' },
          newCase: 'You want a script that runs before every npm test automatically. What is it called?',
          witness: { prompt: 'What lifecycle script runs automatically before npm test?',
            acceptKeywords: ['pretest','pre','lifecycle','hook'], rejectKeywords: ['manual','custom','nothing'] },
          hints: ['npm has pre/post lifecycle hooks.', 'Prefix any script name with pre to run it automatically before.'] }
      ]
    },
    { id: 'npm-semver', label: 'Semantic versioning',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 1, requires: ['npm-lockfile'],
      gist: 'MAJOR.MINOR.PATCH: ^ allows minor+patch upgrades, ~ allows patch only, exact pins one version.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: '"lodash": "^4.17.11"',
            known: '^4.17.11 means npm can install any 4.x.x >= 4.17.11 but not 5.0.0.' },
          newCase: 'You see "react": "~18.2.0" in package.json. What version range is allowed?',
          witness: { prompt: 'With tilde (~), which parts of the version can be updated?',
            acceptKeywords: ['patch','18.2.x','minor stays','tilde'], rejectKeywords: ['minor','major','any'] },
          hints: ['Tilde allows only patch-level changes.', '~18.2.0 means >=18.2.0 <18.3.0.'] }
      ]
    },
    { id: 'npm-workspace', label: 'Workspaces & monorepos',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 2, row: 0, requires: ['npm-init'],
      gist: 'npm workspaces hoist shared dependencies to the root node_modules, linking packages within the monorepo.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: '"workspaces": ["packages/*"] in root package.json',
            known: 'Running npm install at the root installed dependencies for all packages and hoisted shared ones.' },
          newCase: 'Two workspace packages both depend on lodash@4. Where is lodash installed?',
          witness: { prompt: 'With workspaces, where does npm install shared dependencies?',
            acceptKeywords: ['root','hoisted','node_modules','shared','top'], rejectKeywords: ['each package','duplicate'] },
          hints: ['Workspaces hoist common dependencies.', 'lodash is installed once in the root node_modules.'] }
      ]
    },
    { id: 'npm-audit', label: 'Security auditing',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 2, row: 1, requires: ['npm-lockfile'],
      gist: 'npm audit checks dependencies against the Advisory Database; npm audit fix updates to safe versions.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'npm audit (reports 3 vulnerabilities)',
            known: 'npm audit reported vulnerabilities in transitive dependencies, not direct ones you added.' },
          newCase: 'npm audit fix does not fix all vulnerabilities. What does npm audit fix --force do that could be risky?',
          witness: { prompt: 'Why is npm audit fix --force potentially dangerous?',
            acceptKeywords: ['breaking','semver','major','force','incompatible'], rejectKeywords: ['same','safe'] },
          hints: ['--force applies fixes that may be semver-major.', 'Major version updates can contain breaking API changes.'] }
      ]
    },
    { id: 'npm-publish', label: 'Publishing packages',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 2, requires: ['npm-semver','npm-workspace'],
      gist: 'npm publish pushes to the registry; .npmignore or package.json files field controls what is published.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'npm publish --access public',
            known: 'You published a scoped package publicly; users could install it with npm install @scope/pkg.' },
          newCase: 'You accidentally published your .env file. You remove it and re-publish. Is the original version with .env still accessible?',
          witness: { prompt: 'Can you truly remove a published npm version, and why?',
            acceptKeywords: ['immutable','unpublish','still available','72 hours','cannot'], rejectKeywords: ['deleted','gone','removed'] },
          hints: ['npm has a 72-hour window for unpublish.', 'After that, published versions are permanent in the registry.'] }
      ]
    },
  ],
});

// ---------------------------------------------------------------------------
// TypeScript
// ---------------------------------------------------------------------------
export const TS_DOMAIN: Domain = hydrateGenerated({
  name: 'TypeScript',
  root: 'ts-types',
  grounded: true,
  nodes: [
    { id: 'ts-types', label: 'Type system basics',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 0, requires: [],
      gist: 'TypeScript adds static types to JavaScript; types are erased at runtime — they only exist at compile time.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'const x: number = 5; // error if assigned "hello"',
            known: 'TypeScript caught a type mismatch at compile time before the code even ran.' },
          newCase: 'A colleague claims TypeScript prevents runtime type errors. You say TypeScript types are erased. Who is right, and what does that mean at runtime?',
          witness: { prompt: 'What happens to TypeScript type annotations in the compiled JavaScript output?',
            acceptKeywords: ['erased','removed','runtime','no types','JavaScript'], rejectKeywords: ['kept','present','runtime check'] },
          hints: ['TypeScript compiles to plain JavaScript.', 'All type information is stripped out — none of it exists at runtime.'] }
      ]
    },
    { id: 'ts-inference', label: 'Type inference',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 0, requires: ['ts-types'],
      gist: 'TypeScript infers types from initialisers, return values, and contextual usage — you rarely need explicit annotations.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'const name = "Alice"; // inferred as string',
            known: 'TypeScript inferred the type of name from its initialiser without you writing :string.' },
          newCase: 'You write function add(a, b) { return a + b; } without annotations. What type does TypeScript infer for the parameters?',
          witness: { prompt: 'What type does TypeScript assign to unannotated parameters?',
            acceptKeywords: ['any','implicit','noImplicitAny','unknown'], rejectKeywords: ['number','string','inferred correctly'] },
          hints: ['Without annotations, TypeScript cannot infer parameter types from usage alone.', 'They default to any (or error with noImplicitAny).'] }
      ]
    },
    { id: 'ts-generics', label: 'Generics',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 1, requires: ['ts-types'],
      gist: 'Generics let you write reusable code that works over many types while preserving type safety.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'function identity<T>(x: T): T { return x; }',
            known: 'identity(42) returned 42 typed as number; identity("hi") returned "hi" typed as string — no any needed.' },
          newCase: 'You write function first<T>(arr: T[]): T | undefined { return arr[0]; }. What is the return type when called with a string array?',
          witness: { prompt: 'What exact type does TypeScript infer as the return type of first(["a","b"])?',
            acceptKeywords: ['string','string | undefined','T is string'], rejectKeywords: ['any','unknown','object'] },
          hints: ['T is inferred from the argument type.', 'first(["a","b"]) instantiates T as string so return is string | undefined.'] }
      ]
    },
    { id: 'ts-unions', label: 'Union & intersection types',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 1, requires: ['ts-inference'],
      gist: 'A | B is either A or B (union); A & B has all properties of both (intersection); narrowing resolves unions.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'type Shape = Circle | Square; if (s.kind === "circle") ...',
            known: 'TypeScript narrowed the type to Circle inside the if branch because of the discriminant kind.' },
          newCase: 'type Result = { ok: true; data: string } | { ok: false; error: string }. How do you safely access data?',
          witness: { prompt: 'What TypeScript mechanism lets you access data only when ok is true?',
            acceptKeywords: ['narrow','if ok','discriminant','type guard','ok === true'], rejectKeywords: ['cast','any','force'] },
          hints: ['Check the discriminant field ok first.', 'Inside if(result.ok) TypeScript narrows to the success branch.'] }
      ]
    },
    { id: 'ts-utility', label: 'Utility types',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 2, row: 0, requires: ['ts-generics'],
      gist: 'Partial, Required, Readonly, Pick, Omit, Record transform existing types into new derived types.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'Partial<User> makes all User fields optional',
            known: 'You used Partial<User> in an update function so callers only need to supply changed fields.' },
          newCase: 'You want a type like User but with only id and email. Which utility type would you use?',
          witness: { prompt: 'Which TypeScript utility type selects a subset of properties from a type?',
            acceptKeywords: ['Pick','Pick<User','selected','subset'], rejectKeywords: ['Omit','Partial','Record'] },
          hints: ['Omit removes properties; Pick keeps only named ones.', 'Pick<User, "id"|"email"> gives you exactly those two fields.'] }
      ]
    },
    { id: 'ts-narrowing', label: 'Type narrowing & guards',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 2, row: 1, requires: ['ts-unions'],
      gist: 'typeof, instanceof, in, and user-defined type guards narrow union types in conditional branches.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'if (typeof x === "string") { x.toUpperCase(); }',
            known: 'TypeScript knew x was a string inside the if block because of the typeof check.' },
          newCase: 'You have value: string | number. You want a type guard function isString(v): v is string. What must the return type annotation use?',
          witness: { prompt: 'What special TypeScript return type syntax makes a function a type guard?',
            acceptKeywords: ['is','v is string','predicate','type guard'], rejectKeywords: ['boolean','true/false'] },
          hints: ['User-defined type guards use a predicate return type.', 'param is Type tells TypeScript what the function guarantees.'] }
      ]
    },
    { id: 'ts-config', label: 'tsconfig & compilation',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 2, requires: ['ts-types','ts-utility'],
      gist: 'tsconfig.json controls strictness (strict, noImplicitAny), target JS version, module system, and output.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: '"strict": true in tsconfig.json',
            known: 'Enabling strict turned on noImplicitAny, strictNullChecks, and several other checks at once.' },
          newCase: 'You have strictNullChecks enabled. You write const el = document.getElementById("app"); el.style.color = "red"; TypeScript errors. Why?',
          witness: { prompt: 'What type does getElementById return, and what does that mean for el.style?',
            acceptKeywords: ['null','HTMLElement | null','null check','optional'], rejectKeywords: ['always HTMLElement','never null'] },
          hints: ['getElementById can return null if the element does not exist.', 'With strictNullChecks you must handle the null case.'] }
      ]
    },
  ],
});

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------
export const SQL_DOMAIN: Domain = hydrateGenerated({
  name: 'SQL',
  root: 'sql-select',
  grounded: true,
  nodes: [
    { id: 'sql-select', label: 'SELECT & filtering',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 0, requires: [],
      gist: 'SELECT retrieves rows; WHERE filters them; columns are projected; ORDER BY and LIMIT control output.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'SELECT name, age FROM users WHERE age > 18',
            known: 'This returned only the name and age columns for rows where age exceeded 18.' },
          newCase: 'You run SELECT * FROM orders WHERE status = "shipped" ORDER BY created_at DESC LIMIT 10. What do you get?',
          witness: { prompt: 'Describe what the query returns in plain terms.',
            acceptKeywords: ['10','latest','shipped','most recent','ordered'], rejectKeywords: ['all orders','no filter'] },
          hints: ['LIMIT caps the result set size.', 'ORDER BY DESC puts the most recent rows first.'] }
      ]
    },
    { id: 'sql-joins', label: 'JOINs',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 0, requires: ['sql-select'],
      gist: 'INNER JOIN returns matching rows; LEFT JOIN keeps all left rows; RIGHT/FULL for outer joins.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'SELECT u.name, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id',
            known: 'Only users who had at least one order appeared in the results.' },
          newCase: 'You change INNER JOIN to LEFT JOIN. A user with no orders now appears. What value does o.total have for that user?',
          witness: { prompt: 'What value does SQL give for columns from the right table when there is no match?',
            acceptKeywords: ['NULL','null'], rejectKeywords: ['0','empty','zero','missing'] },
          hints: ['LEFT JOIN keeps all rows from the left table.', 'Missing right-side values are NULL.'] }
      ]
    },
    { id: 'sql-aggregates', label: 'Aggregates & GROUP BY',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 1, requires: ['sql-joins'],
      gist: 'COUNT, SUM, AVG, MAX, MIN aggregate rows; GROUP BY splits rows into groups; HAVING filters groups.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'SELECT user_id, COUNT(*) FROM orders GROUP BY user_id',
            known: 'This counted how many orders each user had, returning one row per user.' },
          newCase: 'You want only users with more than 5 orders. You try WHERE COUNT(*) > 5 but get an error. What should you use?',
          witness: { prompt: 'Which SQL clause filters on aggregate function results?',
            acceptKeywords: ['HAVING','HAVING clause'], rejectKeywords: ['WHERE','filter'] },
          hints: ['WHERE filters individual rows before aggregation.', 'HAVING filters group results after aggregation.'] }
      ]
    },
    { id: 'sql-indexes', label: 'Indexes & query performance',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 1, requires: ['sql-select'],
      gist: 'A B-tree index lets the DB find rows in O(log n) instead of O(n); indexes have write overhead.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'CREATE INDEX idx_users_email ON users(email)',
            known: 'After adding the index, SELECT WHERE email = ? became much faster on a large table.' },
          newCase: 'You have an index on email. A query uses WHERE LOWER(email) = ?. Does the index help?',
          witness: { prompt: 'Why does wrapping a column in a function prevent index use?',
            acceptKeywords: ['function','not sargable','wrapped','cannot use index','full scan'], rejectKeywords: ['yes','works fine','index used'] },
          hints: ['Indexes store raw column values.', 'Applying a function changes the value, so the index cannot be used directly.'] }
      ]
    },
    { id: 'sql-transactions', label: 'Transactions & ACID',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 2, row: 0, requires: ['sql-select'],
      gist: 'ACID: Atomicity, Consistency, Isolation, Durability; BEGIN/COMMIT/ROLLBACK control transaction boundaries.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'BEGIN; UPDATE accounts SET balance = balance - 100 WHERE id=1; UPDATE accounts SET balance = balance + 100 WHERE id=2; COMMIT;',
            known: 'Both updates succeeded or neither did; the transaction was atomic.' },
          newCase: 'The app crashes between the two UPDATE statements. What happens to the data?',
          witness: { prompt: 'Which ACID property ensures neither partial update persists?',
            acceptKeywords: ['atomicity','atomic','rollback','all or nothing'], rejectKeywords: ['consistency','isolation','durability'] },
          hints: ['ACID starts with Atomicity.', 'An incomplete transaction is rolled back — it is all or nothing.'] }
      ]
    },
    { id: 'sql-normalization', label: 'Normalisation & schema design',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 2, row: 1, requires: ['sql-joins'],
      gist: '1NF-3NF eliminate redundancy; foreign keys enforce referential integrity; denormalisation trades redundancy for read speed.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'users(id, name) and orders(id, user_id FK, total)',
            known: 'Normalising user data out of orders eliminated duplication and enforced consistency via FK.' },
          newCase: 'You store city and zip_code in a customers table. The same city appears in many rows. What normalisation issue is this, and how would you fix it?',
          witness: { prompt: 'What redundancy problem exists, and what is the normalised solution?',
            acceptKeywords: ['redundancy','cities table','separate','foreign key','normalise'], rejectKeywords: ['fine','no problem'] },
          hints: ['Repeating city per customer is data redundancy.', 'Extract cities into a separate table and reference it with a foreign key.'] }
      ]
    },
    { id: 'sql-window', label: 'Window functions',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 2, requires: ['sql-aggregates'],
      gist: 'OVER, PARTITION BY, RANK, ROW_NUMBER, LAG/LEAD compute values across related rows without collapsing groups.',
      levels: [
        { tier: 'Senior',
          anchor: { artifact: 'SELECT id, salary, RANK() OVER (ORDER BY salary DESC) as rank FROM employees',
            known: 'RANK gave each employee a position by salary without collapsing rows like GROUP BY would.' },
          newCase: 'You want the running total of sales per salesperson ordered by date. Which window function and clause do you need?',
          witness: { prompt: 'Which window function and framing clause produce a running total?',
            acceptKeywords: ['SUM','OVER','PARTITION BY','ORDER BY','ROWS','running total'], rejectKeywords: ['GROUP BY','aggregate','collapsed'] },
          hints: ['SUM() OVER (PARTITION BY ... ORDER BY ...) computes running totals.', 'The ORDER BY inside OVER controls the accumulation direction.'] }
      ]
    },
  ],
});

// ---------------------------------------------------------------------------
// Node.js
// ---------------------------------------------------------------------------
export const NODEJS_DOMAIN: Domain = hydrateGenerated({
  name: 'Node.js',
  root: 'node-event-loop',
  grounded: true,
  nodes: [
    { id: 'node-event-loop', label: 'Event loop & async model',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 0, requires: [],
      gist: 'Node.js handles I/O with a single-threaded event loop backed by libuv; callbacks and promises are queued as microtasks or macrotasks.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'setTimeout(() => console.log("timeout"), 0); Promise.resolve().then(() => console.log("promise"));',
            known: 'The promise callback logged first even though setTimeout came first in the code.' },
          newCase: 'Explain why the promise microtask runs before the setTimeout macrotask.',
          witness: { prompt: 'What is the order of microtasks vs macrotasks in the event loop?',
            acceptKeywords: ['microtask','macrotask','promise','before','queue'], rejectKeywords: ['same time','random','setTimeout first'] },
          hints: ['Microtasks (Promises) drain completely before the next macrotask (setTimeout).', 'The event loop always processes the microtask queue first.'] }
      ]
    },
    { id: 'node-modules', label: 'Module system (CJS vs ESM)',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 0, requires: ['node-event-loop'],
      gist: 'CommonJS require() is synchronous and dynamic; ES module import is static and enables tree-shaking.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'const fs = require("fs"); // CJS',
            known: 'require() loaded the fs module synchronously and cached it for subsequent requires.' },
          newCase: 'You switch a file to use import instead of require. Node throws an error about ES modules. What do you need to add to package.json?',
          witness: { prompt: 'What package.json field or file extension tells Node to treat files as ES modules?',
            acceptKeywords: ['type','module','"type": "module"','.mjs'], rejectKeywords: ['require','commonjs','nothing'] },
          hints: ['Node uses CommonJS by default.', 'Add "type": "module" to package.json or rename the file to .mjs.'] }
      ]
    },
    { id: 'node-streams', label: 'Streams & buffers',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 1, requires: ['node-event-loop'],
      gist: 'Streams process data in chunks avoiding loading entire payloads into memory; backpressure prevents producer from overwhelming consumer.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'fs.createReadStream("big.csv").pipe(transform).pipe(res)',
            known: 'Piping read the file in chunks and streamed it to the HTTP response without loading the whole file.' },
          newCase: 'The transform step is slower than the read stream. What mechanism prevents memory from growing unbounded?',
          witness: { prompt: 'What stream mechanism signals the producer to slow down or pause?',
            acceptKeywords: ['backpressure','pause','highWaterMark','drain'], rejectKeywords: ['nothing','buffer keeps growing','memory fine'] },
          hints: ['pipe() handles backpressure automatically.', 'When the consumer buffer is full, it signals the producer to pause.'] }
      ]
    },
    { id: 'node-http', label: 'HTTP server & middleware',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 1, requires: ['node-modules'],
      gist: 'http.createServer handles raw requests; Express middleware are functions (req, res, next) chained by router.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'app.use((req, res, next) => { console.log(req.path); next(); })',
            known: 'The logger middleware ran for every request then called next() to pass control to the next handler.' },
          newCase: 'An Express middleware does not call next() and does not send a response. What happens?',
          witness: { prompt: 'What happens to the request if neither next() is called nor a response is sent?',
            acceptKeywords: ['hang','timeout','stuck','never responds'], rejectKeywords: ['continues','moves on','next middleware'] },
          hints: ['Express does not automatically move to the next middleware.', 'The request hangs indefinitely until the client times out.'] }
      ]
    },
    { id: 'node-fs', label: 'File system API',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 2, row: 0, requires: ['node-event-loop'],
      gist: 'fs.promises provides async versions of all fs operations; path.join/resolve handle cross-platform paths.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'await fs.promises.readFile("data.json", "utf8")',
            known: 'readFile returned the file content as a string; it did not block the event loop while reading.' },
          newCase: 'You use fs.readFileSync inside an Express route handler. What is the performance impact?',
          witness: { prompt: 'Why is using a synchronous fs method inside a server request handler problematic?',
            acceptKeywords: ['blocks','event loop','all requests','synchronous','single thread'], rejectKeywords: ['fine','async','no impact'] },
          hints: ['Node.js is single-threaded.', 'Synchronous I/O blocks the event loop, stalling all other requests.'] }
      ]
    },
    { id: 'node-errors', label: 'Error handling & process',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 2, row: 1, requires: ['node-event-loop'],
      gist: 'Unhandled rejections crash the process in modern Node; process.on("uncaughtException") is a last-resort safety net.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'process.on("unhandledRejection", (err) => { log(err); process.exit(1); })',
            known: 'Without this handler, Node would print a warning and in newer versions crash on unhandled rejections.' },
          newCase: 'You use process.on("uncaughtException") to log errors and keep the server running. Why is this dangerous?',
          witness: { prompt: 'What application state problem occurs after an uncaught exception?',
            acceptKeywords: ['undefined','corrupt','unknown state','leak','inconsistent'], rejectKeywords: ['fine','safe','keep running'] },
          hints: ['An uncaught exception means the application reached an unexpected state.', 'Continuing may cause data corruption or security issues.'] }
      ]
    },
    { id: 'node-cluster', label: 'Cluster & worker threads',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 2, requires: ['node-event-loop','node-errors'],
      gist: 'cluster forks OS-level processes for multi-core; worker_threads share memory for CPU-bound parallel tasks.',
      levels: [
        { tier: 'Senior',
          anchor: { artifact: 'cluster.fork() — one worker per CPU core',
            known: 'Forking workers let the server utilise all CPU cores, multiplying throughput for I/O-bound work.' },
          newCase: 'Your app needs to parse a large JSON file on every request. Should you use cluster or worker_threads, and why?',
          witness: { prompt: 'Which is better for CPU-bound work shared across requests, and what is the key difference?',
            acceptKeywords: ['worker_threads','shared memory','CPU','thread'], rejectKeywords: ['cluster','process','separate memory'] },
          hints: ['cluster uses separate processes with no shared memory — good for I/O isolation.', 'worker_threads share the same memory space — ideal for CPU-intensive parallel tasks.'] }
      ]
    },
  ],
});

// ---------------------------------------------------------------------------
// React
// ---------------------------------------------------------------------------
export const REACT_DOMAIN: Domain = hydrateGenerated({
  name: 'React',
  root: 'react-component',
  grounded: true,
  nodes: [
    { id: 'react-component', label: 'Component model & JSX',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 0, requires: [],
      gist: 'Function components are pure UI functions mapping props to JSX; React re-renders a component when its props or state change.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'function Greeting({ name }: { name: string }) { return <h1>Hello {name}</h1>; }',
            known: 'The component rendered different text for different name prop values without mutation.' },
          newCase: 'You render <Greeting name="Alice" /> and later React re-renders with name="Bob". What does React do?',
          witness: { prompt: 'Does React update the existing DOM node or create a new one, and why?',
            acceptKeywords: ['update','reconcile','same node','diff','in-place'], rejectKeywords: ['destroy','new element','recreate'] },
          hints: ['React reconciles the virtual DOM diff.', 'It updates only what changed — the text node content — not the whole element.'] }
      ]
    },
    { id: 'react-state', label: 'State & useState',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 0, requires: ['react-component'],
      gist: 'useState returns [value, setter]; calling the setter schedules a re-render; state must be updated immutably.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'const [count, setCount] = useState(0); setCount(count + 1)',
            known: 'Calling setCount with a new value caused React to re-render the component with the updated count.' },
          newCase: 'You do: const [items, setItems] = useState([]); items.push("new"); setItems(items); The UI does not update. Why?',
          witness: { prompt: 'Why does mutating an array then setting the same reference not trigger a re-render?',
            acceptKeywords: ['same reference','mutation','immutable','new array','Object.is'], rejectKeywords: ['always updates','reference changes'] },
          hints: ['React uses Object.is to compare old and new state.', 'Mutating the array and passing the same reference looks unchanged to React.'] }
      ]
    },
    { id: 'react-effects', label: 'useEffect & lifecycle',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 1, requires: ['react-state'],
      gist: 'useEffect runs after render; the dependency array controls when; returning a cleanup function prevents leaks.',
      levels: [
        { tier: 'Junior',
          anchor: { artifact: 'useEffect(() => { const id = setInterval(tick, 1000); return () => clearInterval(id); }, [])',
            known: 'The cleanup function stopped the interval when the component unmounted, preventing a memory leak.' },
          newCase: 'You omit the dependency array entirely: useEffect(() => { fetchUser(userId); }). When does this run?',
          witness: { prompt: 'When does a useEffect with no dependency array execute?',
            acceptKeywords: ['every render','every re-render','always','no array'], rejectKeywords: ['once','mount only','on change'] },
          hints: ['Omitting the dependency array means no comparison is done.', 'The effect runs after every render.'] }
      ]
    },
    { id: 'react-context', label: 'Context & useContext',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 1, requires: ['react-state'],
      gist: 'Context broadcasts a value to any descendant; every consumer re-renders when the context value changes.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'const ThemeCtx = createContext("light"); <ThemeCtx.Provider value={theme}>',
            known: 'Any component calling useContext(ThemeCtx) received the current theme without prop drilling.' },
          newCase: 'The theme object is recreated on every render: <ThemeCtx.Provider value={{ mode }}> All consumers re-render even when mode did not change. Why?',
          witness: { prompt: 'Why does an inline object cause unnecessary re-renders of context consumers?',
            acceptKeywords: ['new reference','object','every render','useMemo','inline'], rejectKeywords: ['same value','no difference'] },
          hints: ['{ mode } creates a new object reference on every render.', 'React sees a new value and triggers re-renders in all consumers.'] }
      ]
    },
    { id: 'react-hooks', label: 'Custom hooks & rules of hooks',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 2, requires: ['react-effects','react-context'],
      gist: 'Hooks must be called at the top level, not in conditionals or loops; custom hooks extract reusable stateful logic.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: 'function useWindowWidth() { const [w, setW] = useState(window.innerWidth); useEffect(...); return w; }',
            known: 'The custom hook encapsulated the window width logic and could be reused across many components.' },
          newCase: 'You write if (condition) { useState(false); } inside a component. What does React throw?',
          witness: { prompt: 'Why does React prohibit hooks inside conditions?',
            acceptKeywords: ['order','same order','hooks call order','breaks'], rejectKeywords: ['fine','works','no rule'] },
          hints: ['React tracks hooks by call order, not by name.', 'Conditional hooks change the order between renders, corrupting React internal state.'] }
      ]
    },
    { id: 'react-reconciliation', label: 'Reconciliation & virtual DOM',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 1, row: 2, requires: ['react-effects'],
      gist: 'React diffs the virtual DOM tree; the key prop tells React which elements are the same across renders.',
      levels: [
        { tier: 'Mid',
          anchor: { artifact: '{items.map((item) => <li key={item.id}>{item.name}</li>)}',
            known: 'Adding key={item.id} let React reorder list items efficiently without re-creating all DOM nodes.' },
          newCase: 'You use array index as the key: key={index}. You reorder the items. What problem occurs?',
          witness: { prompt: 'Why does using index as key cause problems when list order changes?',
            acceptKeywords: ['wrong item','stale','index changes','mismatch','incorrect state'], rejectKeywords: ['fine','works','no issue'] },
          hints: ['React uses key to match old and new list items.', 'If index changes (due to reorder), React matches wrong items and may show stale data.'] }
      ]
    },
    { id: 'react-patterns', label: 'Performance & memo',
      eat: { entity: 'concept', action: 'recall', target: 'node' },
      col: 0, row: 3, requires: ['react-hooks','react-reconciliation'],
      gist: 'React.memo, useMemo, useCallback prevent unnecessary re-renders; profile before optimising.',
      levels: [
        { tier: 'Senior',
          anchor: { artifact: 'const MemoComp = React.memo(ExpensiveComp)',
            known: 'React.memo skipped re-rendering ExpensiveComp when its props had not changed.' },
          newCase: 'You wrap a component in React.memo but it still re-renders every time. The parent passes an inline function as a prop. Why?',
          witness: { prompt: 'Why does an inline callback prop bypass React.memo?',
            acceptKeywords: ['new function','reference','inline','every render','useCallback'], rejectKeywords: ['same function','memoized','no effect'] },
          hints: ['React.memo uses shallow comparison on props.', 'A new inline function is a new reference on every render, so shallow compare fails.'] }
      ]
    },
  ],
});
