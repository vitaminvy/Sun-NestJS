import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListArticlesQueryDto {
  @ApiPropertyOptional({ example: 'nestjs' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ example: 'johndoe' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ example: 'janedoe' })
  @IsOptional()
  @IsString()
  favorited?: string;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
