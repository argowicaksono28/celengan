// Server-Sent Events broadcaster
// In production, use Redis pub/sub. For MVP, use in-memory Map.

type SSEClient = {
  userId: string;
  controller: ReadableStreamDefaultController;
};

const clients = new Map<string, SSEClient[]>();

export function addSSEClient(userId: string, controller: ReadableStreamDefaultController) {
  const existing = clients.get(userId) ?? [];
  clients.set(userId, [...existing, { userId, controller }]);
}

export function removeSSEClient(userId: string, controller: ReadableStreamDefaultController) {
  const existing = clients.get(userId) ?? [];
  clients.set(
    userId,
    existing.filter((c) => c.controller !== controller)
  );
}

export function broadcastToUser(userId: string, event: string, data: unknown) {
  const userClients = clients.get(userId) ?? [];
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const client of userClients) {
    try {
      client.controller.enqueue(new TextEncoder().encode(payload));
    } catch {
      // Client disconnected
    }
  }
}

export function broadcastTransaction(userId: string, transaction: unknown) {
  broadcastToUser(userId, "transaction", transaction);
}

export function broadcastBudgetAlert(userId: string, alert: unknown) {
  broadcastToUser(userId, "budget_alert", alert);
}
