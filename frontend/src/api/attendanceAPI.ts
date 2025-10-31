import { supabaseService } from '../services/supabase';

// API endpoint handlers for attendance machines
export class AttendanceMachineAPI {
  
  // POST /api/attendance/punch
  // Real-time endpoint for attendance machines
  static async handleAttendancePunch(req: any, res: any) {
    try {
      const { 
        employee_id, 
        machine_id, 
        timestamp, 
        punch_type,
        location,
        device_info 
      } = req.body;

      // Validate required fields
      if (!employee_id || !machine_id || !timestamp || !punch_type) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: employee_id, machine_id, timestamp, punch_type'
        });
      }

      // Validate punch_type
      if (!['check-in', 'check-out'].includes(punch_type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid punch_type. Must be check-in or check-out'
        });
      }

      // Parse timestamp and get date
      const punchDateTime = new Date(timestamp);
      const date = punchDateTime.toISOString().split('T')[0];

      // Record attendance in database
      const attendanceData = await supabaseService.recordAttendanceFromMachine({
        employee_id: Number(employee_id),
        machine_id,
        timestamp: punchDateTime.toISOString(),
        punch_type,
        date,
        location: location || 'Office',
        device_info
      });

      // Log the punch for audit trail
      await supabaseService.logAttendancePunch({
        employee_id: Number(employee_id),
        machine_id,
        timestamp: punchDateTime.toISOString(),
        punch_type,
        location,
        device_info,
        processed_at: new Date().toISOString(),
        status: 'success'
      });

      res.status(200).json({
        success: true,
        message: `${punch_type} recorded successfully`,
        data: attendanceData.data,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Attendance punch error:', error);
      
      // Log failed punch for debugging
      try {
        await supabaseService.logAttendancePunch({
          employee_id: Number(req.body.employee_id),
          machine_id: req.body.machine_id,
          timestamp: req.body.timestamp,
          punch_type: req.body.punch_type,
          location: req.body.location,
          device_info: req.body.device_info,
          processed_at: new Date().toISOString(),
          status: 'failed',
          error_message: error.message
        });
      } catch (logError) {
        console.error('Failed to log punch error:', logError);
      }

      res.status(500).json({
        success: false,
        error: 'Failed to record attendance',
        message: error.message
      });
    }
  }

  // GET /api/attendance/employee/:employee_id/today
  // Get today's attendance for an employee (for machine display)
  static async getEmployeeAttendanceToday(req: any, res: any) {
    try {
      const { employee_id } = req.params;
      const today = new Date().toISOString().split('T')[0];

      const { data } = await supabaseService.getAttendance({
        employee_id: Number(employee_id),
        date: today
      });

      const todayAttendance = data?.[0] || null;

      res.status(200).json({
        success: true,
        data: {
          employee_id: Number(employee_id),
          date: today,
          check_in_time: todayAttendance?.check_in_time || null,
          check_out_time: todayAttendance?.check_out_time || null,
          status: todayAttendance?.status || 'Absent',
          working_hours: todayAttendance ? this.calculateWorkingHours(
            todayAttendance.check_in_time,
            todayAttendance.check_out_time
          ) : 0
        }
      });

    } catch (error: any) {
      console.error('Get employee attendance error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get attendance data',
        message: error.message
      });
    }
  }

  // POST /api/attendance/bulk
  // Bulk attendance upload for machine synchronization
  static async handleBulkAttendance(req: any, res: any) {
    try {
      const { attendance_records, machine_id } = req.body;

      if (!Array.isArray(attendance_records)) {
        return res.status(400).json({
          success: false,
          error: 'attendance_records must be an array'
        });
      }

      const results = [];
      const errors = [];

      for (const record of attendance_records) {
        try {
          const attendanceData = await supabaseService.recordAttendanceFromMachine({
            employee_id: Number(record.employee_id),
            machine_id: machine_id || record.machine_id,
            timestamp: new Date(record.timestamp).toISOString(),
            punch_type: record.punch_type,
            date: new Date(record.timestamp).toISOString().split('T')[0],
            location: record.location || 'Office',
            device_info: record.device_info
          });

          results.push({
            employee_id: record.employee_id,
            status: 'success',
            data: attendanceData.data
          });

        } catch (error: any) {
          errors.push({
            employee_id: record.employee_id,
            status: 'failed',
            error: error.message,
            record
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `Processed ${results.length} records successfully, ${errors.length} failed`,
        results: {
          successful: results,
          failed: errors,
          total_processed: attendance_records.length,
          success_count: results.length,
          error_count: errors.length
        }
      });

    } catch (error: any) {
      console.error('Bulk attendance error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process bulk attendance',
        message: error.message
      });
    }
  }

  // GET /api/attendance/machine/:machine_id/status
  // Machine health check and configuration
  static async getMachineStatus(req: any, res: any) {
    try {
      const { machine_id } = req.params;

      // Get machine configuration (you can extend this)
      const config = {
        machine_id,
        server_time: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        working_hours: {
          start: '09:00',
          end: '17:00',
          break_start: '12:00',
          break_end: '13:00'
        },
        late_threshold: '09:30',
        overtime_threshold: '17:00'
      };

      // Get recent activity for this machine
      const recentActivity = await supabaseService.getAttendanceMachineLogs({
        machine_id,
        limit: 10
      });

      res.status(200).json({
        success: true,
        data: {
          machine_id,
          status: 'online',
          last_sync: new Date().toISOString(),
          configuration: config,
          recent_activity: recentActivity.data || []
        }
      });

    } catch (error: any) {
      console.error('Machine status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get machine status',
        message: error.message
      });
    }
  }

  // Utility method to calculate working hours
  private static calculateWorkingHours(checkIn: string | null, checkOut: string | null): number {
    if (!checkIn || !checkOut) return 0;
    
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.round(diffHours * 100) / 100;
  }
}

