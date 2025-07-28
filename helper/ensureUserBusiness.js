const prisma = require('../config/db');

const ensureUserBusiness = async (userId) => {
  let userBusiness = await prisma.business.findUnique({
    where: { ownerId: userId }
  });

  if (!userBusiness) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });

    userBusiness = await prisma.business.create({
      data: {
        name: `${user.name}'s Business`,
        email: user.email,
        ownerId: userId
      }
    });
  }

  return userBusiness;
};

module.exports = ensureUserBusiness;
