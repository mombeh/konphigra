#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/network-stack";
import { DatabaseStack } from "../lib/database-stack";

const app = new cdk.App();

const network = new NetworkStack(app, "Network-Stack", {
  env: { account: "945799872792", region: "eu-north-1" },
});

new DatabaseStack(app, "Database-Stack", {
  vpc: network.vpc,
  env: { account: "945799872792", region: "eu-north-1" },
});
