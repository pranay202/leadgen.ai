import axios from 'axios';
import prisma from '../utils/prisma';
import { enrichBusiness } from '../utils/enrichment';
import { calculateLeadScore } from './scoring.service';

export interface ScrapeResult {
  name: string;
  phone?: string;
  address?: string;
  website?: string;
}

export type ScraperType = 'GOOGLE_MAPS' | 'CRAWLEE';

export const scrapeGoogleMaps = async (
  city: string,
  category: string,
  limit: number = 100
): Promise<ScrapeResult[]> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY is not set in environment variables');
  }

  console.log(`Scraping real leads for ${category} in ${city} via Google Places API...`);
  
  const results: ScrapeResult[] = [];
  let nextPageToken: string | undefined = undefined;

  try {
    while (results.length < limit) {
      const searchUrl: string = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(`${category} in ${city}`)}&key=${apiKey}${nextPageToken ? `&pagetoken=${nextPageToken}` : ''}`;
      
      const response = await axios.get(searchUrl);
      const data: any = response.data;

      console.log(`GOOGLE MAPS SCRAPER: Status=${data.status}, Results=${data.results?.length || 0}`);
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Maps API Error:', data.status, data.error_message);
        break;
      }

      const places: any[] = data.results || [];
      if (places.length === 0) break;

      for (const place of places) {
        if (results.length >= limit) break;

        // To get website and phone, we need a Place Details call
        try {
          const detailsUrl: string = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,formatted_address,website&key=${apiKey}`;
          const detailsResponse = await axios.get(detailsUrl);
          const details: any = detailsResponse.data.result;

          if (details) {
            console.log(`FOUND: ${details.name}`);
            results.push({
              name: details.name || place.name,
              phone: details.formatted_phone_number,
              address: details.formatted_address || place.formatted_address,
              website: details.website,
            });
          }
        } catch (detailsError) {
          console.warn(`Failed to fetch details for ${place.name}:`, detailsError);
          // Fallback to basic info if details fail
          results.push({
            name: place.name,
            address: place.formatted_address,
          });
        }
      }

      nextPageToken = data.next_page_token;
      if (!nextPageToken || results.length >= limit) break;

      // Google requires a short delay before the next_page_token becomes valid
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error('Scraping process encountered an error:', error);
  }

  return results;
};

export const processScrapeJob = async (jobId: string) => {
  const job = await prisma.scrapeJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  try {
    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    const leads = job.scraper === 'CRAWLEE'
      ? await (await import('./crawlee-scraper.service')).scrapeWithCrawlee(job.city, job.category, job.limit)
      : await scrapeGoogleMaps(job.city, job.category, job.limit);
    let leadsCount = 0;

    for (const lead of leads) {
      try {
        let enrichment = {
          email: null as string | null,
          owner: null as string | null,
          employeeCount: null as string | null,
          revenue: null as string | null,
          domainAge: null as number | null,
          isHttps: false
        };

        if (lead.website) {
          enrichment = await enrichBusiness(lead.website);
        }

        const score = calculateLeadScore({
          hasWebsite: !!lead.website,
          domainAge: enrichment.domainAge,
          hasEmail: !!enrichment.email,
          isHttps: enrichment.isHttps,
        });

        await prisma.business.create({
          data: {
            scrapeJobId: jobId,
            name: lead.name,
            phone: lead.phone,
            address: lead.address,
            website: lead.website,
            domainAge: enrichment.domainAge,
            email: enrichment.email,
            owner: enrichment.owner,
            employeeCount: enrichment.employeeCount,
            revenue: enrichment.revenue,
            score,
          },
        });
        leadsCount++;
      } catch (err) {
        console.warn(`Could not save lead ${lead.name} for job ${jobId}:`, err);
      }
    }

    if (leads.length > 0 && leadsCount === 0) {
      throw new Error(`Crawler returned ${leads.length} leads, but none could be saved for job ${jobId}`);
    }

    // Only Google Maps leads consume the account's Google Maps quota.
    if (job.scraper === 'GOOGLE_MAPS') {
      await prisma.user.update({
        where: { id: job.userId },
        data: { leadsUsed: { increment: leadsCount } },
      });
    }

    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED' },
    });
  } catch (error) {
    console.error('Job failed:', error);
    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: { status: 'FAILED' },
    });
  }
};
