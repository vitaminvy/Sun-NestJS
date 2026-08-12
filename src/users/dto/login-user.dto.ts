import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class LoginUserRequestDto {
  @ApiProperty({ type: LoginUserDto })
  @ValidateNested()
  @Type(() => LoginUserDto)
  user!: LoginUserDto;
}
