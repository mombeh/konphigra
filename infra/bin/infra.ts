#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { BackendStack } from "../lib/backend-stack";
import { FrontendStack } from "../lib/frontend-stack";

const app = new cdk.App();

// Deploy backend first
const backend = new BackendStack(app, "BackendStack", {
  env: { region: "us-east-1" },
});

// Then frontend (depends on backend's output)
new FrontendStack(app, "FrontendStack", {
  apiUrl: backend.apiUrl.value,
  env: { region: "us-east-1" },
});
