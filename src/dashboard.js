const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { startOfToday, startOfWeek } = require("date-fns");

exports.getDashboardStats = async (req, res) => {
  try {
    const today = startOfToday();
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const [
      newsTodayCount,
      totalNewsCount,
      totalPublishersCount,
      pendingNewsCount,
      pendingPublishersCount,
      suspendedNewsCount,
      suspendedPublishersCount,
      totalReportsCount,
      reportsThisWeekCount,
    ] = await Promise.all([
      prisma.news.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
      prisma.news.count(),
      prisma.publisher.count(),
      prisma.news.count({
        where: {
          status: "PENDING",
        },
      }),
      prisma.publisher.count({
        where: {
          status: "PENDING",
        },
      }),
      prisma.news.count({
        where: {
          status: "SUSPENDED",
        },
      }),
      prisma.publisher.count({
        where: {
          status: "SUSPENDED",
        },
      }),
      prisma.report.count(),
      prisma.report.count({
        where: {
          createdAt: {
            gte: weekStart,
          },
        },
      }),
    ]);

    // Sending response
    res.json({
      message: "Dashboard stats fetched successfully",
      status: "success",
      data: {
        newsToday: newsTodayCount,
        totalNews: totalNewsCount,
        totalPublishers: totalPublishersCount,
        pendingNews: pendingNewsCount,
        pendingPublishers: pendingPublishersCount,
        suspendedNews: suspendedNewsCount,
        suspendedPublishers: suspendedPublishersCount,
        totalReports: totalReportsCount,
        reportsThisWeek: reportsThisWeekCount,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      message: "Internal server error",
      status: "failed",
      data: null,
    });
  }
};

exports.getPublishersTable = async (req, res) => {
  try {
    const {
      publisherUsername,
      publisherName,
      publisherEmail,
      phoneNumber,
      status,
    } = req.body;

    const whereClause = {
      userName: publisherUsername || undefined,
      firstName: publisherName
        ? { contains: publisherName, mode: "insensitive" }
        : undefined,
      email: publisherEmail || undefined,
      phone: phoneNumber || undefined,
      status: status && status.length ? { in: status } : undefined,
    };

    const publishers = await prisma.publisher.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        news: true,
      },
    });

    const formattedPublishers = publishers.map((publisher) => {
      const publishedNews = publisher.news.filter(
        (news) => news.status === "APPROVED"
      ).length;
      const pendingNews = publisher.news.filter(
        (news) => news.status === "PENDING"
      ).length;
      const suspendedNews = publisher.news.filter(
        (news) => news.status === "SUSPENDED"
      ).length;

      return {
        username: publisher.userName,
        fullName: `${publisher.firstName} ${publisher.lastName}`,
        email: publisher.email,
        phoneNumber: publisher.phone,
        publishedNews,
        pendingNews,
        suspendedNews,
        status: publisher.status,
      };
    });

    res.json({
      message: "Publishers fetched successfully",
      status: "success",
      data: formattedPublishers,
    });
  } catch (error) {
    console.error("Error fetching publishers:", error);
    res.status(500).json({
      message: "Internal server error",
      status: "failed",
      data: null,
    });
  }
};
