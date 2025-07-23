const prisma = require('../config/db');
const sendResponse = require('../helper/sendResponse');

exports.getInvoiceSummary = async (req, res, next) => {
  const userId = req.user.id;
  const { month, day } = req.query;

  try {
    let dateFilter = {};

    if (month) {
      const parsedMonth = parseInt(month);
      if (parsedMonth < 1 || parsedMonth > 12) {
        return sendResponse(res, 400, false, 'Invalid month', []);
      }
      dateFilter = {
        ...dateFilter,
        createdAt: {
          gte: new Date(new Date().getFullYear(), parsedMonth - 1, 1),
          lt: new Date(new Date().getFullYear(), parsedMonth, 1)
        }
      };
    }

    if (day && month) {
      const parsedDay = parseInt(day);
      dateFilter = {
        createdAt: {
          gte: new Date(
            new Date().getFullYear(),
            parseInt(month) - 1,
            parsedDay
          ),
          lt: new Date(
            new Date().getFullYear(),
            parseInt(month) - 1,
            parsedDay + 1
          )
        }
      };
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        ...dateFilter
      },
      select: {
        total: true,
        status: true
      }
    });

    const totalInvoices = invoices.length;
    const paid = invoices.filter((inv) => inv.status === 'PAID');
    const unpaid = invoices.filter((inv) => inv.status !== 'PAID');
    const totalRevenue = paid.reduce((sum, inv) => sum + inv.total, 0);

    return sendResponse(res, 200, true, 'Summary fetched', {
      data: {
        totalRevenue,
        totalInvoices,
        paid: paid.length,
        unpaid: unpaid.length
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecentInvoices = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const recentInvoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        clientName: true,
        clientEmail: true,
        total: true,
        status: true,
        createdAt: true
      }
    });

    return sendResponse(res, 200, true, 'recent invoice', recentInvoices);
  } catch (error) {
    next(error);
  }
};

exports.getPaidOrUnpaid = async (req, res, next) => {
  const userId = req.body.id;
  const status = req.query.status?.toUpperCase();
  try {
    if (!['PAID', 'UNPAID', 'OVERDUE', 'FAILED'].includes(status)) {
      return sendResponse(res, 400, false, 'Invalid status value', []);
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        status
      }
    });

    sendResponse(res, 200, true, `Invoices with status: ${status}`, invoices);
  } catch (error) {
    next(error);
  }
};
