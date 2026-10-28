(function (scope) {
  function createHud(root) {
    const fields = new Map();
    for (const node of root.querySelectorAll("[data-hud]")) fields.set(node.dataset.hud, node);
    return {
      render(values) {
        for (const [key, value] of Object.entries(values)) {
          const node = fields.get(key);
          const text = String(value);
          if (node && node.textContent !== text) node.textContent = text;
        }
      },
    };
  }
  scope.GameHud = { createHud };
})(globalThis);
