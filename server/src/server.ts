"use strict";

import {
    CodeActionKind,
    createConnection,
    Diagnostic,
    DiagnosticSeverity,
    Range,
    TextDocuments,
    TextDocumentSyncKind,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

namespace CommandIDs {
    export const fix = "sample.fix";
}
// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection();
connection.console.info(`Sample server running in node ${process.version}`);
let documents!: TextDocuments<TextDocument>;

connection.onInitialize(() => {
    documents = new TextDocuments(TextDocument);
    setupDocumentsListeners();

    return {
        capabilities: {
            textDocumentSync: {
                openClose: true,
                change: TextDocumentSyncKind.Incremental,
                willSaveWaitUntil: false,
                save: {
                    includeText: false,
                },
            },
            codeActionProvider: {
                codeActionKinds: [CodeActionKind.QuickFix],
            },
            executeCommandProvider: {
                commands: [CommandIDs.fix],
            },
        },
    };
});

/**
 * Analyzes the text document for problems.
 * @param doc text document to analyze
 */
function validate(doc: TextDocument) {
    const diagnostics: Diagnostic[] = [];
    const range: Range = {start: {line: 0, character: 0},
                          end: {line: 0, character: Number.MAX_VALUE}};
    diagnostics.push(Diagnostic.create(range, "Hello world", DiagnosticSeverity.Warning, "", "sample"));
    connection.sendDiagnostics({ uri: doc.uri, diagnostics });
}

function setupDocumentsListeners() {
    documents.listen(connection);

    documents.onDidOpen((event) => {
        validate(event.document);
    });

    documents.onDidChangeContent((change) => {
        validate(change.document);
    });

    documents.onDidClose((close) => {
        connection.sendDiagnostics({ uri: close.document.uri, diagnostics: []});
    });

}

// Listen on the connection
connection.listen();
