# AWS Stage Organization Plan

To properly organize the Yatra platform into AWS stages (e.g., `dev`, `staging`, `prod`), we need to adopt Infrastructure as Code (IaC) or a deployment framework that natively supports environments. Since you have a FastAPI backend and a React (Vite) frontend, there are two primary approaches we can take.

## Proposed Approaches

### Approach 1: Serverless Deployment (AWS Lambda + API Gateway)
This is the most cost-effective approach for APIs that don't have constant high traffic. We can wrap the FastAPI backend using `mangum` and deploy it to AWS Lambda.
- **Backend**: Use the **Serverless Framework** (`serverless.yml`) to define API Gateway endpoints and Lambda functions. The framework natively supports `--stage dev` and `--stage prod` flags to spin up completely isolated environments.
- **Frontend**: Deploy the React build to isolated AWS S3 buckets (e.g., `yatra-frontend-dev`, `yatra-frontend-prod`) fronted by CloudFront.
- **Database**: Use AWS RDS (MySQL). We can provision separate databases (`yatra_dev`, `yatra_prod`) within the same RDS instance to save costs, or use separate instances.

### Approach 2: Containerized Deployment (AWS ECS + Fargate)
Since you already have a `docker-compose.yml` for local development, this approach is the most faithful to your local setup.
- **Backend & DB**: Use **AWS Copilot CLI** or **Terraform** to deploy Docker containers to AWS ECS (Fargate). Both tools allow you to define "environments" (stages) and deploy your `yatra_backend` container securely.
- **Frontend**: Similar to Approach 1, or host it as an Nginx container on ECS alongside the backend.

## Environment Variable Management (For Both Approaches)
We will split your `.env` file into stage-specific files:
- `.env.dev` (for local and dev stage)
- `.env.staging` (for staging testing)
- `.env.prod` (for production)

The CI/CD pipeline or deployment scripts will inject the correct environment file based on the target stage.

## Open Questions

> [!IMPORTANT]
> **Deployment Tool Preference:** Do you prefer going the **Serverless** route (Lambda + API Gateway via `serverless.yml`) or the **Containerized** route (Docker + AWS ECS via Terraform/Copilot)?

> [!WARNING]
> **Database Isolation:** For your AWS stages, do you want completely separate RDS instances for each stage (higher cost, maximum isolation) or just different logical databases within a single shared RDS instance (lower cost)?

> [!NOTE]
> **CI/CD Integration:** Do you want me to set up GitHub Actions (or similar) workflows to automatically deploy to the correct AWS stage when you push code to specific branches (e.g., `main` -> prod, `develop` -> dev)?

## Verification Plan
1. Refactor configuration to support stage-based loading (`.env.STAGE`).
2. Generate the necessary IaC configuration files (e.g., `serverless.yml` or Terraform manifests) with parameterized stage variables.
3. Provide deployment scripts (`deploy.sh --stage dev`) to automate the provisioning.
