"""Typikon Engine — Calendar module.

Computes liturgical date information: Pascha date, tone, week from Pascha,
liturgical period, fasting type, and kathisma schedule (Typikon Ch. 17).
"""
from __future__ import annotations

from datetime import date, timedelta
from enum import StrEnum


class LiturgicalPeriod(StrEnum):
    PENTECOSTARION = "pentecostarion"
    ORDINARY = "ordinary"
    PRE_LENT = "pre_lent"
    GREAT_LENT = "great_lent"
    HOLY_WEEK = "holy_week"


class EngineFastingType(StrEnum):
    NONE = "none"
    WEDNESDAY_FRIDAY = "wednesday_friday"
    PHARISEE_WEEK = "pharisee_week"
    CHEESEFARE = "cheesefare"
    GREAT_LENT = "great_lent"
    APOSTLES = "apostles"
    DORMITION = "dormition"
    NATIVITY = "nativity"


JULIAN_OFFSET = 13  # for 1900-2099

_DAY_NAMES = {
    0: "sunday", 1: "monday", 2: "tuesday", 3: "wednesday",
    4: "thursday", 5: "friday", 6: "saturday",
}


def julian_to_gregorian(julian: date) -> date:
    return julian + timedelta(days=JULIAN_OFFSET)


def gregorian_to_julian(gregorian: date) -> date:
    return gregorian - timedelta(days=JULIAN_OFFSET)


class Paschalion:
    """Compute Orthodox Pascha date for a given year (Julian calendar)."""

    def __init__(self, year: int):
        self.year = year
        self.pascha_julian = self._compute(year)

    @staticmethod
    def _compute(year: int) -> date:
        """Compute Orthodox Pascha using the Meeus Julian algorithm.

        Returns the Julian calendar date of Pascha. Add 13 days for the
        Gregorian equivalent (valid 1900-2099).
        """
        a = year % 4
        b = year % 7
        c = year % 19
        d = (19 * c + 15) % 30
        e = (2 * a + 4 * b - d + 34) % 7
        month = (d + e + 114) // 31
        day = ((d + e + 114) % 31) + 1
        return date(year, month, day)


class LiturgicalCalendar:
    """High-level liturgical calendar for a given date."""

    def __init__(self, target_date: date, calendar_style: str = "new"):
        self.target_date = target_date
        self.calendar_style = calendar_style
        if calendar_style == "old":
            self.julian_date = target_date
            self.gregorian_date = julian_to_gregorian(target_date)
        else:
            self.gregorian_date = target_date
            self.julian_date = gregorian_to_julian(target_date)

        self.year = self.julian_date.year
        self.pascha_julian = Paschalion._compute(self.year)
        self.days_from_pascha = (self.julian_date - self.pascha_julian).days
        self.week_from_pascha = self.days_from_pascha // 7

    def get_tone(self) -> int:
        """Compute the Octoechos tone (1-8) for the current week.

        Pascha week (week 0) = Tone 1, Thomas Sunday (week 1) = Tone 2, etc.
        Wraps after Tone 8 back to Tone 1.
        """
        if self.days_from_pascha >= 0:
            tone = (self.week_from_pascha % 8) + 1
        else:
            prev_pascha = Paschalion._compute(self.year - 1)
            weeks_from_prev = (self.julian_date - prev_pascha).days // 7
            tone = (weeks_from_prev % 8) + 1
        return tone

    def get_liturgical_day(self) -> dict:
        dow = (self.gregorian_date.weekday() + 1) % 7
        period = _determine_period(self.julian_date, self.pascha_julian)
        fasting = _determine_fasting(self.julian_date, self.pascha_julian, dow, period)

        return {
            "gregorian_date": self.gregorian_date.isoformat(),
            "julian_date": self.julian_date.isoformat(),
            "pascha_julian": self.pascha_julian.isoformat(),
            "pascha_gregorian": julian_to_gregorian(self.pascha_julian).isoformat(),
            "days_from_pascha": self.days_from_pascha,
            "week_from_pascha": self.week_from_pascha,
            "tone": self.get_tone(),
            "day_of_week": dow,
            "day_of_week_name": _DAY_NAMES.get(dow, "unknown"),
            "period": period.value,
            "fasting": fasting.value,
        }

    def get_kathismata(self, service_type: str = "matins") -> list[int]:
        dow = (self.gregorian_date.weekday() + 1) % 7
        period = _determine_period(self.julian_date, self.pascha_julian)
        k = _compute_kathismata(dow, period)
        return k.get(service_type, [])


def compute_pascha(year: int) -> date:
    """Compute Orthodox Pascha for a given year (Julian calendar date)."""
    return Paschalion._compute(year)


def compute_liturgical_date(target_date: date, calendar_style: str = "new") -> dict:
    """Compute full liturgical information for a given date."""
    cal = LiturgicalCalendar(target_date, calendar_style)
    result = cal.get_liturgical_day()
    result["kathismata"] = _compute_kathismata(result["day_of_week"], LiturgicalPeriod(result["period"]))
    return result


def _determine_period(julian_date: date, pascha: date) -> LiturgicalPeriod:
    d = (julian_date - pascha).days
    if 0 <= d <= 56:
        return LiturgicalPeriod.PENTECOSTARION
    if -7 <= d < 0:
        return LiturgicalPeriod.HOLY_WEEK
    if -48 <= d < -7:
        return LiturgicalPeriod.GREAT_LENT
    if -70 <= d < -48:
        return LiturgicalPeriod.PRE_LENT
    return LiturgicalPeriod.ORDINARY


def _determine_fasting(
    julian_date: date, pascha: date, dow: int, period: LiturgicalPeriod,
) -> EngineFastingType:
    d = (julian_date - pascha).days
    if -70 <= d <= -64:
        return EngineFastingType.PHARISEE_WEEK
    if period in (LiturgicalPeriod.GREAT_LENT, LiturgicalPeriod.HOLY_WEEK):
        return EngineFastingType.GREAT_LENT
    if -55 <= d <= -49:
        return EngineFastingType.CHEESEFARE
    if dow in (3, 5):
        return EngineFastingType.WEDNESDAY_FRIDAY
    return EngineFastingType.NONE


def _compute_kathismata(dow: int, period: LiturgicalPeriod) -> dict[str, list[int]]:
    if period == LiturgicalPeriod.GREAT_LENT:
        return _kathismata_lent(dow)
    return _kathismata_ordinary(dow)


def _kathismata_ordinary(dow: int) -> dict[str, list[int]]:
    return {
        0: {"vespers": [], "matins": [2, 3]},
        1: {"vespers": [], "matins": [4, 5]},
        2: {"vespers": [], "matins": [7, 8]},
        3: {"vespers": [], "matins": [10, 11]},
        4: {"vespers": [], "matins": [13, 14]},
        5: {"vespers": [], "matins": [19, 20]},
        6: {"vespers": [1], "matins": [16, 17]},
    }.get(dow, {"vespers": [], "matins": []})


def _kathismata_lent(dow: int) -> dict[str, list[int]]:
    return {
        0: {"vespers": [], "matins": [2, 3]},
        1: {"vespers": [], "matins": [4, 5, 6]},
        2: {"vespers": [], "matins": [10, 11, 12]},
        3: {"vespers": [], "matins": [19, 20, 1]},
        4: {"vespers": [], "matins": [6, 7, 8]},
        5: {"vespers": [], "matins": [13, 14, 15]},
        6: {"vespers": [1, 2, 3], "matins": [16, 17]},
    }.get(dow, {"vespers": [], "matins": []})
