import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

export interface ComputeStackProps extends cdk.StackProps {
  readonly vpc: ec2.IVpc;
  readonly clusterName?: string;
}

export class ComputeStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly taskExecutionRole: iam.Role;
  public readonly taskRole: iam.Role;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    this.albSecurityGroup = new ec2.SecurityGroup(this, "ALBSecurityGroup", {
      vpc,
      description: "ALB security group for Konphigra",
      allowAllOutbound: true,
    });

    this.albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "Allow HTTP");
    this.albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "Allow HTTPS");

    this.cluster = new ecs.Cluster(this, "KonphigraCluster", {
      vpc,
      clusterName: props.clusterName,
      containerInsights: true,
    });

    this.taskExecutionRole = new iam.Role(this, "TaskExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonECSTaskExecutionRolePolicy"),
      ],
    });

    this.taskRole = new iam.Role(this, "TaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    this.logGroup = new logs.LogGroup(this, "EcsTaskLogGroup", {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.alb = new elbv2.ApplicationLoadBalancer(this, "KonphigraALB", {
      vpc,
      internetFacing: true,
      securityGroup: this.albSecurityGroup,
      loadBalancerName: `${this.stackName}-alb`,
    });

    const listener = this.alb.addListener("HttpListener", {
      port: 80,
      open: true,
    });

    listener.addAction("DefaultFixedResponse", {
      action: elbv2.ListenerAction.fixedResponse(503, {
        contentType: "text/plain",
        messageBody: "Service not yet deployed",
      }),
    });

    const backendService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "BackendService",
      {
        cluster: this.cluster, // <-- FIX: use this.cluster
        publicLoadBalancer: false,
        desiredCount: 1,
        cpu: 256,
        memoryLimitMiB: 512,

        taskImageOptions: {
          image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
          containerPort: 80,
          environment: {
            ENV: "dev",
          },
          logDriver: ecs.LogDrivers.awsLogs({
            logGroup: this.logGroup,
            streamPrefix: "backend-sample",
          }),
        },
        taskSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    new cdk.CfnOutput(this, "BackendServiceURL", {
      value: backendService.loadBalancer.loadBalancerDnsName,
    });

    new cdk.CfnOutput(this, "ClusterName", { value: this.cluster.clusterName });
    new cdk.CfnOutput(this, "AlbDNS", { value: this.alb.loadBalancerDnsName });
    new cdk.CfnOutput(this, "AlbSecurityGroup", { value: this.albSecurityGroup.securityGroupId });
  }
}
