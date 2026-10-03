import * as brainRoute from './app/api/brain/route';
import * as chatRoute from './app/api/chat/route';
import * as analyzeImpactRoute from './app/api/evolution/analyze-impact/route';
import * as autoTestRoute from './app/api/evolution/auto-test/route';
import * as coherenceGateRoute from './app/api/evolution/coherence-gate/route';
import * as debateRoute from './app/api/evolution/debate/route';
import * as healthRoute from './app/api/evolution/health/route';
import * as orchestraRoute from './app/api/evolution/orchestra/route';
import * as proposeRoute from './app/api/evolution/propose/route';
import * as lockRoute from './app/api/evolution/lock/route';
import * as extractTextRoute from './app/api/extract-text/route';
import * as githubBranchesRoute from './app/api/github/branches/route';
import * as githubBulkCommitRoute from './app/api/github/bulk-commit/route';
import * as githubCreateBranchRoute from './app/api/github/create-branch/route';
import * as githubCreateRepoRoute from './app/api/github/create-repo/route';
import * as githubCreateSystemRepoRoute from './app/api/github/create-system-repo/route';
import * as githubDeleteFileRoute from './app/api/github/delete-file/route';
import * as githubPushEnhancementsRoute from './app/api/github/push-enhancements/route';
import * as githubReadFileRoute from './app/api/github/read-file/route';
import * as githubRepoStatusRoute from './app/api/github/repo-status/route';
import * as githubScanRoute from './app/api/github/scan/route';
import * as githubSiphonRoute from './app/api/github/siphon/route';
import * as githubUserReposRoute from './app/api/github/user-repos/route';
import * as githubWriteFileRoute from './app/api/github/write-file/route';
import * as learningLogsSyncRoute from './app/api/learning-logs/sync/route';
import * as rootApiRoute from './app/api/route';
import * as testConnectionRoute from './app/api/setup/test-connection/route';
import * as systemRebootRoute from './app/api/system/reboot/route';
import * as systemScaffoldRoute from './app/api/system/scaffold/route';
import * as systemFixBugsRoute from './app/api/system/fix-bugs/route';
import * as validateRoute from './app/api/validate/route';

export const apiRoutes: Record<string, unknown> = {
  '/api': rootApiRoute,
  '/api/brain': brainRoute,
  '/api/chat': chatRoute,
  '/api/evolution/analyze-impact': analyzeImpactRoute,
  '/api/evolution/auto-test': autoTestRoute,
  '/api/evolution/coherence-gate': coherenceGateRoute,
  '/api/evolution/debate': debateRoute,
  '/api/evolution/health': healthRoute,
  '/api/evolution/lock': lockRoute,
  '/api/evolution/orchestra': orchestraRoute,
  '/api/evolution/propose': proposeRoute,
  '/api/extract-text': extractTextRoute,
  '/api/github/branches': githubBranchesRoute,
  '/api/github/bulk-commit': githubBulkCommitRoute,
  '/api/github/create-branch': githubCreateBranchRoute,
  '/api/github/create-repo': githubCreateRepoRoute,
  '/api/github/create-system-repo': githubCreateSystemRepoRoute,
  '/api/github/delete-file': githubDeleteFileRoute,
  '/api/github/push-enhancements': githubPushEnhancementsRoute,
  '/api/github/read-file': githubReadFileRoute,
  '/api/github/repo-status': githubRepoStatusRoute,
  '/api/github/scan': githubScanRoute,
  '/api/github/siphon': githubSiphonRoute,
  '/api/github/user-repos': githubUserReposRoute,
  '/api/github/write-file': githubWriteFileRoute,
  '/api/learning-logs/sync': learningLogsSyncRoute,
  '/api/setup/test-connection': testConnectionRoute,
  '/api/system/fix-bugs': systemFixBugsRoute,
  '/api/system/reboot': systemRebootRoute,
  '/api/system/scaffold': systemScaffoldRoute,
  '/api/validate': validateRoute,
};
