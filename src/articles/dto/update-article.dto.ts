import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDefined,
  IsNotEmpty,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateArticleDto {
  @ApiPropertyOptional({ example: 'How to train your dragon' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString({
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('translation.VALIDATION.IS_NOT_EMPTY'),
  })
  title?: string;

  @ApiPropertyOptional({ example: 'Ever wonder how?' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString({
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('translation.VALIDATION.IS_NOT_EMPTY'),
  })
  description?: string;

  @ApiPropertyOptional({ example: 'You have to believe' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString({
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('translation.VALIDATION.IS_NOT_EMPTY'),
  })
  body?: string;

  @ApiPropertyOptional({ example: ['dragons', 'training'], type: [String] })
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray({
    message: i18nValidationMessage('translation.VALIDATION.IS_ARRAY'),
  })
  @IsString({
    each: true,
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  @ArrayUnique({
    message: i18nValidationMessage('translation.VALIDATION.ARRAY_UNIQUE'),
  })
  tagList?: string[];
}

export class UpdateArticleRequestDto {
  @ApiProperty({ type: UpdateArticleDto })
  @IsDefined({
    message: i18nValidationMessage('translation.VALIDATION.IS_DEFINED'),
  })
  @ValidateNested({
    message: i18nValidationMessage('translation.VALIDATION.IS_OBJECT'),
  })
  @Type(() => UpdateArticleDto)
  article!: UpdateArticleDto;
}
