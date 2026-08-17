/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `token_blacklist` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "playlists" ADD COLUMN     "is_private" BOOLEAN DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "token_blacklist_token_key" ON "token_blacklist"("token");
