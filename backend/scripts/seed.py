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
        "name_csy": "Свѧтѝтель Никола̀й Чудотвѡ́рецъ",
        "name_fr": "Saint Nicolas le Thaumaturge",
        "name_en": "St. Nicholas the Wonderworker",
        "name_ru": "Святитель Николай Чудотворец",
        "life_summary_fr": "Archevêque de Myre en Lycie (IVe s.), l'un des saints les plus vénérés de la chrétienté.",
        "life_summary_en": "Archbishop of Myra in Lycia (4th c.), one of the most venerated saints in Christianity.",
        "life_summary_ru": "Архиепископ Мир Ликийских (IV в.), один из самых почитаемых святых христианства.",
        "life_summary_csy": "Архїепі́скопъ Мѵ́рскїй (IV в.), єди́нъ ѿ наибо́лѣ чті́мыхъ свѧты́хъ.",
        "troparion_csy": "Прїиди́те, вѣ́рнїи, воспои́мъ пѣ́снь въ чес́ть наста́вника на́шегѡ̀, предст҃а́телѧ и҆ заступника, да̀ръ ми́ра и҆̀же ѿ бг҃а прїе́мша.",
        "troparion_fr": "Venez, fidèles, chantons un cantique en l'honneur de notre maître, protecteur et défenseur, qui a reçu de Dieu le don de la paix.",
        "troparion_ru": "Приидите, вернии, воспоим песнь в честь наставника нашего, предстателя и заступника, дар мира иже от Бога приемша.",
        "troparion_tone": "4",
        "kontakion_csy": "Взбра́нный Чудотвѡ́рче и҆ и҆сповѣ́дниче, побо́рниче хрⷭ҇тїа́нскїй вѣ́ры, съ тебѐ бо благода́ть и҆сцѣлє́нїѧ прїе́млемъ.",
        "kontakion_fr": "Champion thaumaturge et confesseur, défenseur de la foi chrétienne, car de toi nous recevons la grâce de guérison.",
        "kontakion_ru": "Избранный Чудотворче и исповедниче, поборниче христианския веры, с тебе бо благодать исцеления приемлем.",
        "kontakion_tone": "3",
    },
    {
        "slug": "george-victory-bearer",
        "name_csy": "Свѧты́й великомч҃никъ Геѡ́ргїй Побѣдоно́сецъ",
        "name_fr": "Saint Georges le Victorieux",
        "name_en": "St. George the Victory-Bearer",
        "name_ru": "Святой великомученик Георгий Победоносец",
        "life_summary_fr": "Martyr chrétien (IIIe s.), patron de nombreux pays et villes, célébré le 23 avril / 6 mai.",
        "life_summary_en": "Christian martyr (3rd c.), patron of many countries and cities, celebrated April 23 / May 6.",
        "life_summary_ru": "Христианский мученик (III в.), покровитель многих стран и городов, празднуется 23 апреля / 6 мая.",
        "life_summary_csy": "Мч҃никъ хрⷭ҇тїа́нскїй (III в.), покрови́тель мно́гихъ стра́нъ и҆ градѡ́въ.",
        "troparion_csy": "Я҆́кѡ плѣни́телей дѣ́мѡновъ и҆ побо́рникѡвъ врѡ́гѡвъ, и҆̀же съ вѣ́рою къ тебѣ̀ притека́ющымъ, сла́вне геѡ́ргїе, молѝ хрⷭ҇та̀ бг҃а дарова́ти на́мъ ми́ръ и҆ ве́лїю ми́лость.",
        "troparion_fr": "Comme libérateur des démons et défenseur contre les ennemis, toi en qui courent ceux qui ont la foi, glorieux Georges, prie le Christ Dieu de nous accorder la paix et la grande miséricorde.",
        "troparion_ru": "Яко пленителей демонов и поборников врагов, иже с верою к тебе притекающим, славне Георгие, моли Христа Бога даровати нам мир и велию милость.",
        "troparion_tone": "4",
        "kontakion_csy": "Воздѣ́ланъ ѿ бг҃а, показа́лсѧ є҆сѝ вїногра́дъ, и҆̀же жи́тєльства бл҃года́тнагѡ, гро́здїе прине́съ, кро́вїю твое́ю, сла́вне, и҆̀же и҆̀сточа́етъ и҆сцѣлє́нїѧ.",
        "kontakion_fr": "Cultivé par Dieu, tu t'es montré vigne de la grâce, portant la grappe par ton sang, glorieux, qui fait jaillir les guérisons.",
        "kontakion_ru": "Возделан от Бога, показался еси виноград, иже жития благодатнаго, гроздие принес кровию твоею, славне, иже источает исцеления.",
        "kontakion_tone": "4",
    },
    {
        "slug": "seraphim-sarov",
        "name_csy": "Преподо́бный Серафі́мъ Сарѡ́вскїй",
        "name_fr": "Saint Séraphim de Sarov",
        "name_en": "St. Seraphim of Sarov",
        "name_ru": "Преподобный Серафим Саровский",
        "life_summary_fr": "Starets russe (1759–1833), grand ascète et thaumaturge, célèbre pour sa joie spirituelle et son accueil de tous.",
        "life_summary_en": "Russian starets (1759–1833), great ascetic and wonderworker, known for his spiritual joy and welcoming all.",
        "life_summary_ru": "Русский старец (1759–1833), великий подвижник и чудотворец, известный своей духовной радостью.",
        "life_summary_csy": "Ст҃а́рецъ рꙋ́сскїй (1759–1833), вели́кїй подви́жникъ и҆ чꙋдотвѡ́рецъ.",
        "troparion_csy": "Ўтвержде́нъ на̀ ка́мени вѣ́ры, сщ҃е́нне, и҆̀стиннѡ показа́лсѧ є҆сѝ сто́лпъ непоколеби́мь, въ постѣ̀ и҆ моли́твѣ пребыва́ѧ.",
        "troparion_fr": "Affermi sur la pierre de la foi, saint père, tu t'es véritablement montré colonne inébranlable, demeurant dans le jeûne et la prière.",
        "troparion_ru": "Утвержден на камени веры, священне, истинно показался еси столп непоколебим, в посте и молитве пребывая.",
        "troparion_tone": "4",
        "kontakion_csy": "Мі́ра красота̀ и҆̀же въ тебѣ̀, ѻ҆́ч҃е, преꙋкра́сна ꙗ҆вле́нна, показа̀ тѧ̀ дх҃омъ бг҃овѝ бл҃гоꙋго́дна.",
        "kontakion_fr": "La beauté du monde qui est en toi, ô père, merveilleusement manifestée, t'a montré agréable à Dieu par l'Esprit.",
        "kontakion_ru": "Мира красота иже в тебе, отче, преукрасна явленна, показа тя Духом Богови благоугодна.",
        "kontakion_tone": "2",
    },
    {
        "slug": "andrew-first-called",
        "name_csy": "Свѧты́й а҆пⷭ҇лъ Андре́й Первозва́нный",
        "name_fr": "Saint André le Premier-Appelé",
        "name_en": "St. Andrew the First-Called",
        "name_ru": "Святой апостол Андрей Первозванный",
        "life_summary_fr": "Premier apôtre appelé par le Christ, frère de Pierre, patron de la Russie et de l'Écosse.",
        "life_summary_en": "First apostle called by Christ, brother of Peter, patron of Russia and Scotland.",
        "life_summary_ru": "Первый апостол, призванный Христом, брат Петра, покровитель России и Шотландии.",
        "life_summary_csy": "Пе́рвый а҆пⷭ҇лъ, призва́нный хрⷭ҇то́мъ, бра́тъ петра̀.",
        "troparion_csy": "Я҆́кѡ а҆пⷭ҇лѡвъ первозва́нный и҆̀же ѿ бг҃а, съ нб҃сѐ предста́въ, молѝ хрⷭ҇та̀ бг҃а спастѝ дꙋ́ши на́шѧ.",
        "troparion_fr": "Comme premier appelé des apôtres et qui de Dieu du ciel se présente, prie le Christ Dieu de sauver nos âmes.",
        "troparion_ru": "Яко апостолов первозванный иже от Бога, с небесе представ, моли Христа Бога спасти души наша.",
        "troparion_tone": "4",
        "kontakion_csy": "Мꙋ́жествѡмъ всѣ́хъ хрⷭ҇та̀ возлю́бленныхъ, ꙗ҆́вльсѧ, а҆пⷭ҇ле, и҆̀стиннѡ, тебѐ сла́вѧщымъ, пода́ждь ми́ръ и҆ ве́лїю ми́лость.",
        "kontakion_fr": "Par le courage de tous ceux qui aiment le Christ, tu t'es montré, ô apôtre, véritablement, à ceux qui te glorifient, accorde la paix et la grande miséricorde.",
        "kontakion_ru": "Мужеством всех Христа возлюбленных, явлься, апостоле, истинно, тебе славящим, подаждь мир и велию милость.",
        "kontakion_tone": "2",
    },
    {
        "slug": "mary-of-egypt",
        "name_csy": "Преподо́бнаѧ мт҃рь марі́а є҆гѵ́петскаѧ",
        "name_fr": "Sainte Marie l'Égyptienne",
        "name_en": "St. Mary of Egypt",
        "name_ru": "Преподобная мать Мария Египетская",
        "life_summary_fr": "Pécheresse repentie (Ve s.), modèle de conversion et de pénitence, célébrée le 5e dimanche du Grand Carême.",
        "life_summary_en": "Repentant sinner (5th c.), model of conversion and penitence, celebrated on the 5th Sunday of Great Lent.",
        "life_summary_ru": "Покаявшаяся грешница (V в.), образец обращения и покаяния, празднуется в 5-е воскресенье Великого поста.",
        "life_summary_csy": "Пока́ѧвшаѧсѧ грѣ́шница (V в.), ѻ҆бра́зъ ѡ҆браще́нїѧ и҆ покаѧ́нїѧ.",
        "troparion_csy": "Въ тебѣ̀, ма́ти, и҆звѣ́стнѡ спасе́сѧ є҆́же по ѻ҆́бразу, прїи́мши бо кре́стъ, послѣ́довала є҆сѝ хрⷭ҇тꙋ̀.",
        "troparion_fr": "En toi, ô mère, s'est véritablement sauvée l'image, car ayant pris la croix, tu as suivi le Christ.",
        "troparion_ru": "В тебе, мати, известно спасеся еже по образу, приемши бо крест, последовала еси Христу.",
        "troparion_tone": "8",
        "kontakion_csy": "Блꙋ́дницы и҆справле́нїе и҆̀стиннѡ, пока́ѧнїѧ ѻ҆́бразъ и҆̀стиннѡ, тебѐ сла́вѧщымъ, пода́ждь ми́ръ и҆ ве́лїю ми́лость.",
        "kontakion_fr": "Véritable amendement de la pécheresse, véritable image de la pénitence, à ceux qui te glorifient, accorde la paix et la grande miséricorde.",
        "kontakion_ru": "Блудницы исправление истинно, покаяния образ истинно, тебе славящим, подаждь мир и велию милость.",
        "kontakion_tone": "3",
    },
]


