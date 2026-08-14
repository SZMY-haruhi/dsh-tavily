window.__ModuleLoader__.load({
  id: "dsh-web-search-tavily",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react = require("react");
    let react_jsx_runtime = require("react/jsx-runtime");
    let _client_runtime = require("@deepseek-ai/dsh-client-runtime/client");

    const KEY_REF = "TAVILY_API_KEY";
    const ENABLED_REF = "TAVILY_SEARCH_ENABLED";

    function injectCss() {
      if (typeof document === "undefined") return () => {};
      const prev = document.querySelector("style[data-tavily-search-css]");
      if (prev) prev.remove();
      const tag = document.createElement("style");
      tag.setAttribute("data-tavily-search-css", "5");
      tag.textContent = [
        ".tvly_card{list-style:none;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-3);transition:border-color .16s,background .16s}",
        ".tvly_card:hover{border-color:var(--dsw-alias-label-dimmed)}",
        ".tvly_cardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}",
        ".tvly_head{width:100%;appearance:none;border:0;background:none;font:inherit;color:inherit;text-align:left;cursor:pointer;display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px}",
        ".tvly_head:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}",
        ".tvly_headText{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}",
        ".tvly_name{font-size:15px;font-weight:600;line-height:1.4;color:var(--dsw-alias-label-primary)}",
        ".tvly_desc{font-size:13px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}",
        ".tvly_pending{flex:none;border-radius:999px;padding:1px 8px;font-size:11px;line-height:17px;font-weight:500;white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary)}",
        ".tvly_chevron{flex:none;display:block;width:14px;height:14px;color:var(--dsw-alias-label-tertiary);transition:transform .16s}",
        ".tvly_chevronOpen{transform:rotate(180deg)}",
        ".tvly_body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}",
        ".tvly_field{display:flex;flex-direction:column;gap:6px;padding:12px 0}",
        ".tvly_field+.tvly_field{border-top:1px solid var(--dsw-alias-border-l2)}",
        ".tvly_fieldHead{display:flex;align-items:center;gap:8px}",
        ".tvly_label{flex:1;min-width:0;font-size:13px;font-weight:500;line-height:1.5;color:var(--dsw-alias-label-primary)}",
        ".tvly_badge{border-radius:999px;padding:1px 8px;font-size:11px;line-height:17px;white-space:nowrap;font-weight:500;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary)}",
        ".tvly_hint{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}",
        ".tvly_input{height:34px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-3);font:inherit;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-primary)}",
        ".tvly_input:focus-visible{outline:none;border-color:var(--dsw-alias-brand-primary)}",
        ".tvly_input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}",
        ".tvly_switch{flex:none;position:relative;width:36px;height:20px;cursor:pointer}",
        ".tvly_switchInput{position:absolute;inset:0;margin:0;opacity:0;cursor:pointer}",
        ".tvly_switchTrack{display:block;width:36px;height:20px;border-radius:999px;background:var(--dsw-alias-bg-module-platform);transition:background .16s}",
        ".tvly_switchTrack::after{content:\"\";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-label-primary);transition:transform .16s}",
        ".tvly_switchInput:checked+.tvly_switchTrack{background:var(--dsw-alias-brand-primary)}",
        ".tvly_switchInput:checked+.tvly_switchTrack::after{transform:translateX(16px);background:#fff}",
        ".tvly_switchInput:focus-visible+.tvly_switchTrack{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}",
        ".tvly_switchInput:disabled+.tvly_switchTrack{opacity:.4}",
        ".tvly_footer{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:12px 0 4px;border-top:1px solid var(--dsw-alias-border-l2)}",
        ".tvly_failed{flex:1;min-width:0;margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-error)}",
        ".tvly_discard,.tvly_save{appearance:none;border:1px solid transparent;border-radius:8px;padding:5px 14px;font:inherit;font-size:13px;line-height:1.5;cursor:pointer}",
        ".tvly_discard{border-color:var(--dsw-alias-border-l2);background:none;color:var(--dsw-alias-label-secondary)}",
        ".tvly_discard:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}",
        ".tvly_save{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}",
        ".tvly_discard:disabled,.tvly_save:disabled{opacity:.4;cursor:default}",
        ".tvly_discard:focus-visible,.tvly_save:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}",
      ].join("");
      document.head.appendChild(tag);
      return () => tag.remove();
    }

    class TavilyCardController {
      constructor(api) {
        this.api = api;
        this.enabled = false;
        this.keyConfigured = false;
        this.keyWritable = true;
        this.enabledWritable = true;
        this.draftKey = "";
        this.draftEnabled = false;
        this.saving = false;
        this.failed = false;
        this.store = _client_runtime.createSnapshotStore(this.projection());
        this.refresh();
      }

      projection() {
        const dirty = this.draftEnabled !== this.enabled || this.draftKey.trim() !== "";
        return {
          enabled: this.draftEnabled,
          keyConfigured: this.keyConfigured,
          keyWritable: this.keyWritable,
          enabledWritable: this.enabledWritable,
          draftKey: this.draftKey,
          dirty,
          saving: this.saving,
          failed: this.failed,
        };
      }

      publish() {
        this.store.set(this.projection());
      }

      async describe(ref) {
        try {
          const response = await this.api.credentials.describe({ refs: [ref] });
          if (!response.result.ok) return { configured: false, writable: true };
          return response.result.value.credentials[ref] ?? { configured: false, writable: true };
        } catch {
          return { configured: false, writable: true };
        }
      }

      async refresh() {
        const enabled = await this.describe(ENABLED_REF);
        const key = await this.describe(KEY_REF);
        // describe() is value-free: presence of TAVILY_SEARCH_ENABLED means on.
        this.enabled = !!enabled.configured;
        this.enabledWritable = enabled.writable ?? true;
        this.keyConfigured = !!key.configured;
        this.keyWritable = key.writable ?? true;
        this.draftEnabled = this.enabled;
        this.draftKey = "";
        this.failed = false;
        this.publish();
      }

      inject() {
        return {
          hooks: { tavilyCard: this.store },
          setEnabled: (value) => {
            this.draftEnabled = value;
            this.failed = false;
            this.publish();
          },
          setKey: (text) => {
            this.draftKey = text;
            this.failed = false;
            this.publish();
          },
          discard: () => {
            this.draftEnabled = this.enabled;
            this.draftKey = "";
            this.failed = false;
            this.publish();
          },
          save: () => this.save(),
        };
      }

      async save() {
        if (this.saving) return;
        this.saving = true;
        this.failed = false;
        this.publish();
        try {
          if (this.enabledWritable) {
            if (this.draftEnabled) await this.api.credentials.set({ ref: ENABLED_REF, value: "true" });
            else await this.api.credentials.unset({ ref: ENABLED_REF });
          }
          const key = this.draftKey.trim();
          if (key && this.keyWritable) {
            await this.api.credentials.set({ ref: KEY_REF, value: key });
          }
          await this.refresh();
        } catch {
          this.failed = true;
          this.saving = false;
          this.publish();
          return;
        }
        this.saving = false;
        this.publish();
      }
    }

    function TavilyCard(props) {
      const { t } = props;
      const state = props.useTavilyCard((s) => s);
      const [open, setOpen] = react.useState(false);
      const blocked = !state.dirty || state.saving;
      const title = t ? t("title") : "Tavily 网页搜索";
      const description = t ? t("description") : "打开后走 Tavily（无 Key 也可用）；关闭后仍用官方 DeepSeek";
      return react_jsx_runtime.jsxs("li", {
        className: open ? "tvly_card tvly_cardOpen" : "tvly_card",
        children: [
          react_jsx_runtime.jsxs("button", {
            type: "button",
            className: "tvly_head",
            "aria-expanded": open,
            onClick: () => setOpen(!open),
            children: [
              react_jsx_runtime.jsxs("span", {
                className: "tvly_headText",
                children: [
                  react_jsx_runtime.jsx("span", { className: "tvly_name", children: title }),
                  react_jsx_runtime.jsx("span", { className: "tvly_desc", children: description }),
                ],
              }),
              state.dirty ? react_jsx_runtime.jsx("span", { className: "tvly_pending", children: t ? t("unsaved") : "未保存" }) : null,
              react_jsx_runtime.jsx("svg", {
                className: open ? "tvly_chevron tvly_chevronOpen" : "tvly_chevron",
                width: 14,
                height: 14,
                viewBox: "0 0 14 14",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg",
                "aria-hidden": true,
                children: react_jsx_runtime.jsx("path", {
                  d: "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z",
                  fill: "currentColor",
                }),
              }),
            ],
          }),
          open ? react_jsx_runtime.jsxs("div", {
            className: "tvly_body",
            children: [
              react_jsx_runtime.jsxs("div", {
                className: "tvly_field",
                children: [
                  react_jsx_runtime.jsxs("div", {
                    className: "tvly_fieldHead",
                    children: [
                      react_jsx_runtime.jsx("span", { className: "tvly_label", children: t ? t("enable") : "使用 Tavily（关闭则走官方 DeepSeek）" }),
                      react_jsx_runtime.jsxs("label", {
                        className: "tvly_switch",
                        children: [
                          react_jsx_runtime.jsx("input", {
                            className: "tvly_switchInput",
                            type: "checkbox",
                            role: "switch",
                            "aria-checked": state.enabled,
                            checked: state.enabled,
                            disabled: !state.enabledWritable,
                            onChange: (e) => props.setEnabled(e.target.checked),
                          }),
                          react_jsx_runtime.jsx("span", { className: "tvly_switchTrack", "aria-hidden": true }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              react_jsx_runtime.jsxs("div", {
                className: "tvly_field",
                children: [
                  react_jsx_runtime.jsxs("div", {
                    className: "tvly_fieldHead",
                    children: [
                      react_jsx_runtime.jsx("span", { className: "tvly_label", children: "API Key" }),
                      react_jsx_runtime.jsx("span", {
                        className: "tvly_badge",
                        children: state.keyConfigured
                          ? (t ? t("keyOk") : "已配置密钥。")
                          : (t ? t("keyMissing") : "未配置，将走无 Key。"),
                      }),
                    ],
                  }),
                  react_jsx_runtime.jsx("input", {
                    className: "tvly_input",
                    type: "password",
                    placeholder: state.keyConfigured
                      ? (t ? t("keyPlaceholderKeep") : "留空表示保持当前密钥。")
                      : (t ? t("keyPlaceholderEmpty") : "可选。留空则走无 Key。"),
                    value: state.draftKey,
                    disabled: !state.keyWritable,
                    onChange: (e) => props.setKey(e.target.value),
                  }),
                  react_jsx_runtime.jsx("p", {
                    className: "tvly_hint",
                    children: state.keyConfigured
                      ? (t ? t("keyHintKeep") : "不写入设置文件。留空表示保持当前密钥。")
                      : (t ? t("keyHintEmpty") : "不填则走 Tavily 无 Key（keyless）。填了则走账号档。"),
                  }),
                ],
              }),
              react_jsx_runtime.jsxs("div", {
                className: "tvly_footer",
                children: [
                  state.failed ? react_jsx_runtime.jsx("p", { className: "tvly_failed", children: t ? t("saveFailed") : "保存失败" }) : null,
                  react_jsx_runtime.jsx("button", {
                    type: "button",
                    className: "tvly_discard",
                    disabled: blocked,
                    onClick: props.discard,
                    children: t ? t("discard") : "放弃修改",
                  }),
                  react_jsx_runtime.jsx("button", {
                    type: "button",
                    className: "tvly_save",
                    disabled: blocked,
                    onClick: props.save,
                    children: state.saving ? (t ? t("saving") : "保存中…") : (t ? t("save") : "保存"),
                  }),
                ],
              }),
            ],
          }) : null,
        ],
      });
    }

    const inject = ["slots", "locale", "connection", "remote"];

    function apply(ctx) {
      const { api } = ctx.get("connection");
      const en = {
        title: "Tavily web search",
        description: "On: Tavily (works without a key). Off: official DeepSeek.",
        enable: "Use Tavily (off = official DeepSeek)",
        unsaved: "Unsaved",
        keyOk: "Key configured.",
        keyMissing: "No key — keyless mode.",
        keyPlaceholderKeep: "Leave blank to keep the current key.",
        keyPlaceholderEmpty: "Optional. Leave blank for keyless.",
        keyHintKeep: "Not written to the settings file. Leave blank to keep the current key.",
        keyHintEmpty: "Leave blank to use Tavily keyless. A saved key uses your account quota.",
        saveFailed: "Save failed",
        discard: "Discard",
        save: "Save",
        saving: "Saving…",
      };
      const zh = {
        title: "Tavily 网页搜索",
        description: "打开后走 Tavily（无 Key 也可用）；关闭后仍用官方 DeepSeek",
        enable: "使用 Tavily（关闭则走官方 DeepSeek）",
        unsaved: "未保存",
        keyOk: "已配置密钥。",
        keyMissing: "未配置，将走无 Key。",
        keyPlaceholderKeep: "留空表示保持当前密钥。",
        keyPlaceholderEmpty: "可选。留空则走无 Key。",
        keyHintKeep: "不写入设置文件。留空表示保持当前密钥。",
        keyHintEmpty: "不填则走 Tavily 无 Key（keyless）。填了则走账号档。",
        saveFailed: "保存失败",
        discard: "放弃修改",
        save: "保存",
        saving: "保存中…",
      };
      ctx.effect(() => injectCss(), "tavily css");
      ctx.effect(() => ctx.locale.register("web-search-tavily", { en, zh }), "tavily locale");

      const card = new TavilyCardController(api);
      const remote = ctx.get("remote");
      if (remote) ctx.effect(() => remote.$on("credentials/updated", () => card.refresh()), "tavily creds");

      ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
        name: "settings.plugin.item",
        id: "web-search-tavily",
        order: 21,
        locale: "web-search-tavily",
        inject: () => card.inject(),
      }, TavilyCard));
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
