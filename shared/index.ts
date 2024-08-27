import z from "zod";

export const zCoso = z.object({
  text: z.string(),
  backgroundColor: z.string(),
  x: z.number(),
  y: z.number(),
});

export type Coso = z.infer<typeof zCoso>;

export const zState = z.object({
  cosos: z.array(zCoso),
});

export const zServerMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("baseState"), state: zState }),
  z.object({ type: z.literal("newCoso"), coso: zCoso }),
]);

export type ServerMessage = z.infer<typeof zServerMessage>;

export const zClientMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("createdCoso"), coso: zCoso }),
]);

export type ClientMessage = z.infer<typeof zClientMessage>;
