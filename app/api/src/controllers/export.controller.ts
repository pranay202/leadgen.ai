import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { stringify } from 'csv-stringify';

export const exportJobCsv = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const job = await prisma.scrapeJob.findUnique({
      where: { id },
      include: { businesses: true },
    });

    if (!job) return res.status(404).json({ error: 'Job not found' });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leads-${id}.csv"`);

    const columns = [
      'name',
      'phone',
      'address',
      'website',
      'domainAge',
      'email',
      'owner',
      'employeeCount',
      'revenue',
      'score',
    ];

    const stringifier = stringify({ header: true, columns: columns });
    stringifier.pipe(res);

    for (const business of job.businesses) {
      stringifier.write({
        name: business.name,
        phone: business.phone || '',
        address: business.address || '',
        website: business.website || '',
        domainAge: business.domainAge || '',
        email: business.email || '',
        owner: business.owner || '',
        employeeCount: business.employeeCount || '',
        revenue: business.revenue || '',
        score: business.score,
      });
    }

    stringifier.end();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