# ── Fixed Calendar Entries (Menaion) ────────────────────────────────────
FIXED_ENTRIES = [
    (1, 1, "Ѳеофа́нъ", "St. Théophane", "St. Theophan", "Св. Феофан", "2", "none", None),
    (1, 7, "Ржⷭ҇тво̀ хрⷭ҇то́во", "Nativité du Christ", "Nativity of Christ", "Рождество Христово", "5", "none", None),
    (1, 14, "Ѡ҆брѣ́тенїе", "Circoncision du Seigneur", "Circumcision of the Lord", "Обрезание Господне", "5", "none", None),
    (1, 19, "Бг҃оѧвле́нїе", "Théophanie", "Theophany", "Богоявление", "5", "none", None),
    (2, 2, "Срѣ́тенїе гдⷭ҇а", "Présentation du Seigneur", "Presentation of the Lord", "Сретение Господне", "5", "none", None),
    (2, 3, "Симео́нъ", "St. Syméon", "St. Simeon", "Св. Симеон", "2", "none", None),
    (3, 25, "Благовѣ́щенїе", "Annonciation", "Annunciation", "Благовещение", "5", "none", None),
    (4, 7, "Благовѣ́щенїе", "Annonciation (Julien)", "Annunciation (Julian)", "Благовещение", "5", "none", None),
    (4, 23, "Геѡ́ргїй", "St. Georges", "St. George", "Св. Георгий", "3", "none", None),
    (5, 1, "Прⷭ҇нѡе и҆сповѣ́даніе", "St. Joseph", "St. Joseph", "Св. Иосиф", "2", "none", None),
    (5, 9, "Никола̀й", "St. Nicolas", "St. Nicholas", "Св. Николай", "3", "none", None),
    (5, 21, "Кѡнстанті́нъ и҆ є҆ле́на", "Sts. Constantin et Hélène", "Sts. Constantine and Helen", "Свв. Константин и Елена", "3", "none", None),
    (6, 24, "Ржⷭ҇тво̀ і҆ѡа́нна", "Nativité de Jean-Baptiste", "Nativity of John the Baptist", "Рождество Иоанна Предтечи", "4", "none", None),
    (6, 29, "Петръ̀ и҆ па́велъ", "Sts. Pierre et Paul", "Sts. Peter and Paul", "Свв. Петр и Павел", "4", "none", None),
    (7, 7, "Ржⷭ҇тво̀ прⷭ҇ты́ѧ бцⷭ҇ы", "Nativité de la Mère de Dieu", "Nativity of the Theotokos", "Рождество Пресвятой Богородицы", "5", "none", None),
    (7, 12, "Петръ̀ и҆ па́велъ", "Sts. Pierre et Paul (Julien)", "Sts. Peter and Paul (Julian)", "Свв. Петр и Павел", "4", "none", None),
    (8, 6, "Преѡбраже́нїе", "Transfiguration", "Transfiguration", "Преображение", "5", "none", None),
    (8, 15, "ꙋ҆спе́нїе прⷭ҇ты́ѧ бцⷭ҇ы", "Dormition de la Mère de Dieu", "Dormition of the Theotokos", "Успение Пресвятой Богородицы", "5", "none", None),
    (8, 19, "Преѡбраже́нїе", "Transfiguration (Julien)", "Transfiguration (Julian)", "Преображение", "5", "none", None),
    (8, 29, "ꙋ҆сѣче́нїе", "Décollation de Jean-Baptiste", "Beheading of John the Baptist", "Усекновение Иоанна Предтечи", "4", "none", None),
    (9, 8, "Ржⷭ҇тво̀ прⷭ҇ты́ѧ бцⷭ҇ы", "Nativité de la Mère de Dieu", "Nativity of the Theotokos", "Рождество Пресвятой Богородицы", "5", "none", None),
    (9, 14, "Воздви́женїе", "Exaltation de la Croix", "Exaltation of the Cross", "Воздвижение Креста", "5", "none", None),
    (9, 21, "Ржⷭ҇тво̀ бцⷭ҇ы", "Nativité de la Mère de Dieu (Julien)", "Nativity of the Theotokos (Julian)", "Рождество Богородицы", "5", "none", None),
    (10, 1, "Покро́въ прⷭ҇ты́ѧ бцⷭ҇ы", "Protection de la Mère de Dieu", "Protection of the Theotokos", "Покров Пресвятой Богородицы", "4", "none", None),
    (11, 8, "Собо́ръ а҆рⷭ҇хⷭ҇тра҃тїга", "Synaxe des Archanges", "Synaxis of the Archangels", "Собор Архистратига", "3", "none", None),
    (11, 21, "Введе́нїе во хра́мъ", "Entrée au Temple", "Entry into the Temple", "Введение во храм", "4", "none", None),
    (12, 4, "Введе́нїе во хра́мъ", "Entrée au Temple (Julien)", "Entry into the Temple (Julian)", "Введение во храм", "4", "none", None),
    (12, 6, "Никола̀й", "St. Nicolas", "St. Nicholas", "Св. Николай", "3", "none", None),
    (12, 19, "Никола̀й", "St. Nicolas (Julien)", "St. Nicholas (Julian)", "Св. Николай", "3", "none", None),
    (12, 25, "Ржⷭ҇тво̀ хрⷭ҇то́во", "Nativité du Christ (Julien)", "Nativity of Christ (Julian)", "Рождество Христово", "5", "none", None),
]


