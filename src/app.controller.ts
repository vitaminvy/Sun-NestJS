import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
@ApiTags('App')
@Controller()
export class AppController {
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
  getHello(@I18n() i18n: I18nContext): string {
    return i18n.t('translation.HELLO');
  }
}
