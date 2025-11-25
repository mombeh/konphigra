import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as logs from "aws-cdk-lib/aws-logs";

interface MonitoringStackProps extends cdk.StackProps {
  backendServiceName?: string;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Log group for backend (ECS)
    const backendLogGroup = new logs.LogGroup(this, "BackendLogGroup", {
      logGroupName: "/konphigra/backend",
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, "KonphigraDashboard", {
      dashboardName: "Konphigra-Monitoring",
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Backend CPU Usage",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/ECS",
            metricName: "CPUUtilization",
            dimensionsMap: {
              ServiceName: props.backendServiceName || "BackendFargateService",
            },
            statistic: "Average",
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: "Backend Memory Usage",
        left: [
          new cloudwatch.Metric({
            namespace: "AWS/ECS",
            metricName: "MemoryUtilization",
            dimensionsMap: {
              ServiceName: props.backendServiceName || "BackendFargateService",
            },
            statistic: "Average",
            period: cdk.Duration.minutes(1),
          }),
        ],
      })
    );

    // Example alarm
    new cloudwatch.Alarm(this, "HighCPUAlarm", {
      metric: new cloudwatch.Metric({
        namespace: "AWS/ECS",
        metricName: "CPUUtilization",
        statistic: "Average",
        period: cdk.Duration.minutes(1),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: "Backend is consuming high CPU",
      alarmName: "Konphigra-HighCPU",
    });
  }
}
