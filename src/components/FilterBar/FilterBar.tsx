import React from 'react';
import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
  Typography,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FlashOn as FlashIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
  Bolt as BoltIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { FeedFilter, UrgencyLevel, SourceType } from '../../types';

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

const sourceOptions = [
  { value: 'all', label: 'ALL', color: '#FFFFFF' },
  { value: 'social', label: 'REDDIT', color: '#FF4500' },
  { value: 'media_t1', label: 'MEDIA', color: '#3A7AFE' },
  { value: 'media_t2', label: 'ALT MEDIA', color: '#7B68EE' },
  { value: 'military', label: 'MILITARY', color: '#D4AF37' },
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

  const handleSourceChange = (
    event: React.MouseEvent<HTMLElement>,
    value: string
  ) => {
    if (value === 'all') {
      // Clear source filter to show all
      onFilterChange({ ...filter, sourceTypes: [] });
    } else {
      // Toggle single source
      const sourceType = value as SourceType;
      const currentSources = filter.sourceTypes || [];
      
      if (currentSources.includes(sourceType)) {
        // Remove if already selected
        onFilterChange({ 
          ...filter, 
          sourceTypes: currentSources.filter(s => s !== sourceType) 
        });
      } else {
        // Add to selection
        onFilterChange({ 
          ...filter, 
          sourceTypes: [...currentSources, sourceType] 
        });
      }
    }
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
            SOURCE:
          </Typography>
          <Stack direction="row" spacing={1}>
            {sourceOptions.map((option) => (
              <ToggleButton
                key={option.value}
                value={option.value}
                selected={
                  option.value === 'all' 
                    ? (filter.sourceTypes || []).length === 0 
                    : (filter.sourceTypes || []).includes(option.value as SourceType)
                }
                onClick={(e) => handleSourceChange(e, option.value)}
                size="small"
                sx={{
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: '#1F1F1F',
                  '&.Mui-selected': {
                    color: option.color,
                    borderColor: option.color,
                    backgroundColor: `${option.color}20`,
                  },
                }}
              >
                {option.label}
              </ToggleButton>
            ))}
          </Stack>
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

          <Stack direction="row" spacing={1}>
            <ToggleButton
              value="reddit-focus"
              selected={(filter.sourceTypes || []).length === 1 && (filter.sourceTypes || [])[0] === 'social'}
              onClick={() => {
                const isRedditOnly = (filter.sourceTypes || []).length === 1 && (filter.sourceTypes || [])[0] === 'social';
                onFilterChange({ 
                  ...filter, 
                  sourceTypes: isRedditOnly ? [] : ['social'],
                  timeRange: isRedditOnly ? filter.timeRange : 'day'
                });
              }}
              sx={{
                px: 2,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: '#FF4500',
                color: 'white',
                border: '1px solid #FF4500',
                '&:hover': {
                  backgroundColor: '#FF6600',
                },
                '&.Mui-selected': {
                  backgroundColor: '#FF6600',
                  borderColor: '#FF6600',
                },
              }}
            >
              <Stack direction="row" spacing={0.5} alignItems="center">
                <span>🔥</span>
                <span>REDDIT FOCUS</span>
              </Stack>
            </ToggleButton>
            
            <ToggleButton
              value="iran-conflict"
              onClick={() => {
                onFilterChange({ 
                  ...filter, 
                  searchQuery: 'iran missile strike',
                  urgencyLevels: ['flash', 'priority'],
                  timeRange: 'day',
                  sourceTypes: []
                });
              }}
              sx={{
                px: 2,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: '#FF4444',
                color: 'white',
                border: '1px solid #FF4444',
                '&:hover': {
                  backgroundColor: '#FF6666',
                },
              }}
            >
              <Stack direction="row" spacing={0.5} alignItems="center">
                <BoltIcon sx={{ fontSize: '1rem' }} />
                <span>IRAN CONFLICT</span>
              </Stack>
            </ToggleButton>
            
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
        
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
            QUICK SEARCH:
          </Typography>
          {[
            { label: 'Missile Strike', query: 'missile strike' },
            { label: 'Casualties', query: 'killed wounded casualties' },
            { label: 'Iran IRGC', query: 'iran irgc revolutionary guard' },
            { label: 'Hezbollah', query: 'hezbollah lebanon' },
            { label: 'Gaza', query: 'gaza hamas' },
            { label: 'Nuclear', query: 'nuclear uranium' },
          ].map((item) => (
            <Chip
              key={item.label}
              label={item.label}
              size="small"
              onClick={() => onFilterChange({ ...filter, searchQuery: item.query })}
              sx={{
                fontSize: '0.7rem',
                height: 20,
                backgroundColor: '#1F1F1F',
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: '#3A7AFE20',
                  color: '#3A7AFE',
                },
                '& .MuiChip-label': {
                  px: 1,
                },
              }}
            />
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};