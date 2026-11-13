import {execFileSync} from "node:child_process";
import type { NextConfig } from "next";
// Git deployments provide the commit without shipping a .git directory.
function appVersion() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  try { return execFileSync("git", ["rev-parse", "HEAD"], {encoding:"utf8",stdio:["ignore","pipe","ignore"]}).trim(); }
  catch { return "unversioned"; }
}
const config: NextConfig = {
  agentRules: false,
  env:{NEXT_PUBLIC_APP_VERSION:appVersion()},
  devIndicators: false,
  poweredByHeader: false,
};
export default config;
