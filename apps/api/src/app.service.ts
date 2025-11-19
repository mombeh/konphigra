import { Injectable } from '@nestjs/common';
import { KonphigraSDK } from '@konphigra/sdk';

@Injectable()
export class AppService {
  private sdk: KonphigraSDK;

  constructor() {
    this.sdk = new KonphigraSDK({
      baseUrl: 'http://localhost:3000',
    });
  }

  async getUsersFromSDK() {
    return this.sdk.getUsers();
  }

  getHello(): string {
    return 'Hello World!';
  }
}
