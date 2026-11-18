/** Picks one song out of the saved library document (SQLite / D1 JSON functions). */
export const songLookupSql = `SELECT s.value AS song
  FROM studios w, json_each(w.content, '$.songs') s
  WHERE w.owner = ? AND json_extract(s.value, '$.id') = ?
  LIMIT 1`;
