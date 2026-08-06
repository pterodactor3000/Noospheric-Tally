import { defineConfig, globalIgnores } from "eslint/config";
import nextTypeScript from "eslint-config-next/typescript";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
	...nextCoreWebVitals,
	...nextTypeScript,
	globalIgnores([
		".next/**",
		".open-next/**",
		".wrangler/**",
		"out/**",
		"build/**",
		"next-env.d.ts",
		"cloudflare-env.d.ts",
	]),
]);

export default eslintConfig;
