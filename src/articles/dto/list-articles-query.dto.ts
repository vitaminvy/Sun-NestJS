import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ListArticlesQueryDto {
  @ApiPropertyOptional({ example: 'nestjs' })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  tag?: string;

  @ApiPropertyOptional({ example: 'johndoe' })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  author?: string;

  @ApiPropertyOptional({ example: 'janedoe' })
  @IsOptional()
  @IsString({
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  favorited?: string;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: i18nValidationMessage('translation.VALIDATION.IS_INT'),
  })
  @Min(0, {
    message: i18nValidationMessage('translation.VALIDATION.MIN'),
  })
  @Max(100, {
    message: i18nValidationMessage('translation.VALIDATION.MAX'),
  })
  limit?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: i18nValidationMessage('translation.VALIDATION.IS_INT'),
  })
  @Min(0, {
    message: i18nValidationMessage('translation.VALIDATION.MIN'),
  })
  offset?: number;
}
