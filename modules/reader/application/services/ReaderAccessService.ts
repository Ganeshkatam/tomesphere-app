import { IdentityProvider } from "@/shared/application/ports/identity/IdentityProvider";
import { BookRepository } from "@/modules/books/domain/repositories/BookRepository";
import { BookId } from "@/modules/books/domain/value-objects";
import { ReaderAccessDto } from "../dto/ReaderAccessDto";
import { evaluateReaderAccess } from "../policy/ReaderAccessPolicy";
import { createSupabaseAdminClient } from "@/shared/core/database/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/core/types/database";

export class ReaderAccessError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ReaderAccessError";
  }
}

export class ReaderAccessService {
  constructor(
    private readonly identityProvider: IdentityProvider,
    private readonly bookRepository: BookRepository,
    private readonly storageAdminClient?: SupabaseClient<Database>,
  ) {}

  async getSignedReaderAccess(bookIdStr: string): Promise<ReaderAccessDto> {
    const user = await this.identityProvider.currentUser();
    if (!user) {
      throw new ReaderAccessError("Unauthorized", 401, "UNAUTHENTICATED");
    }

    const bookEntity = await this.bookRepository.findById(
      BookId.create(bookIdStr),
    );
    if (!bookEntity) {
      throw new ReaderAccessError("Book not found", 404, "BOOK_NOT_FOUND");
    }

    const accessEval = evaluateReaderAccess(
      { id: user.id },
      {
        id: bookEntity.bookId.value,
        isPublished: bookEntity.isPublished,
        isArchived: bookEntity.isArchived,
      },
    );

    if (!accessEval.allowed) {
      switch (accessEval.reason) {
        case "BOOK_ARCHIVED":
          throw new ReaderAccessError("Book is archived", 403, "BOOK_ARCHIVED");
        case "BOOK_UNPUBLISHED":
          throw new ReaderAccessError("Book is unpublished", 403, "BOOK_UNPUBLISHED");
        case "NOT_ENTITLED":
          throw new ReaderAccessError("Not entitled to read this book", 403, "NOT_ENTITLED");
        default:
          throw new ReaderAccessError("Access denied", 403, "ACCESS_DENIED");
      }
    }

    const primaryFile = bookEntity.getPrimaryFile();
    if (!primaryFile || !primaryFile.storagePath) {
      throw new ReaderAccessError("Book content file not available", 404, "FILE_NOT_FOUND");
    }

    // Resolve relative canonical object key from storage_path
    let objectKey = primaryFile.storagePath.trim();
    if (objectKey.startsWith("http://") || objectKey.startsWith("https://")) {
      try {
        const parsed = new URL(objectKey);
        // Extracts path after /storage/v1/object/public/book-pdfs/ or /storage/v1/object/sign/book-pdfs/
        const match = parsed.pathname.match(/\/book-pdfs\/(.+)$/);
        objectKey = match ? decodeURIComponent(match[1]) : objectKey;
      } catch {
        // Fallback for non-standard URL strings
        const match = objectKey.match(/\/book-pdfs\/(.+)$/);
        objectKey = match ? decodeURIComponent(match[1]) : objectKey;
      }
    }

    // Strip any residual bucket prefix or leading slashes
    objectKey = objectKey.replace(/^book-pdfs\//, "").replace(/^\/+/, "");

    const adminStorage =
      this.storageAdminClient || createSupabaseAdminClient();

    const SIGNED_URL_TTL_SECONDS = 60;
    const { data: signData, error: signError } = await adminStorage.storage
      .from("book-pdfs")
      .createSignedUrl(objectKey, SIGNED_URL_TTL_SECONDS);

    if (signError || !signData?.signedUrl) {
      console.error(
        `[ReaderAccessService] Failed to generate signed URL for book ${bookIdStr} object ${objectKey}:`,
        signError,
      );
      throw new ReaderAccessError(
        "Failed to generate secure book access token",
        500,
        "SIGNING_FAILED",
      );
    }

    const expiresAt = new Date(
      Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
    ).toISOString();

    return {
      bookId: bookEntity.bookId.value,
      signedUrl: signData.signedUrl,
      expiresAt,
      fileType: (primaryFile.format as "pdf" | "epub") || "pdf",
    };
  }
}
