-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING', 'PAUSED');

-- CreateEnum
CREATE TYPE "GabineteType" AS ENUM ('GABINETE', 'COMITE_CENTRAL', 'COMITE_REGIONAL', 'NUCLEO');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "CommitteeType" AS ENUM ('CENTRAL', 'REGIONAL', 'MUNICIPAL', 'NEIGHBORHOOD');

-- CreateEnum
CREATE TYPE "AdvisorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('PUBLIC_EVENT', 'INTERNAL_MEETING', 'INTERVIEW', 'VISIT', 'RECORDING', 'TRAVEL', 'OTHER');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('COMICIO', 'CARREATA', 'PASSEATA', 'REUNIAO', 'CAMINHADA', 'PANFLETAGEM', 'VISITA', 'GRAVACAO', 'ENTREVISTA', 'ENCONTRO_LIDERANCAS');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "InfluenceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "LeaderStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'POTENTIAL', 'LOST');

-- CreateEnum
CREATE TYPE "CrmPipelineStage" AS ENUM ('NEW_CONTACT', 'POTENTIAL_SUPPORTER', 'ACTIVE_LEADER', 'STRATEGIC_PARTNER', 'CONFIRMED_MOBILIZER');

-- CreateEnum
CREATE TYPE "DemandPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "DemandStatus" AS ENUM ('OPEN', 'ANALYZING', 'FORWARDED', 'RESOLVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TerritoryType" AS ENUM ('STATE', 'CITY', 'NEIGHBORHOOD', 'DISTRICT', 'ZONE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR', 'REMINDER');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('SYSTEM', 'EMAIL', 'WEBHOOK', 'WHATSAPP');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "logo" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "max_users" INTEGER NOT NULL,
    "max_committees" INTEGER NOT NULL,
    "max_actions_per_month" INTEGER NOT NULL,
    "max_storage_mb" INTEGER NOT NULL DEFAULT 1024,
    "premium_modules" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "features" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mfa_secret" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gabinete_units" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "GabineteType" NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "neighborhood" TEXT,
    "region" TEXT,
    "zip_code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "responsible_name" TEXT,
    "status" "UnitStatus" NOT NULL DEFAULT 'ACTIVE',
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "gabinete_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committees" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CommitteeType" NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "neighborhood" TEXT,
    "region" TEXT,
    "zip_code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "responsible_name" TEXT,
    "parent_id" TEXT,
    "status" "UnitStatus" NOT NULL DEFAULT 'ACTIVE',
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "committees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "committee_id" TEXT,
    "supervisor_name" TEXT,
    "status" "UnitStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "cpf" TEXT,
    "birth_date" TIMESTAMP(3),
    "gender" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "neighborhood" TEXT,
    "zip_code" TEXT,
    "occupation" TEXT,
    "notes" TEXT,
    "is_sensitive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advisors" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "team_id" TEXT,
    "role" TEXT,
    "specialty" TEXT,
    "status" "AdvisorStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "productivity" INTEGER DEFAULT 0,
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "advisors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photo" TEXT,
    "position" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "coalition" TEXT,
    "federation" TEXT,
    "municipality" TEXT,
    "state" TEXT,
    "bio" TEXT,
    "social_media" JSONB,
    "preferences" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "candidate_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ScheduleType" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "responsible_name" TEXT,
    "briefing" TEXT,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "participants" TEXT[],
    "checklist" JSONB,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "political_actions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ActionType" NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "location" TEXT,
    "responsible_id" TEXT,
    "candidate_id" TEXT,
    "committee_id" TEXT,
    "team_id" TEXT,
    "goal" TEXT,
    "estimated_public" INTEGER,
    "estimated_cost" DECIMAL(10,2),
    "actual_cost" DECIMAL(10,2),
    "materials" TEXT,
    "evidence" TEXT[],
    "post_report" TEXT,
    "status" "ActionStatus" NOT NULL DEFAULT 'PLANNED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "political_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "region" TEXT,
    "segment" TEXT,
    "influence_level" "InfluenceLevel" NOT NULL DEFAULT 'MEDIUM',
    "estimated_supporters" INTEGER,
    "last_contact_at" TIMESTAMP(3),
    "status" "LeaderStatus" NOT NULL DEFAULT 'ACTIVE',
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leaders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_stages" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "stage" "CrmPipelineStage" NOT NULL DEFAULT 'NEW_CONTACT',
    "next_follow_up" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_interactions" (
    "id" TEXT NOT NULL,
    "crm_stage_id" TEXT NOT NULL,
    "leader_id" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demands" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priority" "DemandPriority" NOT NULL DEFAULT 'MEDIUM',
    "origin" TEXT,
    "origin_detail" TEXT,
    "responsible_id" TEXT,
    "created_by_id" TEXT,
    "forwarded_to" TEXT,
    "status" "DemandStatus" NOT NULL DEFAULT 'OPEN',
    "deadline" TIMESTAMP(3),
    "response" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "region" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "demands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignee_id" TEXT,
    "created_by_id" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "due_date" TIMESTAMP(3),
    "checklist" JSONB,
    "comments" JSONB,
    "column" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "territories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TerritoryType" NOT NULL,
    "parent_id" TEXT,
    "coordinates" JSONB,
    "population" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "territories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'SYSTEM',
    "read_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "legal_basis" TEXT NOT NULL,
    "consented_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "proof_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_tenant_id_key" ON "subscriptions"("tenant_id");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenant_id_slug_key" ON "roles"("tenant_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_action_key" ON "permissions"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "gabinete_units_tenant_id_idx" ON "gabinete_units"("tenant_id");

-- CreateIndex
CREATE INDEX "committees_tenant_id_idx" ON "committees"("tenant_id");

-- CreateIndex
CREATE INDEX "teams_tenant_id_idx" ON "teams"("tenant_id");

-- CreateIndex
CREATE INDEX "people_tenant_id_idx" ON "people"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "advisors_person_id_key" ON "advisors"("person_id");

-- CreateIndex
CREATE INDEX "advisors_tenant_id_idx" ON "advisors"("tenant_id");

-- CreateIndex
CREATE INDEX "candidates_tenant_id_idx" ON "candidates"("tenant_id");

-- CreateIndex
CREATE INDEX "schedules_tenant_id_idx" ON "schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "schedules_tenant_id_start_date_idx" ON "schedules"("tenant_id", "start_date");

-- CreateIndex
CREATE INDEX "political_actions_tenant_id_idx" ON "political_actions"("tenant_id");

-- CreateIndex
CREATE INDEX "political_actions_tenant_id_type_idx" ON "political_actions"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "political_actions_tenant_id_start_date_idx" ON "political_actions"("tenant_id", "start_date");

-- CreateIndex
CREATE UNIQUE INDEX "leaders_person_id_key" ON "leaders"("person_id");

-- CreateIndex
CREATE INDEX "leaders_tenant_id_idx" ON "leaders"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_stages_person_id_key" ON "crm_stages"("person_id");

-- CreateIndex
CREATE INDEX "demands_tenant_id_idx" ON "demands"("tenant_id");

-- CreateIndex
CREATE INDEX "demands_tenant_id_status_idx" ON "demands"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_idx" ON "tasks"("tenant_id");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_status_idx" ON "tasks"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "territories_tenant_id_idx" ON "territories"("tenant_id");

-- CreateIndex
CREATE INDEX "attachments_tenant_id_entity_type_entity_id_idx" ON "attachments"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "notes_tenant_id_entity_type_entity_id_idx" ON "notes"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "tags_tenant_id_idx" ON "tags"("tenant_id");

-- CreateIndex
CREATE INDEX "notifications_tenant_id_user_id_idx" ON "notifications"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_entity_type_idx" ON "audit_logs"("tenant_id", "entity_type");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "consents_tenant_id_entity_type_entity_id_idx" ON "consents"("tenant_id", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_settings_tenant_id_key_key" ON "tenant_settings"("tenant_id", "key");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gabinete_units" ADD CONSTRAINT "gabinete_units_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "committees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committees" ADD CONSTRAINT "committees_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_committee_id_fkey" FOREIGN KEY ("committee_id") REFERENCES "committees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisors" ADD CONSTRAINT "advisors_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisors" ADD CONSTRAINT "advisors_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advisors" ADD CONSTRAINT "advisors_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "political_actions" ADD CONSTRAINT "political_actions_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "political_actions" ADD CONSTRAINT "political_actions_committee_id_fkey" FOREIGN KEY ("committee_id") REFERENCES "committees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "political_actions" ADD CONSTRAINT "political_actions_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "political_actions" ADD CONSTRAINT "political_actions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "political_actions" ADD CONSTRAINT "political_actions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaders" ADD CONSTRAINT "leaders_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaders" ADD CONSTRAINT "leaders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_stages" ADD CONSTRAINT "crm_stages_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_crm_stage_id_fkey" FOREIGN KEY ("crm_stage_id") REFERENCES "crm_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_interactions" ADD CONSTRAINT "crm_interactions_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "leaders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demands" ADD CONSTRAINT "demands_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demands" ADD CONSTRAINT "demands_responsible_id_fkey" FOREIGN KEY ("responsible_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demands" ADD CONSTRAINT "demands_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "territories" ADD CONSTRAINT "territories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "territories" ADD CONSTRAINT "territories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
