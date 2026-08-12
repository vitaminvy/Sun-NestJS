import { ApiProperty } from '@nestjs/swagger';

import { UserEntity } from '../entities/user.entity';

export class UserResponseDataDto {
  @ApiProperty({ example: 'john@example.com' })
  email!: string;

  @ApiProperty({ example: 'jwt.token.value' })
  token!: string;

  @ApiProperty({ example: 'johndoe' })
  username!: string;

  @ApiProperty({ example: 'I work at Sun Asterisk.', nullable: true })
  bio!: string | null;

  @ApiProperty({ example: 'https://example.com/avatar.png', nullable: true })
  image!: string | null;

  constructor(user: UserEntity, token: string, image: string | null) {
    this.email = user.email;
    this.token = token;
    this.username = user.username;
    this.bio = user.bio;
    this.image = image;
  }
}

export class UserResponseDto {
  @ApiProperty({ type: UserResponseDataDto })
  user!: UserResponseDataDto;

  constructor(user: UserEntity, token: string, image: string | null = null) {
    this.user = new UserResponseDataDto(user, token, image);
  }
}
