import { processOutbox, getOutboxMetrics } from "./outbox-relay";
import { WorkerDatabaseClient, ClaimedOutboxEvent } from "@/shared/infrastructure/database/WorkerDatabaseClient";
import { IEventBus } from "../events/types";

jest.mock("@/shared/infrastructure/database/WorkerDatabaseClient", () => ({
  WorkerDatabaseClient: {
    claimOutboxEvents: jest.fn(),
    completeOutboxEvent: jest.fn(),
    getOutboxMetrics: jest.fn(),
  },
}));

describe("Outbox Relay", () => {
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventBus = {
      emit: jest.fn(),
      subscribe: jest.fn(),
    };
  });

  const createMockEvent = (overrides?: Partial<ClaimedOutboxEvent>): ClaimedOutboxEvent => ({
    id: "e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1",
    event_type: "reader.session.started",
    payload: { sessionId: "s1", userId: "u1", bookId: "b1", startedAt: "2026-09-01T00:00:00Z" },
    occurred_at: "2026-09-01T00:00:00Z",
    retry_count: 0,
    lease_id: "l1l1l1l1-l1l1-4l1l-8l1l-l1l1l1l1l1l1",
    ...overrides,
  });

  describe("processOutbox", () => {
    it("successfully processes claimed events and marks them processed with lease_id", async () => {
      const mockEvent = createMockEvent();
      (WorkerDatabaseClient.claimOutboxEvents as jest.Mock).mockResolvedValue([mockEvent]);
      (WorkerDatabaseClient.completeOutboxEvent as jest.Mock).mockResolvedValue(mockEvent);

      const result = await processOutbox(mockEventBus, "test-worker");

      expect(WorkerDatabaseClient.claimOutboxEvents).toHaveBeenCalledWith(50, "test-worker", 300);
      expect(mockEventBus.emit).toHaveBeenCalledWith("reader.session.started", mockEvent.payload);
      expect(WorkerDatabaseClient.completeOutboxEvent).toHaveBeenCalledWith(
        mockEvent.id,
        mockEvent.lease_id,
        "processed",
      );
      expect(result).toEqual({ processed: 1, failed: 0, deadLetter: 0 });
    });

    it("returns zero counts when no events are available to claim", async () => {
      (WorkerDatabaseClient.claimOutboxEvents as jest.Mock).mockResolvedValue([]);

      const result = await processOutbox(mockEventBus);

      expect(mockEventBus.emit).not.toHaveBeenCalled();
      expect(WorkerDatabaseClient.completeOutboxEvent).not.toHaveBeenCalled();
      expect(result).toEqual({ processed: 0, failed: 0, deadLetter: 0 });
    });

    it("transitions failed event to failed when retry_count is below MAX_RETRIES", async () => {
      const mockEvent = createMockEvent({ retry_count: 0 });
      (WorkerDatabaseClient.claimOutboxEvents as jest.Mock).mockResolvedValue([mockEvent]);
      mockEventBus.emit.mockImplementation(() => {
        throw new Error("Handler execution crashed");
      });
      (WorkerDatabaseClient.completeOutboxEvent as jest.Mock).mockResolvedValue(mockEvent);

      const result = await processOutbox(mockEventBus);

      expect(WorkerDatabaseClient.completeOutboxEvent).toHaveBeenCalledWith(
        mockEvent.id,
        mockEvent.lease_id,
        "failed",
        "Handler execution crashed",
      );
      expect(result).toEqual({ processed: 0, failed: 1, deadLetter: 0 });
    });

    it("transitions event to dead_letter when retry_count reaches MAX_RETRIES", async () => {
      const mockEvent = createMockEvent({ retry_count: 2 }); // Next attempt: 3 >= MAX_RETRIES (3)
      (WorkerDatabaseClient.claimOutboxEvents as jest.Mock).mockResolvedValue([mockEvent]);
      mockEventBus.emit.mockImplementation(() => {
        throw new Error("Persistent database failure in handler");
      });
      (WorkerDatabaseClient.completeOutboxEvent as jest.Mock).mockResolvedValue(mockEvent);

      const result = await processOutbox(mockEventBus);

      expect(WorkerDatabaseClient.completeOutboxEvent).toHaveBeenCalledWith(
        mockEvent.id,
        mockEvent.lease_id,
        "dead_letter",
        "Persistent database failure in handler",
      );
      expect(result).toEqual({ processed: 0, failed: 0, deadLetter: 1 });
    });

    it("handles lease fencing violation without crashing batch loop", async () => {
      const mockEvent = createMockEvent();
      (WorkerDatabaseClient.claimOutboxEvents as jest.Mock).mockResolvedValue([mockEvent]);
      mockEventBus.emit.mockImplementation(() => {
        throw new Error("Temporary failure");
      });
      (WorkerDatabaseClient.completeOutboxEvent as jest.Mock).mockRejectedValue(
        new Error("Lease expired or invalid lease_id"),
      );

      const result = await processOutbox(mockEventBus);

      expect(result).toEqual({ processed: 0, failed: 1, deadLetter: 0 });
    });

    it("handles claim database failure gracefully with structured log", async () => {
      (WorkerDatabaseClient.claimOutboxEvents as jest.Mock).mockRejectedValue(
        new Error("Connection refused to database pool"),
      );

      const result = await processOutbox(mockEventBus);

      expect(result).toEqual({ processed: 0, failed: 0, deadLetter: 0 });
      expect(mockEventBus.emit).not.toHaveBeenCalled();
    });
  });

  describe("getOutboxMetrics", () => {
    it("delegates to WorkerDatabaseClient.getOutboxMetrics", async () => {
      const mockMetrics = {
        pending: 10,
        processing: 2,
        processed: 100,
        failed: 1,
        deadLetter: 3,
      };
      (WorkerDatabaseClient.getOutboxMetrics as jest.Mock).mockResolvedValue(mockMetrics);

      const result = await getOutboxMetrics();

      expect(result).toEqual(mockMetrics);
    });

    it("returns null on error", async () => {
      (WorkerDatabaseClient.getOutboxMetrics as jest.Mock).mockRejectedValue(
        new Error("Query failed"),
      );

      const result = await getOutboxMetrics();

      expect(result).toBeNull();
    });
  });
});
