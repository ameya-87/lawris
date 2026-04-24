const STATUTE_URLS: Record<string, string> = {
  "Bharatiya Nagarik Suraksha Sanhita 2023": "https://www.indiacode.nic.in/handle/123456789/20098",
  "Bharatiya Nyaya Sanhita 2023": "https://www.indiacode.nic.in/handle/123456789/20062",
  "Bharatiya Sakshya Adhiniyam 2023": "https://www.indiacode.nic.in/handle/123456789/20063",
  "Code of Civil Procedure 1908": "https://www.indiacode.nic.in/handle/123456789/2191",
  "POCSO Act 2012": "https://www.indiacode.nic.in/handle/123456789/2079",
  "Protection of Human Rights Act 1993": "https://www.indiacode.nic.in/handle/123456789/1650",
};

const JUDGMENT_URLS: Record<string, string> = {
  "Satender Kumar Antil v. CBI (2022)": "https://indiankanoon.org/doc/45469725/",
  "Arnesh Kumar v. State of Bihar (2014)": "https://indiankanoon.org/doc/2982624/",
  "Maneka Gandhi v. Union of India (1978)": "https://indiankanoon.org/doc/1766147/",
  "Hans Kumar v. State of NCT Delhi (2023)": "https://indiankanoon.org/",
  "Rahul Pathak v. State of Punjab": "https://indiankanoon.org/",
  "A.S. Templeton v. Govt of NCT Delhi (2011)": "https://indiankanoon.org/",
  "Mahender Bansal v. Rajinder Kaur (2024)": "https://indiankanoon.org/",
  "Sushma Trivedi v. Union of India": "https://indiankanoon.org/",
};

export function getSourceUrl(sourceName: string, sourceType: "law" | "doc"): string | null {
  if (sourceType !== "law") return null;

  // Exact match first
  const exact = STATUTE_URLS[sourceName] ?? JUDGMENT_URLS[sourceName];
  if (exact) return exact;

  // Fuzzy: case-insensitive token-based match
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);
  const queryTokens = normalize(sourceName);
  if (queryTokens.length === 0) return null;

  const allMaps = { ...STATUTE_URLS, ...JUDGMENT_URLS };
  for (const [key, url] of Object.entries(allMaps)) {
    const keyTokens = normalize(key);
    const allMatch = queryTokens.every((qt) =>
      keyTokens.some((kt) => kt.includes(qt) || qt.includes(kt)),
    );
    if (allMatch) return url;
  }

  return null;
}

export function getSourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "source";
  }
}
