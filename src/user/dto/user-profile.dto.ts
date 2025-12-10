export class UserProfileDto {
  id: string;
  name: string;
  avatar?: string;
  reputation: number;
  comments: {
    id: string;
    restaurantName: string;
    rating: number;
    comment: string;
  }[];
}
