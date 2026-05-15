# Typikon

Orthodox Christian Liturgical Service Generator

Assembles complete service texts according to the Typikon (Russian Orthodox Church, RPTs MP).

## Status

Project scaffold — backend API, engine, and infrastructure are in place. Frontend and nginx are coming next.

## Architecture

- **Backend**: FastAPI + async SQLAlchemy + Redis
- **Frontend**: Next.js 14+ (App Router)
- **Reverse Proxy**: Nginx
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **CI/CD**: Jenkins + Docker
- **Reverse Proxy**: Traefik

## Quick Start

```bash
cp .env.example .env
# Edit .env with your settings
docker compose up -d
```

API docs available at: `http://localhost/api/docs`

## Services

- **Liturgy** (Divine Liturgy of St. John Chrysostom / St. Basil)
- **Vespers** (Great and Small)
- **Matins** (with kathismata scheduling)
- **All-Night Vigil** (Vespers + Matins)
- **Hours** (1st, 3rd, 6th, 9th)

## Calendars

Both Gregorian (neo-Julian) and Julian calendars are supported.

## Languages

- French (primary target)
- Church Slavonic (demo)
- Extensible to other European languages

## License

All rights reserved.