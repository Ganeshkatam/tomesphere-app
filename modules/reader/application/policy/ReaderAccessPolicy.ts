export interface ReaderBookAvailabilityState {
  isPublished: boolean | null;
  isArchived: boolean | null;
}

export interface ReaderUserIdentity {
  id: string;
}

export type AccessDenialReason =
  | "UNAUTHENTICATED"
  | "BOOK_NOT_FOUND"
  | "BOOK_UNPUBLISHED"
  | "BOOK_ARCHIVED"
  | "NOT_ENTITLED";

export interface ReaderAccessEvaluation {
  allowed: boolean;
  reason?: AccessDenialReason;
}

/**
 * Evaluates publication availability.
 * Availability indicates whether the book is in an active, published, and unarchived catalog state.
 * NOTE: This is an availability check, NOT an entitlement check.
 */
export function isBookAvailableForReading(state: ReaderBookAvailabilityState): boolean {
  return state.isPublished === true && state.isArchived !== true;
}

/**
 * Evaluates whether an authenticated user identity is entitled to read the specific book.
 * In TomeSphere's current catalog model, any authenticated member in good standing is entitled
 * to read active catalog books. Future subscription or enterprise tiers bind here.
 */
export function isUserEntitledToReadBook(
  user: ReaderUserIdentity | null,
  bookId: string,
): boolean {
  if (!user || !user.id || !bookId) {
    return false;
  }
  // All authenticated members are entitled to open catalog books in V1
  return true;
}

/**
 * Full access gate: requires an authenticated user, an active publication state,
 * and valid entitlement.
 */
export function evaluateReaderAccess(
  user: ReaderUserIdentity | null,
  book: { id: string; isPublished: boolean | null; isArchived: boolean | null } | null,
): ReaderAccessEvaluation {
  if (!user) {
    return { allowed: false, reason: "UNAUTHENTICATED" };
  }

  if (!book) {
    return { allowed: false, reason: "BOOK_NOT_FOUND" };
  }

  if (book.isArchived === true) {
    return { allowed: false, reason: "BOOK_ARCHIVED" };
  }

  if (book.isPublished !== true) {
    return { allowed: false, reason: "BOOK_UNPUBLISHED" };
  }

  if (!isUserEntitledToReadBook(user, book.id)) {
    return { allowed: false, reason: "NOT_ENTITLED" };
  }

  return { allowed: true };
}
