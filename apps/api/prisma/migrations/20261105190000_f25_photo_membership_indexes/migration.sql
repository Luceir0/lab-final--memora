-- F25 query indexes agreed with F23.
-- Photo(circleId) is replaced by the wider (circleId, createdAt, id) index:
-- the old one is a redundant prefix and would only add write cost.
DROP INDEX "Photo_circleId_idx";

CREATE INDEX "Photo_circleId_createdAt_id_idx" ON "Photo"("circleId", "createdAt", "id");

CREATE INDEX "Membership_circleId_joinedAt_idx" ON "Membership"("circleId", "joinedAt");
