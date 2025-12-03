import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { CognitoGuard } from './auth/auth.guard';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('users')
  async getUsers() {
    return this.appService.getUsersFromSDK();
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(CognitoGuard)
  @Get('me')
  getProfile(@Req() req) {
    return req.user;
  }
}
