// Day helpers. The plan uses 0 = Monday ... 6 = Sunday (JavaScript's getDay() has 0 = Sunday).

export const todayIndex = () => (new Date().getDay() + 6) % 7
