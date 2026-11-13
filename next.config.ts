import {execFileSync} from "node:child_process";
import type { NextConfig } from "next";
const config: NextConfig = {
  agentRules: false,
  env:{NEXT_PUBLIC_APP_VERSION:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim()},
  devIndicators: false,
  poweredByHeader: false,
};
export default config;
