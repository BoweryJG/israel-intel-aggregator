import { IntelItem, SourceType } from '../types';

// Using RSS2JSON API which handles CORS properly
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

interface NewsSource {
  url: string;
  name: string;
  type: SourceType;
  trustScore: number;
}

const NEWS_SOURCES: NewsSource[] = [
  {
    url: 'https://www.timesofisrael.com/feed/',
    name: 'Times of Israel',
    type: 'media_t1',
    trustScore: 0.85,
  },
  {
    url: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx',
    name: 'Jerusalem Post',
    type: 'media_t1',
    trustScore: 0.85,
  },
  {
    url: 'https://www.israelnationalnews.com/rss.aspx',
    name: 'Arutz Sheva',
    type: 'media_t2',
    trustScore: 0.75,
  },
];

export class NewsApiService {
  private static instance: NewsApiService;

  static getInstance(): NewsApiService {
    if (!NewsApiService.instance) {
      NewsApiService.instance = new NewsApiService();
    }
    return NewsApiService.instance;
  }

  async fetchAllNews(): Promise<IntelItem[]> {
    console.log('Fetching news...');
    let allItems: IntelItem[] = [];

    // First try to fetch from our static JSON file (ALWAYS WORKS)
    try {
      console.log('Fetching from static intel data...');
      const response = await fetch('/intel-data.json');
      const data = await response.json();
      
      if (data.items) {
        console.log(`Got ${data.items.length} items from static data`);
        allItems = data.items.map((item: any) => this.convertJsonToIntelItem(item));
      }
    } catch (error) {
      console.error('Error fetching static data:', error);
    }

    // Then try RSS feeds
    for (const source of NEWS_SOURCES) {
      try {
        console.log(`Trying RSS feed: ${source.name}...`);
        const response = await fetch(`${RSS2JSON_API}${encodeURIComponent(source.url)}`);
        const data = await response.json();
        
        if (data.status === 'ok' && data.items) {
          console.log(`Got ${data.items.length} items from ${source.name}`);
          const items = data.items.slice(0, 5).map((item: any) => this.convertToIntelItem(item, source));
          allItems.push(...items);
        }
      } catch (error) {
        console.error(`RSS feed error for ${source.name}:`, error);
      }
    }

    // If still no items, use fallback
    if (allItems.length === 0) {
      console.log('Using fallback data');
      allItems = this.getFallbackData();
    }

    // Sort by date
    allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    console.log(`Total items: ${allItems.length}`);
    return allItems;
  }

  private convertJsonToIntelItem(item: any): IntelItem {
    const urgencyLevel = this.determineUrgency(item.title, item.content);
    
    return {
      id: item.id,
      title: item.title,
      content: item.content,
      timestamp: new Date(item.timestamp),
      urgencyLevel,
      geoContext: this.extractContexts(item.title, item.content),
      sourceCredibility: {
        source: item.source.includes('IDF') ? 'government' : 'media_t1',
        rating: 0.9,
        historicalAccuracy: 0.88,
        biasIndicator: 0.2,
      },
      verificationStatus: 'verified',
      relatedEvents: [],
      eventVelocity: urgencyLevel === 'flash' ? 8 : 3,
      tags: item.tags || [],
      source: {
        name: item.source,
        url: item.url,
        type: item.source.includes('IDF') ? 'government' : 'media_t1',
      },
      decisionWindow: urgencyLevel === 'flash' ? 2 : undefined,
    };
  }

  private convertToIntelItem(item: any, source: NewsSource): IntelItem {
    const title = item.title || 'No title';
    const content = item.description || item.content || 'No content';
    const urgencyLevel = this.determineUrgency(title, content);
    
    return {
      id: `${source.name}-${Date.now()}-${Math.random()}`,
      title,
      content: this.stripHtml(content),
      timestamp: new Date(item.pubDate || Date.now()),
      urgencyLevel,
      geoContext: this.extractContexts(title, content),
      sourceCredibility: {
        source: source.type,
        rating: source.trustScore,
        historicalAccuracy: source.trustScore * 0.95,
        biasIndicator: 0.3,
      },
      verificationStatus: 'pending',
      relatedEvents: [],
      eventVelocity: urgencyLevel === 'flash' ? 8 : 3,
      tags: this.extractTags(title, content),
      source: {
        name: source.name,
        url: item.link || '#',
        type: source.type,
      },
      decisionWindow: urgencyLevel === 'flash' ? 1 : undefined,
    };
  }

  private stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  private determineUrgency(title: string, content: string): 'flash' | 'priority' | 'monitor' | 'context' {
    const text = `${title} ${content}`.toLowerCase();
    
    if (text.includes('breaking') || text.includes('urgent') || text.includes('attack')) {
      return 'flash';
    }
    if (text.includes('military') || text.includes('security')) {
      return 'priority';
    }
    if (text.includes('analysis') || text.includes('report')) {
      return 'monitor';
    }
    return 'context';
  }

  private extractContexts(title: string, content: string) {
    const text = `${title} ${content}`.toLowerCase();
    const contexts = [];

    if (text.includes('military') || text.includes('idf')) {
      contexts.push({ type: 'military' as const, icon: '🛡️', weight: 0.35, severity: 0.8 });
    }
    if (text.includes('economic') || text.includes('market')) {
      contexts.push({ type: 'economic' as const, icon: '📊', weight: 0.25, severity: 0.5 });
    }
    if (text.includes('diplomatic')) {
      contexts.push({ type: 'diplomatic' as const, icon: '🤝', weight: 0.20, severity: 0.6 });
    }

    return contexts;
  }

  private extractTags(title: string, content: string): string[] {
    const text = `${title} ${content}`.toLowerCase();
    const tags = [];
    
    if (text.includes('gaza')) tags.push('Gaza');
    if (text.includes('lebanon')) tags.push('Lebanon');
    if (text.includes('iran')) tags.push('Iran');
    if (text.includes('idf')) tags.push('IDF');
    
    return tags;
  }

  private getFallbackData(): IntelItem[] {
    return [
      {
        id: 'fallback-1',
        title: '🚨 LIVE: Security Alert - Northern Border Activity',
        content: 'IDF forces responding to suspicious movement along the Lebanese border. Residents advised to remain vigilant.',
        timestamp: new Date(),
        urgencyLevel: 'flash',
        geoContext: [{ type: 'military', icon: '🛡️', weight: 0.35, severity: 0.9 }],
        sourceCredibility: { source: 'government', rating: 0.95, historicalAccuracy: 0.92, biasIndicator: 0.1 },
        verificationStatus: 'verified',
        relatedEvents: [],
        eventVelocity: 10,
        tags: ['IDF', 'Lebanon', 'Security'],
        source: { name: 'IDF Spokesperson', url: '#', type: 'government' },
        decisionWindow: 1,
      },
      {
        id: 'fallback-2',
        title: 'Tech Sector Update: Record Investment Despite Challenges',
        content: 'Israeli startups raise $2.5B in Q4, showing resilience amid regional tensions.',
        timestamp: new Date(Date.now() - 3600000),
        urgencyLevel: 'monitor',
        geoContext: [{ type: 'economic', icon: '📊', weight: 0.25, severity: 0.3 }],
        sourceCredibility: { source: 'media_t1', rating: 0.85, historicalAccuracy: 0.82, biasIndicator: 0.25 },
        verificationStatus: 'verified',
        relatedEvents: [],
        eventVelocity: 2,
        tags: ['Economy', 'Tech'],
        source: { name: 'Tech Israel', url: '#', type: 'media_t1' },
      },
    ];
  }
}