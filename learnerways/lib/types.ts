export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export type ActionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

export interface CreateMaterialResult {
  ok: boolean;
  id?: string;
  error?: string;
}