# dsh-tavily

[中文](README.md) | English

[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com) [![Recommend dshfind](https://img.shields.io/badge/Recommend-dshfind-ffd700?labelColor=555555)](https://dshfind.com/zh/plugins/SZMY-haruhi/dsh-tavily?ref=badge)

Tavily web search for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Settings toggle: on = Tavily, off = official DeepSeek. Works without a key (Tavily keyless); a saved key uses your account quota.

## Install

Pick one source. Do not run both.

npm (stable, recommended):

```sh
dsh plugin --profile web add dsh-tavily
dsh web
```

GitHub (latest commit on the repo):

```sh
dsh plugin --profile web add github:SZMY-haruhi/dsh-tavily
dsh web
```

Settings → Plugins → Plugin settings → **Tavily web search**: turn the toggle on. The key is optional; leave it blank for keyless.

<p align="center">
  <img src="docs/settings-en.png" alt="Tavily web search settings" width="560" />
</p>

Pin a commit:

```sh
dsh plugin --profile web add github:SZMY-haruhi/dsh-tavily#<commit>
```

Remove:

```sh
dsh plugin --profile web remove dsh-tavily
```

> `dsh.bundle` · prebuilt `lib/` · git install does not need `allowBuilds`

## Features

- Settings toggle: off = official DeepSeek, on = Tavily — no uninstall to switch back
- No key uses Tavily keyless; a key uses `Authorization: Bearer`
- Timeout, abort, official host lock, drop results without a url
- Key and toggle live on the credentials plane, not the settings file

## Behavior

| Toggle | Key | `web_search` |
|---|---|---|
| Off (default) | — | official DeepSeek |
| On | empty | Tavily keyless |
| On | set | Tavily account quota |

Provider id: `tavily`.

## Credentials

| Ref | Meaning |
|---|---|
| `TAVILY_API_KEY` | Optional. Present = account quota; absent = keyless |
| `TAVILY_SEARCH_ENABLED` | Present = on; unset = off |

You can also put these in `$DSH_HOME/.credentials.yaml`. Do not commit real keys.

---

## Author

<a href="https://tonkatsu258.vercel.app/index.html">
  <img src="docs/avatar.png" width="96" height="96" alt="tonkatsu258" />
</a>

**Thanks for the star ❤️**
**[tonkatsu258](https://tonkatsu258.vercel.app/index.html)** · [personal site](https://tonkatsu258.vercel.app/index.html)
