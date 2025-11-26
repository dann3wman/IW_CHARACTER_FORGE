
export class MarkovNameGenerator {
  private chain: Map<string, string[]> = new Map();
  private order: number;
  private starts: string[] = [];
  private seeds: Set<string>;

  constructor(names: string[], order: number = 2) {
    this.order = order;
    this.seeds = new Set(names.map(n => n.toLowerCase().trim()));
    this.train(names);
  }

  private train(names: string[]) {
    this.chain.clear();
    this.starts = [];

    names.forEach(name => {
      const processedName = name.trim();
      if (processedName.length < this.order) return;

      this.starts.push(processedName.substring(0, this.order));

      for (let i = 0; i <= processedName.length - this.order; i++) {
        const key = processedName.substring(i, i + this.order);
        const nextChar = i + this.order < processedName.length ? processedName[i + this.order] : null; // null represents end

        if (!this.chain.has(key)) {
          this.chain.set(key, []);
        }
        
        if (nextChar) {
          this.chain.get(key)!.push(nextChar);
        } else {
          this.chain.get(key)!.push('END');
        }
      }
    });
  }

  public generate(minLength: number = 4, maxLength: number = 12): string {
    if (this.starts.length === 0) return "Unknown";

    let bestName = "Unknown";
    let attempts = 0;

    // Try multiple times to satisfy constraints
    while (attempts < 50) {
        let current = this.starts[Math.floor(Math.random() * this.starts.length)];
        let result = current;
        let charCount = 0;

        while (result.length < maxLength + 5 && charCount < 50) {
            const key = result.substring(result.length - this.order);
            const possibilities = this.chain.get(key);

            if (!possibilities || possibilities.length === 0) break;

            const next = possibilities[Math.floor(Math.random() * possibilities.length)];
            if (next === 'END') break;

            result += next;
            charCount++;
        }

        // Constraints check
        if (result.length >= minLength && result.length <= maxLength) {
            // Prefer names that aren't exact copies of seeds, but accept if we can't find others
            if (!this.seeds.has(result.toLowerCase())) {
                return this.capitalize(result);
            }
            bestName = result; // Fallback
        }
        attempts++;
    }

    return this.capitalize(bestName);
  }

  private capitalize(str: string): string {
      return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
