// Fails when any effect or callback in app/ may read stale values
// (react-hooks/exhaustive-deps). Other lint rules are reported by `pnpm lint`.
import { ESLint } from "eslint";

const eslint = new ESLint({ cwd: new URL("..", import.meta.url).pathname });
const results = await eslint.lintFiles(["app/**/*.{ts,tsx}"]);
const problems = results.flatMap(file => file.messages
  .filter(message => message.ruleId === "react-hooks/exhaustive-deps")
  .map(message => `${file.filePath.split("/app/")[1]}:${message.line} ${message.message.split(". ")[0]}`));
if (problems.length) {
  console.error(`Hook dependency problems (${problems.length}):\n${problems.join("\n")}`);
  process.exit(1);
}
console.log(`Hook dependencies: ${results.length} files checked, 0 problems.`);
