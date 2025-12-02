// import * as cdk from "aws-cdk-lib";
// import { Construct } from "constructs";
// import * as ec2 from "aws-cdk-lib/aws-ec2";
// import * as ecs from "aws-cdk-lib/aws-ecs";
// import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
// import * as logs from "aws-cdk-lib/aws-logs";
// import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
// import * as path from "path";

// interface BackendStackProps extends cdk.StackProps {
//   vpc: ec2.IVpc;
//   cluster: ecs.ICluster;
//   applicationSecurityGroup: ec2.ISecurityGroup;
//   dbSecurityGroup: ec2.ISecurityGroup;
//   dbSecret: secretsmanager.ISecret;
//   dbHost: string;
// }

// export class BackendStack extends cdk.Stack {
//   public readonly backendSG: ec2.ISecurityGroup;

//   constructor(scope: Construct, id: string, props: BackendStackProps) {
//     super(scope, id, props);

//     this.backendSG = props.applicationSecurityGroup;

//     const logGroup = new logs.LogGroup(this, "BackendLogGroup", {
//       retention: logs.RetentionDays.ONE_WEEK,
//     });

//     const image = ecs.ContainerImage.fromAsset(path.join(__dirname, "../../apps/api"), {
//       file: "Dockerfile",
//       exclude: ["cdk.out", ".git", "infra", "node_modules"],
//     });

//     const service = new ecs_patterns.ApplicationLoadBalancedFargateService(
//       this,
//       "BackendFargateService",
//       {
//         cluster: props.cluster,
//         cpu: 256,
//         memoryLimitMiB: 512,
//         desiredCount: 1,
//         publicLoadBalancer: true,

//         taskSubnets: {
//           subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
//         },

//         taskImageOptions: {
//           image,
//           containerPort: 3000,

//           environment: {
//             DB_HOST: props.dbHost,
//             DB_PORT: "5432",
//             DB_NAME: "konphigra",
//             NODE_ENV: "production",
//           },

//           secrets: {
//             DB_USERNAME: ecs.Secret.fromSecretsManager(props.dbSecret, "username"),
//             DB_PASSWORD: ecs.Secret.fromSecretsManager(props.dbSecret, "password"),
//           },

//           logDriver: ecs.LogDrivers.awsLogs({
//             logGroup,
//             streamPrefix: "backend",
//           }),
//         },
//       }
//     );

//     // const albSecurityGroup = service.loadBalancer.node.findChild("Listener").node.findChild("SecurityGroup").node.tryFindChild("Resource") as ec2.CfnSecurityGroup;

//     //   if (albSecurityGroup) {
//     //   this.backendSG.addIngressRule(
//     //     ec2.Peer.securityGroupId(albSecurityGroup.attrGroupId),
//     //     ec2.Port.tcp(3000),
//     //     "Allow ALB to reach backend"
//     //   );
//     // }

//     service.targetGroup.configureHealthCheck({
//       path: "/health",
//       healthyHttpCodes: "200-399",
//     });

//     service.service.autoScaleTaskCount({
//       minCapacity: 1,
//       maxCapacity: 3,
//     });

//     new cdk.CfnOutput(this, "BackendURL", {
//       value: service.loadBalancer.loadBalancerDnsName,
//     });
//   }
// }

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
  dbSG: ec2.ISecurityGroup;
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

    // ✔ Security groups applied at correct level
    this.service.service.connections.addSecurityGroup(props.applicationSG);
    this.service.loadBalancer.addSecurityGroup(props.albSG);

    // Allow ECS tasks to reach DB
    props.dbSG.addIngressRule(props.applicationSG, ec2.Port.tcp(5432));
  }
}
