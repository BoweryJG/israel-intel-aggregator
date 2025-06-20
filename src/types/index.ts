export type UrgencyLevel = 'flash' | 'priority' | 'monitor' | 'context';
export type VerificationStatus = 'verified' | 'pending' | 'unverified';
export type SourceType = 'government' | 'military' | 'intelligence' | 'media_t1' | 'media_t2' | 'social';

export interface ContextLayer {
  type: 'military' | 'economic' | 'diplomatic' | 'cyber' | 'social';
  icon: string;
  weight: number;
  severity: number;
}

export interface CredibilityScore {
  source: SourceType;
  rating: number;
  historicalAccuracy: number;
  biasIndicator: number;
}

export interface GeoRadius {
  center: [number, number];
  radius: number;
  impactLevel: number;
}

export interface IntelItem {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  urgencyLevel: UrgencyLevel;
  geoContext: ContextLayer[];
  sourceCredibility: CredibilityScore;
  verificationStatus: VerificationStatus;
  relatedEvents: string[];
  impactRadius?: GeoRadius;
  decisionWindow?: number;
  source: {
    name: string;
    url: string;
    type: SourceType;
  };
  eventVelocity?: number;
  tags: string[];
}

export interface FeedFilter {
  urgencyLevels: UrgencyLevel[];
  contextTypes: ContextLayer['type'][];
  verificationStatus: VerificationStatus[];
  timeRange: 'hour' | 'day' | 'week' | 'all';
  searchQuery?: string;
  sourceTypes?: SourceType[];
  sourceNames?: string[];
}