"""Shared enumerations for the Typikon domain."""
from __future__ import annotations

from enum import StrEnum


class BookCode(StrEnum):
    GOSPEL = "gospel"
    APOSTOL = "apostol"
    PSALTER = "psalter"
    LITURGICON = "liturgicon"
    HOROLOGION = "horologion"
    OCTOECHOS = "octoechos"
    MENAION_MONTHLY = "menaion_monthly"
    MENAION_FESTAL = "menaion_festal"
    MENAION_GENERAL = "menaion_general"
    TRIODION = "triodion"
    PENTECOSTARION = "pentecostarion"
    IRMOLOGION = "irmologion"
    TYPIKON = "typikon"
    EUCHOLOGION = "euchologion"
    HIERATICON = "hieraticon"
    PROLOGUE = "prologue"
    TROPARION = "troparion"


class ServiceType(StrEnum):
    VESPERS = "vespers"
    MATINS = "matins"
    VIGIL = "vigil"
    HOURS = "hours"
    LITURGY = "liturgy"
    COMPLINE = "compline"
    MIDNIGHT = "midnight_office"
    TYPICA = "typica"
    PRESANCTIFIED = "presanctified"


class Language(StrEnum):
    CSY = "csy"
    FR = "fr"
    EN = "en"


class CalendarMode(StrEnum):
    JULIAN = "julian"
    NEO_JULIAN = "neo_julian"


class DedicationType(StrEnum):
    SAVIOUR = "saviour"
    THEOTOKOS = "theotokos"
    SAINT = "saint"


class FeastRank(StrEnum):
    DAILY = "1"
    MINOR_SAINT = "2"
    POLYELEOS = "3"
    VIGIL = "4"
    LORD_THEOTOKOS = "5"


class FastingType(StrEnum):
    NONE = "none"
    WEDNESDAY_FRIDAY = "wednesday_friday"
    PHARISEE_WEEK = "pharisee_week"
    CHEESEFARE = "cheesefare"
    GREAT_LENT = "great_lent"
    APOSTLES = "apostles"
    DORMITION = "dormition"
    NATIVITY = "nativity"


class DateType(StrEnum):
    FIXED = "fixed"
    MOVABLE = "movable"


class BlockType(StrEnum):
    FIXED = "fixed"
    VARIABLE = "variable"
    CONDITIONAL = "conditional"


class SaintCategory(StrEnum):
    APOSTLE = "apostle"
    MARTYR = "martyr"
    HIERARCH = "hierarch"
    CONFESSOR = "confessor"
    UNMERCENARY = "unmercenary"
    FOOL_FOR_CHRIST = "fool_for_christ"
    EQUAL_TO_THE_APOSTLES = "equal_to_apostles"
    VENERABLE = "venerable"
    PROPHET = "prophet"
    PATRIARCH = "patriarch"
    RIGHTEOUS = "righteous"


# ── Bilingual book metadata ──

BOOK_NAMES: dict[BookCode, dict[str, str]] = {
    BookCode.GOSPEL: {"csy": "Еѵангелїе", "fr": "Évangile", "en": "Gospel"},
    BookCode.APOSTOL: {"csy": "А҆пⷭ҇лъ", "fr": "Apôtre", "en": "Apostol"},
    BookCode.PSALTER: {"csy": "Псалти́рь", "fr": "Psauttier", "en": "Psalter"},
    BookCode.LITURGICON: {"csy": "Слꙋже́бникъ", "fr": "Liturgicon", "en": "Liturgicon"},
    BookCode.HOROLOGION: {"csy": "Часослѡ́въ", "fr": "Horologion", "en": "Horologion"},
    BookCode.OCTOECHOS: {"csy": "Октѡ́ихъ", "fr": "Octoéchos", "en": "Octoechos"},
    BookCode.MENAION_MONTHLY: {"csy": "Мине́ѧ мѣсѧ́чнаѧ", "fr": "Ménée mensuelle", "en": "Monthly Menaion"},
    BookCode.MENAION_FESTAL: {"csy": "Мине́ѧ пра́здничнаѧ", "fr": "Ménée festive", "en": "Festal Menaion"},
    BookCode.MENAION_GENERAL: {"csy": "Мине́ѧ ѡ҆́бщаѧ", "fr": "Ménée générale", "en": "General Menaion"},
    BookCode.TRIODION: {"csy": "Трїѡ́дь постна́ѧ", "fr": "Triode de Carême", "en": "Lenten Triodion"},
    BookCode.PENTECOSTARION: {"csy": "Трїѡ́дь цвѣ́тнаѧ", "fr": "Triode fleurie", "en": "Pentecostarion"},
    BookCode.IRMOLOGION: {"csy": "Ірмологі́й", "fr": "Irmologion", "en": "Irmologion"},
    BookCode.TYPIKON: {"csy": "Тѵпикѡ́нъ", "fr": "Typikon", "en": "Typikon"},
    BookCode.EUCHOLOGION: {"csy": "Тре́бникъ", "fr": "Euchologion", "en": "Euchologion"},
    BookCode.HIERATICON: {"csy": "Архїере́йскїй чино́вникъ", "fr": "Hiératikon", "en": "Hieraticon"},
    BookCode.PROLOGUE: {"csy": "Проло́гъ", "fr": "Prologue", "en": "Prologue"},
    BookCode.TROPARION: {"csy": "Тропа́рїонъ", "fr": "Troparion", "en": "Troparion"},
}

SERVICE_NAMES: dict[ServiceType, dict[str, str]] = {
    ServiceType.VESPERS: {"csy": "Вече́рнѧ", "fr": "Vêpres", "en": "Vespers"},
    ServiceType.MATINS: {"csy": "Ѹ́тренѧ", "fr": "Matines", "en": "Matins"},
    ServiceType.VIGIL: {"csy": "Всено́щное бдѣ́нїе", "fr": "Vigile nocturne", "en": "All-Night Vigil"},
    ServiceType.HOURS: {"csy": "Часы́", "fr": "Heures", "en": "Hours"},
    ServiceType.LITURGY: {"csy": "Літургі́ѧ", "fr": "Liturgie", "en": "Liturgy"},
    ServiceType.COMPLINE: {"csy": "Повече́рїе", "fr": "Complies", "en": "Compline"},
    ServiceType.MIDNIGHT: {"csy": "Полꙋно́щница", "fr": "Office de minuit", "en": "Midnight Office"},
    ServiceType.TYPICA: {"csy": "Тѵпика́льны", "fr": "Typika", "en": "Typika"},
    ServiceType.PRESANCTIFIED: {"csy": "Літургі́ѧ преждеосвѧще́нныхъ", "fr": "Liturgie des Saints Dons présanctifiés", "en": "Presanctified Liturgy"},
}