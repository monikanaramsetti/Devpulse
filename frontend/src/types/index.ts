export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  repositoryUrl: string;
  userId: string;
  user?: Partial<User>;
  builds?: Build[];
  createdAt: string;
}

export type BuildStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export interface Build {
  id: string;
  projectId: string;
  project?: Project;
  commitHash: string;
  branch: string;
  status: BuildStatus;
  logs: string;
  duration: number;
  analysis?: Analysis;
  createdAt: string;
}

export interface Analysis {
  id: string;
  buildId: string;
  rootCause: string;
  explanation: string;
  affectedArea: string;
  suggestedFix: string;
  confidence: 'High' | 'Medium' | 'Low';
  limitations: string;
  createdAt: string;
}

export interface BuildUpdatedPayload {
  event: string;
  build: {
    buildId: string;
    projectId: string;
    projectName?: string;
    status: BuildStatus;
    commitHash: string;
    branch: string;
    duration?: number;
    createdAt?: string;
  };
  timestamp: string;
}
