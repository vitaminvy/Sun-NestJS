import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginUserDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail(undefined, {
    message: i18nValidationMessage('translation.VALIDATION.IS_EMAIL'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('translation.VALIDATION.IS_NOT_EMPTY'),
  })
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString({
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('translation.VALIDATION.IS_NOT_EMPTY'),
  })
  password!: string;
}

export class LoginUserRequestDto {
  @ApiProperty({ type: LoginUserDto })
  @IsDefined({
    message: i18nValidationMessage('translation.VALIDATION.IS_DEFINED'),
  })
  @ValidateNested({
    message: i18nValidationMessage('translation.VALIDATION.IS_OBJECT'),
  })
  @Type(() => LoginUserDto)
  user!: LoginUserDto;
}
