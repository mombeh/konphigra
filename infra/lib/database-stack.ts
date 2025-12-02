// infra/lib/database-stack.ts
import * as cdk from "aws-cdk-lib";
import { Stack, StackProps, Duration, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export interface DatabaseStackProps extends StackProps {
  vpc: ec2.IVpc;
  multiAz?: boolean;
  dbName?: string;
}

export class DatabaseStack extends Stack {
  public readonly instance: rds.DatabaseInstance;
  public readonly secret: secretsmanager.ISecret;
  public readonly dbSecurityGroup: ec2.ISecurityGroup;
  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const dbName = props.dbName ?? "konphigra";

    this.dbSecurityGroup = new ec2.SecurityGroup(this, "DbSG", {
      vpc: props.vpc,
      allowAllOutbound: false,
    });

    this.secret = new secretsmanager.Secret(this, "DbCredentialsSecret", {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "konphigra_admin" }),
        generateStringKey: "password",
        excludePunctuation: true,
        passwordLength: 24,
      },
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const subnetSelection: ec2.SubnetSelection = {
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    };

    const instance = new rds.DatabaseInstance(this, "KonphigraPostgres", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM),
      vpc: props.vpc,
      vpcSubnets: subnetSelection,
      credentials: rds.Credentials.fromSecret(this.secret),
      multiAz: props.multiAz ?? false,
      publiclyAccessible: false,
      allocatedStorage: 100,
      maxAllocatedStorage: 200,
      storageType: rds.StorageType.GP3,
      securityGroups: [this.dbSecurityGroup],
      databaseName: dbName,
      removalPolicy: RemovalPolicy.RETAIN,
      deletionProtection: true,
      backupRetention: Duration.days(7),
      autoMinorVersionUpgrade: true,
    });

    this.instance = instance;
  }
}
