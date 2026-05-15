"""Tests for the Paschalion and LiturgicalCalendar engine."""
from datetime import date

import pytest

from app.engine.calendar import (
    EngineFastingType,
    LiturgicalCalendar,
    LiturgicalPeriod,
    Paschalion,
    compute_liturgical_date,
    compute_pascha,
    gregorian_to_julian,
    julian_to_gregorian,
)


class TestPaschalion:
    """Test Orthodox Pascha computation using known dates."""

    KNOWN_PASCHAS = {
        2024: (4, 22),  # May 5 Gregorian
        2025: (4, 7),   # April 20 Gregorian
        2026: (3, 30),  # April 12 Gregorian
        2027: (4, 19),  # May 2 Gregorian
        2030: (4, 15),  # April 28 Gregorian
        2000: (4, 17),  # April 30 Gregorian
        2017: (4, 3),   # April 16 Gregorian
    }

    def test_pascha_2024(self):
        p = Paschalion(2024)
        assert p.pascha_julian.month == 4
        assert p.pascha_julian.day == 22

    def test_pascha_2026(self):
        p = Paschalion(2026)
        assert p.pascha_julian.month == 3
        assert p.pascha_julian.day == 30

    def test_pascha_2030(self):
        p = Paschalion(2030)
        assert p.pascha_julian.month == 4
        assert p.pascha_julian.day == 15

    def test_pascha_always_sunday(self):
        """Pascha must always fall on a Sunday (Gregorian)."""
        for year in range(2000, 2050):
            p = compute_pascha(year)
            gregorian = julian_to_gregorian(p)
            assert gregorian.weekday() == 6, f"Pascha {year} is not Sunday: {gregorian}"

    def test_pascha_after_jewish_passover(self):
        """Orthodox Pascha must be after the vernal equinox (March 21 Julian)."""
        for year in range(2000, 2050):
            p = compute_pascha(year)
            assert p.month >= 3, f"Pascha {year} before March: {p}"
            if p.month == 3:
                assert p.day >= 21, f"Pascha {year} before equinox: {p}"


class TestJulianGregorianConversion:
    def test_roundtrip(self):
        gregorian = date(2026, 5, 11)
        julian = gregorian_to_julian(gregorian)
        back = julian_to_gregorian(julian)
        assert back == gregorian

    def test_known_conversion(self):
        julian = date(2026, 4, 12)
        gregorian = julian_to_gregorian(julian)
        assert gregorian == date(2026, 4, 25)

    def test_offset_is_13_days(self):
        gregorian = date(2026, 1, 1)
        julian = gregorian_to_julian(gregorian)
        assert (gregorian - julian).days == 13


class TestLiturgicalCalendar:
    def test_tone_on_pascha(self):
        """Tone on Pascha itself should be 1."""
        pascha_j = compute_pascha(2026)
        cal = LiturgicalCalendar(pascha_j, "old")
        info = cal.get_liturgical_day()
        assert info["tone"] == 1

    def test_tone_on_thomas_sunday(self):
        """Tone on Thomas Sunday (1 week after Pascha) should be 2."""
        pascha_j = compute_pascha(2026)
        thomas = pascha_j + __import__("datetime").timedelta(days=7)
        cal = LiturgicalCalendar(thomas, "old")
        info = cal.get_liturgical_day()
        assert info["tone"] == 2

    def test_tone_cycles_every_8_weeks(self):
        """Tone should cycle 1-8 and repeat."""
        pascha_j = compute_pascha(2026)
        for week in range(25):
            d = pascha_j + __import__("datetime").timedelta(days=7 * week)
            cal = LiturgicalCalendar(d, "old")
            info = cal.get_liturgical_day()
            expected = (week % 8) + 1
            assert info["tone"] == expected, f"Week {week}: got tone {info['tone']}, expected {expected}"

    def test_period_pascha(self):
        pascha_j = compute_pascha(2026)
        cal = LiturgicalCalendar(pascha_j, "old")
        info = cal.get_liturgical_day()
        assert info["period"] == LiturgicalPeriod.PENTECOSTARION.value

    def test_period_great_lent(self):
        pascha_j = compute_pascha(2026)
        mid_lent = pascha_j - __import__("datetime").timedelta(days=25)
        cal = LiturgicalCalendar(mid_lent, "old")
        info = cal.get_liturgical_day()
        assert info["period"] == LiturgicalPeriod.GREAT_LENT.value

    def test_period_ordinary(self):
        cal = LiturgicalCalendar(date(2026, 9, 1), "new")
        info = cal.get_liturgical_day()
        assert info["period"] == LiturgicalPeriod.ORDINARY.value

    def test_fasting_wednesday(self):
        cal = LiturgicalCalendar(date(2026, 9, 2), "new")
        info = cal.get_liturgical_day()
        assert info["fasting"] in (
            EngineFastingType.WEDNESDAY_FRIDAY.value,
            EngineFastingType.NONE.value,
        )

    def test_kathismata_sunday_ordinary(self):
        cal = LiturgicalCalendar(date(2026, 9, 6), "new")
        k = cal.get_kathismata("matins")
        assert k == [2, 3]

    def test_kathismata_saturday_ordinary(self):
        cal = LiturgicalCalendar(date(2026, 9, 5), "new")
        k = cal.get_kathismata("matins")
        assert k == [16, 17]

    def test_kathismata_saturday_vespers(self):
        cal = LiturgicalCalendar(date(2026, 9, 5), "new")
        k = cal.get_kathismata("vespers")
        assert k == [1]


class TestComputeLiturgicalDate:
    def test_returns_dict(self):
        result = compute_liturgical_date(date(2026, 5, 11), "new")
        assert isinstance(result, dict)
        assert "tone" in result
        assert "period" in result
        assert "kathismata" in result