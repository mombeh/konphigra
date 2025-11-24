// infra/lib/database-stack.ts
import * as cdk from "aws-cdk-lib";
import { Stack, StackProps, Duration, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export interface DatabaseStackProps extends StackProps {
  vpc: ec2.IVpc;
  backendSecurityGroup?: ec2.ISecurityGroup; // allow backend to connect
  multiAz?: boolean;
  dbName?: string;
}

export class DatabaseStack extends Stack {
  public readonly clusterEndpoint: string;
  public readonly secret: secretsmanager.ISecret;
  public readonly dbSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const dbName = props.dbName ?? "konphigra";

    // Security group for DB
    this.dbSecurityGroup = new ec2.SecurityGroup(this, "DbSecurityGroup", {
      vpc: props.vpc,
      description: "Allow backend to connect to Postgres",
      allowAllOutbound: true,
    });

    // Allow backend security group to connect (if provided)
    if (props.backendSecurityGroup) {
      this.dbSecurityGroup.addIngressRule(
        props.backendSecurityGroup,
        ec2.Port.tcp(5432),
        "Allow backend services to connect to Postgres"
      );
    } else {
      // allow from within VPC as fallback (you may narrow this)
      this.dbSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
        ec2.Port.tcp(5432),
        "Allow VPC"
      );
    }

    // Create credentials in Secrets Manager
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

    // RDS instance
    const instance = new rds.DatabaseInstance(this, "KonphigraPostgres", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MEDIUM /* adjust */
      ),
      vpc: props.vpc,
      vpcSubnets: subnetSelection,
      credentials: rds.Credentials.fromSecret(this.secret), // uses secret
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

    // Export connection info
    new cdk.CfnOutput(this, "DbSecretArn", { value: this.secret.secretArn });
    new cdk.CfnOutput(this, "DbEndpoint", { value: instance.instanceEndpoint.hostname });
    new cdk.CfnOutput(this, "DbPort", { value: instance.instanceEndpoint.port.toString() });
  }
}
