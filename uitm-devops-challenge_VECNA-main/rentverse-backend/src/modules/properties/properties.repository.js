const { prisma } = require('../../config/database');

class PropertiesRepository {
  async findMany(options = {}) {
    const {
      where = {},
      skip = 0,
      take = 10,
      orderBy = { createdAt: 'desc' },
    } = options;

    return await prisma.property.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        price: true,
        currencyCode: true,
        bedrooms: true,
        bathrooms: true,
        areaSqm: true,
        furnished: true,
        isAvailable: true,
        images: true,
        latitude: true,
        longitude: true,
        placeId: true,
        projectName: true,
        developer: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        propertyTypeId: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        propertyType: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        amenities: {
          include: {
            amenity: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy,
    });
  }

  async count(options = {}) {
    const { where = {} } = options;
    return await prisma.property.count({ where });
  }

  async findById(id) {
    return await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        propertyType: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        amenities: {
          include: {
            amenity: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });
  }

  async findByCode(code) {
    return await prisma.property.findUnique({
      where: { code },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        propertyType: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        amenities: {
          include: {
            amenity: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });
  }

  async create(propertyData) {
    return await prisma.property.create({
      data: propertyData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async update(id, updateData) {
    return await prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async delete(id) {
    return await prisma.property.delete({
      where: { id },
    });
  }

  async findForGeoJSON(params) {
    const {
      minLng,
      minLat,
      maxLng,
      maxLat,
      limit = 1000,
      centerLng,
      centerLat,
      query,
    } = params;

    const where = {
      status: 'APPROVED',
      isAvailable: true,
      latitude: {
        gte: minLat,
        lte: maxLat,
        not: null,
      },
      longitude: {
        gte: minLng,
        lte: maxLng,
        not: null,
      },
    };

    // Add text search
    if (query && query.trim()) {
      where.OR = [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { city: { contains: query.trim(), mode: 'insensitive' } },
        { address: { contains: query.trim(), mode: 'insensitive' } },
      ];
    }

    return await prisma.property.findMany({
      where,
      select: {
        id: true,
        code: true,
        title: true,
        price: true,
        currencyCode: true,
        bedrooms: true,
        bathrooms: true,
        areaSqm: true,
        city: true,
        furnished: true,
        isAvailable: true,
        latitude: true,
        longitude: true,
        images: true,
        propertyType: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
      orderBy: {
        price: 'asc',
      },
    });
  }

  async codeExists(code) {
    const property = await prisma.property.findUnique({
      where: { code },
      select: { id: true },
    });
    return !!property;
  }

  async findFeaturedProperties(options = {}) {
    const { skip = 0, take = 8 } = options;

    return await prisma.property.findMany({
      where: {
        status: 'APPROVED',
        isAvailable: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        propertyType: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        amenities: {
          include: {
            amenity: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip,
      take,
    });
  }

  async countFeaturedProperties() {
    return await prisma.property.count({
      where: {
        status: 'APPROVED',
        isAvailable: true,
      },
    });
  }

  async getStatusCounts(ownerId) {
    const statusCounts = await prisma.property.groupBy({
      by: ['status'],
      where: {
        ownerId: ownerId,
      },
      _count: {
        status: true,
      },
    });

    const result = {
      DRAFT: 0,
      PENDING_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      ARCHIVED: 0,
    };

    statusCounts.forEach((item) => {
      result[item.status] = item._count.status;
    });

    return result;
  }

  async getAvailabilityCounts(ownerId) {
    const availabilityCounts = await prisma.property.groupBy({
      by: ['isAvailable'],
      where: {
        ownerId: ownerId,
      },
      _count: {
        isAvailable: true,
      },
    });

    const result = {
      available: 0,
      unavailable: 0,
    };

    availabilityCounts.forEach((item) => {
      if (item.isAvailable) {
        result.available = item._count.isAvailable;
      } else {
        result.unavailable = item._count.isAvailable;
      }
    });

    return result;
  }

  async getAverageRating(propertyId) {
    const result = await prisma.propertyRating.aggregate({
      where: {
        propertyId: propertyId,
      },
      _avg: {
        rating: true,
      },
    });

    return result._avg.rating || 0;
  }
}

module.exports = new PropertiesRepository();