/**
 * normalizeSymbols — maps Unicode math symbols and common text
 * representations to their proper LaTeX command equivalents.
 *
 * Use this to convert raw text-layer selections (which contain
 * Unicode glyphs like →, ∑, ∞) into valid LaTeX source.
 */

// ── Symbol → LaTeX mapping table ────────────────────────────────
const SYMBOL_MAP = {
  // Greek letters (lowercase)
  "α": "\\alpha",
  "β": "\\beta",
  "γ": "\\gamma",
  "δ": "\\delta",
  "ε": "\\epsilon",
  "ϵ": "\\epsilon",
  "ζ": "\\zeta",
  "η": "\\eta",
  "θ": "\\theta",
  "ϑ": "\\vartheta",
  "ι": "\\iota",
  "κ": "\\kappa",
  "λ": "\\lambda",
  "μ": "\\mu",
  "ν": "\\nu",
  "ξ": "\\xi",
  "π": "\\pi",
  "ρ": "\\rho",
  "ϱ": "\\varrho",
  "σ": "\\sigma",
  "ς": "\\varsigma",
  "τ": "\\tau",
  "υ": "\\upsilon",
  "φ": "\\phi",
  "ϕ": "\\varphi",
  "χ": "\\chi",
  "ψ": "\\psi",
  "ω": "\\omega",

  // Greek letters (uppercase)
  "Γ": "\\Gamma",
  "Δ": "\\Delta",
  "Θ": "\\Theta",
  "Λ": "\\Lambda",
  "Ξ": "\\Xi",
  "Π": "\\Pi",
  "Σ": "\\Sigma",
  "Υ": "\\Upsilon",
  "Φ": "\\Phi",
  "Ψ": "\\Psi",
  "Ω": "\\Omega",

  // Arrows
  "→": "\\to",
  "←": "\\leftarrow",
  "↔": "\\leftrightarrow",
  "⇒": "\\Rightarrow",
  "⇐": "\\Leftarrow",
  "⇔": "\\Leftrightarrow",
  "↑": "\\uparrow",
  "↓": "\\downarrow",
  "⇑": "\\Uparrow",
  "⇓": "\\Downarrow",
  "↗": "\\nearrow",
  "↘": "\\searrow",
  "↙": "\\swarrow",
  "↖": "\\nwarrow",
  "↦": "\\mapsto",
  "⟶": "\\longrightarrow",
  "⟵": "\\longleftarrow",
  "⟹": "\\Longrightarrow",
  "⟸": "\\Longleftarrow",
  "⟺": "\\Longleftrightarrow",
  "↪": "\\hookrightarrow",
  "↩": "\\hookleftarrow",

  // Binary operators
  "±": "\\pm",
  "∓": "\\mp",
  "×": "\\times",
  "÷": "\\div",
  "·": "\\cdot",
  "∗": "\\ast",
  "⋆": "\\star",
  "∘": "\\circ",
  "⊕": "\\oplus",
  "⊗": "\\otimes",
  "⊖": "\\ominus",
  "⊙": "\\odot",
  "†": "\\dagger",
  "‡": "\\ddagger",
  "∧": "\\wedge",
  "∨": "\\vee",
  "∩": "\\cap",
  "∪": "\\cup",
  "⊔": "\\sqcup",
  "⊓": "\\sqcap",

  // Relations
  "≤": "\\leq",
  "≥": "\\geq",
  "≪": "\\ll",
  "≫": "\\gg",
  "≠": "\\neq",
  "≈": "\\approx",
  "≅": "\\cong",
  "≡": "\\equiv",
  "∼": "\\sim",
  "≃": "\\simeq",
  "∝": "\\propto",
  "≺": "\\prec",
  "≻": "\\succ",
  "⪯": "\\preceq",
  "⪰": "\\succeq",
  "⊂": "\\subset",
  "⊃": "\\supset",
  "⊆": "\\subseteq",
  "⊇": "\\supseteq",
  "⊄": "\\not\\subset",
  "⊅": "\\not\\supset",
  "∈": "\\in",
  "∉": "\\notin",
  "∋": "\\ni",
  "⊥": "\\perp",
  "∥": "\\parallel",
  "⊢": "\\vdash",
  "⊣": "\\dashv",
  "⊨": "\\models",

  // Big operators / Summation-style
  "∑": "\\sum",
  "∏": "\\prod",
  "∐": "\\coprod",
  "∫": "\\int",
  "∬": "\\iint",
  "∭": "\\iiint",
  "∮": "\\oint",
  "⋂": "\\bigcap",
  "⋃": "\\bigcup",
  "⋁": "\\bigvee",
  "⋀": "\\bigwedge",
  "⨁": "\\bigoplus",
  "⨂": "\\bigotimes",

  // Misc symbols
  "∞": "\\infty",
  "∂": "\\partial",
  "∇": "\\nabla",
  "√": "\\sqrt",
  "∅": "\\emptyset",
  "¬": "\\neg",
  "∀": "\\forall",
  "∃": "\\exists",
  "∄": "\\nexists",
  "ℵ": "\\aleph",
  "ℏ": "\\hbar",
  "ℓ": "\\ell",
  "℘": "\\wp",
  "ℜ": "\\Re",
  "ℑ": "\\Im",
  "…": "\\ldots",
  "⋯": "\\cdots",
  "⋮": "\\vdots",
  "⋱": "\\ddots",
  "′": "'",
  "″": "''",
  "°": "^{\\circ}",

  // Delimiters
  "⟨": "\\langle",
  "⟩": "\\rangle",
  "⌈": "\\lceil",
  "⌉": "\\rceil",
  "⌊": "\\lfloor",
  "⌋": "\\rfloor",
  "‖": "\\|",

  // Special characters that need escaping in LaTeX
  "%": "\\%",
  "&": "\\&",
  "#": "\\#",
  "_": "\\_",
  "~": "\\tilde{}",

  // Superscript / subscript digits (common in PDF text layers)
  "⁰": "^{0}",
  "¹": "^{1}",
  "²": "^{2}",
  "³": "^{3}",
  "⁴": "^{4}",
  "⁵": "^{5}",
  "⁶": "^{6}",
  "⁷": "^{7}",
  "⁸": "^{8}",
  "⁹": "^{9}",
  "⁻": "^{-}",
  "⁺": "^{+}",
  "ⁿ": "^{n}",
  "ⁱ": "^{i}",
  "₀": "_{0}",
  "₁": "_{1}",
  "₂": "_{2}",
  "₃": "_{3}",
  "₄": "_{4}",
  "₅": "_{5}",
  "₆": "_{6}",
  "₇": "_{7}",
  "₈": "_{8}",
  "₉": "_{9}",
  "₊": "_{+}",
  "₋": "_{-}",

  // Fractions
  "½": "\\frac{1}{2}",
  "⅓": "\\frac{1}{3}",
  "⅔": "\\frac{2}{3}",
  "¼": "\\frac{1}{4}",
  "¾": "\\frac{3}{4}",
};

// Build a single regex that matches any key (longest-first to avoid partial matches)
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
export function normalizeSymbols(text) {
  if (!text) return "";

  const lines = text.split(/\r?\n/).map((line) =>
    line.replace(PATTERN, (match) => SYMBOL_MAP[match] ?? match),
  );

  // Collapse blank lines, join with LaTeX line-break
  const filtered = lines.filter((l) => l.trim() !== "");
  return filtered.length > 1 ? filtered.join(" \\\\ ") : filtered[0] || "";
}

export default normalizeSymbols;
