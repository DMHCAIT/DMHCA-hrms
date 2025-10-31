import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Business,
  Person,
  Logout,
  Settings,
  Dashboard,
  CalendarToday,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'DMHCA HRMS' }) => {
  const { profile, signOut, isAdmin } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(anchorEl);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await signOut();
  };

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <Business sx={{ mr: 2, fontSize: 28 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>

        {profile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {profile.first_name} {profile.last_name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {profile.position}
                </Typography>
                <Chip 
                  label={profile.role} 
                  size="small" 
                  color={isAdmin() ? 'secondary' : 'default'}
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem',
                    backgroundColor: isAdmin() ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                  }} 
                />
              </Box>
            </Box>

            <IconButton
              size="large"
              aria-label="account menu"
              aria-controls="account-menu"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
              sx={{ 
                border: '2px solid rgba(255,255,255,0.2)',
                '&:hover': {
                  border: '2px solid rgba(255,255,255,0.4)',
                }
              }}
            >
              <Avatar
                sx={{ 
                  width: 36, 
                  height: 36, 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  fontSize: '1rem',
                }}
              >
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </Avatar>
            </IconButton>

            <Menu
              id="account-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              sx={{
                '& .MuiPaper-root': {
                  minWidth: 200,
                  mt: 1,
                }
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {profile.first_name} {profile.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {profile.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {profile.employee_id}
                </Typography>
              </Box>
              
              <Divider />
              
              <MenuItem onClick={() => { handleMenuClose(); window.location.href = '/'; }}>
                <ListItemIcon>
                  <Dashboard fontSize="small" />
                </ListItemIcon>
                <ListItemText>Dashboard</ListItemText>
              </MenuItem>

              {!isAdmin() && (
                <MenuItem onClick={() => { handleMenuClose(); window.location.href = '/leave'; }}>
                  <ListItemIcon>
                    <CalendarToday fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>My Leaves</ListItemText>
                </MenuItem>
              )}
              
              <MenuItem onClick={handleMenuClose}>
                <ListItemIcon>
                  <Person fontSize="small" />
                </ListItemIcon>
                <ListItemText>Profile</ListItemText>
              </MenuItem>
              
              <MenuItem onClick={() => { handleMenuClose(); window.location.href = '/settings'; }}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                <ListItemText>Settings</ListItemText>
              </MenuItem>
              
              <Divider />
              
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;