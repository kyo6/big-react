import path from "path";
import fs from "fs";

import commonjs from "@rollup/plugin-commonjs";
import typescriptPlugin from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";

const pkgPath = path.resolve(__dirname, "../../packages");
const distPath = path.resolve(__dirname, "../../dist/node_modules");

export function resolvePkgPath(pkgName, isDist) {
  if (isDist) {
    return `${distPath}/${pkgName}`;
  }
  return `${pkgPath}/${pkgName}`;
}

export function getPackageJSON(pkgName) {
  // ...包路径
  const path = `${resolvePkgPath(pkgName)}/package.json`;
  const str = fs.readFileSync(path, { encoding: "utf-8" });
  return JSON.parse(str);
}

export function getBaseRollupPlugins({
  alias = { __DEV__: true, preventAssignment: true },
  typescript = {},
} = {}) {
  return [commonjs(), typescriptPlugin(typescript), replace(alias)];
}
