import { createEvents } from 'ics';

export function exportEventsToICS(events) {
  const icsEvents = events.map(ev => {
    const startDate = new Date(ev.dateTime);
    const year = startDate.getFullYear();
    const month = startDate.getMonth() + 1;
    const day = startDate.getDate();
    const hour = startDate.getHours();
    const minute = startDate.getMinutes();

    return {
      title: ev.title,
      description: ev.description || '',
      start: [year, month, day, hour, minute],
      duration: { hours: 1 },
      status: 'CONFIRMED',
      categories: ev.category ? [ev.category] : [],
    };
  });

  createEvents(icsEvents, (error, value) => {
    if (error) {
      console.error(error);
      alert('Failed to generate calendar file.');
      return;
    }
    const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'events.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}
