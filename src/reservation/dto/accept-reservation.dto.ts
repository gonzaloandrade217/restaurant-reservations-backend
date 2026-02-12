import { IsInt, Min } from 'class-validator';

export class AcceptReservationDto {
  @IsInt()
  @Min(1)
  tablesUsed: number;
}
