// src/utils/recurrence.js

export function isEventOnDate(event, cellDate) {
  const eventDate = new Date(event.dateTime || event.date);

  // One-time event
  if (!event.recurrence || event.recurrence === "none") {
    return (
      eventDate.getFullYear() === cellDate.getFullYear() &&
      eventDate.getMonth() === cellDate.getMonth() &&
      eventDate.getDate() === cellDate.getDate()
    );
  }

  // Daily
  if (event.recurrence === "daily") {
    return cellDate >= eventDate;
  }

  // Weekly
  if (event.recurrence === "weekly") {
    return (
      cellDate >= eventDate &&
      cellDate.getDay() === eventDate.getDay()
    );
  }

  // Monthly
  if (event.recurrence === "monthly") {
    return (
      cellDate >= eventDate &&
      cellDate.getDate() === eventDate.getDate()
    );
  }

  // Yearly
  if (event.recurrence === "yearly") {
    return (
      cellDate >= eventDate &&
      cellDate.getDate() === eventDate.getDate() &&
      cellDate.getMonth() === eventDate.getMonth()
    );
  }

  // Custom (every 2 weeks as example)
  if (event.recurrence === "custom") {
    const diffDays = Math.floor((cellDate - eventDate) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays % 14 === 0;
  }

  return false;
}
