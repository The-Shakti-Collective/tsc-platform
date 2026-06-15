import { Injectable } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { assertOrgManage, assertOrgRead } from '../../common/org/org-access';
import type { ExpenseCreateInput } from './dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async listExpenses(
    organizationId: string,
    ctx: MembershipContext,
    limit = 50,
  ) {
    assertOrgRead(ctx, organizationId);
    const rows = await this.prisma.client.expense.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return {
      organizationId,
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        amount: Number(row.amount),
        currency: row.currency,
        status: row.status,
        category: row.category,
        incurredAt: row.incurredAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async createExpense(input: ExpenseCreateInput, ctx: MembershipContext) {
    assertOrgManage(ctx, input.organizationId);
    const row = await this.prisma.client.expense.create({
      data: {
        id: newId(),
        organizationId: input.organizationId,
        title: input.title,
        amount: input.amount,
        currency: input.currency ?? 'INR',
        category: input.category ?? null,
        incurredAt: input.incurredAt ? new Date(input.incurredAt) : null,
        status: input.status ?? 'draft',
      },
    });
    return {
      id: row.id,
      organizationId: row.organizationId,
      title: row.title,
      amount: Number(row.amount),
      status: row.status,
    };
  }

  async summary(organizationId: string, ctx: MembershipContext) {
    assertOrgRead(ctx, organizationId);
    const [expenses, revenue] = await Promise.all([
      this.prisma.client.expense.aggregate({
        where: { organizationId, status: { in: ['approved', 'paid'] } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.client.revenueTransaction.aggregate({
        where: {
          deal: { opportunity: { organizationId } },
          type: 'received',
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      organizationId,
      expensesTotal: Number(expenses._sum.amount ?? 0),
      expensesCount: expenses._count,
      revenueTotal: Number(revenue._sum.amount ?? 0),
      revenueCount: revenue._count,
      updatedAt: new Date().toISOString(),
    };
  }
}
