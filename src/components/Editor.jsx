import React, { useMemo } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';

import { getSharedDoc, getSharedProvider } from '../utils/collaboration';

const rawProvider = getSharedProvider();
const provider = new Proxy(rawProvider, {
  get(target, prop) {
    if (prop === 'disconnect') {
      return () => console.log('--- disconnect ignored ---');
    }
    return target[prop];
  }
});
const doc = getSharedDoc();

export default function Editor({ uniqueId }) {
  const initialConfig = useMemo(() => ({
    namespace: 'Crousia',
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode],
    onError: (e) => console.error('Lexical Error:', e),
  }), []);

  const providerFactory = useMemo(() => {
    return (id, yjsDocMap) => {
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
          shouldBootstrap={false}
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
