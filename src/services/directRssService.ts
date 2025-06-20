import { IntelItem, UrgencyLevel, SourceType } from '../types';

// Multiple CORS proxies for fallback
const CORS_PROXIES = [
  '/.netlify/functions/rss-proxy?url=', // Try local Netlify function first
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://thingproxy.freeboard.io/fetch/',
  'https://proxy.cors.sh/',
  'https://cors-anywhere.herokuapp.com/'
];

interface RSSSource {
  url: string;
  name: string;
  type: SourceType;
}

const RSS_SOURCES: RSSSource[] = [
  // Israeli Media
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
    url: 'https://www.israelnationalnews.com/rss',
    name: 'Arutz Sheva',
    type: 'media_t2',
  },
  {
    url: 'https://www.ynetnews.com/Integration/StoryRss2.xml',
    name: 'Ynet News',
    type: 'media_t1',
  },
  // International Coverage
  {
    url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml',
    name: 'BBC Middle East',
    type: 'media_t1',
  },
  {
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    name: 'Al Jazeera',
    type: 'media_t2',
  },
  {
    url: 'https://rss.cnn.com/rss/cnn_world.rss',
    name: 'CNN World',
    type: 'media_t2',
  },
  // Reddit Feeds - Conflict/Military/Intelligence
  {
    url: 'https://www.reddit.com/r/worldnews/.rss?limit=50',
    name: 'r/worldnews',
    type: 'social',
  },
  {
    url: 'https://www.reddit.com/r/geopolitics/.rss?limit=30',
    name: 'r/geopolitics',
    type: 'social',
  },
  {
    url: 'https://www.reddit.com/r/CredibleDefense/.rss?limit=30',
    name: 'r/CredibleDefense',
    type: 'social',
  },
  {
    url: 'https://www.reddit.com/r/LevantineWar/.rss?limit=30',
    name: 'r/LevantineWar',
    type: 'social',
  },
  {
    url: 'https://www.reddit.com/r/IsraelPalestine/.rss?limit=30',
    name: 'r/IsraelPalestine',
    type: 'social',
  },
  // Military/Defense
  {
    url: 'https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml',
    name: 'Defense News',
    type: 'military',
  },
  {
    url: 'https://www.timesofisrael.com/feed/category/defense/',
    name: 'Times of Israel Defense',
    type: 'military',
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
      let fetchSuccess = false;
      
      // Try each proxy until one works
      for (const proxy of CORS_PROXIES) {
        try {
          const proxyName = proxy.includes('netlify') ? 'Netlify function' : proxy.split('/')[2];
          console.log(`Fetching ${source.name} via ${proxyName}...`);
          const response = await fetch(`${proxy}${encodeURIComponent(source.url)}`, {
            signal: AbortSignal.timeout(8000) // 8 second timeout
          });
          
          // Skip if bad response
          if (!response.ok) {
            console.error(`HTTP ${response.status} for ${source.name} via ${proxyName}`);
            continue;
          }
          
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
          
          // Extract items - handle both regular RSS and Reddit's Atom format
          let items = xml.querySelectorAll('item');
          
          // If no items, try Atom format (Reddit uses this)
          if (items.length === 0) {
            items = xml.querySelectorAll('entry');
          }
          
          console.log(`Found ${items.length} items from ${source.name}`);
          
          items.forEach((item, index) => {
            // Higher limit for social media sources to catch more updates
            const itemLimit = source.type === 'social' ? 30 : 20;
            if (index < itemLimit) {
              // Standard RSS
              let title = item.querySelector('title')?.textContent || '';
              let description = item.querySelector('description')?.textContent || '';
              let link = item.querySelector('link')?.textContent || '';
              let pubDate = item.querySelector('pubDate')?.textContent || '';
              
              // Atom format (Reddit)
              if (!pubDate) {
                pubDate = item.querySelector('published')?.textContent || '';
              }
              if (!description) {
                description = item.querySelector('content')?.textContent || '';
              }
              if (!link && item.querySelector('link')) {
                link = item.querySelector('link')?.getAttribute('href') || '';
              }
              
              // Skip if no title
              if (!title) return;
              
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
          
          fetchSuccess = true;
          break; // Successfully fetched from this proxy, move to next source
          
        } catch (error) {
          const proxyName = proxy.includes('netlify') ? 'Netlify function' : proxy.split('/')[2];
          console.error(`Error with ${proxyName} for ${source.name}:`, error);
          // Continue to next proxy
        }
      }
      
      if (!fetchSuccess) {
        console.error(`All proxies failed for ${source.name}`);
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
    
    // FLASH - Immediate threats/attacks
    if (
      text.includes('breaking') ||
      text.includes('urgent') ||
      text.includes('explosion') ||
      text.includes('attack') ||
      text.includes('siren') ||
      text.includes('missile') ||
      text.includes('rocket') ||
      text.includes('strike') ||
      text.includes('killed') ||
      text.includes('casualties') ||
      text.includes('intercepted') ||
      text.includes('ballistic') ||
      text.includes('drone attack') ||
      text.includes('air raid')
    ) {
      return 'flash';
    }
    
    // PRIORITY - Military/Security developments
    if (
      text.includes('idf') ||
      text.includes('military') ||
      text.includes('security') ||
      text.includes('operation') ||
      text.includes('iran') ||
      text.includes('hezbollah') ||
      text.includes('hamas') ||
      text.includes('pentagon') ||
      text.includes('deployment') ||
      text.includes('retaliation') ||
      text.includes('escalation') ||
      text.includes('nuclear') ||
      text.includes('uranium') ||
      text.includes('irgc') ||
      text.includes('revolutionary guard')
    ) {
      return 'priority';
    }
    
    // MONITOR - Important developments
    if (
      text.includes('minister') ||
      text.includes('government') ||
      text.includes('economy') ||
      text.includes('sanctions') ||
      text.includes('diplomatic') ||
      text.includes('united nations') ||
      text.includes('biden') ||
      text.includes('netanyahu') ||
      text.includes('khamenei')
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
    
    // Locations
    if (text.includes('gaza')) tags.push('Gaza');
    if (text.includes('lebanon')) tags.push('Lebanon');
    if (text.includes('iran')) tags.push('Iran');
    if (text.includes('syria')) tags.push('Syria');
    if (text.includes('yemen')) tags.push('Yemen');
    if (text.includes('iraq')) tags.push('Iraq');
    if (text.includes('jerusalem')) tags.push('Jerusalem');
    if (text.includes('tel aviv')) tags.push('Tel Aviv');
    if (text.includes('tehran')) tags.push('Tehran');
    
    // Organizations
    if (text.includes('idf')) tags.push('IDF');
    if (text.includes('hamas')) tags.push('Hamas');
    if (text.includes('hezbollah')) tags.push('Hezbollah');
    if (text.includes('irgc') || text.includes('revolutionary guard')) tags.push('IRGC');
    if (text.includes('houthis')) tags.push('Houthis');
    
    // Military terms
    if (text.includes('missile')) tags.push('Missiles');
    if (text.includes('drone')) tags.push('Drones');
    if (text.includes('nuclear')) tags.push('Nuclear');
    if (text.includes('f-35') || text.includes('f35')) tags.push('F-35');
    if (text.includes('iron dome')) tags.push('Iron Dome');
    
    // Conflict terms
    if (text.includes('escalation')) tags.push('Escalation');
    if (text.includes('retaliation')) tags.push('Retaliation');
    if (text.includes('casualties')) tags.push('Casualties');
    
    // Key figures
    if (text.includes('netanyahu')) tags.push('Netanyahu');
    if (text.includes('khamenei')) tags.push('Khamenei');
    if (text.includes('biden')) tags.push('Biden');
    
    return Array.from(new Set(tags)); // Remove duplicates
  }
}