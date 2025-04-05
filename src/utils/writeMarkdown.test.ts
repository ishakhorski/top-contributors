import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import * as fs from "fs";
import * as path from "path";

import { writeMarkdown } from "./writeMarkdown";

describe("writeMarkdown", () => {
  vi.mock("fs");
  vi.mock("path");

  const mockDir = "/mock/dir";
  const mockPath = "/mock/dir/file.md";
  const mockContent = "# Test Markdown";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(path.dirname).mockReturnValue(mockDir);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates directory if it does not exist", () => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(false);

    writeMarkdown(mockPath, mockContent);

    expect(fs.mkdirSync).toHaveBeenCalledWith(mockDir, { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(mockPath, mockContent);
  });

  it("writes content to file when directory exists", () => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(true);

    writeMarkdown(mockPath, mockContent);

    expect(fs.mkdirSync).not.toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledWith(mockPath, mockContent);
  });

  it("updates content between markers when file exists", () => {
    const markers = {
      marker_start: "<!-- START_SECTION -->",
      marker_end: "<!-- END_SECTION -->",
    };
    const markdown = `# Test Markdown`;

    const existingContent = `
# Existing Content
${markers.marker_start}
old content
${markers.marker_end}
## More content
`;

    const expectedContent = `
# Existing Content
${markers.marker_start}
# Test Markdown
${markers.marker_end}
## More content
`;

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValueOnce(existingContent);

    writeMarkdown(mockPath, markdown, markers);

    expect(fs.writeFileSync).toHaveBeenCalledWith(mockPath, expectedContent);
  });

  it("correctly handles markers with no content between them", () => {
    const markers = {
      marker_start: "<!-- START_SECTION -->",
      marker_end: "<!-- END_SECTION -->",
    };

    const existingContent = `# Header\n${markers.marker_start}${markers.marker_end}\n# Footer`;
    const expectedContent = `# Header\n${markers.marker_start}\n# Test Markdown\n${markers.marker_end}\n# Footer`;

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValueOnce(existingContent);

    writeMarkdown(mockPath, mockContent, markers);

    expect(fs.writeFileSync).toHaveBeenCalledWith(mockPath, expectedContent);
  });

  it("throws error when start marker is not found", () => {
    const markers = {
      marker_start: "<!-- START_SECTION -->",
      marker_end: "<!-- END_SECTION -->",
    };

    const existingContent = "# Content without markers";

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValueOnce(existingContent);

    expect(() => writeMarkdown(mockPath, mockContent, markers)).toThrow(
      `Markers not found in the file: ${mockPath}. Please check the markers.`,
    );
  });

  it("throws error when end marker is not found", () => {
    const markers = {
      marker_start: "<!-- START_SECTION -->",
      marker_end: "<!-- END_SECTION -->",
    };

    const existingContent = `# Only start marker\n${markers.marker_start}\nSome content`;

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValueOnce(existingContent);

    expect(() => writeMarkdown(mockPath, mockContent, markers)).toThrow(
      `Markers not found in the file: ${mockPath}. Please check the markers.`,
    );
  });

  it("throws error when start marker appears after end marker", () => {
    const markers = {
      marker_start: "<!-- START_SECTION -->",
      marker_end: "<!-- END_SECTION -->",
    };

    const existingContent = `
# Bad order
${markers.marker_end}
Some content
${markers.marker_start}
`;

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValueOnce(existingContent);

    expect(() => writeMarkdown(mockPath, mockContent, markers)).toThrow(
      `Start marker appears after end marker in the file: ${mockPath}. Please check the marker order.`,
    );
  });

  it("throws error when markers are provided but file does not exist", () => {
    const markers = {
      marker_start: "<!-- START_SECTION -->",
      marker_end: "<!-- END_SECTION -->",
    };

    vi.mocked(fs.existsSync).mockReturnValue(false);

    expect(() => writeMarkdown(mockPath, mockContent, markers)).toThrow(
      `File does not exist: ${mockPath}`,
    );
  });

  it("passes through any fs errors", () => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(false);
    vi.mocked(fs.mkdirSync).mockImplementationOnce(() => {
      throw new Error("Permission denied");
    });

    expect(() => writeMarkdown(mockPath, mockContent)).toThrow(
      "Permission denied",
    );
  });
});
