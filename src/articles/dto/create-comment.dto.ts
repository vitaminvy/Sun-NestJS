import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great article!' })
  @IsString({
    message: i18nValidationMessage('translation.VALIDATION.IS_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('translation.VALIDATION.IS_NOT_EMPTY'),
  })
  body!: string;
}

export class CreateCommentRequestDto {
  @ApiProperty({ type: CreateCommentDto })
  @IsDefined({
    message: i18nValidationMessage('translation.VALIDATION.IS_DEFINED'),
  })
  @ValidateNested({
    message: i18nValidationMessage('translation.VALIDATION.IS_OBJECT'),
  })
  @Type(() => CreateCommentDto)
  comment!: CreateCommentDto;
}
