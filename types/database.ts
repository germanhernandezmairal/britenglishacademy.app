export type UserRole = 'admin' | 'teacher' | 'student'
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
export type HomeworkStatus = 'pending' | 'under_review' | 'corrected'
export type ExamType = 'pdf_practice' | 'interactive'
export type QuestionType = 'multiple_choice' | 'gap_fill' | 'open_text'
export type MessageType = 'direct' | 'group_broadcast'
export type PostType = 'student_post' | 'weekly_challenge' | 'announcement'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  avatar_url: string | null
  level: CefrLevel | null
  learning_goals: string | null
  login_streak: number
  last_login_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  title: string
  description: string | null
  level: CefrLevel
  video_url: string | null
  video_storage_path: string | null
  vocabulary: VocabularyItem[]
  order_index: number
  is_published: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface VocabularyItem {
  word: string
  definition: string
  example?: string
}

export interface LessonResource {
  id: string
  lesson_id: string
  file_name: string
  storage_path: string
  file_size: number | null
  created_at: string
}

export interface LessonCompletion {
  id: string
  student_id: string
  lesson_id: string
  completed_at: string
}

export interface LessonComment {
  id: string
  lesson_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
  author?: Profile
}

export interface HomeworkSubmission {
  id: string
  student_id: string
  title: string
  description: string | null
  file_path: string
  file_name: string
  file_size: number | null
  status: HomeworkStatus
  ai_feedback: string | null
  ai_grammar_report: GrammarReport | null
  teacher_notes: string | null
  corrected_file_path: string | null
  corrected_file_name: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  student?: Profile
  reviewer?: Profile
}

export interface GrammarReport {
  summary: string
  errors: GrammarError[]
  score_estimate: number
  strengths: string[]
  focus_areas: string[]
}

export interface GrammarError {
  type: string
  original: string
  correction: string
  explanation: string
}

export interface Exam {
  id: string
  title: string
  description: string | null
  level: CefrLevel
  skill: string | null
  exam_type: ExamType
  pdf_path: string | null
  time_limit: number | null
  is_published: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ExamQuestion {
  id: string
  exam_id: string
  question_type: QuestionType
  prompt: string
  options: string[]
  correct_answer: string | null
  points: number
  order_index: number
  created_at: string
}

export interface ExamAttempt {
  id: string
  exam_id: string
  student_id: string
  started_at: string
  submitted_at: string | null
  auto_score: number | null
  ai_score: number | null
  final_score: number | null
  ai_feedback: string | null
  ai_corrections: AiCorrection[] | null
  teacher_override: number | null
  teacher_notes: string | null
  overridden_by: string | null
  overridden_at: string | null
}

export interface AiCorrection {
  question_id: string
  error_type: string
  original: string
  correction: string
  explanation: string
  cefr_descriptor: string
}

export interface ExamAnswer {
  id: string
  attempt_id: string
  question_id: string
  answer_text: string | null
  is_correct: boolean | null
  points_earned: number
  created_at: string
}

export interface CommunityPost {
  id: string
  author_id: string
  post_type: PostType
  title: string | null
  content: string
  image_url: string | null
  is_pinned: boolean
  reactions: Record<string, number>
  created_at: string
  updated_at: string
  author?: Profile
  comments?: PostComment[]
  comment_count?: number
}

export interface PostComment {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  content: string
  reactions: Record<string, number>
  created_at: string
  updated_at: string
  author?: Profile
  replies?: PostComment[]
}

export interface Conversation {
  id: string
  message_type: MessageType
  target_level: CefrLevel | null
  created_by: string
  created_at: string
  participants?: Profile[]
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  file_path: string | null
  file_name: string | null
  is_read: boolean
  created_at: string
  sender?: Profile
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  cover_image: string | null
  author_id: string | null
  is_published: boolean
  published_at: string | null
  tags: string[]
  created_at: string
  updated_at: string
  author?: Profile
}

export interface Notification {
  id: string
  recipient_id: string
  title: string
  body: string
  link: string | null
  is_read: boolean
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile }
      lessons: { Row: Lesson }
      lesson_resources: { Row: LessonResource }
      lesson_completions: { Row: LessonCompletion }
      lesson_comments: { Row: LessonComment }
      homework_submissions: { Row: HomeworkSubmission }
      exams: { Row: Exam }
      exam_questions: { Row: ExamQuestion }
      exam_attempts: { Row: ExamAttempt }
      exam_answers: { Row: ExamAnswer }
      community_posts: { Row: CommunityPost }
      post_comments: { Row: PostComment }
      conversations: { Row: Conversation }
      messages: { Row: Message }
      blog_posts: { Row: BlogPost }
      notifications: { Row: Notification }
    }
  }
}
