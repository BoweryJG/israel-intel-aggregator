import React from 'react';
import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  FlashOn as FlashIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { FeedFilter, UrgencyLevel } from '../../types';

interface FilterBarProps {
  filter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

const urgencyOptions = [
  { value: 'flash', label: 'FLASH', icon: <FlashIcon />, color: '#FF4444' },
  { value: 'priority', label: 'PRIORITY', icon: <WarningIcon />, color: '#D4AF37' },
  { value: 'monitor', label: 'MONITOR', icon: <TrendingUpIcon />, color: '#3A7AFE' },
  { value: 'context', label: 'CONTEXT', icon: <InfoIcon />, color: '#666666' },
];

const timeRangeOptions = [
  { value: 'hour', label: '1H' },
  { value: 'day', label: '24H' },
  { value: 'week', label: '7D' },
  { value: 'all', label: 'ALL' },
];

export const FilterBar: React.FC<FilterBarProps> = ({ filter, onFilterChange }) => {
  const handleUrgencyChange = (
    event: React.MouseEvent<HTMLElement>,
    newUrgencyLevels: UrgencyLevel[]
  ) => {
    if (newUrgencyLevels.length > 0) {
      onFilterChange({ ...filter, urgencyLevels: newUrgencyLevels });
    }
  };

  const handleTimeRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeRange: string | null
  ) => {
    if (newTimeRange) {
      onFilterChange({ ...filter, timeRange: newTimeRange as FeedFilter['timeRange'] });
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, searchQuery: event.target.value });
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        p: 2,
        backgroundColor: '#141414',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 80 }}>
            URGENCY:
          </Typography>
          <ToggleButtonGroup
            value={filter.urgencyLevels}
            onChange={handleUrgencyChange}
            aria-label="urgency levels"
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 2,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: '#1F1F1F',
                '&.Mui-selected': {
                  backgroundColor: 'transparent',
                },
              },
            }}
          >
            {urgencyOptions.map((option) => (
              <ToggleButton
                key={option.value}
                value={option.value}
                sx={{
                  '&.Mui-selected': {
                    color: option.color,
                    borderColor: option.color,
                    backgroundColor: `${option.color}20 !important`,
                  },
                }}
              >
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {option.icon}
                  <span>{option.label}</span>
                </Stack>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 80 }}>
            TIME:
          </Typography>
          <ToggleButtonGroup
            value={filter.timeRange}
            onChange={handleTimeRangeChange}
            exclusive
            aria-label="time range"
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 2,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: '#1F1F1F',
                '&.Mui-selected': {
                  backgroundColor: '#3A7AFE20',
                  color: '#3A7AFE',
                  borderColor: '#3A7AFE',
                },
              },
            }}
          >
            {timeRangeOptions.map((option) => (
              <ToggleButton key={option.value} value={option.value}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Box sx={{ flexGrow: 1 }} />

          <TextField
            size="small"
            placeholder="Search intel..."
            value={filter.searchQuery || ''}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 300,
              '& .MuiInputBase-root': {
                fontSize: '0.875rem',
                backgroundColor: '#1F1F1F',
                '& input': {
                  fontFamily: 'JetBrains Mono',
                },
              },
            }}
          />
        </Stack>
      </Stack>
    </Box>
  );
};