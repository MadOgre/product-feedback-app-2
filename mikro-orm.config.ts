import { defineConfig } from "@mikro-orm/postgresql";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";

export default defineConfig({
  contextName: "default",
  dbName: "pfa",
  user: "pfa",
  host: "localhost",
  entities: ["./database/models/**/*.ts"],
  entitiesTs: ["./database/models/**/*.ts"],
  metadataProvider: TsMorphMetadataProvider,
  migrations: {
    path: "./database/migrations",
  },
});
