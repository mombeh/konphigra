import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as logs from "aws-cdk-lib/aws-logs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as path from "path";

interface BackendStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  cluster: ecs.ICluster;
  dbSecurityGroup: ec2.ISecurityGroup;
  dbSecret: secretsmanager.ISecret;
  dbHost: string;
}

export class BackendStack extends cdk.Stack {
  public readonly backendSG: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    // MUST be assigned BEFORE being used
    this.backendSG = new ec2.SecurityGroup(this, "BackendSG", {
      vpc: props.vpc,
      allowAllOutbound: true,
    });

    // ALLOW backend -> database
    props.dbSecurityGroup.addIngressRule(
      this.backendSG,
      ec2.Port.tcp(5432),
      "Allow backend to access PostgreSQL"
    );

    const logGroup = new logs.LogGroup(this, "BackendLogGroup", {
      retention: logs.RetentionDays.ONE_WEEK,
    });

    const image = ecs.ContainerImage.fromAsset(path.join(__dirname, "../../apps/api"), {
      file: "Dockerfile",
      exclude: ["cdk.out", ".git", "infra", "node_modules"],
    });

    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "BackendFargateService",
      {
        cluster: props.cluster,
        cpu: 256,
        memoryLimitMiB: 512,
        desiredCount: 1,
        publicLoadBalancer: true,

        taskSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },

        // VALID security group list
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

          logDriver: ecs.LogDrivers.awsLogs({
            logGroup,
            streamPrefix: "backend",
          }),
        },
      }
    );

    service.targetGroup.configureHealthCheck({
      path: "/health",
      healthyHttpCodes: "200-399",
    });

    service.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 3,
    });

    new cdk.CfnOutput(this, "BackendURL", {
      value: service.loadBalancer.loadBalancerDnsName,
    });
  }
}