# ── Movable Calendar Entries (Triodion / Pentecostarion) ────────────────
MOVABLE_ENTRIES = [
    (-70, "Мѵ́тарь и҆ фарїсе́й", "Publicain et Pharisien", "Publican and Pharisee", "Мытарь и фарисей", "2", "none", None),
    (-63, "Блꙋ́дный сы́нъ", "Fils prodigue", "Prodigal Son", "Блудный сын", "2", "none", None),
    (-56, "Стра́шный сꙋдъ", "Jugement dernier", "Last Judgment", "Страшный суд", "3", "none", None),
    (-49, "Проще́ное воскресе́нїе", "Dimanche du Pardon", "Forgiveness Sunday", "Прощеное воскресенье", "3", "none", None),
    (-48, "Чи́стый понедѣ́льникъ", "Lundi pur", "Clean Monday", "Чистый понедельник", "1", "great_lent", None),
    (-42, "Крестопокло́ннаѧ", "Vénération de la Croix", "Veneration of the Cross", "Крестопоклонная", "3", "great_lent", None),
    (-35, "І҆ѡа́ннъ лѣ́ствичникъ", "St. Jean Climaque", "St. John Climacus", "Иоанн Лествичник", "2", "great_lent", None),
    (-28, "Марі́а є҆гѵ́петскаѧ", "Ste Marie l'Égyptienne", "St. Mary of Egypt", "Мария Египетская", "2", "great_lent", None),
    (-7, "Ва́її", "Rameaux", "Palm Sunday", "Вербное воскресенье", "4", "none", None),
    (-6, "Вели́кїй понедѣ́льникъ", "Grand Lundi", "Great Monday", "Великий понедельник", "1", "great_lent", None),
    (-5, "Вели́кїй вто́рникъ", "Grand Mardi", "Great Tuesday", "Великий вторник", "1", "great_lent", None),
    (-4, "Вели́каѧ среда̀", "Grand Mercredi", "Great Wednesday", "Великая среда", "1", "great_lent", None),
    (-3, "Вели́кїй четверто́къ", "Grand Jeudi", "Great Thursday", "Великий четверг", "1", "great_lent", None),
    (-2, "Вели́каѧ пѧто́къ", "Grand Vendredi", "Great Friday", "Великая пятница", "1", "great_lent", None),
    (-1, "Вели́каѧ сꙋббѡ́та", "Grand Samedi", "Great Saturday", "Великая суббота", "1", "great_lent", None),
    (0, "Па́сха", "Pâques", "Pascha", "Пасха", "5", "none", 1),
    (1, "Све́тлаѧ понедѣ́льникъ", "Lundi de Pâques", "Bright Monday", "Светлый понедельник", "4", "none", 1),
    (6, "Ѳѡма̀", "Thomas", "Thomas Sunday", "Фомина неделя", "4", "none", 2),
    (7, "Жє́ны-мѵроно́сицы", "Saintes Femmes Myrophores", "Myrrh-bearing Women", "Жены-мироносицы", "3", "none", 3),
    (14, "Рассла́бленный", "Le Paralytique", "The Paralytic", "Расслабленный", "3", "none", 4),
    (21, "Самарѧ́нынѧ", "La Samaritaine", "The Samaritan Woman", "Самаряныня", "3", "none", 5),
    (28, "Слѣпы́й", "L'Aveugle-né", "The Blind Man", "Слепой", "3", "none", 6),
    (35, "Сѡ́тниківъ", "Des Pères", "Fathers of the 1st Council", "Отцы I Вселенского Собора", "3", "none", 7),
    (39, "Вознесе́нїе", "Ascension", "Ascension", "Вознесение", "5", "none", 8),
    (42, "Сѡ́тниківъ", "Des Pères", "Fathers of the 1st Council", "Отцы I Вселенского Собора", "3", "none", 7),
    (49, "Пѧтїдеся́тница", "Pentecôte", "Pentecost", "Пятидесятница", "5", "none", 8),
    (50, "Дх҃а свѧта́го", "Saint-Esprit", "Holy Spirit", "День Святого Духа", "4", "none", 1),
    (56, "Всѣ́хъ свѧты́хъ", "Tous les Saints", "All Saints", "Всех святых", "3", "none", 8),
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


DEFAULT_TEMPLE = {
    "name": "Paroisse de la Sainte-Trinité",
    "dedication_type": "theotokos",
    "calendar_mode": "new",
    "language": "fr",
}


async def seed_all() -> None:
    """Seed all demo data into the database."""
    async with async_session() as db:
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
                name_csy=s_data["name_csy"],
                name_fr=s_data.get("name_fr"),
                name_en=s_data.get("name_en"),
                name_ru=s_data.get("name_ru"),
                life_summary_csy=s_data.get("life_summary_csy"),
                life_summary_fr=s_data.get("life_summary_fr"),
                life_summary_en=s_data.get("life_summary_en"),
                life_summary_ru=s_data.get("life_summary_ru"),
                categories=json.dumps(["saint"]),
            )
            db.add(saint)
            print(f"  Added saint: {s_data['slug']}")

        await db.flush()

        print("Seeding fixed calendar entries...")
        for month, day, title_csy, title_fr, title_en, title_ru, rank, fasting, tone in FIXED_ENTRIES:
            stmt = select(CalendarEntry).where(
                CalendarEntry.date_type == "fixed",
                CalendarEntry.month == month,
                CalendarEntry.day == day,
                CalendarEntry.title_csy == title_csy,
            )
            existing = (await db.execute(stmt)).scalar_one_or_none()
            if existing:
                continue
            entry = CalendarEntry(
                date_type="fixed",
                month=month, day=day,
                title_csy=title_csy, title_fr=title_fr, title_en=title_en, title_ru=title_ru,
                rank=rank, fasting=fasting or "none", tone=tone,
                forefeast_days=0, afterfeast_days=0,
            )
            db.add(entry)
        print(f"  Added {len(FIXED_ENTRIES)} fixed entries")

        print("Seeding movable calendar entries...")
        for offset, title_csy, title_fr, title_en, title_ru, rank, fasting, tone in MOVABLE_ENTRIES:
            stmt = select(CalendarEntry).where(
                CalendarEntry.date_type == "movable",
                CalendarEntry.pascha_offset == offset,
                CalendarEntry.title_csy == title_csy,
            )
            existing = (await db.execute(stmt)).scalar_one_or_none()
            if existing:
                continue
            entry = CalendarEntry(
                date_type="movable",
                pascha_offset=offset,
                title_csy=title_csy, title_fr=title_fr, title_en=title_en, title_ru=title_ru,
                rank=rank, fasting=fasting or "none", tone=tone,
                forefeast_days=0, afterfeast_days=0,
            )
            db.add(entry)
        print(f"  Added {len(MOVABLE_ENTRIES)} movable entries")

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

        print("Seeding default temple...")
        existing_temple = (await db.execute(select(Temple))).scalar_one_or_none()
        if not existing_temple:
            temple = Temple(**DEFAULT_TEMPLE)
            db.add(temple)
            print("  Added default temple")
        else:
            print("  Temple already exists")

        await db.commit()
        print("\nSeed complete!")


if __name__ == "__main__":
    asyncio.run(seed_all())