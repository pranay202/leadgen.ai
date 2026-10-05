import axios from 'axios';

export interface EnrichmentResult {
  email: string | null;
  owner: string | null;
  employeeCount: string | null;
  revenue: string | null;
  isHttps: boolean;
  domainAge: number | null;
}

export const getDomainAge = async (url: string): Promise<number | null> => {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const response = await axios.get(`https://api.api-ninjas.com/v1/whois?domain=${domain}`, {
      headers: {
        'Referer': 'https://api-ninjas.com/',
        'Origin': 'https://api-ninjas.com'
      },
      timeout: 5000
    });

    const data = response.data;
    if (data && data.creation_date) {
      // creation_date can be a string or number (timestamp)
      const creationTimestamp = typeof data.creation_date === 'number' ? data.creation_date * 1000 : Date.parse(data.creation_date);
      if (!isNaN(creationTimestamp)) {
        const creationYear = new Date(creationTimestamp).getFullYear();
        const currentYear = new Date().getFullYear();
        return Math.max(0, currentYear - creationYear);
      }
    }
    return null;
  } catch (error) {
    console.warn(`WHOIS API failed for ${url}:`, (error as any).message);
    return null;
  }
};

export const checkIsHttps = (url: string): boolean => {
  return url.startsWith('https://');
};

export const enrichBusiness = async (url: string): Promise<EnrichmentResult> => {
  try {
    const response = await axios.get(url, { timeout: 8000 });
    const html = response.data as string;
    const text = html.replace(/<[^>]*>?/gm, ' '); // Strip HTML tags for regex

    // Constants
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const ownerPatterns = [
      /founder:?\s+([A-Z][a-z]+\s[A-Z][a-z]+)/i,
      /ceo:?\s+([A-Z][a-z]+\s[A-Z][a-z]+)/i,
      /director:?\s+([A-Z][a-z]+\s[A-Z][a-z]+)/i,
      /owner:?\s+([A-Z][a-z]+\s[A-Z][a-z]+)/i,
      /founder\s+and\s+ceo:?\s+([A-Z][a-z]+\s[A-Z][a-z]+)/i,
    ];
    const employeePatterns = [
        /(\d+-\d+)\s+employees/i,
        /(\d+\+?)\s+employees/i,
        /team\s+of\s+(\d+\+?)/i,
        /staff\s+of\s+(\d+\+?)/i,
    ];
    const turnoverPatterns = [
        /revenue:?\s+(\$?\d+[\d,.]*[m|b]?)/i,
        /turnover:?\s+(\$?\d+[\d,.]*[m|b]?)/i,
        /valuation:?\s+(\$?\d+[\d,.]*[m|b]?)/i,
    ];

    const result: EnrichmentResult = {
      email: html.match(emailRegex)?.[0] || null,
      owner: null,
      employeeCount: null,
      revenue: null,
      isHttps: checkIsHttps(url),
      domainAge: await getDomainAge(url),
    };

    // Best-effort extraction
    for (const pattern of ownerPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result.owner = match[1].trim();
        break;
      }
    }

    for (const pattern of employeePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result.employeeCount = match[1].trim();
        break;
      }
    }

    for (const pattern of turnoverPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        result.revenue = match[1].trim();
        break;
      }
    }

    return result;
  } catch (error) {
    return {
      email: null,
      owner: null,
      employeeCount: null,
      revenue: null,
      isHttps: checkIsHttps(url),
      domainAge: null,
    };
  }
};
