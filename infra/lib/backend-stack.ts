// import * as cdk from "aws-cdk-lib";
// import { Construct } from "constructs";
// // import * as sqs from 'aws-cdk-lib/aws-sqs';

// export class InfraStack extends cdk.Stack {
//   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);

//     // The code that defines your stack goes here

//     // example resource
//     // const queue = new sqs.Queue(this, 'InfraQueue', {
//     //   visibilityTimeout: cdk.Duration.seconds(300)
//     // });
//   }
// }

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";

interface BackendStackProps extends cdk.StackProps {
  vpc?: ec2.IVpc;
}

export class BackendStack extends cdk.Stack {
  public readonly apiUrlOutput: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const cluster = new ecs.Cluster(this, "ApiCluster", {
      vpc: props.vpc,
    });

    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "ApiService", {
      cluster,
      cpu: 256,
      memoryLimitMiB: 512,
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset("../apps/api"),
        containerPort: 4000,
        environment: {
          NODE_ENV: "production",
        },
      },
      publicLoadBalancer: true,
    });

    this.apiUrlOutput = new cdk.CfnOutput(this, "ApiUrl", {
      value: `http://${service.loadBalancer.loadBalancerDnsName}`,
    });
  }
}
