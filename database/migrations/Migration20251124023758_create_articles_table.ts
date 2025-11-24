import { Migration } from '@mikro-orm/migrations';

export class Migration20251124023758_create_articles_table extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "Articles" ("id" serial primary key, "title" varchar(255) null, "author" varchar(255) null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null, "text4" varchar(255) null);`);
  }

}
