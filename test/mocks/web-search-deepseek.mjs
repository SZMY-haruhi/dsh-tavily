export const deepseekCalls = [];

export class DeepSeekSearchProvider {
  constructor(resolveOptions) {
    this.resolveOptions = resolveOptions;
  }

  async search(request, signal) {
    deepseekCalls.push({ request, signal });
    return { sources: [{ url: "https://example.test/deepseek" }], truncated: false };
  }
}

export const DEEPSEEK_DEFAULT_API_VERSION = "v1";
export const DEEPSEEK_DEFAULT_BASE_URL = "https://api.deepseek.com/anthropic/v1";
export const DEEPSEEK_DEFAULT_MAX_TOKENS = 1024;
export const DEEPSEEK_DEFAULT_MAX_USES = 3;
export const DEEPSEEK_DEFAULT_MODEL = "deepseek-v4-flash";
