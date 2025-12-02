// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  SignUpCommand,
  AdminConfirmSignUpCommand,
  AdminAddUserToGroupCommand,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';

@Injectable()
export class AuthService {
  private client: CognitoIdentityProviderClient;
  private clientId: string;
  private userPoolId: string;

  constructor(private config: ConfigService) {
    console.log('REGION:', process.env.AWS_REGION);
    console.log('CLIENT ID:', process.env.COGNITO_CLIENT_ID);
    console.log('POOL ID:', process.env.COGNITO_USER_POOL_ID);

    this.client = new CognitoIdentityProviderClient({
      region: this.config.get<string>('AWS_REGION'),
    });

    this.clientId = this.config.get<string>('COGNITO_CLIENT_ID')!;
    this.userPoolId = this.config.get<string>('COGNITO_USER_POOL_ID')!;
  }

  async signup(email: string, password: string, role: string = 'user') {
    const cmd = new SignUpCommand({
      ClientId: this.clientId,
      Username: email,
      Password: password,
    });

    await this.client.send(cmd);

    await this.client.send(
      new AdminConfirmSignUpCommand({
        UserPoolId: this.userPoolId,
        Username: email,
      }),
    );

    await this.client.send(
      new AdminAddUserToGroupCommand({
        GroupName: role,
        UserPoolId: this.userPoolId,
        Username: email,
      }),
    );

    return { message: 'User created and confirmed' };
  }

  async login(email: string, password: string) {
    const cmd = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    try {
      const res = await this.client.send(cmd);

      const result = res.AuthenticationResult;
      if (!result) {
        throw new UnauthorizedException('Authentication failed');
      }

      return {
        accessToken: result.AccessToken,
        refreshToken: result.RefreshToken,
        idToken: result.IdToken,
      };
    } catch (err) {
      console.log(err);
      throw new UnauthorizedException('Invalid login');
    }
  }
}
