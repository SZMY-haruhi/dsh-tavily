# dsh-web-search-tavily

中文 | [English](README.en.md)

[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的 Tavily 网页搜索。设置页开关：开 = Tavily，关 = 官方 DeepSeek。

## 安装

```sh
dsh plugin --profile web add github:SZMY-haruhi/dsh-web-search-Tavily
dsh web
```

设置 → 插件 → 插件配置 → **Tavily 网页搜索**：填 Key，打开开关，保存。

<p align="center">
  <img src="docs/settings-zh.png" alt="Tavily 网页搜索设置" width="560" />
</p>


钉 commit：

```sh
dsh plugin --profile web add github:SZMY-haruhi/dsh-web-search-Tavily#<commit>
```

卸载：

```sh
dsh plugin --profile web remove dsh-web-search-tavily
```

> `dsh.bundle` · 预构建 `lib/` · git 安装无需 `allowBuilds`

## 行为

| 开关 | `web_search` |
|---|---|
| 关（默认） | 官方 DeepSeek |
| 开 | Tavily `POST /search` |

Provider id：`tavily`。Key / 开关走 credentials。

## 凭证

| 引用 | 含义 |
|---|---|
| `TAVILY_API_KEY` | Tavily API Key |
| `TAVILY_SEARCH_ENABLED` | 有此项则为开；删除即关 |

可写在 `$DSH_HOME/.credentials.yaml`。不要把真实钥匙提交进仓库。
