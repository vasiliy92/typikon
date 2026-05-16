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
    RU = "ru"


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


BOOK_NAMES: dict[BookCode, dict[str, str]] = {
    BookCode.GOSPEL: {"csy": "Еѵангелїе", "fr": "Évangile", "en": "Gospel", "ru": "Евангелие"},
    BookCode.APOSTOL: {"csy": "А҆пⷭ҇лъ", "fr": "Apôtre", "en": "Apostol", "ru": "Апостол"},
    BookCode.PSALTER: {"csy": "Псалти́рь", "fr": "Psauttier", "en": "Psalter", "ru": "Псалтирь"},
    BookCode.LITURGICON: {"csy": "Слꙋже́бникъ", "fr": "Liturgicon", "en": "Liturgicon", "ru": "Служебник"},
    BookCode.HOROLOGION: {"csy": "Часослѡ́въ", "fr": "Horologion", "en": "Horologion", "ru": "Часослов"},
    BookCode.OCTOECHOS: {"csy": "Октѡ́ихъ", "fr": "Octoéchos", "en": "Octoechos", "ru": "Октоих"},
    BookCode.MENAION_MONTHLY: {"csy": "Мине́ѧ мѣсѧ́чнаѧ", "fr": "Ménée mensuelle", "en": "Monthly Menaion", "ru": "Минея месячная"},
    BookCode.MENAION_FESTAL: {"csy": "Мине́ѧ пра́здничнаѧ", "fr": "Ménée festive", "en": "Festal Menaion", "ru": "Минея праздничная"},
    BookCode.MENAION_GENERAL: {"csy": "Мине́ѧ ѡ҆́бщаѧ", "fr": "Ménée générale", "en": "General Menaion", "ru": "Минея общая"},
    BookCode.TRIODION: {"csy": "Трїѡ́дь постна́ѧ", "fr": "Triode de Carême", "en": "Lenten Triodion", "ru": "Триодь постная"},
    BookCode.PENTECOSTARION: {"csy": "Трїѡ́дь цвѣ́тнаѧ", "fr": "Triode fleurie", "en": "Pentecostarion", "ru": "Триодь цветная"},
    BookCode.IRMOLOGION: {"csy": "Ірмологі́й", "fr": "Irmologion", "en": "Irmologion", "ru": "Ирмологий"},
    BookCode.TYPIKON: {"csy": "Тѵпикѡ́нъ", "fr": "Typikon", "en": "Typikon", "ru": "Типикон"},
    BookCode.EUCHOLOGION: {"csy": "Тре́бникъ", "fr": "Euchologion", "en": "Euchologion", "ru": "Требник"},
    BookCode.HIERATICON: {"csy": "Архїере́йскїй чино́вникъ", "fr": "Hiératikon", "en": "Hieraticon", "ru": "Архиерейский чиновник"},
    BookCode.PROLOGUE: {"csy": "Проло́гъ", "fr": "Prologue", "en": "Prologue", "ru": "Пролог"},
    BookCode.TROPARION: {"csy": "Тропа́рїонъ", "fr": "Troparion", "en": "Troparion", "ru": "Тропарион"},
}

SERVICE_NAMES: dict[ServiceType, dict[str, str]] = {
    ServiceType.VESPERS: {"csy": "Вече́рнѧ", "fr": "Vêpres", "en": "Vespers", "ru": "Вечерня"},
    ServiceType.MATINS: {"csy": "Ѹ́тренѧ", "fr": "Matines", "en": "Matins", "ru": "Утреня"},
    ServiceType.VIGIL: {"csy": "Всено́щное бдѣ́нїе", "fr": "Vigile nocturne", "en": "All-Night Vigil", "ru": "Всенощное бдение"},
    ServiceType.HOURS: {"csy": "Часы́", "fr": "Heures", "en": "Hours", "ru": "Часы"},
    ServiceType.LITURGY: {"csy": "Літургі́ѧ", "fr": "Liturgie", "en": "Liturgy", "ru": "Литургия"},
    ServiceType.COMPLINE: {"csy": "Повече́рїе", "fr": "Complies", "en": "Compline", "ru": "Повечерие"},
    ServiceType.MIDNIGHT: {"csy": "Полꙋно́щница", "fr": "Office de minuit", "en": "Midnight Office", "ru": "Полунощница"},
    ServiceType.TYPICA: {"csy": "Тѵпика́льны", "fr": "Typika", "en": "Typika", "ru": "Типика"},
    ServiceType.PRESANCTIFIED: {"csy": "Літургі́ѧ преждеосвѧще́нныхъ", "fr": "Liturgie des Saints Dons présanctifiés", "en": "Presanctified Liturgy", "ru": "Литургия преждеосвящённых Даров"},
}