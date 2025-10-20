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
  success: boolean;
  msg: string;
  data: T;
}

/**
 * Projects List Response
 */
export interface ProjectsResponse {
  success: boolean;
  msg: string;
  data: ProjectItem[];
}

/**
 * Add Project Response
 */
export interface AddProjectResponse {
  success: boolean;
  msg: string;
  data: null;
}

/**
 * Project Creation Method
 */
export type ProjectCreationMethod = 'AI' | 'MANUAL';
