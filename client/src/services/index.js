/**
 * Services Index
 * Central export point for all API services
 */

export { default as apiService } from './apiService';
export { default as authService } from './authService';
export { default as templateService } from './TemplateLib';
export { default as documentService } from './documentService';
export { default as dashboardService } from './dashboardService';
export { default as userService } from './userService';

// Named exports for convenience
export * from './apiService';
export * from './authService';
export * from './TemplateLib';
export * from './documentService';
export * from './dashboardService';
export * from './userService';
