CREATE TABLE "stage_xp_grants" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "stage_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stage_xp_grants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stage_xp_grants_user_id_stage_id_key"
    ON "stage_xp_grants"("user_id", "stage_id");
CREATE INDEX "stage_xp_grants_user_id_created_at_idx"
    ON "stage_xp_grants"("user_id", "created_at");
ALTER TABLE "stage_xp_grants"
    ADD CONSTRAINT "stage_xp_grants_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill each stage with an earlier accepted submission exactly once.
-- Deterministic UUIDs plus the unique user/stage index keep this safe if rerun.
WITH stage_completions AS (
    SELECT DISTINCT s."user_id",
        CASE c."slug"
            WHEN 'maximum-sum-k-consecutive-crystals' THEN 'greenhouse-maximum-crystal-energy'
            WHEN 'reliable-crystal-windows' THEN 'greenhouse-reliable-power-windows'
            WHEN 'minimum-crystal-burst' THEN 'greenhouse-short-crystal-burst'
            WHEN 'longest-crystal-budget' THEN 'greenhouse-keep-vines-warm'
        END AS stage_id,
        CASE c."slug"
            WHEN 'maximum-sum-k-consecutive-crystals' THEN 100
            WHEN 'reliable-crystal-windows' THEN 125
            WHEN 'minimum-crystal-burst' THEN 175
            WHEN 'longest-crystal-budget' THEN 200
        END AS amount
    FROM "submissions" s
    JOIN "challenges" c ON c."id" = s."challenge_id"
    WHERE s."status" = 'ACCEPTED'
      AND c."slug" IN ('maximum-sum-k-consecutive-crystals', 'reliable-crystal-windows', 'minimum-crystal-burst', 'longest-crystal-budget')
), inserted_grants AS (
    INSERT INTO "stage_xp_grants" ("id", "user_id", "stage_id", "amount", "created_at")
    SELECT md5("user_id"::text || stage_id)::uuid, "user_id", stage_id, amount, CURRENT_TIMESTAMP
    FROM stage_completions
    ON CONFLICT ("user_id", "stage_id") DO NOTHING
    RETURNING "user_id", "amount"
), xp_by_user AS (
    SELECT "user_id", SUM("amount")::INTEGER AS amount
    FROM inserted_grants
    GROUP BY "user_id"
)
UPDATE "users" u
SET "xp" = u."xp" + xp_by_user.amount,
    "updated_at" = CURRENT_TIMESTAMP
FROM xp_by_user
WHERE u."id" = xp_by_user."user_id";
