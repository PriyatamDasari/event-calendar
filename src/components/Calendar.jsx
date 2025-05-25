import React, { useState, useEffect } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth
} from 'date-fns';
import EventForm from './EventForm';
import { isEventOnDate } from '../utils/recurrence';
import DraggableEvent from './DraggableEvent';
import DroppableCell from './DroppableCell';
import { exportEventsToICS } from '../utils/icalExport';

function hasEventConflict(events, eventToMove, newDateTime) {
  const newDate = new Date(newDateTime);
  return events.some(ev => {
    if (ev.id === eventToMove.id) return false;
    if (ev.recurrence && ev.recurrence !== "none") {
      return isEventOnDate(ev, newDate);
    }
    const evDate = new Date(ev.dateTime);
    return (
      evDate.getFullYear() === newDate.getFullYear() &&
      evDate.getMonth() === newDate.getMonth() &&
      evDate.getDate() === newDate.getDate() &&
      evDate.getHours() === newDate.getHours() &&
      evDate.getMinutes() === newDate.getMinutes()
    );
  });
}

function isToday(date) {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export default function Calendar() {
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('calendarEvents');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [mobileWeeklyView, setMobileWeeklyView] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const categories = Array.from(
    new Set(events.map(ev => ev.category).filter(Boolean))
  );

  const filteredEvents = events.filter(ev => {
    if (categoryFilter && ev.category !== categoryFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (ev.title && ev.title.toLowerCase().includes(term)) ||
        (ev.description && ev.description.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const nextMonth = () => setCurrentMonth(addDays(endOfMonth(currentMonth), 1));
  const prevMonth = () => setCurrentMonth(addDays(startOfMonth(currentMonth), -1));

  function handleDayClick(day) {
    setSelectedDate(day);
    setEditingEvent(null);
    setShowForm(true);
  }

  function handleEditEvent(event) {
    setEditingEvent(event);
    setShowForm(true);
    setSelectedDate(new Date(event.dateTime || event.date));
  }

  function handleDeleteEvent(id) {
    setEvents(events.filter(ev => ev.id !== id));
  }

  function handleSaveEvent(event) {
    if (!event || !event.title || !event.dateTime) {
      alert("Event data is missing required fields.");
      return;
    }
    if (editingEvent) {
      setEvents(events.map(ev => (ev.id === event.id ? event : ev)));
    } else {
      setEvents([...events, event]);
    }
    setShowForm(false);
    setEditingEvent(null);
  }

  function getEventTime(dateTime) {
    const d = new Date(dateTime);
    return { hours: d.getHours(), minutes: d.getMinutes() };
  }

  function handleRescheduleEvent(item, cellDate) {
    const draggedEvent = events.find(ev => ev.id === item.id);
    if (draggedEvent && (!draggedEvent.recurrence || draggedEvent.recurrence === "none")) {
      const { hours, minutes } = getEventTime(draggedEvent.dateTime);
      const newDate = new Date(cellDate);
      newDate.setHours(hours, minutes, 0, 0);

      if (hasEventConflict(events, draggedEvent, newDate)) {
        setConflictWarning({
          event: draggedEvent,
          targetDate: newDate
        });
        return;
      }

      setEvents(events =>
        events.map(ev =>
          ev.id === item.id
            ? { ...ev, dateTime: newDate.toISOString() }
            : ev
        )
      );
    }
  }

  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cellDate = new Date(day);
      days.push(
        <DroppableCell
          key={cellDate.toISOString()}
          onDrop={item => handleRescheduleEvent(item, cellDate)}
          canDropEvent={item => {
            const draggedEvent = events.find(ev => ev.id === item.id);
            if (!draggedEvent || (draggedEvent.recurrence && draggedEvent.recurrence !== "none")) return false;
            const { hours, minutes } = getEventTime(draggedEvent.dateTime);
            const newDate = new Date(cellDate);
            newDate.setHours(hours, minutes, 0, 0);
            if (hasEventConflict(events, draggedEvent, newDate)) return false;
            return true;
          }}
          className={`cell${!isSameMonth(cellDate, monthStart) ? ' disabled' : ''}${isToday(cellDate) ? ' today' : ''}`}
          onDoubleClick={() => handleDayClick(cellDate)}
        >
          <span>{format(cellDate, 'd')}</span>
          <div>
            {filteredEvents
              .filter(ev => ev.dateTime && isEventOnDate(ev, cellDate))
              .map((ev, idx) => (
                <DraggableEvent
                  event={ev}
                  canDrag={!ev.recurrence || ev.recurrence === "none"}
                  key={ev.id || idx}
                >
                  <div
                    style={{
                      background: ev.color || "#1976d2",
                      color: "#fff",
                      borderRadius: 4,
                      padding: "2px 6px",
                      marginTop: 2,
                      cursor: !ev.recurrence || ev.recurrence === "none" ? "move" : "pointer",
                      border: ev.recurrence && ev.recurrence !== "none" ? "2px dashed #1976d2" : undefined
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      handleEditEvent(ev);
                    }}
                    title={ev.description}
                  >
                    {ev.title}
                    <span
                      style={{
                        marginLeft: 8,
                        cursor: "pointer",
                        color: "#fff",
                        fontWeight: "bold"
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteEvent(ev.id);
                      }}
                    >
                      ×
                    </span>
                    {ev.recurrence && ev.recurrence !== "none" && (
                      <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.8 }} title="Recurring event">🔁</span>
                    )}
                  </div>
                </DraggableEvent>
              ))}
          </div>
        </DroppableCell>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="row" key={day.toISOString()}>
        {days}
      </div>
    );
    days = [];
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth <= 600;
  let displayedRows = rows;
  if (mobileWeeklyView && isMobile) {
    const today = new Date();
    const weekIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24 * 7));
    displayedRows = [rows[weekIndex]];
  }

  // Google Calendar import: opens Google Calendar's import page
  function handleGoogleCalendarImport() {
    exportEventsToICS(events);
    setTimeout(() => {
      window.open('https://calendar.google.com/calendar/u/0/r/import', '_blank');
    }, 1000);
  }

  return (
    <div>
      {/* Filter/search controls */}
      <div
        className="calendar-controls"
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap"
        }}
      >
        <input
          type="search"
          placeholder="Search events..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ccc",
            minWidth: 180,
            flex: "1 1 0"
          }}
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ccc",
            flex: "1 1 0"
          }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {(searchTerm || categoryFilter) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('');
            }}
            style={{
              padding: "8px 14px",
              borderRadius: 4,
              border: "none",
              background: "#eee",
              color: "#333",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Clear
          </button>
        )}

        {/* Export to iCal Button */}
        <button
          onClick={() => exportEventsToICS(events)}
          style={{
            padding: "8px 14px",
            borderRadius: 4,
            border: "none",
            background: "#4caf50",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Export All Events (.ics)
        </button>
        {/* Google Calendar Import Button */}
        <button
          onClick={handleGoogleCalendarImport}
          style={{
            padding: "8px 14px",
            borderRadius: 4,
            border: "none",
            background: "#4285F4",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Import to Google Calendar
        </button>
      </div>

      {/* Weekly view toggle for mobile */}
      {isMobile && (
        <button
          onClick={() => setMobileWeeklyView(v => !v)}
          style={{
            marginBottom: 10,
            padding: "8px 14px",
            borderRadius: 4,
            border: "none",
            background: "#1976d2",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          {mobileWeeklyView ? "Show Month" : "Show Week"}
        </button>
      )}

      <div className="calendar-header">
        <button onClick={prevMonth}>&lt;</button>
        <span>{format(currentMonth, 'MMMM yyyy')}</span>
        <button onClick={nextMonth}>&gt;</button>
      </div>
      <div className="calendar">
        <div className="row header">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div className="cell header" key={d}>{d}</div>
          ))}
        </div>
        {displayedRows}
      </div>
      {showForm && (
        <div className="modal-backdrop" onClick={() => { setShowForm(false); setEditingEvent(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <EventForm
              date={selectedDate}
              event={editingEvent}
              onSave={handleSaveEvent}
              onCancel={() => { setShowForm(false); setEditingEvent(null); }}
            />
          </div>
        </div>
      )}
      {conflictWarning && (
        <div className="modal-backdrop" onClick={() => setConflictWarning(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Event Conflict</h3>
            <p>
              There is already an event at {conflictWarning.targetDate.toLocaleString()}.
              <br />
              Please choose a different time or day.
            </p>
            <button
              style={{
                marginTop: 12,
                padding: "8px 18px",
                borderRadius: 4,
                background: "#1976d2",
                color: "#fff",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() => setConflictWarning(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
