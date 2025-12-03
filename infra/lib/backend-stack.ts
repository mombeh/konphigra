import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import path from "path";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";

export interface BackendStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  applicationSG: ec2.ISecurityGroup;
  albSG: ec2.ISecurityGroup;
  dbSecretArn: string;

  userPoolId: string;
  userPoolClientId: string;
}

export class BackendStack extends cdk.Stack {
  public readonly service: ecsPatterns.ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    // ECS Cluster
    const cluster = new ecs.Cluster(this, "BackendCluster", {
      vpc: props.vpc,
    });

    // Fargate Service with ALB
    this.service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "BackendService", {
      cluster,
      desiredCount: 1,
      cpu: 512,
      memoryLimitMiB: 1024,

      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset(path.join(__dirname, "../../apps/api")),
        containerPort: 3000,
        environment: {
          DB_SECRET_ARN: props.dbSecretArn,
          USER_POOL_ID: props.userPoolId,
          USER_POOL_CLIENT_ID: props.userPoolClientId,
        },
      },
    });
  }
}
