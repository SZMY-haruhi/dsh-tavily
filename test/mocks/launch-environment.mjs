export function launchEnvironmentOf() {
  return {
    get(ref) {
      if (ref === "TAVILY_SEARCH_ENABLED") return { value: "false" };
      return undefined;
    },
  };
}
