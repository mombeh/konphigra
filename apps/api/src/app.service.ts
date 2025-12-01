import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getUsersFromSDK() {
    return ['test-user-1', 'test-user-2'];
  }

  getHello(): string {
    return 'Hello World!';
  }
}
