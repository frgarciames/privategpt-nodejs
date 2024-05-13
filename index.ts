import { PrivategptApiClient } from "privategpt-sdk-node";
import fs from "fs";

const client = new PrivategptApiClient({
  environment: "http://localhost:8001",
});

async function start() {
  // Health
  console.log(await client.health.health());

  // Sync completion
  console.log("Sync completion");
  console.log(
    (
      await client.contextualCompletions.promptCompletion({
        prompt: "Answer with just the result: 2+2",
      })
    ).choices[0].message?.content
  );

  //  Async completion
  console.log("\n>Async completion");
  const stream = await client.contextualCompletions.promptCompletionStream({
    prompt: "Answer with the result: 2+2 and explanation",
  });
  for await (const chunk of stream) {
    // Print  content in an incremental way
    if (chunk) {
      console.log("content:", chunk?.choices[0]?.delta?.content);
    }
  }

  //
  //  Sync chat completion
  console.log("\n\n>Sync chat completion");
  console.log(
    (
      await client.contextualCompletions.chatCompletion({
        messages: [{ role: "user", content: "Answer with just the result: 2+2" }],
      })
    ).choices?.[0]?.message?.content
  );

  // // Embeddings
  console.log("\n\n>Sync embeddings");
  console.log(
    (await client.embeddings.embeddingsGeneration({ input: "Hello world" }))
      .data[0].embedding
  );
  //
  // Ingestion of text
  console.log("\n>Ingestion of text");
  const text_to_ingest = `
    "Books bombarded his shoulder, his arms, his upturned face.  A book "
    "lit, almost obediently, like a white pigeon, in his hands, "
    "wings fluttering.  In the dim, wavering light, a page hung open "
    "and it was like a snowy feather, the words delicately painted "
    "thereon.  In all the rush and fervor, Montage had only an instant "
    "to read a line, but it blazed in his mind for the next minute as "
    "if stamped there with fiery steel.  “Time has fallen asleep in the "
    "afternoon sunshine.”  He dropped the book.  Immediately, another "
    "fell into his arms.”"
`;

  const ingested_text_doc_id = (
    await client.ingestion.ingestText({
      fileName: "Fahrenheit 451",
      text: text_to_ingest,
    })
  ).data[0].docId;

  console.log("Ingested text doc id: ", ingested_text_doc_id);

  // Ingestion of file
  console.log("\n>Ingestion of file");
  const buffer = fs.readFileSync("test_file.txt");
  const file = new File([buffer], "test_file.txt");
  const ingestedFile = await client.ingestion.ingestFile(file);
  const ingested_file_doc_id = ingestedFile.data[0].docId;

  console.log("Ingested file doc id: ", ingested_file_doc_id);

  console.log("\n>List ingested documents");

  for (const doc of (await client.ingestion.listIngested()).data) {
    console.log(doc.docId);
  }

  // // Chunks
  console.log("\n>Find related chunks:");
  console.log(
    (await client.contextChunks.chunksRetrieval({ text: "Pigeon fluttering" }))
      .data[0].text
  );

  // // Contextual completion
  console.log("\n>Contextual completion:");
  const result = (
    await client.contextualCompletions.promptCompletion({
      prompt: "What did Montage do?",
      useContext: true,
      contextFilter: { docsIds: [ingested_file_doc_id] },
      includeSources: true,
    })
  ).choices[0];
  console.log(result?.message?.content);

  console.log(` # Source: ${result?.sources?.[0]?.document?.docMetadata?.file_name}`);

  // // Deletion of ingested document
  console.log("\n>Deletion of ingested document");
  await client.ingestion.deleteIngested(ingested_file_doc_id);
  console.log("\nDeletion done");
}

start();




