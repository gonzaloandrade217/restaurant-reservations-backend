import { IsNumber, IsString, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @IsString()
  @IsOptional()
  comment: string;

  @IsString()
  userId: string;

  @IsString()
  restaurantId: string;
}