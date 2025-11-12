import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import { Construct } from "constructs";

export class BackendStack extends cdk.Stack {
  public readonly apiUrl: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "ApiVpc", { maxAzs: 2 });

    const cluster = new ecs.Cluster(this, "ApiCluster", { vpc });

    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "ApiService", {
      cluster,
      cpu: 256,
      memoryLimitMiB: 512,
      desiredCount: 1,
      publicLoadBalancer: true,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
        containerPort: 4000,
        environment: { NODE_ENV: "production" },
      },
    });

    this.apiUrl = new cdk.CfnOutput(this, "ApiUrl", {
      value: `http://${service.loadBalancer.loadBalancerDnsName}`,
    });
  }
}
