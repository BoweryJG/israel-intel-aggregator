import { IntelItem, UrgencyLevel, SourceType } from '../types';

export class LiveRssService {
  private static instance: LiveRssService;

  static getInstance(): LiveRssService {
    if (!LiveRssService.instance) {
      LiveRssService.instance = new LiveRssService();
    }
    return LiveRssService.instance;
  }

  async fetchRealNews(): Promise<IntelItem[]> {
    console.log('Fetching REAL LIVE RSS feeds...');
    
    try {
      // Call our Netlify function that fetches RSS feeds server-side
      const response = await fetch('/.netlify/functions/fetch-rss');
      const data = await response.json();
      
      if (!data.success || !data.items || data.items.length === 0) {
        console.error('No RSS items returned from server');
        return [];
      }
      
      console.log(`Got ${data.items.length} REAL news items`);
      
      // Convert RSS items to IntelItems
      const intelItems = data.items.map((item: any, index: number) => {
        const urgencyLevel = this.determineUrgency(item.title, item.content);
        const sourceType = this.getSourceType(item.source);
        
        return {
          id: `rss-${Date.now()}-${index}`,
          title: item.title,
          content: this.cleanContent(item.content),
          timestamp: new Date(item.pubDate),
          urgencyLevel,
          geoContext: this.extractContexts(item.title, item.content),
          sourceCredibility: {
            source: sourceType,
            rating: this.getSourceRating(sourceType),
            historicalAccuracy: 0.85,
            biasIndicator: 0.3,
          },
          verificationStatus: 'pending' as const,
          relatedEvents: [],
          eventVelocity: urgencyLevel === 'flash' ? 8 : 3,
          tags: this.extractTags(item.title, item.content),
          source: {
            name: this.getSourceName(item.source),
            url: item.link,
            type: sourceType,
          },
          decisionWindow: urgencyLevel === 'flash' ? 1 : undefined,
        } as IntelItem;
      });
      
      // Sort by newest first
      intelItems.sort((a: IntelItem, b: IntelItem) => b.timestamp.getTime() - a.timestamp.getTime());
      
      return intelItems;
    } catch (error) {
      console.error('Error fetching live RSS:', error);
      return [];
    }
  }

  private cleanContent(content: string): string {
    // Remove HTML tags and clean up
    const cleaned = content
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
    
    // Limit length
    return cleaned.length > 300 ? cleaned.substring(0, 297) + '...' : cleaned;
  }

  private determineUrgency(title: string, content: string): UrgencyLevel {
    const text = `${title} ${content}`.toLowerCase();
    
    // FLASH - Immediate threats/attacks
    if (
      text.includes('breaking') ||
      text.includes('explosion') ||
      text.includes('rocket') ||
      text.includes('siren') ||
      text.includes('attack') ||
      text.includes('killed') ||
      text.includes('urgent')
    ) {
      return 'flash';
    }
    
    // PRIORITY - Military/Security developments
    if (
      text.includes('idf') ||
      text.includes('military') ||
      text.includes('operation') ||
      text.includes('security') ||
      text.includes('hamas') ||
      text.includes('hezbollah') ||
      text.includes('iran')
    ) {
      return 'priority';
    }
    
    // MONITOR - Important but not urgent
    if (
      text.includes('minister') ||
      text.includes('government') ||
      text.includes('economy') ||
      text.includes('diplomatic')
    ) {
      return 'monitor';
    }
    
    return 'context';
  }

  private getSourceType(source: string): SourceType {
    const s = source.toLowerCase();
    if (s.includes('idf') || s.includes('government')) return 'government';
    if (s.includes('times of israel') || s.includes('jerusalem post')) return 'media_t1';
    return 'media_t2';
  }

  private getSourceName(source: string): string {
    if (source.includes('Times of Israel')) return 'Times of Israel';
    if (source.includes('Jerusalem Post')) return 'Jerusalem Post';
    if (source.includes('Arutz')) return 'Arutz Sheva';
    if (source.includes('i24')) return 'i24 News';
    if (source.includes('Haaretz')) return 'Haaretz';
    return source;
  }

  private getSourceRating(type: SourceType): number {
    switch (type) {
      case 'government': return 0.95;
      case 'military': return 0.93;
      case 'intelligence': return 0.90;
      case 'media_t1': return 0.85;
      case 'media_t2': return 0.75;
      case 'social': return 0.60;
      default: return 0.70;
    }
  }

  private extractContexts(title: string, content: string) {
    const text = `${title} ${content}`.toLowerCase();
    const contexts = [];

    if (text.includes('military') || text.includes('idf') || text.includes('army')) {
      contexts.push({
        type: 'military' as const,
        icon: '🛡️',
        weight: 0.35,
        severity: 0.8,
      });
    }

    if (text.includes('economic') || text.includes('shekel') || text.includes('market')) {
      contexts.push({
        type: 'economic' as const,
        icon: '📊',
        weight: 0.25,
        severity: 0.5,
      });
    }

    if (text.includes('diplomatic') || text.includes('ambassador') || text.includes('foreign')) {
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

  private extractTags(title: string, content: string): string[] {
    const text = `${title} ${content}`.toLowerCase();
    const tags = [];
    
    if (text.includes('gaza')) tags.push('Gaza');
    if (text.includes('west bank')) tags.push('West Bank');
    if (text.includes('lebanon')) tags.push('Lebanon');
    if (text.includes('syria')) tags.push('Syria');
    if (text.includes('iran')) tags.push('Iran');
    if (text.includes('hamas')) tags.push('Hamas');
    if (text.includes('hezbollah')) tags.push('Hezbollah');
    if (text.includes('idf')) tags.push('IDF');
    if (text.includes('tel aviv')) tags.push('Tel Aviv');
    if (text.includes('jerusalem')) tags.push('Jerusalem');
    
    return tags;
  }
}