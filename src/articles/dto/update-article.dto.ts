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

export class UpdateArticleDto {
  @ApiPropertyOptional({ example: 'How to train your dragon' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({ example: 'Ever wonder how?' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiPropertyOptional({ example: 'You have to believe' })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  body?: string;

  @ApiPropertyOptional({ example: ['dragons', 'training'], type: [String] })
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  tagList?: string[];
}

export class UpdateArticleRequestDto {
  @ApiProperty({ type: UpdateArticleDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => UpdateArticleDto)
  article!: UpdateArticleDto;
}
