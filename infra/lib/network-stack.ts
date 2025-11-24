import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly applicationSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;

  public readonly cacheSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "KonphigraVPC", {
      maxAzs: 3,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: "Isolated",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    this.vpc.addInterfaceEndpoint("SQSEndpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.SQS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint("SNSEndpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint("EventBridgeEndpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.EVENTBRIDGE,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.applicationSecurityGroup = new ec2.SecurityGroup(this, "AppSG", {
      vpc: this.vpc,
      description: "Security group for application services",
      allowAllOutbound: true,
    });

    this.databaseSecurityGroup = new ec2.SecurityGroup(this, "DatabaseSG", {
      vpc: this.vpc,
      description: "Security group for RDS PostgreSQL",
      allowAllOutbound: false,
    });

    this.databaseSecurityGroup.addIngressRule(
      this.applicationSecurityGroup,
      ec2.Port.tcp(5432),
      "Allow PostgreSQL access from application"
    );

    this.cacheSecurityGroup = new ec2.SecurityGroup(this, "CacheSG", {
      vpc: this.vpc,
      description: "Security group for ElastiCache Redis",
      allowAllOutbound: false,
    });

    this.cacheSecurityGroup.addIngressRule(
      this.applicationSecurityGroup,
      ec2.Port.tcp(6379),
      "Allow Redis access from application"
    );

    this.albSecurityGroup = new ec2.SecurityGroup(this, "ALBSG", {
      vpc: this.vpc,
      description: "Security group for ALB",
      allowAllOutbound: true,
    });

    this.applicationSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3000),
      "Allow ALB to reach management service"
    );

    this.applicationSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3001),
      "Allow ALB to reach read service"
    );

    new cdk.CfnOutput(this, "VPCId", { value: this.vpc.vpcId });
  }
}
