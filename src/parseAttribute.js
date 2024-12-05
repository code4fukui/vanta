export const parseAttribute = (s) => {
  if (s == "false") return false;
  if (s == "true") return true;
  return s;
}

export const parseAttributes = (el, params) => {
  const opt = { el };
  for (const name of params) {
    const v = el.getAttribute(name);
    if (v) {
      opt[name] = parseAttribute(v);
    }
  }
  return el;
};
