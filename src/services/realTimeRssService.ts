import { IntelItem, UrgencyLevel, SourceType } from '../types';

// Use RSS2JSON free tier
const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json';

export class RealTimeRssService {
  private static instance: RealTimeRssService;

  static getInstance(): RealTimeRssService {
    if (!RealTimeRssService.instance) {
      RealTimeRssService.instance = new RealTimeRssService();
    }
    return RealTimeRssService.instance;
  }

  async fetchLiveNews(): Promise<IntelItem[]> {
    console.log('Fetching from RSS2JSON API...');
    
    const feeds = [
      'https://www.timesofisrael.com/feed/',
      'https://rss.jpost.com/rss/rssfeedsfrontpage.aspx',
      'https://www.israelnationalnews.com/rss.aspx',
    ];

    const allItems: IntelItem[] = [];

    // Fetch feeds in parallel
    const promises = feeds.map(async (feedUrl) => {
      try {
        const url = `${RSS2JSON_BASE}?rss_url=${encodeURIComponent(feedUrl)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'ok' && data.items) {
          console.log(`Fetched ${data.items.length} items from ${data.feed.title}`);
          return this.convertFeedItems(data.items, data.feed.title || feedUrl);
        }
        return [];
      } catch (error) {
        console.error(`Error fetching ${feedUrl}:`, error);
        return [];
      }
    });

    const results = await Promise.all(promises);
    results.forEach(items => allItems.push(...items));

    // Remove duplicates and sort
    const uniqueItems = this.deduplicateItems(allItems);
    uniqueItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    console.log(`Total unique items: ${uniqueItems.length}`);
    return uniqueItems;
  }

  private convertFeedItems(items: any[], source: string): IntelItem[] {
    return items.map((item, index) => {
      const urgencyLevel = this.analyzeUrgency(item.title, item.description);
      const sourceType = this.getSourceType(source);

      return {
        id: `rss-${Date.now()}-${index}-${Math.random()}`,
        title: item.title,
        content: this.cleanDescription(item.description || item.content || ''),
        timestamp: new Date(item.pubDate),
        urgencyLevel,
        geoContext: this.extractContext(item.title, item.description),
        sourceCredibility: {
          source: sourceType,
          rating: sourceType === 'media_t1' ? 0.85 : 0.75,
          historicalAccuracy: 0.82,
          biasIndicator: 0.25,
        },
        verificationStatus: 'pending' as const,
        relatedEvents: [],
        eventVelocity: urgencyLevel === 'flash' ? 10 : urgencyLevel === 'priority' ? 6 : 3,
        tags: this.extractTags(item.title, item.description),
        source: {
          name: this.getSourceName(source),
          url: item.link,
          type: sourceType,
        },
        decisionWindow: urgencyLevel === 'flash' ? 1 : urgencyLevel === 'priority' ? 4 : undefined,
      };
    });
  }

  private analyzeUrgency(title: string, content: string): UrgencyLevel {
    const text = `${title} ${content}`.toLowerCase();
    
    // Critical keywords for FLASH
    const flashKeywords = [
      'breaking:', 'urgent:', 'just in:', 'explosion', 'attack', 
      'siren', 'rocket', 'missile', 'casualties', 'killed', 'wounded'
    ];
    
    // Security keywords for PRIORITY
    const priorityKeywords = [
      'idf', 'military', 'operation', 'hamas', 'hezbollah', 'gaza',
      'lebanon', 'syria', 'iran', 'security', 'defense', 'alert'
    ];
    
    // Important keywords for MONITOR
    const monitorKeywords = [
      'minister', 'netanyahu', 'government', 'knesset', 'economy',
      'diplomatic', 'meeting', 'summit', 'negotiations'
    ];

    if (flashKeywords.some(keyword => text.includes(keyword))) {
      return 'flash';
    }
    
    if (priorityKeywords.some(keyword => text.includes(keyword))) {
      return 'priority';
    }
    
    if (monitorKeywords.some(keyword => text.includes(keyword))) {
      return 'monitor';
    }
    
    return 'context';
  }

  private cleanDescription(description: string): string {
    // Strip HTML
    const div = document.createElement('div');
    div.innerHTML = description;
    let text = div.textContent || div.innerText || '';
    
    // Clean up
    text = text
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limit length
    return text.length > 300 ? text.substring(0, 297) + '...' : text;
  }

  private getSourceType(source: string): SourceType {
    if (source.toLowerCase().includes('times of israel') || 
        source.toLowerCase().includes('jerusalem post')) {
      return 'media_t1';
    }
    return 'media_t2';
  }

  private getSourceName(source: string): string {
    if (source.includes('Times of Israel')) return 'Times of Israel';
    if (source.includes('Jerusalem Post')) return 'Jerusalem Post';
    if (source.includes('Arutz')) return 'Arutz Sheva';
    if (source.includes('Ynet')) return 'Ynet News';
    return source;
  }

  private extractContext(title: string, content: string) {
    const text = `${title} ${content}`.toLowerCase();
    const contexts = [];

    if (text.match(/military|idf|army|soldier|operation/)) {
      contexts.push({
        type: 'military' as const,
        icon: '🛡️',
        weight: 0.35,
        severity: 0.8,
      });
    }

    if (text.match(/economic|shekel|market|trade|export/)) {
      contexts.push({
        type: 'economic' as const,
        icon: '📊',
        weight: 0.25,
        severity: 0.5,
      });
    }

    if (text.match(/diplomatic|ambassador|foreign|summit/)) {
      contexts.push({
        type: 'diplomatic' as const,
        icon: '🤝',
        weight: 0.20,
        severity: 0.6,
      });
    }

    if (text.match(/cyber|hack|malware|breach/)) {
      contexts.push({
        type: 'cyber' as const,
        icon: '🔐',
        weight: 0.15,
        severity: 0.7,
      });
    }

    return contexts;
  }

  private extractTags(title: string, content: string): string[] {
    const text = `${title} ${content}`;
    const tags: string[] = [];
    
    const tagPatterns = [
      { pattern: /gaza/i, tag: 'Gaza' },
      { pattern: /west bank/i, tag: 'West Bank' },
      { pattern: /lebanon/i, tag: 'Lebanon' },
      { pattern: /syria/i, tag: 'Syria' },
      { pattern: /iran/i, tag: 'Iran' },
      { pattern: /hamas/i, tag: 'Hamas' },
      { pattern: /hezbollah/i, tag: 'Hezbollah' },
      { pattern: /idf/i, tag: 'IDF' },
      { pattern: /tel aviv/i, tag: 'Tel Aviv' },
      { pattern: /jerusalem/i, tag: 'Jerusalem' },
      { pattern: /netanyahu/i, tag: 'Netanyahu' },
    ];
    
    tagPatterns.forEach(({ pattern, tag }) => {
      if (pattern.test(text)) {
        tags.push(tag);
      }
    });
    
    return Array.from(new Set(tags)); // Remove duplicates
  }

  private deduplicateItems(items: IntelItem[]): IntelItem[] {
    const seen = new Map<string, IntelItem>();
    
    items.forEach(item => {
      const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
      if (!seen.has(key) || item.timestamp > seen.get(key)!.timestamp) {
        seen.set(key, item);
      }
    });
    
    return Array.from(seen.values());
  }
}