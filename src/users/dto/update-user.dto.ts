import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'johndoe' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  username?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiPropertyOptional({ example: 'newpassword123', minLength: 8 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ example: 'I love NestJS', nullable: true })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  bio?: string | null;
}

export class UpdateUserRequestDto extends UpdateUserDto {
  @ApiPropertyOptional({ type: UpdateUserDto })
  @ValidateIf((_object, value) => value !== undefined)
  @ValidateNested()
  @Type(() => UpdateUserDto)
  user?: UpdateUserDto;
}
