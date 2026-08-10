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
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'johndoe' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString({
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('translation.VALIDATION.IS_NOT_EMPTY'),
  })
  username?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsEmail(undefined, {
    message: i18nValidationMessage('translation.VALIDATION.IS_EMAIL'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('translation.VALIDATION.IS_NOT_EMPTY'),
  })
  email?: string;

  @ApiPropertyOptional({ example: 'newpassword123', minLength: 8 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString({
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  @MinLength(8, {
    message: i18nValidationMessage('translation.VALIDATION.MIN_LENGTH'),
  })
  password?: string;

  @ApiPropertyOptional({ example: 'I love NestJS', nullable: true })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString({
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  bio?: string | null;
}

export class UpdateUserRequestDto extends UpdateUserDto {
  @ApiPropertyOptional({ type: UpdateUserDto })
  @ValidateIf((_object, value) => value !== undefined)
  @ValidateNested({
    message: i18nValidationMessage('translation.VALIDATION.IS_OBJECT'),
  })
  @Type(() => UpdateUserDto)
  user?: UpdateUserDto;
}
