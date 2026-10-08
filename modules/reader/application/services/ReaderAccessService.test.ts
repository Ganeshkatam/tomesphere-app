jest.mock("server-only", () => ({}), { virtual: true });

import { ReaderAccessService, ReaderAccessError } from "./ReaderAccessService";
import { IdentityProvider } from "@/shared/application/ports/identity/IdentityProvider";
import { BookRepository } from "@/modules/books/domain/repositories/BookRepository";
import { Book } from "@/modules/books/domain/entities/Book";
import { BookId } from "@/modules/books/domain/value-objects";
import { BookFile } from "@/modules/books/domain/value-objects/BookFile";

describe("ReaderAccessService & Adversarial Authorization Boundary", () => {
  const userId = "usr-ad-001";
  const bookId = "00000000-0000-0000-0000-000000000001";

  let mockIdentityProvider: jest.Mocked<IdentityProvider>;
  let mockBookRepository: jest.Mocked<BookRepository>;
  let mockAdminStorage: any;

  beforeEach(() => {
    mockIdentityProvider = {
      currentUser: jest.fn().mockResolvedValue({ id: userId, email: "user@tomesphere.in" }),
      currentUserId: jest.fn().mockResolvedValue(userId),
      isAuthenticated: jest.fn().mockResolvedValue(true),
      hasRole: jest.fn().mockResolvedValue(false),
    };

    mockBookRepository = {
      findById: jest.fn(),
      search: jest.fn(),
      getTrending: jest.fn(),
      save: jest.fn(),
    };

    mockAdminStorage = {
      storage: {
        from: jest.fn().mockReturnValue({
          createSignedUrl: jest.fn().mockResolvedValue({
            data: { signedUrl: "https://qusuvzwycdmnecixzsgc.supabase.co/storage/v1/object/sign/book-pdfs/sample.pdf?token=valid-token-60s" },
            error: null,
          }),
        }),
      },
    };
  });

  it("1. Unauthenticated request -> strictly denied with 401 UNAUTHENTICATED", async () => {
    mockIdentityProvider.currentUser.mockResolvedValue(null);
    const service = new ReaderAccessService(mockIdentityProvider, mockBookRepository, mockAdminStorage);

    await expect(service.getSignedReaderAccess(bookId)).rejects.toMatchObject({
      statusCode: 401,
      code: "UNAUTHENTICATED",
    });
  });

  it("2. Non-existent book -> returns 404 BOOK_NOT_FOUND", async () => {
    mockBookRepository.findById.mockResolvedValue(null);
    const service = new ReaderAccessService(mockIdentityProvider, mockBookRepository, mockAdminStorage);

    await expect(service.getSignedReaderAccess(bookId)).rejects.toMatchObject({
      statusCode: 404,
      code: "BOOK_NOT_FOUND",
    });
  });

  it("3. Unpublished book -> strictly denied with 403 BOOK_UNPUBLISHED", async () => {
    const unpublishedBook = Book.create({
      id: BookId.create(bookId),
      title: "Draft Work",
      authors: ["Author"],
      isTextbook: false,
      isPublished: false,
      isArchived: false,
      files: [
        BookFile.create({
          id: "f1",
          format: "pdf",
          storagePath: "draft.pdf",
          mimeType: "application/pdf",
          checksum: null,
          size: 1024,
          version: 1,
          isPrimary: true,
        }),
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockBookRepository.findById.mockResolvedValue(unpublishedBook);

    const service = new ReaderAccessService(mockIdentityProvider, mockBookRepository, mockAdminStorage);
    await expect(service.getSignedReaderAccess(bookId)).rejects.toMatchObject({
      statusCode: 403,
      code: "BOOK_UNPUBLISHED",
    });
  });

  it("4. Archived book -> strictly denied with 403 BOOK_ARCHIVED", async () => {
    const archivedBook = Book.create({
      id: BookId.create(bookId),
      title: "Archived Classic",
      authors: ["Author"],
      isTextbook: false,
      isPublished: true,
      isArchived: true,
      files: [
        BookFile.create({
          id: "f1",
          format: "pdf",
          storagePath: "archived.pdf",
          mimeType: "application/pdf",
          checksum: null,
          size: 1024,
          version: 1,
          isPrimary: true,
        }),
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockBookRepository.findById.mockResolvedValue(archivedBook);

    const service = new ReaderAccessService(mockIdentityProvider, mockBookRepository, mockAdminStorage);
    await expect(service.getSignedReaderAccess(bookId)).rejects.toMatchObject({
      statusCode: 403,
      code: "BOOK_ARCHIVED",
    });
  });

  it("5. Published book with valid entitlement -> issues 60-second signed URL DTO", async () => {
    const validBook = Book.create({
      id: BookId.create(bookId),
      title: "The Odyssey",
      authors: ["Homer"],
      isTextbook: false,
      isPublished: true,
      isArchived: false,
      files: [
        BookFile.create({
          id: "f1",
          format: "epub",
          storagePath: "books/001/odyssey.epub",
          mimeType: "application/epub+zip",
          checksum: null,
          size: 2048,
          version: 1,
          isPrimary: true,
        }),
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockBookRepository.findById.mockResolvedValue(validBook);

    const service = new ReaderAccessService(mockIdentityProvider, mockBookRepository, mockAdminStorage);
    const accessDto = await service.getSignedReaderAccess(bookId);

    expect(accessDto.bookId).toBe(bookId);
    expect(accessDto.signedUrl).toContain("valid-token-60s");
    expect(accessDto.fileType).toBe("epub");
    expect(new Date(accessDto.expiresAt).getTime()).toBeGreaterThan(Date.now());

    // Invariant: DTO must never leak internal storage path or bucket metadata
    expect((accessDto as any).storagePath).toBeUndefined();
    expect((accessDto as any).bucket).toBeUndefined();
    expect((accessDto as any).internalKey).toBeUndefined();
  });

  it("6. Legacy public URL in storage_path is safely stripped to relative key before signing", async () => {
    const legacyUrlBook = Book.create({
      id: BookId.create(bookId),
      title: "Legacy Document",
      authors: ["Scholar"],
      isTextbook: false,
      isPublished: true,
      isArchived: false,
      files: [
        BookFile.create({
          id: "f1",
          format: "pdf",
          storagePath: "https://qusuvzwycdmnecixzsgc.supabase.co/storage/v1/object/public/book-pdfs/ancient_manuscript%20(v1).pdf",
          mimeType: "application/pdf",
          checksum: null,
          size: 4096,
          version: 1,
          isPrimary: true,
        }),
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockBookRepository.findById.mockResolvedValue(legacyUrlBook);

    const service = new ReaderAccessService(mockIdentityProvider, mockBookRepository, mockAdminStorage);
    await service.getSignedReaderAccess(bookId);

    // Verify createSignedUrl was called with the relative decoded object key, NOT the full public URL
    expect(mockAdminStorage.storage.from).toHaveBeenCalledWith("book-pdfs");
    const createSignedUrlMock = mockAdminStorage.storage.from("book-pdfs").createSignedUrl;
    expect(createSignedUrlMock).toHaveBeenCalledWith(
      "ancient_manuscript (v1).pdf",
      60,
    );
  });
});
