export interface ReaderBookAccessState {
  isPublished: boolean | null;
  isArchived: boolean | null;
}

export function canReadBook(state: ReaderBookAccessState): boolean {
  return state.isPublished === true && state.isArchived !== true;
}
