class PuzzleLibrary {
  constructor() {
    this.manifest = null;
    this.cache = new Map();
    this.controller = new AbortController();
  }
  close() {
    this.controller.abort();
    this.cache.clear();
  }
  async open() {
    const response = await fetch("excel/manifest.json", {cache:"no-store",signal:AbortSignal.any([this.controller.signal,AbortSignal.timeout(30000)])});
    if (!response.ok) throw new Error("Puzzle library unavailable (" + response.status + "). Please try again.");
    const manifest = await response.json();
    if (manifest.version !== 1 || !Number.isInteger(manifest.total) || manifest.total < 1 ||
        !Array.isArray(manifest.sources) || !manifest.sources.length ||
        !manifest.sources.every(source=>typeof source.name==="string") ||
        !Array.isArray(manifest.chunks) || !manifest.chunks.length ||
        !manifest.chunks.every(chunk => /^[a-f0-9]{16}\/\d{4}-\d+\.json$/.test(chunk.file) &&
          Number.isInteger(chunk.count) && chunk.count > 0 && chunk.count <= 128 &&
          Number.isInteger(chunk.min) && Number.isInteger(chunk.max) && chunk.min>=0 && chunk.max<=4000 && chunk.min <= chunk.max) ||
        manifest.chunks.reduce((sum,chunk)=>sum+chunk.count,0)!==manifest.total) {
      throw new Error("The puzzle index is invalid. Rebuild the CSV library.");
    }
    this.manifest = manifest;
    return manifest;
  }
  async read(chunk) {
    if (this.cache.has(chunk.file)) return this.cache.get(chunk.file);
    const response = await fetch("excel/library/" + chunk.file, {signal:AbortSignal.any([this.controller.signal,AbortSignal.timeout(30000)])});
    if (!response.ok) throw new Error("Could not load a puzzle batch (" + response.status + ").");
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length !== chunk.count || !rows.every(row =>
      Array.isArray(row) && row.length === 6 && /^[A-Za-z0-9]{5,10}$/.test(row[0]) &&
      typeof row[1] === "string" && typeof row[2] === "string" &&
      Number.isInteger(row[3]) && row[3]>=chunk.min && row[3]<=chunk.max &&
      typeof row[4] === "string" && (row[5]===0||row[5]===1))) {
      throw new Error("Invalid puzzle batch. Rebuild the CSV library.");
    }
    this.cache.set(chunk.file, rows);
    if (this.cache.size > 8) this.cache.delete(this.cache.keys().next().value);
    return rows;
  }
  async choose(min, max, excluded = new Set()) {
    const chunks = this.manifest.chunks.filter(chunk => chunk.max >= min && chunk.min <= max);
    if (!chunks.length) return null;
    const remaining = [...chunks];
    while (remaining.length) {
      const weight = remaining.reduce((sum, chunk) => sum + chunk.count, 0);
      let pick = Math.random() * weight, index = 0;
      while (index < remaining.length - 1 && (pick -= remaining[index].count) >= 0) index++;
      const [chunk] = remaining.splice(index, 1);
      const rows = (await this.read(chunk)).filter(row => row[3] >= min && row[3] <= max && !excluded.has(row[0]));
      if (rows.length) {
        const row = rows[Math.floor(Math.random() * rows.length)];
        return {id:row[0],fen:row[1],moves:row[2].split(" "),rating:row[3],theme:row[4],setup:!!row[5],practice:true};
      }
    }
    return null;
  }
  async next(rating, direction, excluded) {
    const ranges = direction > 0 ? [[rating+25,rating+150],[rating+1,Math.min(4000,rating+400)]] :
      direction < 0 ? [[rating-150,rating-25],[Math.max(0,rating-400),rating-1]] :
      [[rating-100,rating+100],[rating-300,rating+300]];
    for (const [min,max] of ranges) {
      const puzzle = await this.choose(Math.max(0,min),Math.min(4000,max),excluded);
      if (puzzle) return puzzle;
    }
    // A library boundary must be visible to the player, not silently treated as a difficulty change.
    const distance = chunk => rating < chunk.min ? chunk.min-rating : rating > chunk.max ? rating-chunk.max : 0;
    const closest = [...this.manifest.chunks].sort((a,b) => distance(a)-distance(b));
    for (const chunk of closest) {
      const rows = (await this.read(chunk)).filter(row => !excluded.has(row[0]));
      if (!rows.length) continue;
      rows.sort((a,b) => Math.abs(a[3]-rating)-Math.abs(b[3]-rating));
      const row = rows[0];
      return {id:row[0],fen:row[1],moves:row[2].split(" "),rating:row[3],theme:row[4],setup:!!row[5],practice:true,boundary:true};
    }
    throw new Error("You have played every puzzle in this library. Add more CSV files or start a new session.");
  }
}
