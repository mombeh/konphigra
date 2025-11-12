import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";

interface FrontendStackProps extends cdk.StackProps {
  apiUrl: cdk.CfnOutput;
}

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const siteBucket = new s3.Bucket(this, "WebBucket", {
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
    });

    const distribution = new cloudfront.Distribution(this, "WebDistribution", {
      defaultBehavior: { origin: new origins.S3Origin(siteBucket) },
    });

    new s3Deploy.BucketDeployment(this, "DeployWeb", {
      sources: [s3Deploy.Source.asset("../apps/web/out")],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    new cdk.CfnOutput(this, "FrontendUrl", {
      value: `https://${distribution.domainName}`,
    });
  }
}
