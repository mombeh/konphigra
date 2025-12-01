import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as path from "path";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

interface BackendStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  dbSecurityGroup: ec2.ISecurityGroup;
  dbSecret: secretsmanager.ISecret;
  dbHost: string;
}

export class BackendStack extends cdk.Stack {
  public readonly backendSG: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const cluster = new ecs.Cluster(this, "BackendCluster", {
      vpc: props.vpc,
    });

    this.backendSG = new ec2.SecurityGroup(this, "BackendSG", {
      vpc: props.vpc,
      allowAllOutbound: true,
    });

    const image = ecs.ContainerImage.fromAsset(path.join(__dirname, "../../apps/api"), {
      file: "Dockerfile",
      exclude: ["cdk.out", ".git", "infra", "node_modules"],
    });

    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "BackendFargateService",
      {
        cluster,
        cpu: 256,
        memoryLimitMiB: 512,
        desiredCount: 1,
        publicLoadBalancer: true,
        taskSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [this.backendSG],

        taskImageOptions: {
          image,
          containerPort: 3000,
          environment: {
            DB_HOST: props.dbHost,
            DB_PORT: "5432",
            DB_NAME: "konphigra",
            NODE_ENV: "production",
          },
          secrets: {
            DB_USERNAME: ecs.Secret.fromSecretsManager(props.dbSecret, "username"),
            DB_PASSWORD: ecs.Secret.fromSecretsManager(props.dbSecret, "password"),
          },
          enableLogging: true,
        },
      }
    );

    service.targetGroup.configureHealthCheck({
      path: "/health",
      healthyHttpCodes: "200-399",
    });

    props.dbSecret.grantRead(service.taskDefinition.taskRole);
  }
}
