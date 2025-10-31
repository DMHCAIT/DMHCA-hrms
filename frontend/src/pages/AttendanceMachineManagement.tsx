import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Add,
  Settings,
  CheckCircle,
  Cancel,
  Refresh,
  Wifi,
  WifiOff,
  Computer,
  Fingerprint,
  Face,
  Schedule,
  Person,
  Storage,
  CloudSync,
  Warning,
  PlayArrow,
  Stop,
  Science
} from '@mui/icons-material';
import { attendanceMachineService } from '../services/attendanceMachine';
import type { 
  AttendanceMachineConfig, 
  MachineStatus 
} from '../services/attendanceMachine';

const AttendanceMachineManagement: React.FC = () => {
  const [machines, setMachines] = useState<AttendanceMachineConfig[]>([]);
  const [machineStatuses, setMachineStatuses] = useState<Map<string, MachineStatus>>(new Map());
  const [openDialog, setOpenDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [newMachine, setNewMachine] = useState<Partial<AttendanceMachineConfig>>({
    machineId: '',
    ipAddress: '192.168.1.100',
    port: 4370,
    protocol: 'TCP',
    location: 'Main Office',
    isActive: true,
    serialNumber: ''
  });
  const [connectionTest, setConnectionTest] = useState<{ [key: string]: boolean | null }>({});

  useEffect(() => {
    loadMachines();
    loadMachineStatuses();
    
    // Refresh statuses every 30 seconds
    const interval = setInterval(loadMachineStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMachines = () => {
    const machineList = attendanceMachineService.getAllMachines();
    setMachines(machineList);
  };

  const loadMachineStatuses = async () => {
    const statusMap = new Map<string, MachineStatus>();
    
    for (const machine of machines) {
      try {
        const status = await attendanceMachineService.getMachineStatus(machine.machineId);
        if (status) {
          statusMap.set(machine.machineId, status);
        }
      } catch (error) {
        console.error(`Failed to get status for ${machine.machineId}:`, error);
      }
    }
    
    setMachineStatuses(statusMap);
  };

  const handleAddMachine = async () => {
    if (!newMachine.machineId || !newMachine.ipAddress) {
      return;
    }

    setLoading(true);
    try {
      await attendanceMachineService.addMachine(newMachine as AttendanceMachineConfig);
      loadMachines();
      setOpenDialog(false);
      setNewMachine({
        machineId: '',
        ipAddress: '192.168.1.100',
        port: 4370,
        protocol: 'TCP',
        location: 'Main Office',
        isActive: true,
        serialNumber: ''
      });
    } catch (error) {
      console.error('Failed to add machine:', error);
    }
    setLoading(false);
  };

  const handleConnectMachine = async (machineId: string) => {
    setLoading(true);
    try {
      const connected = await attendanceMachineService.connectMachine(machineId);
      if (connected) {
        await loadMachineStatuses();
      }
    } catch (error) {
      console.error('Failed to connect machine:', error);
    }
    setLoading(false);
  };

  const handleDisconnectMachine = async (machineId: string) => {
    setLoading(true);
    try {
      await attendanceMachineService.disconnectMachine(machineId);
      await loadMachineStatuses();
    } catch (error) {
      console.error('Failed to disconnect machine:', error);
    }
    setLoading(false);
  };

  const handleTestConnection = async (machine: AttendanceMachineConfig) => {
    setConnectionTest(prev => ({ ...prev, [machine.machineId]: null }));
    
    try {
      const result = await attendanceMachineService.testConnection(machine);
      setConnectionTest(prev => ({ ...prev, [machine.machineId]: result }));
    } catch (error) {
      setConnectionTest(prev => ({ ...prev, [machine.machineId]: false }));
    }
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? 'success' : 'error';
  };

  const getStatusIcon = (isOnline: boolean) => {
    return isOnline ? <Wifi color="success" /> : <WifiOff color="error" />;
  };

  const selectedMachineStatus = selectedMachine ? machineStatuses.get(selectedMachine) : null;

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <Computer sx={{ mr: 2, verticalAlign: 'middle' }} />
          RS 9W Attendance Machine Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Add Machine
        </Button>
      </Box>

      {/* Quick Stats */}
      <Box display="flex" gap={3} mb={3} flexWrap="wrap">
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Computer color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{machines.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Machines
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Wifi color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {Array.from(machineStatuses.values()).filter(s => s.isOnline).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Online Machines
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Person color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {Array.from(machineStatuses.values()).reduce((sum, s) => sum + (s.userCount || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box flex="1" minWidth="250px">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Storage color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {Array.from(machineStatuses.values()).reduce((sum, s) => sum + (s.recordCount || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Records
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Machine List */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Connected Machines</Typography>
            <Button
              startIcon={<Refresh />}
              onClick={loadMachineStatuses}
              size="small"
            >
              Refresh Status
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Machine ID</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Users</TableCell>
                  <TableCell>Records</TableCell>
                  <TableCell>Last Sync</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {machines.map((machine) => {
                  const status = machineStatuses.get(machine.machineId);
                  const testResult = connectionTest[machine.machineId];
                  
                  return (
                    <TableRow key={machine.machineId}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {getStatusIcon(status?.isOnline || false)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {machine.machineId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{machine.ipAddress}:{machine.port}</TableCell>
                      <TableCell>{machine.location}</TableCell>
                      <TableCell>
                        <Chip
                          label={status?.isOnline ? 'Online' : 'Offline'}
                          color={getStatusColor(status?.isOnline || false)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{status?.userCount || 0}</TableCell>
                      <TableCell>{status?.recordCount || 0}</TableCell>
                      <TableCell>
                        {status?.lastSync ? new Date(status.lastSync).toLocaleTimeString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Test Connection">
                            <IconButton
                              size="small"
                              onClick={() => handleTestConnection(machine)}
                            >
                              {testResult === null ? (
                                <Science />
                              ) : testResult ? (
                                <CheckCircle color="success" />
                              ) : (
                                <Cancel color="error" />
                              )}
                            </IconButton>
                          </Tooltip>
                          
                          {status?.isOnline ? (
                            <Tooltip title="Disconnect">
                              <IconButton
                                size="small"
                                onClick={() => handleDisconnectMachine(machine.machineId)}
                              >
                                <Stop color="error" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Connect">
                              <IconButton
                                size="small"
                                onClick={() => handleConnectMachine(machine.machineId)}
                              >
                                <PlayArrow color="primary" />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedMachine(machine.machineId);
                                setOpenStatusDialog(true);
                              }}
                            >
                              <Settings />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Real-time Sync Status */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>
            <CloudSync sx={{ mr: 1, verticalAlign: 'middle' }} />
            Real-time Sync Status
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              RS 9W machines are configured for real-time attendance synchronization every 10 seconds.
              All attendance punches are automatically processed and logged to the system.
            </Typography>
          </Alert>
          
          <Box display="flex" gap={2} flexWrap="wrap">
            {machines.map((machine) => {
              const status = machineStatuses.get(machine.machineId);
              return (
                <Chip
                  key={machine.machineId}
                  icon={status?.isOnline ? <CloudSync /> : <Warning />}
                  label={`${machine.machineId}: ${status?.isOnline ? 'Syncing' : 'Offline'}`}
                  color={status?.isOnline ? 'success' : 'default'}
                  variant={status?.isOnline ? 'filled' : 'outlined'}
                />
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Add Machine Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New RS 9W Machine</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Machine ID"
              value={newMachine.machineId}
              onChange={(e) => setNewMachine((prev: any) => ({ ...prev, machineId: e.target.value }))}
              fullWidth
              required
            />
            {/* IP Connection Fields (only for TCP/UDP) */}
            {newMachine.protocol !== 'CLOUD' && (
              <>
                <TextField
                  label="IP Address"
                  value={newMachine.ipAddress}
                  onChange={(e) => setNewMachine((prev: any) => ({ ...prev, ipAddress: e.target.value }))}
                  fullWidth
                  required
                />
                <TextField
                  label="Port"
                  type="number"
                  value={newMachine.port}
                  onChange={(e) => setNewMachine((prev: any) => ({ ...prev, port: parseInt(e.target.value) }))}
                  fullWidth
                />
              </>
            )}
            
            {/* Cloud Port Field (only for CLOUD) */}
            {newMachine.protocol === 'CLOUD' && (
              <TextField
                label="TCP Port"
                type="number"
                value={newMachine.port || 5005}
                onChange={(e) => setNewMachine((prev: any) => ({ ...prev, port: parseInt(e.target.value) }))}
                fullWidth
                helperText="Cloud service port (default: 5005)"
              />
            )}
            <FormControl fullWidth>
              <InputLabel>Protocol</InputLabel>
              <Select
                value={newMachine.protocol}
                onChange={(e) => setNewMachine((prev: any) => ({ ...prev, protocol: e.target.value as 'TCP' | 'UDP' | 'CLOUD' }))}
              >
                <MenuItem value="TCP">TCP (Direct IP)</MenuItem>
                <MenuItem value="UDP">UDP (Direct IP)</MenuItem>
                <MenuItem value="CLOUD">CLOUD (Cloud ID)</MenuItem>
              </Select>
            </FormControl>
            
            {/* Cloud Connection Fields */}
            {newMachine.protocol === 'CLOUD' && (
              <>
                <TextField
                  label="Cloud ID"
                  value={newMachine.cloudId}
                  onChange={(e) => setNewMachine((prev: any) => ({ ...prev, cloudId: e.target.value }))}
                  fullWidth
                  required
                  helperText="Enter your device Cloud ID (e.g., RSS202503113388)"
                />
                <TextField
                  label="Cloud Service"
                  value={newMachine.cloudService}
                  onChange={(e) => setNewMachine((prev: any) => ({ ...prev, cloudService: e.target.value }))}
                  fullWidth
                  helperText="Default: ZKTeco Cloud"
                />
              </>
            )}
            
            <TextField
              label="Location"
              value={newMachine.location}
              onChange={(e) => setNewMachine((prev: any) => ({ ...prev, location: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Device Password"
              type="password"
              value={newMachine.devicePassword}
              onChange={(e) => setNewMachine((prev: any) => ({ ...prev, devicePassword: e.target.value }))}
              fullWidth
              helperText="Default: 0"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={newMachine.isActive}
                  onChange={(e) => setNewMachine((prev: any) => ({ ...prev, isActive: e.target.checked }))}
                />
              }
              label="Auto-connect when added"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddMachine}
            variant="contained"
            disabled={loading || !newMachine.machineId || !newMachine.ipAddress}
          >
            {loading ? <CircularProgress size={20} /> : 'Add Machine'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Machine Status Dialog */}
      <Dialog
        open={openStatusDialog}
        onClose={() => setOpenStatusDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Machine Details: {selectedMachine}
        </DialogTitle>
        <DialogContent>
          {selectedMachineStatus && (
            <Box>
              <Typography variant="h6" mb={2}>Device Information</Typography>
              <List>
                <ListItem>
                  <ListItemIcon><Computer /></ListItemIcon>
                  <ListItemText
                    primary="Serial Number"
                    secondary={selectedMachineStatus.deviceInfo.serialNumber}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Settings /></ListItemIcon>
                  <ListItemText
                    primary="Firmware Version"
                    secondary={selectedMachineStatus.deviceInfo.firmwareVersion}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Schedule /></ListItemIcon>
                  <ListItemText
                    primary="Device Time"
                    secondary={new Date(selectedMachineStatus.deviceInfo.deviceTime).toLocaleString()}
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" mb={2}>Biometric Data</Typography>
              <Box display="flex" gap={2} mb={2}>
                <Chip
                  icon={<Person />}
                  label={`${selectedMachineStatus.userCount} Users`}
                  color="primary"
                />
                <Chip
                  icon={<Fingerprint />}
                  label={`${selectedMachineStatus.fpCount} Fingerprints`}
                  color="secondary"
                />
                <Chip
                  icon={<Face />}
                  label={`${selectedMachineStatus.faceCount} Faces`}
                  color="info"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" mb={2}>Sync Status</Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Chip
                  icon={selectedMachineStatus.isOnline ? <CheckCircle /> : <Cancel />}
                  label={selectedMachineStatus.isOnline ? 'Online' : 'Offline'}
                  color={selectedMachineStatus.isOnline ? 'success' : 'error'}
                />
                <Typography variant="body2">
                  Last Sync: {selectedMachineStatus.lastSync ? new Date(selectedMachineStatus.lastSync).toLocaleString() : 'Never'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceMachineManagement;