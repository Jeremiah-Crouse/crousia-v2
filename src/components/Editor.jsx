// src/components/Editor.jsx
import React, { useMemo, useEffect, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS, $convertToMarkdownString } from "@lexical/markdown";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ParagraphNode, TextNode } from "lexical";
import { getSharedDoc, getSharedProvider, isAdmin } from "../utils/collaboration";

function AutoSavePlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    let timeout;
    const save = () => {
      editor.getEditorState().read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        fetch('/api/archive-today', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: markdown })
        }).catch(err => console.error("Save failed", err));
      });
    };
    return editor.registerUpdateListener(() => {
      clearTimeout(timeout);
      timeout = setTimeout(save, 2000);
    });
  }, [editor]);
  return null;
}

const USERNAMES = ['hedgehog', 'shark', 'otter', 'eagle', 'wolf', 'fox', 'bear', 'owl'];
const USERNAME = USERNAMES[Math.floor(Math.random() * USERNAMES.length)];

export default function Editor() {
  const readonly = !isAdmin();
  const [isSynced, setIsSynced] = useState(false);

  const doc = useMemo(() => getSharedDoc(), []);
  const provider = useMemo(() => {
    const p = getSharedProvider({ readonly, username: USERNAME });
    // Listen for sync event to trigger re-render
    p.on("sync", (synced) => { if (synced) setIsSynced(true); });
    return p;
  }, [readonly]);

  const providerFactory = (id, yjsDocMap) => {
    yjsDocMap.set(id, doc);
    return provider;
  };

  const initialConfig = {
    namespace: "CrousiaEditor",
    editable: !readonly,
    nodes: [ParagraphNode, TextNode, HeadingNode, QuoteNode, ListNode, ListItemNode, CodeNode, LinkNode],
    theme: { paragraph: "editor-paragraph" },
    onError(error) { console.error("Lexical error:", error); }
  };

  return (
    <div className="editor-container">
      {/* Don't use key={...} here. 
         Keep the editor mounted so the WebSocket connection remains stable. 
         Use opacity or display to hide until synced.
      */}
      <div style={{ opacity: isSynced ? 1 : 0, transition: 'opacity 0.3s' }}>
        <LexicalComposer initialConfig={initialConfig}>
          <CollaborationPlugin
            id="crousia-editor"
            providerFactory={providerFactory}
            username={USERNAME}
          />
          <AutoSavePlugin />
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<div>Loading content...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </LexicalComposer>
      </div>

      {/* Show a friendly loading indicator */}
      {!isSynced && (
        <div className="editor-placeholder">
          Loading content from archive...
        </div>
      )}
    </div>
  );
}