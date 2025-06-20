import axios from 'axios';
import { IntelItem, UrgencyLevel, SourceType, VerificationStatus } from '../types';

interface RSSSource {
  url: string;
  name: string;
  type: SourceType;
  trustScore: number;
}

const RSS_SOURCES: RSSSource[] = [
  {
    url: 'https://www.timesofisrael.com/feed/',
    name: 'Times of Israel',
    type: 'media_t1',
    trustScore: 0.85,
  },
  {
    url: 'https://rss.jpost.com/rss/rssfeedsfrontpage.aspx',
    name: 'Jerusalem Post',
    type: 'media_t1',
    trustScore: 0.85,
  },
  // Temporarily disable problematic feeds
  // {
  //   url: 'https://www.ynetnews.com/rss/category/3089',
  //   name: 'Ynet News',
  //   type: 'media_t1',
  //   trustScore: 0.80,
  // },
  // {
  //   url: 'https://www.haaretz.com/cmlink/1.628765',
  //   name: 'Haaretz',
  //   type: 'media_t1',
  //   trustScore: 0.80,
  // },
  {
    url: 'https://www.israelnationalnews.com/rss.aspx',
    name: 'Arutz Sheva',
    type: 'media_t2',
    trustScore: 0.75,
  },
];

// Try multiple CORS proxies in case one fails
const CORS_PROXIES = [
  '/.netlify/functions/rss-proxy?url=', // Our Netlify function (production)
  '/api/rss-proxy?url=', // Local proxy fallback
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

export class RSSService {
  private static instance: RSSService;
  private lastFetchTime: Date = new Date();
  private cache: Map<string, IntelItem[]> = new Map();

  static getInstance(): RSSService {
    if (!RSSService.instance) {
      RSSService.instance = new RSSService();
    }
    return RSSService.instance;
  }

  private async fetchWithProxy(url: string, proxyIndex: number = 0): Promise<any> {
    if (proxyIndex >= CORS_PROXIES.length) {
      throw new Error('All CORS proxies failed');
    }
    
    try {
      const proxyUrl = CORS_PROXIES[proxyIndex];
      const fullUrl = `${proxyUrl}${encodeURIComponent(url)}`;
      const response = await axios.get(fullUrl, { timeout: 10000 });
      
      // Handle different proxy response formats
      if (response.data.contents) {
        return response.data.contents;
      } else if (typeof response.data === 'string') {
        return response.data;
      } else {
        return JSON.stringify(response.data);
      }
    } catch (error) {
      console.warn(`Proxy ${CORS_PROXIES[proxyIndex]} failed, trying next...`);
      return this.fetchWithProxy(url, proxyIndex + 1);
    }
  }

  private async fetchRSSFeed(source: RSSSource): Promise<IntelItem[]> {
    try {
      const xmlContent = await this.fetchWithProxy(source.url);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      const items = xmlDoc.querySelectorAll('item');
      const intelItems: IntelItem[] = [];

      items.forEach((item, index) => {
        if (index < 10) { // Limit to 10 items per source
          const title = item.querySelector('title')?.textContent || '';
          const description = item.querySelector('description')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '';

          const intelItem = this.parseToIntelItem(
            title,
            description,
            pubDate,
            link,
            source
          );
          
          intelItems.push(intelItem);
        }
      });

      return intelItems;
    } catch (error) {
      console.error(`Error fetching RSS feed from ${source.name}:`, error);
      return [];
    }
  }

  private parseToIntelItem(
    title: string,
    description: string,
    pubDate: string,
    link: string,
    source: RSSSource
  ): IntelItem {
    const urgencyLevel = this.determineUrgency(title, description);
    const contexts = this.extractContexts(title, description);
    const eventVelocity = this.calculateEventVelocity(title, description);
    
    return {
      id: `${source.name}-${Date.now()}-${Math.random()}`,
      title,
      content: this.cleanDescription(description),
      timestamp: new Date(pubDate),
      urgencyLevel,
      geoContext: contexts,
      sourceCredibility: {
        source: source.type,
        rating: source.trustScore,
        historicalAccuracy: source.trustScore * 0.95,
        biasIndicator: 0.3,
      },
      verificationStatus: this.determineVerificationStatus(source),
      relatedEvents: [],
      eventVelocity,
      tags: this.extractTags(title, description),
      source: {
        name: source.name,
        url: link,
        type: source.type,
      },
      decisionWindow: urgencyLevel === 'flash' ? 1 : undefined,
    };
  }

  private determineUrgency(title: string, description: string): UrgencyLevel {
    const text = `${title} ${description}`.toLowerCase();
    
    if (
      text.includes('breaking') ||
      text.includes('urgent') ||
      text.includes('alert') ||
      text.includes('explosion') ||
      text.includes('attack') ||
      text.includes('missile')
    ) {
      return 'flash';
    }
    
    if (
      text.includes('developing') ||
      text.includes('update') ||
      text.includes('military') ||
      text.includes('security')
    ) {
      return 'priority';
    }
    
    if (
      text.includes('analysis') ||
      text.includes('report') ||
      text.includes('investigation')
    ) {
      return 'monitor';
    }
    
    return 'context';
  }

  private extractContexts(title: string, description: string) {
    const text = `${title} ${description}`.toLowerCase();
    const contexts = [];

    if (text.includes('military') || text.includes('idf') || text.includes('defense')) {
      contexts.push({
        type: 'military' as const,
        icon: '🛡️',
        weight: 0.35,
        severity: 0.8,
      });
    }

    if (text.includes('economic') || text.includes('trade') || text.includes('market')) {
      contexts.push({
        type: 'economic' as const,
        icon: '📊',
        weight: 0.25,
        severity: 0.5,
      });
    }

    if (text.includes('diplomatic') || text.includes('ambassador') || text.includes('relations')) {
      contexts.push({
        type: 'diplomatic' as const,
        icon: '🤝',
        weight: 0.20,
        severity: 0.6,
      });
    }

    if (text.includes('cyber') || text.includes('hack') || text.includes('digital')) {
      contexts.push({
        type: 'cyber' as const,
        icon: '🔐',
        weight: 0.15,
        severity: 0.7,
      });
    }

    return contexts;
  }

  private calculateEventVelocity(title: string, description: string): number {
    const urgencyWords = ['breaking', 'urgent', 'developing', 'update'];
    const text = `${title} ${description}`.toLowerCase();
    let velocity = 1;
    
    urgencyWords.forEach(word => {
      if (text.includes(word)) {
        velocity += 2;
      }
    });
    
    return velocity;
  }

  private determineVerificationStatus(source: RSSSource): VerificationStatus {
    if (source.trustScore > 0.8) {
      return 'verified';
    }
    return 'pending';
  }

  private cleanDescription(description: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = description;
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  private extractTags(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();
    const tags = [];
    
    if (text.includes('gaza')) tags.push('Gaza');
    if (text.includes('west bank')) tags.push('West Bank');
    if (text.includes('lebanon')) tags.push('Lebanon');
    if (text.includes('iran')) tags.push('Iran');
    if (text.includes('syria')) tags.push('Syria');
    if (text.includes('hamas')) tags.push('Hamas');
    if (text.includes('hezbollah')) tags.push('Hezbollah');
    if (text.includes('idf')) tags.push('IDF');
    
    return tags;
  }

  async fetchAllFeeds(): Promise<IntelItem[]> {
    const allItems: IntelItem[] = [];
    
    try {
      const fetchPromises = RSS_SOURCES.map(source => this.fetchRSSFeed(source));
      const results = await Promise.all(fetchPromises);
      
      results.forEach(items => {
        allItems.push(...items);
      });
    } catch (error) {
      console.error('Error fetching feeds:', error);
    }
    
    // If no items were fetched, add some demo data
    if (allItems.length === 0) {
      console.log('No RSS items fetched, adding demo data');
      allItems.push(...this.getDemoData());
    }
    
    // Sort by timestamp (newest first)
    allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Deduplicate by title similarity
    const uniqueItems = this.deduplicateItems(allItems);
    
    this.lastFetchTime = new Date();
    
    return uniqueItems;
  }

  private getDemoData(): IntelItem[] {
    const now = new Date();
    return [
      {
        id: 'demo-1',
        title: 'IDF Reports Increased Activity Along Northern Border',
        content: 'Military sources report heightened surveillance and defensive preparations along the Lebanese border following recent regional tensions. Security forces have been placed on high alert.',
        timestamp: new Date(now.getTime() - 1000 * 60 * 30), // 30 minutes ago
        urgencyLevel: 'flash',
        geoContext: [
          { type: 'military', icon: '🛡️', weight: 0.35, severity: 0.9 },
          { type: 'diplomatic', icon: '🤝', weight: 0.20, severity: 0.7 }
        ],
        sourceCredibility: {
          source: 'government',
          rating: 0.95,
          historicalAccuracy: 0.92,
          biasIndicator: 0.1,
        },
        verificationStatus: 'verified',
        relatedEvents: ['demo-2'],
        eventVelocity: 8,
        tags: ['IDF', 'Lebanon', 'Security'],
        source: {
          name: 'IDF Spokesperson',
          url: '#',
          type: 'government',
        },
        decisionWindow: 2,
      },
      {
        id: 'demo-2',
        title: 'Cyber Defense Unit Thwarts Major Infrastructure Attack',
        content: 'National cyber defense teams successfully prevented a sophisticated attack targeting critical infrastructure systems. The attack was attributed to known threat actors.',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2 hours ago
        urgencyLevel: 'priority',
        geoContext: [
          { type: 'cyber', icon: '🔐', weight: 0.15, severity: 0.8 },
          { type: 'military', icon: '🛡️', weight: 0.35, severity: 0.6 }
        ],
        sourceCredibility: {
          source: 'intelligence',
          rating: 0.90,
          historicalAccuracy: 0.88,
          biasIndicator: 0.15,
        },
        verificationStatus: 'verified',
        relatedEvents: ['demo-1'],
        eventVelocity: 5,
        tags: ['Cyber', 'Security', 'Infrastructure'],
        source: {
          name: 'National Cyber Directorate',
          url: '#',
          type: 'intelligence',
        },
      },
      {
        id: 'demo-3',
        title: 'Economic Impact Assessment: Tech Sector Shows Resilience',
        content: 'Despite regional challenges, the Israeli tech sector continues to show strong performance with record foreign investment in Q2. Startup ecosystem remains robust.',
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 4), // 4 hours ago
        urgencyLevel: 'monitor',
        geoContext: [
          { type: 'economic', icon: '📊', weight: 0.25, severity: 0.3 }
        ],
        sourceCredibility: {
          source: 'media_t1',
          rating: 0.85,
          historicalAccuracy: 0.82,
          biasIndicator: 0.25,
        },
        verificationStatus: 'verified',
        relatedEvents: [],
        eventVelocity: 2,
        tags: ['Economy', 'Tech', 'Investment'],
        source: {
          name: 'Financial Times Israel',
          url: '#',
          type: 'media_t1',
        },
      },
    ];
  }

  private deduplicateItems(items: IntelItem[]): IntelItem[] {
    const seen = new Set<string>();
    return items.filter(item => {
      const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  getLastFetchTime(): Date {
    return this.lastFetchTime;
  }
}