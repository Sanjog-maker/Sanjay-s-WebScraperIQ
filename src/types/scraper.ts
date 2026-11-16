export type ScrapeTargetType = 'products' | 'jobs' | 'news' | 'custom';

export interface ProductItem {
  id: string;
  url: string;
  title: string;
  price: number;
  originalPrice?: number;
  currency: string;
  discountPercent?: number;
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
  category: string;
  brand?: string;
  sku?: string;
  imageUrl?: string;
  scrapedAt: string;
  priceHistory?: { date: string; price: number }[];
  hasPriceDrop?: boolean;
}

export interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: 'year' | 'month' | 'hour';
  isRemote: boolean;
  employmentType: string;
  datePosted: string;
  url: string;
  scrapedAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  author?: string;
  publisher: string;
  publishedAt: string;
  summary: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  url: string;
  scrapedAt: string;
}

export type ScrapedItem = ProductItem | JobItem | NewsItem | Record<string, any>;

export interface CleaningRuleConfig {
  dropDuplicates: boolean;
  dedupeKey: 'url' | 'title' | 'sku' | 'composite';
  handleMissing: 'drop' | 'impute_mean' | 'impute_median' | 'impute_default';
  defaultStockStatus: boolean;
  stripHtmlTags: boolean;
  normalizeCurrency: boolean;
  normalizeDates: boolean;
  minPriceThreshold?: number;
  maxPriceThreshold?: number;
}

export interface DataCleaningReport {
  rawCount: number;
  cleanCount: number;
  duplicatesRemoved: number;
  missingValuesFilled: Record<string, number>;
  invalidRowsDropped: number;
  normalizedCurrencies: number;
  executionTimeMs: number;
  timestamp: string;
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'price_drop' | 'stock_available' | 'keyword_match';
  targetType: ScrapeTargetType;
  field?: string;
  operator?: 'less_than' | 'equals' | 'greater_than' | 'contains';
  value?: any;
  percentageDrop?: number;
  condition?: {
    field: string;
    operator: 'less_than' | 'equals' | 'greater_than' | 'contains';
    value: any;
    percentageDrop?: number;
  };
  recipientEmail: string;
  isEnabled: boolean;
  lastTriggeredAt?: string;
  triggerCount: number;
  createdAt?: string;
}

export interface AlertTriggerEvent {
  id: string;
  alertId: string;
  alertName: string;
  itemTitle: string;
  itemUrl: string;
  oldPrice?: number;
  newPrice?: number;
  eventMessage: string;
  emailSentTo: string;
  timestamp: string;
  status: 'sent' | 'queued' | 'simulated';
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Lead Analyst' | 'Scraper Operator';
  token: string;
}

export interface ScrapeJobConfig {
  id: string;
  name: string;
  targetType: ScrapeTargetType;
  url: string;
  rawHtml?: string;
  multiPage: boolean;
  maxPages: number;
  pageParam: string;
  itemSelector?: string;
  customSelectors?: Record<string, string>;
  createdAt: string;
}
