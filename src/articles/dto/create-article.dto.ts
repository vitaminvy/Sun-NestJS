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

export class CreateArticleDto {
  @ApiProperty({ example: 'How to train your dragon' })
  @IsString({
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('translation.VALIDATION.IS_NOT_EMPTY'),
  })
  title!: string;

  @ApiProperty({ example: 'Ever wonder how?' })
  @IsString({
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('translation.VALIDATION.IS_NOT_EMPTY'),
  })
  description!: string;

  @ApiProperty({ example: 'You have to believe' })
  @IsString({
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('translation.VALIDATION.IS_NOT_EMPTY'),
  })
  body!: string;

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

export class CreateArticleRequestDto {
  @ApiProperty({ type: CreateArticleDto })
  @IsDefined({
    message: i18nValidationMessage('translation.VALIDATION.IS_DEFINED'),
  })
  @ValidateNested({
    message: i18nValidationMessage('translation.VALIDATION.IS_OBJECT'),
  })
  @Type(() => CreateArticleDto)
  article!: CreateArticleDto;
}
