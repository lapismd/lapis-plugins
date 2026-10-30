import * as yaml from "js-yaml";

export const DEFAULT_ELEMENT_ATTRIBUTES_SEPARATOR = "\\.element\\s*?(.+?)$";
export const DEFAULT_NOTES_SEPARATOR = "^\\s*notes?:";
export const DEFAULT_SLIDE_ATTRIBUTES_SEPARATOR = "\\.slide:\\s*?(\\S.+?)$";

export type Section = { start: number; end: number; level: number };

export type SectionTreeNode = {
  content: string;
  section: Section;
  notes: string;
  children: SectionTreeNode[];
};

export function extractFrontMatter(
  content: string,
): [string, Record<string, unknown>] {
  try {
    const matches = content.match(/^-{3}\s*[\n\r](.*?)[\n\r]-{3}\s*[\n\r]+/s);
    if (!matches) {
      return [content, {}];
    }

    const parsed = yaml.load(matches[1], {
      schema: yaml.FAILSAFE_SCHEMA,
    });
    const markdown = content.substring(matches[0].length);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return [markdown, parsed as Record<string, unknown>];
    }

    return [markdown, {}];
  } catch {
    return [content, {}];
  }
}

export function extractSections(content: string): Section[] {
  const regexp = /\r?\n\r?\n([-]{3,})\r?\n\r?\n/g;
  let match: RegExpExecArray | null;
  const sections: Array<Section> = [{ start: 0, end: -1, level: 1 }];

  while ((match = regexp.exec(content)) !== null) {
    sections[sections.length - 1].end = match.index;
    sections.push({
      start: regexp.lastIndex,
      end: -1,
      level: Math.min(match[1].length - 2, 2),
    });
  }

  sections[sections.length - 1].end = content.length;
  return sections;
}

export function countSections(sections: SectionTreeNode[]): number {
  return sections.reduce(
    (total, section) => total + 1 + countSections(section.children),
    0,
  );
}

function extractNotes(content: string): [string, string] {
  let notesMatch = content.split(new RegExp(DEFAULT_NOTES_SEPARATOR, "mgi"));
  if (notesMatch.length === 2) {
    return [notesMatch[0], notesMatch[1].trim()];
  }

  notesMatch = content.split(/^>\[!notes?\]:/gim);
  if (notesMatch.length === 2) {
    return [notesMatch[0], ">" + notesMatch[1].trim()];
  }

  return [content, ""];
}

export function buildTree(content: string): SectionTreeNode[] {
  const sections = extractSections(content);
  const result: SectionTreeNode[] = [];
  const stack: SectionTreeNode[] = [];

  for (const section of sections) {
    const [value, notes] = extractNotes(
      content.substring(section.start, section.end),
    );
    const node: SectionTreeNode = {
      content: value,
      section,
      notes,
      children: [],
    };

    while (
      stack.length > 0 &&
      stack[stack.length - 1].section.level >= section.level
    ) {
      stack.pop();
    }

    if (stack.length === 0) {
      result.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return result;
}

function schedule(callback: () => void): void {
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => callback());
    return;
  }

  setTimeout(callback, 0);
}

export function useSlide(el: Element, _section?: SectionTreeNode) {
  const applyAttributes = () => {
    addAttributes(
      el,
      el,
      null,
      DEFAULT_ELEMENT_ATTRIBUTES_SEPARATOR,
      DEFAULT_SLIDE_ATTRIBUTES_SEPARATOR,
    );
  };

  schedule(applyAttributes);

  return {
    update() {
      schedule(applyAttributes);
    },
  };
}

function addAttributeInNode(
  node: Node,
  elementTarget: Element,
  separator: string,
): boolean {
  const markdownClassesInElementsRegex = new RegExp(separator, "mg");
  const markdownClassRegex = new RegExp(
    '([^"= ]+?)="([^"]+?)"|(data-[^"= ]+?)(?=[" ])',
    "mg",
  );
  let nodeValue = node.nodeValue || "";
  let matches: RegExpExecArray | null;
  let attributeMatch: RegExpExecArray | null;

  matches = markdownClassesInElementsRegex.exec(nodeValue);
  if (!matches) {
    return false;
  }

  const classes = matches[1];
  nodeValue =
    nodeValue.substring(0, matches.index) +
    nodeValue.substring(markdownClassesInElementsRegex.lastIndex);
  node.nodeValue = nodeValue;

  while ((attributeMatch = markdownClassRegex.exec(classes))) {
    if (attributeMatch[2]) {
      elementTarget.setAttribute(attributeMatch[1], attributeMatch[2]);
    } else {
      elementTarget.setAttribute(attributeMatch[3], "");
    }
  }

  return true;
}

export function addAttributes(
  section: Element,
  element: Element,
  previousElement: Element | null,
  separatorElementAttributes: string,
  separatorSectionAttributes: string,
): void {
  if (element.childNodes && element.childNodes.length > 0) {
    let previousParentElement: Element = element;
    for (let index = 0; index < element.childNodes.length; index += 1) {
      const childNode = element.childNodes[index];
      if (index > 0) {
        let previousIndex = index - 1;
        while (previousIndex >= 0) {
          const previousChild = element.childNodes[previousIndex];
          if (
            previousChild instanceof Element &&
            typeof previousChild.setAttribute === "function" &&
            previousChild.tagName !== "BR"
          ) {
            previousParentElement = previousChild;
            break;
          }
          previousIndex -= 1;
        }
      }

      let parentSection = section;
      if (childNode instanceof Element && childNode.nodeName === "SECTION") {
        parentSection = childNode;
        previousParentElement = childNode;
      }

      if (
        childNode instanceof Element ||
        childNode.nodeType === Node.COMMENT_NODE
      ) {
        addAttributes(
          parentSection,
          childNode as Element,
          previousParentElement,
          separatorElementAttributes,
          separatorSectionAttributes,
        );
      }
    }
  }

  if (element.nodeType === Node.COMMENT_NODE && previousElement) {
    if (
      addAttributeInNode(
        element,
        previousElement,
        separatorElementAttributes,
      ) === false
    ) {
      addAttributeInNode(element, section, separatorSectionAttributes);
    }
  }
}
