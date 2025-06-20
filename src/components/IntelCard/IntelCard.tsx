import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
  Tooltip,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Verified as VerifiedIcon,
  Timer as TimerIcon,
  NetworkCheck as NetworkIcon,
  Warning as WarningIcon,
  FlashOn as FlashIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { IntelItem } from '../../types';
import { urgencyColors, sourceColors } from '../../theme';

interface IntelCardProps {
  item: IntelItem;
  onClick?: () => void;
}

const urgencyIcons = {
  flash: <FlashIcon />,
  priority: <WarningIcon />,
  monitor: <TrendingUpIcon />,
  context: null,
};

const sourceIcons = {
  government: '💎',
  military: '🛡️',
  intelligence: '👁️',
  media_t1: '✓',
  media_t2: '•',
  social: '🔥',
};

export const IntelCard: React.FC<IntelCardProps> = ({ item, onClick }) => {
  const urgencyColor = urgencyColors[item.urgencyLevel];
  const sourceColor = sourceColors[item.sourceCredibility.source];
  
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' as const }
    },
    hover: { 
      y: -2,
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 },
  };

  // Removed unused glowAnimation - can be re-added when motion animations are implemented

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      style={{ width: '100%' }}
    >
      <Card
        onClick={onClick}
        sx={{
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#1F1F1F',
          border: `1px solid ${urgencyColor}30`,
          borderLeft: `4px solid ${urgencyColor}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${urgencyColor}40, transparent)`,
            opacity: item.urgencyLevel === 'flash' ? 1 : 0.5,
          },
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  {urgencyIcons[item.urgencyLevel] && (
                    <Box color={urgencyColor} display="flex" alignItems="center">
                      {urgencyIcons[item.urgencyLevel]}
                    </Box>
                  )}
                  <Chip
                    label={item.urgencyLevel.toUpperCase()}
                    size="small"
                    sx={{
                      backgroundColor: `${urgencyColor}20`,
                      color: urgencyColor,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                    }}
                  />
                  <Chip
                    icon={<Box component="span" sx={{ fontSize: '0.9rem' }}>{sourceIcons[item.sourceCredibility.source]}</Box>}
                    label={item.source.name}
                    size="small"
                    variant={item.sourceCredibility.source === 'social' ? 'filled' : 'outlined'}
                    sx={{
                      borderColor: item.sourceCredibility.source === 'social' ? 'transparent' : `${sourceColor}40`,
                      backgroundColor: item.sourceCredibility.source === 'social' ? '#FF450020' : 'transparent',
                      color: item.sourceCredibility.source === 'social' ? '#FF4500' : sourceColor,
                      fontWeight: item.sourceCredibility.source === 'social' ? 600 : 400,
                    }}
                  />
                  {item.verificationStatus === 'verified' && (
                    <Tooltip title="Verified">
                      <VerifiedIcon sx={{ color: '#00D4AA', fontSize: '1rem' }} />
                    </Tooltip>
                  )}
                </Stack>
                
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 1, 
                    fontWeight: 600,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  {item.title}
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {item.content.substring(0, 200)}...
                </Typography>
              </Box>
              
              <Stack spacing={1} alignItems="flex-end" ml={2}>
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                </Typography>
                {item.eventVelocity && item.eventVelocity > 5 && (
                  <Chip
                    icon={<TrendingUpIcon />}
                    label={`${item.eventVelocity}/hr`}
                    size="small"
                    color="error"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {item.geoContext.map((context, idx) => (
                <Chip
                  key={idx}
                  label={`${context.icon} ${context.type}`}
                  size="small"
                  sx={{
                    backgroundColor: '#2A2A2A',
                    fontSize: '0.7rem',
                    opacity: 0.8 + (context.weight * 0.2),
                  }}
                />
              ))}
              {item.decisionWindow && (
                <Chip
                  icon={<TimerIcon />}
                  label={`${item.decisionWindow}h window`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              )}
              {item.relatedEvents.length > 0 && (
                <Chip
                  icon={<NetworkIcon />}
                  label={`${item.relatedEvents.length} related`}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: 'rgba(255,255,255,0.2)' }}
                />
              )}
            </Stack>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Trust: {Math.round(item.sourceCredibility.rating * 100)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  •
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Accuracy: {Math.round(item.sourceCredibility.historicalAccuracy * 100)}%
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};