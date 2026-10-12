const mocks = new Map([
  ["@deepseek-ai/schemastery", new URL("./mocks/schemastery.mjs", import.meta.url).href],
  ["@deepseek-ai/dsh-credentials", new URL("./mocks/credentials.mjs", import.meta.url).href],
  ["@deepseek-ai/dsh-launch-environment", new URL("./mocks/launch-environment.mjs", import.meta.url).href],
  ["@deepseek-ai/dsh-web", new URL("./mocks/web.mjs", import.meta.url).href],
  ["@deepseek-ai/dsh-web-search-deepseek", new URL("./mocks/web-search-deepseek.mjs", import.meta.url).href],
]);

export function resolve(specifier, context, nextResolve) {
  const mocked = mocks.get(specifier);
  if (mocked) return { url: mocked, shortCircuit: true };
  return nextResolve(specifier, context);
}
