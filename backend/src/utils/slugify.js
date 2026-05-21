const slugifyLib = require('slugify');

const createSlug = (text) => slugifyLib(text, {
  lower:  true,
  strict: true,
  trim:   true,
});

module.exports = { createSlug };
