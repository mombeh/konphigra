#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { NetworkStack } from "../lib/network-stack";
import { DatabaseStack } from "../lib/database-stack";
import { AuthStack } from "../lib/auth-stack";
import { MonitoringStack } from "../lib/monitoring-stack";
import { BackendStack } from "../lib/backend-stack";
import { ComputeStack } from "../lib/compute-stack";

const app = new cdk.App();

const env = {
  account: "945799872792",
  region: "eu-north-1",
};

const network = new NetworkStack(app, "Network-Stack-Config", { env });

const database = new DatabaseStack(app, "Database-Stack", {
  env,
  vpc: network.vpc,
});

const auth = new AuthStack(app, "Auth-Stack", { env });

const monitoring = new MonitoringStack(app, "Monitoring-Stack", { env });

const compute = new ComputeStack(app, "Compute-Stack", {
  env,
  vpc: network.vpc,
});

const backendStack = new BackendStack(app, "Backend-Stack", {
  env,
  vpc: network.vpc,
  cluster: compute.cluster,
  dbSecurityGroup: database.dbSecurityGroup,
  dbSecret: database.secret,
  dbHost: database.instance.instanceEndpoint.hostname,
});
