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

export class CreateArticleDto {
  @ApiProperty({ example: 'How to train your dragon' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Ever wonder how?' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 'You have to believe' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({ example: ['dragons', 'training'], type: [String] })
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  tagList?: string[];
}

export class CreateArticleRequestDto {
  @ApiProperty({ type: CreateArticleDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateArticleDto)
  article!: CreateArticleDto;
}
