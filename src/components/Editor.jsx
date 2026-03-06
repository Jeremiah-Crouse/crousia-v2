import React, { useMemo } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { YjsPlugin } from '@lexical/yjs';

const DOC_NAME = 'crousia-content';

function isEditable() {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === 'admin.crousia.com';
}

export default function Editor({ key }) {
  const editable = isEditable();
  
  const { ydoc, provider } = useMemo(() => {
    const y = new Y.Doc();
    const p = new WebsocketProvider('ws://localhost:1234', DOC_NAME, y);
    return { ydoc: y, provider: p };
  }, []);

  const initialConfig = {
    namespace: 'Crousia',
    nodes: [
      HeadingNode, 
      QuoteNode, 
      ListNode, 
      ListItemNode, 
      CodeNode, 
      LinkNode, 
      AutoLinkNode
    ],
    onError: (e) => console.error(e),
    readOnly: !editable,
  };

  return (
    <LexicalComposer key={key} initialConfig={initialConfig}>
      <YjsPlugin provider={provider} doc={ydoc} />
      <RichTextPlugin
        contentEditable={<ContentEditable className="editor-input" />}
        placeholder={editable ? <div>Type...</div> : <div>View only</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
    </LexicalComposer>
  );
}