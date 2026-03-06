import React, { useMemo } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

import { ParagraphNode, TextNode } from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';

import { getSharedDoc, getSharedProvider } from '../utils/collaboration';

export default function Editor({ uniqueId }) {
  const initialConfig = useMemo(() => ({
    namespace: 'Crousia',
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      ParagraphNode,
      TextNode,
      LinkNode
    ],
    onError: (e) => console.error('Lexical Error:', e),
  }), []);

  const providerFactory = useMemo(() => {
    return (id, yjsDocMap) => {
      const doc = getSharedDoc();
      const provider = getSharedProvider();
      yjsDocMap.set(id, doc);
      return provider;
    };
  }, []);

  return (
    <LexicalComposer key={uniqueId} initialConfig={initialConfig}>
      <div className="editor-container border p-4 rounded shadow-sm">
        <CollaborationPlugin
          id="crousia-shared-room"
          providerFactory={providerFactory}
          shouldBootstrap={true}
        />
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input min-h-[200px] outline-none" />}
          placeholder={<div className="absolute top-4 left-4 text-gray-400 pointer-events-none">Start collaborating...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
    </LexicalComposer>
  );
}
