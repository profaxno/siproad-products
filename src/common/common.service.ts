import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";

import { AxiosResponse } from "axios";
import { catchError, firstValueFrom } from "rxjs";

import { ConfigService } from "@nestjs/config";
import { HttpMethodKey } from "./enum/http-method.enum";

@Injectable()
export class CommonService {
  private readonly logger = new Logger(CommonService.name);
  private readonly executionRetries: number = 2;
  private readonly executionBaseDelay: number = 1000;

  constructor(
    private readonly configService: ConfigService,
    private readonly http: HttpService
  ) { 
    this.executionRetries = this.configService.get('executionRetries');
    this.executionBaseDelay = this.configService.get('executionBaseDelay');
  }

  async post<T>(path: string, body: Record<string, any>, params?: any): Promise<T> {
    this.logger.log(`post: path=${path}, body=${this.cleanBodyForLog(body)}`);

    const { data }: AxiosResponse<any, any> = await firstValueFrom(
      this.http.post(path, body, {params}).pipe(
        catchError(error => {
          this.logger.error(error);
          throw error;
        })
      )
    );

    const response: T = data;

    return response;
  }

  async put<T>(path: string, body: Record<string, any>, params?: any): Promise<T> {
    this.logger.log(`put: path=${path}, body=${this.cleanBodyForLog(body)}`);

    const { data }: AxiosResponse<any, any> = await firstValueFrom(
      this.http.put(path, body, {params}).pipe(
        catchError(error => {
          this.logger.error(error);
          throw error;
        })
      )
    );

    const response: T = data;

    return response;
  }

  async get<T>(path: string, params: any): Promise<T> {
    this.logger.log(`get: path=${path}, params=${JSON.stringify(params)}`);

    const { data }: AxiosResponse<any, any> = await firstValueFrom(
      this.http.get(path, {params}).pipe(
        catchError(error => {
          this.logger.error(error);
          throw error;
        })
      )
    );

    const response: T = data;

    return response;
  }

  async request<T>(httpMethod: HttpMethodKey, url: string, headers: any, body: Record<string, any>): Promise<T> {
    this.logger.log(`request: httpMethod=${httpMethod}, url=${url}, body=${this.cleanBodyForLog(body)}`);
    
    const config = {
      method: httpMethod,
      url,
      headers,
      data: body
    }

    if(httpMethod == HttpMethodKey.GET) {
      config['params'] = body;
      delete config.data;
    }

    const { data }: AxiosResponse<any, any> = await firstValueFrom(
      this.http.request(config).pipe(
        catchError(error => {
          this.logger.error(error);
          throw error;
        })
      )
    );

    const response: T = data;

    return response;
  }

  async executeWithRetries<T>(functionToExecute: () => Promise<T>): Promise<T> {
    for (let i = 1; i <= this.executionRetries; i++) {
      try {
        const response = await functionToExecute();
        return response;

      } catch (error) {
        if(i == this.executionRetries) {
          this.logger.error(`executeWithRetries: all attempts failed`);
          throw error;
        }

        const delay = this.executionBaseDelay * i;
        this.logger.warn(`executeWithRetries: attempt=${i}/${this.executionRetries} failed. retrying in ${delay / 1000} seconds...`);
        await this.delay(delay);
      }
    }
  }

  private cleanBodyForLog(body: Record<string, any>): string {
    return body?.hasOwnProperty('password') ? '{ ******** }': JSON.stringify(body);
  }

  private delay(ms): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}