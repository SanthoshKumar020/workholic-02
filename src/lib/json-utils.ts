export function sanitizeJson(json: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    const code = json.charCodeAt(i);
    if (escaped) { out += ch; escaped = false; continue; }
    if (ch === "\\" && inString) { out += ch; escaped = true; continue; }
    if (ch === '"') { inString = !inString; out += ch; continue; }
    if (inString && code < 0x20) {
      if (code === 0x0a) out += "\\n";
      else if (code === 0x0d) out += "\\r";
      else if (code === 0x09) out += "\\t";
      else out += " ";
      continue;
    }
    out += ch;
  }
  return out;
}
