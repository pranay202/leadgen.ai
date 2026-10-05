import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const upgradePlan = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { plan } = req.body;

  if (plan !== 'PRO') {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        plan: 'PRO',
        leadsLimit: 1000,
      },
    });

    res.json({ message: 'Upgraded to PRO successfully', user: { id: user.id, plan: user.plan, leadsLimit: user.leadsLimit } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
