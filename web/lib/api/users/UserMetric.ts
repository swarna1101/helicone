import { useUsers } from "@/services/hooks/users";

type NotNullOrUndefined<T> = T extends null | undefined ? never : T;

export type UserMetric = NotNullOrUndefined<
  NotNullOrUndefined<
    Awaited<ReturnType<typeof useUsers>>["userMetrics"]["data"]
  >
>["users"][number];
