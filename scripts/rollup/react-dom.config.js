import { getPackageJSON, resolvePkgPath, getBaseRollupPlugins } from "./utils";
import generatePackageJson from "rollup-plugin-generate-package-json";
import alias from "@rollup/plugin-alias";

const { name, module, peerDependencies } = getPackageJSON("react-dom");
// react包的路径
const pkgPath = resolvePkgPath(name);
// react产物路径
const pkgDistPath = resolvePkgPath(name, true);

export default [
  // react 打包
  {
    input: `${pkgPath}/${module}`,
    output: [
      {
        file: `${pkgDistPath}/index.js`,
        name: "ReactDOM",
        format: "umd",
        sourcemap: true,
      },
      {
        file: `${pkgDistPath}/client.js`,
        name: "client",
        format: "umd",
        sourcemap: true,
      },
    ],
    external: [...Object.keys(peerDependencies)],
    plugins: [
      ...getBaseRollupPlugins(),
      alias({
        entries: [
          { find: "hostConfig", replacement: `${pkgPath}/src/hostConfig.ts` },
        ],
      }),
      generatePackageJson({
        inputFolder: pkgPath,
        outputFolder: pkgDistPath,
        baseContents: ({ name, description, version }) => ({
          name,
          description,
          version,
          main: "index.js",
          peerDependencies: {
            react: version,
          },
        }),
      }),
    ],
  },
  {
    input: `${pkgPath}/test-utils.ts`,
    output: {
      file: `${pkgDistPath}/test-utils.js`,
      name: "testUtils",
      format: "umd",
      sourcemap: true,
    },
    external: ["react", "react-dom"],
    plugins: getBaseRollupPlugins(),
  },
];
