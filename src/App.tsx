import React, { useState, useEffect, useCallback } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  CircularProgress,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Map as MapIcon,
  Timeline as TimelineIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { theme } from './theme';
import { CommandBar } from './components/CommandBar';
import { FilterBar } from './components/FilterBar';
import { IntelCard } from './components/IntelCard';
import { DataManager } from './components/DataManager';
import { DirectRssService } from './services/directRssService';
import { IntelItem, FeedFilter } from './types';

const DRAWER_WIDTH = 240;
const REFRESH_INTERVAL = 60000; // 1 minute

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dataManagerOpen, setDataManagerOpen] = useState(false);
  const [intelItems, setIntelItems] = useState<IntelItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<IntelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [filter, setFilter] = useState<FeedFilter>({
    urgencyLevels: ['flash', 'priority', 'monitor', 'context'], // Show all by default
    contextTypes: [],
    verificationStatus: [],
    timeRange: 'all', // Show all time by default
    sourceTypes: [], // Empty means show all
  });

  const rssService = DirectRssService.getInstance();

  const fetchIntelData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      // Show cached data immediately if available
      const cachedItems = rssService.getCachedNews();
      if (cachedItems.length > 0 && !forceRefresh) {
        console.log(`Showing ${cachedItems.length} cached items`);
        setIntelItems(cachedItems);
        setLoading(false);
        setIsUsingCache(true);
      }
      
      // Fetch fresh data
      console.log('Fetching LIVE news via CORS proxy...');
      const items = await rssService.fetchNews(forceRefresh);
      console.log(`Received ${items.length} live news items`);
      
      setIntelItems(items);
      setLastUpdate(new Date());
      setIsUsingCache(false);
      
      if (items.length === 0) {
        setError('No feeds available - API may be rate limited');
      } else {
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch news feeds');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [rssService]);

  useEffect(() => {
    fetchIntelData();
    const interval = setInterval(fetchIntelData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchIntelData]);

  useEffect(() => {
    let filtered = [...intelItems];

    // Filter by urgency levels
    filtered = filtered.filter(item => 
      filter.urgencyLevels.includes(item.urgencyLevel)
    );

    // Filter by source types
    if (filter.sourceTypes && filter.sourceTypes.length > 0) {
      filtered = filtered.filter(item =>
        filter.sourceTypes!.includes(item.sourceCredibility.source)
      );
    }

    // Filter by time range
    const now = new Date();
    const timeFilter = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      all: Infinity,
    };
    
    filtered = filtered.filter(item => {
      const age = now.getTime() - item.timestamp.getTime();
      return age <= timeFilter[filter.timeRange];
    });

    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort with Reddit priority
    filtered.sort((a, b) => {
      // First priority: Urgency level
      const urgencyOrder = { flash: 0, priority: 1, monitor: 2, context: 3 };
      const urgencyDiff = urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
      if (urgencyDiff !== 0) return urgencyDiff;
      
      // Second priority: Reddit content
      const aIsReddit = a.sourceCredibility.source === 'social';
      const bIsReddit = b.sourceCredibility.source === 'social';
      if (aIsReddit && !bIsReddit) return -1;
      if (!aIsReddit && bIsReddit) return 1;
      
      // Third priority: Timestamp
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    setFilteredItems(filtered);
  }, [intelItems, filter]);

  const activeAlerts = intelItems.filter(item => item.urgencyLevel === 'flash').length;

  const drawer = (
    <Box sx={{ pt: 2 }}>
      <List>
        <ListItem 
          sx={{ 
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            cursor: 'pointer'
          }}
          onClick={() => {
            setDrawerOpen(false);
            window.scrollTo(0, 0);
          }}
        >
          <ListItemIcon>
            <DashboardIcon sx={{ color: '#D4AF37' }} />
          </ListItemIcon>
          <ListItemText primary="Intel Feed" />
        </ListItem>
        <ListItem
          sx={{ cursor: 'pointer', opacity: 0.5 }}
          onClick={() => {
            setDrawerOpen(false);
            alert('Threat Map coming soon - will show geographic distribution of incidents');
          }}
        >
          <ListItemIcon>
            <MapIcon />
          </ListItemIcon>
          <ListItemText primary="Threat Map" secondary="Coming Soon" />
        </ListItem>
        <ListItem
          sx={{ cursor: 'pointer', opacity: 0.5 }}
          onClick={() => {
            setDrawerOpen(false);
            alert('Timeline view coming soon - will show chronological event progression');
          }}
        >
          <ListItemIcon>
            <TimelineIcon />
          </ListItemIcon>
          <ListItemText primary="Timeline" secondary="Coming Soon" />
        </ListItem>
        <ListItem
          sx={{ cursor: 'pointer', opacity: 0.5 }}
          onClick={() => {
            setDrawerOpen(false);
            alert('Analytics coming soon - will show trends and patterns in conflict data');
          }}
        >
          <ListItemIcon>
            <AnalyticsIcon />
          </ListItemIcon>
          <ListItemText primary="Analytics" secondary="Coming Soon" />
        </ListItem>
      </List>
      <Divider sx={{ my: 2 }} />
      <List>
        <ListItem
          sx={{ cursor: 'pointer' }}
          onClick={() => {
            setDrawerOpen(false);
            setDataManagerOpen(true);
          }}
        >
          <ListItemIcon>
            <StorageIcon />
          </ListItemIcon>
          <ListItemText primary="Data Manager" />
        </ListItem>
        <ListItem
          sx={{ cursor: 'pointer', opacity: 0.5 }}
          onClick={() => {
            setDrawerOpen(false);
            alert('Settings coming soon - will allow customization of alerts and notifications');
          }}
        >
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" secondary="Coming Soon" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0A0A0A' }}>
        <CommandBar
          onMenuClick={() => setDrawerOpen(!drawerOpen)}
          onRefresh={() => fetchIntelData(true)}
          activeAlerts={activeAlerts}
          lastUpdate={lastUpdate}
        />

        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              backgroundColor: '#0A0A0A',
              borderRight: '1px solid rgba(255, 255, 255, 0.05)',
              mt: '64px',
            },
          }}
        >
          {drawer}
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            mt: '64px',
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <FilterBar filter={filter} onFilterChange={setFilter} />
          
          {isUsingCache && (
            <Box sx={{ px: 3, py: 1 }}>
              <Alert severity="info" sx={{ backgroundColor: 'rgba(33, 150, 243, 0.1)' }}>
                {(() => {
                  const cacheInfo = rssService.getCacheInfo();
                  if (cacheInfo.ageHours < 1) {
                    return `Showing ${cacheInfo.itemCount} cached items from less than an hour ago`;
                  } else if (cacheInfo.isStale) {
                    return `Showing ${cacheInfo.itemCount} cached items from ${cacheInfo.ageHours} hours ago. Refreshing in background...`;
                  } else {
                    return `Showing ${cacheInfo.itemCount} cached items from ${cacheInfo.ageHours} hours ago`;
                  }
                })()}
              </Alert>
            </Box>
          )}

          <Container maxWidth={false} sx={{ py: 3, flexGrow: 1 }}>
            {loading && filteredItems.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <Stack spacing={2} alignItems="center">
                  <CircularProgress size={48} sx={{ color: '#D4AF37' }} />
                  <Typography variant="body2" color="text.secondary">
                    ACQUIRING INTELLIGENCE...
                  </Typography>
                </Stack>
              </Box>
            ) : filteredItems.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <Typography variant="h6" color="text.secondary">
                  NO INTEL MATCHING CURRENT FILTERS
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <AnimatePresence>
                  {filteredItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <IntelCard
                        item={item}
                        onClick={() => window.open(item.source.url, '_blank')}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Box>
            )}
          </Container>
        </Box>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>

        <DataManager
          open={dataManagerOpen}
          onClose={() => setDataManagerOpen(false)}
          onDataUpdate={() => fetchIntelData(true)}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
