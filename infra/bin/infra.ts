#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/network-stack";
import { DatabaseStack } from "../lib/database-stack";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || "eu-north-1",
};

const network = new NetworkStack(app, "Network-Stack", {
  env,
});

new DatabaseStack(app, "Database-Stack", {
  vpc: network.vpc,
  env,
});
