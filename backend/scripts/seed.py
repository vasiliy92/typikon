"""Seed data for Typikon — demo content.

Populates the database with basic calendar entries, saints, and service templates
so the app has content to display. Run with: python -m scripts.seed

This is a one-time operation for demo purposes. Production data should come
from the ETL pipeline.
"""
from __future__ import annotations

import asyncio
import json
import sys
from datetime import date
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.db import async_engine, async_session
from app.models.calendar import CalendarEntry
from app.models.saint import Saint
from app.models.liturgical import ServiceTemplate, ServiceTemplateBlock
from app.models.temple import Temple
from app.models.enums import BookCode, BlockType, Language, FeastRank, FastingType
from sqlalchemy import select


# ── Saints ──────────────────────────────────────────────────────────────

SAINTS = [
    {
        "slug": "nicholas-wonderworker",
        "name_ru": "Святитель Николай Чудотворец",
        "name_fr": "Saint Nicolas le Thaumaturge",
        "life_summary_ru": "Архиепископ Мир Ликийских (IV в.), один из самых почитаемых святых христианства.",
        "life_summary_fr": "Archevêque de Myre en Lycie (IVe s.), l'un des saints les plus vénérés de la chrétienté.",
        "troparion_ru": "Приидите, вернии, воспоим песнь в честь наставника нашего, предстателя и заступника, дар мира иже от Бога приемша.",
        "troparion_fr": "Venez, fidèles, chantons un cantique en l'honneur de notre maître, protecteur et défenseur, qui a reçu de Dieu le don de la paix.",
        "troparion_tone": "4",
        "kontakion_ru": "Избранный Чудотворче и исповедниче, поборниче христианския веры, с тебе бо благодать исцеления приемлем.",
        "kontakion_fr": "Champion thaumaturge et confesseur, défenseur de la foi chrétienne, car de toi nous recevons la grâce de guérison.",
        "kontakion_tone": "3",
    },
    {
        "slug": "george-victory-bearer",
        "name_ru": "Святой великомученик Георгий Победоносец",
        "name_fr": "Saint Georges le Victorieux",
        "life_summary_ru": "Христианский мученик (III в.), покровитель многих стран и городов, празднуется 23 апреля / 6 мая.",
        "life_summary_fr": "Martyr chrétien (IIIe s.), patron de nombreux pays et villes, célébré le 23 avril / 6 mai.",
        "troparion_ru": "Яко пленителей демонов и поборников врагов, иже с верою к тебе притекающим, славне Георгие, моли Христа Бога даровати нам мир и велию милость.",
        "troparion_fr": "Comme libérateur des démons et défenseur contre les ennemis, toi en qui courent ceux qui ont la foi, glorieux Georges, prie le Christ Dieu de nous accorder la paix et la grande miséricorde.",
        "troparion_tone": "4",
        "kontakion_ru": "Возделан от Бога, показался еси виноград, иже жития благодатнаго, гроздие принес кровию твоею, славне, иже источает исцеления.",
        "kontakion_fr": "Cultivé par Dieu, tu t'es montré vigne de la grâce, portant la grappe par ton sang, glorieux, qui fait jaillir les guérisons.",
        "kontakion_tone": "4",
    },
    {
        "slug": "seraphim-sarov",
        "name_ru": "Преподобный Серафим Саровский",
        "name_fr": "Saint Séraphim de Sarov",
        "life_summary_ru": "Русский старец (1759–1833), великий подвижник и чудотворец, известный своей духовной радостью.",
        "life_summary_fr": "Starets russe (1759–1833), grand ascète et thaumaturge, célèbre pour sa joie spirituelle et son accueil de tous.",
        "troparion_ru": "Утвержден на камени веры, священне, истинно показался еси столп непоколебим, в посте и молитве пребывая.",
        "troparion_fr": "Affermi sur la pierre de la foi, saint père, tu t'es véritablement montré colonne inébranlable, demeurant dans le jeûne et la prière.",
        "troparion_tone": "4",
        "kontakion_ru": "Мира красота иже в тебе, отче, преукрасна явленна, показа тя Духом Богови благоугодна.",
        "kontakion_fr": "La beauté du monde qui est en toi, ô père, merveilleusement manifestée, t'a montré agréable à Dieu par l'Esprit.",
        "kontakion_tone": "2",
    },
    {
        "slug": "andrew-first-called",
        "name_ru": "Святой апостол Андрей Первозванный",
        "name_fr": "Saint André le Premier-Appelé",
        "life_summary_ru": "Первый апостол, призванный Христом, брат Петра, покровитель России и Шотландии.",
        "life_summary_fr": "Premier apôtre appelé par le Christ, frère de Pierre, patron de la Russie et de l'Écosse.",
        "troparion_ru": "Яко апостолов первозванный иже от Бога, с небесе представ, моли Христа Бога спасти души наша.",
        "troparion_fr": "Comme premier appelé des apôtres et qui de Dieu du ciel se présente, prie le Christ Dieu de sauver nos âmes.",
        "troparion_tone": "4",
        "kontakion_ru": "Мужеством всех Христа возлюбленных, явлься, апостоле, истинно, тебе славящим, подаждь мир и велию милость.",
        "kontakion_fr": "Par le courage de tous ceux qui aiment le Christ, tu t'es montré, ô apôtre, véritablement, à ceux qui te glorifient, accorde la paix et la grande miséricorde.",
        "kontakion_tone": "2",
    },
    {
        "slug": "mary-of-egypt",
        "name_ru": "Преподобная мать Мария Египетская",
        "name_fr": "Sainte Marie l'Égyptienne",
        "life_summary_ru": "Покаявшаяся грешница (V в.), образец обращения и покаяния, празднуется в 5-е воскресенье Великого поста.",
        "life_summary_fr": "Pécheresse repentie (Ve s.), modèle de conversion et de pénitence, célébrée le 5e dimanche du Grand Carême.",
        "troparion_ru": "В тебе, мати, известно спасеся еже по образу, приемши бо крест, последовала еси Христу.",
        "troparion_fr": "En toi, ô mère, s'est véritablement sauvée l'image, car ayant pris la croix, tu as suivi le Christ.",
        "troparion_tone": "8",
        "kontakion_ru": "Блудницы исправление истинно, покаяния образ истинно, тебе славящим, подаждь мир и велию милость.",
        "kontakion_fr": "Véritable amendement de la pécheresse, véritable image de la pénitence, à ceux qui te glorifient, accorde la paix et la grande miséricorde.",
        "kontakion_tone": "3",
    },
]


