import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get localized Hello World message' })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'vi'],
    description: 'Response language',
  })
  @ApiResponse({
    status: 200,
    description: 'Hello World message returned successfully',
    type: String,
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
