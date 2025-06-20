import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Notifications as NotificationsIcon,
  Terminal as TerminalIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface CommandBarProps {
  onMenuClick: () => void;
  onRefresh: () => void;
  activeAlerts: number;
  lastUpdate: Date;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  onMenuClick,
  onRefresh,
  activeAlerts,
  lastUpdate,
}) => {
  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: '#0A0A0A',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
      }}
    >
      <Toolbar sx={{ px: 3 }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexGrow: 1 }}>
          <SecurityIcon sx={{ color: '#D4AF37' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>
            ISRAEL INTEL
          </Typography>
          <Chip
            label="COMMAND"
            size="small"
            sx={{
              backgroundColor: '#D4AF3720',
              color: '#D4AF37',
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 20,
            }}
          />
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              LAST SYNC:
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                fontFamily: 'JetBrains Mono',
                color: '#00D4AA',
              }}
            >
              {lastUpdate.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ opacity: 0.2 }} />

          <Tooltip title="Active Alerts">
            <Badge
              badgeContent={activeAlerts}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#FF4444',
                  fontWeight: 700,
                },
              }}
            >
              <NotificationsIcon sx={{ color: activeAlerts > 0 ? '#FF4444' : '#666' }} />
            </Badge>
          </Tooltip>

          <Tooltip title="Language: HE/EN">
            <IconButton size="small" color="inherit">
              <LanguageIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Refresh Intel">
            <IconButton
              size="small"
              color="inherit"
              onClick={onRefresh}
              component={motion.button}
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ opacity: 0.2 }} />

          <Tooltip title="Enter Terminal">
            <IconButton
              size="small"
              sx={{
                color: '#D4AF37',
                backgroundColor: '#D4AF3710',
                '&:hover': {
                  backgroundColor: '#D4AF3720',
                },
              }}
            >
              <TerminalIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};