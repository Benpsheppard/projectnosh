// Turns an ingredient name into a key used for merging, e.g. "Carrots " -> "carrot".
// Only the LAST word is made singular and no words are ever dropped, so different
// products ("chopped tomatoes" vs "cherry tomatoes" vs "tomatoes") never merge by accident.

// Words that end in "s" but are already singular.
const NOT_PLURAL = new Set(['molasses', 'swiss'])

function singular(word) {
  if (NOT_PLURAL.has(word)) return word
  if (word.length > 3 && word.endsWith('ies')) return word.slice(0, -3) + 'y' // berries -> berry
  if (word.endsWith('oes')) return word.slice(0, -2) // tomatoes -> tomato
  if (/(ch|sh|x|ss)es$/.test(word)) return word.slice(0, -2) // sandwiches -> sandwich
  if (word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1) // carrots -> carrot
  return word
}

function normaliseName(name) {
  const words = name.toLowerCase().trim().split(/\s+/)
  words[words.length - 1] = singular(words[words.length - 1])
  return words.join(' ')
}

module.exports = { normaliseName }
