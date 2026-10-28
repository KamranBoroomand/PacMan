const { test: base, expect } = require("@playwright/test");

const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await use(page);
    expect(errors, "Uncaught browser errors").toEqual([]);
  },
});
module.exports = { test, expect };
