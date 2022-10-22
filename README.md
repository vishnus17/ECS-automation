# ECS creation automation using AWS CDK

This is a CDK project that creates an ECS cluster with a Fargate service and a load balancer to expose the service to the internet.

The Dockerfile associated contains a simple apache web server that serves a static html page.


# Resources created
AWS CDK deploys the following resources:

- VPC
- ECS Cluster
- Fargate Service
- Load Balancer
- Security Groups
## Useful commands

* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