# ── Fixed Calendar Entries (Menaion) ────────────────────────────────────
# Format: (month, day, title_ru, title_fr, rank, fasting, tone)

FIXED_ENTRIES = [
    # January
    (1, 1, "Св. Феофан", "St. Théophane", "2", "none", None),
    (1, 7, "Рождество Христово", "Nativité du Christ", "5", "none", None),
    (1, 14, "Обрезание Господне", "Circoncision du Seigneur", "5", "none", None),
    (1, 19, "Богоявление", "Théophanie", "5", "none", None),
    # February
    (2, 2, "Сретение Господне", "Présentation du Seigneur", "5", "none", None),
    (2, 3, "Св. Симеон", "St. Syméon", "2", "none", None),
    # March
    (3, 25, "Благовещение", "Annonciation", "5", "none", None),
    # April
    (4, 7, "Благовещение", "Annonciation (Julien)", "5", "none", None),
    (4, 23, "Св. Георгий", "St. Georges", "3", "none", None),
    # May
    (5, 1, "Св. Иосиф", "St. Joseph", "2", "none", None),
    (5, 9, "Св. Николай", "St. Nicolas", "3", "none", None),
    (5, 21, "Свв. Константин и Елена", "Sts. Constantin et Hélène", "3", "none", None),
    # June
    (6, 24, "Рождество Иоанна Предтечи", "Nativité de Jean-Baptiste", "4", "none", None),
    (6, 29, "Свв. Петр и Павел", "Sts. Pierre et Paul", "4", "none", None),
    # July
    (7, 7, "Рождество Пресвятой Богородицы", "Nativité de la Mère de Dieu", "5", "none", None),
    (7, 12, "Свв. Петр и Павел", "Sts. Pierre et Paul (Julien)", "4", "none", None),
    # August
    (8, 6, "Преображение", "Transfiguration", "5", "none", None),
    (8, 15, "Успение Пресвятой Богородицы", "Dormition de la Mère de Dieu", "5", "none", None),
    (8, 19, "Преображение", "Transfiguration (Julien)", "5", "none", None),
    (8, 29, "Усекновение Иоанна Предтечи", "Décollation de Jean-Baptiste", "4", "none", None),
    # September
    (9, 8, "Рождество Пресвятой Богородицы", "Nativité de la Mère de Dieu", "5", "none", None),
    (9, 14, "Воздвижение Креста", "Exaltation de la Croix", "5", "none", None),
    (9, 21, "Рождество Богородицы", "Nativité de la Mère de Dieu (Julien)", "5", "none", None),
    # October
    (10, 1, "Покров Пресвятой Богородицы", "Protection de la Mère de Dieu", "4", "none", None),
    # November
    (11, 8, "Собор Архистратига", "Synaxe des Archanges", "3", "none", None),
    (11, 21, "Введение во храм", "Entrée au Temple", "4", "none", None),
    # December
    (12, 4, "Введение во храм", "Entrée au Temple (Julien)", "4", "none", None),
    (12, 6, "Св. Николай", "St. Nicolas", "3", "none", None),
    (12, 19, "Св. Николай", "St. Nicolas (Julien)", "3", "none", None),
    (12, 25, "Рождество Христово", "Nativité du Christ (Julien)", "5", "none", None),
]


