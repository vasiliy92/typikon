# Typikon — Orthodox Liturgical Service Generator

An application that assembles complete Orthodox Christian liturgical service texts according to the **Typikon** (Russian Orthodox Church, RPTs MP). Designed primarily for non-Russian-speaking Orthodox communities.

## Features

- **Liturgical service assembly** following the Typikon of the Russian Orthodox Church
- **Priority services**: Divine Liturgy, Vespers, Matins, All-Night Vigil, Hours — including weekday services
- **Dual calendar support**: Gregorian (neo-Julian) and Julian
- **Temple patron saint**: 3 dedication types with proper troparia/kontakia ordering (Typikon Ch. 52)
- **Markov chapters**: ~30-40 override rules for specific date/feast coincidences
- **Paschalion**: Computed on Julian calendar using Meeus algorithm
- **Psalter kathismata**: Full schedule per Typikon Ch. 17 (20 kathismata × 3 Slavas)
- **Lectionary**: Gospel, Apostol, and OT paremia readings with zachala numbering
- **Ustav-only mode**: Rubrics without full texts
- **Multilingual**: French (primary), Church Slavonic (demo), extensible to other languages
- **Admin panel**: Full CRUD for all liturgical data + JSON import
- **Redis caching**: Assembled services cached by date/type/temple/language

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Traefik   │────▶│    Nginx    │────▶│   Frontend  │
│  (reverse   │     │  (internal  │     │  (Next.js)  │
│   proxy)    │     │   proxy)    │────▶│             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Backend   │
                    │  (FastAPI)  │
                    └──────┬──────┘
                      ┌────┴────┐
                      ▼         ▼
               ┌──────────┐ ┌───────┐
               │PostgreSQL│ │ Redis │
               └──────────┘ └───────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Reverse proxy | Traefik (external) |
| Internal proxy | Nginx |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS + SWR |
| Backend | FastAPI + SQLAlchemy 2.0 (async) + Pydantic v2 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Deployment | Docker + Jenkins CI/CD |

### Networks

- **typikon-net** (internal bridge): All services communicate internally
- **proxy** (external): Only Nginx is connected, for Traefik routing
- **No ports exposed externally** — all traffic goes through Traefik → Nginx

## Database Schema (13 Tables)

| Table | Purpose |
|-------|---------|
| `saints` | Saint records with multilingual names, lives, troparia, kontakia |
| `temples` | Temples with patron saint, dedication type, calendar mode |
| `side_chapels` | Side chapels within a temple |
| `calendar_entries` | Fixed (month/day) and movable (pascha_offset) feast entries |
| `service_templates` | Service structure definitions (Liturgy, Vespers, etc.) |
| `service_template_blocks` | Ordered blocks within a template |
| `service_blocks` | Actual liturgical text content (multilingual) |
| `special_service_content` | Override content for specific feast/template combinations |
| `lections` | Scripture readings (Gospel, Apostol, OT) |
| `lection_assignments` | Maps readings to dates/services |
| `kathisma_rules` | Psalter kathisma schedule by period/day/service |
| `markov_rules` | Typikon override rules for feast coincidences |
| `assembled_services` | Cached assembled service output |

## Quick Start

### Prerequisites

- Docker + Docker Compose
- Traefik running on the host with an external `proxy` network

### Environment Variables

Create a `.env` file in the project root:

```env
POSTGRES_DB=typikon
POSTGRES_USER=typikon
POSTGRES_PASSWORD=change-me-in-production
ADMIN_API_KEY=change-me-in-production
TRAEFIK_DOMAIN=typikon.yourdomain.com
TRAEFIK_ENTRYPOINT=web
LOG_LEVEL=info
```

### Run the Stack

```bash
# Create the external Traefik network (if not already)
docker network create proxy

# Build and start
docker compose up -d --build

# Run database migrations
docker compose exec backend alembic upgrade head

# Verify
curl http://localhost/health  # Through Traefik
```

### Run Locally (Development)

