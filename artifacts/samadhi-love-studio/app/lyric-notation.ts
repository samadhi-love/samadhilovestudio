export type LyricDirection = { text: string; delimiter: string; start: number; end: number; line: number };
/** All balanced [], () and {} blocks are instructions. Malformed notation is reported, not silently discarded. */
export function parseLyricNotation(source: string) {
  const matching: Record<string,string> = { "[": "]", "(": ")", "{": "}" };
  const closers = new Set(Object.values(matching));
  const directions: LyricDirection[] = [], errors: string[] = [], performed: string[] = [];
  let last = 0, line = 0;
  for (let i = 0; i < source.length; i++) {
    const opening = source[i];
    if (matching[opening]) {
      performed.push(source.slice(last,i)); const first = i, firstLine = line, stack = [matching[opening]];
      for (i++; i < source.length && stack.length; i++) {
        const character = source[i]; if (character === "\n") line++;
        if (matching[character]) stack.push(matching[character]);
        else if (closers.has(character)) {
          if (character !== stack.at(-1)) { errors.push(`Mismatched lyric direction on line ${line+1}. Match each bracket or parenthesis before creating.`); break; }
          stack.pop();
        }
      }
      if (stack.length) {
        if (i >= source.length) errors.push(`An instruction on line ${firstLine+1} is not closed. Add ${stack.at(-1)} before creating.`);
        // Keep the original available to the editor. Generation rejects this incomplete notation.
        performed.push("\n".repeat(source.slice(first).match(/\n/g)?.length ?? 0)); last = source.length; break;
      }
      const end = i;
      directions.push({ text: source.slice(first+1,end-1).trim(), delimiter: opening, start:first, end, line:firstLine });
      const newlines = source.slice(first,end).match(/\n/g)?.length ?? 0;
      performed.push(newlines ? "\n".repeat(newlines) : " "); last = end; i--;
    } else if (closers.has(opening)) errors.push(`An unmatched ${opening} appears on line ${line+1}. Check the production notation.`);
    else if (opening === "\n") line++;
  }
  performed.push(source.slice(last));
  return { text: performed.join(""), directions, errors: [...new Set(errors)] };
}
export function performanceLines(source: string) {
  return parseLyricNotation(source).text.split(/\r?\n/).map(line => line.replace(/[\t ]+/g," ").trim()).filter(Boolean);
}
/** Recognize section control labels, never arbitrary bracketed prose as a section title. */
export function productionHeader(line: string, names: readonly string[] = []) {
  const match = /^\s*\[([^\]\r\n]+)\]\s*$/.exec(line); if (!match) return;
  const parts = /^(.*?)\s*\|\s*(?:genre|style|fusion)\s*:\s*(.*)$/i.exec(match[1]);
  if (parts) return { heading:`[${parts[1].trim()}]`, name:parts[1].trim(), genre:parts[2].trim(), direction:undefined as string|undefined };
  const name = match[1].trim();
  if (names.some(n=>n.trim().toLowerCase()===name.toLowerCase())) return {heading:`[${name}]`,name,genre:undefined as string|undefined,direction:undefined as string|undefined};
  const section = /^(?:(short|long|soft)\s+)?((?:(?:final|last|opening|repeated)\s+)?(?:(?:instrumental\s+)?(?:intro|outro|interlude|break|solo)|verse(?:\s+\d+)?|(?:pre[ -]?|post[ -]?)?chorus(?:\s+\d+)?|bridge(?:\s+\d+)?|drop|finale|build|breakdown|hook|refrain|instrumental|spoken(?:\s+(?:intro|outro|verse))?|section\s+[\p{L}\p{N}]+))(?:\s*:\s*(.+))?$/iu.exec(name);
  if (!section) return;
  const label = section[2].replace(/^./,c=>c.toUpperCase());
  return { heading:`[${label}]`, name:label, genre:undefined as string|undefined, direction:section[1]||section[3] ? name : undefined };
}
export function notationStyles(directions: readonly string[]) {
  const notes = [...new Set(directions.map(s=>s.replace(/\s+/g," ").trim()).filter(Boolean))];
  return notes.length ? [`Production instructions only; never sing or read these directions: ${notes.join("; ")}`] : [];
}
