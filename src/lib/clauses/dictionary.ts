/**
 * Curated dictionary of Indian-law clauses and legal terms used by the
 * hover-to-clause UI. Intentionally static — no RAG dependency.
 *
 * Patterns are case-insensitive. Each entry carries enough metadata that
 * a lawyer can recognise the concept in one glance.
 */
export type ClauseCategory =
  | "Procedural"
  | "Risk"
  | "Rights"
  | "Relief"
  | "Evidence"
  | "Statute"
  | "Bail"
  | "Contract";

export type ClauseRisk = "high" | "medium" | "low" | "info";

export interface ClauseDef {
  /** Stable id (slug). */
  id: string;
  /** Canonical display name of the clause. */
  name: string;
  category: ClauseCategory;
  risk: ClauseRisk;
  /** 1–2 sentence explanation in plain English. */
  summary: string;
  /** Primary legal source (Act, Section, or landmark case). */
  source?: string;
  /** Regex or literal patterns that trigger the hover. Longest first wins. */
  patterns: RegExp[];
}

/**
 * Build a simple word-boundary regex for a literal phrase.
 * `flag` is always case-insensitive; multi-word phrases use \s+ between tokens.
 */
function phrase(literal: string): RegExp {
  const escaped = literal
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  return new RegExp(`\\b${escaped}\\b`, "i");
}

