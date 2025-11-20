#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/network-stack";

const app = new cdk.App();

// FIRST STACK ONLY
new NetworkStack(app, "Network-Stack", {
  env: { account: "945799872792", region: "us-east-1" },
});
