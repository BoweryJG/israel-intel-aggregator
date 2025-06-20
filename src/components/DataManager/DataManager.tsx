import React from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Stack,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DirectRssService } from '../../services/directRssService';

interface DataManagerProps {
  open: boolean;
  onClose: () => void;
  onDataUpdate: () => void;
}

export const DataManager: React.FC<DataManagerProps> = ({ open, onClose, onDataUpdate }) => {
  const rssService = DirectRssService.getInstance();

  const handleExport = () => {
    const cacheInfo = rssService.getCacheInfo();
    const data = {
      version: 'v1',
      exportDate: new Date().toISOString(),
      itemCount: cacheInfo.itemCount,
      items: rssService.getCachedNews(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `israel-intel-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.version !== 'v1' || !Array.isArray(data.items)) {
          alert('Invalid backup file format');
          return;
        }

        // Save imported data to cache
        localStorage.setItem('israel-intel-cache', JSON.stringify({
          version: 'v2',
          items: data.items,
          timestamp: Date.now(),
        }));

        alert(`Imported ${data.items.length} items successfully!`);
        window.location.reload(); // Reload to apply imported data
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import data. Please check the file format.');
      }
    };
    input.click();
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear all cached data?')) {
      localStorage.removeItem('israel-intel-cache');
      alert('Cache cleared successfully');
      onDataUpdate();
      onClose();
    }
  };

  const cacheInfo = rssService.getCacheInfo();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Data Management</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current cache: {cacheInfo.itemCount} items ({cacheInfo.ageHours} hours old)
          </Typography>
          
          <Stack spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              fullWidth
            >
              Export Data to File
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={handleImport}
              fullWidth
            >
              Import Data from File
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleClearCache}
              fullWidth
            >
              Clear Cache
            </Button>
          </Stack>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Note: Exported data can be imported later to restore your news feed history.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};