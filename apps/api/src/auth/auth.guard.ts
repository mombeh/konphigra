// cognito.guard.ts
import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

export class CognitoGuard implements CanActivate {
  private jwksUrl = `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`;

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;

    if (!authHeader) throw new UnauthorizedException('Missing token');

    const token = authHeader.replace('Bearer ', '');

    const { data } = await axios.get(this.jwksUrl);

    const decoded = jwt.decode(token, { complete: true });

    const key = data.keys.find((k) => k.kid === decoded.header.kid);

    const pem = require('jwk-to-pem')(key);

    try {
      const verified = jwt.verify(token, pem);
      req.user = verified;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
