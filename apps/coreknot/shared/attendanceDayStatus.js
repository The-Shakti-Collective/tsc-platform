/**
 * Derive present / half-day / leave from daily log hours and optional attendance row.
 *
 * Rules (aligned with 8h daily goal elsewhere in CoreKnot):
 * - Present (full day): logged hours >= 5
 * - Half day: 4 <= logged hours < 5
 * - Absent / empty: logged hours < 4 and no check-in/out
 * - Explicit leave / half-day flags on attendance row respected when no qualifying log hours
 */

const PRESENT_MIN_HOURS = 5;
const HALF_DAY_MIN_HOURS = 4;

const resolveAttendanceDayStatus = ({
  logHours = 0,
  onLeave = false,
  isHalfDay = false,
  hasCheck = false,
} = {}) => {
  const hours = Number(logHours) || 0;

  if (hours >= PRESENT_MIN_HOURS) return 'present';
  if (hours >= HALF_DAY_MIN_HOURS && hours < PRESENT_MIN_HOURS) return 'halfDay';

  if (onLeave && !hasCheck) return 'leave';
  if (isHalfDay) return 'halfDay';
  if (hasCheck) return 'present';

  return 'empty';
};

module.exports = {
  PRESENT_MIN_HOURS,
  HALF_DAY_MIN_HOURS,
  resolveAttendanceDayStatus,
};
