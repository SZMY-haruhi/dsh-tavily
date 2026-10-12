function chain() {
  return new Proxy(function () {}, {
    get(_target, prop) {
      if (prop === "object") return (shape) => shape;
      return () => chain();
    },
    apply() {
      return chain();
    },
  });
}

export default chain();
