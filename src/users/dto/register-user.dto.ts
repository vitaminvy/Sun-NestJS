import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsDefined,
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}

export class RegisterUserRequestDto {
  @ApiProperty({ type: RegisterUserDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => RegisterUserDto)
  user!: RegisterUserDto;
}
