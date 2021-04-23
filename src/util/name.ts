import punycode from "punycode";

export const toUnicode = (name: string): string => {
  try {
    return punycode.toUnicode(name);
  } catch(e) {}

  return name;
};

export const toASCII = (name: string): string => {
  try {
    return punycode.toASCII(name);
  } catch(e) {}

  return name;
};

export const formatName = (name: string) => {
  if (!name)
    return name;

  try {
    const unicode = punycode.toUnicode(name);
    if (unicode !== name) {
      return `${name}/ (${unicode})`;
    }
  } catch(e) {}

  return `${name}/`;
};
