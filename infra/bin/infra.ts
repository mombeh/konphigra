#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { FrontendStack } from "../lib/frontend-stack";
import { BackendStack } from "../lib/backend-stack";
// import { NetworkingStack } from '../stacks/networking-stack';

const app = new cdk.App();

// optional: create networking (VPC, subnets, etc.)
// const network = new NetworkingStack(app, 'NetworkingStack', {});

// backend stack (API Gateway, ECS or Lambda)
const backend = new BackendStack(app, "BackendStack", {
  env: { region: "us-east-1" },
});

// frontend stack (Next.js static hosting on S3 + CloudFront)
new FrontendStack(app, "FrontendStack", {
  apiUrl: backend.apiUrlOutput,
  env: { region: "us-east-1" },
});

app.synth();