# ── Movable Calendar Entries (Triodion / Pentecostarion) ────────────────
# Format: (pascha_offset, title_ru, title_fr, rank, fasting, tone)

MOVABLE_ENTRIES = [
    # Pre-Lent
    (-70, "Мытарь и фарисей", "Publicain et Pharisien", "2", "none", None),
    (-63, "Блудный сын", "Fils prodigue", "2", "none", None),
    (-56, "Страшный суд", "Jugement dernier", "3", "none", None),
    (-49, "Прощеное воскресенье", "Dimanche du Pardon", "3", "none", None),
    # Great Lent
    (-48, "Чистый понедельник", "Lundi pur", "1", "great_lent", None),
    (-42, "Крестопоклонная", "Vénération de la Croix", "3", "great_lent", None),
    (-35, "Иоанн Лествичник", "St. Jean Climaque", "2", "great_lent", None),
    (-28, "Мария Египетская", "Ste Marie l'Égyptienne", "2", "great_lent", None),
    # Holy Week
    (-7, "Вербное воскресенье", "Rameaux", "4", "none", None),
    (-6, "Великий понедельник", "Grand Lundi", "1", "great_lent", None),
    (-5, "Великий вторник", "Grand Mardi", "1", "great_lent", None),
    (-4, "Великая среда", "Grand Mercredi", "1", "great_lent", None),
    (-3, "Великий четверг", "Grand Jeudi", "1", "great_lent", None),
    (-2, "Великая пятница", "Grand Vendredi", "1", "great_lent", None),
    (-1, "Великая суббота", "Grand Samedi", "1", "great_lent", None),
    # Pascha & Pentecostarion
    (0, "Пасха", "Pâques", "5", "none", 1),
    (1, "Светлый понедельник", "Lundi de Pâques", "4", "none", 1),
    (6, "Фомина неделя", "Thomas", "4", "none", 2),
    (7, "Жены-мироносицы", "Saintes Femmes Myrophores", "3", "none", 3),
    (14, "Расслабленный", "Le Paralytique", "3", "none", 4),
    (21, "Самаряныня", "La Samaritaine", "3", "none", 5),
    (28, "Слепой", "L'Aveugle-né", "3", "none", 6),
    (35, "Отцы I Вселенского Собора", "Des Pères", "3", "none", 7),
    (39, "Вознесение", "Ascension", "5", "none", 8),
    (42, "Отцы I Вселенского Собора", "Des Pères", "3", "none", 7),
    (49, "Пятидесятница", "Pentecôte", "5", "none", 8),
    (50, "День Святого Духа", "Saint-Esprit", "4", "none", 1),
    (56, "Всех святых", "Tous les Saints", "3", "none", 8),
]


