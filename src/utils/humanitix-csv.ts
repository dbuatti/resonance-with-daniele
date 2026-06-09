import { parse, isValid } from "date-fns";

export const parseCurrency = (val: string): number => {
  if (!val) return 0;
  return parseFloat(val.replace(/[$,]/g, ""));
};

export const parseHumanitixDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  const cleanStr = dateStr.trim().replace(/^"|"$/g, "").toLowerCase();
  const formats = [
    "dd/MM/yyyy h:mm a",
    "d/MM/yyyy h:mm a",
    "dd/MM/yyyy hh:mm a",
    "d/M/yyyy hh:mm a",
    "dd/MM/yyyy HH:mm",
    "d/M/yyyy HH:mm",
    "yyyy-MM-dd HH:mm:ss",
    "MM/dd/yyyy h:mm a",
    "dd/MM/yyyy",
    "d/M/yyyy",
  ];
  for (const fmt of formats) {
    try {
      const parsed = parse(cleanStr, fmt, new Date());
      if (isValid(parsed)) return parsed.toISOString();
    } catch {
      continue;
    }
  }
  const fallback = new Date(cleanStr);
  return isValid(fallback) ? fallback.toISOString() : null;
};

export const splitLine = (line: string, delimiter: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else current += char;
  }
  result.push(current.trim());
  return result;
};