```bash
# Backend
cd backend
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## Project Structure

```
typikon/
├── docker-compose.yml          # Full stack orchestration
├── Jenkinsfile                 # CI/CD pipeline
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf              # Internal reverse proxy
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_calendar.py
│   └── app/
│       ├── config.py
│       ├── main.py
│       ├── models/
│       │   ├── base.py         # SQLAlchemy Base + TimestampMixin
│       │   ├── enums.py        # All enums + BOOK_NAMES/SERVICE_NAMES
│       │   ├── temple.py       # Temple, SideChapel
│       │   ├── saint.py        # Saint
│       │   ├── calendar.py     # CalendarEntry, KathismaRule, MarkovRule
│       │   └── liturgical.py   # ServiceBlock, Template, Lection, Assembled
│       ├── schemas/
│       │   ├── common.py       # PaginatedResponse, MessageResponse
│       │   ├── saint.py
│       │   ├── calendar.py
│       │   └── liturgical.py
│       ├── services/
│       │   ├── db.py           # Async engine + session
│       │   └── redis.py        # Redis client
│       ├── engine/
│       │   ├── calendar.py     # Paschalion + LiturgicalCalendar
│       │   └── assembler.py    # Service assembly engine
│       └── api/
│           ├── calendar.py     # Public calendar API
│           ├── service.py      # Public service assembly API
│           └── admin/
│               ├── blocks.py
│               ├── calendar.py
│               ├── saints.py
│               ├── templates.py
│               └── import.py
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── public/
    └── src/
        ├── app/
        │   ├── globals.css
        │   ├── layout.tsx
        │   ├── page.tsx
        │   └── [locale]/
        │       ├── layout.tsx
        │       ├── page.tsx
        │       └── admin/
        │           └── page.tsx
        ├── components/
        │   ├── AdminBlocks.tsx
        │   ├── AdminCalendar.tsx
        │   ├── AdminSaints.tsx
        │   ├── AdminTemplates.tsx
        │   └── AdminImport.tsx
        ├── lib/
        │   └── api.ts
        └── i18n/
            ├── config.ts
            └── messages/
                ├── fr.json
                ├── csy.json
                └── ru.json
```

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/calendar/{date}` | Liturgical day info |
| GET | `/api/v1/service/{date}` | Assembled service |
| GET | `/health` | Health check |

### Admin (requires `X-Admin-Key` header)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/v1/admin/blocks` | List/create service blocks |
| GET/PUT/DELETE | `/api/v1/admin/blocks/{id}` | CRUD single block |
| GET/POST | `/api/v1/admin/calendar` | List/create calendar entries |
| GET/PUT/DELETE | `/api/v1/admin/calendar/{id}` | CRUD single entry |
| GET/POST | `/api/v1/admin/saints` | List/create saints |
| GET/PUT/DELETE | `/api/v1/admin/saints/{id}` | CRUD single saint |
| GET/POST | `/api/v1/admin/templates` | List/create templates |
| GET/PUT/DELETE | `/api/v1/admin/templates/{id}` | CRUD single template |
| POST | `/api/v1/admin/import/{type}` | Bulk JSON import |

## Paschalion Algorithm

Uses the Meeus Julian algorithm — all computations are on the Julian calendar:

```
a = year % 4
b = year % 7
c = year % 19
d = (19*c + 15) % 30
e = (2*a + 4*b - d + 34) % 7
month = (d + e + 114) // 31
day = ((d + e + 114) % 31) + 1
```

Julian offset for 1900–2099: **+13 days** to get Gregorian date.

Tone formula: `(week_from_pascha % 8) + 1` — Pascha = Tone 1, Thomas Sunday = Tone 2.

## Liturgical Books (17)

Gospel, Apostol, Psalter, Liturgicon, Horologion, Octoechos, Menaion (Monthly/Festal/General), Triodion, Pentecostarion, Irmologion, Typikon, Euchologion, Hieraticon, Prologue, Troparion

## Temple Patron Dedication Types

| Type | Description | Troparia/Kontakia Order |
|------|-------------|------------------------|
| `lord` | Dedicated to the Lord | Patron troparion after Sunday troparion |
| `theotokos` | Dedicated to the Theotokos | Patron troparion replaces Theotokion |
| `saint` | Dedicated to a saint | Patron troparion after Theotokion |

## CI/CD Pipeline (Jenkins)

1. **Test Backend** — pytest
2. **Build Images** (parallel) — backend, frontend, nginx
3. **Push Images** — to Docker registry
4. **Deploy** — `docker compose pull && docker compose up -d`

## Data Loading

Liturgical texts are stored in PostgreSQL, NOT in git. Data is loaded through:

1. **Admin panel** — manual CRUD for all entities
2. **JSON import API** — `POST /api/v1/admin/import/{type}` with array of records
3. **ETL pipeline** — separate program (not in this repo) for bulk loading from source texts

### Orthodox Calendar Data Sources

- [azbyka.ru](https://azbyka.ru) — Complete Russian Orthodox calendar data
- [holytrinityorthodox.com](https://holytrinityorthodox.com) — OCA calendar API
- Calendar data can be parsed and loaded via the import API once the project is running

## Church Slavonic Typography

- Unicode ranges: U+2DE0-U+2DFF (combining) + U+A640-U+A69F
- Recommended fonts: Ponomar Unicode, Monomakh
- Font loaded via CSS: `font-family: 'Ponomar Unicode', 'Monomakh', var(--font-slavonic)`

## License

Proprietary — Vasilii Krasov