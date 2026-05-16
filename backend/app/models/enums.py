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
    FR = "fr"
    RU = "ru"


class FeastRank(StrEnum):
    GREAT = "great"
    MIDDLE_CROSS = "middle_cross"
    MIDDLE = "middle"
    LESSER_POLYLEOS = "lesser_polyleos"
    SIX_VERSES = "six_verses"
    SIMPLE = "simple"


class FastingType(StrEnum):
    NONE = "none"
    STRICT = "strict"
    FISH = "fish"
    OIL = "oil"
    NO_OIL = "no_oil"


class DayOfWeek(StrEnum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class LiturgicalPeriod(StrEnum):
    PENTECOSTARION = "pentecostarion"
    TRIODION = "triodion"
    OCTOECHOS = "octoechos"


class SaintCategory(StrEnum):
    MARTYR = "martyr"
    HIERARCH = "hierarch"
    UNMERCENARY = "unmercenary"
    EQUAL_TO_THE_APOSTLES = "equal_to_apostles"
    VENERABLE = "venerable"
    PROPHET = "prophet"
    PATRIARCH = "patriarch"
    RIGHTEOUS = "righteous"


# ── Bilingual book metadata ──

BOOK_NAMES: dict[BookCode, dict[str, str]] = {
    BookCode.GOSPEL: {"fr": "Évangile", "ru": "Евангелие"},
    BookCode.APOSTOL: {"fr": "Apôtre", "ru": "Апостол"},
    BookCode.PSALTER: {"fr": "Psauttier", "ru": "Псалтирь"},
    BookCode.LITURGICON: {"fr": "Liturgicon", "ru": "Служебник"},
    BookCode.HOROLOGION: {"fr": "Horologion", "ru": "Часослов"},
    BookCode.OCTOECHOS: {"fr": "Octoéchos", "ru": "Октоих"},
    BookCode.MENAION_MONTHLY: {"fr": "Ménée mensuelle", "ru": "Минея месячная"},
    BookCode.MENAION_FESTAL: {"fr": "Ménée festive", "ru": "Минея праздничная"},
    BookCode.MENAION_GENERAL: {"fr": "Ménée générale", "ru": "Минея общая"},
    BookCode.TRIODION: {"fr": "Triode de Carême", "ru": "Триодь постная"},
    BookCode.PENTECOSTARION: {"fr": "Triode fleurie", "ru": "Триодь цветная"},
    BookCode.IRMOLOGION: {"fr": "Irmologion", "ru": "Ирмологий"},
    BookCode.TYPIKON: {"fr": "Typikon", "ru": "Типикон"},
    BookCode.EUCHOLOGION: {"fr": "Euchologion", "ru": "Требник"},
    BookCode.HIERATICON: {"fr": "Hiératikon", "ru": "Архиерейский чиновник"},
    BookCode.PROLOGUE: {"fr": "Prologue", "ru": "Пролог"},
    BookCode.TROPARION: {"fr": "Troparion", "ru": "Тропарион"},
}

SERVICE_NAMES: dict[ServiceType, dict[str, str]] = {
    ServiceType.VESPERS: {"fr": "Vêpres", "ru": "Вечерня"},
    ServiceType.MATINS: {"fr": "Matines", "ru": "Утреня"},
    ServiceType.VIGIL: {"fr": "Vigile nocturne", "ru": "Всенощное бдение"},
    ServiceType.HOURS: {"fr": "Heures", "ru": "Часы"},
    ServiceType.LITURGY: {"fr": "Liturgie", "ru": "Литургия"},
    ServiceType.COMPLINE: {"fr": "Complies", "ru": "Повечерие"},
    ServiceType.MIDNIGHT: {"fr": "Office de minuit", "ru": "Полунощница"},
    ServiceType.TYPICA: {"fr": "Typika", "ru": "Типика"},
    ServiceType.PRESANCTIFIED: {"fr": "Liturgie des Saints Dons présanctifiés", "ru": "Литургия преждеосвящённых Даров"},
}
