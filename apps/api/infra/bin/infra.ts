import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const nestjsFunction = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      'CoreApiFunction',
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_22_X,
        entry: 'out.js',
        handler: 'index.handler',
        memorySize: 512,
        environment: {
          DB_CONNECTION_URL: 'postgresql://postgres',
        },
      },
    );

    const authApi = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      'AuthApiFunction',
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_22_X,
        entry: 'out.js',
        handler: 'index.handler',
        memorySize: 512,

        // bundling: {
        //   commandHooks: {
        //     beforeBundling: (from, to) => {
        //       return [`cp ${from}/out.js ${to}/`];
        //     },
        //     beforeInstall: (_from, _to) => {
        //       return []
        //     },
        //     afterBundling(_inputDir, _outputDir) {
        //        return []
        //     },
        //   }
        // },
        environment: {
          DB_CONNECTION_URL: 'postgresql://postgres',
        },
      },
    );

    const admin = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      'AdminApiFunction',
      {
        runtime: cdk.aws_lambda.Runtime.NODEJS_22_X,
        entry: 'out.js',
        handler: 'index.handler',
        memorySize: 512,
        environment: {
          DB_CONNECTION_URL: 'postgresql://postgres',
        },
      },
    );
    const api = new cdk.aws_apigateway.RestApi(this, 'Endpoint', {
      deployOptions: {
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Context-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Account-Type',
          'X-Requested-Type',
          'X-Signature',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowMethods: cdk.aws_apigateway.Cors.ALL_METHODS,
        allowOrigins: cdk.aws_apigateway.Cors.ALL_ORIGINS,
      },
    });

    const authApiIntegration = new cdk.aws_apigateway.LambdaIntegration(
      authApi,
    );
    const adminApiIntegration = new cdk.aws_apigateway.LambdaIntegration(admin);
    const nestjsFunctionIntegration = new cdk.aws_apigateway.LambdaIntegration(
      nestjsFunction,
    );

    const authRootResource = api.root.addResource('auth');
    const authResource = authRootResource.addResource('{proxy+}');
    authResource.addMethod('ANY', authApiIntegration);
    authRootResource.addMethod('ANY', authApiIntegration);

    const adminRootResource = api.root.addResource('admin');
    const adminResource = adminRootResource.addResource('{proxy+}');
    adminResource.addMethod('ANY', adminApiIntegration);
    adminRootResource.addMethod('ANY', adminApiIntegration);

    const apiRootResource = api.root.addResource('api');
    const apiResource = apiRootResource.addResource('{proxy+}');
    apiResource.addMethod('ANY', nestjsFunctionIntegration);
    apiRootResource.addMethod('ANY', nestjsFunctionIntegration);
  }
}

// const queue = new sqs.Queue(this, 'InfraQueue', {
//   visibilityTimeout: cdk.Duration.seconds(300)
// });
