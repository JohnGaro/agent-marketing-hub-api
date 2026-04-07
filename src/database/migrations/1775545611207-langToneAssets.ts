import { MigrationInterface, QueryRunner } from 'typeorm';

export class LangToneAssets1775545611207 implements MigrationInterface {
  name = 'LangToneAssets1775545611207';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "listing" DROP CONSTRAINT "FK_9c774e38e499ebb5128d99e0e72"`,
    );
    await queryRunner.query(`ALTER TABLE "listing" DROP COLUMN "agentUuid"`);
    await queryRunner.query(`TRUNCATE TABLE "agents"`);
    await queryRunner.query(`DROP TABLE "agents"`);
    await queryRunner.query(`ALTER TABLE "generated_assets" ADD "tone" text`);
    await queryRunner.query(`ALTER TABLE "generated_assets" ADD "lang" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "generated_assets" DROP COLUMN "lang"`,
    );
    await queryRunner.query(
      `ALTER TABLE "generated_assets" DROP COLUMN "tone"`,
    );
    await queryRunner.query(
      `CREATE TABLE "agents" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "fullName" character varying(255) NOT NULL, "phone" character varying(50), "agencyName" character varying(255), "avatarUrl" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5fdef501c63984b1b98abb1e68c" UNIQUE ("email"), CONSTRAINT "PK_c0ab05964eedadbce716671b9b1" PRIMARY KEY ("uuid"))`,
    );
    await queryRunner.query(`ALTER TABLE "listing" ADD "agentUuid" uuid`);
    await queryRunner.query(
      `ALTER TABLE "listing" ADD CONSTRAINT "FK_9c774e38e499ebb5128d99e0e72" FOREIGN KEY ("agentUuid") REFERENCES "agents"("uuid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
