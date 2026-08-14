# dsh-web-search-tavily

[![awesome · DSH plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 增加 **Tavily** 网页搜索。设置页提供开关：打开走 Tavily，关闭仍走官方 DeepSeek 搜索。不重复实现官方已有的 DeepSeek / Exa 提供方。

官方 `web_search` 默认钉在 `deepseek-official`。本包装上后把选择切到 `tavily`，但默认开关是关的，因此行为仍等于官方搜索；打开开关并保存 Tavily Key 后才改走路由。

## 安装

需已安装 [`dsh` CLI](https://github.com/deepseek-ai/deepseek-harness)。本包声明了 `dsh.bundle` 官方清单，一条命令装进 web profile 并自动写入 bundle 层：

```sh
dsh plugin --profile web add github:SZMY-haruhi/dsh-web-search-Tavily
```

官方建议钉到 commit，避免后续推送改变实际运行的内容：

```sh
dsh plugin --profile web add github:SZMY-haruhi/dsh-web-search-Tavily#<commit>
```

本包已包含可运行的 `lib/*.js`，没有 `prepare` 构建脚本，git 安装不需要 pnpm `allowBuilds`。

然后重启 dsh 服务：

```sh
dsh web
```

打开设置 → 插件 → 插件配置，应看到 **Tavily 网页搜索**：

1. 粘贴 Tavily API Key，保存
2. 打开「使用 Tavily」开关，保存

卸载会同时移除依赖和对应的层：

```sh
dsh plugin --profile web remove dsh-web-search-tavily
```

## 开关怎么工作

rc.6 不能从第三方设置卡改 `web.searchProvider`（该字段在 Host 启动时拍死）。因此：

- 本包把 `searchProvider` 设为 `tavily`（只占用一个新 id，不删官方插件行）
- 开关关闭：本提供方把搜索转交给官方 `@deepseek-ai/dsh-web-search-deepseek` 的实现
- 开关打开：请求 Tavily `POST /search`
- Key 和开关都写进 credentials 平面（与模型页存 Key 同一条路），不依赖被白名单挡住的 settings namespace

## 凭证

| 引用 | 含义 |
|---|---|
| `TAVILY_API_KEY` | Tavily 钥匙 |
| `TAVILY_SEARCH_ENABLED` | 存在且为 `true` 时启用 Tavily；删除该项即关闭 |

也可在 `$DSH_HOME/.credentials.yaml` 里写这两项。不要把真实钥匙写进本仓库。
