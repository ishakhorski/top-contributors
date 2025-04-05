import * as fs from "fs";
import * as path from "path";

export const writeMarkdown = (
  output: string,
  markdown: string,
  markers?: { marker_start: string; marker_end: string },
) => {
  try {
    const dir = path.dirname(output);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let fileContent = "";
    let finalContent = markdown;

    if (markers?.marker_start && markers?.marker_end && fs.existsSync(output)) {
      fileContent = fs.readFileSync(output, "utf8");

      const startIndex = fileContent.indexOf(markers.marker_start);
      const endIndex = fileContent.indexOf(markers.marker_end);

      if (startIndex === -1 || endIndex === -1) {
        throw new Error(
          `Markers not found in the file: ${output}. Please check the markers.`,
        );
      }

      if (startIndex > endIndex) {
        throw new Error(
          `Start marker appears after end marker in the file: ${output}. Please check the markers.`,
        );
      }

      finalContent =
        fileContent.substring(0, startIndex + markers.marker_start.length) +
        markdown +
        fileContent.substring(endIndex);
    }

    fs.writeFileSync(output, finalContent);
  } catch (err) {
    throw err;
  }
};
