# dsh-web-search-tavily

[中文](README.md) | English

[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

Tavily web search for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Settings toggle: on = Tavily, off = official DeepSeek.

## Install

```sh
dsh plugin --profile web add github:SZMY-haruhi/dsh-web-search-Tavily
dsh web
```

Settings → Plugins → Plugin settings → **Tavily web search**: paste the key, turn the toggle on, save.

<p align="center">
  <img src="docs/settings-en.png" alt="Tavily web search settings" width="560" />
</p>


Pin a commit:

```sh
dsh plugin --profile web add github:SZMY-haruhi/dsh-web-search-Tavily#<commit>
```

Remove:

```sh
dsh plugin --profile web remove dsh-web-search-tavily
```

> `dsh.bundle` · prebuilt `lib/` · git install does not need `allowBuilds`

## Behavior

| Toggle | `web_search` |
|---|---|
| Off (default) | official DeepSeek |
| On | Tavily `POST /search` |

Provider id: `tavily`. Key and toggle live on the credentials plane.

## Credentials

| Ref | Meaning |
|---|---|
| `TAVILY_API_KEY` | Tavily API key |
| `TAVILY_SEARCH_ENABLED` | Present = on; unset = off |

You can also put these in `$DSH_HOME/.credentials.yaml`. Do not commit real keys.