export const CLAUSE_DICTIONARY: ClauseDef[] = [
  {
    id: "default-bail",
    name: "Default Bail",
    category: "Bail",
    risk: "high",
    summary:
      "Accused becomes entitled to bail if chargesheet is not filed within 60/90 days (BNSS s.187(3), formerly CrPC s.167(2)). An indefeasible right once the window expires.",
    source: "BNSS s.187(3) / CrPC s.167(2)",
    patterns: [phrase("default bail"), phrase("statutory bail")],
  },
  {
    id: "chargesheet-deadline",
    name: "Chargesheet Deadline",
    category: "Procedural",
    risk: "high",
    summary:
      "Investigation must conclude within 60 days (offences <10 yrs) or 90 days (offences ≥10 yrs/life/death) of arrest. Missing the deadline triggers the default-bail right.",
    source: "BNSS s.187(3)",
    patterns: [phrase("chargesheet deadline"), phrase("187(3)"), phrase("167(2)")],
  },
  {
    id: "anticipatory-bail",
    name: "Anticipatory Bail",
    category: "Bail",
    risk: "medium",
    summary:
      "Pre-arrest protection under BNSS s.482 (formerly CrPC s.438). Granted by Sessions/High Court when there is reason to believe an arrest is imminent.",
    source: "BNSS s.482",
    patterns: [phrase("anticipatory bail"), phrase("pre-arrest bail"), phrase("section 482")],
  },
  {
    id: "regular-bail",
    name: "Regular Bail",
    category: "Bail",
    risk: "medium",
    summary:
      "Post-arrest bail under BNSS ss.480–483 for bailable and non-bailable offences. Court weighs gravity, flight risk, and tampering potential.",
    source: "BNSS ss.480–483",
    patterns: [phrase("regular bail"), phrase("section 437"), phrase("section 439")],
  },
  {
    id: "indemnity",
    name: "Indemnity",
    category: "Risk",
    risk: "high",
    summary:
      "Promise to compensate another party for loss or damage. One-sided or uncapped indemnities are a common contract risk.",
    source: "Indian Contract Act, 1872 — s.124",
    patterns: [phrase("indemnity"), phrase("indemnify"), phrase("hold harmless")],
  },
  {
    id: "limitation",
    name: "Limitation",
    category: "Procedural",
    risk: "high",
    summary:
      "Time window within which a suit or appeal must be filed. Missing it bars the remedy, not the right (Limitation Act, 1963).",
    source: "Limitation Act, 1963",
    patterns: [phrase("limitation period"), phrase("time-barred"), phrase("limitation act")],
  },
  {
    id: "fir",
    name: "First Information Report (FIR)",
    category: "Procedural",
    risk: "info",
    summary:
      "First report of a cognisable offence to the police, triggering investigation under BNSS s.173 (formerly CrPC s.154).",
    source: "BNSS s.173",
    patterns: [phrase("first information report"), phrase("FIR")],
  },
  {
    id: "vakalatnama",
    name: "Vakalatnama",
    category: "Procedural",
    risk: "info",
    summary:
      "Written authorisation from a client empowering an advocate to appear and act in a matter. Required before pleadings can be filed.",
    source: "Order III, CPC / Bar Council Rules",
    patterns: [phrase("vakalatnama")],
  },
  {
    id: "plaint",
    name: "Plaint",
    category: "Procedural",
    risk: "info",
    summary:
      "The written statement initiating a civil suit (Order VII CPC). Must plead cause of action, relief, and jurisdictional facts.",
    source: "Order VII, CPC",
    patterns: [phrase("plaint")],
  },
  {
    id: "written-statement",
    name: "Written Statement",
    category: "Procedural",
    risk: "medium",
    summary:
      "Defendant's reply to a plaint (Order VIII CPC). Must be filed within 30 days (extendable to 120 under the Commercial Courts Act).",
    source: "Order VIII, CPC",
    patterns: [phrase("written statement")],
  },
  {
    id: "cognisable",
    name: "Cognisable Offence",
    category: "Procedural",
    risk: "medium",
    summary:
      "Offence where police can register an FIR and arrest without a warrant. Listed in BNSS Schedule I.",
    source: "BNSS s.2(1)(g)",
    patterns: [phrase("cognisable offence"), phrase("cognizable offence")],
  },
  {
    id: "non-cognisable",
    name: "Non-cognisable Offence",
    category: "Procedural",
    risk: "low",
    summary:
      "Offence where police cannot arrest without a warrant; requires magistrate's order to investigate.",
    source: "BNSS s.2(1)(o)",
    patterns: [phrase("non-cognisable"), phrase("non-cognizable")],
  },
  {
    id: "bns",
    name: "Bharatiya Nyaya Sanhita (BNS)",
    category: "Statute",
    risk: "info",
    summary:
      "The substantive criminal code that replaced the IPC on 1 July 2024. Offences are defined here.",
    source: "BNS, 2023",
    patterns: [phrase("Bharatiya Nyaya Sanhita"), phrase("BNS 2023"), phrase("BNS")],
  },
  {
    id: "bnss",
    name: "Bharatiya Nagarik Suraksha Sanhita (BNSS)",
    category: "Statute",
    risk: "info",
    summary:
      "The procedural criminal code that replaced the CrPC on 1 July 2024. Governs investigation, arrest, bail, and trial.",
    source: "BNSS, 2023",
    patterns: [phrase("Bharatiya Nagarik Suraksha Sanhita"), phrase("BNSS 2023"), phrase("BNSS")],
  },
  {
    id: "bsa",
    name: "Bharatiya Sakshya Adhiniyam (BSA)",
    category: "Evidence",
    risk: "info",
    summary:
      "The law of evidence that replaced the Indian Evidence Act, 1872 on 1 July 2024.",
    source: "BSA, 2023",
    patterns: [phrase("Bharatiya Sakshya Adhiniyam"), phrase("BSA 2023"), phrase("BSA")],
  },
  {
    id: "ipc",
    name: "Indian Penal Code (IPC)",
    category: "Statute",
    risk: "info",
    summary:
      "Pre-BNS criminal code, in force until 1 July 2024. Still governs offences committed before that date.",
    source: "IPC, 1860",
    patterns: [phrase("Indian Penal Code"), phrase("IPC")],
  },
  {
    id: "crpc",
    name: "Code of Criminal Procedure (CrPC)",
    category: "Statute",
    risk: "info",
    summary:
      "Pre-BNSS procedural code. Replaced by BNSS from 1 July 2024; still relevant for legacy matters.",
    source: "CrPC, 1973",
    patterns: [phrase("Code of Criminal Procedure"), phrase("CrPC")],
  },
  {
    id: "cpc",
    name: "Code of Civil Procedure (CPC)",
    category: "Statute",
    risk: "info",
    summary:
      "Procedural framework governing civil suits, pleadings, execution, and appeals.",
    source: "CPC, 1908",
    patterns: [phrase("Code of Civil Procedure"), phrase("CPC")],
  },
  {
    id: "article-21",
    name: "Article 21 — Right to Life",
    category: "Rights",
    risk: "high",
    summary:
      "Protection of life and personal liberty; includes due process, speedy trial, and dignity (Maneka Gandhi v. Union of India, 1978).",
    source: "Constitution of India, Art. 21",
    patterns: [phrase("Article 21"), phrase("right to life"), phrase("personal liberty")],
  },
  {
    id: "pocso",
    name: "POCSO Act",
    category: "Statute",
    risk: "high",
    summary:
      "Protection of Children from Sexual Offences Act — special law governing offences against minors. Trial is fast-tracked.",
    source: "POCSO Act, 2012",
    patterns: [phrase("POCSO")],
  },
  {
    id: "arnesh-kumar",
    name: "Arnesh Kumar Guidelines",
    category: "Procedural",
    risk: "high",
    summary:
      "For offences punishable with ≤7 years, police must issue notice under BNSS s.35 (CrPC s.41A) and justify arrest — not arrest mechanically (Arnesh Kumar v. State of Bihar, 2014).",
    source: "Arnesh Kumar v. State of Bihar (2014)",
    patterns: [phrase("Arnesh Kumar"), phrase("Section 41A"), phrase("section 35")],
  },
  {
    id: "satender-antil",
    name: "Satender Kumar Antil Guidelines",
    category: "Bail",
    risk: "medium",
    summary:
      "Restated bail principles: arrest must be necessary, not routine; courts should grant bail liberally where investigation is complete (Satender Kumar Antil v. CBI, 2022).",
    source: "Satender Kumar Antil v. CBI (2022)",
    patterns: [phrase("Satender Kumar Antil"), phrase("Satender Antil")],
  },
  {
    id: "specific-performance",
    name: "Specific Performance",
    category: "Relief",
    risk: "medium",
    summary:
      "Equitable relief compelling a party to perform a contract when damages are inadequate (Specific Relief Act, 1963).",
    source: "Specific Relief Act, 1963",
    patterns: [phrase("specific performance")],
  },
  {
    id: "injunction",
    name: "Injunction",
    category: "Relief",
    risk: "medium",
    summary:
      "Court order restraining or compelling an act. Temporary under Order XXXIX CPC; permanent under the Specific Relief Act.",
    source: "Order XXXIX CPC",
    patterns: [phrase("temporary injunction"), phrase("permanent injunction"), phrase("injunction")],
  },
  {
    id: "force-majeure",
    name: "Force Majeure",
    category: "Contract",
    risk: "medium",
    summary:
      "Clause excusing performance when an extraordinary event (war, pandemic, act of state) beyond either party's control prevents it.",
    patterns: [phrase("force majeure")],
  },
  {
    id: "arbitration",
    name: "Arbitration Clause",
    category: "Contract",
    risk: "low",
    summary:
      "Agreement to refer disputes to arbitration rather than courts (Arbitration and Conciliation Act, 1996).",
    source: "Arbitration and Conciliation Act, 1996",
    patterns: [phrase("arbitration clause"), phrase("arbitration agreement"), phrase("arbitration")],
  },
  {
    id: "jurisdiction",
    name: "Jurisdiction",
    category: "Procedural",
    risk: "medium",
    summary:
      "Court's legal authority over a matter — territorial, pecuniary, or subject-matter. Defect in jurisdiction vitiates the proceeding.",
    patterns: [phrase("jurisdiction")],
  },
  {
    id: "prima-facie",
    name: "Prima Facie",
    category: "Evidence",
    risk: "info",
    summary:
      "Evidence sufficient on its face to establish a fact unless rebutted. Standard for framing charges, interim orders, etc.",
    patterns: [phrase("prima facie")],
  },
  {
    id: "mens-rea",
    name: "Mens Rea",
    category: "Evidence",
    risk: "info",
    summary:
      "Guilty mind — the mental element required for most criminal offences (intention, knowledge, recklessness).",
    patterns: [phrase("mens rea")],
  },
  {
    id: "bailable",
    name: "Bailable Offence",
    category: "Bail",
    risk: "low",
    summary:
      "Offence where bail is a matter of right. Police/court must release on furnishing bail (BNSS s.478).",
    source: "BNSS s.478",
    patterns: [phrase("bailable offence")],
  },
  {
    id: "non-bailable",
    name: "Non-bailable Offence",
    category: "Bail",
    risk: "high",
    summary:
      "Offence where bail is discretionary. Court weighs merits, prior record, and flight risk before granting.",
    source: "BNSS s.480",
    patterns: [phrase("non-bailable"), phrase("non bailable")],
  },
];

/**
 * Fast lookup of a clause by id.
 */
export function getClauseById(id: string): ClauseDef | undefined {
  return CLAUSE_DICTIONARY.find((c) => c.id === id);
}
