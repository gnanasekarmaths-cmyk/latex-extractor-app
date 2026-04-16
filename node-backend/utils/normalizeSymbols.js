/**
 * normalizeSymbols — maps Unicode math symbols and common text
 * representations to their proper LaTeX command equivalents.
 *
 * Ported from frontend/src/utils/normalizeSymbols.js for server-side use.
 */

const SYMBOL_MAP = {
  // Greek letters (lowercase)
  "\u03b1": "\\alpha", "\u03b2": "\\beta", "\u03b3": "\\gamma",
  "\u03b4": "\\delta", "\u03b5": "\\epsilon", "\u03f5": "\\epsilon",
  "\u03b6": "\\zeta", "\u03b7": "\\eta", "\u03b8": "\\theta",
  "\u03d1": "\\vartheta", "\u03b9": "\\iota", "\u03ba": "\\kappa",
  "\u03bb": "\\lambda", "\u03bc": "\\mu", "\u03bd": "\\nu",
  "\u03be": "\\xi", "\u03c0": "\\pi", "\u03c1": "\\rho",
  "\u03f1": "\\varrho", "\u03c3": "\\sigma", "\u03c2": "\\varsigma",
  "\u03c4": "\\tau", "\u03c5": "\\upsilon", "\u03c6": "\\phi",
  "\u03d5": "\\varphi", "\u03c7": "\\chi", "\u03c8": "\\psi",
  "\u03c9": "\\omega",

  // Greek letters (uppercase)
  "\u0393": "\\Gamma", "\u0394": "\\Delta", "\u0398": "\\Theta",
  "\u039b": "\\Lambda", "\u039e": "\\Xi", "\u03a0": "\\Pi",
  "\u03a3": "\\Sigma", "\u03a5": "\\Upsilon", "\u03a6": "\\Phi",
  "\u03a8": "\\Psi", "\u03a9": "\\Omega",

  // Arrows
  "\u2192": "\\to", "\u2190": "\\leftarrow", "\u2194": "\\leftrightarrow",
  "\u21d2": "\\Rightarrow", "\u21d0": "\\Leftarrow", "\u21d4": "\\Leftrightarrow",
  "\u2191": "\\uparrow", "\u2193": "\\downarrow", "\u21d1": "\\Uparrow",
  "\u21d3": "\\Downarrow", "\u2197": "\\nearrow", "\u2198": "\\searrow",
  "\u2199": "\\swarrow", "\u2196": "\\nwarrow", "\u21a6": "\\mapsto",
  "\u27f6": "\\longrightarrow", "\u27f5": "\\longleftarrow",
  "\u27f9": "\\Longrightarrow", "\u27f8": "\\Longleftarrow",
  "\u27fa": "\\Longleftrightarrow", "\u21aa": "\\hookrightarrow",
  "\u21a9": "\\hookleftarrow",

  // Binary operators
  "\u00b1": "\\pm", "\u2213": "\\mp", "\u00d7": "\\times",
  "\u00f7": "\\div", "\u00b7": "\\cdot", "\u2217": "\\ast",
  "\u22c6": "\\star", "\u2218": "\\circ", "\u2295": "\\oplus",
  "\u2297": "\\otimes", "\u2296": "\\ominus", "\u2299": "\\odot",
  "\u2020": "\\dagger", "\u2021": "\\ddagger", "\u2227": "\\wedge",
  "\u2228": "\\vee", "\u2229": "\\cap", "\u222a": "\\cup",
  "\u2294": "\\sqcup", "\u2293": "\\sqcap",

  // Relations
  "\u2264": "\\leq", "\u2265": "\\geq", "\u226a": "\\ll",
  "\u226b": "\\gg", "\u2260": "\\neq", "\u2248": "\\approx",
  "\u2245": "\\cong", "\u2261": "\\equiv", "\u223c": "\\sim",
  "\u2243": "\\simeq", "\u221d": "\\propto", "\u227a": "\\prec",
  "\u227b": "\\succ", "\u2aaf": "\\preceq", "\u2ab0": "\\succeq",
  "\u2282": "\\subset", "\u2283": "\\supset", "\u2286": "\\subseteq",
  "\u2287": "\\supseteq", "\u2284": "\\not\\subset", "\u2285": "\\not\\supset",
  "\u2208": "\\in", "\u2209": "\\notin", "\u220b": "\\ni",
  "\u22a5": "\\perp", "\u2225": "\\parallel", "\u22a2": "\\vdash",
  "\u22a3": "\\dashv", "\u22a8": "\\models",

  // Big operators
  "\u2211": "\\sum", "\u220f": "\\prod", "\u2210": "\\coprod",
  "\u222b": "\\int", "\u222c": "\\iint", "\u222d": "\\iiint",
  "\u222e": "\\oint", "\u22c2": "\\bigcap", "\u22c3": "\\bigcup",
  "\u22c1": "\\bigvee", "\u22c0": "\\bigwedge",
  "\u2a01": "\\bigoplus", "\u2a02": "\\bigotimes",

  // Misc symbols
  "\u221e": "\\infty", "\u2202": "\\partial", "\u2207": "\\nabla",
  "\u221a": "\\sqrt", "\u2205": "\\emptyset", "\u00ac": "\\neg",
  "\u2200": "\\forall", "\u2203": "\\exists", "\u2204": "\\nexists",
  "\u2135": "\\aleph", "\u210f": "\\hbar", "\u2113": "\\ell",
  "\u2118": "\\wp", "\u211c": "\\Re", "\u2111": "\\Im",
  "\u2026": "\\ldots", "\u22ef": "\\cdots", "\u22ee": "\\vdots",
  "\u22f1": "\\ddots", "\u2032": "'", "\u2033": "''",
  "\u00b0": "^{\\circ}",

  // Delimiters
  "\u27e8": "\\langle", "\u27e9": "\\rangle",
  "\u2308": "\\lceil", "\u2309": "\\rceil",
  "\u230a": "\\lfloor", "\u230b": "\\rfloor",
  "\u2016": "\\|",

  // Special characters that need escaping in LaTeX
  "%": "\\%", "&": "\\&", "#": "\\#", "_": "\\_", "~": "\\tilde{}",

  // Superscript / subscript digits
  "\u2070": "^{0}", "\u00b9": "^{1}", "\u00b2": "^{2}",
  "\u00b3": "^{3}", "\u2074": "^{4}", "\u2075": "^{5}",
  "\u2076": "^{6}", "\u2077": "^{7}", "\u2078": "^{8}",
  "\u2079": "^{9}", "\u207b": "^{-}", "\u207a": "^{+}",
  "\u207f": "^{n}", "\u2071": "^{i}",
  "\u2080": "_{0}", "\u2081": "_{1}", "\u2082": "_{2}",
  "\u2083": "_{3}", "\u2084": "_{4}", "\u2085": "_{5}",
  "\u2086": "_{6}", "\u2087": "_{7}", "\u2088": "_{8}",
  "\u2089": "_{9}", "\u208a": "_{+}", "\u208b": "_{-}",

  // Fractions
  "\u00bd": "\\frac{1}{2}", "\u2153": "\\frac{1}{3}",
  "\u2154": "\\frac{2}{3}", "\u00bc": "\\frac{1}{4}",
  "\u00be": "\\frac{3}{4}",
};

// Build a single regex that matches any key (longest-first)
const PATTERN = new RegExp(
  Object.keys(SYMBOL_MAP)
    .sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "g",
);

/**
 * Replace Unicode math symbols in `text` with LaTeX equivalents.
 *
 * Multi-line input is preserved — each line is processed independently,
 * then joined with ` \\\\ ` (LaTeX line-break) for display-mode rendering.
 *
 * @param {string} text  Raw text from the PDF text layer.
 * @returns {string}     LaTeX-ready string.
 */
function normalizeSymbols(text) {
  if (!text) return "";

  const lines = text.split(/\r?\n/).map((line) =>
    line.replace(PATTERN, (match) => SYMBOL_MAP[match] ?? match),
  );

  const filtered = lines.filter((l) => l.trim() !== "");
  return filtered.length > 1 ? filtered.join(" \\\\ ") : filtered[0] || "";
}

module.exports = { normalizeSymbols, SYMBOL_MAP };
