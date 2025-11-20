import { Stack, StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class NetworkStack extends Stack {
  public readonly vpc: ec2.Vpc;
  public readonly ecsSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create VPC with public + private subnets
    this.vpc = new ec2.Vpc(this, "KonphigraVPC", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: "public", subnetType: ec2.SubnetType.PUBLIC },
        { name: "private", subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      ],
    });

    // Security group to be reused by ECS later
    this.ecsSecurityGroup = new ec2.SecurityGroup(this, "EcsSG", {
      vpc: this.vpc,
      allowAllOutbound: true,
    });
  }
}
