import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";

interface BackendStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  dbSecurityGroup: ec2.ISecurityGroup;
  dbSecret: secretsmanager.ISecret;
  dbHost: string;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const cluster = new ecs.Cluster(this, "BackendCluster", {
      vpc: props.vpc,
    });

    // Allow ECS tasks to access the database
    const backendSG = new ec2.SecurityGroup(this, "BackendSG", {
      vpc: props.vpc,
      allowAllOutbound: true,
    });

    props.dbSecurityGroup.addIngressRule(
      backendSG,
      ec2.Port.tcp(5432),
      "Allow backend to access Postgres"
    );

    // Build image from your Dockerfile at project root
    const image = ecs.ContainerImage.fromAsset("./", {
      file: "Dockerfile", // root Dockerfile
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
        taskSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        listenerPort: 80,
        securityGroups: [backendSG],

        taskImageOptions: {
          image,
          containerPort: 3000,
          environment: {
            // DATABASE_URL constructed here
            DATABASE_URL: `postgresql://${props.dbSecret.secretValueFromJson(
              "username"
            )}:${props.dbSecret.secretValueFromJson("password")}@${props.dbHost}:5432/konphigra`,
          },
        },
      }
    );

    // Give ECS Task permission to read DB secret
    props.dbSecret.grantRead(service.taskDefinition.taskRole);
  }
}
