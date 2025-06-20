# Wertvoll Disposition App

SaaS-App für die Wertvoll Dienstleistungen GmbH zur Digitalisierung des Umzugsgeschäfts.

## Features

- 📊 Dashboard mit Übersicht über Leads, Angebote und Rechnungen
- 👥 Kundenverwaltung (Privat- und Geschäftskunden)
- 📝 Angebotserstellung und -verwaltung
- 📅 Disposition mit Drag-&-Drop-Kalender
- 💰 Rechnungserstellung und automatisches Mahnwesen
- 👷 Mitarbeiterverwaltung mit Zeiterfassung
- 🤖 KI-Copilot für natürlichsprachige Bedienung
- 📱 Mobile-optimiert für Fahrer mit temporären Links

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: tRPC, Prisma ORM, PostgreSQL (Supabase)
- **Auth**: NextAuth.js mit Email Magic Links und OAuth
- **AI**: OpenAI API mit Function Calling
- **Deployment**: Vercel
- **Monorepo**: Turborepo, pnpm workspaces

## Setup

### Voraussetzungen

- Node.js >= 18
- pnpm 8.12.1
- PostgreSQL Datenbank (z.B. Supabase)

### Installation

1. Repository klonen:
```bash
git clone https://github.com/wertvoll/app-core.git
cd app-core
```

2. Dependencies installieren:
```bash
pnpm install
```

3. Environment Variables einrichten:
```bash
cp .env.example .env
```

Folgende Umgebungsvariablen müssen gesetzt werden:
- `DATABASE_URL`: PostgreSQL Connection String
- `NEXTAUTH_URL`: URL der App (lokal: http://localhost:3000)
- `NEXTAUTH_SECRET`: Zufälliger Secret für NextAuth
- `EMAIL_SERVER_*`: SMTP-Einstellungen für IONOS
- `OPENAI_API_KEY`: OpenAI API Key

4. Datenbank initialisieren:
```bash
pnpm db:push
pnpm db:seed
```

5. Development Server starten:
```bash
pnpm dev
```

Die App läuft nun unter http://localhost:3000

## Deployment

Die App wird automatisch über GitHub Actions zu Vercel deployed:
- `main` Branch → Production (wertvoll-dispo.vercel.app)
- `preview/*` Branches → Preview URLs

Benötigte GitHub Secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `DATABASE_URL`
- Alle anderen ENV-Variablen aus .env.example

## Architektur

```
wertvoll-app/
├── apps/
│   └── web/                 # Next.js Frontend
├── packages/
│   ├── db/                  # Prisma Schema & Client
│   ├── ui/                  # Shared UI Components
│   └── trpc/                # tRPC Router & Procedures
└── turbo.json               # Turborepo Config
```

## TODO / Offene Punkte

- [ ] Storage-Service auswählen (Firebase Storage vs. Vercel Blob)
- [ ] DSGVO-konformes Löschverfahren implementieren
- [ ] E-Mail-Templates für Angebote/Rechnungen erstellen
- [ ] PDF-Generierung für Angebote/Rechnungen
- [ ] Google Calendar Integration für Disposition
- [ ] Erweiterte KI-Funktionen (Preisberechnung, Routenoptimierung)
- [ ] Multi-Company-Support (Entrümpelung, Schadstoffsanierung)
- [ ] DATEV-Export für Buchhaltung
- [ ] Erweiterte Berechtigungsverwaltung
- [ ] Mobile App für Fahrer (React Native)

## Entwicklung

### Tests ausführen
```bash
pnpm test           # Unit Tests
pnpm test:e2e       # E2E Tests
```

### Linting & Formatting
```bash
pnpm lint
pnpm format
```

### Datenbank-Migrationen
```bash
pnpm db:migrate:dev  # Entwicklung
pnpm db:migrate      # Production
```

## Support

Bei Fragen oder Problemen:
- GitHub Issues: https://github.com/wertvoll/app-core/issues
- E-Mail: dev@wertvoll.de