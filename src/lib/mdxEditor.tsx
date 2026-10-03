import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CodeToggle,
  CreateLink,
  DiffSourceToggleWrapper,
  InsertCodeBlock,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  Separator,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

const CODE_LANGUAGES = {
  '': 'Plain text',
  js: 'JavaScript',
  ts: 'TypeScript',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  python: 'Python',
  bash: 'Bash',
} as const;

/** Structural plugins shared by editor + read-only viewer. */
const basePlugins = [
  headingsPlugin(),
  listsPlugin(),
  quotePlugin(),
  thematicBreakPlugin(),
  markdownShortcutPlugin(),
  tablePlugin(),
  codeBlockPlugin({ defaultCodeBlockLanguage: '' }),
  codeMirrorPlugin({ codeBlockLanguages: { ...CODE_LANGUAGES } }),
  linkPlugin(),
  linkDialogPlugin(),
  imagePlugin(),
];

/**
 * Rich-text composer for announcements. `initialValue` is initial-only
 * (per MDXEditor docs) — remount with `key` to clear after publish.
 * `onChange` streams markdown one-way; never feed it back into `markdown`.
 *
 * Images are URL-only (dialog prompt) — cover art stays on the UploadButton
 * so no base64 blobs ever land in the database.
 */
export const NewsEditor = ({
  initialValue = '',
  onChange,
}: {
  initialValue?: string;
  onChange: (markdown: string) => void;
}) => (
  <MDXEditor
    markdown={initialValue}
    onChange={onChange}
    className="mdx-news-editor"
    contentEditableClassName="mdx-news-content"
    plugins={[
      ...basePlugins,
      diffSourcePlugin({ viewMode: 'rich-text' }),
      toolbarPlugin({
        toolbarContents: () => (
          <DiffSourceToggleWrapper>
            <UndoRedo />
            <Separator />
            <BoldItalicUnderlineToggles />
            <CodeToggle />
            <Separator />
            <ListsToggle />
            <BlockTypeSelect />
            <Separator />
            <CreateLink />
            <InsertImage />
            <Separator />
            <InsertTable />
            <InsertCodeBlock />
            <InsertThematicBreak />
          </DiffSourceToggleWrapper>
        ),
      }),
    ]}
  />
);

/** Read-only renderer for announcement bodies on the public site. */
export const NewsContent = ({ markdown }: { markdown: string }) => (
  <MDXEditor
    markdown={markdown}
    readOnly
    className="mdx-news-viewer"
    contentEditableClassName="mdx-news-content"
    plugins={basePlugins}
  />
);
