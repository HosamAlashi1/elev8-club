// ========================================
// 📦 Project Models & Types
// ========================================

/**
 * Project Item returned from API
 */
export interface ProjectItem {
  id: number;
  name: string;
}

/**
 * Generic API Response Wrapper
 */
export interface ApiResponse<T> {
  status: boolean;
  statusCode: number;
  message: string;
  data: T;
}

/**
 * Projects List Response
 */
export interface ProjectsResponse {
  status: boolean;
  statusCode: number;
  message: string;
  data: ProjectItem[];
}

/**
 * Add Project Response
 */
export interface AddProjectResponse {
  status: boolean;
  statusCode: number;
  message: string;
  data: null;
}

/**
 * Project Creation Method
 */
export type ProjectCreationMethod = 'AI' | 'MANUAL';
