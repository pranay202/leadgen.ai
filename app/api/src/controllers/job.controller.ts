import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { processScrapeJob } from '../services/scraper.service';

export const MAX_SCRAPE_LIMIT = 1000;

export const createScrapeJob = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { city, category, scraper = 'GOOGLE_MAPS' } = req.body;
  const limit = Number(req.body.limit);
  console.log(`CREATE JOB REQUEST: user=${userId}, city=${city}, category=${category}, limit=${limit}, scraper=${scraper}`);

  try {
    if (typeof city !== 'string' || !city.trim() || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'City and business category are required' });
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_SCRAPE_LIMIT) {
      return res.status(400).json({ error: `Lead limit must be an integer between 1 and ${MAX_SCRAPE_LIMIT}` });
    }
    if (scraper !== 'GOOGLE_MAPS' && scraper !== 'CRAWLEE') {
      return res.status(400).json({ error: 'Invalid scraper type' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.warn(`USER NOT FOUND: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.leadsUsed + limit > user.leadsLimit) {
      console.warn(`LIMIT EXCEEDED: used=${user.leadsUsed}, limit=${user.leadsLimit}, requested=${limit}`);
      return res.status(403).json({ error: 'Usage limit exceeded' });
    }

    const job = await prisma.scrapeJob.create({
      data: {
        userId,
        city: city.trim(),
        category: category.trim(),
        limit,
        scraper,
      },
    });

    console.log(`JOB CREATED: ${job.id}`);
    // Start background processing
    processScrapeJob(job.id);

    res.status(202).json({ jobId: job.id, message: 'Scrape job started' });
  } catch (error: any) {
    console.error('CREATE JOB ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getJobResults = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const job = await prisma.scrapeJob.findUnique({
      where: { id },
      include: { businesses: true },
    });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
export const getJobList = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  console.log(`GET JOBS REQUEST: user=${userId}`);
  try {
    const jobs = await prisma.scrapeJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    console.log(`JOBS FOUND: ${jobs.length}`);
    res.json(jobs);
  } catch (error: any) {
    console.error('GET JOBS ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};
export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.scrapeJob.findMany({
      include: { businesses: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