# ── Service Templates ───────────────────────────────────────────────────

TEMPLATES = [
    {
        "service_type": "liturgy",
        "name": "Divine Liturgy of St. John Chrysostom — Ordinary",
        "sub_type": "chrysostom",
        "is_special": False,
        "description": "Standard Sunday/feast day Divine Liturgy of St. John Chrysostom",
        "blocks": [
            {"slot_key": "opening", "block_type": "prayer", "block_order": 1, "required": True},
            {"slot_key": "great_litany", "block_type": "ektenia", "block_order": 2, "required": True},
            {"slot_key": "first_antiphon", "block_type": "antiphon", "block_order": 3, "required": True},
            {"slot_key": "second_antiphon", "block_type": "antiphon", "block_order": 4, "required": True},
            {"slot_key": "third_antiphon", "block_type": "antiphon", "block_order": 5, "required": True},
            {"slot_key": "entrance", "block_type": "prayer", "block_order": 6, "required": True},
            {"slot_key": "troparia_kontakia", "block_type": "troparion", "block_order": 7, "required": True},
            {"slot_key": "trisagion", "block_type": "prayer", "block_order": 8, "required": True},
            {"slot_key": "prokeimenon", "block_type": "prokeimenon", "block_order": 9, "required": True},
            {"slot_key": "epistle", "block_type": "reading", "block_order": 10, "required": True},
            {"slot_key": "alleluia", "block_type": "alleluia", "block_order": 11, "required": True},
            {"slot_key": "gospel", "block_type": "reading", "block_order": 12, "required": True},
            {"slot_key": "litany_fervent", "block_type": "ektenia", "block_order": 13, "required": True},
            {"slot_key": "litany_departed", "block_type": "ektenia", "block_order": 14, "required": False},
            {"slot_key": "cherubic_hymn", "block_type": "hymn", "block_order": 15, "required": True},
            {"slot_key": "anaphora", "block_type": "prayer", "block_order": 16, "required": True},
            {"slot_key": "lords_prayer", "block_type": "prayer", "block_order": 17, "required": True},
            {"slot_key": "communion", "block_type": "prayer", "block_order": 18, "required": True},
            {"slot_key": "communion_verse", "block_type": "communion_verse", "block_order": 19, "required": True},
            {"slot_key": "post_communion", "block_type": "prayer", "block_order": 20, "required": True},
            {"slot_key": "dismissal", "block_type": "prayer", "block_order": 21, "required": True},
        ],
    },
    {
        "service_type": "vespers",
        "name": "Great Vespers — Ordinary",
        "sub_type": "great",
        "is_special": False,
        "description": "Standard Great Vespers for Saturday evening or feast days",
        "blocks": [
            {"slot_key": "opening_psalm", "block_type": "prayer", "block_order": 1, "required": True},
            {"slot_key": "great_litany", "block_type": "ektenia", "block_order": 2, "required": True},
            {"slot_key": "kathismata", "block_type": "kathisma", "block_order": 3, "required": False},
            {"slot_key": "lord_i_have_cried", "block_type": "stichera", "block_order": 4, "required": True},
            {"slot_key": "entrance", "block_type": "prayer", "block_order": 5, "required": False},
            {"slot_key": "prokeimenon", "block_type": "prokeimenon", "block_order": 6, "required": True},
            {"slot_key": "paremia", "block_type": "reading", "block_order": 7, "required": False},
            {"slot_key": "litany_supplicatory", "block_type": "ektenia", "block_order": 8, "required": True},
            {"slot_key": "aposticha", "block_type": "stichera", "block_order": 9, "required": True},
            {"slot_key": "troparia", "block_type": "troparion", "block_order": 10, "required": True},
            {"slot_key": "dismissal", "block_type": "prayer", "block_order": 11, "required": True},
        ],
    },
    {
        "service_type": "matins",
        "name": "Sunday Matins — Ordinary",
        "sub_type": "sunday",
        "is_special": False,
        "description": "Standard Sunday Matins with Octoechos",
        "blocks": [
            {"slot_key": "hexapsalmos", "block_type": "prayer", "block_order": 1, "required": True},
            {"slot_key": "great_litany", "block_type": "ektenia", "block_order": 2, "required": True},
            {"slot_key": "kathismata", "block_type": "kathisma", "block_order": 3, "required": True},
            {"slot_key": "polyeleos", "block_type": "prayer", "block_order": 4, "required": False},
            {"slot_key": "troparia_evangely", "block_type": "troparion", "block_order": 5, "required": True},
            {"slot_key": "canon", "block_type": "canon", "block_order": 6, "required": True},
            {"slot_key": "katavasia", "block_type": "hymn", "block_order": 7, "required": True},
            {"slot_key": "megalynarion", "block_type": "hymn", "block_order": 8, "required": False},
            {"slot_key": "exapostilarion", "block_type": "hymn", "block_order": 9, "required": True},
            {"slot_key": "praise", "block_type": "stichera", "block_order": 10, "required": True},
            {"slot_key": "doxology", "block_type": "prayer", "block_order": 11, "required": True},
            {"slot_key": "troparia", "block_type": "troparion", "block_order": 12, "required": True},
            {"slot_key": "dismissal", "block_type": "prayer", "block_order": 13, "required": True},
        ],
    },
    {
        "service_type": "vigil",
        "name": "All-Night Vigil — Ordinary",
        "sub_type": "ordinary",
        "is_special": False,
        "description": "Standard All-Night Vigil (Vespers + Matins + First Hour)",
        "blocks": [
            {"slot_key": "vespers", "block_type": "prayer", "block_order": 1, "required": True},
            {"slot_key": "matins", "block_type": "prayer", "block_order": 2, "required": True},
            {"slot_key": "first_hour", "block_type": "prayer", "block_order": 3, "required": True},
        ],
    },
    {
        "service_type": "hours",
        "name": "Typical Hours",
        "sub_type": "typical",
        "is_special": False,
        "description": "First, Third, and Sixth Hours",
        "blocks": [
            {"slot_key": "first_hour", "block_type": "prayer", "block_order": 1, "required": True},
            {"slot_key": "third_hour", "block_type": "prayer", "block_order": 2, "required": True},
            {"slot_key": "sixth_hour", "block_type": "prayer", "block_order": 3, "required": True},
        ],
    },
]