// Express.js route setup example
export const setupAttendanceRoutes = (app: any) => {
  // Real-time attendance punch endpoint
  app.post('/api/attendance/punch', AttendanceMachineAPI.handleAttendancePunch);
  
  // Get employee's today attendance
  app.get('/api/attendance/employee/:employee_id/today', AttendanceMachineAPI.getEmployeeAttendanceToday);
  
  // Bulk attendance upload
  app.post('/api/attendance/bulk', AttendanceMachineAPI.handleBulkAttendance);
  
  // Machine status and configuration
  app.get('/api/attendance/machine/:machine_id/status', AttendanceMachineAPI.getMachineStatus);
  
  // Health check endpoint
  app.get('/api/attendance/health', (_req: any, res: any) => {
    res.json({
      success: true,
      service: 'HR Attendance API',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });
};

// WebSocket handler for real-time updates
export class AttendanceWebSocket {
  private static connectedClients: Set<any> = new Set();

  static setupWebSocket(io: any) {
    io.on('connection', (socket: any) => {
      console.log('Attendance machine connected:', socket.id);
      this.connectedClients.add(socket);

      // Handle machine registration
      socket.on('register_machine', (data: any) => {
        socket.machine_id = data.machine_id;
        socket.location = data.location;
        console.log(`Machine registered: ${data.machine_id} at ${data.location}`);
      });

      // Handle real-time attendance punch
      socket.on('attendance_punch', async (data: any) => {
        try {
          // Process the punch
          await AttendanceMachineAPI.handleAttendancePunch({
            body: {
              ...data,
              machine_id: socket.machine_id,
              location: socket.location
            }
          }, {
            status: (_code: number) => ({
              json: (response: any) => {
                // Broadcast to all connected clients
                io.emit('attendance_update', {
                  employee_id: data.employee_id,
                  punch_type: data.punch_type,
                  timestamp: data.timestamp,
                  machine_id: socket.machine_id,
                  success: response.success
                });
                
                // Send response back to machine
                socket.emit('punch_response', response);
              }
            })
          });
        } catch (error) {
          socket.emit('punch_error', {
            error: 'Failed to process punch',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      });

      socket.on('disconnect', () => {
        console.log('Attendance machine disconnected:', socket.id);
        this.connectedClients.delete(socket);
      });
    });
  }

  static broadcastAttendanceUpdate(data: any) {
    this.connectedClients.forEach(client => {
      client.emit('attendance_update', data);
    });
  }
}