# WebScraperIQ — Web Data Extraction and Intelligence Workspace

WebScraperIQ is a web application for collecting information from web pages, cleaning and exploring extracted records, and organizing product, job, and news data.

## Implemented application areas

- Scraper Studio for configuring and running extraction jobs
- Product, job, news, and custom extraction data types
- Data cleaning workflows and CSV import/export
- SQL/database exploration view
- Python sandbox and generated extraction scripts
- Price-history visualizations and anomaly analysis
- Alert management and export previews

Review the code and test the workflows before describing any capability as production-ready.

## Technology

- React and TypeScript
- Vite
- Express and TypeScript
- SQLite using Node's `node:sqlite`
- Cheerio for HTML parsing
- Google GenAI SDK for optional AI-assisted generation
- Recharts, Tailwind CSS, Lucide icons and Motion UI

## Run locally

1. Install Node.js 22 or a compatible newer release.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env`.
4. Add your own `GEMINI_API_KEY` if you want AI-assisted generation.
5. Run `npm run dev`.

The server creates a fresh `data/webscrapeiq.db` SQLite database and its tables at startup. The original database file is intentionally not included in this public copy.

## Security and demo limitations

- Never commit `.env`, API keys, real user records, or database files containing private data.
- The login/session flow in this project is a demonstration implementation, not production authentication. Replace it with a properly secured authentication provider and session validation before any public deployment or use with real user data.
- Demo account names and email addresses in this public copy use reserved example addresses.
- Scrape only websites where you have permission and comply with their terms, robots.txt guidance, rate limits, and applicable law.

## Project status

This is a portfolio code copy. Extraction coverage, throughput, and reliability should be reported only from reproducible tests using documented pages and test conditions.

## License

No license is provided. Contact the repository owner before reusing this code.
