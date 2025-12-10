import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  create(createReviewDto: CreateReviewDto) {
    return this.prisma.review.create({ data: createReviewDto });
  }

  findAll() {
    return this.prisma.review.findMany();
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async findByRestaurant(restaurantId: string) {
    return this.prisma.review.findMany({
      where: { restaurantId },
      orderBy: { id: 'desc' }, 
      include: { user: { select: { name: true } } },
    });
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    return this.prisma.review.update({ where: { id }, data: updateReviewDto });
  }

  async remove(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }
}