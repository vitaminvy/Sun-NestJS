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
import { i18nValidationMessage } from 'nestjs-i18n';

export class RegisterUserDto {
  @ApiProperty({ example: 'johndoe' })
  @IsString({
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('translation.VALIDATION.IS_NOT_EMPTY'),
  })
  username!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail(undefined, {
    message: i18nValidationMessage('translation.VALIDATION.IS_EMAIL'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('translation.VALIDATION.IS_NOT_EMPTY'),
  })
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString({
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('translation.VALIDATION.IS_NOT_EMPTY'),
  })
  @MinLength(8, {
    message: i18nValidationMessage('translation.VALIDATION.MIN_LENGTH'),
  })
  password!: string;
}

export class RegisterUserRequestDto {
  @ApiProperty({ type: RegisterUserDto })
  @IsDefined({
    message: i18nValidationMessage('translation.VALIDATION.IS_DEFINED'),
  })
  @ValidateNested({
    message: i18nValidationMessage('translation.VALIDATION.IS_OBJECT'),
  })
  @Type(() => RegisterUserDto)
  user!: RegisterUserDto;
}
