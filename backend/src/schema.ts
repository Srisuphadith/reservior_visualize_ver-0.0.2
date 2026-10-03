import { Type, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const NullableNumber = Type.Union([Type.Number(), Type.Null()]);

/** One reservoir record exactly as RID returns it. */
export const RidReservoir = Type.Object({
  id: Type.String({ minLength: 1 }),
  name: Type.String(),
  storage: Type.Number(),
  dead_storage: Type.Number(),
  volume: NullableNumber,
  percent_storage: NullableNumber,
  inflow: NullableNumber,
  outflow: NullableNumber,
});
export type RidReservoir = Static<typeof RidReservoir>;

/** Envelope is validated strictly; records are validated one by one so a bad row is skipped, not fatal. */
export const RidResponse = Type.Object({
  date: Type.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
  total: Type.Optional(Type.Number()),
  data: Type.Array(
    Type.Object({
      region: Type.String({ minLength: 1 }),
      reservoir: Type.Array(Type.Unknown()),
    }),
  ),
});
export type RidResponse = Static<typeof RidResponse>;

export function isRidResponse(value: unknown): value is RidResponse {
  return Value.Check(RidResponse, value);
}

export function isRidReservoir(value: unknown): value is RidReservoir {
  return Value.Check(RidReservoir, value);
}
