export class WebError extends Error {
  constructor(message, code, options) {
    super(message, options);
    this.code = code;
    this.name = "WebError";
  }
}
