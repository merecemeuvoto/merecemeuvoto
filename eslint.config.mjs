import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "scripts/**", "next-env.d.ts", "public/comparador/**"],
  },
];

export default config;
