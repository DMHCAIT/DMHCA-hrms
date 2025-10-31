import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
} from '@mui/material';
import {
  Add,
  Event,
  Today,
  Group,
  EventAvailable,
  Work,
  Celebration,
} from '@mui/icons-material';
import { useHR } from '../contexts/HRContext';
import type { CalendarEvent } from '../types';

const Calendar: React.FC = () => {
  const { calendarEvents, addCalendarEvent } = useHR();
  const [openDialog, setOpenDialog] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Meeting' as CalendarEvent['type'],
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    isAllDay: false,
  });

  const handleSubmitEvent = () => {
    if (formData.title && formData.date) {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

      addCalendarEvent({
        title: formData.title,
        description: formData.description,
        start: startDateTime,
        end: endDateTime,
        type: formData.type,
        location: formData.location,
        isAllDay: formData.isAllDay,
      });

      setFormData({
        title: '',
        description: '',
        type: 'Meeting',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        location: '',
        isAllDay: false,
      });
      setOpenDialog(false);
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      Meeting: 'primary',
      Holiday: 'error',
      Event: 'info',
      Leave: 'warning',
      Birthday: 'success',
      Training: 'secondary',
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  const getEventTypeIcon = (type: string) => {
    const icons = {
      Meeting: <Group />,
      Holiday: <EventAvailable />,
      Event: <Event />,
      Leave: <Today />,
      Birthday: <Celebration />,
      Training: <Work />,
    };
    return icons[type as keyof typeof icons] || <Event />;
  };

  // Get today's events
  const today = new Date();
  const todayEvents = calendarEvents.filter(event => 
    event.start.toDateString() === today.toDateString()
  );

  // Get upcoming events (next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  const upcomingEvents = calendarEvents.filter(event =>
    event.start > today && event.start <= nextWeek
  );

  // Generate a simple calendar grid for the current month
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Calendar & Events
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          sx={{ borderRadius: 2 }}
        >
          Add Event
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Calendar Grid */}
        <Box sx={{ flex: 2 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
                {monthNames[currentMonth]} {currentYear}
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Box key={day}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        textAlign: 'center', 
                        fontWeight: 600, 
                        color: 'primary.main',
                        p: 1 
                      }}
                    >
                      {day}
                    </Typography>
                  </Box>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((day, index) => {
                  const currentDate = day ? new Date(currentYear, currentMonth, day) : null;
                  const dayEvents = currentDate ? calendarEvents.filter(event =>
                    event.start.toDateString() === currentDate.toDateString()
                  ) : [];
                  
                  return (
                    <Box key={index}>
                      <Paper
                        sx={{
                          height: 80,
                          p: 1,
                          bgcolor: day ? 'background.paper' : 'grey.50',
                          border: day && day === today.getDate() && 
                                 currentMonth === today.getMonth() && 
                                 currentYear === today.getFullYear() 
                                 ? 2 : 1,
                          borderColor: day && day === today.getDate() && 
                                      currentMonth === today.getMonth() && 
                                      currentYear === today.getFullYear() 
                                      ? 'primary.main' : 'divider',
                          cursor: day ? 'pointer' : 'default',
                          '&:hover': day ? {
                            bgcolor: 'action.hover'
                          } : {},
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {day && (
                          <>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: day === today.getDate() && 
                                           currentMonth === today.getMonth() && 
                                           currentYear === today.getFullYear() 
                                           ? 600 : 400,
                                color: day === today.getDate() && 
                                       currentMonth === today.getMonth() && 
                                       currentYear === today.getFullYear() 
                                       ? 'primary.main' : 'text.primary'
                              }}
                            >
                              {day}
                            </Typography>
                            {dayEvents.length > 0 && (
                              <Box sx={{ mt: 0.5 }}>
                                {dayEvents.slice(0, 2).map((event, idx) => (
                                  <Box
                                    key={idx}
                                    sx={{
                                      width: '100%',
                                      height: 4,
                                      bgcolor: `${getEventTypeColor(event.type)}.main`,
                                      borderRadius: 1,
                                      mb: 0.5,
                                    }}
                                  />
                                ))}
                                {dayEvents.length > 2 && (
                                  <Typography variant="caption" color="text.secondary">
                                    +{dayEvents.length - 2} more
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </>
                        )}
                      </Paper>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Event Lists */}
        <Box sx={{ flex: 1 }}>
          {/* Today's Events */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Today's Events
              </Typography>
              <List sx={{ p: 0 }}>
                {todayEvents.length > 0 ? (
                  todayEvents.map((event) => (
                    <ListItem key={event.id} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getEventTypeIcon(event.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={event.title}
                        secondary={`${event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      />
                      <Chip
                        label={event.type}
                        color={getEventTypeColor(event.type) as any}
                        size="small"
                        variant="outlined"
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No events scheduled for today
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Upcoming Events
              </Typography>
              <List sx={{ p: 0 }}>
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.slice(0, 5).map((event) => (
                    <ListItem key={event.id} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getEventTypeIcon(event.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={event.title}
                        secondary={`${event.start.toLocaleDateString()} at ${event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      />
                      <Chip
                        label={event.type}
                        color={getEventTypeColor(event.type) as any}
                        size="small"
                        variant="outlined"
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No upcoming events in the next 7 days
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Add Event Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Event sx={{ mr: 1, color: 'primary.main' }} />
            Add New Event
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Event Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <FormControl fullWidth required>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CalendarEvent['type'] })}
                label="Event Type"
              >
                <MenuItem value="Meeting">Meeting</MenuItem>
                <MenuItem value="Holiday">Holiday</MenuItem>
                <MenuItem value="Event">Event</MenuItem>
                <MenuItem value="Leave">Leave</MenuItem>
                <MenuItem value="Birthday">Birthday</MenuItem>
                <MenuItem value="Training">Training</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Start Time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Time"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <TextField
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitEvent}
            disabled={!formData.title || !formData.date}
          >
            Add Event
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar;