import { Role } from '@prisma/client';

export class GoogleUserDto {
  email: string;
  name: string;
  role?: Role;         
  avatar?: string | null;
}
