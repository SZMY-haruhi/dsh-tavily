# dsh-web-search-tavily

为 [DeepSeek Harness](https://github.com/deepseek-ai/dsh) 增加 **Tavily** 网页搜索。设置页提供开关：打开走 Tavily，关闭仍走官方 DeepSeek 搜索。不重复实现官方已有的 DeepSeek / Exa 提供方。

官方 `web_search` 默认钉在 `deepseek-official`。本包装上后把选择切到 `tavily`，但默认开关是关的，因此行为仍等于官方搜索；打开开关并保存 Tavily Key 后才改走路由。

## 安装

用官方 `dsh plugin add`（会写入 bundle 层）。不要手动 mklink，也不要覆盖 profile 的 `cordis.patch.yml`。

```powershell
npx @deepseek-ai/dsh plugin --profile web add github:SZMY-haruhi/dsh-web-search-Tavily
```

钉到 tag 或 commit：

```powershell
npx @deepseek-ai/dsh plugin --profile web add github:SZMY-haruhi/dsh-web-search-Tavily#v0.1.0
```

本包已是可运行的 `lib/*.js`，没有 `prepare` 构建脚本，git 安装不需要 pnpm `allowBuilds`。

然后重启：

```powershell
npx @deepseek-ai/dsh web
```

打开设置 → 插件 → 插件配置，应看到 **Tavily 网页搜索**：

1. 粘贴 Tavily API Key，保存
2. 打开「使用 Tavily」开关，保存

卸掉后官方选择会随 bundle 层一起恢复：

```powershell
npx @deepseek-ai/dsh plugin --profile web remove dsh-web-search-tavily
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
