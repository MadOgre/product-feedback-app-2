import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'Articles' })
export class Articles {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  title?: string;

  @Property({ nullable: true })
  author?: string;

  @Property({ fieldName: 'createdAt' })
  createdAt!: Date;

  @Property({ fieldName: 'updatedAt' })
  updatedAt!: Date;

  @Property({ nullable: true })
  text4?: string;

}
