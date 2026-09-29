import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const alwaysexcluded = [
  "**/node_modules/**",
  "**/index.ts",
  "vitest.config.ts",
];
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "parallel-tests",
          exclude: [...alwaysexcluded, "**/*.sequential.test.ts"],
          sequence: { groupOrder: 0 },
        },
      },
      {
        extends: true,
        test: {
          name: "Sequential Tests",
          include: ["src/**/*.sequential.test.ts"],
          exclude: alwaysexcluded,
          sequence: { groupOrder: 1 },
          pool: "threads",
          poolOptions: {
            threads: {
              singleThread: true,
            },
          },
        },
      },
    ],
    coverage: {
      exclude: alwaysexcluded,
    },
    globals: true,
    restoreMocks: true,
  },
  plugins: [tsconfigPaths()],
});