# ── Default Temple ──────────────────────────────────────────────────────

DEFAULT_TEMPLE = {
    "name": "Paroisse de la Sainte-Trinité",
    "dedication_type": "theotokos",
    "calendar_mode": "new",
    "language": "fr",
}


async def seed_all() -> None:
    """Seed all demo data into the database."""
    async with async_session() as db:
        # ── Saints ──
        print("Seeding saints...")
        existing_saints = set(
            (await db.execute(select(Saint.slug))).scalars().all()
        )
        for s_data in SAINTS:
            if s_data["slug"] in existing_saints:
                print(f"  Skip existing saint: {s_data['slug']}")
                continue
            saint = Saint(
                slug=s_data["slug"],
                name_ru=s_data["name_ru"],
                name_fr=s_data.get("name_fr"),
                life_summary_ru=s_data.get("life_summary_ru"),
                life_summary_fr=s_data.get("life_summary_fr"),
                troparion_ru=s_data.get("troparion_ru"),
                troparion_fr=s_data.get("troparion_fr"),
                troparion_tone=s_data.get("troparion_tone"),
                kontakion_ru=s_data.get("kontakion_ru"),
                kontakion_fr=s_data.get("kontakion_fr"),
                kontakion_tone=s_data.get("kontakion_tone"),
                categories=json.dumps(["saint"]),
            )
            db.add(saint)
            print(f"  Added saint: {s_data['slug']}")

        await db.flush()

        # ── Fixed Calendar Entries ──
        print("Seeding fixed calendar entries...")
        for month, day, title_ru, title_fr, rank, fasting, tone in FIXED_ENTRIES:
            stmt = select(CalendarEntry).where(
                CalendarEntry.date_type == "fixed",
                CalendarEntry.month == month,
                CalendarEntry.day == day,
                CalendarEntry.title_ru == title_ru,
            )
            existing = (await db.execute(stmt)).scalar_one_or_none()
            if existing:
                continue
            entry = CalendarEntry(
                date_type="fixed",
                month=month,
                day=day,
                title_ru=title_ru,
                title_fr=title_fr,
                rank=rank,
                fasting=fasting or "none",
                tone=tone,
                forefeast_days=0,
                afterfeast_days=0,
            )
            db.add(entry)
        print(f"  Added {len(FIXED_ENTRIES)} fixed entries")

        # ── Movable Calendar Entries ──
        print("Seeding movable calendar entries...")
        for offset, title_ru, title_fr, rank, fasting, tone in MOVABLE_ENTRIES:
            stmt = select(CalendarEntry).where(
                CalendarEntry.date_type == "movable",
                CalendarEntry.pascha_offset == offset,
                CalendarEntry.title_ru == title_ru,
            )
            existing = (await db.execute(stmt)).scalar_one_or_none()
            if existing:
                continue
            entry = CalendarEntry(
                date_type="movable",
                pascha_offset=offset,
                title_ru=title_ru,
                title_fr=title_fr,
                rank=rank,
                fasting=fasting or "none",
                tone=tone,
                forefeast_days=0,
                afterfeast_days=0,
            )
            db.add(entry)
        print(f"  Added {len(MOVABLE_ENTRIES)} movable entries")

        # ── Service Templates ──
        print("Seeding service templates...")
        for tmpl_data in TEMPLATES:
            stmt = select(ServiceTemplate).where(
                ServiceTemplate.service_type == tmpl_data["service_type"],
                ServiceTemplate.name == tmpl_data["name"],
            )
            existing = (await db.execute(stmt)).scalar_one_or_none()
            if existing:
                print(f"  Skip existing template: {tmpl_data['name']}")
                continue
            template = ServiceTemplate(
                service_type=tmpl_data["service_type"],
                name=tmpl_data["name"],
                sub_type=tmpl_data.get("sub_type"),
                is_special=tmpl_data.get("is_special", False),
                description=tmpl_data.get("description"),
            )
            db.add(template)
            await db.flush()

            for blk_data in tmpl_data["blocks"]:
                block = ServiceTemplateBlock(
                    template_id=template.id,
                    slot_key=blk_data["slot_key"],
                    block_type=blk_data["block_type"],
                    block_order=blk_data["block_order"],
                    required=blk_data.get("required", True),
                )
                db.add(block)
            print(f"  Added template: {tmpl_data['name']} with {len(tmpl_data['blocks'])} blocks")

        # ── Default Temple ──
        print("Seeding default temple...")
        existing_temple = (await db.execute(select(Temple))).scalar_one_or_none()
        if not existing_temple:
            temple = Temple(**DEFAULT_TEMPLE)
            db.add(temple)
            print("  Added default temple")
        else:
            print("  Temple already exists")

        await db.commit()
        print("\n✓ Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed_all())