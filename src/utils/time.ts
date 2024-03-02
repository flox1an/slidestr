export function timeDifference(current: number, previous: number) {
  const sPerMinute = 60;
  const sPerHour = sPerMinute * 60;
  const sPerDay = sPerHour * 24;
  const sPerMonth = sPerDay * 30;
  const sPerYear = sPerDay * 365;

  const elapsed = current - previous;

  if (elapsed < 10) {
    return 'now';
  }
  if (elapsed < sPerMinute) {
    return Math.round(elapsed) + ' s';
  } else if (elapsed < sPerHour) {
    return Math.round(elapsed / sPerMinute) + ' m';
  } else if (elapsed < sPerDay) {
    return Math.round(elapsed / sPerHour) + ' h';
  } else if (elapsed < sPerMonth) {
    return Math.round(elapsed / sPerDay) + ' d';
  } else if (elapsed < sPerYear) {
    return Math.round(elapsed / sPerMonth) + ' M';
  } else {
    return Math.round(elapsed / sPerYear) + ' Y';
  }
}
