# Lawris

**Lawris** is an AI-native case-management agent built specifically for Indian advocates. It collapses four traditionally broken and disconnected workflows into one unified interface:

1. **Case Management:** Manage clients, cases, documents, and hearings seamlessly.
2. **Statutory Deadline Intelligence:** Auto-computes complex deadlines (like the BNSS s.187(3) chargesheet rule, Limitation Act periods, and hearing schedules) directly from raw FIR data.
3. **AI Document Drafting:** Generates court-ready bail applications and plaints in under 30 seconds, using live case context and strict Indian-court formatting.
4. **Case-Grounded Legal Research:** Answers legal questions grounded in your specific case's facts, providing structured citations from a curated Indian legal corpus.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5
- **Database & Auth:** Supabase (PostgreSQL + Auth)
- **AI Integration:** Google Gemini 2.5 Flash / Flash-Lite via `@google/genai`
- **Styling:** Tailwind CSS + Lucide React

## Key Features

- **Deadline Brain:** Automatically highlights critical (≤3 days) and high-priority (≤7 days) deadlines on your dashboard and calendar.
- **AI Streaming:** Tokens stream live from Gemini into your editor pane in real-time, allowing you to watch your bail applications and plaints being drafted.
- **Per-Case RAG & Hybrid Retrieval:** Upload PDFs directly to a case. When doing legal research, Lawris retrieves context from your specific documents *and* a curated shared corpus of Indian statutes and judgments using a stratified semantic + keyword-boosted approach.
- **Hearing Auto-Summaries:** After every hearing log, Lawris regenerates a 4-8 sentence prose case brief to keep your files up to date without manual typing.

## Getting Started

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com/) project
- A Google [Gemini AI API Key](https://aistudio.google.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ameya-87/lawris.git
   cd lawris
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL_DRAFT=gemini-2.5-flash
   GEMINI_MODEL_RESEARCH=gemini-2.5-flash-lite
   GEMINI_MODEL_SUMMARISE=gemini-2.5-flash-lite
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Initialize Database:**
   - Execute `scripts/migrate.sql` in your Supabase SQL Editor to set up the schema.
   - (Optional) Run `scripts/seed.sql` to populate demo data (including the `LAWYER_ID` for testing).

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Roadmap & Future Scope

- **Multi-user authentication & Firm Hierarchy** (via Supabase Auth + RLS)
- **OCR Support** for scanned documents
- **IndianKanoon API Integration** for verifiable external citations
- **DOCX / PDF Export** capabilities for AI-drafted documents
- **Mobile App & Vernacular UI** (Hindi & Marathi)
