import { Client } from "@notionhq/client";
import { config } from "dotenv";
config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// const database_id = "81dd715531a34aa89063179bc427b0b6";
const database_id = "e5b15ef7ef9b4963b0a40b6d6d2d87a9";

export async function createTranscriptEntry(transcript: {
  title: string;
  category?: string;
}) {
  const properties = {
    Name: {
      title: [
        {
          text: {
            content: transcript.title,
          },
        },
      ],
    },
    category: {
      select: {
        name: transcript.category,
      },
    },
  };

  if (!transcript.category) delete properties.category;

  return notion.pages.create({
    parent: {
      database_id,
    },
    properties,
  });
}

export async function deleteTranscriptEntry(block_id: string) {
  if (!block_id.match(/[a-zA-Z]/g)) return null;

  const page = await notion.blocks.children.list({
    block_id,
  });

  if (page.results.length) return null;
  return notion.blocks.delete({
    block_id,
  });
}

export async function createTranscriptNotion({
  block_id,
  htmlString,
}: {
  block_id: string;
  htmlString: string;
}) {
  if (!block_id.match(/[a-zA-Z]/g)) return null;
  const children = [];
  if (htmlString) {
    children.push({
      object: "block",
      type: "code",
      code: {
        rich_text: [],
        language: "html",
      },
    });
    for (let i = 0; i < htmlString.length; i += 2000) {
      children[0].code.rich_text.push({
        type: "text",
        text: { content: htmlString.substring(i, i + 2000) },
      });
    }
  }

  return notion.blocks.children.append({
    block_id,
    children,
  });
}
