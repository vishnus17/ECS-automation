import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import * as path from 'path';
import * as ecrdeploy from 'cdk-ecr-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as alb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class WebserverEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // Build docker image
    const asset = new DockerImageAsset(this, 'MyBuildImage', {
      directory: path.join("image", ''),
    });
    
    // Create ECR repository
    const ecrRepo = new ecr.Repository(this, 'WebserverEcrRepo', {
      repositoryName: 'webserver-ecr-repo',
    });

    // Deploy docker image to ECR
    new ecrdeploy.ECRDeployment(this, 'DeployImage', {
      src: new ecrdeploy.DockerImageName(asset.imageUri),
      dest: new ecrdeploy.DockerImageName(`${cdk.Aws.ACCOUNT_ID}.dkr.ecr.ap-south-1.amazonaws.com/webserver-ecr-repo:latest`),
    });

    // Create ECS cluster
    const cluster = new ecs.Cluster(this, 'WebserverEcsCluster', {
      clusterName: 'webserver-ecs-cluster',
    });

    // Create ECS task definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'WebserverTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
      runtimePlatform: {
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
      },
    });

    // Create ECS container definition
    const containerDefinition = taskDefinition.addContainer('WebserverContainer', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepo),
      memoryLimitMiB: 512,
      cpu: 256,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'webserver-ecs',
      }),
      portMappings: [
        {
          containerPort: 80,
          hostPort: 80,
        },
      ],
    });

    // Create ECS service
    const service = new ecs.FargateService(this, 'WebserverService', {
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: 1,
      serviceName: 'webserver-service',
      assignPublicIp: true,
    });

    // Create ECS load balancer
    const loadBalancer = new alb.ApplicationLoadBalancer(this, 'WebserverLoadBalancer', {
      vpc: cluster.vpc,
      internetFacing: true,
      loadBalancerName: 'webserveralb',
    });

    // Create ECS listener
    const listener = loadBalancer.addListener('WebserverListener', {
      port: 80,
    });
    
    // Create ECS target group
    const targetGroup = listener.addTargets('WebserverTargetGroup', {
      port: 80,
      targets: [service],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(60),
        timeout: cdk.Duration.seconds(5),
        healthyHttpCodes: '200',
      },
    });

    // Create ECS security group
    const securityGroup = new ec2.SecurityGroup(this, 'WebserverSecurityGroup', {
      vpc: cluster.vpc,
      allowAllOutbound: true,
    });

    // Create ECS security group ingress rule
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP access from the Internet');

    // Create ECS security group egress rule
    securityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP access to the Internet');
    
  }
}
