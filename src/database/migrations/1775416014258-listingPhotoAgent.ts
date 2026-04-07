import { MigrationInterface, QueryRunner } from 'typeorm';

export class ListingPhotoAgent1775416014258 implements MigrationInterface {
  name = 'ListingPhotoAgent1775416014258';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."prompt_templates_type_enum" AS ENUM('enhance', 'portal', 'instagram', 'facebook', 'whatsapp')`,
    );
    await queryRunner.query(
      `CREATE TABLE "prompt_templates" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."prompt_templates_type_enum" NOT NULL, "template" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fd8b6d3bef2d28b10ef25c64b0d" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "listing_photo" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "caption" text, "position" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "listingUuid" uuid, CONSTRAINT "PK_c27bab31ca5d00cd63d301d95e7" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."generated_assets_platform_enum" AS ENUM('portal', 'instagram', 'facebook', 'whatsapp')`,
    );
    await queryRunner.query(
      `CREATE TABLE "generated_assets" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "platform" "public"."generated_assets_platform_enum" NOT NULL, "content" text NOT NULL, "version" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "listingUuid" uuid, CONSTRAINT "PK_a81de4cf6a9f330810626559980" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "agents" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "fullName" character varying(255) NOT NULL, "phone" character varying(50), "agencyName" character varying(255), "avatarUrl" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5fdef501c63984b1b98abb1e68c" UNIQUE ("email"), CONSTRAINT "PK_c0ab05964eedadbce716671b9b1" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."listing_propertytype_enum" AS ENUM('apartment', 'house', 'studio', 'loft', 'villa')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."listing_orientation_enum" AS ENUM('south', 'north', 'east', 'west')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."listing_energyclass_enum" AS ENUM('A', 'B', 'C', 'D', 'E', 'F', 'G')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."listing_condition_enum" AS ENUM('new', 'excellent', 'to_refresh', 'to_renovate')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."listing_heatingtype_enum" AS ENUM('individual_gas', 'collective_gas', 'electric', 'heat_pump', 'geothermal')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."listing_status_enum" AS ENUM('draft', 'enhanced', 'published')`,
    );
    await queryRunner.query(
      `CREATE TABLE "listing" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "propertyType" "public"."listing_propertytype_enum" NOT NULL, "address" character varying NOT NULL, "neighborhood" character varying, "price" numeric(12,2) NOT NULL, "surface" numeric(10,2) NOT NULL, "rooms" integer NOT NULL, "bedrooms" integer NOT NULL, "bathrooms" integer NOT NULL, "floor" character varying, "orientation" "public"."listing_orientation_enum", "hasElevator" boolean NOT NULL DEFAULT false, "hasBalcony" boolean NOT NULL DEFAULT false, "balconySurface" numeric(10,2), "hasGarden" boolean NOT NULL DEFAULT false, "gardenSurface" numeric(10,2), "energyClass" "public"."listing_energyclass_enum", "condition" "public"."listing_condition_enum", "heatingType" "public"."listing_heatingtype_enum", "description" text, "improvements" text, "notes" text, "status" "public"."listing_status_enum" NOT NULL DEFAULT 'draft', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "agentUuid" uuid, CONSTRAINT "PK_29d3d859ac95797eec6bb3aa471" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_photo" ADD CONSTRAINT "FK_fd2379c799c06bf40c689849bff" FOREIGN KEY ("listingUuid") REFERENCES "listing"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "generated_assets" ADD CONSTRAINT "FK_a10f94b0755df5a462159718922" FOREIGN KEY ("listingUuid") REFERENCES "listing"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing" ADD CONSTRAINT "FK_9c774e38e499ebb5128d99e0e72" FOREIGN KEY ("agentUuid") REFERENCES "agents"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "listing" DROP CONSTRAINT "FK_9c774e38e499ebb5128d99e0e72"`,
    );
    await queryRunner.query(
      `ALTER TABLE "generated_assets" DROP CONSTRAINT "FK_a10f94b0755df5a462159718922"`,
    );
    await queryRunner.query(
      `ALTER TABLE "listing_photo" DROP CONSTRAINT "FK_fd2379c799c06bf40c689849bff"`,
    );
    await queryRunner.query(`DROP TABLE "listing"`);
    await queryRunner.query(`DROP TYPE "public"."listing_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."listing_heatingtype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."listing_condition_enum"`);
    await queryRunner.query(`DROP TYPE "public"."listing_energyclass_enum"`);
    await queryRunner.query(`DROP TYPE "public"."listing_orientation_enum"`);
    await queryRunner.query(`DROP TYPE "public"."listing_propertytype_enum"`);
    await queryRunner.query(`DROP TABLE "agents"`);
    await queryRunner.query(`DROP TABLE "generated_assets"`);
    await queryRunner.query(
      `DROP TYPE "public"."generated_assets_platform_enum"`,
    );
    await queryRunner.query(`DROP TABLE "listing_photo"`);
    await queryRunner.query(`DROP TABLE "prompt_templates"`);
    await queryRunner.query(`DROP TYPE "public"."prompt_templates_type_enum"`);
  }
}
