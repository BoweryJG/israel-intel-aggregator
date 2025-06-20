import { IntelItem, UrgencyLevel, SourceType } from '../types';

// Using AllOrigins CORS proxy - more reliable than others
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

interface RSSSource {
  url: string;
  name: string;
  type: SourceType;
}

const RSS_SOURCES: RSSSource[] = [
  {
    url: 'https://www.timesofisrael.com/feed/',
    name: 'Times of Israel',
    type: 'media_t1',
  },
  {
    url: 'https://rss.jpost.com/rss/rssfeedsfrontpage.aspx',
    name: 'Jerusalem Post',
    type: 'media_t1',
  },
  {
    url: 'https://www.israelnationalnews.com/rss.aspx',
    name: 'Arutz Sheva',
    type: 'media_t2',
  },
];

export class DirectRssService {
  private static instance: DirectRssService;

  static getInstance(): DirectRssService {
    if (!DirectRssService.instance) {
      DirectRssService.instance = new DirectRssService();
    }
    return DirectRssService.instance;
  }

  async fetchNews(): Promise<IntelItem[]> {
    console.log('Fetching RSS feeds via CORS proxy...');
    const allItems: IntelItem[] = [];

    for (const source of RSS_SOURCES) {
      try {
        console.log(`Fetching ${source.name}...`);
        const response = await fetch(`${CORS_PROXY}${encodeURIComponent(source.url)}`);
        const text = await response.text();
        
        // Parse XML
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        
        // Check for parse errors
        const parseError = xml.querySelector('parsererror');
        if (parseError) {
          console.error(`XML parse error for ${source.name}`);
          continue;
        }
        
        // Extract items
        const items = xml.querySelectorAll('item');
        console.log(`Found ${items.length} items from ${source.name}`);
        
        items.forEach((item, index) => {
          if (index < 20) { // Limit to 20 items per source
            const title = item.querySelector('title')?.textContent || '';
            const description = item.querySelector('description')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || '';
            
            const intelItem = this.createIntelItem(
              title,
              description,
              link,
              pubDate,
              source
            );
            
            allItems.push(intelItem);
          }
        });
      } catch (error) {
        console.error(`Error fetching ${source.name}:`, error);
      }
    }

    // Sort by date
    allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    console.log(`Total items fetched: ${allItems.length}`);
    return allItems;
  }

  private createIntelItem(
    title: string,
    description: string,
    link: string,
    pubDate: string,
    source: RSSSource
  ): IntelItem {
    const cleanDesc = this.stripHtml(description);
    const urgencyLevel = this.determineUrgency(title, cleanDesc);
    
    return {
      id: `rss-${Date.now()}-${Math.random()}`,
      title,
      content: cleanDesc.length > 300 ? cleanDesc.substring(0, 297) + '...' : cleanDesc,
      timestamp: new Date(pubDate || Date.now()),
      urgencyLevel,
      geoContext: this.extractContext(title, cleanDesc),
      sourceCredibility: {
        source: source.type,
        rating: source.type === 'media_t1' ? 0.85 : 0.75,
        historicalAccuracy: 0.82,
        biasIndicator: 0.25,
      },
      verificationStatus: 'pending',
      relatedEvents: [],
      eventVelocity: urgencyLevel === 'flash' ? 10 : 3,
      tags: this.extractTags(title, cleanDesc),
      source: {
        name: source.name,
        url: link,
        type: source.type,
      },
      decisionWindow: urgencyLevel === 'flash' ? 1 : undefined,
    };
  }

  private stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').trim();
  }

  private determineUrgency(title: string, content: string): UrgencyLevel {
    const text = `${title} ${content}`.toLowerCase();
    
    if (
      text.includes('breaking') ||
      text.includes('urgent') ||
      text.includes('explosion') ||
      text.includes('attack') ||
      text.includes('siren')
    ) {
      return 'flash';
    }
    
    if (
      text.includes('idf') ||
      text.includes('military') ||
      text.includes('security') ||
      text.includes('operation')
    ) {
      return 'priority';
    }
    
    if (
      text.includes('minister') ||
      text.includes('government') ||
      text.includes('economy')
    ) {
      return 'monitor';
    }
    
    return 'context';
  }

  private extractContext(title: string, content: string) {
    const text = `${title} ${content}`.toLowerCase();
    const contexts = [];

    if (text.includes('military') || text.includes('idf')) {
      contexts.push({
        type: 'military' as const,
        icon: '🛡️',
        weight: 0.35,
        severity: 0.8,
      });
    }

    if (text.includes('economic') || text.includes('market')) {
      contexts.push({
        type: 'economic' as const,
        icon: '📊',
        weight: 0.25,
        severity: 0.5,
      });
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
    if (text.includes('hamas')) tags.push('Hamas');
    if (text.includes('jerusalem')) tags.push('Jerusalem');
    
    return tags;
  }
}