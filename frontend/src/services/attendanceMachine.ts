import { supabase } from '../lib/supabase';

export interface AttendanceMachineConfig {
  machineId: string;
  ipAddress?: string;
  port?: number;
  protocol?: 'TCP' | 'UDP' | 'HTTP' | 'CLOUD';
  location: string;
  isActive: boolean;
  serialNumber?: string;
  cloudId?: string;
  cloudService?: string;
  devicePassword?: string;
}

export interface BiometricRecord {
  userId: string;
  timestamp: Date;
  type: 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT';
  deviceId: string;
  rawData?: any;
}

export interface MachineStatus {
  machineId: string;
  isConnected: boolean;
  isOnline?: boolean;
  lastHeartbeat?: Date;
  lastSync?: Date;
  deviceInfo?: any;
  errorMessage?: string;
  userCount?: number;
  recordCount?: number;
  fpCount?: number;
  faceCount?: number;
}

export interface Employee {
  userId: string;
  name: string;
  cardNumber?: string;
  fingerprintData?: string;
  isActive: boolean;
}

export class AttendanceMachineService {
  private machines: Map<string, AttendanceMachineConfig> = new Map();
  private connections: Map<string, boolean> = new Map();
  private lastHeartbeat: Map<string, Date> = new Map();

  constructor() {
    console.log('Generic Attendance Machine Service initialized');
  }

  async addMachine(config: AttendanceMachineConfig): Promise<boolean> {
    try {
      if (!config.machineId || !config.location) {
        throw new Error('Machine ID and location are required');
      }

      this.machines.set(config.machineId, config);

      const { error } = await supabase
        .from('attendance_machines')
        .upsert({
          machine_id: config.machineId,
          ip_address: config.ipAddress,
          port: config.port,
          protocol: config.protocol,
          location: config.location,
          is_active: config.isActive,
          serial_number: config.serialNumber,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;

    } catch (error) {
      console.error('Failed to add machine:', error);
      return false;
    }
  }

  async connectMachine(machineId: string): Promise<boolean> {
    try {
      const config = this.machines.get(machineId);
      if (!config) {
        throw new Error(`Machine ${machineId} not found`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      this.connections.set(machineId, true);
      this.lastHeartbeat.set(machineId, new Date());

      return true;

    } catch (error) {
      console.error('Failed to connect to machine:', error);
      this.connections.set(machineId, false);
      return false;
    }
  }

  async disconnectMachine(machineId: string): Promise<boolean> {
    try {
      this.connections.set(machineId, false);
      return true;
    } catch (error) {
      console.error('Failed to disconnect from machine:', error);
      return false;
    }
  }

  async getMachineStatus(machineId: string): Promise<MachineStatus> {
    const config = this.machines.get(machineId);
    const isConnected = this.connections.get(machineId) || false;
    const lastHeartbeat = this.lastHeartbeat.get(machineId);

    return {
      machineId,
      isConnected,
      isOnline: isConnected,
      lastHeartbeat,
      lastSync: lastHeartbeat,
      userCount: 0, // Default values for generic implementation
      recordCount: 0,
      fpCount: 0,
      faceCount: 0,
      deviceInfo: config ? {
        location: config.location,
        protocol: config.protocol,
        ipAddress: config.ipAddress,
        port: config.port
      } : undefined
    };
  }

  async getAttendanceRecords(machineId: string, startDate?: Date, endDate?: Date): Promise<BiometricRecord[]> {
    try {
      const { data, error } = await supabase
        .from('attendance_machine_logs')
        .select('*')
        .eq('machine_id', machineId)
        .gte('timestamp', startDate?.toISOString() || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .lte('timestamp', endDate?.toISOString() || new Date().toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const records: BiometricRecord[] = (data || []).map((record: any) => ({
        userId: record.user_id,
        timestamp: new Date(record.timestamp),
        type: record.log_type as 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT',
        deviceId: record.machine_id,
        rawData: record.raw_data
      }));

      return records;

    } catch (error) {
      console.error('Failed to get attendance records:', error);
      return [];
    }
  }

  getAllMachines(): AttendanceMachineConfig[] {
    return Array.from(this.machines.values());
  }

  getActiveConnections(): string[] {
    const active: string[] = [];
    this.connections.forEach((isConnected, machineId) => {
      if (isConnected) {
        active.push(machineId);
      }
    });
    return active;
  }

  async simulateAttendanceRecord(machineId: string, userId: string, type: 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('attendance_machine_logs')
        .insert({
          user_id: userId,
          machine_id: machineId,
          timestamp: new Date().toISOString(),
          log_type: type
        });

      if (error) throw error;
      return true;

    } catch (error) {
      console.error('Failed to simulate attendance record:', error);
      return false;
    }
  }

  /**
   * Test connection to a machine
   */
  async testConnection(config: AttendanceMachineConfig): Promise<boolean> {
    try {
      console.log(`Testing connection to ${config.machineId} at ${config.ipAddress}:${config.port}`);
      
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return success for valid IP addresses
      if (config.ipAddress && config.ipAddress.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
        return true;
      }
      
      return false;

    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const attendanceMachineService = new AttendanceMachineService();
