#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/network-stack";
import { DatabaseStack } from "../lib/database-stack";
import { BackendStack } from "../lib/backend-stack";

const app = new cdk.App();

const env = {
  account: "945799872792",
  region: "eu-north-1",
};

const network = new NetworkStack(app, "Network-Stack", { env });

const database = new DatabaseStack(app, "Database-Stack", {
  env,
  vpc: network.vpc,
});

new BackendStack(app, "Backend-Stack", {
  env,
  vpc: network.vpc,
  dbSecret: database.secret,
  dbSecurityGroup: database.dbSecurityGroup,
  dbHost: database.instance.instanceEndpoint.hostname,
});
