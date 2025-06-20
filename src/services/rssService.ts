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
  {
    url: 'https://www.ynetnews.com/rss/category/3089',
    name: 'Ynet News',
    type: 'media_t1',
    trustScore: 0.80,
  },
  {
    url: 'https://www.haaretz.com/cmlink/1.628765',
    name: 'Haaretz',
    type: 'media_t1',
    trustScore: 0.80,
  },
  {
    url: 'https://www.israelnationalnews.com/rss.aspx',
    name: 'Arutz Sheva',
    type: 'media_t2',
    trustScore: 0.75,
  },
];

const CORS_PROXY = 'https://api.allorigins.win/get?url=';

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

  private async fetchRSSFeed(source: RSSSource): Promise<IntelItem[]> {
    try {
      const response = await axios.get(`${CORS_PROXY}${encodeURIComponent(source.url)}`);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data.contents, 'text/xml');
      
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
    
    const fetchPromises = RSS_SOURCES.map(source => this.fetchRSSFeed(source));
    const results = await Promise.all(fetchPromises);
    
    results.forEach(items => {
      allItems.push(...items);
    });
    
    // Sort by timestamp (newest first)
    allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Deduplicate by title similarity
    const uniqueItems = this.deduplicateItems(allItems);
    
    this.lastFetchTime = new Date();
    
    return uniqueItems;
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