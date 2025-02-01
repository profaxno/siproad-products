import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { CommonService } from './common.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get('hostBackoffice'),
        headers: {
          'x-api-key': configService.get('apiKeyBackoffice')
        },
        timeout: configService.get('httpTimeout'),
        maxRedirects: configService.get('httpMaxRedirects')
      }),
      inject: [ConfigService]
    })
  ],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}
