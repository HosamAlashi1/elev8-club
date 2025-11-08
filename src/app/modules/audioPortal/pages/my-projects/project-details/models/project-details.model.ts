// ========================================
// 📦 Project Details Models & Types
// ========================================

import { VoiceProcess } from './voice.model';

/**
 * Project Details with Chapters List
 */
export interface ProjectDetails {
  id: number;
  name: string;
  chapters: ChapterRef[];
  process?: VoiceProcess; // Voice generation process
  auth_type?: number; // User's auth type (3 = Editor)
  voice_url?: string;
  voice_key?: string; // Selected voice key for generation
  format: string;
}

/**
 * Chapter Reference (in list)
 */
export interface ChapterRef {
  id: number;
  title: string;
  order?: number; // For local reordering
}

/**
 * Chapter Full Details
 */
export interface ChapterDetails {
  id: number;
  title: string;
  voice_file: string;
  process?: VoiceProcess; // Voice generation process
  voice_url?: string;
  voice_key?: string; // Selected voice key for generation
  format: string;
}

/**
 * Paragraph Item
 */
export interface ParagraphItem {
  id: number;
  text: string;
  is_title: boolean; //  Section header flag
  voice_key: string | null;
  voice_file: string;
  format: string;
  process?: VoiceProcess; // Voice generation process
  isExpanded?: boolean; // UI state for expand/collapse
  isEditing?: boolean; // UI state for inline editing
  voice_url?: string;
}

/**
 * Note Item
 */
export interface NoteItem {
  id: number;
  text: string;
  insert_user: string;
  user_type: number; // 1=Admin, 2=Author, 3=Editor, 4=Customer
  insert_date: string; // ISO format
  isEditing?: boolean; // UI state for inline editing
}

/**
 * Generic API Response
 */
export interface ApiResponse<T> {
  status: boolean;
  statusCode: number;
  message: string;
  data: T;
}

/**
 * API Response Types
 */
export interface ProjectDetailsResponse extends ApiResponse<ProjectDetails> { }
export interface ChapterDetailsResponse extends ApiResponse<ChapterDetails> { }
export interface ParagraphsResponse extends ApiResponse<ParagraphItem[]> { }
export interface NotesResponse extends ApiResponse<NoteItem[]> { }

/**
 * User Type Enum (matching backend)
 */
export enum UserType {
  Admin = 1,
  Author = 2,
  Editor = 3,
  Customer = 4
}

/**
 * Tab Type
 */
export type TabType = 'paragraphs' | 'notes';
