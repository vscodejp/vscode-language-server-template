import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate } from './helper';

suite('Should get diagnostics', () => {
	const docUri = getDocUri('diagnostics.txt');

	test('Diagnostics Hello World', async () => {
		const start = new vscode.Position(0, 0);
		const end = new vscode.Position(0, Number.MAX_VALUE);
		await testDiagnostics(docUri, [
			{
				message: 'Hello world',
				range: new vscode.Range(start, end),
				severity: vscode.DiagnosticSeverity.Warning,
				source: 'sample'
			}
		]);
	});
});

async function testDiagnostics(docUri: vscode.Uri, expectedDiagnostics: vscode.Diagnostic[]) {
	await activate(docUri);

	const actualDiagnostics = vscode.languages.getDiagnostics(docUri);

	assert.equal(actualDiagnostics.length, expectedDiagnostics.length);

	expectedDiagnostics.forEach((expectedDiagnostic, i) => {
		const actualDiagnostic = actualDiagnostics[i];
		assert.equal(actualDiagnostic.message, expectedDiagnostic.message);
		assert.deepEqual(actualDiagnostic.range, expectedDiagnostic.range);
		assert.equal(actualDiagnostic.severity, expectedDiagnostic.severity);
	});
}