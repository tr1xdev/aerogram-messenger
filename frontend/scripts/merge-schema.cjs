const { mergeTypeDefs } = require("@graphql-tools/merge");
const { loadFilesSync } = require("@graphql-tools/load-files");
const { print } = require("graphql");
const fs = require("fs");
const path = require("path");

const schemasPath = path.join(
  __dirname,
  "../../backend/internal/graph/schemas",
);

try {
  const typesArray = loadFilesSync(schemasPath, {
    extensions: ["graphqls", "graphql"],
  });
  const mergedSchema = mergeTypeDefs(typesArray);
  const printedSchema = print(mergedSchema);

  fs.writeFileSync(path.join(__dirname, "../schema.graphql"), printedSchema);
  console.log("✅ Schema merged");
} catch (error) {
  console.error("❌ Error:", error);
  process.exit(1);
}
