CREATE TABLE "maintenance_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"date" text NOT NULL,
	"mileage" integer,
	"label" text NOT NULL,
	"cost" integer,
	"kind" text DEFAULT 'invoice' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packs" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"email" text NOT NULL,
	"offer" text NOT NULL,
	"credits_total" integer NOT NULL,
	"credits_used" integer DEFAULT 0 NOT NULL,
	"stripe_session_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "packs_code_unique" UNIQUE("code"),
	CONSTRAINT "packs_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE TABLE "provider_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"share_token" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"input_kind" text NOT NULL,
	"input_value" text NOT NULL,
	"country" text DEFAULT 'FR' NOT NULL,
	"mileage" integer,
	"holder_name" text,
	"formula_number" text,
	"first_reg_date" text,
	"listing_url" text,
	"listing_price" integer,
	"email" text,
	"offer" text DEFAULT 'single' NOT NULL,
	"pack_id" text,
	"vehicle" jsonb,
	"report" jsonb,
	"score" text,
	"stripe_session_id" text,
	"paid_at" timestamp with time zone,
	"ready_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reports_share_token_unique" UNIQUE("share_token"),
	CONSTRAINT "reports_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
ALTER TABLE "maintenance_entries" ADD CONSTRAINT "maintenance_entries_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;